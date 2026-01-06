FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for torch
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the HuggingFace model during build
# This prevents downloading at runtime and speeds up container starts
RUN python -c "\
from transformers import AutoModelForSequenceClassification, AutoTokenizer, AutoConfig; \
model_name = 'cardiffnlp/twitter-roberta-base-sentiment-latest'; \
print(f'Downloading model: {model_name}'); \
AutoTokenizer.from_pretrained(model_name); \
AutoConfig.from_pretrained(model_name); \
AutoModelForSequenceClassification.from_pretrained(model_name); \
print('Model downloaded successfully')"

COPY app/ ./app/

# Environment variables
ENV PYTHONUNBUFFERED=1
ENV TRANSFORMERS_CACHE=/app/.cache
ENV HF_HOME=/app/.cache

EXPOSE 8002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8002/health')" || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8002"]
