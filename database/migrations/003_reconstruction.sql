BEGIN;
CREATE TABLE IF NOT EXISTS event_reconstruction (
    event_id UUID PRIMARY KEY REFERENCES detector_events(event_id) ON DELETE CASCADE,
    vertex_x_m DOUBLE PRECISION NOT NULL,
    vertex_y_m DOUBLE PRECISION NOT NULL,
    vertex_z_m DOUBLE PRECISION NOT NULL,
    origin_time_ns DOUBLE PRECISION NOT NULL,
    rms_residual_ns DOUBLE PRECISION NOT NULL CHECK (rms_residual_ns >= 0),
    energy_proxy_gev DOUBLE PRECISION NOT NULL CHECK (energy_proxy_gev >= 0),
    fitted_hits INTEGER NOT NULL CHECK (fitted_hits >= 0),
    converged BOOLEAN NOT NULL DEFAULT FALSE,
    algorithm_version TEXT NOT NULL,
    estimated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS coincidence_triggers (
    trigger_id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    event_id UUID REFERENCES detector_events(event_id) ON DELETE SET NULL,
    window_start_ns DOUBLE PRECISION NOT NULL,
    window_end_ns DOUBLE PRECISION NOT NULL,
    unique_channels INTEGER NOT NULL CHECK (unique_channels >= 0),
    fired BOOLEAN NOT NULL,
    threshold INTEGER NOT NULL CHECK (threshold > 0)
);
CREATE INDEX IF NOT EXISTS ix_trigger_fired
    ON coincidence_triggers(fired, unique_channels DESC);
CREATE INDEX IF NOT EXISTS ix_recon_fit_quality
    ON event_reconstruction(rms_residual_ns ASC);
COMMIT;
