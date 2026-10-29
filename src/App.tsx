import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ExpertiseLevel, MicrositeData } from './types';
import { LEVELS, PRESET_TOPICS, buildPresetMicrosite } from './data/presets';
import { InteractiveIllustration } from './components/InteractiveIllustration';
import { DynamicWidget } from './components/DynamicWidget';
import { ChildStorybookView } from './components/ChildStorybookView';
import { Loader2, ArrowRight, ChevronDown, Menu, X, Moon, Sun } from 'lucide-react';
import { LOCALES, LocaleCode, useLanguage } from './i18n/LanguageContext';
import { TRANSLATIONS } from './i18n/translations';

export function App() {
  const { locale, setLocale, t } = useLanguage();

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

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('lp_theme', theme);
      const bg = theme === 'light' ? '#fbfaf7' : '#121211';
      const meta = document.getElementById('theme-color-meta');
      if (meta) {
        meta.setAttribute('content', bg);
      }
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: Event) => {
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
        inputRef.current?.blur();
      }
    };
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const filteredExamples = React.useMemo(() => {
    const q = queryInput.trim().toLowerCase();
    if (!q) return t.examples;
    return t.examples.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.topic.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [queryInput, t.examples]);

  const currentLevelMeta = t.levels[level] || t.levels.intermediate;

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
    async (
      targetTopic: string,
      targetLevel: ExpertiseLevel,
      targetLocale: LocaleCode = locale
    ) => {
      const trimmed = targetTopic.trim();
      if (!trimmed) return;

      setErrorMsg(null);

      // 1. Check pre-built preset topics (English only, so non-English locales get synthesized in the chosen language)
      if (targetLocale === 'en') {
        const matchedSlug = matchPresetByQuery(trimmed);
        if (matchedSlug) {
          const built = buildPresetMicrosite(matchedSlug, targetLevel);
          if (built) {
            setActivePresetSlug(matchedSlug);
            setMicrosite(built);
            return;
          }
        }
      }

      // 2. Check in-memory cache (keyed by topic + level + locale)
      const cacheKey = `${trimmed.toLowerCase()}::${targetLevel}::${targetLocale}`;
      if (aiCache[cacheKey]) {
        setActivePresetSlug(null);
        setMicrosite(aiCache[cacheKey]);
        return;
      }

      // 3. Call live AI backend API (/learnx/api/learn)
      const targetT = TRANSLATIONS[targetLocale] || t;
      setIsLoading(true);
      setLoadingStage(
        targetT.status.synthesizing(trimmed, targetT.levels[targetLevel].label)
      );

      try {
        const res = await fetch('/learnx/api/learn', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: trimmed,
            level: targetLevel,
            locale: targetLocale,
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
        // If synthesis fails and this topic corresponds to a preset, fall back gracefully to preset
        const matchedPreset = PRESET_TOPICS.find(
          (p) =>
            p.slug === activePresetSlug ||
            p.base.topic.toLowerCase() === trimmed.toLowerCase() ||
            p.slug.replace(/-/g, ' ') === trimmed.toLowerCase()
        );
        if (matchedPreset) {
          const fallbackMicrosite = buildPresetMicrosite(matchedPreset.slug, targetLevel);
          if (fallbackMicrosite) {
            setActivePresetSlug(matchedPreset.slug);
            setMicrosite(fallbackMicrosite);
            setErrorMsg(null);
            return;
          }
        }
        setErrorMsg(
          err instanceof Error ? err.message : t.status.errorFallback
        );
      } finally {
        setIsLoading(false);
        setLoadingStage('');
      }
    },
    [aiCache, locale, t, activePresetSlug]
  );

  const handleLocaleChange = (nextLocale: LocaleCode) => {
    if (nextLocale === locale) return;
    setLocale(nextLocale);
    const currentTopic =
      activeTopicQuery || microsite?.topic || '';
    if (currentTopic) {
      generateMicrosite(currentTopic, level, nextLocale);
    }
  };

  const handleLevelChange = (newLevel: ExpertiseLevel) => {
    setLevel(newLevel);
    if (!microsite && !activeTopicQuery && !queryInput.trim()) {
      return;
    }
    if (activePresetSlug) {
      const updated = buildPresetMicrosite(activePresetSlug, newLevel);
      if (updated) {
        setMicrosite(updated);
        if (locale === 'en') return;
      }
    }
    const currentTopic =
      queryInput.trim() || activeTopicQuery || microsite?.topic || '';
    if (currentTopic) {
      generateMicrosite(currentTopic, newLevel, locale);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryInput.trim();
    if (!trimmed || isLoading) return;
    setIsDropdownOpen(false);
    inputRef.current?.blur();
    setActiveTopicQuery(trimmed);
    generateMicrosite(trimmed, level, locale);
  };

  const handleSelectTopic = (topicText: string, presetSlug?: string) => {
    setQueryInput('');
    setIsDropdownOpen(false);
    inputRef.current?.blur();
    setActiveTopicQuery(topicText);
    if (presetSlug) {
      const built = buildPresetMicrosite(presetSlug, level);
      if (built) {
        setActivePresetSlug(presetSlug);
        setErrorMsg(null);
        setMicrosite(built);
        if (locale !== 'en') {
          generateMicrosite(topicText, level, locale);
        }
        return;
      }
    }
    generateMicrosite(topicText, level, locale);
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
          className="max-w-6xl mx-auto px-5 sm:px-8 pt-4 pb-3 flex flex-wrap items-center justify-between gap-3 border-b"
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

          {/* Desktop Right Header Controls */}
          <div className="hidden md:flex items-center gap-2">
            {microsite && (
              <button
                type="button"
                onClick={handleResetHome}
                className="text-xs font-medium px-3 py-1.5 rounded-full cursor-pointer min-h-[44px] flex items-center"
                style={{
                  backgroundColor: 'transparent',
                  border: '1px solid var(--rule)',
                  color: 'var(--ink-3)',
                }}
              >
                {t.header.newSearch}
              </button>
            )}

            {/* 5-Language Switcher Pill (EN / FR / DE / 中文 / 日本語) */}
            <div
              role="group"
              aria-label="Language selector"
              className="inline-flex items-center rounded-full p-0.5 border"
              style={{
                backgroundColor: 'var(--paper-2)',
                borderColor: 'var(--rule)',
              }}
            >
              {LOCALES.map((loc) => {
                const isActive = locale === loc.code;
                return (
                  <button
                    key={loc.code}
                    type="button"
                    onClick={() => handleLocaleChange(loc.code)}
                    title={loc.nativeName}
                    aria-pressed={isActive}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-full transition cursor-pointer"
                    style={
                      isActive
                        ? {
                            backgroundColor: 'var(--ink)',
                            color: 'var(--paper)',
                          }
                        : {
                            color: 'var(--ink-3)',
                          }
                    }
                  >
                    {loc.label}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
              }
              className="min-h-[44px] text-xs font-medium px-3.5 py-1.5 rounded-full cursor-pointer flex items-center gap-1.5"
              style={{
                backgroundColor: 'var(--paper-2)',
                border: '1px solid var(--rule)',
                color: 'var(--ink-2)',
              }}
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
              <span>{theme === 'dark' ? t.header.lightPaper : t.header.darkInk}</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {microsite && (
              <button
                type="button"
                onClick={handleResetHome}
                className="text-xs font-medium px-2.5 py-1 rounded-full cursor-pointer min-h-[40px] flex items-center"
                style={{
                  backgroundColor: 'var(--paper-2)',
                  border: '1px solid var(--rule)',
                  color: 'var(--ink-2)',
                }}
              >
                {t.header.newSearch}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="min-h-[44px] min-w-[44px] px-3 py-2 rounded-full border flex items-center justify-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: 'var(--paper-2)',
                borderColor: 'var(--rule)',
                color: 'var(--ink)',
              }}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              <span className="text-xs font-semibold">{locale.toUpperCase()}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            role="dialog"
            aria-label="Mobile Navigation Menu"
            className="md:hidden border-t px-4 py-4 space-y-4 shadow-xl transition-all"
            style={{
              backgroundColor: 'var(--paper)',
              borderColor: 'var(--rule)',
            }}
          >
            {/* If a topic is active, show depth calibration switcher */}
            {microsite && (
              <div className="space-y-1.5">
                <span className="kicker block">{t.landing.depthLabel}</span>
                <div className="grid grid-cols-2 gap-2">
                  {LEVELS.map((lvl) => {
                    const isActive = level === lvl.id;
                    const meta = t.levels[lvl.id];
                    return (
                      <button
                        key={lvl.id}
                        type="button"
                        onClick={() => {
                          setIsMobileMenuOpen(false);
                          handleLevelChange(lvl.id);
                        }}
                        className="min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer"
                        style={
                          isActive
                            ? {
                                backgroundColor: 'var(--ink)',
                                color: 'var(--paper)',
                              }
                            : {
                                backgroundColor: 'var(--paper-2)',
                                color: 'var(--ink-2)',
                                border: '1px solid var(--rule)',
                              }
                        }
                      >
                        <span>{meta.label}</span>
                        <span className="font-mono text-[10px] opacity-75">{meta.badge}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick Exploration Topics */}
            <div className="space-y-1.5">
              <span className="kicker block">{t.dropdown.exampleTopics}</span>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_TOPICS.map((preset) => (
                  <button
                    key={preset.slug}
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleSelectTopic(preset.label, preset.slug);
                    }}
                    className="min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition"
                    style={{
                      backgroundColor: 'var(--paper-2)',
                      border: '1px solid var(--rule)',
                      color: 'var(--ink-2)',
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Language & Theme Controls */}
            <div className="pt-3 border-t flex flex-wrap items-center justify-between gap-3" style={{ borderColor: 'var(--rule)' }}>
              <div
                role="group"
                aria-label="Language selector"
                className="inline-flex items-center rounded-full p-0.5 border"
                style={{
                  backgroundColor: 'var(--paper-2)',
                  borderColor: 'var(--rule)',
                }}
              >
                {LOCALES.map((loc) => {
                  const isActive = locale === loc.code;
                  return (
                    <button
                      key={loc.code}
                      type="button"
                      onClick={() => handleLocaleChange(loc.code)}
                      className="min-h-[40px] px-2.5 py-1 text-xs font-semibold rounded-full transition cursor-pointer"
                      style={
                        isActive
                          ? {
                              backgroundColor: 'var(--ink)',
                              color: 'var(--paper)',
                            }
                          : {
                              color: 'var(--ink-3)',
                            }
                      }
                    >
                      {loc.label}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-2 cursor-pointer ml-auto"
                style={{
                  backgroundColor: 'var(--paper-2)',
                  border: '1px solid var(--rule)',
                  color: 'var(--ink)',
                }}
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-indigo-500" />}
                <span>{theme === 'dark' ? t.header.lightPaper : t.header.darkInk}</span>
              </button>
            </div>
          </div>
        )}
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
              <span className="kicker block">{t.landing.kicker}</span>
              <h1
                className="font-serif-editorial text-4xl sm:text-5xl font-normal tracking-tight"
                style={{
                  color: 'var(--ink)',
                  lineHeight: 1.06,
                  letterSpacing: '-0.022em',
                }}
              >
                {t.landing.headline}
              </h1>
              <p
                className="font-serif-editorial text-lg sm:text-xl"
                style={{ color: 'var(--ink-2)' }}
              >
                {t.landing.subtitle}
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
                className={`flex items-center rounded-full px-4 py-1.5 h-full transition-all focus-within:ring-2 focus-within:ring-[var(--accent)]/30 ${
                  isDropdownOpen ? 'border-[var(--accent)]' : 'border-[var(--rule)]'
                }`}
                style={{
                  backgroundColor: 'var(--paper-2)',
                  border: isDropdownOpen
                    ? '1px solid var(--accent)'
                    : '1px solid var(--rule)',
                }}
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={queryInput}
                  onChange={(e) => {
                    setQueryInput(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsDropdownOpen(false);
                      inputRef.current?.blur();
                    }
                  }}
                  placeholder={t.landing.placeholder}
                  aria-label={t.landing.placeholder}
                  aria-expanded={isDropdownOpen}
                  aria-controls="learnx-examples-dropdown"
                  className="w-full bg-transparent text-base border-none shadow-none focus:outline-none"
                  style={{
                    color: 'var(--ink)',
                    outline: 'none',
                    boxShadow: 'none',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsDropdownOpen((open) => !open)}
                  aria-label="Toggle example topics menu"
                  title={t.dropdown.exampleTopics}
                  className="ml-1 p-2 rounded-full cursor-pointer transition min-h-[44px] min-w-[44px] flex items-center justify-center text-[var(--ink-3)] hover:text-[var(--ink)]"
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
                  className="ml-1.5 shrink-0 inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full font-semibold text-xs sm:text-sm disabled:opacity-50 cursor-pointer shadow-xs"
                  style={{
                    backgroundColor: 'var(--ink)',
                    color: 'var(--paper)',
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t.landing.synthesizingBtn}</span>
                    </>
                  ) : (
                    <span>{t.landing.exploreBtn}</span>
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
                        ? t.dropdown.matchingExamples
                        : t.dropdown.exampleTopics}
                    </span>
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--ink-3)' }}
                    >
                      {t.dropdown.selectHint}
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
                          inputRef.current?.blur();
                          setActiveTopicQuery(trimmed);
                          generateMicrosite(trimmed, level, locale);
                        }}
                        className="w-full text-left px-4 py-2.5 flex items-center justify-between gap-3 cursor-pointer transition"
                        style={{
                          backgroundColor: 'var(--accent-soft)',
                          color: 'var(--accent)',
                        }}
                      >
                        <span className="text-xs sm:text-sm font-semibold">
                          {t.dropdown.exploreEdition(
                            queryInput.trim(),
                            currentLevelMeta.label
                          )}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                      </button>
                    )}

                    {filteredExamples.map((item) => {
                      const isCurrent =
                        microsite &&
                        ((item.presetSlug &&
                          activePresetSlug === item.presetSlug) ||
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
                                  {t.dropdown.activeBadge}
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
              className="shrink-0 flex items-center justify-between gap-1.5 rounded-full px-1.5 sm:px-2.5 py-1.5"
              style={{
                backgroundColor: 'var(--paper-2)',
                border: '1px solid var(--rule)',
              }}
            >
              <span className="kicker pl-2 hidden xl:inline shrink-0">
                {t.landing.depthLabel}
              </span>
              <div
                role="group"
                aria-label="Select expertise level from Child to Pro"
                className="flex flex-nowrap items-center justify-between gap-0.5 sm:gap-1 w-full lg:w-auto overflow-x-auto no-scrollbar"
              >
                {LEVELS.map((lvl) => {
                  const active = lvl.id === level;
                  const localizedLevel = t.levels[lvl.id];
                  const isChildBtn = lvl.id === 'child';
                  return (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => handleLevelChange(lvl.id)}
                      disabled={isLoading}
                      className="py-1.5 px-2 sm:px-3 rounded-full text-[11px] sm:text-xs font-semibold whitespace-nowrap transition cursor-pointer text-center"
                      style={
                        active
                          ? isChildBtn
                            ? {
                                backgroundColor: '#f59e0b',
                                color: '#1b1a18',
                              }
                            : {
                                backgroundColor: 'var(--ink)',
                                color: 'var(--paper)',
                              }
                          : {
                              color: 'var(--ink-2)',
                            }
                      }
                    >
                      {isChildBtn ? `🎈 ${localizedLevel.label}` : localizedLevel.label}
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

          {errorMsg && (
            <div className="surface-well px-4 py-3 text-xs sm:text-sm flex items-center justify-between">
              <span>{errorMsg}</span>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-xs underline ml-4 cursor-pointer"
              >
                {t.status.dismiss}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Dedicated Loading View (hides previous page while synthesizing new level/topic) */}
      {isLoading && (
        <main className="flex-1 max-w-3xl w-full mx-auto px-5 sm:px-8 py-16 sm:py-24 flex flex-col items-center justify-center text-center">
          <div
            className="w-full rounded-2xl p-8 sm:p-10 space-y-6 border"
            style={{
              backgroundColor: 'var(--paper-2)',
              borderColor: 'var(--rule)',
            }}
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border mx-auto"
              style={{
                backgroundColor: 'var(--paper)',
                borderColor: 'var(--rule)',
              }}
            >
              <Loader2
                className="w-6 h-6 animate-spin"
                style={{ color: level === 'child' ? '#f59e0b' : 'var(--accent)' }}
              />
            </div>

            <div className="space-y-2">
              <div className="kicker" style={{ color: 'var(--accent)' }}>
                {currentLevelMeta.badge} · {currentLevelMeta.label}
              </div>
              <h2
                className="font-serif-editorial text-2xl sm:text-3xl font-normal"
                style={{ color: 'var(--ink)' }}
              >
                {loadingStage}
              </h2>
              <p className="text-xs sm:text-sm max-w-md mx-auto" style={{ color: 'var(--ink-3)' }}>
                {currentLevelMeta.tagline}
              </p>
            </div>

            {/* Subtle animated skeleton lines */}
            <div className="pt-2 space-y-2.5 max-w-md mx-auto animate-pulse">
              <div
                className="h-2.5 rounded-full w-3/4 mx-auto"
                style={{ backgroundColor: 'var(--rule)' }}
              />
              <div
                className="h-2.5 rounded-full w-full mx-auto"
                style={{ backgroundColor: 'var(--rule)' }}
              />
              <div
                className="h-2.5 rounded-full w-5/6 mx-auto"
                style={{ backgroundColor: 'var(--rule)' }}
              />
            </div>
          </div>
        </main>
      )}

      {/* Main Microsite Body (rendered only when not loading and a topic has been selected) */}
      {!isLoading && microsite && level === 'child' && (
        <ChildStorybookView
          microsite={microsite}
          onSelectTopic={(rh) => handleSelectTopic(rh)}
        />
      )}

      {!isLoading && microsite && level !== 'child' && (
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
                {t.microsite.minRead(microsite.readingTimeMinutes || 4)}
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
                    {t.microsite.keyCoordinates}
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
                  <span className="kicker block mb-1">
                    {t.microsite.essentialReading}
                  </span>
                  <h2
                    className="font-serif-editorial text-2xl font-normal tracking-tight"
                    style={{ color: 'var(--ink)' }}
                  >
                    {t.microsite.topBooksTitle}
                  </h2>
                </div>
                <span className="text-xs" style={{ color: 'var(--ink-3)' }}>
                  {t.microsite.curatedFor(microsite.topic)}
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
                  {t.microsite.connectedTopics}
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
                <span className="kicker block">
                  {t.microsite.primarySources}
                </span>
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
        <div className="max-w-6xl mx-auto px-5 sm:px-8 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>{t.microsite.footerTagline}</div>
            <div className="flex items-center gap-3">
              <a href="/" className="hover:underline">
                learnandplay.ai
              </a>
            </div>
          </div>
          <div
            className="text-[11px] italic"
            style={{ color: 'var(--ink-3)' }}
          >
            {t.microsite.disclaimer}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
