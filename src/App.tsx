import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExpertiseLevel, MicrositeData } from './types';
import { LEVELS, PRESET_TOPICS, buildPresetMicrosite } from './data/presets';
import { InteractiveIllustration } from './components/InteractiveIllustration';
import { DynamicWidget } from './components/DynamicWidget';
import { Loader2, ArrowRight, ChevronDown } from 'lucide-react';

interface ExampleTopicItem {
  label: string;
  topic: string;
  category: string;
  presetSlug?: string;
}

const EXAMPLE_TOPICS: ExampleTopicItem[] = [
  ...PRESET_TOPICS.map((p) => ({
    label: p.label,
    topic: p.base.topic,
    category: p.category,
    presetSlug: p.slug,
  })),
  {
    label: 'Marie Curie',
    topic: 'Marie Curie',
    category: 'Biography & Physics',
  },
  {
    label: 'CRISPR-Cas9',
    topic: 'CRISPR-Cas9 Gene Editing',
    category: 'Molecular Biology',
  },
  {
    label: 'Fourier Transform',
    topic: 'Fourier Transform',
    category: 'Mathematics & Signal Processing',
  },
  {
    label: 'Black-Scholes Formula',
    topic: 'Black-Scholes Option Pricing Formula',
    category: 'Quantitative Finance',
  },
  {
    label: 'General Relativity',
    topic: 'Einstein General Relativity',
    category: 'Theoretical Physics',
  },
  {
    label: 'Zero-Knowledge Proofs',
    topic: 'Zero-Knowledge Proofs',
    category: 'Cryptography',
  },
];

export function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('lp_theme');
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
      localStorage.setItem('lp_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const [queryInput, setQueryInput] = useState<string>('');
  const [activeTopicQuery, setActiveTopicQuery] = useState<string>(
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
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const queryContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSelectedQuizOption(null);
  }, [microsite.topic, microsite.level]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        queryContainerRef.current &&
        !queryContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredExamples = React.useMemo(() => {
    const q = queryInput.trim().toLowerCase();
    if (!q) return EXAMPLE_TOPICS;
    return EXAMPLE_TOPICS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [queryInput]);

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
    const currentTopic =
      queryInput.trim() || activeTopicQuery || microsite.topic;
    generateMicrosite(currentTopic, newLevel);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryInput.trim();
    if (!trimmed || isLoading) return;
    setIsDropdownOpen(false);
    setActiveTopicQuery(trimmed);
    generateMicrosite(trimmed, level);
  };

  const handleSelectTopic = (topicText: string, presetSlug?: string) => {
    setQueryInput('');
    setIsDropdownOpen(false);
    setActiveTopicQuery(topicText);
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
      {/* Top Editorial Masthead */}
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
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-6 space-y-3">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch"
          >
            {/* 1. Query Bar with Pre-populated Examples Dropdown */}
            <div ref={queryContainerRef} className="relative lg:col-span-7">
              <div
                className="flex items-center rounded-full px-4 py-1.5 h-full"
                style={{
                  backgroundColor: 'var(--paper-2)',
                  border: isDropdownOpen
                    ? '1px solid var(--ink-3)'
                    : '1px solid var(--rule)',
                }}
              >
                <input
                  type="text"
                  value={queryInput}
                  onFocus={() => setIsDropdownOpen(true)}
                  onChange={(e) => {
                    setQueryInput(e.target.value);
                    setIsDropdownOpen(true);
                  }}
                  placeholder="What would you like to learn? Type any topic, theorem, system, or person…"
                  aria-label="Topic or person query"
                  aria-expanded={isDropdownOpen}
                  aria-controls="learnx-examples-dropdown"
                  className="w-full bg-transparent text-sm sm:text-base focus:outline-none"
                  style={{ color: 'var(--ink)' }}
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  aria-label="Toggle example topics menu"
                  title="Browse example topics"
                  className="ml-1 p-1.5 rounded-full cursor-pointer transition"
                  style={{ color: 'var(--ink-3)' }}
                >
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <button
                  type="submit"
                  disabled={isLoading || !queryInput.trim()}
                  className="ml-1.5 shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-full font-semibold text-xs sm:text-sm disabled:opacity-50 cursor-pointer"
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

              {/* Pre-populated Examples Dropdown Menu */}
              {isDropdownOpen && (
                <div
                  id="learnx-examples-dropdown"
                  role="listbox"
                  className="absolute left-0 right-0 top-full mt-2 z-40 surface-card shadow-xl overflow-hidden"
                  style={{
                    backgroundColor: 'var(--paper)',
                    borderColor: 'var(--rule)',
                  }}
                >
                  <div
                    className="px-4 py-2 border-b flex items-center justify-between"
                    style={{
                      backgroundColor: 'var(--paper-2)',
                      borderColor: 'var(--rule)',
                    }}
                  >
                    <span className="kicker">
                      {queryInput.trim()
                        ? 'Matching Examples'
                        : 'Example Topics & Interactive Editions'}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--ink-3)' }}
                    >
                      Select an example or press Enter to synthesize
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y" style={{ borderColor: 'var(--rule)' }}>
                    {queryInput.trim() && (
                      <button
                        type="button"
                        onClick={() => {
                          const trimmed = queryInput.trim();
                          setIsDropdownOpen(false);
                          setActiveTopicQuery(trimmed);
                          generateMicrosite(trimmed, level);
                        }}
                        className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent)',
                        }}
                      >
                        <span className="text-xs sm:text-sm font-semibold">
                          Explore “{queryInput.trim()}” ({currentLevelMeta.label} edition)
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}

                    {filteredExamples.map((item) => {
                      const isCurrent =
                        (item.presetSlug &&
                          activePresetSlug === item.presetSlug) ||
                        (!item.presetSlug &&
                          activeTopicQuery.toLowerCase() ===
                            item.topic.toLowerCase());
                      return (
                        <button
                          key={item.label}
                          type="button"
                          role="option"
                          aria-selected={Boolean(isCurrent)}
                          onClick={() =>
                            handleSelectTopic(item.topic, item.presetSlug)
                          }
                          className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition hover:opacity-80"
                          style={{
                            backgroundColor: isCurrent
                              ? 'var(--paper-2)'
                              : 'var(--paper)',
                            borderColor: 'var(--rule)',
                          }}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span
                                className="text-sm font-medium truncate"
                                style={{ color: 'var(--ink)' }}
                              >
                                {item.label}
                              </span>
                              {isCurrent && (
                                <span
                                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-semibold"
                                  style={{
                                    backgroundColor: 'var(--accent-soft)',
                                    color: 'var(--accent)',
                                  }}
                                >
                                  Active
                                </span>
                              )}
                            </div>
                            <div
                              className="text-xs truncate"
                              style={{ color: 'var(--ink-3)' }}
                            >
                              {item.topic}
                            </div>
                          </div>

                          <span
                            className="text-[11px] px-2.5 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: 'var(--paper-2)',
                              border: '1px solid var(--rule)',
                              color: 'var(--ink-3)',
                            }}
                          >
                            {item.category}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
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

          {/* Calibration Tagline */}
          <div className="flex items-center justify-end pt-0.5">
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

            {/* Editorial Key Reference Rows */}
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
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
