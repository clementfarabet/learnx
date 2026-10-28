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

export const InteractiveIllustration: React.FC<Props> = ({ illustration }) => {
  const nodes = Array.isArray(illustration?.nodes) ? illustration.nodes : [];

  const nodeMap = new Map<string, IllustrationNode>();
  nodes.forEach((n) => {
    if (n && n.id) nodeMap.set(n.id, n);
  });

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

      {/* Static Vector Diagram Canvas */}
      <div
        className="relative h-[260px] sm:h-[280px] w-full overflow-hidden"
        style={{ backgroundColor: 'var(--paper)' }}
      >
        <svg
          viewBox="0 0 800 280"
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="arrowHead"
              viewBox="0 0 10 10"
              refX="7"
              refY="5"
              markerWidth="5"
              markerHeight="5"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--ink-3)" />
            </marker>
          </defs>

          {/* Subtle architectural guide lines */}
          {illustration?.visualTheme === 'orbital' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <ellipse cx="400" cy="140" rx="250" ry="95" strokeDasharray="4 6" />
              <ellipse cx="400" cy="140" rx="150" ry="58" />
            </g>
          )}

          {illustration?.visualTheme === 'portrait-constellation' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <circle cx="400" cy="140" r="105" strokeDasharray="3 5" />
              <line x1="120" y1="140" x2="680" y2="140" />
            </g>
          )}

          {illustration?.visualTheme === 'equilibrium' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <path d="M 90 220 Q 400 45 710 220" strokeDasharray="5 5" />
              <path d="M 90 60 Q 400 235 710 60" strokeDasharray="5 5" />
            </g>
          )}

          {/* Connection lines between nodes */}
          {(illustration?.connections || []).map((conn, idx) => {
            const fromNode = nodeMap.get(conn.from);
            const toNode = nodeMap.get(conn.to);
            if (!fromNode || !toNode) return null;

            const fx = Number.isFinite(Number(fromNode.x)) ? Number(fromNode.x) : 25;
            const fy = Number.isFinite(Number(fromNode.y)) ? Number(fromNode.y) : 50;
            const tx = Number.isFinite(Number(toNode.x)) ? Number(toNode.x) : 75;
            const ty = Number.isFinite(Number(toNode.y)) ? Number(toNode.y) : 50;

            const x1 = (fx / 100) * 800;
            const y1 = (fy / 100) * 280;
            const x2 = (tx / 100) * 800;
            const y2 = (ty / 100) * 280;
            const mx = (x1 + x2) / 2;
            const my = (y1 + y2) / 2 - 12;

            return (
              <g key={`${conn.from}-${conn.to}-${idx}`}>
                <path
                  d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                  fill="none"
                  stroke="var(--ink-3)"
                  strokeOpacity="0.55"
                  strokeWidth="1.5"
                  strokeDasharray="4 4"
                  markerEnd="url(#arrowHead)"
                />
                {conn.label && (
                  <text
                    x={mx}
                    y={my - 4}
                    textAnchor="middle"
                    fill="var(--ink-2)"
                    fontSize="10"
                    fontFamily="var(--mono)"
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        <div className="relative z-10 w-full h-full">
          {nodes.map((node, index) => {
            const fallbackX = 20 + ((index * 22) % 65);
            const fallbackY = index % 2 === 0 ? 32 : 68;
            const rawX = Number.isFinite(Number(node.x))
              ? Number(node.x)
              : fallbackX;
            const rawY = Number.isFinite(Number(node.y))
              ? Number(node.y)
              : fallbackY;
            const clampedX = Math.max(15, Math.min(85, rawX));
            const clampedY = Math.max(18, Math.min(82, rawY));

            return (
              <div
                key={node.id || index}
                style={{
                  left: `${clampedX}%`,
                  top: `${clampedY}%`,
                  transform: 'translate(-50%, -50%)',
                  backgroundColor: 'var(--paper-2)',
                  borderColor: 'var(--rule)',
                  color: 'var(--ink)',
                }}
                className="absolute px-3 py-2 rounded-xl border text-left shadow-xs"
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent)',
                    }}
                  >
                    0{index + 1}
                  </span>
                  <span className="text-xs font-semibold tracking-tight whitespace-nowrap">
                    {node.label}
                  </span>
                </div>
                {node.sublabel && (
                  <div
                    className="text-[10px] font-mono mt-0.5 truncate max-w-[165px]"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {node.sublabel}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Static Architectural Legend (all nodes visible at a glance) */}
      {nodes.length > 0 && (
        <figcaption
          className="px-5 py-4 border-t grid grid-cols-1 sm:grid-cols-2 gap-3.5"
          style={{
            borderColor: 'var(--rule)',
            backgroundColor: 'var(--paper-2)',
          }}
        >
          {nodes.map((node, index) => (
            <div key={node.id || index} className="space-y-0.5">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-[10px] font-mono font-semibold"
                  style={{ color: 'var(--accent)' }}
                >
                  0{index + 1}
                </span>
                <span
                  className="text-xs font-semibold"
                  style={{ color: 'var(--ink)' }}
                >
                  {node.label}
                </span>
                <span
                  className="text-[10px] uppercase tracking-wider"
                  style={{ color: 'var(--ink-3)' }}
                >
                  · {GROUP_LABELS[node.group] || 'Mechanism'}
                </span>
              </div>
              <p
                className="text-xs font-serif-editorial leading-relaxed"
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
