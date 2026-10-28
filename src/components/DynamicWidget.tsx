import React, { useState, useEffect, useMemo } from 'react';
import { MicrositeWidget } from '../types';
import {
  Sliders,
  RotateCcw,
  Clock,
  Activity,
  GitBranch,
  Scale,
  ChevronRight,
} from 'lucide-react';

interface Props {
  widget: MicrositeWidget;
  accentColor: string;
}

export const DynamicWidget: React.FC<Props> = ({ widget, accentColor }) => {
  // 1. State for 'simulation' parameters
  const defaultParamMap = useMemo(() => {
    const map: Record<string, number> = {};
    (widget.parameters || []).forEach((p) => {
      map[p.id] = p.defaultValue;
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
      widget.events && widget.events.length > 0
        ? Math.min(3, widget.events.length - 1)
        : 0
    );
  }, [widget]);

  // 3. State for 'system-explorer' impulse & stage selection
  const [systemImpulse, setSystemImpulse] = useState<number>(35);
  const [selectedStageIdx, setSelectedStageIdx] = useState<number>(0);

  // 4. State for 'tradeoff-lab' weights
  const [criteriaWeights, setCriteriaWeights] = useState<Record<string, number>>(
    {}
  );
  useEffect(() => {
    const w: Record<string, number> = {};
    (widget.criteria || []).forEach((c) => {
      w[c.id] = c.defaultWeight;
    });
    setCriteriaWeights(w);
  }, [widget]);

  // Render 'timeline' widget (for biographies, historical topics, evolutions)
  if (
    widget.widgetType === 'timeline' &&
    widget.events &&
    widget.events.length > 0
  ) {
    const events = widget.events;
    const current = events[activeEventIdx] || events[0];

    return (
      <div className="rounded-2xl border border-white/10 bg-[#101420]/90 overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/15"
              style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
            >
              <Clock className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Interactive Chronology & Impact Scrubber
              </span>
              <h3 className="text-sm font-semibold text-white">
                {widget.title}
              </h3>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300">
            Milestone {activeEventIdx + 1} of {events.length}
          </span>
        </div>

        <div className="p-5 space-y-5">
          <p className="text-xs sm:text-sm text-slate-300">
            {widget.subtitle || widget.explanation}
          </p>

          {/* Interactive Impact Bar & Scrubber */}
          <div className="bg-[#0b0e17] border border-white/10 rounded-xl p-4">
            <div className="grid grid-cols-5 gap-2 items-end h-28 pt-4 px-2">
              {events.map((ev, idx) => {
                const isSelected = idx === activeEventIdx;
                const heightPct = Math.max(22, Math.min(100, ev.impactScore || 70));
                return (
                  <button
                    key={`${ev.year}-${idx}`}
                    type="button"
                    onClick={() => setActiveEventIdx(idx)}
                    className="group flex flex-col items-center justify-end h-full cursor-pointer focus:outline-none"
                  >
                    <span
                      className={`text-[10px] font-mono mb-1 transition ${
                        isSelected
                          ? 'text-white font-semibold'
                          : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    >
                      {ev.impactScore}%
                    </span>
                    <div
                      className="w-full max-w-[44px] rounded-t-lg transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: isSelected
                          ? accentColor
                          : 'rgba(148, 163, 184, 0.22)',
                        boxShadow: isSelected
                          ? `0 0 20px ${accentColor}66`
                          : 'none',
                      }}
                    />
                  </button>
                );
              })}
            </div>

            {/* Year Pills */}
            <div className="grid grid-cols-5 gap-2 pt-2 border-t border-white/10 mt-1">
              {events.map((ev, idx) => {
                const isSelected = idx === activeEventIdx;
                return (
                  <button
                    key={`pill-${ev.year}-${idx}`}
                    type="button"
                    onClick={() => setActiveEventIdx(idx)}
                    className={`py-1.5 px-1 rounded-lg text-center font-mono text-xs transition cursor-pointer ${
                      isSelected
                        ? 'bg-white/15 text-white font-semibold border border-white/25'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {ev.year}
                  </button>
                );
              })}
            </div>

            {/* Range slider for smooth scrubbing */}
            <div className="mt-4 flex items-center gap-3">
              <span className="text-[11px] font-mono text-slate-400">Scrub:</span>
              <input
                type="range"
                min={0}
                max={events.length - 1}
                step={1}
                value={activeEventIdx}
                onChange={(e) => setActiveEventIdx(Number(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Active Milestone Card */}
          <div className="rounded-xl border border-white/15 bg-white/[0.03] p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${accentColor}25`,
                    color: accentColor,
                  }}
                >
                  {current.year}
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                  {current.domainTag}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Historical Leverage: <strong className="text-white">{current.impactScore}/100</strong>
              </span>
            </div>

            <h4 className="text-base font-semibold text-white">
              {current.title}
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
              {current.summary}
            </p>
            <div className="pt-2 border-t border-white/10 text-xs text-indigo-200/90 flex items-start gap-2">
              <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-white">Deeper Significance:</strong>{' '}
                {current.deeperInsight}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render 'system-explorer' widget
  if (
    widget.widgetType === 'system-explorer' &&
    widget.stages &&
    widget.stages.length > 0
  ) {
    const stages = widget.stages;
    const activeStage = stages[selectedStageIdx] || stages[0];

    return (
      <div className="rounded-2xl border border-white/10 bg-[#101420]/90 overflow-hidden shadow-2xl">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/15"
              style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
            >
              <GitBranch className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Interactive System & Perturbation Lab
              </span>
              <h3 className="text-sm font-semibold text-white">
                {widget.title}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300">
            {widget.subtitle || widget.explanation}
          </p>

          <div className="p-3.5 rounded-xl bg-[#0b0e17] border border-white/10">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-200">
                System Drive / Perturbation Impulse
              </span>
              <span className="font-mono font-semibold text-indigo-300">
                {systemImpulse > 0 ? `+${systemImpulse}%` : `${systemImpulse}%`}
              </span>
            </div>
            <input
              type="range"
              min={-80}
              max={100}
              step={5}
              value={systemImpulse}
              onChange={(e) => setSystemImpulse(Number(e.target.value))}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {stages.map((st, idx) => {
              const computed = Math.max(
                0,
                Math.min(
                  100,
                  Math.round(st.baseValue + (systemImpulse * st.sensitivity) / 2)
                )
              );
              const isSelected = idx === selectedStageIdx;
              return (
                <button
                  key={st.id || idx}
                  type="button"
                  onClick={() => setSelectedStageIdx(idx)}
                  className={`p-3.5 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-indigo-400/70 bg-indigo-950/35'
                      : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-semibold text-white">
                      {idx + 1}. {st.name}
                    </span>
                    <span className="font-mono text-indigo-300">
                      {computed}%
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mb-2">
                    {st.role}
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${computed}%`,
                        backgroundColor: accentColor,
                      }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          {activeStage && (
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-slate-200">
              <div className="font-semibold text-white mb-1">
                {activeStage.name} — {activeStage.metricLabel}
              </div>
              <p className="text-slate-300">{activeStage.mechanism}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Render 'tradeoff-lab' widget
  if (
    widget.widgetType === 'tradeoff-lab' &&
    widget.criteria &&
    widget.options &&
    widget.options.length > 0
  ) {
    const criteria = widget.criteria;
    const rankedOptions = [...widget.options]
      .map((opt) => {
        let weightedSum = 0;
        let totalWeight = 0;
        criteria.forEach((c, idx) => {
          const w = criteriaWeights[c.id] ?? c.defaultWeight ?? 50;
          const s = opt.scores[idx] ?? 70;
          weightedSum += w * s;
          totalWeight += w;
        });
        const composite =
          totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 70;
        return { ...opt, composite };
      })
      .sort((a, b) => b.composite - a.composite);

    return (
      <div className="rounded-2xl border border-white/10 bg-[#101420]/90 overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <span
              className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/15"
              style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
            >
              <Scale className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Interactive Trade-off & Priority Matrix
              </span>
              <h3 className="text-sm font-semibold text-white">
                {widget.title}
              </h3>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs sm:text-sm text-slate-300">
            {widget.subtitle || widget.explanation}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[#0b0e17] p-3.5 rounded-xl border border-white/10">
            {criteria.map((c) => {
              const val = criteriaWeights[c.id] ?? c.defaultWeight;
              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">{c.label}</span>
                    <span className="font-mono text-indigo-300">{val}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={val}
                    onChange={(e) =>
                      setCriteriaWeights((prev) => ({
                        ...prev,
                        [c.id]: Number(e.target.value),
                      }))
                    }
                    className="w-full accent-indigo-500 cursor-pointer"
                  />
                </div>
              );
            })}
          </div>

          <div className="space-y-2.5">
            {rankedOptions.map((opt, idx) => (
              <div
                key={opt.name}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02]"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-white">
                      #{idx + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">
                      {opt.name}
                    </span>
                    <span className="text-xs text-slate-400 hidden sm:inline">
                      · {opt.tagline}
                    </span>
                  </div>
                  <span
                    className="text-sm font-mono font-bold"
                    style={{ color: accentColor }}
                  >
                    {opt.composite}/100
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${opt.composite}%`,
                      backgroundColor: accentColor,
                    }}
                  />
                </div>
                <p className="text-xs text-slate-300">{opt.summary}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Default / 'simulation' widget: Interactive Parameter Lab + Live SVG Response Curve
  const params = widget.parameters || [];
  const p0 = params[0] ? (paramValues[params[0].id] ?? params[0].defaultValue) : 1;
  const p1 = params[1] ? (paramValues[params[1].id] ?? params[1].defaultValue) : 1;
  const p2 = params[2] ? (paramValues[params[2].id] ?? params[2].defaultValue) : 1;

  // Normalize each parameter to [0, 1] for curve synthesis
  const norm = (idx: number) => {
    const p = params[idx];
    if (!p) return 0.5;
    const v = paramValues[p.id] ?? p.defaultValue;
    return Math.max(0, Math.min(1, (v - p.min) / (p.max - p.min || 1)));
  };

  const n0 = norm(0);
  const n1 = norm(1);
  const n2 = norm(2);

  // Compute interactive curve points and summary metric
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
      const formula = widget.formulaType || 'resonance-peak';

      for (let i = 0; i <= N; i++) {
        const t = i / N; // 0..1
        let yNorm = 0.5;

        if (formula === 'harmonic-wave') {
          // CHSH / wave interference curve
          const phase = t * Math.PI * 2;
          const visibility = 0.5 + 0.5 * n1;
          const eff = 0.6 + 0.4 * n2;
          yNorm =
            0.5 +
            0.44 * visibility * eff * Math.cos(phase - n0 * Math.PI);
        } else if (formula === 'saturation-logistic') {
          // Taylor rule / disinflation path or logistic saturation
          const steepness = 2.5 + n0 * 4.5;
          const offset = 0.25 + (1 - n1) * 0.4;
          const asym = 0.2 + 0.65 * (1 - 0.5 * n2);
          yNorm =
            asym +
            (0.88 - asym) * Math.exp(-steepness * t * (0.6 + offset));
        } else if (formula === 'exponential-growth') {
          const rate = 1.2 + n0 * 3.2 - n1 * 1.1;
          yNorm = Math.min(
            0.95,
            0.12 + 0.82 * ((Math.exp(rate * t) - 1) / (Math.exp(3.2) - 1)) * (0.6 + 0.4 * n2)
          );
        } else if (formula === 'inverse-power') {
          const alpha = 0.8 + n0 * 2.2;
          yNorm = (0.9 * (0.5 + 0.5 * n1)) / Math.pow(1 + 3.5 * t, alpha * (0.7 + 0.3 * n2));
        } else {
          // 'resonance-peak' / attention distribution / gaussian bell
          const center = 0.25 + n0 * 0.5;
          const sharpness = 6 + (1 - n0) * 28 + n2 * 8;
          const base = 0.08 + 0.15 * n1;
          yNorm =
            base +
            (0.92 - base) * Math.exp(-sharpness * Math.pow(t - center, 2));
        }

        const clampedY = Math.max(0.05, Math.min(0.96, yNorm));
        const px = padX + t * plotW;
        const py = padY + (1 - clampedY) * plotH;
        pts.push([px, py]);
      }

      const d = pts
        .map(([x, y], idx) => `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`)
        .join(' ');
      const area = `${d} L ${(padX + plotW).toFixed(1)} ${(padY + plotH).toFixed(
        1
      )} L ${padX.toFixed(1)} ${(padY + plotH).toFixed(1)} Z`;

      // Compute domain-meaningful headline metric
      let rawMetric = 0;
      if (widget.formulaType === 'harmonic-wave') {
        // CHSH S-value
        const angleRad = (p0 * Math.PI) / 180;
        const vis = p1 / 100;
        const eff = p2 / 100;
        rawMetric =
          Math.abs(3 * Math.cos(2 * angleRad) - Math.cos(6 * angleRad)) *
          vis *
          (0.85 + 0.15 * eff);
      } else if (
        widget.outputMetricUnit === '%' &&
        params[0]?.id === 'inflation'
      ) {
        // Taylor Rule prescribed nominal rate: i = r* + pi + 0.5*(pi - 2) + 0.5*(gap)
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
      const thresholds = widget.regimeThresholds || {
        lowLabel: 'Low-Intensity Regime',
        midLabel: 'Balanced Equilibrium Regime',
        highLabel: 'High-Gain / Critical Regime',
      };
      const regime =
        compositeScore < 0.36
          ? thresholds.lowLabel
          : compositeScore < 0.68
          ? thresholds.midLabel
          : thresholds.highLabel;

      return {
        pointsPath: d,
        areaPath: area,
        metricDisplay: rawMetric.toFixed(2),
        regimeLabel: regime,
        markerX: mx,
        markerY: my,
      };
    }, [n0, n1, n2, p0, p1, p2, params, widget]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101420]/90 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/15"
            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
          >
            <Sliders className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Interactive Dynamic Simulation
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                Live Model
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white">{widget.title}</h3>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setParamValues(defaultParamMap)}
          className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 transition cursor-pointer"
          title="Reset parameters to default values"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </button>
      </div>

      <div className="p-5 space-y-5">
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          {widget.subtitle}
        </p>

        {/* Live Plotter Canvas */}
        <div className="rounded-xl border border-white/10 bg-[#0b0e17] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-mono text-slate-300">
                {widget.outputMetricLabel || 'System Response Output'}:
              </span>
              <span
                className="text-base font-mono font-bold"
                style={{ color: accentColor }}
              >
                {metricDisplay}{' '}
                <span className="text-xs font-normal text-slate-400">
                  {widget.outputMetricUnit || ''}
                </span>
              </span>
            </div>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-indigo-200">
              {regimeLabel}
            </span>
          </div>

          <svg
            viewBox="0 0 560 175"
            className="w-full h-40 overflow-visible"
          >
            <defs>
              <linearGradient id="simAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={accentColor} stopOpacity="0.38" />
                <stop offset="100%" stopColor={accentColor} stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal reference lines */}
            <line
              x1="24"
              y1="45"
              x2="536"
              y2="45"
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />
            <line
              x1="24"
              y1="90"
              x2="536"
              y2="90"
              stroke="rgba(255,255,255,0.09)"
              strokeDasharray="3 5"
            />
            <line
              x1="24"
              y1="135"
              x2="536"
              y2="135"
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4 4"
            />

            {/* Area & Line */}
            <path d={areaPath} fill="url(#simAreaGrad)" />
            <path
              d={pointsPath}
              fill="none"
              stroke={accentColor}
              strokeWidth="2.75"
              strokeLinecap="round"
            />

            {/* Active operating point marker */}
            <line
              x1={markerX}
              y1={20}
              x2={markerX}
              y2={155}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="2 3"
            />
            <circle
              cx={markerX}
              cy={markerY}
              r="6"
              fill={accentColor}
              stroke="#ffffff"
              strokeWidth="2"
            />
          </svg>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-white/5">
            <span>X: {widget.xAxisLabel || 'Control Variable Domain'}</span>
            <span>Y: {widget.yAxisLabel || 'Response Amplitude'}</span>
          </div>
        </div>

        {/* Interactive Parameter Sliders */}
        <div className="grid grid-cols-1 gap-3.5">
          {params.map((p) => {
            const val = paramValues[p.id] ?? p.defaultValue;
            return (
              <div
                key={p.id}
                className="p-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:border-white/20 transition"
              >
                <div className="flex items-center justify-between mb-1">
                  <label
                    htmlFor={`param-${p.id}`}
                    className="text-xs sm:text-sm font-medium text-white"
                  >
                    {p.label}
                  </label>
                  <span
                    className="text-xs sm:text-sm font-mono font-semibold px-2 py-0.5 rounded bg-white/5 border border-white/10"
                    style={{ color: accentColor }}
                  >
                    {val} {p.unit}
                  </span>
                </div>
                <input
                  id={`param-${p.id}`}
                  type="range"
                  min={p.min}
                  max={p.max}
                  step={p.step}
                  value={val}
                  onChange={(e) =>
                    setParamValues((prev) => ({
                      ...prev,
                      [p.id]: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-indigo-500 cursor-pointer my-1"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{p.description}</span>
                  <span className="font-mono shrink-0 ml-2">
                    [{p.min} – {p.max} {p.unit}]
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Widget Takeaway Footer */}
        <div className="text-xs text-slate-400 bg-white/[0.02] border border-white/5 rounded-xl p-3.5 leading-relaxed">
          <strong className="text-slate-200">How to read this widget:</strong>{' '}
          {widget.explanation}
        </div>
      </div>
    </div>
  );
};
