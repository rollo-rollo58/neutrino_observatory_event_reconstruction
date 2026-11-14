'use client';

import { useState } from 'react';
import { useDomainTelemetry } from '@/hooks/useDomainTelemetry';
import DetectorArray from './DetectorArray';
import EventControls from './EventControls';
import EventLedger from './EventLedger';
import WaveformStrip from './WaveformStrip';
import VertexReconstruction from './VertexReconstruction';
import TriggerConsole from './TriggerConsole';
import ChargeSpectrum from './ChargeSpectrum';
import ChannelHealth from './ChannelHealth';
import TimeResiduals from './TimeResiduals';
import GeometrySlices from './GeometrySlices';
import AnalysisNarrative from './AnalysisNarrative';

type Workspace = 'acquisition' | 'reconstruction' | 'qualification';

export default function ObservatoryShell() {
  const telemetry = useDomainTelemetry();
  const [workspace, setWorkspace] = useState<Workspace>('acquisition');
  const online = telemetry.overview?.channels.online ?? 0;
  const total = telemetry.overview?.channels.total ?? 48;

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/10 bg-[#091823]/90 px-5 py-4 lg:px-10">
        <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="grid h-11 w-11 place-items-center rounded-xl border border-sea/30">
              <svg viewBox="0 0 32 32" className="h-8 w-8" fill="none">
                <circle cx="16" cy="16" r="12" stroke="#4de0c1" opacity=".5" />
                <ellipse cx="16" cy="16" rx="5" ry="12" stroke="#4de0c1" />
                <path d="M4 16h24M7 8l18 16" stroke="#f7b667" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-semibold tracking-[.14em]">BOREALIS ARRAY</p>
              <p className="text-[11px] text-muted">Deep-water neutrino observatory / research console</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted">
            <span className="rounded-lg border border-signal/30 bg-signal/10 px-3 py-2 text-signal">
              SYNTHETIC DATA — NOT A LIVE DETECTOR
            </span>
            <span className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${
                telemetry.connected ? 'bg-sea' : 'bg-signal'
              }`} />
              {telemetry.connected ? 'STREAM LINKED' : 'STREAM DISCONNECTED'}
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1680px] px-5 py-7 lg:px-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="eyebrow">INSTRUMENT OPERATIONS / DETECTOR WORKBENCH</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight lg:text-4xl">
              Cherenkov Event Observatory
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted">
              Reconstruct first-photon arrival geometry from a simulated 48-channel array.
            </p>
          </div>
          <div className="flex gap-2 rounded-xl border border-white/10 bg-panel p-1">
            {(['acquisition', 'reconstruction', 'qualification'] as Workspace[]).map(
              (name) => (
                <button
                  key={name}
                  onClick={() => setWorkspace(name)}
                  className={`rounded-lg px-3 py-2 text-xs capitalize transition-colors ${
                    workspace === name ? 'bg-sea text-abyss' : 'text-muted hover:text-white'
                  }`}
                >
                  {name}
                </button>
              ),
            )}
          </div>
        </div>

        {telemetry.error && (
          <div role="alert" className="mb-5 rounded-xl border border-red-400/30 p-3 text-sm">
            {telemetry.error}. Start the FastAPI server on port 8000.
          </div>
        )}

        <div className="mb-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['ACTIVE CHANNELS', `${online} / ${total}`, 'Array photomultipliers'],
            ['RECORDED EVENTS', String(telemetry.overview?.recorded_events ?? 0), 'Bounded ledger'],
            ['CURRENT FIT RMS', telemetry.selected
              ? `${telemetry.selected.rms_residual_ns.toFixed(2)} ns` : '—',
            'Arrival-time residual'],
            ['CHARGE ESTIMATE', telemetry.selected
              ? `${telemetry.selected.total_charge_pe.toFixed(1)} pe` : '—',
            'Calibrated photoelectrons'],
          ].map(([label, value, caption]) => (
            <div className="instrument-card" key={label}>
              <p className="eyebrow">{label}</p>
              <p className="metric-number mt-3">{value}</p>
              <p className="mt-2 text-xs text-muted">{caption}</p>
            </div>
          ))}
        </div>

        {workspace === 'acquisition' && (
          <div className="grid gap-5 xl:grid-cols-12">
            <div className="space-y-5 xl:col-span-8">
              <DetectorArray detectors={telemetry.detectors} event={telemetry.selected} />
              <WaveformStrip event={telemetry.selected} />
              <EventLedger
                events={telemetry.events}
                selectedId={telemetry.selectedId}
                onSelect={telemetry.setSelectedId}
              />
            </div>
            <div className="space-y-5 xl:col-span-4">
              <EventControls onSimulate={telemetry.simulate} busy={telemetry.busy} />
              <ChannelHealth detectors={telemetry.detectors} />
              <TriggerConsole event={telemetry.selected} />
            </div>
          </div>
        )}
        {workspace === 'reconstruction' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <VertexReconstruction event={telemetry.selected} />
            <GeometrySlices event={telemetry.selected} detectors={telemetry.detectors} />
            <TimeResiduals event={telemetry.selected} detectors={telemetry.detectors} />
            <ChargeSpectrum event={telemetry.selected} />
          </div>
        )}
        {workspace === 'qualification' && (
          <div className="grid gap-5 lg:grid-cols-2">
            <AnalysisNarrative event={telemetry.selected} />
            <TriggerConsole event={telemetry.selected} />
            <ChannelHealth detectors={telemetry.detectors} />
            <EventLedger
              events={telemetry.events}
              selectedId={telemetry.selectedId}
              onSelect={telemetry.setSelectedId}
            />
          </div>
        )}
        <footer className="mt-8 border-t border-white/10 pt-5 text-xs text-muted">
          Research only / synthetic PMT signals / no real-time alerting or detector control.
        </footer>
      </div>
    </div>
  );
}
