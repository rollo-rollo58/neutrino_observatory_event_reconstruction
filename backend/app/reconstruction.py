"""Research-only, bounded robust time-of-flight vertex estimator."""
from __future__ import annotations

from dataclasses import dataclass
import math

from .calibration import CalibratedHit
from .physics import PHOTON_SPEED_M_PER_NS, energy_proxy_gev
from .schemas import Detector, Vec3


@dataclass(frozen=True)
class VertexFit:
    vertex: Vec3
    emission_time_ns: float
    rms_residual_ns: float
    energy_proxy_gev: float
    fitted_hits: int
    converged: bool
    iterations: int
    algorithm: str = "irls-gauss-newton-demo-v1"


def _solve_four(matrix: list[list[float]], vector: list[float]) -> list[float]:
    rows = [matrix[index][:] + [vector[index]] for index in range(4)]
    for col in range(4):
        pivot = max(range(col, 4), key=lambda row: abs(rows[row][col]))
        if abs(rows[pivot][col]) < 1e-12:
            raise ValueError("reconstruction is underconstrained")
        rows[col], rows[pivot] = rows[pivot], rows[col]
        divisor = rows[col][col]
        rows[col] = [item / divisor for item in rows[col]]
        for row in range(4):
            if row == col:
                continue
            factor = rows[row][col]
            rows[row] = [
                current - factor * basis
                for current, basis in zip(rows[row], rows[col])
            ]
    return [row[4] for row in rows]


def reconstruct_vertex(
    hits: list[CalibratedHit],
    detector_index: dict[str, Detector],
    iterations: int = 100,
) -> VertexFit:
    available = [
        (hit, detector_index[hit.channel_id])
        for hit in hits
        if hit.channel_id in detector_index
        and detector_index[hit.channel_id].online
        and hit.photoelectrons > 0
    ]
    if len({hit.channel_id for hit, _ in available}) < 4:
        raise ValueError("at least four independent illuminated PMTs are required")
    if not 5 <= iterations <= 400:
        raise ValueError("iteration count outside supported range")

    total = sum(hit.photoelectrons for hit, _ in available)
    weights = [min(15.0, 1.0 + math.sqrt(hit.photoelectrons)) for hit, _ in available]
    weight_sum = sum(weights)
    coord = [
        sum(getattr(det.position, axis) * weight for (_, det), weight in
            zip(available, weights)) / weight_sum
        for axis in ("x", "y", "z")
    ]
    t0 = min(
        hit.arrival_ns - math.dist(
            coord, (det.position.x, det.position.y, det.position.z)
        ) / PHOTON_SPEED_M_PER_NS
        for hit, det in available
    )
    state = coord + [t0]
    damping = 0.003
    converged = False
    rounds = 0

    def residuals(position: list[float]) -> list[float]:
        return [
            hit.arrival_ns - (
                position[3] + math.dist(
                    position[:3],
                    (det.position.x, det.position.y, det.position.z),
                ) / PHOTON_SPEED_M_PER_NS
            )
            for hit, det in available
        ]

    def cost(position: list[float]) -> float:
        values = residuals(position)
        return sum(
            weight * min(res * res, 120 * abs(res))
            for weight, res in zip(weights, values)
        )

    for turn in range(iterations):
        rounds = turn + 1
        normal = [[0.0 for _ in range(4)] for _ in range(4)]
        right = [0.0 for _ in range(4)]
        for (hit, det), base_weight in zip(available, weights):
            offset = [
                state[axis] - getattr(det.position, name)
                for axis, name in enumerate(("x", "y", "z"))
            ]
            length = max(math.sqrt(sum(value * value for value in offset)), 1e-6)
            predicted = state[3] + length / PHOTON_SPEED_M_PER_NS
            residual = hit.arrival_ns - predicted
            weight = base_weight * min(1.0, 24.0 / max(abs(residual), 1e-9))
            jacobian = [
                value / (length * PHOTON_SPEED_M_PER_NS) for value in offset
            ] + [1.0]
            for row in range(4):
                right[row] += weight * jacobian[row] * residual
                for col in range(4):
                    normal[row][col] += weight * jacobian[row] * jacobian[col]
        for index in range(4):
            normal[index][index] += damping
        try:
            step = _solve_four(normal, right)
        except ValueError:
            break
        direction = [max(-12, min(12, delta)) for delta in step[:3]]
        direction.append(max(-40, min(40, step[3])))
        previous = cost(state)
        accepted = False
        for scale in (1.0, 0.5, 0.25, 0.125, 0.0625):
            trial = [
                max(-200, min(200, state[index] + scale * direction[index]))
                if index < 3 else state[index] + scale * direction[index]
                for index in range(4)
            ]
            if cost(trial) < previous:
                state = trial
                accepted = True
                if max(abs(scale * value) for value in direction) < 0.0001:
                    converged = True
                break
        if not accepted:
            converged = True
            break
        if converged:
            break
    errors = residuals(state)
    rms = math.sqrt(sum(value * value for value in errors) / len(errors))
    return VertexFit(
        vertex=Vec3(x=state[0], y=state[1], z=state[2]),
        emission_time_ns=state[3],
        rms_residual_ns=rms,
        energy_proxy_gev=energy_proxy_gev(total),
        fitted_hits=len(available),
        converged=converged,
        iterations=rounds,
    )
