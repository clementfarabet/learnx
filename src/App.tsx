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
  const [activeTopicQuery, setActiveTopicQuery] = useState<string>('');
  const [activePresetSlug, setActivePresetSlug] = useState<string | null>(null);
  const [level, setLevel] = useState<ExpertiseLevel>('intermediate');
  const [microsite, setMicrosite] = useState<MicrositeData | null>(null);

  const [aiCache, setAiCache] = useState<Record<string, MicrositeData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const queryContainerRef = useRef<HTMLDivElement>(null);

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
    if (!microsite && !activeTopicQuery && !queryInput.trim()) {
      return;
    }
    if (activePresetSlug) {
      const updated = buildPresetMicrosite(activePresetSlug, newLevel);
      if (updated) {
        setMicrosite(updated);
        return;
      }
    }
    const currentTopic =
      queryInput.trim() || activeTopicQuery || microsite?.topic || '';
    if (currentTopic) {
      generateMicrosite(currentTopic, newLevel);
    }
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

  const handleResetHome = () => {
    setMicrosite(null);
    setActivePresetSlug(null);
    setActiveTopicQuery('');
    setQueryInput('');
    setErrorMsg(null);
    setIsDropdownOpen(false);
  };

  const isLanding = !microsite && !isLoading;
  const shouldShowWidget =
    Boolean(microsite?.visualMode === 'widget' && microsite?.widget);

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
            <button
              type="button"
              onClick={handleResetHome}
              className="text-sm font-semibold tracking-tight cursor-pointer hover:opacity-80"
              style={{ color: 'var(--ink)' }}
            >
              LearnX
            </button>
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
            {microsite && (
              <button
                type="button"
                onClick={handleResetHome}
                className="text-xs font-medium px-3 py-1 rounded-full cursor-pointer"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--rule)',
                  color: 'var(--ink-3)',
                }}
              >
                New search
              </button>
            )}
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

      {/* Search Engine Bar (Centered on blank landing, compact at top when viewing a topic) */}
      <section
        className={isLanding ? 'flex-1 flex flex-col justify-center' : 'border-b'}
        style={{ borderColor: 'var(--rule)' }}
      >
        <div
          className={`max-w-5xl w-full mx-auto px-5 sm:px-8 ${
            isLanding ? 'py-16 sm:py-24 space-y-7' : 'py-5 space-y-3'
          }`}
        >
          {isLanding && (
            <div className="text-center space-y-3 max-w-2xl mx-auto">
              <span className="kicker block">
                Adaptive Knowledge Engine · Novice to Pro
              </span>
              <h1
                className="font-serif-editorial text-4xl sm:text-5xl font-normal tracking-tight"
                style={{
                  color: 'var(--ink)',
                  lineHeight: 1.06,
                  letterSpacing: '-0.022em',
                }}
              >
                What would you like to learn?
              </h1>
              <p
                className="font-serif-editorial text-lg sm:text-xl"
                style={{ color: 'var(--ink-2)' }}
              >
                Search any concept, theorem, system, or biography—synthesized at your chosen depth.
              </p>
            </div>
          )}

          <form
            onSubmit={handleSearchSubmit}
            className="flex flex-col lg:flex-row gap-3 items-stretch"
          >
            {/* 1. Query Bar with Pre-populated Examples Dropdown */}
            <div ref={queryContainerRef} className="relative flex-1 min-w-0">
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
                  placeholder="Type a topic, theorem, system, or person…"
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
                  className="absolute left-0 right-0 top-full mt-2 z-40 surface-card shadow-xl overflow-hidden text-left"
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
                        : 'Example Topics'}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--ink-3)' }}
                    >
                      Select an example or press Enter
                    </span>
                  </div>

                  <div
                    className="max-h-72 overflow-y-auto divide-y"
                    style={{ borderColor: 'var(--rule)' }}
                  >
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
                        microsite &&
                        ((item.presetSlug &&
                          activePresetSlug === item.presetSlug) ||
                          (!item.presetSlug &&
                            activeTopicQuery.toLowerCase() ===
                              item.topic.toLowerCase()));
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
              className="shrink-0 flex items-center justify-between gap-2 rounded-full px-2.5 py-1.5"
              style={{
                backgroundColor: 'var(--paper-2)',
                border: '1px solid var(--rule)',
              }}
            >
              <span className="kicker pl-2 hidden xl:inline shrink-0">
                Depth
              </span>
              <div
                role="group"
                aria-label="Select expertise level from Novice to Pro"
                className="flex items-center justify-between gap-1 w-full lg:w-auto"
              >
                {LEVELS.map((lvl) => {
                  const active = lvl.id === level;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleLevelChange(lvl.id)}
                      disabled={isLoading}
                      className="py-1.5 px-3 sm:px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer text-center"
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
          <div
            className={`flex items-center ${
              isLanding ? 'justify-center' : 'justify-end'
            } pt-0.5`}
          >
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

      {/* Main Microsite Body (rendered only when a topic has been selected) */}
      {microsite && (
        <main className="flex-1 max-w-5xl w-full mx-auto px-5 sm:px-8 py-10 space-y-12">
          {/* Editorial Cover Header */}
          <div
            className="pb-8 border-b space-y-4"
            style={{ borderColor: 'var(--rule)' }}
          >
            <div className="flex flex-wrap items-center gap-3">
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
              className="font-serif-editorial text-4xl sm:text-5xl font-normal tracking-tight"
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

            {/* Lead Thesis */}
            <p
              className="editorial-frame font-serif-editorial text-base sm:text-lg leading-relaxed max-w-3xl pt-1"
              style={{ borderColor: 'var(--accent)', color: 'var(--ink)' }}
            >
              {microsite.tldr}
            </p>
          </div>

          {/* Streamlined Two-Column Editorial & Figure Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            {/* LEFT COLUMN: Concise Article & Mental Model / Formalism */}
            <div className="lg:col-span-7 space-y-8">
              {/* Mental Model (Novice/Intermediate) or Formalism Box (Advanced/Pro) */}
              {microsite.mentalModelOrFormalism && (
                <div className="surface-well p-5 space-y-2">
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
                    className={idx > 0 ? 'pt-6 border-t space-y-2.5' : 'space-y-2.5'}
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
                        className="editorial-frame font-serif-editorial italic text-sm sm:text-base"
                        style={{ borderColor: 'var(--accent)' }}
                      >
                        {sec.highlightCallout}
                      </blockquote>
                    )}
                  </section>
                ))}
              </article>
            </div>

            {/* RIGHT COLUMN: Single Visual Figure (Static Diagram by default, Widget only when quantitative) + Key Coordinates */}
            <div className="lg:col-span-5 space-y-8">
              {shouldShowWidget && microsite.widget ? (
                <DynamicWidget widget={microsite.widget} />
              ) : (
                <InteractiveIllustration illustration={microsite.illustration} />
              )}

              {/* Editorial Key Reference Rows */}
              {microsite.keyFacts && microsite.keyFacts.length > 0 && (
                <div
                  className="pt-4 border-t"
                  style={{ borderColor: 'var(--rule)' }}
                >
                  <span className="kicker block mb-2.5">
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
            </div>
          </div>

          {/* Top Books to Learn More Section */}
          {microsite.books && microsite.books.length > 0 && (
            <section
              className="pt-8 border-t space-y-4"
              style={{ borderColor: 'var(--rule)' }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <span className="kicker block mb-1">Essential Reading</span>
                  <h2
                    className="font-serif-editorial text-2xl font-normal tracking-tight"
                    style={{ color: 'var(--ink)' }}
                  >
                    Top Books to Learn More
                  </h2>
                </div>
                <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
                  Curated for {microsite.topic}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {microsite.books.map((book, idx) => {
                  const bookHref =
                    book.url ||
                    `https://www.google.com/search?q=${encodeURIComponent(
                      `${book.title} ${book.author} book`
                    )}`;
                  return (
                    <a
                      key={idx}
                      href={bookHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="surface-card p-5 flex flex-col justify-between gap-3 group transition hover:opacity-90"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-baseline justify-between gap-2">
                          <span
                            className="text-[11px] font-mono font-semibold"
                            style={{ color: 'var(--accent)' }}
                          >
                            0{idx + 1}
                          </span>
                          {book.year && (
                            <span
                              className="text-[11px] font-mono"
                              style={{ color: 'var(--ink-3)' }}
                            >
                              {book.year}
                            </span>
                          )}
                        </div>
                        <h3
                          className="font-serif-editorial text-lg font-medium leading-snug group-hover:underline"
                          style={{ color: 'var(--ink)' }}
                        >
                          {book.title} ↗
                        </h3>
                        <div
                          className="text-xs font-medium"
                          style={{ color: 'var(--ink-2)' }}
                        >
                          {book.author}
                        </div>
                      </div>
                      <p
                        className="text-xs font-serif-editorial leading-relaxed pt-2 border-t"
                        style={{
                          color: 'var(--ink-2)',
                          borderColor: 'var(--rule)',
                        }}
                      >
                        {book.whyRead}
                      </p>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {/* Connected Topics & Primary Sources Footer Row */}
          <div
            className="pt-8 border-t grid grid-cols-1 lg:grid-cols-12 gap-8"
            style={{ borderColor: 'var(--rule)' }}
          >
            {/* Follow-Up Rabbit Holes */}
            {microsite.rabbitHoles && microsite.rabbitHoles.length > 0 && (
              <div className="lg:col-span-6 space-y-3">
                <span className="kicker block">
                  Connected Topics
                </span>
                <div className="flex flex-wrap gap-2">
                  {microsite.rabbitHoles.map((rh) => (
                    <button
                      key={rh}
                      type="button"
                      onClick={() => handleSelectTopic(rh)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-xs font-medium transition cursor-pointer hover:opacity-80"
                      style={{
                        borderColor: 'var(--rule)',
                        backgroundColor: 'var(--paper-2)',
                        color: 'var(--ink)',
                      }}
                    >
                      <span>{rh}</span>
                      <ArrowRight
                        className="w-3 h-3 shrink-0"
                        style={{ color: 'var(--ink-3)' }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grounded Sources */}
            {microsite.sources && microsite.sources.length > 0 && (
              <div className="lg:col-span-6 space-y-2.5">
                <span className="kicker block">Primary Papers &amp; References</span>
                <ol className="divide-y" style={{ borderColor: 'var(--rule)' }}>
                  {microsite.sources.map((src, idx) => (
                    <li
                      key={idx}
                      className="py-2"
                      style={{ borderColor: 'var(--rule)' }}
                    >
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                      >
                        <div className="flex items-baseline justify-between gap-2 text-xs font-semibold">
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
        </main>
      )}

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
