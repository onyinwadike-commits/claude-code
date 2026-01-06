-- Void Confessions - Metrics Database Schema
-- This database stores only metrics and analytics, NOT confessions (which are ephemeral in Redis)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Service Health Metrics
-- =============================================================================

CREATE TABLE IF NOT EXISTS service_health_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    details JSONB,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_service_health_service ON service_health_logs(service_name);
CREATE INDEX idx_service_health_recorded_at ON service_health_logs(recorded_at);

-- =============================================================================
-- Void Activity Metrics (Aggregated, No PII)
-- =============================================================================

CREATE TABLE IF NOT EXISTS void_activity_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    void_type VARCHAR(20) NOT NULL,
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    confession_count INTEGER DEFAULT 0,
    resonance_total INTEGER DEFAULT 0,
    echo_total INTEGER DEFAULT 0,
    avg_sentiment DECIMAL(5,4),
    weather_state VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(void_type, hour_start)
);

CREATE INDEX idx_void_activity_type ON void_activity_hourly(void_type);
CREATE INDEX idx_void_activity_hour ON void_activity_hourly(hour_start);

-- =============================================================================
-- Weather State History
-- =============================================================================

CREATE TABLE IF NOT EXISTS weather_state_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    void_type VARCHAR(20) NOT NULL,
    weather_state VARCHAR(20) NOT NULL,
    intensity DECIMAL(3,2),
    sentiment_aggregate DECIMAL(5,4),
    sample_count INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_weather_void_type ON weather_state_history(void_type);
CREATE INDEX idx_weather_recorded_at ON weather_state_history(recorded_at);

-- =============================================================================
-- Echo Word Distribution (Daily Aggregates)
-- =============================================================================

CREATE TABLE IF NOT EXISTS echo_distribution_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    void_type VARCHAR(20) NOT NULL,
    date DATE NOT NULL,
    echo_word VARCHAR(20) NOT NULL,
    count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(void_type, date, echo_word)
);

CREATE INDEX idx_echo_dist_type ON echo_distribution_daily(void_type);
CREATE INDEX idx_echo_dist_date ON echo_distribution_daily(date);

-- =============================================================================
-- Redaction Metrics (No actual content)
-- =============================================================================

CREATE TABLE IF NOT EXISTS redaction_metrics_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    total_redactions INTEGER DEFAULT 0,
    email_redactions INTEGER DEFAULT 0,
    phone_redactions INTEGER DEFAULT 0,
    name_redactions INTEGER DEFAULT 0,
    address_redactions INTEGER DEFAULT 0,
    other_redactions INTEGER DEFAULT 0,
    avg_processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hour_start)
);

CREATE INDEX idx_redaction_metrics_hour ON redaction_metrics_hourly(hour_start);

-- =============================================================================
-- Sentiment Analysis Metrics
-- =============================================================================

CREATE TABLE IF NOT EXISTS sentiment_metrics_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    void_type VARCHAR(20) NOT NULL,
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    total_analyses INTEGER DEFAULT 0,
    avg_sentiment_score DECIMAL(5,4),
    positive_count INTEGER DEFAULT 0,
    neutral_count INTEGER DEFAULT 0,
    negative_count INTEGER DEFAULT 0,
    avg_confidence DECIMAL(5,4),
    weather_changes INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(void_type, hour_start)
);

CREATE INDEX idx_sentiment_metrics_type ON sentiment_metrics_hourly(void_type);
CREATE INDEX idx_sentiment_metrics_hour ON sentiment_metrics_hourly(hour_start);

-- =============================================================================
-- Crisis Detection Metrics (Aggregated only)
-- =============================================================================

CREATE TABLE IF NOT EXISTS crisis_detection_daily (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    high_severity_count INTEGER DEFAULT 0,
    medium_severity_count INTEGER DEFAULT 0,
    low_severity_count INTEGER DEFAULT 0,
    resources_shown_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

CREATE INDEX idx_crisis_date ON crisis_detection_daily(date);

-- =============================================================================
-- API Gateway Metrics
-- =============================================================================

CREATE TABLE IF NOT EXISTS api_metrics_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    endpoint VARCHAR(100) NOT NULL,
    method VARCHAR(10) NOT NULL,
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    avg_response_time_ms INTEGER,
    p95_response_time_ms INTEGER,
    p99_response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hour_start, endpoint, method)
);

CREATE INDEX idx_api_metrics_hour ON api_metrics_hourly(hour_start);
CREATE INDEX idx_api_metrics_endpoint ON api_metrics_hourly(endpoint);

-- =============================================================================
-- WebSocket Connection Metrics
-- =============================================================================

CREATE TABLE IF NOT EXISTS websocket_metrics_hourly (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    void_type VARCHAR(20),
    hour_start TIMESTAMP WITH TIME ZONE NOT NULL,
    peak_connections INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    total_disconnections INTEGER DEFAULT 0,
    avg_connection_duration_seconds INTEGER,
    messages_sent INTEGER DEFAULT 0,
    messages_received INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(hour_start, void_type)
);

CREATE INDEX idx_ws_metrics_hour ON websocket_metrics_hourly(hour_start);
CREATE INDEX idx_ws_metrics_void ON websocket_metrics_hourly(void_type);

-- =============================================================================
-- Cleanup Job: Remove old metrics (retention policy)
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_old_metrics()
RETURNS void AS $$
BEGIN
    -- Keep hourly metrics for 30 days
    DELETE FROM service_health_logs WHERE recorded_at < NOW() - INTERVAL '30 days';
    DELETE FROM void_activity_hourly WHERE hour_start < NOW() - INTERVAL '30 days';
    DELETE FROM weather_state_history WHERE recorded_at < NOW() - INTERVAL '30 days';
    DELETE FROM redaction_metrics_hourly WHERE hour_start < NOW() - INTERVAL '30 days';
    DELETE FROM sentiment_metrics_hourly WHERE hour_start < NOW() - INTERVAL '30 days';
    DELETE FROM api_metrics_hourly WHERE hour_start < NOW() - INTERVAL '30 days';
    DELETE FROM websocket_metrics_hourly WHERE hour_start < NOW() - INTERVAL '30 days';

    -- Keep daily metrics for 90 days
    DELETE FROM echo_distribution_daily WHERE date < NOW() - INTERVAL '90 days';
    DELETE FROM crisis_detection_daily WHERE date < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (if using a non-superuser app user)
-- CREATE USER void_app WITH PASSWORD 'app_password';
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO void_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO void_app;

COMMENT ON DATABASE void_metrics IS 'Void Confessions metrics database - stores only aggregated analytics, no confession content';
