from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
import re

app = FastAPI(
    title="Void Confessions - Redaction Service",
    description="Service for redacting PII from confessions",
    version="0.0.1"
)


class RedactionRequest(BaseModel):
    content: str
    redact_emails: bool = True
    redact_phones: bool = True
    redact_names: bool = True
    redact_addresses: bool = True


class RedactionResponse(BaseModel):
    original_content: str
    redacted_content: str
    redactions_made: int
    redaction_types: list[str]


class HealthResponse(BaseModel):
    status: str
    timestamp: str
    service: str


# Common patterns for PII detection
PATTERNS = {
    "email": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
    "phone": r"\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b",
    "ssn": r"\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b",
    "credit_card": r"\b(?:\d{4}[-\s]?){3}\d{4}\b",
}


def redact_content(content: str, request: RedactionRequest) -> tuple[str, int, list[str]]:
    """Redact PII from content based on request parameters."""
    redacted = content
    total_redactions = 0
    redaction_types = []

    if request.redact_emails:
        matches = re.findall(PATTERNS["email"], redacted)
        if matches:
            redacted = re.sub(PATTERNS["email"], "[EMAIL REDACTED]", redacted)
            total_redactions += len(matches)
            redaction_types.append("email")

    if request.redact_phones:
        matches = re.findall(PATTERNS["phone"], redacted)
        if matches:
            redacted = re.sub(PATTERNS["phone"], "[PHONE REDACTED]", redacted)
            total_redactions += len(matches)
            redaction_types.append("phone")

    # Always redact SSN and credit cards for safety
    ssn_matches = re.findall(PATTERNS["ssn"], redacted)
    if ssn_matches:
        redacted = re.sub(PATTERNS["ssn"], "[SSN REDACTED]", redacted)
        total_redactions += len(ssn_matches)
        redaction_types.append("ssn")

    cc_matches = re.findall(PATTERNS["credit_card"], redacted)
    if cc_matches:
        redacted = re.sub(PATTERNS["credit_card"], "[CARD REDACTED]", redacted)
        total_redactions += len(cc_matches)
        redaction_types.append("credit_card")

    return redacted, total_redactions, redaction_types


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        service="redaction-service"
    )


@app.post("/redact", response_model=RedactionResponse)
async def redact_pii(request: RedactionRequest):
    """Redact PII from the provided content."""
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required")

    redacted_content, redactions_made, redaction_types = redact_content(
        request.content, request
    )

    return RedactionResponse(
        original_content=request.content,
        redacted_content=redacted_content,
        redactions_made=redactions_made,
        redaction_types=redaction_types
    )


@app.post("/analyze")
async def analyze_content(request: RedactionRequest):
    """Analyze content for PII without redacting."""
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required")

    findings = []

    for pii_type, pattern in PATTERNS.items():
        matches = re.findall(pattern, request.content)
        if matches:
            findings.append({
                "type": pii_type,
                "count": len(matches),
                "positions": [m.start() for m in re.finditer(pattern, request.content)]
            })

    return {
        "has_pii": len(findings) > 0,
        "findings": findings
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
