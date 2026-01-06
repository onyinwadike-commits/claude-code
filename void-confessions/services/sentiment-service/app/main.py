"""
Void Confessions - Sentiment Service

A FastAPI service for analyzing sentiment using HuggingFace transformers
and mapping aggregate sentiment to void weather states.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timedelta
from typing import Optional
from enum import Enum
import asyncio
import json
import logging
import os

import redis.asyncio as redis
from transformers import AutoModelForSequenceClassification, AutoTokenizer, AutoConfig
import torch
from scipy.special import softmax
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ============================================================================
# Model Loading
# ============================================================================

MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
FALLBACK_MODEL = "cardiffnlp/twitter-roberta-base-sentiment"

# Load model and tokenizer
try:
    logger.info(f"Loading sentiment model: {MODEL_NAME}")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    config = AutoConfig.from_pretrained(MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_NAME)
    model.eval()  # Set to evaluation mode
    logger.info("Sentiment model loaded successfully")
except Exception as e:
    logger.warning(f"Failed to load {MODEL_NAME}, trying fallback: {e}")
    try:
        tokenizer = AutoTokenizer.from_pretrained(FALLBACK_MODEL)
        config = AutoConfig.from_pretrained(FALLBACK_MODEL)
        model = AutoModelForSequenceClassification.from_pretrained(FALLBACK_MODEL)
        model.eval()
        logger.info(f"Fallback model {FALLBACK_MODEL} loaded successfully")
    except Exception as e2:
        logger.error(f"Failed to load any model: {e2}")
        tokenizer = None
        config = None
        model = None

# Label mapping for the model
LABEL_MAP = {
    0: "negative",
    1: "neutral",
    2: "positive"
}

app = FastAPI(
    title="Void Confessions - Sentiment Service",
    description="Sentiment analysis with weather state mapping using HuggingFace transformers",
    version="0.2.0"
)


# ============================================================================
# Redis Configuration
# ============================================================================

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client: Optional[redis.Redis] = None

# Redis key patterns
KEYS = {
    "sentiment_window": lambda void_type: f"sentiment:window:{void_type}",
    "weather_state": lambda void_type: f"weather:state:{void_type}",
    "weather_history": lambda void_type: f"weather:history:{void_type}",
}

# Pub/sub channels
CHANNELS = {
    "weather_update": lambda void_type: f"channel:weather:{void_type}",
}


async def get_redis() -> redis.Redis:
    """Get or create Redis connection."""
    global redis_client
    if redis_client is None:
        redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    return redis_client


# ============================================================================
# Models
# ============================================================================

class VoidType(str, Enum):
    GRIEF = "grief"
    RAGE = "rage"
    GUILT = "guilt"
    LONGING = "longing"
    RELIEF = "relief"


class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


class WeatherState(str, Enum):
    CALM = "calm"
    SERENE = "serene"
    CLEARING = "clearing"
    HEAVY = "heavy"
    TURBULENT = "turbulent"
    STORMY = "stormy"
    HOPE = "hope"
    ANGER = "anger"


class SentimentRequest(BaseModel):
    """Request model for sentiment analysis."""
    content: str = Field(..., min_length=1, max_length=5000)
    void_type: Optional[VoidType] = None
    confession_id: Optional[str] = None


class SentimentScores(BaseModel):
    """Breakdown of sentiment scores."""
    negative: float
    neutral: float
    positive: float


class SentimentResponse(BaseModel):
    """Response model for sentiment analysis."""
    sentiment: SentimentType
    score: float  # -1 to 1, where -1 is most negative, 1 is most positive
    confidence: float  # 0 to 1
    scores: SentimentScores
    weather_updated: bool = False
    current_weather: Optional[WeatherState] = None


class WeatherResponse(BaseModel):
    """Response model for weather state."""
    void_type: VoidType
    weather_state: WeatherState
    intensity: float
    sentiment_aggregate: float
    sample_count: int
    last_updated: str


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: str
    service: str
    model_loaded: bool
    redis_connected: bool


# ============================================================================
# Sentiment Analysis
# ============================================================================

def preprocess_text(text: str) -> str:
    """Preprocess text for the model."""
    # Basic preprocessing
    text = text.strip()
    # Handle mentions and URLs (common in social media style text)
    words = []
    for word in text.split():
        if word.startswith("@"):
            words.append("@user")
        elif word.startswith("http"):
            words.append("http")
        else:
            words.append(word)
    return " ".join(words)


def analyze_sentiment_ml(content: str) -> tuple[SentimentType, float, float, SentimentScores]:
    """
    Analyze sentiment using the HuggingFace model.

    Returns:
        Tuple of (sentiment_type, score, confidence, scores_breakdown)
    """
    if model is None or tokenizer is None:
        # Fallback to neutral if model not loaded
        return SentimentType.NEUTRAL, 0.0, 0.0, SentimentScores(negative=0.33, neutral=0.34, positive=0.33)

    # Preprocess
    text = preprocess_text(content)

    # Tokenize
    encoded = tokenizer(text, return_tensors="pt", truncation=True, max_length=512)

    # Get predictions
    with torch.no_grad():
        output = model(**encoded)
        scores = output.logits[0].detach().numpy()
        scores = softmax(scores)

    # Map scores to labels
    scores_dict = SentimentScores(
        negative=float(scores[0]),
        neutral=float(scores[1]),
        positive=float(scores[2])
    )

    # Determine sentiment type
    max_idx = np.argmax(scores)
    sentiment = SentimentType(LABEL_MAP[max_idx])

    # Calculate composite score (-1 to 1)
    # Weighted by positive - negative
    composite_score = float(scores[2] - scores[0])

    # Confidence is the max probability
    confidence = float(np.max(scores))

    return sentiment, round(composite_score, 4), round(confidence, 4), scores_dict


# ============================================================================
# Rolling Window & Weather Mapping
# ============================================================================

WINDOW_DURATION_MINUTES = 15
SIGNIFICANT_CHANGE_THRESHOLD = 0.15  # 15% change triggers weather update


async def add_to_sentiment_window(
    void_type: VoidType,
    score: float,
    timestamp: Optional[datetime] = None
) -> None:
    """Add a sentiment score to the rolling window for a void type."""
    r = await get_redis()
    key = KEYS["sentiment_window"](void_type.value)

    ts = timestamp or datetime.utcnow()
    entry = json.dumps({
        "score": score,
        "timestamp": ts.isoformat()
    })

    # Add to sorted set with timestamp as score for ordering
    await r.zadd(key, {entry: ts.timestamp()})

    # Remove entries older than window duration
    cutoff = (ts - timedelta(minutes=WINDOW_DURATION_MINUTES)).timestamp()
    await r.zremrangebyscore(key, "-inf", cutoff)


async def get_weighted_aggregate(void_type: VoidType) -> tuple[float, int]:
    """
    Calculate weighted aggregate sentiment for a void type.
    More recent sentiments have higher weight.

    Returns:
        Tuple of (weighted_average, sample_count)
    """
    r = await get_redis()
    key = KEYS["sentiment_window"](void_type.value)

    # Get all entries in the window
    entries = await r.zrange(key, 0, -1, withscores=True)

    if not entries:
        return 0.0, 0

    now = datetime.utcnow().timestamp()
    window_seconds = WINDOW_DURATION_MINUTES * 60

    weighted_sum = 0.0
    weight_total = 0.0

    for entry_json, ts in entries:
        entry = json.loads(entry_json)
        score = entry["score"]

        # Calculate weight based on recency (1.0 for most recent, decaying to 0.5 for oldest)
        age_seconds = now - ts
        recency_weight = 1.0 - (age_seconds / window_seconds) * 0.5
        recency_weight = max(0.5, min(1.0, recency_weight))

        weighted_sum += score * recency_weight
        weight_total += recency_weight

    weighted_average = weighted_sum / weight_total if weight_total > 0 else 0.0
    return round(weighted_average, 4), len(entries)


def map_sentiment_to_weather(
    aggregate_score: float,
    void_type: VoidType
) -> tuple[WeatherState, float]:
    """
    Map aggregate sentiment score to weather state.

    Args:
        aggregate_score: -1 to 1 sentiment score
        void_type: The void type for context-specific mapping

    Returns:
        Tuple of (weather_state, intensity)
    """
    # Base mapping thresholds
    # Score ranges: [-1, -0.5) = very negative, [-0.5, -0.2) = negative,
    #               [-0.2, 0.2] = neutral, (0.2, 0.5] = positive, (0.5, 1] = very positive

    intensity = abs(aggregate_score)

    if aggregate_score <= -0.5:
        # Very negative
        if void_type == VoidType.RAGE:
            return WeatherState.ANGER, min(1.0, intensity * 1.2)
        else:
            return WeatherState.STORMY, min(1.0, intensity * 1.1)

    elif aggregate_score <= -0.2:
        # Negative
        if void_type == VoidType.RAGE:
            return WeatherState.TURBULENT, intensity
        else:
            return WeatherState.HEAVY, intensity

    elif aggregate_score <= 0.2:
        # Neutral
        if void_type == VoidType.RELIEF:
            return WeatherState.CLEARING, 0.4
        else:
            return WeatherState.CALM, 0.3

    elif aggregate_score <= 0.5:
        # Positive
        if void_type == VoidType.RELIEF:
            return WeatherState.SERENE, intensity
        else:
            return WeatherState.CLEARING, intensity

    else:
        # Very positive
        return WeatherState.HOPE, min(1.0, intensity * 1.2)


async def update_weather_if_significant(
    void_type: VoidType,
    new_aggregate: float,
    sample_count: int
) -> tuple[bool, WeatherState, float]:
    """
    Update weather state if there's a significant change.

    Returns:
        Tuple of (was_updated, weather_state, intensity)
    """
    r = await get_redis()
    weather_key = KEYS["weather_state"](void_type.value)

    # Get current weather state
    current_data = await r.get(weather_key)

    new_weather, new_intensity = map_sentiment_to_weather(new_aggregate, void_type)

    should_update = False

    if current_data is None:
        # No existing weather, always update
        should_update = True
    else:
        current = json.loads(current_data)
        old_aggregate = current.get("sentiment_aggregate", 0.0)
        old_weather = current.get("weather_state")

        # Check if change is significant
        change = abs(new_aggregate - old_aggregate)
        if change >= SIGNIFICANT_CHANGE_THRESHOLD:
            should_update = True
        elif new_weather != old_weather:
            # Weather state changed even without threshold
            should_update = True

    if should_update:
        # Update weather state
        weather_data = {
            "weather_state": new_weather.value,
            "intensity": new_intensity,
            "sentiment_aggregate": new_aggregate,
            "sample_count": sample_count,
            "updated_at": datetime.utcnow().isoformat()
        }
        await r.set(weather_key, json.dumps(weather_data))

        # Add to history
        history_key = KEYS["weather_history"](void_type.value)
        await r.lpush(history_key, json.dumps(weather_data))
        await r.ltrim(history_key, 0, 99)  # Keep last 100 entries

        # Publish weather update
        channel = CHANNELS["weather_update"](void_type.value)
        await r.publish(channel, json.dumps({
            "type": "weather:update",
            "void_type": void_type.value,
            "weather_state": new_weather.value,
            "intensity": new_intensity,
            "sentiment_aggregate": new_aggregate,
            "timestamp": datetime.utcnow().isoformat()
        }))

        logger.info(f"Weather updated for {void_type.value}: {new_weather.value} (intensity: {new_intensity:.2f})")

    return should_update, new_weather, new_intensity


async def get_current_weather(void_type: VoidType) -> Optional[dict]:
    """Get current weather state for a void type."""
    r = await get_redis()
    weather_key = KEYS["weather_state"](void_type.value)
    data = await r.get(weather_key)
    if data:
        return json.loads(data)
    return None


# ============================================================================
# API Endpoints
# ============================================================================

@app.on_event("startup")
async def startup():
    """Initialize connections on startup."""
    try:
        r = await get_redis()
        await r.ping()
        logger.info("Redis connected successfully")
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")


@app.on_event("shutdown")
async def shutdown():
    """Close connections on shutdown."""
    global redis_client
    if redis_client:
        await redis_client.close()


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    redis_ok = False
    try:
        r = await get_redis()
        await r.ping()
        redis_ok = True
    except Exception:
        pass

    return HealthResponse(
        status="healthy" if model is not None and redis_ok else "degraded",
        timestamp=datetime.utcnow().isoformat(),
        service="sentiment-service",
        model_loaded=model is not None,
        redis_connected=redis_ok
    )


@app.post("/analyze", response_model=SentimentResponse)
async def analyze(request: SentimentRequest):
    """
    Analyze the sentiment of the provided content.

    If void_type is provided, adds to rolling window and may trigger weather update.
    """
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required")

    # Analyze sentiment
    sentiment, score, confidence, scores = analyze_sentiment_ml(request.content)

    weather_updated = False
    current_weather = None

    # If void_type provided, update rolling window and potentially weather
    if request.void_type:
        try:
            # Add to rolling window
            await add_to_sentiment_window(request.void_type, score)

            # Calculate new aggregate
            aggregate, sample_count = await get_weighted_aggregate(request.void_type)

            # Update weather if significant change
            weather_updated, weather_state, _ = await update_weather_if_significant(
                request.void_type, aggregate, sample_count
            )
            current_weather = weather_state

        except Exception as e:
            logger.error(f"Error updating sentiment window: {e}")

    return SentimentResponse(
        sentiment=sentiment,
        score=score,
        confidence=confidence,
        scores=scores,
        weather_updated=weather_updated,
        current_weather=current_weather
    )


@app.get("/weather/{void_type}", response_model=WeatherResponse)
async def get_weather(void_type: VoidType):
    """Get current weather state for a void type."""
    weather_data = await get_current_weather(void_type)

    if weather_data is None:
        # Return default calm weather if no data
        return WeatherResponse(
            void_type=void_type,
            weather_state=WeatherState.CALM,
            intensity=0.3,
            sentiment_aggregate=0.0,
            sample_count=0,
            last_updated=datetime.utcnow().isoformat()
        )

    return WeatherResponse(
        void_type=void_type,
        weather_state=WeatherState(weather_data["weather_state"]),
        intensity=weather_data["intensity"],
        sentiment_aggregate=weather_data["sentiment_aggregate"],
        sample_count=weather_data["sample_count"],
        last_updated=weather_data["updated_at"]
    )


@app.get("/weather")
async def get_all_weather():
    """Get weather states for all void types."""
    results = {}
    for void_type in VoidType:
        weather_data = await get_current_weather(void_type)
        if weather_data:
            results[void_type.value] = weather_data
        else:
            results[void_type.value] = {
                "weather_state": WeatherState.CALM.value,
                "intensity": 0.3,
                "sentiment_aggregate": 0.0,
                "sample_count": 0
            }
    return results


@app.post("/batch")
async def analyze_batch(requests: list[SentimentRequest]):
    """Analyze sentiment for multiple contents."""
    results = []
    for req in requests:
        if req.content:
            sentiment, score, confidence, scores = analyze_sentiment_ml(req.content)
            results.append({
                "sentiment": sentiment,
                "score": score,
                "confidence": confidence,
                "scores": scores.model_dump()
            })
    return {"results": results}


@app.get("/window/{void_type}")
async def get_sentiment_window(void_type: VoidType):
    """Get the current sentiment window data for a void type (for debugging)."""
    aggregate, sample_count = await get_weighted_aggregate(void_type)

    r = await get_redis()
    key = KEYS["sentiment_window"](void_type.value)
    entries = await r.zrange(key, 0, -1, withscores=True)

    samples = []
    for entry_json, ts in entries:
        entry = json.loads(entry_json)
        samples.append({
            "score": entry["score"],
            "timestamp": entry["timestamp"],
            "unix_ts": ts
        })

    return {
        "void_type": void_type.value,
        "window_minutes": WINDOW_DURATION_MINUTES,
        "aggregate": aggregate,
        "sample_count": sample_count,
        "samples": samples
    }


@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model."""
    if model is None:
        return {"status": "not_loaded", "error": "Model failed to load"}

    return {
        "status": "loaded",
        "model_name": MODEL_NAME,
        "labels": LABEL_MAP,
        "max_length": 512
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
