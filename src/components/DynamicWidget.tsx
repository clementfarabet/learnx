import React, { useState, useEffect, useMemo } from 'react';
import { MicrositeWidget } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  widget: MicrositeWidget;
  accentColor?: string;
}

export const DynamicWidget: React.FC<Props> = ({ widget }) => {
  const { t } = useLanguage();
  // 1. State for 'simulation' parameters
  const defaultParamMap = useMemo(() => {
    const map: Record<string, number> = {};
    (widget?.parameters || []).forEach((p) => {
      if (p && p.id) {
        map[p.id] = Number(p.defaultValue) || 0;
      }
    });
    return map;
  }, [widget]);

  const [paramValues, setParamValues] =
    useState<Record<string, number>>(defaultParamMap);

  useEffect(() => {
    setParamValues(defaultParamMap);
  }, [defaultParamMap]);

  // 2. State for 'timeline' scrubber
  const [activeEventIdx, setActiveEventIdx] = useState<number>(0);
  useEffect(() => {
    setActiveEventIdx(
      widget?.events && widget.events.length > 0
        ? Math.min(3, widget.events.length - 1)
        : 0
    );
  }, [widget]);

  // 3. State for 'system-explorer' impulse & stage selection
  const [systemImpulse, setSystemImpulse] = useState<number>(35);
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);

  // 4. Simulation calculations (above conditional returns for Rules of Hooks)
  const params = useMemo(() => widget?.parameters || [], [widget]);
  const p0 = params[0]
    ? Number(paramValues[params[0].id] ?? params[0].defaultValue ?? 1)
    : 1;
  const p1 = params[1]
    ? Number(paramValues[params[1].id] ?? params[1].defaultValue ?? 1)
    : 1;
  const p2 = params[2]
    ? Number(paramValues[params[2].id] ?? params[2].defaultValue ?? 1)
    : 1;

  const norm = (idx: number) => {
    const p = params[idx];
    if (!p) return 0.5;
    const v = Number(paramValues[p.id] ?? p.defaultValue ?? 0);
    const min = Number(p.min ?? 0);
    const max = Number(p.max ?? 100);
    const span = max - min;
    if (!Number.isFinite(span) || span === 0) return 0.5;
    return Math.max(0, Math.min(1, (v - min) / span));
  };

  const n0 = norm(0);
  const n1 = norm(1);
  const n2 = norm(2);

  const { pointsPath, areaPath, metricDisplay, regimeLabel, markerX, markerY } =
    useMemo(() => {
      const N = 48;
      const width = 560;
      const height = 175;
      const padX = 24;
      const padY = 20;
      const plotW = width - padX * 2;
      const plotH = height - padY * 2;

      const pts: [number, number][] = [];
      const formula = widget?.formulaType || 'resonance-peak';

      for (let i = 0; i <= N; i++) {
        const t = i / N;
        let yNorm = 0.5;

        if (formula === 'harmonic-wave') {
          const phase = t * Math.PI * 2;
          const visibility = 0.5 + 0.5 * n1;
          const eff = 0.6 + 0.4 * n2;
          yNorm =
            0.5 + 0.44 * visibility * eff * Math.cos(phase - n0 * Math.PI);
        } else if (formula === 'saturation-logistic') {
          const steepness = 2.5 + n0 * 4.5;
          const offset = 0.25 + (1 - n1) * 0.4;
          const asym = 0.2 + 0.65 * (1 - 0.5 * n2);
          yNorm =
            asym + (0.88 - asym) * Math.exp(-steepness * t * (0.6 + offset));
        } else if (formula === 'exponential-growth') {
          const rate = 1.2 + n0 * 3.2 - n1 * 1.1;
          yNorm = Math.min(
            0.95,
            0.12 +
              0.82 *
                ((Math.exp(rate * t) - 1) / (Math.exp(3.2) - 1)) *
                (0.6 + 0.4 * n2)
          );
        } else if (formula === 'inverse-power') {
          const alpha = 0.8 + n0 * 2.2;
          yNorm =
            (0.9 * (0.5 + 0.5 * n1)) /
            Math.pow(1 + 3.5 * t, alpha * (0.7 + 0.3 * n2));
        } else {
          const center = 0.25 + n0 * 0.5;
          const sharpness = 6 + (1 - n0) * 28 + n2 * 8;
          const base = 0.08 + 0.15 * n1;
          yNorm =
            base +
            (0.92 - base) * Math.exp(-sharpness * Math.pow(t - center, 2));
        }

        const safeY = Number.isFinite(yNorm) ? yNorm : 0.5;
        const clampedY = Math.max(0.05, Math.min(0.96, safeY));
        const px = padX + t * plotW;
        const py = padY + (1 - clampedY) * plotH;
        pts.push([px, py]);
      }

      const d = pts
        .map(
          ([x, y], idx) =>
            `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
        )
        .join(' ');
      const area = `${d} L ${(padX + plotW).toFixed(1)} ${(
        padY + plotH
      ).toFixed(1)} L ${padX.toFixed(1)} ${(padY + plotH).toFixed(1)} Z`;

      let rawMetric = 0;
      if (widget?.formulaType === 'harmonic-wave') {
        const angleRad = (p0 * Math.PI) / 180;
        const vis = p1 / 100;
        const eff = p2 / 100;
        rawMetric =
          Math.abs(3 * Math.cos(2 * angleRad) - Math.cos(6 * angleRad)) *
          vis *
          (0.85 + 0.15 * eff);
      } else if (
        widget?.outputMetricUnit === '%' &&
        params[0]?.id === 'inflation'
      ) {
        rawMetric = p2 + p0 + 0.5 * (p0 - 2.0) + 0.5 * p1;
      } else {
        rawMetric = (0.45 * n0 + 0.35 * n1 + 0.2 * n2) * 100;
      }

      const activeIdx = Math.min(
        pts.length - 1,
        Math.max(0, Math.round(n0 * (pts.length - 1)))
      );
      const [mx, my] = pts[activeIdx] || [280, 90];

      const compositeScore = 0.5 * n0 + 0.3 * n1 + 0.2 * n2;
      const thresholds = widget?.regimeThresholds || {
        lowLabel: 'Low-Intensity Regime',
        midLabel: 'Balanced Equilibrium Regime',
        highLabel: 'High-Gain / Critical Regime',
      };
      const regime =
        compositeScore < 0.36
          ? thresholds.lowLabel || 'Low Regime'
          : compositeScore < 0.68
          ? thresholds.midLabel || 'Balanced Regime'
          : thresholds.highLabel || 'High Regime';

      return {
        pointsPath: d,
        areaPath: area,
        metricDisplay: Number.isFinite(rawMetric)
          ? rawMetric.toFixed(2)
          : '50.00',
        regimeLabel: regime,
        markerX: mx,
        markerY: my,
      };
    }, [n0, n1, n2, p0, p1, p2, params, widget]);

  // Render 'timeline' widget
  if (
    widget?.widgetType === 'timeline' &&
    Array.isArray(widget.events) &&
    widget.events.length > 0
  ) {
    const events = widget.events;
    const safeIdx = Math.min(Math.max(0, activeEventIdx), events.length - 1);
    const current = events[safeIdx] || events[0];
    const colCount = Math.min(6, Math.max(1, events.length));

    return (
      <div className="surface-card overflow-hidden">
        <div
          className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5 border-b"
          style={{
            borderColor: 'var(--rule)',
            backgroundColor: 'var(--paper-2)',
          }}
        >
          <div>
            <span className="kicker block mb-0.5">
              Interactive Chronology · Milestone {safeIdx + 1} of {events.length}
            </span>
            <h3
              className="text-base font-semibold tracking-tight"
              style={{ color: 'var(--ink)' }}
            >
              {widget.title}
            </h3>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <p
            className="text-sm font-serif-editorial"
            style={{ color: 'var(--ink-2)' }}
          >
            {widget.subtitle || widget.explanation}
          </p>

          {/* Interactive Impact Bar & Scrubber */}
          <div className="surface-well p-4">
            <div
              className="grid gap-2 items-end h-28 pt-4 px-2"
              style={{
                gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
              }}
            >
              {events.map((ev, idx) => {
                const isSelected = idx === safeIdx;
                const score = Number(ev.impactScore) || 75;
                const heightPct = Math.max(22, Math.min(100, score));
                return (
                  <button
                    key={`${ev.year}-${idx}`}
                    type="button"
                    onClick={() => setActiveEventIdx(idx)}
                    className="group flex flex-col items-center justify-end h-full cursor-pointer focus:outline-none"
                  >
                    <span
                      className="text-[10px] font-mono mb-1"
                      style={{
                        color: isSelected ? 'var(--ink)' : 'var(--ink-3)',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {score}
                    </span>
                    <div
                      className="w-full max-w-[42px] rounded-t-md transition-all duration-200"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: isSelected
                          ? 'var(--accent)'
                          : 'var(--rule)',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Year Pills */}
            <div
              className="grid gap-1.5 pt-2 border-t mt-1"
              style={{
                borderColor: 'var(--rule)',
                gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
              }}
            >
              {events.map((ev, idx) => {
                const isSelected = idx === safeIdx;
                return (
                  <button
                    key={`pill-${ev.year}-${idx}`}
                    type="button"
                    onClick={() => setActiveEventIdx(idx)}
                    className="py-1 px-1 rounded-md text-center font-mono text-xs truncate cursor-pointer"
                    style={{
                      backgroundColor: isSelected
                        ? 'var(--paper)'
                        : 'transparent',
                      color: isSelected ? 'var(--ink)' : 'var(--ink-3)',
                      fontWeight: isSelected ? 600 : 400,
                      border: isSelected
                        ? '1px solid var(--rule)'
                        : '1px solid transparent',
                    }}
                    title={ev.year}
                  >
                    {ev.year}
                  </button>
                );
              })}
            </div>

            {events.length > 1 && (
              <div className="mt-3.5 flex items-center gap-3">
                <span className="kicker">Scrub</span>
                <input
                  type="range"
                  min={0}
                  max={events.length - 1}
                  step={1}
                  value={safeIdx}
                  aria-label="Timeline milestone scrubber"
                  onChange={(e) => setActiveEventIdx(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Active Milestone Card */}
          {current && (
            <div className="surface-well p-4 space-y-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-xs font-mono font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    {current.year}
                  </span>
                  {current.domainTag && (
                    <span className="kicker">· {current.domainTag}</span>
                  )}
                </div>
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--ink-3)' }}
                >
                  Impact {current.impactScore || 80}/100
                </span>
              </div>

              <h4
                className="text-base font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                {current.title}
              </h4>
              <p
                className="text-sm font-serif-editorial leading-relaxed"
                style={{ color: 'var(--ink)' }}
              >
                {current.summary}
              </p>
              {current.deeperInsight && (
                <div
                  className="editorial-frame text-xs sm:text-sm pt-1 mt-2"
                  style={{ borderColor: 'var(--accent)' }}
                >
                  <strong style={{ color: 'var(--ink)' }}>Significance:</strong>{' '}
                  {current.deeperInsight}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render 'system-explorer' widget
  if (
    widget?.widgetType === 'system-explorer' &&
    Array.isArray(widget.stages) &&
    widget.stages.length > 0
  ) {
    const stages = widget.stages;
    const activeStage = stages[selectedStageIdx] || stages[0];

    return (
      <div className="surface-card overflow-hidden">
        <div
          className="px-5 py-3.5 border-b"
          style={{
            borderColor: 'var(--rule)',
            backgroundColor: 'var(--paper-2)',
          }}
        >
          <span className="kicker block mb-0.5">
            Interactive System &amp; Perturbation Lab
          </span>
          <h3
            className="text-base font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            {widget.title}
          </h3>
        </div>

        <div className="p-5 space-y-4">
          <p
            className="text-sm font-serif-editorial"
            style={{ color: 'var(--ink-2)' }}
          >
            {widget.subtitle || widget.explanation}
          </p>

          <div className="surface-well p-3.5">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium" style={{ color: 'var(--ink)' }}>
                System Drive / Impulse
              </span>
              <span
                className="font-mono font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                {systemImpulse > 0 ? `+${systemImpulse}%` : `${systemImpulse}%`}
              </span>
            </div>
            <input
              type="range"
              min={-80}
              max={100}
              step={5}
              value={systemImpulse}
              aria-label="System perturbation input level"
              onChange={(e) => setSystemImpulse(Number(e.target.value))}
              className="w-full cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {stages.map((st, idx) => {
              const computed = Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    (st.baseValue || 50) +
                      (systemImpulse * (st.sensitivity || 1)) / 2
                  )
                )
              );
              const isSelected = idx === selectedStageIdx;
              return (
                <button
                  key={st.id || idx}
                  type="button"
                  onClick={() => setSelectedStageIdx(idx)}
                  className="p-3.5 rounded-xl border text-left transition cursor-pointer"
                  style={{
                    backgroundColor: isSelected
                      ? 'var(--paper-2)'
                      : 'var(--paper)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--rule)',
                  }}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span
                      className="font-semibold"
                      style={{ color: 'var(--ink)' }}
                    >
                      {idx + 1}. {st.name}
                    </span>
                    <span
                      className="font-mono"
                      style={{ color: 'var(--accent)' }}
                    >
                      {computed}%
                    </span>
                  </div>
                  <div
                    className="text-[11px] mb-2"
                    style={{ color: 'var(--ink-3)' }}
                  >
                    {st.role}
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: 'var(--rule)' }}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${computed}%`,
                        backgroundColor: 'var(--accent)',
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {activeStage && (
            <div className="surface-well p-4 text-sm">
              <div
                className="font-semibold mb-1"
                style={{ color: 'var(--ink)' }}
              >
                {activeStage.name} — {activeStage.metricLabel}
              </div>
              <p
                className="font-serif-editorial"
                style={{ color: 'var(--ink-2)' }}
              >
                {activeStage.mechanism}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default / 'simulation' widget
  return (
    <div className="surface-card overflow-hidden">
      {/* Header */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5 border-b"
        style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--paper-2)' }}
      >
        <div>
          <span className="kicker block mb-0.5">
            {t.microsite.widgetKicker}
          </span>
          <h3
            className="text-base font-semibold tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            {widget?.title || t.microsite.widgetFallbackTitle}
          </h3>
        </div>

        <button
          type="button"
          onClick={() => setParamValues(defaultParamMap)}
          className="text-xs font-medium px-3 py-1 rounded-full cursor-pointer"
          style={{
            backgroundColor: 'var(--paper)',
            border: '1px solid var(--rule)',
            color: 'var(--ink-2)',
          }}
        >
          {t.microsite.resetBtn}
        </button>
      </div>

      <div className="p-5 space-y-5">
        <p
          className="text-sm font-serif-editorial leading-relaxed"
          style={{ color: 'var(--ink-2)' }}
        >
          {widget?.subtitle || widget?.explanation}
        </p>

        {/* Live Plotter Canvas */}
        <div className="surface-well p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
            <div className="flex items-baseline gap-2">
              <span
                className="text-xs font-mono"
                style={{ color: 'var(--ink-2)' }}
              >
                {widget?.outputMetricLabel || t.microsite.outputLabel}:
              </span>
              <span
                className="text-base font-mono font-semibold"
                style={{ color: 'var(--accent)' }}
              >
                {metricDisplay}{' '}
                <span
                  className="text-xs font-normal"
                  style={{ color: 'var(--ink-3)' }}
                >
                  {widget?.outputMetricUnit || ''}
                </span>
              </span>
            </div>
            <span className="kicker">{regimeLabel}</span>
          </div>

          <svg viewBox="0 0 560 175" className="w-full h-40 overflow-visible">
            <defs>
              <linearGradient id="simAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.22" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            <line
              x1="24"
              y1="45"
              x2="536"
              y2="45"
              stroke="var(--rule)"
              strokeDasharray="4 4"
            />
            <line
              x1="24"
              y1="90"
              x2="536"
              y2="90"
              stroke="var(--rule)"
              strokeDasharray="3 5"
            />
            <line
              x1="24"
              y1="135"
              x2="536"
              y2="135"
              stroke="var(--rule)"
              strokeDasharray="4 4"
            />

            <path d={areaPath} fill="url(#simAreaGrad)" />
            <path
              d={pointsPath}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="2.25"
              strokeLinecap="round"
            />

            <line
              x1={markerX}
              y1={20}
              x2={markerX}
              y2={155}
              stroke="var(--ink-3)"
              strokeOpacity="0.4"
              strokeDasharray="2 3"
            />
            <circle
              cx={markerX}
              cy={markerY}
              r="5.5"
              fill="var(--accent)"
              stroke="var(--paper)"
              strokeWidth="2"
            />
          </svg>

          <div
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[11px] font-mono pt-2 border-t"
            style={{ borderColor: 'var(--rule)', color: 'var(--ink-3)' }}
          >
            <span>X: {widget?.xAxisLabel || t.microsite.controlVarFallback}</span>
            <span>Y: {widget?.yAxisLabel || t.microsite.responseFallback}</span>
          </div>
        </div>

        {/* Interactive Parameter Sliders */}
        <div className="grid grid-cols-1 gap-3">
          {params.map((p) => {
            const val = paramValues[p.id] ?? p.defaultValue ?? p.min ?? 0;
            const step =
              p.step && p.step > 0
                ? p.step
                : Math.max(0.01, ((p.max || 100) - (p.min || 0)) / 20);
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border"
                style={{
                  borderColor: 'var(--rule)',
                  backgroundColor: 'var(--paper-2)',
                }}
              >
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <label
                    htmlFor={`param-${p.id}`}
                    className="text-xs sm:text-sm font-semibold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {p.label}
                  </label>
                  <span
                    className="text-xs sm:text-sm font-mono font-semibold shrink-0"
                    style={{ color: 'var(--accent)' }}
                  >
                    {val} {p.unit}
                  </span>
                </div>
                <input
                  id={`param-${p.id}`}
                  type="range"
                  min={p.min ?? 0}
                  max={p.max ?? 100}
                  step={step}
                  value={val}
                  aria-label={`${p.label} parameter slider`}
                  onChange={(e) =>
                    setParamValues((prev) => ({
                      ...prev,
                      [p.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full cursor-pointer my-1"
                />
                <div
                  className="flex items-baseline justify-between gap-3 text-xs leading-snug"
                  style={{ color: 'var(--ink-3)' }}
                >
                  <span>{p.description}</span>
                  <span className="font-mono shrink-0">
                    {p.min}–{p.max} {p.unit}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {widget?.explanation && (
          <div className="editorial-frame text-xs sm:text-sm leading-relaxed">
            <strong style={{ color: 'var(--ink)' }}>
              {t.microsite.readingModelLabel}
            </strong>{' '}
            {widget.explanation}
          </div>
        )}
      </div>
    </div>
  );
};
