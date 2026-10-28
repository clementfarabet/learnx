import React, { useState, useEffect } from 'react';
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
  const [selectedId, setSelectedId] = useState<string>(nodes[0]?.id || '');
  const [showCustomSvg, setShowCustomSvg] = useState<boolean>(false);

  useEffect(() => {
    setSelectedId(nodes[0]?.id || '');
    setShowCustomSvg(false);
  }, [illustration]);

  const activeNode =
    nodes.find((n) => n.id === selectedId) || nodes[0] || null;

  const nodeMap = new Map<string, IllustrationNode>();
  nodes.forEach((n) => {
    if (n && n.id) nodeMap.set(n.id, n);
  });

  return (
    <div className="surface-card overflow-hidden">
      {/* Header bar */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-3.5 border-b"
        style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--paper-2)' }}
      >
        <div>
          <span className="kicker block mb-0.5">
            Concept Diagram · {nodes.length} Inspectable Nodes
          </span>
          <h3
            className="text-base font-semibold tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            {illustration?.title || 'Concept Architecture Map'}
          </h3>
        </div>

        {illustration?.svgCode && (
          <button
            type="button"
            onClick={() => setShowCustomSvg((v) => !v)}
            className="text-xs font-medium px-3 py-1 rounded-full cursor-pointer"
            style={{
              backgroundColor: 'var(--paper)',
              border: '1px solid var(--rule)',
              color: 'var(--ink-2)',
            }}
          >
            {showCustomSvg ? 'Interactive Node Map' : 'Vector Artwork'}
          </button>
        )}
      </div>

      {/* Canvas Area */}
      <div
        className="relative h-[290px] sm:h-[310px] w-full overflow-hidden select-none"
        style={{ backgroundColor: 'var(--paper)' }}
      >
        <svg
          viewBox="0 0 800 310"
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

          {/* Subtle architectural guide rings */}
          {illustration?.visualTheme === 'orbital' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <ellipse cx="400" cy="155" rx="250" ry="105" strokeDasharray="4 6" />
              <ellipse cx="400" cy="155" rx="155" ry="65" />
            </g>
          )}

          {illustration?.visualTheme === 'portrait-constellation' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <circle cx="400" cy="155" r="115" strokeDasharray="3 5" />
              <line x1="120" y1="155" x2="680" y2="155" />
            </g>
          )}

          {illustration?.visualTheme === 'equilibrium' && (
            <g stroke="var(--rule)" fill="none" strokeWidth="1">
              <path d="M 90 240 Q 400 50 710 240" strokeDasharray="5 5" />
              <path d="M 90 70 Q 400 260 710 70" strokeDasharray="5 5" />
            </g>
          )}

          {/* Connection lines between nodes */}
          {!showCustomSvg &&
            (illustration?.connections || []).map((conn, idx) => {
              const fromNode = nodeMap.get(conn.from);
              const toNode = nodeMap.get(conn.to);
              if (!fromNode || !toNode) return null;

              const fx = Number.isFinite(Number(fromNode.x)) ? Number(fromNode.x) : 25;
              const fy = Number.isFinite(Number(fromNode.y)) ? Number(fromNode.y) : 50;
              const tx = Number.isFinite(Number(toNode.x)) ? Number(toNode.x) : 75;
              const ty = Number.isFinite(Number(toNode.y)) ? Number(toNode.y) : 50;

              const x1 = (fx / 100) * 800;
              const y1 = (fy / 100) * 310;
              const x2 = (tx / 100) * 800;
              const y2 = (ty / 100) * 310;
              const mx = (x1 + x2) / 2;
              const my = (y1 + y2) / 2 - 12;
              const isHighlighted =
                activeNode?.id === fromNode.id || activeNode?.id === toNode.id;

              return (
                <g key={`${conn.from}-${conn.to}-${idx}`}>
                  <path
                    d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
                    fill="none"
                    stroke={isHighlighted ? 'var(--accent)' : 'var(--ink-3)'}
                    strokeOpacity={isHighlighted ? '0.9' : '0.45'}
                    strokeWidth={isHighlighted ? '2' : '1.25'}
                    strokeDasharray={isHighlighted ? undefined : '4 4'}
                    markerEnd="url(#arrowHead)"
                  />
                  {conn.label && (
                    <text
                      x={mx}
                      y={my - 4}
                      textAnchor="middle"
                      fill={isHighlighted ? 'var(--ink)' : 'var(--ink-3)'}
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

        {showCustomSvg && illustration?.svgCode ? (
          <div
            className="relative z-10 w-full h-full flex items-center justify-center p-4"
            dangerouslySetInnerHTML={{ __html: illustration.svgCode }}
          />
        ) : (
          <div className="relative z-10 w-full h-full">
            {nodes.map((node, index) => {
              const isSelected = activeNode?.id === node.id;
              const fallbackX = 20 + ((index * 22) % 65);
              const fallbackY = index % 2 === 0 ? 32 : 68;
              const rawX = Number.isFinite(Number(node.x))
                ? Number(node.x)
                : fallbackX;
              const rawY = Number.isFinite(Number(node.y))
                ? Number(node.y)
                : fallbackY;
              const clampedX = Math.max(14, Math.min(86, rawX));
              const clampedY = Math.max(18, Math.min(82, rawY));

              return (
                <button
                  key={node.id || index}
                  type="button"
                  onClick={() => setSelectedId(node.id)}
                  style={{
                    left: `${clampedX}%`,
                    top: `${clampedY}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: isSelected
                      ? 'var(--paper-2)'
                      : 'var(--paper)',
                    borderColor: isSelected ? 'var(--accent)' : 'var(--rule)',
                    color: 'var(--ink)',
                  }}
                  className={`absolute px-3 py-2 rounded-xl border text-left cursor-pointer transition-transform ${
                    isSelected ? 'scale-105 z-20' : 'hover:scale-102 z-10'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor: isSelected
                          ? 'var(--accent)'
                          : 'var(--ink-3)',
                      }}
                    />
                    <span
                      className="text-[10px] font-mono"
                      style={{ color: 'var(--ink-3)' }}
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
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Node Inspector Bar */}
      {activeNode && (
        <div
          className="px-5 py-4 border-t"
          style={{
            borderColor: 'var(--rule)',
            backgroundColor: 'var(--paper-2)',
          }}
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-1">
            <div className="flex items-baseline gap-2">
              <span
                className="kicker"
                style={{ color: 'var(--accent)' }}
              >
                {GROUP_LABELS[activeNode.group] || 'Core Mechanism'}
              </span>
              <span
                className="text-sm font-semibold"
                style={{ color: 'var(--ink)' }}
              >
                {activeNode.label}
              </span>
              {activeNode.sublabel && (
                <span
                  className="text-xs font-mono"
                  style={{ color: 'var(--ink-3)' }}
                >
                  · {activeNode.sublabel}
                </span>
              )}
            </div>
            <span className="text-[11px]" style={{ color: 'var(--ink-3)' }}>
              Tap any node to inspect
            </span>
          </div>
          <p
            className="text-sm font-serif-editorial leading-relaxed"
            style={{ color: 'var(--ink-2)' }}
          >
            {activeNode.detail}
          </p>
        </div>
      )}
    </div>
  );
};
