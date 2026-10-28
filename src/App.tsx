import React, { useState, useEffect, useCallback } from 'react';
import { ExpertiseLevel, MicrositeData } from './types';
import { LEVELS, PRESET_TOPICS, buildPresetMicrosite } from './data/presets';
import { InteractiveIllustration } from './components/InteractiveIllustration';
import { DynamicWidget } from './components/DynamicWidget';
import {
  Search,
  Sparkles,
  BookOpen,
  Gauge,
  Compass,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ArrowRight,
  Loader2,
  GraduationCap,
  Terminal,
  User,
  Cpu,
  Atom,
  Globe,
} from 'lucide-react';

const ENTITY_ICONS: Record<MicrositeData['entityType'], React.ReactNode> = {
  person: <User className="w-3.5 h-3.5" />,
  system: <Cpu className="w-3.5 h-3.5" />,
  phenomenon: <Atom className="w-3.5 h-3.5" />,
  concept: <Compass className="w-3.5 h-3.5" />,
  event: <Globe className="w-3.5 h-3.5" />,
};

export function App() {
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

  // Cache for AI-generated microsites keyed by `${normalizedTopic}::${level}`
  const [aiCache, setAiCache] = useState<Record<string, MicrositeData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Quiz state
  const [selectedQuizOption, setSelectedQuizOption] = useState<number | null>(
    null
  );

  // Reset quiz selection whenever microsite changes
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

      // 1. Check if it matches a rich pre-built preset topic
      const matchedSlug = matchPresetByQuery(trimmed);
      if (matchedSlug) {
        const built = buildPresetMicrosite(matchedSlug, targetLevel);
        if (built) {
          setActivePresetSlug(matchedSlug);
          setMicrosite(built);
          return;
        }
      }

      // 2. Check in-memory cache for this (topic, level) pair
      const cacheKey = `${trimmed.toLowerCase()}::${targetLevel}`;
      if (aiCache[cacheKey]) {
        setActivePresetSlug(null);
        setMicrosite(aiCache[cacheKey]);
        return;
      }

      // 3. Call live Gemini backend API (/learnx/api/learn)
      setIsLoading(true);
      setLoadingStage(
        `Synthesizing ${targetLevel.toUpperCase()} microsite & interactive widget for “${trimmed}”…`
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

  // Handle switching the Novice <-> Pro toggle
  const handleLevelChange = (newLevel: ExpertiseLevel) => {
    setLevel(newLevel);
    if (activePresetSlug) {
      const updated = buildPresetMicrosite(activePresetSlug, newLevel);
      if (updated) {
        setMicrosite(updated);
        return;
      }
    }
    // For custom AI-generated topics, re-generate or pull from cache for the new level
    const currentTopic = queryInput.trim() || microsite.topic;
    generateMicrosite(currentTopic, newLevel);
  };

  // Handle form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryInput.trim() || isLoading) return;
    generateMicrosite(queryInput.trim(), level);
  };

  // Handle clicking a preset pill or rabbit hole
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
    <div className="min-h-screen flex flex-col text-slate-100">
      {/* Top Masthead */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#090b10]/85 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 via-violet-500 to-emerald-400 flex items-center justify-center font-bold text-slate-950 shadow-lg shadow-indigo-500/20">
              LX
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold tracking-tight text-white text-base">
                  Learn<span className="text-indigo-400">X</span>
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Interactive Microsite Synthesizer
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Type any concept, system, or person · Calibrate depth from Novice to Pro
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/"
              className="text-xs font-mono text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg border border-white/10 bg-white/[0.02] hover:bg-white/[0.06] transition"
            >
              &larr; learnandplay.ai
            </a>
          </div>
        </div>
      </header>

      {/* Hero Command Console: Query Input + Novice-to-Pro Toggle Side-by-Side */}
      <section className="border-b border-white/10 bg-gradient-to-b from-white/[0.02] to-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <form
            onSubmit={handleSearchSubmit}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch"
          >
            {/* 1. Query Bar (7 cols on desktop) */}
            <div className="lg:col-span-7 flex items-center rounded-2xl border border-white/15 bg-[#111522] focus-within:border-indigo-400/80 focus-within:ring-2 focus-within:ring-indigo-500/20 transition shadow-xl px-3.5 py-2">
              <Search className="w-5 h-5 text-slate-400 shrink-0 mr-2.5" />
              <input
                type="text"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask about any topic, theorem, technology, or person (e.g. CRISPR, Black Holes, Marie Curie, Zero-Knowledge Proofs)…"
                aria-label="Topic or person query"
                className="w-full bg-transparent text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isLoading || !queryInput.trim()}
                className="ml-2 shrink-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white transition cursor-pointer shadow-lg shadow-indigo-600/25"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Building…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Explore</span>
                  </>
                )}
              </button>
            </div>

            {/* 2. Novice-to-Pro Level Toggle (5 cols on desktop, right next to query!) */}
            <div className="lg:col-span-5 flex flex-col justify-center rounded-2xl border border-white/15 bg-[#111522] px-3.5 py-2 shadow-xl">
              <div className="flex items-center justify-between mb-1.5 px-0.5">
                <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-indigo-400" />
                  Expertise Level (Novice &rarr; Pro)
                </span>
                <span
                  className="text-[11px] font-mono font-semibold"
                  style={{ color: currentLevelMeta.accentColor }}
                >
                  {currentLevelMeta.badge}
                </span>
              </div>

              <div
                role="group"
                aria-label="Select expertise level from Novice to Pro"
                className="grid grid-cols-4 gap-1 bg-[#090b10] p-1 rounded-xl border border-white/10"
              >
                {LEVELS.map((lvl) => {
                  const active = lvl.id === level;
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleLevelChange(lvl.id)}
                      disabled={isLoading}
                      className={`py-1.5 px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex flex-col items-center justify-center ${
                        active
                          ? 'text-slate-950 shadow-md'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                      style={
                        active
                          ? { backgroundColor: lvl.accentColor }
                          : undefined
                      }
                    >
                      <span>{lvl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </form>

          {/* Featured Presets & Level Calibration Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono text-slate-400 mr-1">
                Instant Microsites:
              </span>
              {PRESET_TOPICS.map((preset) => {
                const isSelected = activePresetSlug === preset.slug;
                return (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() =>
                      handleSelectTopic(preset.base.topic, preset.slug)
                    }
                    className={`text-xs px-3 py-1 rounded-full border transition cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-500/20 border-indigo-400/60 text-white font-medium'
                        : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
              {/* Quick custom AI examples */}
              {['Marie Curie', 'CRISPR-Cas9', 'Fourier Transform', 'Black-Scholes Formula'].map(
                (sample) => (
                  <button
                    key={sample}
                    type="button"
                    onClick={() => handleSelectTopic(sample)}
                    className="text-xs px-2.5 py-1 rounded-full border border-dashed border-white/15 bg-transparent text-slate-400 hover:text-white hover:border-white/30 transition cursor-pointer"
                  >
                    + {sample}
                  </button>
                )
              )}
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <GraduationCap
                className="w-4 h-4 shrink-0"
                style={{ color: currentLevelMeta.accentColor }}
              />
              <span>
                <strong className="text-slate-200">
                  {currentLevelMeta.label} Mode:
                </strong>{' '}
                {currentLevelMeta.tagline}
              </span>
            </div>
          </div>

          {/* Loading or Error Banner */}
          {isLoading && (
            <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/30 px-4 py-3 flex items-center justify-between gap-3 animate-pulse">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-indigo-400 animate-spin shrink-0" />
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">
                    {loadingStage}
                  </div>
                  <div className="text-xs text-indigo-200/80">
                    Generating level-calibrated article, interactive concept diagram, and live playable simulation…
                  </div>
                </div>
              </div>
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-indigo-500/20 text-indigo-300">
                Gemini + Search Grounding
              </span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-xl border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-xs sm:text-sm text-rose-200 flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-xs font-mono underline ml-4 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Main Interactive Microsite Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* Microsite Hero Header */}
        <div className="mb-8 pb-6 border-b border-white/10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-slate-300">
              {ENTITY_ICONS[microsite.entityType] || (
                <Compass className="w-3.5 h-3.5" />
              )}
              {microsite.category}
            </span>

            <span
              className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-1 rounded-md border"
              style={{
                backgroundColor: `${currentLevelMeta.accentColor}1a`,
                borderColor: `${currentLevelMeta.accentColor}55`,
                color: currentLevelMeta.accentColor,
              }}
            >
              {currentLevelMeta.badge} · {currentLevelMeta.label} Depth
            </span>

            <span className="text-xs font-mono text-slate-400 px-2 py-0.5">
              ~{microsite.readingTimeMinutes || 4} min interactive read
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-3">
            {microsite.topic}
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 font-serif-editorial leading-relaxed max-w-4xl">
            {microsite.subtitle}
          </p>

          {/* Level Calibration Note Pill */}
          <div
            className="mt-4 inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs sm:text-sm"
            style={{
              backgroundColor: `${currentLevelMeta.accentColor}12`,
              borderColor: `${currentLevelMeta.accentColor}38`,
              color: '#e2e8f0',
            }}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: currentLevelMeta.accentColor }}
            />
            <span>{microsite.levelCalibrationNote}</span>
          </div>
        </div>

        {/* 12-Column Microsite Grid: Article (Left 6 Cols) + Interactive Visuals & Widgets (Right 6 Cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: Short Article, Mental Model / Formalism, Quiz, Sources */}
          <div className="lg:col-span-6 space-y-6">
            {/* Executive Summary / TL;DR Card */}
            <div className="rounded-2xl border border-white/10 bg-[#111522]/90 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-mono uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Executive Synthesis ({currentLevelMeta.label})
                </span>
              </div>
              <p className="text-base sm:text-lg text-slate-100 leading-relaxed font-serif-editorial">
                {microsite.tldr}
              </p>
            </div>

            {/* Mental Model (Novice/Intermediate) or Formalism Box (Advanced/Pro) */}
            {microsite.mentalModelOrFormalism && (
              <div
                className="rounded-2xl border p-5 space-y-3 shadow-xl"
                style={{
                  backgroundColor: '#0e1320',
                  borderColor: `${currentLevelMeta.accentColor}44`,
                }}
              >
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider"
                  style={{ color: currentLevelMeta.accentColor }}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{microsite.mentalModelOrFormalism.label}</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {microsite.mentalModelOrFormalism.content}
                </p>
                {microsite.mentalModelOrFormalism.formulaOrCode && (
                  <pre className="p-3 rounded-xl bg-[#07090e] border border-white/10 text-xs font-mono text-indigo-200 overflow-x-auto">
                    <code>{microsite.mentalModelOrFormalism.formulaOrCode}</code>
                  </pre>
                )}
              </div>
            )}

            {/* Structured Article Sections */}
            <article className="rounded-2xl border border-white/10 bg-[#101420]/80 p-6 space-y-6 shadow-xl">
              {(microsite.sections || []).map((sec, idx) => (
                <div
                  key={idx}
                  className={
                    idx > 0 ? 'pt-6 border-t border-white/10 space-y-3' : 'space-y-3'
                  }
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="text-lg font-bold text-white tracking-tight">
                      {sec.heading}
                    </h2>
                    {sec.keyTerm && (
                      <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300">
                        {sec.keyTerm}
                      </span>
                    )}
                  </div>
                  <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                    {sec.body}
                  </p>
                  {sec.highlightCallout && (
                    <blockquote
                      className="pl-4 py-1 border-l-2 text-xs sm:text-sm italic text-slate-200 bg-white/[0.02] rounded-r-lg pr-3"
                      style={{ borderColor: currentLevelMeta.accentColor }}
                    >
                      {sec.highlightCallout}
                    </blockquote>
                  )}
                </div>
              ))}
            </article>

            {/* Interactive Comprehension Checkpoint (Level-Calibrated Quiz) */}
            {microsite.quiz && (
              <div className="rounded-2xl border border-white/10 bg-[#101420]/90 p-6 space-y-4 shadow-xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
                    Interactive Checkpoint · {currentLevelMeta.label} Level
                  </span>
                  <span className="text-xs text-slate-400">
                    Test your intuition
                  </span>
                </div>
                <h3 className="text-base font-semibold text-white leading-snug">
                  {microsite.quiz.question}
                </h3>
                <div className="space-y-2">
                  {(microsite.quiz.options || []).map((opt, idx) => {
                    const isSelected = selectedQuizOption === idx;
                    const isCorrect = idx === microsite.quiz.correctIndex;
                    const showResult = selectedQuizOption !== null;

                    let btnStyle =
                      'border-white/10 bg-white/[0.02] hover:bg-white/[0.06] text-slate-200';
                    if (showResult) {
                      if (isCorrect) {
                        btnStyle =
                          'border-emerald-500/60 bg-emerald-950/40 text-emerald-100';
                      } else if (isSelected && !isCorrect) {
                        btnStyle =
                          'border-rose-500/60 bg-rose-950/40 text-rose-100';
                      } else {
                        btnStyle =
                          'border-white/5 bg-white/[0.01] text-slate-500';
                      }
                    }

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedQuizOption(idx)}
                        className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition flex items-start justify-between gap-3 cursor-pointer ${btnStyle}`}
                      >
                        <span>{opt}</span>
                        {showResult && isCorrect && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        {showResult && isSelected && !isCorrect && (
                          <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {selectedQuizOption !== null && (
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-slate-200">
                    <strong className="text-white">Why: </strong>
                    {microsite.quiz.explanation}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Interactive Illustration + Dynamic Playable Widget + Key Facts + Rabbit Holes */}
          <div className="lg:col-span-6 space-y-6">
            {/* 4 Key Facts Bento Strip */}
            {microsite.keyFacts && microsite.keyFacts.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {microsite.keyFacts.map((fact, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-white/10 bg-[#101420]/90 flex flex-col justify-between"
                  >
                    <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
                      {fact.label}
                    </span>
                    <div
                      className="text-sm sm:text-base font-bold font-mono my-1 truncate"
                      style={{ color: currentLevelMeta.accentColor }}
                      title={fact.value}
                    >
                      {fact.value}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {fact.detail}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Dynamic Playable Widget (Simulation / Timeline / System Explorer / Tradeoff Lab) */}
            <DynamicWidget
              widget={microsite.widget}
              accentColor={currentLevelMeta.accentColor}
            />

            {/* Interactive Concept Illustration / Diagram */}
            <InteractiveIllustration
              illustration={microsite.illustration}
              accentColor={currentLevelMeta.accentColor}
            />

            {/* Follow-Up Rabbit Holes (Click to generate next microsite) */}
            {microsite.rabbitHoles && microsite.rabbitHoles.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#101420]/90 p-5 space-y-3">
                <div className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  Continue Exploring · Connected Rabbit Holes
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {microsite.rabbitHoles.map((rh) => (
                    <button
                      key={rh}
                      type="button"
                      onClick={() => handleSelectTopic(rh)}
                      className="group flex items-center justify-between p-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-indigo-500/15 hover:border-indigo-400/50 text-left text-xs sm:text-sm text-slate-200 hover:text-white transition cursor-pointer"
                    >
                      <span className="truncate pr-2">{rh}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-300 group-hover:translate-x-0.5 transition shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Grounded Sources & References */}
            {microsite.sources && microsite.sources.length > 0 && (
              <div className="rounded-2xl border border-white/10 bg-[#101420]/90 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                    Grounded References & Primary Sources
                  </span>
                  {microsite.model && (
                    <span className="text-[10px] font-mono text-slate-500">
                      {microsite.model}
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {microsite.sources.map((src, idx) => (
                    <a
                      key={idx}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl border border-white/5 bg-white/[0.015] hover:bg-white/[0.04] hover:border-white/15 transition"
                    >
                      <div className="flex items-center justify-between gap-2 text-xs font-semibold text-indigo-300">
                        <span>{src.title}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                        {src.publisher}
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        {src.relevance}
                      </p>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            LearnX — Adaptive Interactive Microsites · Calibrated from Novice (L1) to Pro (L4)
          </div>
          <div>
            Hosted on{' '}
            <a
              href="https://learnandplay.ai"
              className="text-slate-300 hover:text-white underline"
            >
              learnandplay.ai/learnx
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
