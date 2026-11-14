BEGIN;
CREATE TABLE IF NOT EXISTS channel_calibration_history (
    calibration_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    channel_id TEXT NOT NULL REFERENCES detector_channels(id),
    gain_pe_per_unit DOUBLE PRECISION NOT NULL CHECK (gain_pe_per_unit > 0),
    time_offset_ns DOUBLE PRECISION NOT NULL,
    calibrated_by TEXT NOT NULL,
    effective_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    calibration_method TEXT NOT NULL DEFAULT 'synthetic_reference'
);
CREATE TABLE IF NOT EXISTS operator_audit_log (
    audit_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    action_name TEXT NOT NULL,
    resource_id TEXT NOT NULL,
    actor TEXT NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    details JSONB NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS ix_calibration_channel_time
    ON channel_calibration_history(channel_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS ix_audit_time
    ON operator_audit_log(occurred_at DESC);
CREATE OR REPLACE FUNCTION update_channel_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS tr_channel_timestamp ON detector_channels;
CREATE TRIGGER tr_channel_timestamp
BEFORE UPDATE ON detector_channels
FOR EACH ROW EXECUTE FUNCTION update_channel_timestamp();
COMMIT;
