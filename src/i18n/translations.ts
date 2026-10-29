import { ExpertiseLevel, IllustrationNode } from '../types';

export type LocaleCode = 'en' | 'fr' | 'de' | 'zh' | 'ja';

export interface LocaleMeta {
  code: LocaleCode;
  label: string;
  flag: string;
  nativeName: string;
}

export const LOCALES: LocaleMeta[] = [
  { code: 'en', label: 'EN', flag: '🇺🇸/🇬🇧', nativeName: 'English' },
  { code: 'fr', label: 'FR', flag: '🇫🇷', nativeName: 'Français' },
  { code: 'de', label: 'DE', flag: '🇩🇪', nativeName: 'Deutsch' },
  { code: 'zh', label: '中文', flag: '🇨🇳', nativeName: '简体中文' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', nativeName: '日本語' },
];

export interface ExampleTopicTranslation {
  label: string;
  topic: string;
  category: string;
  presetSlug?: string;
}

export interface LearnXTranslations {
  header: {
    newSearch: string;
    lightPaper: string;
    darkInk: string;
  };
  landing: {
    kicker: string;
    headline: string;
    subtitle: string;
    placeholder: string;
    exploreBtn: string;
    synthesizingBtn: string;
    depthLabel: string;
    toggleExamplesLabel: string;
  };
  dropdown: {
    matchingExamples: string;
    exampleTopics: string;
    selectHint: string;
    exploreEdition: (query: string, levelLabel: string) => string;
    activeBadge: string;
  };
  levels: Record<
    ExpertiseLevel,
    {
      label: string;
      badge: string;
      tagline: string;
    }
  >;
  status: {
    synthesizing: (topic: string, levelLabel: string) => string;
    dismiss: string;
    errorFallback: string;
  };
  microsite: {
    minRead: (mins: number) => string;
    diagramKicker: string;
    diagramFallbackTitle: string;
    nodeGroups: Record<IllustrationNode['group'], string>;
    widgetKicker: string;
    widgetFallbackTitle: string;
    chronologyKicker: (current: number, total: number) => string;
    systemLabKicker: string;
    systemDriveLabel: string;
    scrubLabel: string;
    impactLabel: string;
    significanceLabel: string;
    resetBtn: string;
    outputLabel: string;
    controlVarFallback: string;
    responseFallback: string;
    readingModelLabel: string;
    keyCoordinates: string;
    essentialReading: string;
    topBooksTitle: string;
    curatedFor: (topic: string) => string;
    connectedTopics: string;
    primarySources: string;
    footerTagline: string;
    disclaimer: string;
  };
  examples: ExampleTopicTranslation[];
}

export const TRANSLATIONS: Record<LocaleCode, LearnXTranslations> = {
  en: {
    header: {
      newSearch: 'New search',
      lightPaper: 'Light paper',
      darkInk: 'Dark ink',
    },
    landing: {
      kicker: 'Adaptive Knowledge Engine · Novice to Pro',
      headline: 'What would you like to learn?',
      subtitle:
        'Search any concept, theorem, system, or biography—synthesized at your chosen depth.',
      placeholder: 'Type a topic, theorem, system, or person…',
      exploreBtn: 'Explore',
      synthesizingBtn: 'Synthesizing…',
      depthLabel: 'Depth',
      toggleExamplesLabel: 'Browse example topics',
    },
    dropdown: {
      matchingExamples: 'Matching Examples',
      exampleTopics: 'Example Topics',
      selectHint: 'Select an example or press Enter',
      exploreEdition: (q, lvl) => `Explore “${q}” (${lvl} edition)`,
      activeBadge: 'Active',
    },
    levels: {
      novice: {
        label: 'Novice',
        badge: 'L1 · Intuitive',
        tagline: 'Everyday intuition, zero jargon, vivid analogies',
      },
      intermediate: {
        label: 'Intermediate',
        badge: 'L2 · Foundational',
        tagline: 'Core mechanisms, vocabulary, and causal structure',
      },
      advanced: {
        label: 'Advanced',
        badge: 'L3 · Technical',
        tagline: 'Quantitative models, architecture, and real trade-offs',
      },
      pro: {
        label: 'Pro',
        badge: 'L4 · Frontier',
        tagline: 'Formal rigor, edge cases, and open research frontiers',
      },
    },
    status: {
      synthesizing: (topic, lvl) => `Synthesizing ${lvl} edition for “${topic}”…`,
      dismiss: 'Dismiss',
      errorFallback: 'Could not generate microsite. Please try again.',
    },
    microsite: {
      minRead: (mins) => `${mins} min read`,
      diagramKicker: 'Editorial Figure & Schematic Diagram',
      diagramFallbackTitle: 'Conceptual Schematic',
      nodeGroups: {
        input: 'Input · Driver',
        core: 'Core Mechanism',
        output: 'Outcome · Synthesis',
        context: 'Context · Anchor',
      },
      widgetKicker: 'Interactive Model · Live Response Curve',
      widgetFallbackTitle: 'Interactive Parameter Explorer',
      chronologyKicker: (cur, tot) =>
        `Interactive Chronology · Milestone ${cur} of ${tot}`,
      systemLabKicker: 'Interactive System & Perturbation Lab',
      systemDriveLabel: 'System Drive / Impulse',
      scrubLabel: 'Scrub',
      impactLabel: 'Impact',
      significanceLabel: 'Significance:',
      resetBtn: 'Reset',
      outputLabel: 'Output',
      controlVarFallback: 'Control Variable',
      responseFallback: 'Response',
      readingModelLabel: 'Reading the model:',
      keyCoordinates: 'Key Reference Coordinates',
      essentialReading: 'Essential Reading',
      topBooksTitle: 'Top Books to Learn More',
      curatedFor: (topic) => `Curated for ${topic}`,
      connectedTopics: 'Connected Topics',
      primarySources: 'Primary Papers & References',
      footerTagline: 'LearnX · Adaptive Interactive Microsites (Novice to Pro)',
      disclaimer:
        'Disclaimer: These projects are built for fun — take all AI-generated results and syntheses with a grain of salt.',
    },
    examples: [
      {
        label: 'Transformer Self-Attention',
        topic: 'Transformer Self-Attention',
        category: 'AI & Deep Learning',
        presetSlug: 'transformer-attention',
      },
      {
        label: 'Ada Lovelace & Analytical Engine',
        topic: 'Ada Lovelace (1815–1852)',
        category: 'Biography & Computing History',
        presetSlug: 'ada-lovelace',
      },
      {
        label: 'Quantum Entanglement & Bell Tests',
        topic: 'Quantum Entanglement & Bell’s Theorem',
        category: 'Quantum Physics',
        presetSlug: 'quantum-entanglement',
      },
      {
        label: 'Central Banks, Rates & Inflation',
        topic: 'Monetary Policy, Interest Rates & Inflation',
        category: 'Macroeconomics & Finance',
        presetSlug: 'monetary-policy',
      },
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
    ],
  },

  fr: {
    header: {
      newSearch: 'Nouvelle recherche',
      lightPaper: 'Papier clair',
      darkInk: 'Encre sombre',
    },
    landing: {
      kicker: 'Moteur de Connaissance Adaptatif · Du Novice à l’Expert',
      headline: 'Que souhaitez-vous apprendre ?',
      subtitle:
        'Explorez tout concept, théorème, système ou biographie — synthétisé selon votre niveau de maîtrise.',
      placeholder: 'Saisissez un sujet, un théorème, un système ou une personnalité…',
      exploreBtn: 'Explorer',
      synthesizingBtn: 'Synthèse…',
      depthLabel: 'Niveau',
      toggleExamplesLabel: 'Afficher les sujets d’exemple',
    },
    dropdown: {
      matchingExamples: 'Exemples correspondants',
      exampleTopics: 'Exemples de sujets',
      selectHint: 'Choisissez un exemple ou appuyez sur Entrée',
      exploreEdition: (q, lvl) => `Explorer « ${q} » (édition ${lvl})`,
      activeBadge: 'Actif',
    },
    levels: {
      novice: {
        label: 'Novice',
        badge: 'N1 · Intuitif',
        tagline: 'Intuition du quotidien, zéro jargon, analogies concrètes',
      },
      intermediate: {
        label: 'Intermédiaire',
        badge: 'N2 · Fondamental',
        tagline: 'Mécanismes clés, vocabulaire et structure causale',
      },
      advanced: {
        label: 'Avancé',
        badge: 'N3 · Technique',
        tagline: 'Modèles quantitatifs, architecture et compromis réels',
      },
      pro: {
        label: 'Expert',
        badge: 'N4 · Frontière',
        tagline: 'Rigueur formelle, cas limites et frontières de recherche',
      },
    },
    status: {
      synthesizing: (topic, lvl) =>
        `Synthèse de l’édition ${lvl} pour « ${topic} »…`,
      dismiss: 'Fermer',
      errorFallback: 'Impossible de générer le microsite. Veuillez réessayer.',
    },
    microsite: {
      minRead: (mins) => `${mins} min de lecture`,
      diagramKicker: 'Figure Éditoriale & Schéma Conceptuel',
      diagramFallbackTitle: 'Schéma Conceptuel',
      nodeGroups: {
        input: 'Entrée · Moteur',
        core: 'Mécanisme Central',
        output: 'Résultat · Synthèse',
        context: 'Contexte · Ancrage',
      },
      widgetKicker: 'Modèle Interactif · Courbe de Réponse',
      widgetFallbackTitle: 'Explorateur de Paramètres',
      chronologyKicker: (cur, tot) =>
        `Chronologie Interactive · Jalon ${cur} sur ${tot}`,
      systemLabKicker: 'Laboratoire de Système & Perturbation',
      systemDriveLabel: 'Impulsion du système',
      scrubLabel: 'Parcourir',
      impactLabel: 'Impact',
      significanceLabel: 'Portée :',
      resetBtn: 'Réinitialiser',
      outputLabel: 'Sortie',
      controlVarFallback: 'Variable de contrôle',
      responseFallback: 'Réponse',
      readingModelLabel: 'Lecture du modèle :',
      keyCoordinates: 'Repères & Chiffres Clés',
      essentialReading: 'Lectures Essentielles',
      topBooksTitle: 'Meilleurs Livres pour Approfondir',
      curatedFor: (topic) => `Sélection pour ${topic}`,
      connectedTopics: 'Sujets Connexes',
      primarySources: 'Publications Primaires & Références',
      footerTagline: 'LearnX · Microsites Interactifs Adaptatifs (Novice à Expert)',
      disclaimer:
        'Avertissement : Ces projets sont créés pour le plaisir — prenez tous les résultats et synthèses générés par l’IA avec du recul.',
    },
    examples: [
      {
        label: 'Auto-Attention des Transformers',
        topic: 'Auto-attention dans les modèles Transformer',
        category: 'IA & Apprentissage Profond',
        presetSlug: 'transformer-attention',
      },
      {
        label: 'Ada Lovelace & la Machine Analytique',
        topic: 'Ada Lovelace (1815–1852)',
        category: 'Biographie & Histoire de l’Informatique',
        presetSlug: 'ada-lovelace',
      },
      {
        label: 'Intrication Quantique & Tests de Bell',
        topic: 'Intrication quantique et théorème de Bell',
        category: 'Physique Quantique',
        presetSlug: 'quantum-entanglement',
      },
      {
        label: 'Banques Centrales, Taux & Inflation',
        topic: 'Politique monétaire, taux d’intérêt et inflation',
        category: 'Macroéconomie & Finance',
        presetSlug: 'monetary-policy',
      },
      {
        label: 'Marie Curie',
        topic: 'Marie Curie et la radioactivité',
        category: 'Biographie & Physique',
      },
      {
        label: 'CRISPR-Cas9',
        topic: 'Édition génomique CRISPR-Cas9',
        category: 'Biologie Moléculaire',
      },
      {
        label: 'Transformée de Fourier',
        topic: 'Transformée de Fourier',
        category: 'Mathématiques & Traitement du Signal',
      },
      {
        label: 'Formule de Black-Scholes',
        topic: 'Modèle d’évaluation d’options de Black-Scholes',
        category: 'Finance Quantitative',
      },
      {
        label: 'Relativité Générale',
        topic: 'Relativité générale d’Einstein',
        category: 'Physique Théorique',
      },
      {
        label: 'Preuves à Divulgation Nulle (ZKP)',
        topic: 'Preuves à divulgation nulle de connaissance',
        category: 'Cryptographie',
      },
    ],
  },

  de: {
    header: {
      newSearch: 'Neue Suche',
      lightPaper: 'Helles Papier',
      darkInk: 'Dunkle Tinte',
    },
    landing: {
      kicker: 'Adaptives Wissenssystem · Vom Einsteiger bis zum Profi',
      headline: 'Was möchten Sie heute lernen?',
      subtitle:
        'Suchen Sie nach jedem Konzept, Theorem, System oder jeder Biografie — präzise auf Ihre Wissenstiefe abgestimmt.',
      placeholder: 'Thema, Theorem, System oder Persönlichkeit eingeben…',
      exploreBtn: 'Erkunden',
      synthesizingBtn: 'Synthese…',
      depthLabel: 'Tiefe',
      toggleExamplesLabel: 'Beispielthemen anzeigen',
    },
    dropdown: {
      matchingExamples: 'Passende Beispiele',
      exampleTopics: 'Beispielthemen',
      selectHint: 'Beispiel wählen oder Eingabetaste drücken',
      exploreEdition: (q, lvl) => `„${q}“ erkunden (${lvl}-Edition)`,
      activeBadge: 'Aktiv',
    },
    levels: {
      novice: {
        label: 'Einsteiger',
        badge: 'L1 · Intuitiv',
        tagline: 'Alltagsintuition, kein Fachjargon, anschauliche Analogien',
      },
      intermediate: {
        label: 'Fortgeschritten',
        badge: 'L2 · Fundiert',
        tagline: 'Kernmechanismen, Fachbegriffe und kausale Zusammenhänge',
      },
      advanced: {
        label: 'Fachkundig',
        badge: 'L3 · Technisch',
        tagline: 'Quantitative Modelle, Architektur und reale Zielkonflikte',
      },
      pro: {
        label: 'Experte',
        badge: 'L4 · Forschung',
        tagline: 'Formale Strenge, Grenzfälle und aktuelle Forschungsgrenzen',
      },
    },
    status: {
      synthesizing: (topic, lvl) =>
        `Synthetisiere ${lvl}-Edition für „${topic}“…`,
      dismiss: 'Schließen',
      errorFallback: 'Microsite konnte nicht erstellt werden. Bitte erneut versuchen.',
    },
    microsite: {
      minRead: (mins) => `${mins} Min. Lesezeit`,
      diagramKicker: 'Redaktionelle Abbildung & Schemazeichnung',
      diagramFallbackTitle: 'Konzeptschema',
      nodeGroups: {
        input: 'Eingang · Treiber',
        core: 'Kernmechanismus',
        output: 'Ergebnis · Synthese',
        context: 'Kontext · Anker',
      },
      widgetKicker: 'Interaktives Modell · Antwortkurve',
      widgetFallbackTitle: 'Interaktiver Parameter-Explorer',
      chronologyKicker: (cur, tot) =>
        `Interaktive Chronologie · Meilenstein ${cur} von ${tot}`,
      systemLabKicker: 'System- & Störungslabor',
      systemDriveLabel: 'Systemimpuls',
      scrubLabel: 'Zeitachse',
      impactLabel: 'Wirkung',
      significanceLabel: 'Bedeutung:',
      resetBtn: 'Zurücksetzen',
      outputLabel: 'Ausgabe',
      controlVarFallback: 'Steuergröße',
      responseFallback: 'Systemantwort',
      readingModelLabel: 'Modellinterpretation:',
      keyCoordinates: 'Wichtige Referenzdaten',
      essentialReading: 'Empfohlene Literatur',
      topBooksTitle: 'Die besten Bücher zum Weiterlesen',
      curatedFor: (topic) => `Kuratiert für ${topic}`,
      connectedTopics: 'Verwandte Themen',
      primarySources: 'Primärliteratur & Quellen',
      footerTagline: 'LearnX · Adaptive Interaktive Microsites (Einsteiger bis Experte)',
      disclaimer:
        'Hinweis: Diese Projekte sind aus Freude am Experimentieren entstanden — betrachten Sie alle KI-generierten Ergebnisse mit einer gesunden Portion Skepsis.',
    },
    examples: [
      {
        label: 'Transformer Self-Attention',
        topic: 'Transformer Self-Attention Mechanismus',
        category: 'KI & Deep Learning',
        presetSlug: 'transformer-attention',
      },
      {
        label: 'Ada Lovelace & Analytical Engine',
        topic: 'Ada Lovelace (1815–1852)',
        category: 'Biografie & Computergeschichte',
        presetSlug: 'ada-lovelace',
      },
      {
        label: 'Quantenverschränkung & Bell-Tests',
        topic: 'Quantenverschränkung und Bellsche Ungleichung',
        category: 'Quantenphysik',
        presetSlug: 'quantum-entanglement',
      },
      {
        label: 'Zentralbanken, Zinsen & Inflation',
        topic: 'Geldpolitik, Leitzinsen und Inflation',
        category: 'Makroökonomie & Finanzen',
        presetSlug: 'monetary-policy',
      },
      {
        label: 'Marie Curie',
        topic: 'Marie Curie und die Radioaktivität',
        category: 'Biografie & Physik',
      },
      {
        label: 'CRISPR-Cas9',
        topic: 'CRISPR-Cas9 Genom-Editierung',
        category: 'Molekularbiologie',
      },
      {
        label: 'Fourier-Transformation',
        topic: 'Fourier-Transformation',
        category: 'Mathematik & Signalverarbeitung',
      },
      {
        label: 'Black-Scholes-Modell',
        topic: 'Black-Scholes-Optionspreismodell',
        category: 'Quantitative Finanzmathematik',
      },
      {
        label: 'Allgemeine Relativitätstheorie',
        topic: 'Einsteins Allgemeine Relativitätstheorie',
        category: 'Theoretische Physik',
      },
      {
        label: 'Zero-Knowledge-Beweise',
        topic: 'Zero-Knowledge-Beweise in der Kryptografie',
        category: 'Kryptografie',
      },
    ],
  },

  zh: {
    header: {
      newSearch: '新搜索',
      lightPaper: '浅色纸张',
      darkInk: '深色墨水',
    },
    landing: {
      kicker: '自适应知识引擎 · 从入门到专家',
      headline: '今天想探索什么主题？',
      subtitle: '输入任何科学概念、定理、系统架构或人物传记——按您选择的认知深度即时生成深度微站。',
      placeholder: '输入任何主题、定理、系统或知名人物…',
      exploreBtn: '探索',
      synthesizingBtn: '生成中…',
      depthLabel: '深度',
      toggleExamplesLabel: '浏览示例主题',
    },
    dropdown: {
      matchingExamples: '匹配的示例',
      exampleTopics: '精选示例主题',
      selectHint: '选择示例或按回车键生成',
      exploreEdition: (q, lvl) => `探索“${q}”（${lvl}版）`,
      activeBadge: '当前',
    },
    levels: {
      novice: {
        label: '入门',
        badge: 'L1 · 直觉通俗',
        tagline: '生活化直觉与生动类比，零术语门槛',
      },
      intermediate: {
        label: '进阶',
        badge: 'L2 · 核心机制',
        tagline: '核心原理、专业词汇与因果逻辑结构',
      },
      advanced: {
        label: '专业',
        badge: 'L3 · 技术建模',
        tagline: '定量方程、系统架构与工程权衡',
      },
      pro: {
        label: '专家',
        badge: 'L4 · 前沿严谨',
        tagline: '形式化推导、边界条件与开放研究前沿',
      },
    },
    status: {
      synthesizing: (topic, lvl) => `正在为“${topic}”合成${lvl}版微站…`,
      dismiss: '关闭',
      errorFallback: '无法生成微站，请重试。',
    },
    microsite: {
      minRead: (mins) => `${mins} 分钟阅读`,
      diagramKicker: '专题图解与架构示意图',
      diagramFallbackTitle: '概念架构图',
      nodeGroups: {
        input: '输入 · 驱动',
        core: '核心机制',
        output: '输出 · 综合',
        context: '背景 · 锚点',
      },
      widgetKicker: '交互模型 · 实时响应曲线',
      widgetFallbackTitle: '交互参数实验室',
      chronologyKicker: (cur, tot) => `交互年表 · 里程碑 ${cur} / ${tot}`,
      systemLabKicker: '系统与扰动实验室',
      systemDriveLabel: '系统激励幅度',
      scrubLabel: '滑动',
      impactLabel: '影响力',
      significanceLabel: '历史意义：',
      resetBtn: '重置',
      outputLabel: '输出指标',
      controlVarFallback: '控制变量',
      responseFallback: '系统响应',
      readingModelLabel: '模型解读：',
      keyCoordinates: '核心参考坐标',
      essentialReading: '精选延伸阅读',
      topBooksTitle: '深入学习的最佳书籍',
      curatedFor: (topic) => `为“${topic}”精选`,
      connectedTopics: '关联主题探索',
      primarySources: '原始文献与参考资料',
      footerTagline: 'LearnX · 自适应交互式知识微站（从入门到专家）',
      disclaimer:
        '免责声明：本项目纯属兴趣之作 —— 所有 AI 生成的内容与模型仅供参考，请保持审慎思考。',
    },
    examples: [
      {
        label: 'Transformer 自注意力机制',
        topic: 'Transformer 自注意力机制 (Self-Attention)',
        category: '人工智能与深度学习',
        presetSlug: 'transformer-attention',
      },
      {
        label: '阿达·洛夫莱斯与分析机',
        topic: '阿达·洛夫莱斯 (Ada Lovelace)',
        category: '人物传记与计算机史',
        presetSlug: 'ada-lovelace',
      },
      {
        label: '量子纠缠与贝尔实验',
        topic: '量子纠缠与贝尔定理',
        category: '量子物理',
        presetSlug: 'quantum-entanglement',
      },
      {
        label: '中央银行、利率与通货膨胀',
        topic: '货币政策、利率与通货膨胀传导',
        category: '宏观经济学与金融',
        presetSlug: 'monetary-policy',
      },
      {
        label: '玛丽·居里',
        topic: '玛丽·居里与放射性研究',
        category: '人物传记与物理学',
      },
      {
        label: 'CRISPR-Cas9 基因编辑',
        topic: 'CRISPR-Cas9 基因编辑技术',
        category: '分子生物学',
      },
      {
        label: '傅里叶变换',
        topic: '傅里叶变换 (Fourier Transform)',
        category: '数学与信号处理',
      },
      {
        label: '布莱克-斯科尔斯期权定价公式',
        topic: '布莱克-斯科尔斯 (Black-Scholes) 公式',
        category: '量化金融',
      },
      {
        label: '广义相对论',
        topic: '爱因斯坦广义相对论',
        category: '理论物理',
      },
      {
        label: '零知识证明 (ZKP)',
        topic: '密码学中的零知识证明',
        category: '密码学',
      },
    ],
  },

  ja: {
    header: {
      newSearch: '新しい検索',
      lightPaper: 'ライトペーパー',
      darkInk: 'ダークインク',
    },
    landing: {
      kicker: 'アダプティブ知識エンジン · 初学者からプロまで',
      headline: '今日は何を学びますか？',
      subtitle:
        'あらゆる概念・定理・システム・人物伝を検索 — 選択した理解度に合わせて再構成します。',
      placeholder: 'トピック、定理、システム、または人物名を入力…',
      exploreBtn: '探索',
      synthesizingBtn: '生成中…',
      depthLabel: '難易度',
      toggleExamplesLabel: 'サンプルを表示',
    },
    dropdown: {
      matchingExamples: '一致するトピック例',
      exampleTopics: 'おすすめトピック例',
      selectHint: '例を選択するか Enter キーを押してください',
      exploreEdition: (q, lvl) => `「${q}」を探索（${lvl}版）`,
      activeBadge: '表示中',
    },
    levels: {
      novice: {
        label: '初級',
        badge: 'L1 · 直感的',
        tagline: '専門用語なし・日常のたとえ話で直感的に理解',
      },
      intermediate: {
        label: '中級',
        badge: 'L2 · 基礎構造',
        tagline: '主要メカニズム・専門用語・因果関係の基礎',
      },
      advanced: {
        label: '上級',
        badge: 'L3 · 技術実践',
        tagline: '数理モデル・システム設計・実務上のトレードオフ',
      },
      pro: {
        label: 'プロ',
        badge: 'L4 · 最先端',
        tagline: '厳密な定式化・境界条件・未解決の研究フロンティア',
      },
    },
    status: {
      synthesizing: (topic, lvl) => `「${topic}」の${lvl}版を生成しています…`,
      dismiss: '閉じる',
      errorFallback: 'マイクロサイトを生成できませんでした。もう一度お試しください。',
    },
    microsite: {
      minRead: (mins) => `読了約 ${mins} 分`,
      diagramKicker: '概念図・アーキテクチャ図解',
      diagramFallbackTitle: '概念スキーム図',
      nodeGroups: {
        input: '入力 · ドライバー',
        core: '中核メカニズム',
        output: '出力 · 統合',
        context: '文脈 · アンカー',
      },
      widgetKicker: 'インタラクティブモデル · 応答曲線',
      widgetFallbackTitle: 'パラメータ・シミュレータ',
      chronologyKicker: (cur, tot) =>
        `インタラクティブ年表 · マイルストーン ${cur} / ${tot}`,
      systemLabKicker: 'システム応答ラボ',
      systemDriveLabel: 'システム入力インパルス',
      scrubLabel: '操作',
      impactLabel: '影響度',
      significanceLabel: '歴史的意義：',
      resetBtn: 'リセット',
      outputLabel: '出力指標',
      controlVarFallback: '制御変数',
      responseFallback: '応答',
      readingModelLabel: 'モデルの読み方：',
      keyCoordinates: '重要リファレンス指標',
      essentialReading: '必読ブックガイド',
      topBooksTitle: 'さらに深く学ぶための推薦書籍',
      curatedFor: (topic) => `「${topic}」のための厳選書`,
      connectedTopics: '関連トピック',
      primarySources: '主要論文・一次資料',
      footerTagline: 'LearnX · アダプティブ学習マイクロサイト（初級からプロまで）',
      disclaimer:
        '免責事項：これらのプロジェクトは楽しみのために作られたものです — AIによる生成結果はすべて参考程度にご覧ください。',
    },
    examples: [
      {
        label: 'Transformer 自己注意機構',
        topic: 'Transformer の自己注意機構 (Self-Attention)',
        category: 'AI・深層学習',
        presetSlug: 'transformer-attention',
      },
      {
        label: 'エイダ・ラブレスと解析機関',
        topic: 'エイダ・ラブレス (Ada Lovelace)',
        category: '伝記・コンピュータ史',
        presetSlug: 'ada-lovelace',
      },
      {
        label: '量子もつれとベルの不等式',
        topic: '量子もつれとベルの定理',
        category: '量子物理学',
        presetSlug: 'quantum-entanglement',
      },
      {
        label: '中央銀行・金利・インフレ',
        topic: '金融政策・政策金利・インフレーション',
        category: 'マクロ経済・金融',
        presetSlug: 'monetary-policy',
      },
      {
        label: 'マリ・キュリー',
        topic: 'マリ・キュリーと放射能の研究',
        category: '伝記・物理学',
      },
      {
        label: 'CRISPR-Cas9 ゲノム編集',
        topic: 'CRISPR-Cas9 ゲノム編集技術',
        category: '分子生物学',
      },
      {
        label: 'フーリエ変換',
        topic: 'フーリエ変換 (Fourier Transform)',
        category: '数学・信号処理',
      },
      {
        label: 'ブラック–ショールズ方程式',
        topic: 'ブラック–ショールズ・オプション価格モデル',
        category: 'クオンツ金融',
      },
      {
        label: '一般相対性理論',
        topic: 'アインシュタインの一般相対性理論',
        category: '理論物理学',
      },
      {
        label: 'ゼロ知識証明 (ZKP)',
        topic: '暗号理論におけるゼロ知識証明',
        category: '暗号理論',
      },
    ],
  },
};
