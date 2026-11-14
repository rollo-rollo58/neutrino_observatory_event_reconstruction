BEGIN;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE TABLE IF NOT EXISTS detector_channels (
    id TEXT PRIMARY KEY,
    string_index INTEGER NOT NULL CHECK (string_index >= 0),
    level_index INTEGER NOT NULL CHECK (level_index >= 0),
    x_m DOUBLE PRECISION NOT NULL,
    y_m DOUBLE PRECISION NOT NULL,
    z_m DOUBLE PRECISION NOT NULL,
    gain_pe_per_unit DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    time_offset_ns DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    dark_rate_hz DOUBLE PRECISION NOT NULL DEFAULT 500.0,
    is_online BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (string_index, level_index)
);
CREATE TABLE IF NOT EXISTS detector_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_kind TEXT NOT NULL CHECK (event_kind IN ('synthetic', 'ingested')),
    occurred_at TIMESTAMPTZ NOT NULL,
    total_charge_pe DOUBLE PRECISION NOT NULL CHECK (total_charge_pe >= 0),
    multiplicity INTEGER NOT NULL CHECK (multiplicity >= 0),
    quality_tag TEXT NOT NULL DEFAULT 'research_only',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS photon_hits (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id UUID NOT NULL REFERENCES detector_events(event_id) ON DELETE CASCADE,
    channel_id TEXT NOT NULL REFERENCES detector_channels(id),
    arrival_ns DOUBLE PRECISION NOT NULL,
    raw_charge DOUBLE PRECISION NOT NULL CHECK (raw_charge >= 0),
    UNIQUE (event_id, channel_id, arrival_ns)
);
CREATE INDEX IF NOT EXISTS ix_hits_event_time ON photon_hits(event_id, arrival_ns);
CREATE INDEX IF NOT EXISTS ix_events_time ON detector_events(occurred_at DESC);
COMMIT;
