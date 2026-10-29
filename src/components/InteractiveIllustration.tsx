import React from 'react';
import { MicrositeIllustration } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface Props {
  illustration: MicrositeIllustration;
  accentColor?: string;
}

export const InteractiveIllustration: React.FC<Props> = ({ illustration }) => {
  const { t } = useLanguage();
  const items = Array.isArray(illustration?.nodes) ? illustration.nodes : [];

  return (
    <figure className="surface-card overflow-hidden">
      {/* Header bar */}
      <div
        className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 border-b"
        style={{ borderColor: 'var(--rule)', backgroundColor: 'var(--paper-2)' }}
      >
        <div>
          <span className="kicker block mb-0.5">
            {t.microsite.diagramKicker}
          </span>
          <h3
            className="text-base font-semibold tracking-tight"
            style={{ color: 'var(--ink)' }}
          >
            {illustration?.title || t.microsite.diagramFallbackTitle}
          </h3>
        </div>
      </div>

      {/* Editorial Chronology / Step-by-Step Timeline */}
      <div
        className="px-5 py-5"
        style={{ backgroundColor: 'var(--paper)' }}
      >
        {illustration?.caption && (
          <p
            className="text-xs leading-relaxed mb-5 pb-3.5 border-b"
            style={{ color: 'var(--ink-3)', borderColor: 'var(--rule)' }}
          >
            {illustration.caption}
          </p>
        )}

        <ol className="relative ml-2">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const badgeText =
              item.sublabel || `${String(index + 1).padStart(2, '0')}`;

            return (
              <li
                key={item.id || index}
                className={`relative pl-6 ${isLast ? 'pb-1' : 'pb-6'}`}
              >
                {/* Vertical timeline spine */}
                {!isLast && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[5px] top-3 -bottom-1 w-px"
                    style={{ backgroundColor: 'var(--rule)' }}
                  />
                )}

                {/* Timeline node marker */}
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-1.5 w-[11px] h-[11px] rounded-full border-2"
                  style={{
                    backgroundColor:
                      index === 0 || isLast ? 'var(--accent)' : 'var(--paper)',
                    borderColor: 'var(--accent)',
                  }}
                />

                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent)',
                      }}
                    >
                      {badgeText}
                    </span>
                    <h4
                      className="text-sm font-semibold tracking-tight"
                      style={{ color: 'var(--ink)' }}
                    >
                      {item.label}
                    </h4>
                  </div>

                  {item.detail && (
                    <p
                      className="text-xs sm:text-sm font-serif-editorial leading-relaxed"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {item.detail}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </figure>
  );
};
