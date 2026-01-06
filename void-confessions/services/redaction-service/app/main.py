"""
Void Confessions - Redaction Service

A FastAPI service for redacting PII from confessions using regex patterns
and spaCy NER for entity recognition.
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from enum import Enum
import re
import spacy
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load spaCy model
try:
    nlp = spacy.load("en_core_web_lg")
    logger.info("Loaded spaCy model: en_core_web_lg")
except OSError:
    logger.warning("en_core_web_lg not found, falling back to en_core_web_sm")
    try:
        nlp = spacy.load("en_core_web_sm")
        logger.info("Loaded spaCy model: en_core_web_sm")
    except OSError:
        logger.error("No spaCy model available, NER will be disabled")
        nlp = None

app = FastAPI(
    title="Void Confessions - Redaction Service",
    description="Service for redacting PII from confessions using regex and NER",
    version="0.1.0"
)


# ============================================================================
# Models
# ============================================================================

class EntityType(str, Enum):
    EMAIL = "email"
    PHONE = "phone"
    SSN = "ssn"
    CREDIT_CARD = "credit_card"
    IP_ADDRESS = "ip_address"
    ADDRESS = "address"
    PERSON = "person"
    ORGANIZATION = "organization"
    LOCATION = "location"
    DATE = "date"


class RedactedEntity(BaseModel):
    """Information about a redacted entity."""
    entity_type: str
    original_text: str
    replacement: str
    start_position: int
    end_position: int


class RedactionRequest(BaseModel):
    """Request model for redaction."""
    content: str = Field(..., min_length=1, max_length=10000)
    redact_emails: bool = True
    redact_phones: bool = True
    redact_names: bool = True
    redact_addresses: bool = True
    redact_organizations: bool = True
    redact_locations: bool = True


class RedactionResponse(BaseModel):
    """Response model for redaction."""
    original_content: str
    redacted_content: str
    redactions_made: int
    redaction_types: list[str]
    has_crisis_indicators: bool
    crisis_keywords_found: list[str]
    redacted_entities: list[RedactedEntity]


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    timestamp: str
    service: str
    spacy_model: Optional[str] = None


class AnalyzeResponse(BaseModel):
    """Analysis response without redaction."""
    has_pii: bool
    has_crisis_indicators: bool
    crisis_keywords_found: list[str]
    findings: list[dict]


# ============================================================================
# Regex Patterns for PII Detection
# ============================================================================

PATTERNS = {
    "email": {
        "pattern": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
        "replacement": "[EMAIL]",
    },
    "phone": {
        "pattern": r"\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b",
        "replacement": "[PHONE]",
    },
    "ssn": {
        "pattern": r"\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b",
        "replacement": "[SSN]",
    },
    "credit_card": {
        "pattern": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
        "replacement": "[CARD]",
    },
    "ip_address": {
        "pattern": r"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b",
        "replacement": "[IP]",
    },
    "street_address": {
        "pattern": r"\b\d{1,5}\s+(?:[A-Za-z]+\s+){1,4}(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Court|Ct|Way|Place|Pl|Circle|Cir)\.?\b",
        "replacement": "[ADDRESS]",
    },
    "zip_code": {
        "pattern": r"\b\d{5}(?:-\d{4})?\b",
        "replacement": "[ZIP]",
    },
}


# ============================================================================
# Crisis Detection Keywords
# ============================================================================

# High-severity crisis indicators
CRISIS_PATTERNS = [
    # Suicide-related
    r"\b(want(ing)?|going|plan(ning)?|ready|decided)\s+to\s+(kill|end|hurt)\s+(myself|my\s+life|it\s+all)\b",
    r"\bsuicid(e|al)\b",
    r"\b(don'?t|can'?t)\s+want\s+to\s+(live|be\s+here|exist|go\s+on)\s*(anymore|any\s+longer)?\b",
    r"\b(ending?|end)\s+(it|my\s+life|everything|this)\b",
    r"\bkill(ing)?\s+myself\b",
    r"\bwish\s+i\s+(was|were)\s+dead\b",
    r"\bwish\s+i\s+(wasn'?t|weren'?t)\s+(alive|here|born)\b",
    r"\bno\s+(reason|point)\s+(to|in)\s+(living|life|going\s+on)\b",
    r"\b(better\s+off|world.{0,20}better)\s+(without\s+me|if\s+i.{0,10}(gone|dead|died))\b",
    # Self-harm related
    r"\bself[- ]?harm\b",
    r"\bcutting\s+(myself|my\s+wrists?|my\s+arms?)\b",
    r"\bhurt(ing)?\s+myself\b",
    # Hopelessness
    r"\bhopeless\b",
    r"\bno\s+hope\b",
    r"\bno\s+way\s+out\b",
    r"\b(give|giving|given)\s+up\b",
    r"\bcan'?t\s+(take|handle|do)\s+(it|this)\s+(anymore|any\s+more)\b",
]

# Compile patterns for efficiency
COMPILED_CRISIS_PATTERNS = [re.compile(p, re.IGNORECASE) for p in CRISIS_PATTERNS]


# ============================================================================
# NER Entity Mapping
# ============================================================================

# Map spaCy entity labels to our replacements
NER_ENTITY_MAP = {
    "PERSON": "[SOMEONE]",
    "ORG": "[COMPANY]",
    "GPE": "[PLACE]",  # Geopolitical entities (cities, states, countries)
    "LOC": "[LOCATION]",  # Non-GPE locations
    "FAC": "[FACILITY]",  # Buildings, airports, highways, etc.
}

# Small towns and specific locations that should be redacted
# GPE entities with population hints or that seem like small towns
SMALL_TOWN_INDICATORS = [
    "village", "town", "township", "hamlet", "borough", "parish"
]


# ============================================================================
# Redaction Functions
# ============================================================================

def detect_crisis_indicators(content: str) -> tuple[bool, list[str]]:
    """
    Detect crisis indicators in the content.

    Returns:
        Tuple of (has_crisis_indicators, list of matched keywords)
    """
    found_keywords = []

    for pattern in COMPILED_CRISIS_PATTERNS:
        matches = pattern.findall(content)
        if matches:
            # Extract the matched text
            for match in pattern.finditer(content):
                found_keywords.append(match.group())

    # Deduplicate while preserving order
    seen = set()
    unique_keywords = []
    for kw in found_keywords:
        kw_lower = kw.lower()
        if kw_lower not in seen:
            seen.add(kw_lower)
            unique_keywords.append(kw)

    return len(unique_keywords) > 0, unique_keywords


def redact_with_regex(
    content: str,
    request: RedactionRequest
) -> tuple[str, list[RedactedEntity], list[str]]:
    """
    Redact PII using regex patterns.

    Returns:
        Tuple of (redacted_content, redacted_entities, redaction_types)
    """
    redacted = content
    entities = []
    types_found = set()

    # Track offset changes due to replacements
    offset = 0

    patterns_to_check = []

    if request.redact_emails:
        patterns_to_check.append(("email", PATTERNS["email"]))
    if request.redact_phones:
        patterns_to_check.append(("phone", PATTERNS["phone"]))
    if request.redact_addresses:
        patterns_to_check.append(("street_address", PATTERNS["street_address"]))
        patterns_to_check.append(("zip_code", PATTERNS["zip_code"]))

    # Always check these for safety
    patterns_to_check.extend([
        ("ssn", PATTERNS["ssn"]),
        ("credit_card", PATTERNS["credit_card"]),
        ("ip_address", PATTERNS["ip_address"]),
    ])

    for pattern_name, pattern_info in patterns_to_check:
        pattern = pattern_info["pattern"]
        replacement = pattern_info["replacement"]

        for match in re.finditer(pattern, content):
            original_text = match.group()
            start = match.start()
            end = match.end()

            entities.append(RedactedEntity(
                entity_type=pattern_name,
                original_text=original_text,
                replacement=replacement,
                start_position=start,
                end_position=end
            ))
            types_found.add(pattern_name)

        # Apply replacement
        redacted = re.sub(pattern, replacement, redacted)

    return redacted, entities, list(types_found)


def redact_with_ner(
    content: str,
    request: RedactionRequest,
    already_redacted_positions: set[tuple[int, int]]
) -> tuple[str, list[RedactedEntity], list[str]]:
    """
    Redact entities using spaCy NER.

    Returns:
        Tuple of (redacted_content, redacted_entities, redaction_types)
    """
    if nlp is None:
        return content, [], []

    doc = nlp(content)
    entities = []
    types_found = set()

    # Collect entities to replace (process in reverse to maintain positions)
    replacements = []

    for ent in doc.ents:
        # Skip if this position was already redacted by regex
        if any(start <= ent.start_char < end or start < ent.end_char <= end
               for start, end in already_redacted_positions):
            continue

        replacement = None
        entity_type = None

        if ent.label_ == "PERSON" and request.redact_names:
            replacement = "[SOMEONE]"
            entity_type = "person"
        elif ent.label_ == "ORG" and request.redact_organizations:
            replacement = "[COMPANY]"
            entity_type = "organization"
        elif ent.label_ in ("GPE", "LOC", "FAC") and request.redact_locations:
            # Check if it's a small town or specific location
            text_lower = ent.text.lower()

            # Always redact specific locations for privacy
            if ent.label_ == "GPE":
                replacement = "[TOWN]"
                entity_type = "location"
            elif ent.label_ == "LOC":
                replacement = "[LOCATION]"
                entity_type = "location"
            elif ent.label_ == "FAC":
                replacement = "[PLACE]"
                entity_type = "facility"

        if replacement:
            replacements.append({
                "start": ent.start_char,
                "end": ent.end_char,
                "original": ent.text,
                "replacement": replacement,
                "type": entity_type
            })
            types_found.add(entity_type)

            entities.append(RedactedEntity(
                entity_type=entity_type,
                original_text=ent.text,
                replacement=replacement,
                start_position=ent.start_char,
                end_position=ent.end_char
            ))

    # Sort replacements by position (reverse order to maintain indices)
    replacements.sort(key=lambda x: x["start"], reverse=True)

    # Apply replacements
    redacted = content
    for rep in replacements:
        redacted = redacted[:rep["start"]] + rep["replacement"] + redacted[rep["end"]:]

    return redacted, entities, list(types_found)


def redact_content(content: str, request: RedactionRequest) -> RedactionResponse:
    """
    Main redaction function that combines regex and NER.
    """
    # Step 1: Detect crisis indicators (before any redaction)
    has_crisis, crisis_keywords = detect_crisis_indicators(content)

    # Step 2: Apply regex-based redaction
    regex_redacted, regex_entities, regex_types = redact_with_regex(content, request)

    # Track positions that were redacted by regex
    redacted_positions = set()
    for entity in regex_entities:
        redacted_positions.add((entity.start_position, entity.end_position))

    # Step 3: Apply NER-based redaction on regex-redacted content
    # Note: We need to run NER on original content to get correct positions,
    # then apply to the regex-redacted version
    _, ner_entities, ner_types = redact_with_ner(content, request, redacted_positions)

    # Apply NER replacements to regex-redacted content
    # We need to recalculate positions since regex may have changed lengths
    final_content = regex_redacted
    if nlp is not None and ner_entities:
        doc = nlp(regex_redacted)
        replacements = []

        for ent in doc.ents:
            replacement = None
            entity_type = None

            if ent.label_ == "PERSON" and request.redact_names:
                replacement = "[SOMEONE]"
                entity_type = "person"
            elif ent.label_ == "ORG" and request.redact_organizations:
                replacement = "[COMPANY]"
                entity_type = "organization"
            elif ent.label_ in ("GPE", "LOC", "FAC") and request.redact_locations:
                if ent.label_ == "GPE":
                    replacement = "[TOWN]"
                elif ent.label_ == "LOC":
                    replacement = "[LOCATION]"
                else:
                    replacement = "[PLACE]"
                entity_type = "location"

            if replacement:
                replacements.append({
                    "start": ent.start_char,
                    "end": ent.end_char,
                    "replacement": replacement
                })

        # Sort and apply
        replacements.sort(key=lambda x: x["start"], reverse=True)
        for rep in replacements:
            final_content = final_content[:rep["start"]] + rep["replacement"] + final_content[rep["end"]:]

    # Combine results
    all_entities = regex_entities + ner_entities
    all_types = list(set(regex_types + ner_types))

    return RedactionResponse(
        original_content=content,
        redacted_content=final_content,
        redactions_made=len(all_entities),
        redaction_types=all_types,
        has_crisis_indicators=has_crisis,
        crisis_keywords_found=crisis_keywords,
        redacted_entities=all_entities
    )


# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    model_name = None
    if nlp is not None:
        model_name = nlp.meta.get("name", "unknown")

    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        service="redaction-service",
        spacy_model=model_name
    )


@app.post("/redact", response_model=RedactionResponse)
async def redact_pii(request: RedactionRequest):
    """
    Redact PII from the provided content.

    Uses both regex patterns and spaCy NER for comprehensive redaction:
    - Regex: emails, phones, SSNs, credit cards, IPs, addresses
    - NER: person names → [SOMEONE], organizations → [COMPANY], locations → [TOWN]

    Also checks for crisis indicators and returns them in the response.
    """
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required")

    try:
        response = redact_content(request.content, request)
        return response
    except Exception as e:
        logger.error(f"Error during redaction: {e}")
        raise HTTPException(status_code=500, detail="Internal server error during redaction")


@app.post("/analyze", response_model=AnalyzeResponse)
async def analyze_content(request: RedactionRequest):
    """
    Analyze content for PII and crisis indicators without redacting.

    Useful for checking what would be redacted before actually redacting.
    """
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required")

    findings = []

    # Check regex patterns
    for pattern_name, pattern_info in PATTERNS.items():
        matches = list(re.finditer(pattern_info["pattern"], request.content))
        if matches:
            findings.append({
                "type": pattern_name,
                "count": len(matches),
                "positions": [{"start": m.start(), "end": m.end()} for m in matches]
            })

    # Check NER entities
    if nlp is not None:
        doc = nlp(request.content)
        ner_findings = {}

        for ent in doc.ents:
            if ent.label_ in NER_ENTITY_MAP:
                if ent.label_ not in ner_findings:
                    ner_findings[ent.label_] = {
                        "type": f"ner_{ent.label_.lower()}",
                        "count": 0,
                        "entities": []
                    }
                ner_findings[ent.label_]["count"] += 1
                ner_findings[ent.label_]["entities"].append({
                    "text": ent.text,
                    "start": ent.start_char,
                    "end": ent.end_char
                })

        findings.extend(ner_findings.values())

    # Check crisis indicators
    has_crisis, crisis_keywords = detect_crisis_indicators(request.content)

    return AnalyzeResponse(
        has_pii=len(findings) > 0,
        has_crisis_indicators=has_crisis,
        crisis_keywords_found=crisis_keywords,
        findings=findings
    )


@app.get("/crisis-patterns")
async def get_crisis_patterns():
    """
    Get the list of crisis patterns being checked.

    Useful for transparency about what triggers crisis detection.
    """
    return {
        "patterns": CRISIS_PATTERNS,
        "description": "These patterns are checked to identify potential crisis situations. "
                      "If detected, crisis resources are provided to the user."
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
