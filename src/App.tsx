import React, { useState, useEffect, useCallback } from 'react';
import { ExpertiseLevel, MicrositeData } from './types';
import { LEVELS, PRESET_TOPICS, buildPresetMicrosite } from './data/presets';
import { InteractiveIllustration } from './components/InteractiveIllustration';
import { DynamicWidget } from './components/DynamicWidget';
import { Loader2, ArrowRight } from 'lucide-react';

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved =
        localStorage.getItem('clmt_theme') || localStorage.getItem('lp_theme');
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('clmt_theme', theme);
      localStorage.setItem('lp_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const [queryInput, setQueryInput] = useState<string>(
    'Transformer Self-Attention'
  );
  const [activePresetSlug, setActivePresetSlug] = useState<string | null>(
    'transformer-attention'
  );
  const [level, setLevel] = useState<ExpertiseLevel>('intermediate');
  const [microsite, setMicrosite] = useState<MicrositeData>(() => {
    return (
      buildPresetMicrosite('transformer-attention', 'intermediate') ||
      buildPresetMicrosite(PRESET_TOPICS[0].slug, 'intermediate')!
    );
  });

  const [aiCache, setAiCache] = useState<Record<string, MicrositeData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(
    null
  );

  useEffect(() => {
    setSelectedQuizOption(null);
  }, [microsite.topic, microsite.level]);

  const currentLevelMeta =
    LEVELS.find((l) => l.id === level) || LEVELS[1];

  const matchPresetByQuery = (raw: string): string | null => {
    const q = raw.trim().toLowerCase();
    if (!q) return null;
    for (const p of PRESET_TOPICS) {
      const slugWords = p.slug.replace(/-/g, ' ');
      if (
        p.slug === q ||
        slugWords === q ||
        p.label.toLowerCase() === q ||
        p.base.topic.toLowerCase() === q ||
        p.base.topic.toLowerCase().startsWith(q)
      ) {
        return p.slug;
      }
    }
    return null;
  };

  const generateMicrosite = useCallback(
    async (targetTopic: string, targetLevel: ExpertiseLevel) => {
      const trimmed = targetTopic.trim();
      if (!trimmed) return;

      setErrorMsg(null);

      // 1. Check pre-built preset topics
      const matchedSlug = matchPresetByQuery(trimmed);
      if (matchedSlug) {
        const built = buildPresetMicrosite(matchedSlug, targetLevel);
        if (built) {
          setActivePresetSlug(matchedSlug);
          setMicrosite(built);
          return;
        }
      }

      // 2. Check in-memory cache
      const cacheKey = `${trimmed.toLowerCase()}::${targetLevel}`;
      if (aiCache[cacheKey]) {
        setActivePresetSlug(null);
        setMicrosite(aiCache[cacheKey]);
        return;
      }

      // 3. Call live Gemini backend API (/learnx/api/learn)
      setIsLoading(true);
      setLoadingStage(
        `Synthesizing ${targetLevel} edition for “${trimmed}”…`
      );

      try {
        const res = await fetch('/learnx/api/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            level: targetLevel,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.message ||
              errData.error ||
              `Server returned HTTP ${res.status}`
          );
        }

        const data: MicrositeData = await res.json();
        setAiCache((prev) => ({ ...prev, [cacheKey]: data }));
        setActivePresetSlug(null);
        setMicrosite(data);
      } catch (err) {
        setErrorMsg(
          err instanceof Error
            ? err.message
            : 'Could not generate microsite. Please try again.'
        );
      } finally {
        setIsLoading(false);
        setLoadingStage('');
      }
    },
    [aiCache]
  );

  const handleLevelChange = (newLevel: ExpertiseLevel) => {
    setLevel(newLevel);
    if (activePresetSlug) {
      const updated = buildPresetMicrosite(activePresetSlug, newLevel);
      if (updated) {
        setMicrosite(updated);
        return;
      }
    }
    const currentTopic = queryInput.trim() || microsite.topic;
    generateMicrosite(currentTopic, newLevel);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isLoading) return;
    generateMicrosite(queryInput.trim(), level);
  };

  const handleSelectTopic = (topicText: string, presetSlug?: string) => {
    setQueryInput(topicText);
    if (presetSlug) {
      const built = buildPresetMicrosite(presetSlug, level);
      if (built) {
        setActivePresetSlug(presetSlug);
        setErrorMsg(null);
        setMicrosite(built);
        return;
      }
    }
    generateMicrosite(topicText, level);
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor: 'var(--paper)', color: 'var(--ink)' }}
    >
      {/* Top Editorial Masthead — clmt.ai style */}
      <header
        className="sticky top-0 z-30"
        style={{
          background:
            'linear-gradient(to bottom, var(--paper) 0%, var(--paper) 84%, transparent 100%)',
        }}
      >
        <div
          className="max-w-6xl mx-auto px-5 sm:px-8 pt-4 pb-3 flex flex-wrap items-baseline justify-between gap-3 border-b"
          style={{ borderColor: 'var(--rule)' }}
        >
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span
              className="text-sm font-semibold tracking-tight"
              style={{ color: 'var(--ink)' }}
            >
              LearnX
            </span>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              ·
            </span>
            <a
              href="/"
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--ink-3)' }}
            >
              learnandplay.ai
            </a>
            <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
              ·
            </span>
            <a
              href="https://clmt.ai"
              className="text-xs font-medium hover:underline"
              style={{ color: 'var(--ink-3)' }}
            >
              Clément Farabet ↗
            </a>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
              }
              className="text-xs font-medium px-3 py-1 rounded-full cursor-pointer"
              style={{
                backgroundColor: 'var(--paper-2)',
                border: '1px solid var(--rule)',
                color: 'var(--ink-2)',
              }}
            >
              {theme === 'dark' ? 'Light paper' : 'Dark ink'}
            </button>
          </div>
        </div>
      </header>

      {/* Query Input + Novice-to-Pro Toggle Bar */}
      <section
        className="border-b"
        style={{ borderColor: 'var(--rule)' }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 space-y-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch"
          >
            {/* 1. Query Bar */}
            <div
              className="lg:col-span-7 flex items-center rounded-full px-4 py-1.5"
              style={{
                backgroundColor: 'var(--paper-2)',
                border: '1px solid var(--rule)',
              }}
            >
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Type any topic, theorem, system, or person…"
                aria-label="Topic or person query"
                className="w-full bg-transparent text-sm sm:text-base focus:outline-none"
                style={{ color: 'var(--ink)' }}
              />
              <button
                type="submit"
                disabled={isLoading || !queryInput.trim()}
                className="ml-2 shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
                style={{
                  backgroundColor: 'var(--ink)',
                  color: 'var(--paper)',
                }}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing…</span>
                  </>
                ) : (
                  <span>Explore</span>
                )}
              </button>
            </div>

            {/* 2. Novice-to-Pro Toggle right next to Query */}
            <div
              className="lg:col-span-5 flex items-center justify-between gap-2 rounded-full px-3 py-1.5"
              style={{
                backgroundColor: 'var(--paper-2)',
                border: '1px solid var(--rule)',
              }}
            >
              <span className="kicker pl-2 hidden sm:inline shrink-0">
                Depth
              </span>
              <div
                role="group"
                aria-label="Select expertise level from Novice to Pro"
                className="grid grid-cols-4 gap-1 w-full"
              >
                {LEVELS.map((lvl) => {
                  const active = lvl.id === level;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleLevelChange(lvl.id)}
                      disabled={isLoading}
                      className="py-1.5 px-2 rounded-full text-xs font-semibold transition cursor-pointer text-center"
                      style={
                        active
                          ? {
                              backgroundColor: 'var(--ink)',
                              color: 'var(--paper)',
                            }
                          : {
                              color: 'var(--ink-2)',
                            }
                      }
                    >
                      {lvl.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Topic Pills & Calibration Tagline */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-0.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="kicker mr-1">Index:</span>
              {PRESET_TOPICS.map((preset) => {
                const isSelected = activePresetSlug === preset.slug;
                return (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() =>
                      handleSelectTopic(preset.base.topic, preset.slug)
                    }
                    className="text-xs px-3 py-1 rounded-full cursor-pointer transition"
                    style={
                      isSelected
                        ? {
                            backgroundColor: 'var(--accent-soft)',
                            color: 'var(--accent)',
                            border: '1px solid var(--accent)',
                            fontWeight: 600,
                          }
                        : {
                            backgroundColor: 'var(--paper-2)',
                            color: 'var(--ink-2)',
                            border: '1px solid var(--rule)',
                          }
                    }
                  >
                    {preset.label}
                  </button>
                );
              })}
              {[
                'Marie Curie',
                'CRISPR-Cas9',
                'Fourier Transform',
                'Black-Scholes Formula',
              ].map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSelectTopic(sample)}
                  className="text-xs px-2.5 py-1 rounded-full cursor-pointer transition"
                  style={{
                    backgroundColor: 'transparent',
                    border: '1px dashed var(--rule)',
                    color: 'var(--ink-3)',
                  }}
                >
                  {sample}
                </button>
              ))}
            </div>

            <div className="text-xs" style={{ color: 'var(--ink-3)' }}>
              <strong style={{ color: 'var(--ink-2)' }}>
                {currentLevelMeta.badge}:
              </strong>{' '}
              {currentLevelMeta.tagline}
            </div>
          </div>

          {isLoading && (
            <div className="surface-well px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Loader2
                  className="w-4 h-4 animate-spin shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
                <span className="text-xs sm:text-sm font-medium">
                  {loadingStage}
                </span>
              </div>
              <span className="kicker">Gemini</span>
            </div>
          )}

          {errorMsg && (
            <div className="surface-well px-4 py-3 text-xs sm:text-sm flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-xs underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Interactive Microsite Body */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-5 sm:px-8 py-10">
        {/* Editorial Cover Header */}
        <div
          className="mb-10 pb-8 border-b"
          style={{ borderColor: 'var(--rule)' }}
        >
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="kicker">{microsite.category}</span>
            <span style={{ color: 'var(--ink-3)' }}>·</span>
            <span
              className="kicker"
              style={{ color: 'var(--accent)' }}
            >
              {currentLevelMeta.badge} ({currentLevelMeta.label})
            </span>
            <span style={{ color: 'var(--ink-3)' }}>·</span>
            <span className="kicker">
              {microsite.readingTimeMinutes || 4} min read
            </span>
          </div>

          <h1
            className="font-serif-editorial text-4xl sm:text-5xl font-normal tracking-tight mb-4"
            style={{
              color: 'var(--ink)',
              lineHeight: 1.05,
              letterSpacing: '-0.022em',
            }}
          >
            {microsite.topic}
          </h1>

          <p
            className="font-serif-editorial text-xl sm:text-2xl leading-snug max-w-3xl"
            style={{ color: 'var(--ink-2)' }}
          >
            {microsite.subtitle}
          </p>

          <p
            className="editorial-frame mt-5 text-xs sm:text-sm"
            style={{ borderColor: 'var(--accent)' }}
          >
            {microsite.levelCalibrationNote}
          </p>
        </div>

        {/* Two-Column Editorial & Interactive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* LEFT COLUMN: Essay / Article, Mental Model / Formalism, Self-Check */}
          <div className="lg:col-span-6 space-y-8">
            {/* Thesis / Synthesis */}
            <section className="space-y-2">
              <span className="kicker block">
                Thesis · {currentLevelMeta.label} Edition
              </span>
              <p
                className="font-serif-editorial text-lg sm:text-xl leading-relaxed"
                style={{ color: 'var(--ink)' }}
              >
                {microsite.tldr}
              </p>
            </section>

            {/* Mental Model (Novice/Intermediate) or Formalism Box (Advanced/Pro) */}
            {microsite.mentalModelOrFormalism && (
              <div className="surface-well p-5 space-y-2.5">
                <span
                  className="kicker block"
                  style={{ color: 'var(--accent)' }}
                >
                  {microsite.mentalModelOrFormalism.label}
                </span>
                <p
                  className="text-sm sm:text-base font-serif-editorial leading-relaxed"
                  style={{ color: 'var(--ink)' }}
                >
                  {microsite.mentalModelOrFormalism.content}
                </p>
                {microsite.mentalModelOrFormalism.formulaOrCode && (
                  <pre
                    className="p-3 rounded-lg text-xs font-mono overflow-x-auto border"
                    style={{
                      backgroundColor: 'var(--paper)',
                      borderColor: 'var(--rule)',
                      color: 'var(--ink)',
                    }}
                  >
                    <code>{microsite.mentalModelOrFormalism.formulaOrCode}</code>
                  </pre>
                )}
              </div>
            )}

            {/* Structured Article Sections */}
            <article className="space-y-7">
              {(microsite.sections || []).map((sec, idx) => (
                <section
                  key={idx}
                  className="pt-6 border-t space-y-3"
                  style={{ borderColor: 'var(--rule)' }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2
                      className="text-lg font-semibold tracking-tight"
                      style={{ color: 'var(--ink)' }}
                    >
                      {sec.heading}
                    </h2>
                    {sec.keyTerm && (
                      <span className="kicker">{sec.keyTerm}</span>
                    )}
                  </div>
                  <p
                    className="font-serif-editorial text-base sm:text-[1.125rem] leading-relaxed"
                    style={{ color: 'var(--ink)' }}
                  >
                    {sec.body}
                  </p>
                  {sec.highlightCallout && (
                    <blockquote
                      className="editorial-frame font-serif-editorial italic text-base"
                      style={{ borderColor: 'var(--accent)' }}
                    >
                      {sec.highlightCallout}
                    </blockquote>
                  )}
                </section>
              ))}
            </article>

            {/* Comprehension Reflection Card */}
            {microsite.quiz && (
              <div
                className="pt-7 border-t space-y-4"
                style={{ borderColor: 'var(--rule)' }}
              >
                <span className="kicker block">
                  Check Your Hold on the Argument · {currentLevelMeta.label}
                </span>
                <h3
                  className="text-base sm:text-lg font-semibold leading-snug"
                  style={{ color: 'var(--ink)' }}
                >
                  {microsite.quiz.question}
                </h3>
                <div className="space-y-2">
                  {(microsite.quiz.options || []).map((opt, idx) => {
                    const isSelected = selectedQuizOption === idx;
                    const isCorrect = idx === microsite.quiz.correctIndex;
                    const showResult = selectedQuizOption !== null;

                    let borderCol = 'var(--rule)';
                    let bgCol = 'var(--paper-2)';
                    if (showResult) {
                      if (isCorrect) {
                        borderCol = 'var(--accent)';
                        bgCol = 'var(--accent-soft)';
                      } else if (isSelected && !isCorrect) {
                        borderCol = 'var(--ink-3)';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedQuizOption(idx)}
                        className="w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition flex items-start justify-between gap-3 cursor-pointer"
                        style={{
                          borderColor: borderCol,
                          backgroundColor: bgCol,
                          color: 'var(--ink)',
                        }}
                      >
                        <span>{opt}</span>
                        {showResult && isCorrect && (
                          <span
                            className="text-xs font-mono font-semibold shrink-0"
                            style={{ color: 'var(--accent)' }}
                          >
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedQuizOption !== null && (
                  <p className="editorial-frame text-xs sm:text-sm">
                    <strong style={{ color: 'var(--ink)' }}>Reasoning: </strong>
                    {microsite.quiz.explanation}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Playable Widget, Concept Diagram, Key Specifications & Sources */}
          <div className="lg:col-span-6 space-y-8">
            {/* Dynamic Playable Widget */}
            <DynamicWidget widget={microsite.widget} />

            {/* Interactive Concept Illustration */}
            <InteractiveIllustration illustration={microsite.illustration} />

            {/* Editorial Key Reference Rows (clmt.ai .rows style) */}
            {microsite.keyFacts && microsite.keyFacts.length > 0 && (
              <div
                className="pt-4 border-t"
                style={{ borderColor: 'var(--rule)' }}
              >
                <span className="kicker block mb-3">
                  Key Reference Coordinates
                </span>
                <ol className="divide-y" style={{ borderColor: 'var(--rule)' }}>
                  {microsite.keyFacts.map((fact, idx) => (
                    <li
                      key={idx}
                      className="py-2.5 flex items-baseline justify-between gap-4"
                      style={{ borderColor: 'var(--rule)' }}
                    >
                      <div>
                        <span
                          className="text-xs font-semibold block"
                          style={{ color: 'var(--ink)' }}
                        >
                          {fact.label}
                        </span>
                        <span
                          className="text-xs font-serif-editorial"
                          style={{ color: 'var(--ink-2)' }}
                        >
                          {fact.detail}
                        </span>
                      </div>
                      <span
                        className="text-xs font-mono font-semibold shrink-0"
                        style={{ color: 'var(--accent)' }}
                      >
                        {fact.value}
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Follow-Up Rabbit Holes */}
            {microsite.rabbitHoles && microsite.rabbitHoles.length > 0 && (
              <div
                className="pt-4 border-t space-y-3"
                style={{ borderColor: 'var(--rule)' }}
              >
                <span className="kicker block">
                  Continue Reading · Connected Topics
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {microsite.rabbitHoles.map((rh) => (
                    <button
                      key={rh}
                      type="button"
                      onClick={() => handleSelectTopic(rh)}
                      className="group flex items-center justify-between p-3 rounded-xl border text-left text-xs sm:text-sm transition cursor-pointer"
                      style={{
                        borderColor: 'var(--rule)',
                        backgroundColor: 'var(--paper-2)',
                        color: 'var(--ink)',
                      }}
                    >
                      <span className="truncate pr-2 font-medium">{rh}</span>
                      <ArrowRight
                        className="w-3.5 h-3.5 shrink-0 transition group-hover:translate-x-0.5"
                        style={{ color: 'var(--ink-3)' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grounded Sources */}
            {microsite.sources && microsite.sources.length > 0 && (
              <div
                className="pt-4 border-t space-y-2.5"
                style={{ borderColor: 'var(--rule)' }}
              >
                <span className="kicker block">Sources &amp; Primary Literature</span>
                <ol className="divide-y" style={{ borderColor: 'var(--rule)' }}>
                  {microsite.sources.map((src, idx) => (
                    <li
                      key={idx}
                      className="py-2.5"
                      style={{ borderColor: 'var(--rule)' }}
                    >
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <div className="flex items-baseline justify-between gap-2 text-xs sm:text-sm font-semibold">
                          <span className="group-hover:underline">
                            {src.title} ↗
                          </span>
                          <span
                            className="text-xs font-normal shrink-0"
                            style={{ color: 'var(--ink-3)' }}
                          >
                            {src.publisher}
                          </span>
                        </div>
                        <p
                          className="text-xs font-serif-editorial mt-0.5"
                          style={{ color: 'var(--ink-2)' }}
                        >
                          {src.relevance}
                        </p>
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="border-t py-6 mt-12 text-xs"
        style={{ borderColor: 'var(--rule)', color: 'var(--ink-3)' }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            LearnX · Adaptive Interactive Microsites (Novice to Pro)
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="hover:underline">
              learnandplay.ai
            </a>
            <span>·</span>
            <a href="https://clmt.ai" className="hover:underline">
              clmt.ai ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
