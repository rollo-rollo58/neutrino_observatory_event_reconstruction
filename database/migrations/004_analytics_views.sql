BEGIN;
CREATE OR REPLACE VIEW v_detector_event_quality AS
SELECT
    e.event_id,
    e.occurred_at,
    e.multiplicity,
    e.total_charge_pe,
    r.rms_residual_ns,
    r.converged,
    r.energy_proxy_gev,
    CASE
        WHEN r.event_id IS NULL THEN 'unreconstructed'
        WHEN r.converged AND r.rms_residual_ns < 20 THEN 'good_fit'
        ELSE 'review'
    END AS quality_class
FROM detector_events AS e
LEFT JOIN event_reconstruction AS r ON r.event_id = e.event_id;
CREATE OR REPLACE VIEW v_channel_occupancy AS
SELECT
    c.id AS channel_id,
    c.string_index,
    c.level_index,
    c.is_online,
    count(h.id) AS hit_count,
    COALESCE(sum(h.raw_charge), 0.0) AS total_raw_charge
FROM detector_channels AS c
LEFT JOIN photon_hits AS h ON h.channel_id = c.id
GROUP BY c.id, c.string_index, c.level_index, c.is_online;
INSERT INTO detector_channels
    (id, string_index, level_index, x_m, y_m, z_m)
SELECT
    'PMT-' || s::text || '-' || l::text,
    s,
    l,
    90.0 * cos(2.0 * pi() * s / 8.0),
    90.0 * sin(2.0 * pi() * s / 8.0),
    -120.0 + 40.0 * l
FROM generate_series(0, 7) AS s
CROSS JOIN generate_series(0, 5) AS l
ON CONFLICT (id) DO NOTHING;
COMMIT;
