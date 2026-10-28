import React from 'react';
import { MicrositeIllustration, IllustrationNode } from '../types';

interface Props {
  illustration: MicrositeIllustration;
  accentColor?: string;
}

const GROUP_LABELS: Record<IllustrationNode['group'], string> = {
  input: 'Input · Driver',
  core: 'Core Mechanism',
  output: 'Outcome · Synthesis',
  context: 'Context · Anchor',
};

// Deterministic, non-overlapping schematic slots inside a 560x220 SVG viewBox
const SCHEMATIC_SLOTS_4: Array<{ cx: number; cy: number }> = [
  { cx: 145, cy: 58 },
  { cx: 415, cy: 58 },
  { cx: 145, cy: 162 },
  { cx: 415, cy: 162 },
];

const SCHEMATIC_SLOTS_5: Array<{ cx: number; cy: number }> = [
  { cx: 120, cy: 52 },
  { cx: 440, cy: 52 },
  { cx: 280, cy: 110 },
  { cx: 120, cy: 168 },
  { cx: 440, cy: 168 },
];

function truncateText(str: string, maxLen: number): string {
  const s = (str || '').trim();
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen - 1).trim()}…`;
}

export const InteractiveIllustration: React.FC<Props> = ({ illustration }) => {
  const rawNodes = Array.isArray(illustration?.nodes) ? illustration.nodes : [];
  const nodes = rawNodes.slice(0, 5);
  const slots = nodes.length === 5 ? SCHEMATIC_SLOTS_5 : SCHEMATIC_SLOTS_4;

  const slotMap = new Map<
    string,
    { node: IllustrationNode; index: number; cx: number; cy: number }
  >();
  nodes.forEach((n, idx) => {
    const slot = slots[idx] || SCHEMATIC_SLOTS_4[idx % 4];
    if (n && n.id) {
      slotMap.set(n.id, { node: n, index: idx, cx: slot.cx, cy: slot.cy });
    }
  });

  const boxW = 204;
  const boxH = 54;

  return (
    <figure className="surface-card overflow-hidden">
      {/* Header bar */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5 border-b"
        style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--paper-2)' }}
      >
        <div>
          <span className="kicker block mb-0.5">
            Editorial Figure &amp; Schematic Diagram
          </span>
          <h3
            className="text-base font-semibold tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            {illustration?.title || 'Conceptual Schematic'}
          </h3>
        </div>
      </div>

      {/* Deterministic Non-Overlapping Vector Schematic Canvas */}
      <div
        className="w-full px-3 py-3"
        style={{ backgroundColor: 'var(--paper)' }}
      >
        <svg
          viewBox="0 0 560 220"
          className="w-full h-auto block select-none"
          role="img"
          aria-label={illustration?.title || 'Conceptual schematic diagram'}
        >
          <defs>
            <marker
              id="schematicArrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--ink-3)" />
            </marker>
          </defs>

          {/* Subtle architectural background geometry */}
          {illustration?.visualTheme === 'orbital' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <ellipse
                cx="280"
                cy="110"
                rx="220"
                ry="82"
                strokeDasharray="4 6"
              />
              <ellipse cx="280" cy="110" rx="115" ry="44" />
            </g>
          )}

          {illustration?.visualTheme === 'portrait-constellation' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <circle
                cx="280"
                cy="110"
                r="82"
                strokeDasharray="3 5"
              />
              <line x1="70" y1="110" x2="490" y2="110" />
            </g>
          )}

          {illustration?.visualTheme === 'equilibrium' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <path d="M 70 175 Q 280 35 490 175" strokeDasharray="5 5" />
              <path d="M 70 45 Q 280 185 490 45" strokeDasharray="5 5" />
            </g>
          )}

          {(!illustration?.visualTheme ||
            illustration.visualTheme === 'architecture' ||
            illustration.visualTheme === 'network' ||
            illustration.visualTheme === 'wave') && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <rect
                x="42"
                y="24"
                width="476"
                height="172"
                rx="14"
                strokeDasharray="4 6"
              />
              <line
                x1="280"
                y1="24"
                x2="280"
                y2="196"
                strokeDasharray="3 5"
              />
            </g>
          )}

          {/* Connection arrows between schematic slots */}
          {(illustration?.connections || []).map((conn, idx) => {
            const fromSlot = slotMap.get(conn.from);
            const toSlot = slotMap.get(conn.to);
            if (!fromSlot || !toSlot) return null;

            const dx = toSlot.cx - fromSlot.cx;
            const dy = toSlot.cy - fromSlot.cy;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            // Start & end on box boundaries so arrows never cross over node text
            const padStart = Math.min(boxW / 2, boxH / 2) + 8;
            const padEnd = Math.min(boxW / 2, boxH / 2) + 10;
            const x1 = fromSlot.cx + ux * padStart;
            const y1 = fromSlot.cy + uy * padStart;
            const x2 = toSlot.cx - ux * padEnd;
            const y2 = toSlot.cy - uy * padEnd;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 6;

            return (
              <g key={`${conn.from}-${conn.to}-${idx}`}>
                <path
                  d={`M ${x1.toFixed(1)} ${y1.toFixed(1)} Q ${mx.toFixed(
                    1
                  )} ${my.toFixed(1)} ${x2.toFixed(1)} ${y2.toFixed(1)}`}
                  fill="none"
                  stroke="var(--ink-3)"
                  strokeOpacity="0.65"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  markerEnd="url(#schematicArrow)"
                />
              </g>
            );
          })}

          {/* Deterministic Node Cards */}
          {nodes.map((node, index) => {
            const slot = slots[index] || SCHEMATIC_SLOTS_4[index % 4];
            const rx = slot.cx - boxW / 2;
            const ry = slot.cy - boxH / 2;
            const titleText = truncateText(node.label || `Stage ${index + 1}`, 23);
            const subText = truncateText(
              node.sublabel || GROUP_LABELS[node.group] || 'Mechanism',
              27
            );

            return (
              <g key={node.id || index}>
                <rect
                  x={rx}
                  y={ry}
                  width={boxW}
                  height={boxH}
                  rx="11"
                  fill="var(--paper-2)"
                  stroke="var(--rule)"
                  strokeWidth="1.25"
                />
                {/* Number badge */}
                <rect
                  x={rx + 10}
                  y={ry + 10}
                  width="24"
                  height="16"
                  rx="4"
                  fill="var(--accent-soft)"
                />
                <text
                  x={rx + 22}
                  y={ry + 21.5}
                  textAnchor="middle"
                  fill="var(--accent)"
                  fontSize="10"
                  fontWeight="600"
                  fontFamily="var(--mono)"
                >
                  0{index + 1}
                </text>
                {/* Node Label */}
                <text
                  x={rx + 40}
                  y={ry + 22}
                  fill="var(--ink)"
                  fontSize="12"
                  fontWeight="600"
                  fontFamily="var(--sans)"
                >
                  {titleText}
                </text>
                {/* Node Sublabel */}
                <text
                  x={rx + 12}
                  y={ry + 41}
                  fill="var(--ink-3)"
                  fontSize="10.5"
                  fontFamily="var(--mono)"
                >
                  {subText}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Single-Column Architectural Legend (generous width inside sidebar) */}
      {nodes.length > 0 && (
        <figcaption
          className="px-5 py-3.5 border-t divide-y"
          style={{
            borderColor: 'var(--rule)',
            backgroundColor: 'var(--paper-2)',
          }}
        >
          {nodes.map((node, index) => (
            <div
              key={node.id || index}
              className="py-2.5 first:pt-0.5 last:pb-0.5 space-y-1"
              style={{ borderColor: 'var(--rule)' }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span
                    className="text-[11px] font-mono font-semibold"
                    style={{ color: 'var(--accent)' }}
                  >
                    0{index + 1}
                  </span>
                  <span
                    className="text-xs sm:text-sm font-semibold"
                    style={{ color: 'var(--ink)' }}
                  >
                    {node.label}
                  </span>
                </div>
                {node.sublabel && (
                  <span
                    className="text-[11px] font-mono px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: 'var(--paper)',
                      border: '1px solid var(--rule)',
                      color: 'var(--ink-2)',
                    }}
                  >
                    {node.sublabel}
                  </span>
                )}
              </div>
              <p
                className="text-xs sm:text-[13px] font-serif-editorial leading-relaxed"
                style={{ color: 'var(--ink-2)' }}
              >
                {node.detail}
              </p>
            </div>
          ))}
        </figcaption>
      )}
    </figure>
  );
};
