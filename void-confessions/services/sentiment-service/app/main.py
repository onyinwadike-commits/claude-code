from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from enum import Enum

app = FastAPI(
    title="Void Confessions - Sentiment Service",
    description="Service for analyzing sentiment of confessions",
    version="0.0.1"
)


class SentimentType(str, Enum):
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"
    MIXED = "mixed"


class SentimentRequest(BaseModel):
    content: str


class SentimentResponse(BaseModel):
    sentiment: SentimentType
    score: float
    confidence: float
    breakdown: dict


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str


# Simple word-based sentiment analysis
POSITIVE_WORDS = {
    "happy", "love", "great", "good", "wonderful", "amazing", "joy", "excited",
    "grateful", "blessed", "proud", "hope", "kind", "beautiful", "awesome",
    "fantastic", "perfect", "lovely", "excellent", "best", "glad", "fun"
}

NEGATIVE_WORDS = {
    "sad", "hate", "bad", "terrible", "awful", "angry", "fear", "worried",
    "regret", "guilty", "ashamed", "sorry", "hurt", "pain", "lonely", "lost",
    "horrible", "worst", "hate", "afraid", "anxious", "depressed", "miserable"
}


def analyze_sentiment(content: str) -> tuple[SentimentType, float, float, dict]:
    """Analyze sentiment of the given content."""
    words = content.lower().split()
    total_words = len(words)

    if total_words == 0:
        return SentimentType.NEUTRAL, 0.0, 0.0, {}

    positive_count = sum(1 for word in words if word.strip(".,!?") in POSITIVE_WORDS)
    negative_count = sum(1 for word in words if word.strip(".,!?") in NEGATIVE_WORDS)

    positive_ratio = positive_count / total_words
    negative_ratio = negative_count / total_words

    # Calculate sentiment score (-1 to 1)
    score = (positive_ratio - negative_ratio) * 5  # Scale up for visibility
    score = max(-1.0, min(1.0, score))  # Clamp to [-1, 1]

    # Determine sentiment type
    if positive_count > 0 and negative_count > 0:
        if abs(positive_count - negative_count) <= 1:
            sentiment = SentimentType.MIXED
        elif positive_count > negative_count:
            sentiment = SentimentType.POSITIVE
        else:
            sentiment = SentimentType.NEGATIVE
    elif positive_count > 0:
        sentiment = SentimentType.POSITIVE
    elif negative_count > 0:
        sentiment = SentimentType.NEGATIVE
    else:
        sentiment = SentimentType.NEUTRAL

    # Calculate confidence based on how many sentiment words we found
    sentiment_word_ratio = (positive_count + negative_count) / total_words
    confidence = min(1.0, sentiment_word_ratio * 3)  # Scale up

    breakdown = {
        "positive_words": positive_count,
        "negative_words": negative_count,
        "total_words": total_words,
        "positive_ratio": round(positive_ratio, 4),
        "negative_ratio": round(negative_ratio, 4)
    }

    return sentiment, round(score, 4), round(confidence, 4), breakdown


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        service="sentiment-service"
    )


@app.post("/analyze", response_model=SentimentResponse)
async def analyze(request: SentimentRequest):
    """Analyze the sentiment of the provided content."""
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required")

    sentiment, score, confidence, breakdown = analyze_sentiment(request.content)

    return SentimentResponse(
        sentiment=sentiment,
        score=score,
        confidence=confidence,
        breakdown=breakdown
    )


@app.post("/batch")
async def analyze_batch(requests: list[SentimentRequest]):
    """Analyze sentiment for multiple contents."""
    results = []
    for req in requests:
        if req.content:
            sentiment, score, confidence, breakdown = analyze_sentiment(req.content)
            results.append({
                "sentiment": sentiment,
                "score": score,
                "confidence": confidence,
                "breakdown": breakdown
            })
    return {"results": results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8002)
