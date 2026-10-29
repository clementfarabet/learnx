import React, { useState, useEffect, useCallback } from 'react';
import { MicrositeData } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  BookOpen,
  RefreshCw,
} from 'lucide-react';

const clientIllustrationCache = new Map<string, string>();

interface Props {
  microsite: MicrositeData;
  onSelectTopic: (topic: string) => void;
}

const CARD_PALETTES = [
  {
    bg: 'rgba(254, 243, 199, 0.55)',
    border: '#f59e0b',
    badgeBg: '#fef3c7',
    badgeText: '#b45309',
    accent: '#d97706',
  },
  {
    bg: 'rgba(224, 242, 254, 0.55)',
    border: '#38bdf8',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
    accent: '#0284c7',
  },
  {
    bg: 'rgba(237, 233, 254, 0.55)',
    border: '#a78bfa',
    badgeBg: '#ede9fe',
    badgeText: '#6d28d9',
    accent: '#7c3aed',
  },
  {
    bg: 'rgba(220, 252, 231, 0.55)',
    border: '#34d399',
    badgeBg: '#dcfce7',
    badgeText: '#047857',
    accent: '#059669',
  },
];

// Hand-drawn-style SVG spot illustrations for the 4 Discovery Map stops
function NodeSpotDrawing({ index, accent }: { index: number; accent: string }) {
  const kind = index % 4;
  if (kind === 0) {
    // Magnifying glass & curious star
    return (
      <svg viewBox="0 0 80 80" className="w-14 h-14 shrink-0">
        <circle cx="40" cy="40" r="36" fill={accent} fillOpacity="0.12" />
        <circle
          cx="35"
          cy="35"
          r="16"
          fill="#fff"
          stroke={accent}
          strokeWidth="3.5"
        />
        <line
          x1="47"
          y1="47"
          x2="62"
          y2="62"
          stroke={accent}
          strokeWidth="5"
          strokeLinecap="round"
        />
        <path
          d="M35 25 L37.5 32 L45 32.5 L39 37 L41 44 L35 40 L29 44 L31 37 L25 32.5 L32.5 32 Z"
          fill="#f59e0b"
        />
      </svg>
    );
  }
  if (kind === 1) {
    // Playful interlocking gears & magic spark
    return (
      <svg viewBox="0 0 80 80" className="w-14 h-14 shrink-0">
        <circle cx="40" cy="40" r="36" fill={accent} fillOpacity="0.12" />
        <circle
          cx="34"
          cy="42"
          r="14"
          fill="#fff"
          stroke={accent}
          strokeWidth="3.5"
          strokeDasharray="6 3"
        />
        <circle cx="34" cy="42" r="5" fill={accent} />
        <circle
          cx="54"
          cy="28"
          r="9"
          fill="#fef3c7"
          stroke="#d97706"
          strokeWidth="3"
          strokeDasharray="4 2.5"
        />
        <circle cx="54" cy="28" r="3" fill="#d97706" />
      </svg>
    );
  }
  if (kind === 2) {
    // Glowing lightbulb / idea beam
    return (
      <svg viewBox="0 0 80 80" className="w-14 h-14 shrink-0">
        <circle cx="40" cy="40" r="36" fill={accent} fillOpacity="0.12" />
        <path
          d="M40 18 C29 18 22 26 22 35 C22 42 27 47 31 51 L49 51 C53 47 58 42 58 35 C58 26 51 18 40 18 Z"
          fill="#fef08a"
          stroke="#ca8a04"
          strokeWidth="3"
        />
        <rect
          x="32"
          y="53"
          width="16"
          height="7"
          rx="3"
          fill="#94a3b8"
          stroke="#475569"
          strokeWidth="2"
        />
        <line x1="40" y1="8" x2="40" y2="13" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
        <line x1="15" y1="22" x2="19" y2="25" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
        <line x1="65" y1="22" x2="61" y2="25" stroke="#eab308" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  // Rocket / blooming star discovery
  return (
    <svg viewBox="0 0 80 80" className="w-14 h-14 shrink-0">
      <circle cx="40" cy="40" r="36" fill={accent} fillOpacity="0.12" />
      <path
        d="M40 16 C48 24 52 36 52 48 L28 48 C28 36 32 24 40 16 Z"
        fill="#fff"
        stroke={accent}
        strokeWidth="3.2"
      />
      <circle cx="40" cy="35" r="5.5" fill="#38bdf8" stroke={accent} strokeWidth="2" />
      <path d="M28 42 L20 52 L28 50 Z" fill="#f43f5e" />
      <path d="M52 42 L60 52 L52 50 Z" fill="#f43f5e" />
      <path
        d="M34 50 Q40 65 46 50"
        fill="#fb923c"
        stroke="#ea580c"
        strokeWidth="2"
      />
    </svg>
  );
}

// Large Storybook Hero Illustration at the top of the page
function StorybookHeroDrawing({
  entityType,
  visualTheme,
}: {
  entityType: MicrositeData['entityType'];
  visualTheme?: string;
}) {
  if (entityType === 'person' || visualTheme === 'portrait-constellation') {
    // Inventor's desk, open storybook, quill/compass, and stars
    return (
      <svg
        viewBox="0 0 320 180"
        className="w-full max-w-[290px] h-auto mx-auto select-none"
        role="img"
        aria-label="Storybook illustration of an inventor's notebook and stars"
      >
        <rect x="10" y="12" width="300" height="156" rx="24" fill="#fef3c7" fillOpacity="0.45" />
        {/* Floating stars */}
        <circle cx="52" cy="42" r="5" fill="#f59e0b" />
        <circle cx="268" cy="38" r="6" fill="#ec4899" />
        <circle cx="242" cy="132" r="4.5" fill="#8b5cf6" />
        <path
          d="M85 32 L88 40 L96 41 L90 46 L92 54 L85 49 L78 54 L80 46 L74 41 L82 40 Z"
          fill="#fbbf24"
        />
        {/* Open Illustrated Book */}
        <path
          d="M75 130 Q118 118 160 132 Q202 118 245 130 L245 66 Q202 54 160 68 Q118 54 75 66 Z"
          fill="#ffffff"
          stroke="#d97706"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <line x1="160" y1="68" x2="160" y2="132" stroke="#d97706" strokeWidth="3" />
        {/* Friendly drawings on the book pages */}
        <circle cx="118" cy="94" r="14" fill="#fde68a" stroke="#d97706" strokeWidth="2.5" />
        <circle cx="113" cy="91" r="2" fill="#78350f" />
        <circle cx="123" cy="91" r="2" fill="#78350f" />
        <path d="M113 98 Q118 103 123 98" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
        {/* Gears & music notes rising from right page */}
        <circle
          cx="198"
          cy="94"
          r="13"
          fill="#ede9fe"
          stroke="#7c3aed"
          strokeWidth="2.8"
          strokeDasharray="5 3"
        />
        <circle cx="198" cy="94" r="4" fill="#7c3aed" />
        <path
          d="M215 48 L215 28 L232 24 L232 44"
          fill="none"
          stroke="#ec4899"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="212" cy="48" r="4.5" fill="#ec4899" />
        <circle cx="229" cy="44" r="4.5" fill="#ec4899" />
      </svg>
    );
  }

  if (visualTheme === 'orbital' || entityType === 'phenomenon') {
    // Magical twin stars & planetary orbits
    return (
      <svg
        viewBox="0 0 320 180"
        className="w-full max-w-[290px] h-auto mx-auto select-none"
        role="img"
        aria-label="Storybook illustration of twin stars dancing in space"
      >
        <rect x="10" y="12" width="300" height="156" rx="24" fill="#e0f2fe" fillOpacity="0.45" />
        <ellipse
          cx="160"
          cy="90"
          rx="112"
          ry="48"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="2.5"
          strokeDasharray="6 6"
        />
        {/* Rainbow connection wave between the twins */}
        <path
          d="M78 90 Q119 55 160 90 T242 90"
          fill="none"
          stroke="#a855f7"
          strokeWidth="3.5"
          strokeLinecap="round"
        />
        {/* Left Twin Star Character */}
        <circle cx="78" cy="90" r="24" fill="#fef08a" stroke="#eab308" strokeWidth="3.5" />
        <circle cx="71" cy="85" r="2.8" fill="#713f12" />
        <circle cx="85" cy="85" r="2.8" fill="#713f12" />
        <path d="M71 95 Q78 102 85 95" fill="none" stroke="#713f12" strokeWidth="2.5" strokeLinecap="round" />
        {/* Right Twin Star Character */}
        <circle cx="242" cy="90" r="24" fill="#fed7aa" stroke="#f97316" strokeWidth="3.5" />
        <circle cx="235" cy="85" r="2.8" fill="#7c2d12" />
        <circle cx="249" cy="85" r="2.8" fill="#7c2d12" />
        <path d="M235 95 Q242 102 249 95" fill="none" stroke="#7c2d12" strokeWidth="2.5" strokeLinecap="round" />
        {/* Center Sparkle */}
        <path
          d="M160 66 L165 82 L181 87 L165 92 L160 108 L155 92 L139 87 L155 82 Z"
          fill="#ec4899"
        />
      </svg>
    );
  }

  // Default: Friendly Robot/Owl Explorer with Flashlights & Building Blocks
  return (
    <svg
      viewBox="0 0 320 180"
      className="w-full max-w-[290px] h-auto mx-auto select-none"
      role="img"
      aria-label="Storybook illustration of a friendly explorer and glowing idea blocks"
    >
      <rect x="10" y="12" width="300" height="156" rx="24" fill="#ede9fe" fillOpacity="0.45" />
      {/* Flashlight beam */}
      <polygon
        points="135,92 265,42 265,142"
        fill="#fef08a"
        fillOpacity="0.65"
      />
      {/* Friendly little robot explorer on the left */}
      <line x1="95" y1="42" x2="95" y2="58" stroke="#6d28d9" strokeWidth="4" strokeLinecap="round" />
      <circle cx="95" cy="38" r="6" fill="#ec4899" />
      <rect
        x="62"
        y="58"
        width="66"
        height="58"
        rx="16"
        fill="#ffffff"
        stroke="#6d28d9"
        strokeWidth="3.5"
      />
      <circle cx="82" cy="82" r="6" fill="#6d28d9" />
      <circle cx="108" cy="82" r="6" fill="#6d28d9" />
      <circle cx="80" cy="80" r="2" fill="#ffffff" />
      <circle cx="106" cy="80" r="2" fill="#ffffff" />
      <path
        d="M83 98 Q95 107 107 98"
        fill="none"
        stroke="#ec4899"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Floating colorful story blocks on the right */}
      <rect
        x="212"
        y="46"
        width="44"
        height="34"
        rx="9"
        fill="#dcfce7"
        stroke="#059669"
        strokeWidth="2.8"
      />
      <text x="234" y="68" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#047857">
        A
      </text>
      <rect
        x="226"
        y="96"
        width="44"
        height="34"
        rx="9"
        fill="#fef3c7"
        stroke="#d97706"
        strokeWidth="2.8"
      />
      <text x="248" y="118" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#b45309">
        B
      </text>
    </svg>
  );
}

export const ChildStorybookView: React.FC<Props> = ({
  microsite,
  onSelectTopic,
}) => {
  const { t } = useLanguage();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const topicKey = microsite.topic.trim().toLowerCase();

  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    () =>
      microsite.heroImageUrl || clientIllustrationCache.get(topicKey) || null
  );
  const [isPaintingImage, setIsPaintingImage] = useState<boolean>(false);

  const requestIllustration = useCallback(
    async (forceRefresh = false) => {
      const key = microsite.topic.trim().toLowerCase();
      if (!forceRefresh) {
        if (microsite.heroImageUrl) {
          clientIllustrationCache.set(key, microsite.heroImageUrl);
          setGeneratedImageUrl(microsite.heroImageUrl);
          return;
        }
        const cached = clientIllustrationCache.get(key);
        if (cached) {
          setGeneratedImageUrl(cached);
          return;
        }
      }

      setIsPaintingImage(true);
      try {
        const res = await fetch('/learnx/api/child-illustration', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: microsite.topic,
            subtitle: microsite.subtitle,
            forceRefresh,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (data.imageUrl) {
            clientIllustrationCache.set(key, data.imageUrl);
            setGeneratedImageUrl(data.imageUrl);
          }
        }
      } catch {
        // Keep SVG fallback on error
      } finally {
        setIsPaintingImage(false);
      }
    },
    [microsite.topic, microsite.subtitle, microsite.heroImageUrl]
  );

  useEffect(() => {
    setSelectedAnswer(null);
    const key = microsite.topic.trim().toLowerCase();
    if (microsite.heroImageUrl) {
      clientIllustrationCache.set(key, microsite.heroImageUrl);
      setGeneratedImageUrl(microsite.heroImageUrl);
      setIsPaintingImage(false);
    } else if (clientIllustrationCache.has(key)) {
      setGeneratedImageUrl(clientIllustrationCache.get(key) || null);
      setIsPaintingImage(false);
    } else {
      setGeneratedImageUrl(null);
      requestIllustration(false);
    }
  }, [microsite.topic, microsite.level, microsite.heroImageUrl, requestIllustration]);

  // Parse stepping stones from formulaOrCode (if separated by → or + or |)
  const steppingStones = React.useMemo(() => {
    const raw = microsite.mentalModelOrFormalism?.formulaOrCode || '';
    if (!raw) return [];
    const parts = raw
      .split(/→|->|⟹|\|/g)
      .map((s) => s.trim())
      .filter(Boolean);
    return parts.length >= 2 ? parts.slice(0, 4) : [raw];
  }, [microsite.mentalModelOrFormalism]);

  return (
    <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-8 space-y-10">
      {/* 1. ILLUSTRATED STORYBOOK COVER CARD */}
      <section
        className="rounded-3xl p-6 sm:p-9 border-2 shadow-sm space-y-6"
        style={{
          backgroundColor: 'var(--paper-2)',
          borderColor: '#f59e0b',
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase"
              style={{
                backgroundColor: '#fef3c7',
                color: '#b45309',
                border: '1.5px solid #f59e0b',
              }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t.microsite.childBannerBadge}</span>
            </div>

            <h1
              className="font-serif-editorial text-3xl sm:text-5xl font-medium tracking-tight"
              style={{ color: 'var(--ink)', lineHeight: 1.1 }}
            >
              {microsite.topic}
            </h1>

            <p
              className="text-base sm:text-xl font-medium leading-relaxed"
              style={{ color: 'var(--ink-2)' }}
            >
              {microsite.subtitle}
            </p>
          </div>

          <div className="lg:col-span-5">
            <div
              className="relative rounded-2xl overflow-hidden border-2 shadow-sm"
              style={{
                borderColor: '#f59e0b',
                backgroundColor: 'var(--paper)',
              }}
            >
              {generatedImageUrl ? (
                <img
                  src={generatedImageUrl}
                  alt={microsite.topic}
                  className="w-full h-56 sm:h-64 object-cover block"
                />
              ) : (
                <StorybookHeroDrawing
                  entityType={microsite.entityType}
                  visualTheme={microsite.illustration?.visualTheme}
                />
              )}

              {isPaintingImage && (
                <div
                  className="absolute inset-0 flex items-end justify-center p-3"
                  style={{
                    background:
                      'linear-gradient(to top, rgba(27,26,24,0.45) 0%, transparent 65%)',
                  }}
                >
                  <div
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm"
                    style={{
                      backgroundColor: '#fef3c7',
                      color: '#92400e',
                      border: '1px solid #f59e0b',
                    }}
                  >
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>🎨 Painting illustration...</span>
                  </div>
                </div>
              )}

              {!isPaintingImage && generatedImageUrl && (
                <button
                  type="button"
                  onClick={() => requestIllustration(true)}
                  title="Paint a new illustration"
                  className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold shadow-sm cursor-pointer transition hover:opacity-95"
                  style={{
                    backgroundColor: 'rgba(254, 243, 199, 0.92)',
                    color: '#92400e',
                    border: '1px solid #f59e0b',
                  }}
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Redraw</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Big Secret Speech Bubble (TL;DR) */}
        <div
          className="rounded-2xl p-5 sm:p-6 border-2 space-y-1.5"
          style={{
            backgroundColor: 'var(--paper)',
            borderColor: 'var(--accent)',
          }}
        >
          <div
            className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: 'var(--accent)' }}
          >
            <span>✨ {t.microsite.childBigIdeaLabel}</span>
          </div>
          <p
            className="font-serif-editorial text-lg sm:text-xl leading-relaxed"
            style={{ color: 'var(--ink)' }}
          >
            {microsite.tldr}
          </p>
        </div>
      </section>

      {/* 2. "PICTURE THIS IN YOUR MIND!" IMAGINATION BOX */}
      {microsite.mentalModelOrFormalism && (
        <section
          className="rounded-3xl p-6 sm:p-8 border-2 space-y-5"
          style={{
            backgroundColor: 'var(--paper)',
            borderColor: '#38bdf8',
          }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ backgroundColor: '#e0f2fe', border: '1.5px solid #38bdf8' }}
            >
              💡
            </div>
            <div className="space-y-2">
              <span
                className="text-xs font-bold uppercase tracking-wider block"
                style={{ color: '#0284c7' }}
              >
                {microsite.mentalModelOrFormalism.label ||
                  t.microsite.childImagineLabel}
              </span>
              <p
                className="font-serif-editorial text-base sm:text-lg leading-relaxed"
                style={{ color: 'var(--ink)' }}
              >
                {microsite.mentalModelOrFormalism.content}
              </p>
            </div>
          </div>

          {steppingStones.length > 0 && (
            <div className="pt-2 flex flex-wrap items-center gap-2.5">
              {steppingStones.map((stone, idx) => {
                const pal = CARD_PALETTES[idx % CARD_PALETTES.length];
                return (
                  <React.Fragment key={idx}>
                    <div
                      className="px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold border-2"
                      style={{
                        backgroundColor: pal.badgeBg,
                        borderColor: pal.border,
                        color: pal.badgeText,
                      }}
                    >
                      {stone}
                    </div>
                    {idx < steppingStones.length - 1 && (
                      <ArrowRight
                        className="w-4 h-4 shrink-0"
                        style={{ color: 'var(--ink-3)' }}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* 3. ILLUSTRATED STORY CHAPTERS (1 · 2 · 3) */}
      {microsite.sections && microsite.sections.length > 0 && (
        <section className="space-y-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h2
              className="font-serif-editorial text-2xl sm:text-3xl font-normal"
              style={{ color: 'var(--ink)' }}
            >
              {t.microsite.childStoryChaptersTitle}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {microsite.sections.map((sec, idx) => {
              const pal = CARD_PALETTES[idx % CARD_PALETTES.length];
              return (
                <article
                  key={idx}
                  className="rounded-3xl p-6 border-2 flex flex-col justify-between gap-4"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderColor: pal.border,
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <NodeSpotDrawing index={idx} accent={pal.accent} />
                      {sec.keyTerm && (
                        <span
                          className="text-[11px] font-bold px-3 py-1 rounded-full"
                          style={{
                            backgroundColor: pal.badgeBg,
                            color: pal.badgeText,
                            border: `1px solid ${pal.border}`,
                          }}
                        >
                          ✨ {sec.keyTerm}
                        </span>
                      )}
                    </div>

                    <h3
                      className="text-lg sm:text-xl font-bold leading-snug"
                      style={{ color: 'var(--ink)' }}
                    >
                      {sec.heading}
                    </h3>

                    <p
                      className="font-serif-editorial text-base leading-relaxed"
                      style={{ color: 'var(--ink)' }}
                    >
                      {sec.body}
                    </p>
                  </div>

                  {sec.highlightCallout && (
                    <div
                      className="rounded-2xl p-3.5 text-xs sm:text-sm font-medium leading-relaxed"
                      style={{
                        backgroundColor: pal.badgeBg,
                        color: pal.badgeText,
                        border: `1px dashed ${pal.border}`,
                      }}
                    >
                      💬 {sec.highlightCallout}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. INTERACTIVE PICTURE DISCOVERY MAP */}
      {microsite.illustration?.nodes && microsite.illustration.nodes.length > 0 && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <h2
                className="font-serif-editorial text-2xl sm:text-3xl font-normal"
                style={{ color: 'var(--ink)' }}
              >
                {t.microsite.childDiscoveryMapTitle}
              </h2>
            </div>
            <p className="text-xs" style={{ color: 'var(--ink-3)' }}>
              {t.microsite.childDiscoveryMapHint}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {microsite.illustration.nodes.map((node, idx) => {
              const pal = CARD_PALETTES[idx % CARD_PALETTES.length];
              return (
                <div
                  key={node.id || idx}
                  className="rounded-3xl p-5 border-2 flex flex-col justify-between gap-3 transition-transform hover:-translate-y-0.5 shadow-sm"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderColor: pal.border,
                  }}
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <NodeSpotDrawing index={idx} accent={pal.accent} />
                      <span
                        className="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                        style={{
                          backgroundColor: pal.badgeBg,
                          color: pal.badgeText,
                          border: `1px solid ${pal.border}`,
                        }}
                      >
                        0{idx + 1}
                      </span>
                    </div>

                    {node.sublabel && (
                      <div className="text-[11px] font-bold" style={{ color: pal.accent }}>
                        <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}>
                          {t.microsite.childMagicWordLabel}{' '}
                        </span>
                        {node.sublabel}
                      </div>
                    )}

                    <h3
                      className="text-base font-bold leading-snug"
                      style={{ color: 'var(--ink)' }}
                    >
                      {node.label}
                    </h3>

                    <p
                      className="text-xs sm:text-sm font-serif-editorial leading-relaxed"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {node.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 5. INTERACTIVE RIDDLE / MINI-QUIZ GAME */}
      {microsite.quiz &&
        Array.isArray(microsite.quiz.options) &&
        microsite.quiz.options.length > 0 && (
          <section
            className="rounded-3xl p-6 sm:p-8 border-2 space-y-5"
            style={{
              backgroundColor: 'var(--paper-2)',
              borderColor: '#a78bfa',
            }}
          >
            <div className="flex items-center gap-2.5">
              <HelpCircle className="w-5 h-5" style={{ color: 'var(--accent)' }} />
              <span
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: 'var(--accent)' }}
              >
                {t.microsite.childQuizTitle}
              </span>
            </div>

            <h3
              className="font-serif-editorial text-xl sm:text-2xl font-medium"
              style={{ color: 'var(--ink)' }}
            >
              {microsite.quiz.question}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {microsite.quiz.options.map((opt, idx) => {
                const isPicked = selectedAnswer === idx;
                const isRight = idx === (microsite.quiz?.correctIndex ?? 0);
                let borderCol = 'var(--rule)';
                let bgCol = 'var(--paper)';
                if (isPicked) {
                  borderCol = isRight ? '#10b981' : '#f43f5e';
                  bgCol = isRight ? '#dcfce7' : '#ffe4e6';
                }
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedAnswer(idx)}
                    className="text-left p-4 rounded-2xl border-2 text-sm sm:text-base font-medium transition cursor-pointer flex items-center justify-between gap-3"
                    style={{
                      backgroundColor: bgCol,
                      borderColor: borderCol,
                      color: isPicked ? '#1b1a18' : 'var(--ink)',
                    }}
                  >
                    <span>{opt}</span>
                    {isPicked && isRight && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {selectedAnswer !== null && (
              <div
                className="rounded-2xl p-4 text-sm sm:text-base font-medium"
                style={{
                  backgroundColor:
                    selectedAnswer === (microsite.quiz.correctIndex ?? 0)
                      ? '#dcfce7'
                      : '#fef3c7',
                  color: '#1b1a18',
                  border:
                    selectedAnswer === (microsite.quiz.correctIndex ?? 0)
                      ? '1.5px solid #10b981'
                      : '1.5px solid #f59e0b',
                }}
              >
                <div className="font-bold mb-1">
                  {selectedAnswer === (microsite.quiz.correctIndex ?? 0)
                    ? `🎉 ${t.microsite.childQuizCorrect}`
                    : `🤔 ${t.microsite.childQuizTryAgain}`}
                </div>
                {selectedAnswer === (microsite.quiz.correctIndex ?? 0) && (
                  <div className="font-serif-editorial">
                    {microsite.quiz.explanation}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

      {/* 6. 4 POCKET FUN FACTS */}
      {microsite.keyFacts && microsite.keyFacts.length > 0 && (
        <section className="space-y-4">
          <h2
            className="font-serif-editorial text-2xl font-normal"
            style={{ color: 'var(--ink)' }}
          >
            🌟 {t.microsite.childFunFactsTitle}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {microsite.keyFacts.map((fact, idx) => {
              const pal = CARD_PALETTES[idx % CARD_PALETTES.length];
              return (
                <div
                  key={idx}
                  className="rounded-2xl p-4 border-2 space-y-1.5"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderColor: pal.border,
                  }}
                >
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider block"
                    style={{ color: pal.accent }}
                  >
                    {fact.label}
                  </span>
                  <div
                    className="text-lg font-bold font-mono"
                    style={{ color: 'var(--ink)' }}
                  >
                    {fact.value}
                  </div>
                  <p
                    className="text-xs sm:text-sm font-serif-editorial leading-relaxed"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {fact.detail}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 7. NEXT ADVENTURE RABBIT HOLES */}
      {microsite.rabbitHoles && microsite.rabbitHoles.length > 0 && (
        <section
          className="pt-6 border-t space-y-3"
          style={{ borderColor: 'var(--rule)' }}
        >
          <span className="kicker block">
            🚀 {t.microsite.childNextAdventure}
          </span>
          <div className="flex flex-wrap gap-2.5">
            {microsite.rabbitHoles.map((rh) => (
              <button
                key={rh}
                type="button"
                onClick={() => onSelectTopic(rh)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-xs sm:text-sm font-semibold transition cursor-pointer hover:opacity-85"
                style={{
                  borderColor: 'var(--accent)',
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                <span>{rh}</span>
                <ArrowRight className="w-3.5 h-3.5 shrink-0" />
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};
