export type ExpertiseLevel = 'novice' | 'intermediate' | 'advanced' | 'pro';

export interface LevelMeta {
  id: ExpertiseLevel;
  label: string;
  shortLabel: string;
  badge: string;
  tagline: string;
  description: string;
  accentColor: string;
}

export interface ArticleSection {
  heading: string;
  body: string;
  highlightCallout?: string;
  keyTerm?: string;
}

export interface KeyFact {
  label: string;
  value: string;
  detail: string;
}

export interface IllustrationNode {
  id: string;
  label: string;
  sublabel: string;
  x: number; // 10 to 90 percentage
  y: number; // 12 to 88 percentage
  detail: string;
  group: 'core' | 'input' | 'output' | 'context';
}

export interface IllustrationConnection {
  from: string;
  to: string;
  label?: string;
}

export interface MicrositeIllustration {
  title: string;
  caption: string;
  visualTheme:
    | 'orbital'
    | 'network'
    | 'wave'
    | 'portrait-constellation'
    | 'architecture'
    | 'equilibrium';
  svgCode?: string;
  nodes: IllustrationNode[];
  connections: IllustrationConnection[];
}

export interface SimulationParameter {
  id: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description: string;
}

export interface TimelineEventItem {
  year: string;
  title: string;
  summary: string;
  impactScore: number; // 1 to 100
  deeperInsight: string;
  domainTag: string;
}

export interface SystemStageItem {
  id: string;
  name: string;
  role: string;
  mechanism: string;
  metricLabel: string;
  baseValue: number;
  sensitivity: number;
}

export interface TradeoffOptionItem {
  name: string;
  tagline: string;
  scores: number[]; // 0-100 corresponding to criteria
  summary: string;
}

export interface MicrositeWidget {
  widgetType: 'simulation' | 'timeline' | 'system-explorer' | 'tradeoff-lab';
  title: string;
  subtitle: string;
  explanation: string;
  // For 'simulation'
  parameters?: SimulationParameter[];
  formulaType?:
    | 'exponential-growth'
    | 'harmonic-wave'
    | 'saturation-logistic'
    | 'inverse-power'
    | 'resonance-peak'
    | 'linear-tradeoff'
    | 'gaussian-bell';
  xAxisLabel?: string;
  yAxisLabel?: string;
  outputMetricLabel?: string;
  outputMetricUnit?: string;
  regimeThresholds?: {
    lowLabel: string;
    midLabel: string;
    highLabel: string;
  };
  // For 'timeline'
  events?: TimelineEventItem[];
  // For 'system-explorer'
  stages?: SystemStageItem[];
  // For 'tradeoff-lab'
  criteria?: { id: string; label: string; defaultWeight: number }[];
  options?: TradeoffOptionItem[];
}

export interface MicrositeQuiz {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface GroundedSource {
  title: string;
  publisher: string;
  url: string;
  relevance: string;
}

export interface RecommendedBook {
  title: string;
  author: string;
  year?: string;
  whyRead: string;
  url?: string;
}

export interface MicrositeData {
  topic: string;
  subtitle: string;
  category: string;
  entityType: 'concept' | 'person' | 'system' | 'phenomenon' | 'event';
  visualMode?: 'diagram' | 'widget';
  level: ExpertiseLevel;
  levelCalibrationNote: string;
  readingTimeMinutes: number;
  tldr: string;
  mentalModelOrFormalism: {
    label: string;
    content: string;
    formulaOrCode?: string;
  };
  sections: ArticleSection[];
  keyFacts: KeyFact[];
  illustration: MicrositeIllustration;
  widget?: MicrositeWidget;
  quiz?: MicrositeQuiz;
  books?: RecommendedBook[];
  rabbitHoles: string[];
  sources: GroundedSource[];
  model?: string;
  grounded?: boolean;
  searchQueries?: string[];
}
