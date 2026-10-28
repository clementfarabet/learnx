import React, { useState } from 'react';
import { MicrositeIllustration, IllustrationNode } from '../types';
import { Sparkles, Eye, Layers } from 'lucide-react';

interface Props {
  illustration: MicrositeIllustration;
  accentColor: string;
}

const GROUP_STYLES: Record<
  IllustrationNode['group'],
  { ring: string; badge: string; dot: string; label: string }
> = {
  input: {
    ring: 'border-emerald-400/60 bg-emerald-950/80 text-emerald-100',
    badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    dot: '#10b981',
    label: 'Input / Driver',
  },
  core: {
    ring: 'border-indigo-400/70 bg-indigo-950/85 text-indigo-100',
    badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    dot: '#6366f1',
    label: 'Core Mechanism',
  },
  output: {
    ring: 'border-amber-400/70 bg-amber-950/85 text-amber-100',
    badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    dot: '#f59e0b',
    label: 'Outcome / Synthesis',
  },
  context: {
    ring: 'border-sky-400/60 bg-sky-950/80 text-sky-100',
    badge: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    dot: '#38bdf8',
    label: 'Context / Anchor',
  },
};

export const InteractiveIllustration: React.FC<Props> = ({
  illustration,
  accentColor,
}) => {
  const nodes = illustration.nodes || [];
  const [selectedId, setSelectedId] = useState<string>(nodes[0]?.id || '');
  const [showCustomSvg, setShowCustomSvg] = useState<boolean>(false);

  const activeNode =
    nodes.find((n) => n.id === selectedId) || nodes[0] || null;

  const nodeMap = new Map<string, IllustrationNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  return (
    <div className="rounded-2xl border border-white/10 bg-[#101420]/90 overflow-hidden shadow-2xl">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-white/10 bg-white/[0.02]">
        <div className="flex items-center gap-2.5">
          <span
            className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-white/15"
            style={{ backgroundColor: `${accentColor}22`, color: accentColor }}
          >
            <Eye className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
                Interactive Concept Illustration
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-300 border border-white/10">
                {nodes.length} Inspectable Nodes
              </span>
            </div>
            <h3 className="text-sm font-semibold text-white">
              {illustration.title}
            </h3>
          </div>
        </div>

        {illustration.svgCode && (
          <button
            type="button"
            onClick={() => setShowCustomSvg((v) => !v)}
            className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            {showCustomSvg ? 'Interactive Node Map' : 'AI Vector Artwork'}
          </button>
        )}
      </div>

      {/* Canvas Area */}
      <div className="relative h-[300px] sm:h-[320px] w-full bg-gradient-to-b from-[#0b0e17] via-[#101626] to-[#0c101b] overflow-hidden select-none">
        {/* Subtle decorative background geometry based on visualTheme */}
        <svg
          viewBox="0 0 800 320"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <radialGradient id="illGlow" cx="50%" cy="50%" r="55%">
              <stop offset="0%" stopColor={accentColor} stopOpacity="0.18" />
              <stop offset="65%" stopColor="#6366f1" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </radialGradient>
            <pattern
              id="illGrid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="rgba(255,255,255,0.035)"
                strokeWidth="1"
              />
            </pattern>
            <marker
              id="arrowHead"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(148,163,184,0.65)" />
            </marker>
          </defs>

          <rect width="800" height="320" fill="url(#illGrid)" />
          <ellipse cx="400" cy="160" rx="340" ry="145" fill="url(#illGlow)" />

          {illustration.visualTheme === 'orbital' && (
            <g stroke="rgba(255,255,255,0.07)" fill="none">
              <ellipse cx="400" cy="160" rx="260" ry="110" strokeDasharray="4 6" />
              <ellipse cx="400" cy="160" rx="165" ry="70" />
              <circle cx="400" cy="160" r="38" stroke="rgba(99,102,241,0.2)" />
            </g>
          )}

          {illustration.visualTheme === 'portrait-constellation' && (
            <g stroke="rgba(245,158,11,0.12)" fill="none">
              <circle cx="400" cy="160" r="125" strokeDasharray="3 5" />
              <circle cx="400" cy="160" r="85" />
              <line x1="120" y1="160" x2="680" y2="160" stroke="rgba(255,255,255,0.05)" />
            </g>
          )}

          {illustration.visualTheme === 'equilibrium' && (
            <g stroke="rgba(16,185,129,0.1)" fill="none">
              <path d="M 90 250 Q 400 50 710 250" strokeWidth="1.5" strokeDasharray="6 6" />
              <path d="M 90 70 Q 400 270 710 70" strokeWidth="1.5" strokeDasharray="6 6" />
            </g>
          )}

          {/* Connection lines between nodes */}
          {!showCustomSvg &&
            (illustration.connections || []).map((conn, idx) => {
              const fromNode = nodeMap.get(conn.from);
              const toNode = nodeMap.get(conn.to);
              if (!fromNode || !toNode) return null;

              const x1 = (fromNode.x / 100) * 800;
              const y1 = (fromNode.y / 100) * 320;
              const x2 = (toNode.x / 100) * 800;
              const y2 = (toNode.y / 100) * 320;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2 - 14;
              const isHighlighted =
                activeNode?.id === fromNode.id || activeNode?.id === toNode.id;

              return (
                <g key={`${conn.from}-${conn.to}-${idx}`}>
                  <path
                    d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                    fill="none"
                    stroke={
                      isHighlighted
                        ? accentColor
                        : 'rgba(148, 163, 184, 0.32)'
                    }
                    strokeWidth={isHighlighted ? '2.4' : '1.5'}
                    strokeDasharray={isHighlighted ? undefined : '5 5'}
                    markerEnd="url(#arrowHead)"
                  />
                  {conn.label && (
                    <text
                      x={mx}
                      y={my - 4}
                      textAnchor="middle"
                      fill={isHighlighted ? '#e2e8f0' : '#94a3b8'}
                      fontSize="10.5"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {conn.label}
                    </text>
                  )}
                </g>
              );
            })}
        </svg>

        {showCustomSvg && illustration.svgCode ? (
          <div
            className="relative z-10 w-full h-full flex items-center justify-center p-4"
            dangerouslySetInnerHTML={{ __html: illustration.svgCode }}
          />
        ) : (
          /* Interactive Positioned Nodes */
          <div className="relative z-10 w-full h-full">
            {nodes.map((node, index) => {
              const isSelected = activeNode?.id === node.id;
              const groupStyle =
                GROUP_STYLES[node.group] || GROUP_STYLES.core;
              const clampedX = Math.max(14, Math.min(86, node.x));
              const clampedY = Math.max(18, Math.min(82, node.y));

              return (
                <button
                  key={node.id}
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  style={{
                    left: `${clampedX}%`,
                    top: `${clampedY}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  className={`group absolute px-3 py-2 rounded-xl border text-left transition-all duration-200 cursor-pointer backdrop-blur-md ${
                    groupStyle.ring
                  } ${
                    isSelected
                      ? 'scale-105 shadow-[0_0_25px_rgba(99,102,241,0.4)] ring-2 ring-white/40 z-20'
                      : 'opacity-85 hover:opacity-100 hover:scale-102 z-10'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: groupStyle.dot }}
                    />
                    <span className="text-[10px] font-mono opacity-75">
                      0{index + 1}
                    </span>
                    <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
                      {node.label}
                    </span>
                  </div>
                  {node.sublabel && (
                    <div className="text-[10px] font-mono text-slate-300/80 mt-0.5 truncate max-w-[165px]">
                      {node.sublabel}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Node Inspector Bar */}
      {activeNode && (
        <div className="px-5 py-4 bg-[#0c101a] border-t border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                  (GROUP_STYLES[activeNode.group] || GROUP_STYLES.core).badge
                }`}
              >
                {(GROUP_STYLES[activeNode.group] || GROUP_STYLES.core).label}
              </span>
              <span className="text-sm font-semibold text-white">
                {activeNode.label}
              </span>
              {activeNode.sublabel && (
                <span className="text-xs font-mono text-indigo-300/90">
                  · {activeNode.sublabel}
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              Click any node above to inspect
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {activeNode.detail}
          </p>
        </div>
      )}
    </div>
  );
};
