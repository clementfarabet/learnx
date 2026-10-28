import { ExpertiseLevel, LevelMeta, MicrositeData } from '../types';

export const LEVELS: LevelMeta[] = [
  {
    id: 'novice',
    label: 'Novice',
    shortLabel: 'Novice',
    badge: 'L1 · Intuitive',
    tagline: 'Everyday intuition, zero jargon, vivid analogies',
    description:
      'Explains from first principles using relatable real-world metaphors and visual storytelling.',
    accentColor: '#10b981',
  },
  {
    id: 'intermediate',
    label: 'Intermediate',
    shortLabel: 'Curious',
    badge: 'L2 · Foundational',
    tagline: 'Core mechanisms, vocabulary, and causal structure',
    description:
      'Connects intuition to the actual building blocks, key terminology, and how the parts interact.',
    accentColor: '#3b82f6',
  },
  {
    id: 'advanced',
    label: 'Advanced',
    shortLabel: 'Practitioner',
    badge: 'L3 · Technical',
    tagline: 'Quantitative models, architecture, and real trade-offs',
    description:
      'Dives into mathematical relationships, governing equations, system bottlenecks, and engineering trade-offs.',
    accentColor: '#8b5cf6',
  },
  {
    id: 'pro',
    label: 'Pro',
    shortLabel: 'Pro / Expert',
    badge: 'L4 · Frontier',
    tagline: 'Formal rigor, edge cases, and open research frontiers',
    description:
      'Presents formal definitions, theoretical bounds, failure modes, and state-of-the-art debates.',
    accentColor: '#f59e0b',
  },
];

export interface PresetTopicVariants {
  slug: string;
  label: string;
  category: string;
  entityType: MicrositeData['entityType'];
  base: Omit<
    MicrositeData,
    | 'level'
    | 'subtitle'
    | 'levelCalibrationNote'
    | 'tldr'
    | 'mentalModelOrFormalism'
    | 'sections'
    | 'quiz'
  >;
  byLevel: Record<
    ExpertiseLevel,
    Pick<
      MicrositeData,
      | 'subtitle'
      | 'levelCalibrationNote'
      | 'tldr'
      | 'mentalModelOrFormalism'
      | 'sections'
      | 'quiz'
    >
  >;
}

export const PRESET_TOPICS: PresetTopicVariants[] = [
  {
    slug: 'transformer-attention',
    label: 'Transformer Self-Attention',
    category: 'AI & Deep Learning',
    entityType: 'system',
    base: {
      topic: 'Transformer Self-Attention',
      category: 'AI & Deep Learning',
      entityType: 'system',
      readingTimeMinutes: 4,
      keyFacts: [
        {
          label: 'Introduced In',
          value: 'June 2017',
          detail: '“Attention Is All You Need” by Vaswani et al. at Google Brain & Research.',
        },
        {
          label: 'Core Complexity',
          value: 'O(N² · d)',
          detail: 'Pairwise token interaction scales quadratically with sequence length N.',
        },
        {
          label: 'Key Innovation',
          value: 'Parallel Routing',
          detail: 'Replaces sequential recurrence (RNNs) with all-to-all content-based lookup.',
        },
        {
          label: 'Modern Variants',
          value: 'Flash / MLA / GQA',
          detail: 'IO-aware tiling and KV-cache compression enable million-token context windows.',
        },
      ],
      illustration: {
        title: 'Multi-Head Scaled Dot-Product Routing',
        caption:
          'Click any node in the architecture diagram to inspect how tokens project into Query, Key, and Value spaces and dynamically route context.',
        visualTheme: 'architecture',
        nodes: [
          {
            id: 'tokens',
            label: 'Token Embeddings + Pos',
            sublabel: 'X ∈ ℝ^(N×d)',
            x: 16,
            y: 50,
            detail:
              'Input words or subwords are converted into continuous vectors and combined with positional encodings (such as RoPE) so order is preserved.',
            group: 'input',
          },
          {
            id: 'qkv',
            label: 'Q / K / V Projections',
            sublabel: 'Learned Linear Maps',
            x: 40,
            y: 26,
            detail:
              'Each token simultaneously plays three roles: Query (what it is looking for), Key (what it advertises), and Value (the information it transmits).',
            group: 'core',
          },
          {
            id: 'scores',
            label: 'Attention Matrix',
            sublabel: 'softmax(QKᵀ / √d_k)',
            x: 52,
            y: 72,
            detail:
              'All token pairs compute dot-product similarity scores, scaled by 1/√d_k to prevent softmax saturation and vanishing gradients.',
            group: 'core',
          },
          {
            id: 'multihead',
            label: 'Multi-Head Subspaces',
            sublabel: 'h Parallel Heads',
            x: 68,
            y: 34,
            detail:
              'Multiple attention heads attend to distinct syntactic, semantic, and positional relationships in parallel low-dimensional subspaces.',
            group: 'core',
          },
          {
            id: 'output',
            label: 'Contextualized Representation',
            sublabel: 'Residual + FFN',
            x: 86,
            y: 52,
            detail:
              'Weighted value vectors are concatenated, projected via W_O, and passed through residual normalization and feed-forward layers.',
            group: 'output',
          },
        ],
        connections: [
          { from: 'tokens', to: 'qkv', label: 'Project W_Q, W_K, W_V' },
          { from: 'qkv', to: 'scores', label: 'Pairwise Dot Product' },
          { from: 'scores', to: 'multihead', label: 'Softmax Weights' },
          { from: 'qkv', to: 'multihead', label: 'Value Vectors V' },
          { from: 'multihead', to: 'output', label: 'Concat & Project W_O' },
        ],
      },
      widget: {
        widgetType: 'simulation',
        title: 'Attention Temperature, Context Length & Scaling Lab',
        subtitle:
          'Adjust softmax temperature, sequence length, and head dimension to visualize attention sharpness vs. compute/memory scaling.',
        explanation:
          'Lower softmax temperatures concentrate probability mass onto the highest-scoring tokens (sharp lookup), while higher temperatures distribute attention broadly across the context.',
        parameters: [
          {
            id: 'temperature',
            label: 'Softmax Temperature (τ)',
            unit: 'τ',
            min: 0.2,
            max: 2.5,
            step: 0.1,
            defaultValue: 0.8,
            description: 'Controls how sharply attention locks onto the top matching Key token.',
          },
          {
            id: 'seqLen',
            label: 'Context Length (N)',
            unit: 'k tok',
            min: 1,
            max: 64,
            step: 1,
            defaultValue: 16,
            description: 'Sequence length in thousands of tokens driving quadratic attention matrix cost.',
          },
          {
            id: 'heads',
            label: 'Active KV Heads',
            unit: 'heads',
            min: 1,
            max: 32,
            step: 1,
            defaultValue: 8,
            description: 'Number of Key-Value heads (Grouped-Query Attention reduces KV cache bandwidth).',
          },
        ],
        formulaType: 'resonance-peak',
        xAxisLabel: 'Relative Token Distance / Key Alignment',
        yAxisLabel: 'Attention Routing Weight α_ij',
        outputMetricLabel: 'Focus Entropy & Bandwidth Index',
        outputMetricUnit: 'score',
        regimeThresholds: {
          lowLabel: 'Diffuse Uniform Mixing',
          midLabel: 'Balanced Contextual Routing',
          highLabel: 'Sharp Needle-in-Haystack Lock',
        },
      },
      rabbitHoles: [
        'FlashAttention & GPU SRAM Tiling',
        'Rotary Position Embeddings (RoPE)',
        'Mixture of Experts (MoE) Routing',
        'Andrej Karpathy',
      ],
      visualMode: 'diagram',
      books: [
        {
          title: 'Build a Large Language Model (From Scratch)',
          author: 'Sebastian Raschka',
          year: '2024',
          whyRead:
            'Step-by-step PyTorch implementation of multi-head self-attention, causal masking, and Transformer pretraining.',
          url: 'https://www.google.com/search?q=Build+a+Large+Language+Model+From+Scratch+Sebastian+Raschka',
        },
        {
          title: 'Speech and Language Processing (3rd ed.)',
          author: 'Dan Jurafsky & James H. Martin',
          year: '2024',
          whyRead:
            'Crystal-clear academic treatment of self-attention geometry, residual streams, and language modeling foundations.',
          url: 'https://web.stanford.edu/~jurafsky/slp3/',
        },
        {
          title: 'Understanding Deep Learning',
          author: 'Simon J. D. Prince',
          year: '2023',
          whyRead:
            'Visual and mathematically rigorous chapters on Transformer blocks, positional encodings, and scaling laws.',
          url: 'https://udlbook.github.io/udlbook/',
        },
      ],
      sources: [
        {
          title: 'Attention Is All You Need (NeurIPS 2017)',
          publisher: 'Vaswani et al. / Google Research',
          url: 'https://arxiv.org/abs/1706.03762',
          relevance: 'Foundational paper introducing Scaled Dot-Product and Multi-Head Attention.',
        },
        {
          title: 'FlashAttention: Fast and Memory-Efficient Exact Attention with IO-Awareness',
          publisher: 'Dao et al. / Stanford',
          url: 'https://arxiv.org/abs/2205.14135',
          relevance: 'Explains how tiling avoids materializing the N×N matrix in GPU HBM.',
        },
        {
          title: 'GQA: Training Generalized Multi-Query Transformer Models',
          publisher: 'Ainslie et al. / Google Research',
          url: 'https://arxiv.org/abs/2305.13245',
          relevance: 'Details Key-Value head sharing for fast autoregressive decoding.',
        },
      ],
      model: 'Curated + Gemini Interactive Engine',
      grounded: true,
    },
    byLevel: {
      novice: {
        subtitle: 'How AI reads an entire page at once by letting every word spotlight the words that matter most to it.',
        levelCalibrationNote:
          'Calibrated for Novice: Uses everyday spotlight and library lookup metaphors—no linear algebra required.',
        tldr: 'Before Transformers, AI read sentences one word at a time like looking through a narrow keyhole, quickly forgetting the beginning of a long paragraph. Self-attention lets every word look at every other word simultaneously and ask: “Who here helps explain what I mean?”',
        mentalModelOrFormalism: {
          label: 'Intuitive Mental Model · The Conference Room Spotlight',
          content:
            'Imagine a room where every word in a sentence is a person. When the word “it” speaks in “The animal didn’t cross the street because it was too tired,” “it” shines a bright spotlight back on “animal” and a dim light on “street.” That dynamic spotlight is self-attention.',
          formulaOrCode:
            'Query ("What am I looking for?") + Key ("What do I offer?") → Spotlight Brightness → Blended Meaning',
        },
        sections: [
          {
            heading: '1. Why Reading Word-by-Word Wasn’t Enough',
            body: 'Older AI models processed text strictly from left to right, passing a single summary note from one word to the next. By the time the model reached the end of a long page, early details blurred together. Self-attention removes the bottleneck by connecting every word directly to every other word in a single step.',
            highlightCallout:
              'In a Transformer, the first word and the thousandth word are just one direct connection apart.',
            keyTerm: 'Direct Context Lookup',
          },
          {
            heading: '2. Three Roles for Every Word: Query, Key, and Value',
            body: 'To decide which words should connect, each word creates three badges: a Query (a search request), a Key (a label describing itself), and a Value (the actual meaning it carries). When a word’s Query matches another word’s Key, a strong connection forms and pulls in that word’s Value.',
            keyTerm: 'Query · Key · Value',
          },
          {
            heading: '3. Multiple Spotlights Working in Parallel',
            body: 'Instead of shining just one spotlight, a Transformer uses many “attention heads” at once. One head might track grammar (matching verbs to subjects), another tracks pronouns (“she” or “it”), and another tracks tone or rhyming patterns.',
            keyTerm: 'Multi-Head Attention',
          },
        ],
        quiz: {
          question:
            'In the sentence “The trophy didn’t fit in the suitcase because it was too big,” what does self-attention help the model do with the word “it”?',
          options: [
            'Connect “it” strongly to “trophy” by comparing their context clues across the sentence',
            'Delete the word “it” to save memory',
            'Read the sentence backward from right to left only',
            'Translate the sentence into numbers without looking at neighboring words',
          ],
          correctIndex: 0,
          explanation:
            'Self-attention compares the Query of “it” (something described as “too big”) with the Keys of earlier nouns, assigning high weight to “trophy.”',
        },
      },
      intermediate: {
        subtitle: 'Content-based routing via Query, Key, and Value vectors across parallel attention heads.',
        levelCalibrationNote:
          'Calibrated for Intermediate: Explains the Q/K/V vector pipeline, softmax scoring, and why Multi-Head Attention enables parallel training.',
        tldr: 'Self-attention transforms a sequence of token embeddings into contextualized representations by computing pairwise similarity scores between learned Query and Key vectors, normalizing those scores with softmax, and taking a weighted sum of Value vectors.',
        mentalModelOrFormalism: {
          label: 'Core Mechanism · Differentiable Dictionary Lookup',
          content:
            'Think of self-attention as a soft, differentiable database query. A traditional hash table returns a single value whose key exactly matches your query. Self-attention computes a dot-product similarity against all keys at once and returns a probability-weighted blend of their values.',
          formulaOrCode: 'Attention(Q, K, V) = softmax((Q · Kᵀ) / √d_k) · V',
        },
        sections: [
          {
            heading: '1. From Static Embeddings to Contextual Representations',
            body: 'A raw token embedding gives the word “bank” the exact same starting vector whether it appears in “river bank” or “central bank.” Self-attention updates each token’s vector by mixing in information from relevant tokens elsewhere in the sequence.',
            highlightCallout:
              'Every layer refines token vectors by routing information across the entire sequence in parallel.',
            keyTerm: 'Contextual Embedding',
          },
          {
            heading: '2. Why We Scale by √d_k Before Softmax',
            body: 'When two high-dimensional vectors are multiplied via a dot product, the variance of their result grows with the dimension d_k. Dividing by √d_k keeps the scores in a well-behaved range so the softmax function does not collapse into an all-or-nothing spike.',
            keyTerm: 'Scaled Dot-Product',
          },
          {
            heading: '3. Multi-Head Subspaces & Causal Masking',
            body: 'Rather than performing one large attention calculation, the model splits vectors into h smaller heads. In decoder models like GPT or Gemini, a triangular causal mask sets future token scores to −∞ so tokens can only attend to past and present positions during training.',
            keyTerm: 'Causal Masking',
          },
        ],
        quiz: {
          question: 'Why does Scaled Dot-Product Attention divide the QKᵀ scores by √d_k before applying softmax?',
          options: [
            'To keep dot-product variance near 1 so softmax gradients do not vanish',
            'To reduce the number of parameters in the Value matrix',
            'To prevent tokens from attending to future positions',
            'To convert token IDs into integers',
          ],
          correctIndex: 0,
          explanation:
            'Without 1/√d_k scaling, large vector dimensions push dot products into extreme regions of softmax where gradients become vanishingly small.',
        },
      },
      advanced: {
        subtitle: 'Bilinear rank-d_k projections, O(N²) memory-bandwidth bottlenecks, and KV-cache geometry.',
        levelCalibrationNote:
          'Calibrated for Advanced: Focuses on matrix dimensions, autoregressive KV-cache memory bounds, Grouped-Query Attention, and RoPE.',
        tldr: 'Given input X ∈ ℝ^(N×d_model), multi-head self-attention applies h low-rank bilinear forms Q_i K_iᵀ = X W_i^Q (W_i^K)ᵀ Xᵀ to construct row-stochastic routing matrices A_i ∈ ℝ^(N×N). While compute scales as O(N² d), real-world throughput is dominated by HBM memory bandwidth and KV-cache footprint.',
        mentalModelOrFormalism: {
          label: 'Mathematical Formulation · Multi-Head Projection & Complexity',
          content:
            'Each head i ∈ {1..h} projects X ∈ ℝ^(N×d) into ℝ^(N×d_k) with d_k = d/h. During prefill, the bottleneck is materializing A ∈ ℝ^(N×N); during autoregressive decoding, the bottleneck shifts to reading the cached K, V ∈ ℝ^(N×h_kv×d_k) tensors from HBM at every token step.',
          formulaOrCode:
            'MHA(X) = Concat(head_1, ..., head_h) W^O,  where head_i = softmax((X W_i^Q (X W_i^K)ᵀ)/√d_k + M) X W_i^V',
        },
        sections: [
          {
            heading: '1. Prefill (Compute-Bound) vs. Decode (Memory-Bandwidth-Bound)',
            body: 'During prompt prefill, all N tokens are known simultaneously, yielding high arithmetic intensity (matrix-matrix multiplications on Tensor Cores). During autoregressive token generation, each new token queries all N prior cached keys and values via matrix-vector products, making inference bounded by GPU HBM bandwidth.',
            highlightCallout:
              'Grouped-Query Attention (GQA) shares Key/Value heads across multiple Query heads, cutting KV-cache bandwidth by 4×–8× with minimal perplexity loss.',
            keyTerm: 'Arithmetic Intensity',
          },
          {
            heading: '2. Relative Positional Geometry with RoPE',
            body: 'Modern Transformers replace additive sinusoidal positions with Rotary Position Embeddings (RoPE), applying block-diagonal 2D rotation matrices R(mθ) to Q and K so that the inner product ⟨R(mθ)q, R(nθ)k⟩ depends strictly on relative token displacement (m − n).',
            keyTerm: 'RoPE Invariance',
          },
          {
            heading: '3. IO-Aware Online Softmax (FlashAttention)',
            body: 'Standard attention writes and reads the N×N intermediate score matrix to slow HBM. FlashAttention tiles Q, K, and V into on-chip SRAM blocks and uses online log-sum-exp rescaling to compute exact attention in a single fused kernel without ever materializing A ∈ ℝ^(N×N) in HBM.',
            keyTerm: 'Online Softmax Tiling',
          },
        ],
        quiz: {
          question:
            'How does FlashAttention eliminate the O(N²) HBM memory footprint without approximating the softmax operation?',
          options: [
            'By tiling Q, K, V in SRAM and maintaining running max and denominator statistics via online softmax rescaling',
            'By replacing the softmax exponential with a linear kernel approximation',
            'By randomly dropping 50% of the attention matrix entries during forward pass',
            'By quantizing Query and Key vectors to 1-bit integers',
          ],
          correctIndex: 0,
          explanation:
            'FlashAttention tracks the running block maximum m(x) and running normalizer l(x) across SRAM tiles, rescaling partial V accumulations to yield the exact softmax output.',
        },
      },
      pro: {
        subtitle:
          'Spectral rank collapse, Multi-Head Latent Attention (MLA), sink tokens, and sub-quadratic state-space duality.',
        levelCalibrationNote:
          'Calibrated for Pro: Examines spectral dynamics of stochastic attention matrices, low-rank KV latent compression, attention sinks, and SSM duality.',
        tldr: 'Viewed as an input-dependent Markov transition operator on token representations, pure self-attention exponentially loses rank across depth unless stabilized by residual pathways and MLPs. At frontier scale, architectures balance exact softmax retrieval (needle-in-a-haystack) against low-rank latent KV compression (MLA) and hybrid linear state-space recurrences.',
        mentalModelOrFormalism: {
          label: 'Frontier Analysis · Spectral Contraction & Latent KV Manifolds',
          content:
            'Without skip connections, repeated multiplication by row-stochastic matrices A_l converges doubly-exponentially to a rank-1 subspace (oversmoothing). Meanwhile, Multi-Head Latent Attention (MLA) compresses K and V jointly into a low-rank latent c_t^KV ∈ ℝ^(d_c) (d_c ≪ h·d_k) while absorbing W^UK into W^Q during inference.',
          formulaOrCode:
            'c_t^KV = W^(DKV) h_t,   k_t^C = W^(UK) c_t^KV,   q_tᵀ k_j^C = (q_tᵀ W^(UK)) c_j^KV   [Matrix Absorption]',
        },
        sections: [
          {
            heading: '1. Attention Sinks & Softmax Simplex Constraints',
            body: 'Because softmax enforces ∑_j α_ij = 1 on the probability simplex, heads that have no meaningful target for a given query dump excess probability mass onto initial tokens (“attention sinks”), which acquire massive activation norms with near-zero value projections to act as a learned no-op bias.',
            highlightCallout:
              'Adding a learnable scalar sink logit or gated attention output removes massive outlier activations that otherwise degrade int4/fp8 quantization.',
            keyTerm: 'Simplex Sink Dynamics',
          },
          {
            heading: '2. Multi-Head Latent Attention (MLA) & Weight Absorption',
            body: 'Rather than caching explicit K,V heads (GQA), MLA projects hidden states into a compressed latent vector c_t^KV. By decoupling a small RoPE-carrying sub-vector k_t^R from the content latent c_t^KV, the up-projection matrix W^UK can be algebraically folded into W^Q at inference time.',
            keyTerm: 'Latent KV Absorption',
          },
          {
            heading: '3. Softmax Retrieval vs. Structured State Space Duality (SSD)',
            body: 'Linear attention and selective state-space models (Mamba-2) replace exp(q_iᵀ k_j) with associative prefix scans over fixed-size state matrices, achieving O(N) scaling but suffering on arbitrary associative recall when the key-value capacity exceeds state rank d_state.',
            keyTerm: 'Associative Recall Bound',
          },
        ],
        quiz: {
          question:
            'In Multi-Head Latent Attention (MLA), why must positional information (RoPE) be applied to a separate decoupled sub-vector rather than directly inside the compressed latent c_t^KV?',
          options: [
            'Because a position-dependent rotation matrix R(m−n) placed between W^Q and W^UK prevents pre-multiplying and absorbing W^UK into W^Q',
            'Because RoPE only works on scalar values and cannot rotate vectors',
            'Because softmax cannot normalize vectors that have been rotated',
            'Because latent vectors must have strictly non-negative entries',
          ],
          correctIndex: 0,
          explanation:
            'If RoPE were applied after up-projecting c_t^KV, the relative rotation R(m−n) would sit between W^Q and W^UK, breaking the associative matrix absorption needed for fast decoding.',
        },
      },
    },
  },
  {
    slug: 'ada-lovelace',
    label: 'Ada Lovelace & Analytical Engine',
    category: 'Biography & Computing History',
    entityType: 'person',
    base: {
      topic: 'Ada Lovelace (1815–1852)',
      category: 'Biography & Computing History',
      entityType: 'person',
      readingTimeMinutes: 4,
      keyFacts: [
        {
          label: 'Landmark Work',
          value: '1843 Notes (A–G)',
          detail: 'Translated Luigi Menabrea’s French paper on Babbage’s Analytical Engine, tripling its length with original theory.',
        },
        {
          label: 'Note G Algorithm',
          value: 'Bernoulli Numbers',
          detail: 'First published trace table showing nested loops, variable state registers, and conditional branching.',
        },
        {
          label: 'Core Breakthrough',
          value: 'Symbolic Computing',
          detail: 'envisioned machines manipulating arbitrary symbols, logic, and music—not merely arithmetic numbers.',
        },
        {
          label: 'Collaborator',
          value: 'Charles Babbage',
          detail: 'Called her “The Enchantress of Number” during their decade-long scientific correspondence.',
        },
      ],
      illustration: {
        title: 'The Analytical Engine & Note G Conceptual Map',
        caption:
          'Click any node to explore how Ada Lovelace bridged Jacquard’s punched-card looms, Babbage’s mechanical architecture, and universal symbolic computation.',
        visualTheme: 'portrait-constellation',
        nodes: [
          {
            id: 'jacquard',
            label: 'Jacquard Punched Cards',
            sublabel: 'Program vs. Data Separation',
            x: 18,
            y: 30,
            detail:
              'Lovelace famously wrote that the Analytical Engine “weaves algebraic patterns just as the Jacquard-loom weaves flowers and leaves.”',
            group: 'input',
          },
          {
            id: 'store-mill',
            label: 'The Store & The Mill',
            sublabel: 'Memory & CPU Precursor',
            x: 42,
            y: 66,
            detail:
              'Babbage’s hardware separated “The Store” (1,000 mechanical column registers) from “The Mill” (the arithmetic processing unit).',
            group: 'core',
          },
          {
            id: 'noteg',
            label: 'Note G Trace Table',
            sublabel: 'Bernoulli Recursion (1843)',
            x: 54,
            y: 26,
            detail:
              'A step-by-step execution table tracking Operation Cards, Variable Cards (V1–V13), loop counters, and intermediate state mutations.',
            group: 'core',
          },
          {
            id: 'poetical',
            label: 'Universal Symbol Manipulation',
            sublabel: 'Beyond Number Crunching',
            x: 82,
            y: 44,
            detail:
              'Lovelace realized that any entity whose mutual relations can be expressed by abstract operations (including musical harmony) can be computed.',
            group: 'output',
          },
        ],
        connections: [
          { from: 'jacquard', to: 'store-mill', label: 'Operation & Variable Cards' },
          { from: 'store-mill', to: 'noteg', label: 'Register State Execution' },
          { from: 'noteg', to: 'poetical', label: 'General Symbolic Abstraction' },
          { from: 'jacquard', to: 'poetical', label: 'Pattern Encoding' },
        ],
      },
      widget: {
        widgetType: 'timeline',
        title: 'Interactive Chronology & Conceptual Milestones (1815–1852)',
        subtitle:
          'Scrub through Ada Lovelace’s life and scientific milestones to inspect her primary insights and historical ripple effects.',
        explanation:
          'Select any milestone along the timeline to inspect the primary historical context, technical significance, and how it anticipated 20th-century computer science.',
        events: [
          {
            year: '1833',
            title: 'Encounters Babbage’s Difference Engine Prototype',
            summary:
              'At age 17, Lovelace examines a working section of Charles Babbage’s finite-difference calculator in London.',
            impactScore: 68,
            deeperInsight:
              'While most visitors saw a mechanical curiosity for printing navigation tables, Lovelace immediately grasped the underlying method of finite differences.',
            domainTag: 'Origins',
          },
          {
            year: '1834',
            title: 'Inspects Industrial Jacquard Silk Looms',
            summary:
              'Tours manufacturing mills in northern England using punched cards to automate intricate woven patterns.',
            impactScore: 76,
            deeperInsight:
              'Gave her the physical mental model for discrete binary control: a hole vs. no-hole dictating a deterministic state transition.',
            domainTag: 'Hardware Intuition',
          },
          {
            year: '1840',
            title: 'Advanced Mathematical Studies with Augustus De Morgan',
            summary:
              'Studies calculus, functional equations, and symbolic logic with the pioneering logician Augustus De Morgan.',
            impactScore: 84,
            deeperInsight:
              'De Morgan’s work on separating algebraic structure from numerical interpretation directly shaped her view of symbolic computation.',
            domainTag: 'Formal Logic',
          },
          {
            year: '1843',
            title: 'Publishes Translation & Notes A–G on the Analytical Engine',
            summary:
              'Authors 40+ pages of analytical notes including the Bernoulli number algorithm and the philosophy of general-purpose computing.',
            impactScore: 100,
            deeperInsight:
              'Formalized loop Backing (branching backward on punched cards), working vs. result variables, and the distinction between mechanism and intelligence.',
            domainTag: 'Magnum Opus',
          },
          {
            year: '1950',
            title: 'Alan Turing Engages “Lady Lovelace’s Objection”',
            summary:
              'In “Computing Machinery and Intelligence,” Turing explicitly cites Lovelace’s Note G as the benchmark philosophical argument on AI.',
            impactScore: 93,
            deeperInsight:
              'Lovelace’s statement that the Engine “has no pretensions whatever to originate anything” framed a century-long debate on machine creativity.',
            domainTag: 'AI Legacy',
          },
        ],
      },
      rabbitHoles: [
        'Charles Babbage & The Analytical Engine',
        'Alan Turing & The Halting Problem',
        'Jacquard Loom & Binary Punched Cards',
        'Bernoulli Numbers & Generating Functions',
      ],
      visualMode: 'diagram',
      books: [
        {
          title: 'Ada, the Enchantress of Numbers',
          author: 'Betty Alexandra Toole',
          year: '1992',
          whyRead:
            'Draws directly from Lovelace’s primary correspondence and notebooks to trace her mathematical development.',
          url: 'https://www.google.com/search?q=Ada+the+Enchantress+of+Numbers+Betty+Alexandra+Toole',
        },
        {
          title: 'Ada’s Algorithm',
          author: 'James Essinger',
          year: '2014',
          whyRead:
            'Accessible biographical narrative connecting the Industrial Revolution’s Jacquard looms to the birth of computing.',
          url: 'https://www.google.com/search?q=Ada%27s+Algorithm+James+Essinger',
        },
        {
          title: 'The Thrilling Adventures of Lovelace and Babbage',
          author: 'Sydney Padua',
          year: '2015',
          whyRead:
            'Deeply researched, richly illustrated breakdown of the Analytical Engine’s mechanical gearwork and Note G.',
          url: 'https://www.google.com/search?q=The+Thrilling+Adventures+of+Lovelace+and+Babbage+Sydney+Padua',
        },
      ],
      sources: [
        {
          title: 'Sketch of the Analytical Engine Invented by Charles Babbage, with Notes by the Translator',
          publisher: 'Taylor’s Scientific Memoirs (1843)',
          url: 'https://www.fourmilab.ch/babbage/sketch.html',
          relevance: 'Primary text containing Notes A through G signed “A.A.L.”',
        },
        {
          title: 'Ada’s Legacy: Cultures of Computing from the Victorian to the Digital Age',
          publisher: 'ACM Books / Hammerman & Russell',
          url: 'https://dl.acm.org/doi/book/10.1145/2809523',
          relevance: 'Scholarly analysis of Note G’s algorithm and symbolic computing vision.',
        },
      ],
      model: 'Curated + Gemini Interactive Engine',
      grounded: true,
    },
    byLevel: {
      novice: {
        subtitle: 'The 19th-century mathematician who saw that a machine built of gears could compose music and process any symbol—a century before electronic computers.',
        levelCalibrationNote:
          'Calibrated for Novice: Focuses on her life story, the Jacquard loom connection, and why her vision went far beyond a calculator.',
        tldr: 'In the 1840s, when steam engines and clockwork gears ruled technology, Ada Lovelace looked at blueprints for an unbuilt mechanical calculator and realized something extraordinary: if a machine can follow rules to manipulate numbers, it can manipulate words, logic, or musical notes. She wrote the first published step-by-step computer program in 1843.',
        mentalModelOrFormalism: {
          label: 'Intuitive Analogy · From Weaving Thread to Weaving Ideas',
          content:
            'Silk looms in the 1800s used chains of cardboard cards with punched holes to tell hooks which threads to lift, automatically weaving complex flowers into fabric. Lovelace realized that if you swap colored threads for mathematical symbols, punched cards become software.',
          formulaOrCode: 'Punched Cards (Instructions) + Mechanical Gears (Processor) = General-Purpose Computer',
        },
        sections: [
          {
            heading: '1. Poetical Science: Blending Imagination and Math',
            body: 'Born in 1815 as the daughter of the Romantic poet Lord Byron and the mathematically trained Lady Wentworth, Ada was tutored intensively in science and mathematics. She called her approach “poetical science”—using disciplined imagination to see hidden connections across fields.',
            highlightCallout:
              '“The Analytical Engine weaves algebraic patterns just as the Jacquard-loom weaves flowers and leaves.” — Ada Lovelace, 1843',
            keyTerm: 'Poetical Science',
          },
          {
            heading: '2. Moving Beyond a Giant Calculator',
            body: 'Her collaborator Charles Babbage designed the Analytical Engine primarily to calculate math tables quickly and without human error. Lovelace saw a much bigger horizon: numbers could simply be codes representing musical pitches, logical propositions, or scientific laws.',
            keyTerm: 'Symbolic Machine',
          },
          {
            heading: '3. Writing the First Published Program (Note G)',
            body: 'Although the machine was never fully built in her lifetime, Lovelace wrote a detailed table showing exactly how to instruct the machine to calculate a complex sequence called Bernoulli numbers—complete with reusable loops and memory slots.',
            keyTerm: 'Note G Algorithm',
          },
        ],
        quiz: {
          question: 'What made Ada Lovelace’s vision of the Analytical Engine radically different from a standard calculator?',
          options: [
            'She realized it could manipulate any symbols—including logic and music—whose rules could be expressed formally',
            'She invented electricity to power its vacuum tubes',
            'She proved that machines could never use punched cards',
            'She designed a pocket-sized abacus for merchants',
          ],
          correctIndex: 0,
          explanation:
            'In Note A, Lovelace explicitly argued that the Engine was not restricted to arithmetic number-crunching, anticipating universal symbolic computing.',
        },
      },
      intermediate: {
        subtitle: 'How Lovelace’s 1843 Notes formalized separation of memory and processor, conditional branching, and symbolic computation.',
        levelCalibrationNote:
          'Calibrated for Intermediate: Connects Babbage’s Store/Mill hardware to Lovelace’s Operation Cards, Variable Cards, and loop architecture.',
        tldr: 'In her 1843 commentary on Babbage’s Analytical Engine, Ada Lovelace articulated the foundational principles of modern software: separating instructions (Operation Cards) from memory addresses (Variable Cards), tracing state mutations across registers, and executing nested conditional loops.',
        mentalModelOrFormalism: {
          label: 'Architectural Mapping · 1843 Engine vs. Von Neumann Computer',
          content:
            'Babbage and Lovelace’s Analytical Engine maps cleanly onto modern computer architecture: “The Store” is RAM (1,000 columns of 50-digit gear registers), “The Mill” is the ALU/CPU, and punched card chains provide separated instruction and memory-address streams.',
          formulaOrCode:
            'Store (Memory Registers V1..Vn) ⇄ Mill (Arithmetic Unit) ← Controlled by Operation & Variable Cards',
        },
        sections: [
          {
            heading: '1. Operation Cards vs. Variable Cards',
            body: 'In her Notes, Lovelace carefully distinguished between Operation Cards (which specify the operation +, −, ×, ÷ for the Mill) and Variable Cards (which specify which column in the Store provides the input or receives the output). This decoupled control logic from data storage.',
            keyTerm: 'Opcode vs. Address',
          },
          {
            heading: '2. Loops, “Backing,” and Conditional Control Flow',
            body: 'To compute the nth Bernoulli number without punching thousands of repetitive cards, Lovelace used “backing”—reversing the card cylinder to repeat a sequence of operations until a counter register in the Store hit zero, changing the Mill’s lever state.',
            highlightCallout:
              'Note G’s diagram is a complete execution trace tracking 25 operations, 13 variable registers, and two nested loops.',
            keyTerm: 'Conditional Backing',
          },
          {
            heading: '3. “Lady Lovelace’s Objection” on Machine Intelligence',
            body: 'In Note G, she cautioned against overhyping the machine: “The Analytical Engine has no pretensions whatever to originate anything. It can do whatever we know how to order it to perform.” A century later, Alan Turing dedicated a section of his famous 1950 AI paper to debating her claim.',
            keyTerm: 'Lovelace’s Objection',
          },
        ],
        quiz: {
          question: 'In the Analytical Engine architecture described in Lovelace’s Notes, what was the role of “backing”?',
          options: [
            'Reversing the punched-card chain to repeat a block of instructions—implementing a program loop',
            'Storing backup copies of data on paper tape',
            'Supplying coal to the steam boiler driving the gears',
            'Translating French mathematical notation into English',
          ],
          correctIndex: 0,
          explanation:
            'Backing physically stepped the card prism backward when a condition was met, allowing a compact loop of cards to iterate over changing register values.',
        },
      },
      advanced: {
        subtitle: 'Deconstructing Note G’s recursive Bernoulli recurrence, register allocation, and Harvard-style instruction stream.',
        levelCalibrationNote:
          'Calibrated for Advanced: Analyzes the mathematical recurrence in Note G, register lifecycles (V1–V13), and micro-architectural card synchronization.',
        tldr: 'Note G implements an iterative solver for the implicit recurrence defining the even-indexed Bernoulli numbers B_{2n}. Lovelace allocated 13 registers across Working, Data, and Result partitions, encoding an outer induction over k and an inner summation loop controlled by sign-lever branching.',
        mentalModelOrFormalism: {
          label: 'Algorithmic Specification · Note G Recurrence for B_{2n}',
          content:
            'Lovelace selected the expansion 0 = −(1/2)·(2n−1)/(2n+1) + B_2·(2n/2) + B_4·(2n(2n−1)(2n−2)/(2·3·4)) + ... + B_{2n} so that each new Bernoulli number B_{2n} is isolated as a linear combination of previously stored Result registers V_6, V_7, V_8...',
          formulaOrCode:
            '0 = -1/2 · (2n-1)/(2n+1) + ∑_{k=1}^{n-1} [binom(2n, 2k) / (2n - 2k + 1)] B_{2k} + B_{2n}',
        },
        sections: [
          {
            heading: '1. Register Partitioning in the Store (V1–V13)',
            body: 'Lovelace partitioned the Store into three strict classes: V1–V3 for constants and input parameter n; V4–V5 for ephemeral working accumulators that are zeroed after read; and V6–V13 for persistent memoized outputs (B_1, B_3, B_5 in her odd-indexed notation). She introduced superscript notation (^1V_4, ^2V_4) to denote Static Single Assignment-like version states of a mutable register.',
            highlightCallout:
              'Her superscript notation (^k V_m) tracked temporal state mutations of physical memory addresses—a direct precursor to SSA form in compiler theory.',
            keyTerm: 'Versioned Register State',
          },
          {
            heading: '2. Nested Cycle Topology: (1..7) and (13..23)',
            body: 'Operations 1–7 compute the leading term and first coefficient; Operations 8–12 handle the base case n=1 via a conditional test on V_3 = n − 1; Operations 13–23 form the inner polynomial reduction loop that decrements the remaining index counter in V_10 until zero.',
            keyTerm: 'Cycle Notation',
          },
          {
            heading: '3. Symbolic Algebra & De Morgan’s Peacock Principle',
            body: 'Influenced by George Peacock and Augustus De Morgan’s “science of operations,” Lovelace framed the Engine not as an arithmetic device, but as a physical realization of an abstract operational calculus ∂(A, B) whose carrier set could be numbers, harmonic intervals, or logical predicates.',
            keyTerm: 'Operational Calculus',
          },
        ],
        quiz: {
          question: 'What did Ada Lovelace’s superscript notation such as ²V₄ vs. ³V₄ represent in the Note G execution table?',
          options: [
            'Successive temporal state values stored inside physical memory column V₄ as the algorithm mutated it',
            'Raising the number inside register V₄ to the 2nd or 3rd power',
            'Addressing the 2nd or 3rd Babbage Difference Engine',
            'Converting binary digits into base-4 arithmetic',
          ],
          correctIndex: 0,
          explanation:
            'She invented pre-superscripts (^0V_4, ^1V_4, ^2V_4) to distinguish the changing value held by column V_4 over time—essentially manual Static Single Assignment (SSA) tracing.',
        },
      },
      pro: {
        subtitle:
          'Turing completeness of the 1843 Analytical Engine, micro-programmed barrel control, and historical historiography of Note G.',
        levelCalibrationNote:
          'Calibrated for Pro: Examines Turing-completeness proofs, Harvard vs. von Neumann addressability limits, the Operation 4 division typo, and Turing’s 1950 critique.',
        tldr: 'With an unbounded Store and conditional card-backing triggered by the Mill’s run-up lever (carry/sign overflow), the Analytical Engine architecture specified in 1843 is formally Turing-complete (equivalent to a Minsky register machine), barring only dynamic computed memory addressing (indirection on Variable Cards).',
        mentalModelOrFormalism: {
          label: 'Formal Computation Theory · Minsky Register Machine Equivalence',
          content:
            'Because the Mill sets a mechanical “run-up” flag whenever a subtraction crosses zero, and this flag conditionally engages the card-backing ratchet by k steps, the Engine supports INC/DEC and JZ (Jump-if-Zero) over arbitrary registers—satisfying Minsky’s two-counter universality theorem.',
          formulaOrCode:
            'Run-Up Lever (Sign Change on V_k - 1) ⟹ Conditional Card Prism Offset ΔPC ∈ ℤ   (Turing-Complete Control)',
        },
        sections: [
          {
            heading: '1. Harvard Separation & The Missing Indirection Operator',
            body: 'Because Operation Cards and Variable Cards run on separate physical prisms, programs cannot modify their own code (strict Harvard architecture). Furthermore, because a Variable Card hardcodes column index m, indexing an array A[i] requires either stepping the Variable Card prism mechanically or unrolling register transfers.',
            highlightCallout:
              'Babbage later explored “Combinatorial Cards” to step Variable Cards relative to loop counters, bridging toward indexed addressing.',
            keyTerm: 'Address Indirection Limit',
          },
          {
            heading: '2. Primary Correspondence & The Operation 4 Reciprocal Bug',
            body: 'Surviving letters in the Bodleian Library between Lovelace and Babbage (July–August 1843) show Lovelace wrestling with the indexing of the inner loop (Operations 13–23) while Babbage supplied earlier algebraic equations. In Operation 4 of the printed table, the division V_5 / V_4 is inverted relative to the formula—the first documented software bug in print.',
            keyTerm: 'Operation 4 Bug',
          },
          {
            heading: '3. Epistemology of “Originating”: Deterministic Transitions vs. Stochastic Learning',
            body: 'In his 1950 Mind paper, Alan Turing responded to Lovelace’s Note G (“The Engine has no pretensions to originate anything”) by observing that a deterministic discrete-state machine with self-modifying storage or stochastic learning rules exhibits emergent behavior that violates the premise that programmers foresee all consequences of their code.',
            keyTerm: 'Emergence vs. Determinism',
          },
        ],
        quiz: {
          question:
            'Which architectural feature of Babbage and Lovelace’s 1843 design differed from a modern von Neumann random-access machine despite its register-machine Turing completeness?',
          options: [
            'Variable Cards hardcoded static column numbers, lacking native register-indirect memory addressing (A[V_i]) without mechanical card-stepping',
            'The Engine lacked any conditional branching mechanism',
            'The Store could only hold 1-bit boolean values rather than decimal integers',
            'The Mill could only perform addition and lacked subtraction or division',
          ],
          correctIndex: 0,
          explanation:
            'While conditional backing provided universal control flow, each Variable Card addressed a fixed Store column rather than dereferencing an address stored inside another register.',
        },
      },
    },
  },
  {
    slug: 'quantum-entanglement',
    label: 'Quantum Entanglement & Bell Tests',
    category: 'Quantum Physics',
    entityType: 'phenomenon',
    base: {
      topic: 'Quantum Entanglement & Bell’s Theorem',
      category: 'Quantum Physics',
      entityType: 'phenomenon',
      readingTimeMinutes: 4,
      keyFacts: [
        {
          label: 'Classical Bound',
          value: '|S| ≤ 2',
          detail: 'Maximum correlation allowed by any local hidden-variable theory in the CHSH inequality.',
        },
        {
          label: 'Quantum Bound',
          value: '2√2 ≈ 2.828',
          detail: 'Tsirelson’s bound achieved by maximally entangled Bell singlet/triplet states.',
        },
        {
          label: 'Nobel Prize',
          value: '2022 Physics',
          detail: 'Awarded to Aspect, Clauser, and Zeilinger for loophole-free Bell tests and quantum information.',
        },
        {
          label: 'No-Signaling',
          value: 'c Limit Intact',
          detail: 'Marginal outcomes at each detector remain 50/50 random; no faster-than-light messages can be sent.',
        },
      ],
      illustration: {
        title: 'CHSH Bell Test & Entangled Photon Pair Geometry',
        caption:
          'Click any node to inspect how an entangled photon source distributes correlated quantum states to space-like separated polarizers Alice and Bob.',
        visualTheme: 'orbital',
        nodes: [
          {
            id: 'source',
            label: 'Entangled Pair Source',
            sublabel: '|Ψ⁻⟩ = (|01⟩ − |10⟩)/√2',
            x: 50,
            y: 22,
            detail:
              'A nonlinear crystal (via spontaneous parametric down-conversion) emits two photons described by a single non-separable joint wavefunction.',
            group: 'core',
          },
          {
            id: 'alice',
            label: 'Alice’s Polarizer (θ_A)',
            sublabel: 'Local Random Choice a, a′',
            x: 18,
            y: 62,
            detail:
              'Alice rotates her measurement axis while the photon is in flight. Locally, she always observes +1 or −1 with 50% probability.',
            group: 'input',
          },
          {
            id: 'bob',
            label: 'Bob’s Polarizer (θ_B)',
            sublabel: 'Local Random Choice b, b′',
            x: 82,
            y: 62,
            detail:
              'Space-like separated from Alice so no light-speed signal can inform Bob’s photon of Alice’s analyzer setting.',
            group: 'input',
          },
          {
            id: 'coincidence',
            label: 'CHSH Correlation Monitor',
            sublabel: 'E(θ_A, θ_B) = −cos(2Δθ)',
            x: 50,
            y: 78,
            detail:
              'When Alice and Bob compare timestamps afterward, their joint correlations follow cos(2Δθ), violating the classical linear bound |S| ≤ 2.',
            group: 'output',
          },
        ],
        connections: [
          { from: 'source', to: 'alice', label: 'Photon A' },
          { from: 'source', to: 'bob', label: 'Photon B' },
          { from: 'alice', to: 'coincidence', label: 'Outcome A ∈ {±1}' },
          { from: 'bob', to: 'coincidence', label: 'Outcome B ∈ {±1}' },
        ],
      },
      widget: {
        widgetType: 'simulation',
        title: 'Interactive Bell / CHSH Polarizer Angle Lab',
        subtitle:
          'Rotate detector angle Δθ and state purity to watch quantum cosine correlations violate the classical hidden-variable limit.',
        explanation:
          'At optimal polarizer angle separation (Δθ = 22.5° / π/8), entangled photons reach S = 2.828 (Tsirelson’s bound), proving no pre-written local instruction sheet can explain nature.',
        parameters: [
          {
            id: 'angleDeg',
            label: 'Analyzer Angle Offset (Δθ)',
            unit: '°',
            min: 0,
            max: 90,
            step: 2.5,
            defaultValue: 22.5,
            description: 'Relative angle between Alice and Bob’s polarization analyzers.',
          },
          {
            id: 'purity',
            label: 'Entanglement Visibility (V)',
            unit: '%',
            min: 50,
            max: 100,
            step: 1,
            defaultValue: 98,
            description: 'Werner state purity; Bell violation requires visibility V > 1/√2 ≈ 70.7%.',
          },
          {
            id: 'efficiency',
            label: 'Detector Efficiency (η)',
            unit: '%',
            min: 60,
            max: 100,
            step: 1,
            defaultValue: 92,
            description: 'Closing the detection loophole requires η > 82.8% for symmetric CHSH tests.',
          },
        ],
        formulaType: 'harmonic-wave',
        xAxisLabel: 'Relative Analyzer Angle Δθ (0° to 180°)',
        yAxisLabel: 'Quantum Correlation E(Δθ) vs. Classical Bound',
        outputMetricLabel: 'CHSH Bell Parameter |S|',
        outputMetricUnit: 'S-score',
        regimeThresholds: {
          lowLabel: 'Classical / Separable Regime (|S| ≤ 2)',
          midLabel: 'Entangled Witness Regime',
          highLabel: 'Loophole-Free Bell Violation (|S| > 2)',
        },
      },
      rabbitHoles: [
        'John Stewart Bell',
        'Quantum Teleportation & QKD',
        'EPR Paradox (Einstein-Podolsky-Rosen)',
        'Quantum Error Correction & Surface Codes',
      ],
      visualMode: 'widget',
      books: [
        {
          title: 'Speakable and Unspeakable in Quantum Mechanics',
          author: 'J. S. Bell',
          year: '1987',
          whyRead:
            'John Bell’s collected papers on nonlocality, hidden variables, and the conceptual foundations of quantum physics.',
          url: 'https://www.google.com/search?q=Speakable+and+Unspeakable+in+Quantum+Mechanics+John+Bell',
        },
        {
          title: 'Quantum Computation and Quantum Information',
          author: 'Michael A. Nielsen & Isaac L. Chuang',
          year: '2010',
          whyRead:
            'The definitive textbook on Bell states, CHSH inequalities, density operators, and quantum information theory.',
          url: 'https://www.google.com/search?q=Quantum+Computation+and+Quantum+Information+Nielsen+Chuang',
        },
        {
          title: 'The Age of Entanglement',
          author: 'Louisa Gilder',
          year: '2008',
          whyRead:
            'Brings the historical debates between Einstein, Bohr, Bell, Clauser, and Aspect to life for any curious reader.',
          url: 'https://www.google.com/search?q=The+Age+of+Entanglement+Louisa+Gilder',
        },
      ],
      sources: [
        {
          title: 'On the Einstein Podolsky Rosen Paradox (Physics, 1964)',
          publisher: 'J. S. Bell / CERN',
          url: 'https://cds.cern.ch/record/111654',
          relevance: 'Original derivation showing local hidden variables obey testable statistical inequalities.',
        },
        {
          title: 'Scientific Background on the Nobel Prize in Physics 2022',
          publisher: 'Royal Swedish Academy of Sciences',
          url: 'https://www.nobelprize.org/prizes/physics/2022/advanced-information/',
          relevance: 'Reviews Clauser, Aspect, and Zeilinger’s experiments closing locality and detection loopholes.',
        },
      ],
      model: 'Curated + Gemini Interactive Engine',
      grounded: true,
    },
    byLevel: {
      novice: {
        subtitle: 'Why two quantum particles can act like synchronized coins across the galaxy—and why it’s even stranger than hidden instructions.',
        levelCalibrationNote:
          'Calibrated for Novice: Uses the “matching shoes vs. quantum dice” story to show why entanglement isn’t just secret pre-written notes.',
        tldr: 'When two quantum particles become entangled, they stop having separate individual states and share a single combined identity. Measure one particle here and its partner miles away immediately shows a matching result—even though neither particle “decided” its outcome before you looked.',
        mentalModelOrFormalism: {
          label: 'Intuitive Contrast · Left/Right Shoes vs. Entangled Coins',
          content:
            'If you put a left shoe in one box and a right shoe in another, opening your box tells you what’s in the other box—that’s ordinary classical knowledge. Entangled particles are like two coins that are still spinning in the air until one lands, yet when tilted at trick angles, they match more often than any pre-written instruction checklist could ever allow.',
          formulaOrCode: 'Classical Secret Instructions ≤ 2.00  |  Quantum Entangled Reality = 2.83',
        },
        sections: [
          {
            heading: '1. Einstein’s “Spooky Action” Skepticism',
            body: 'Albert Einstein hated the idea that measuring a particle in one lab could instantaneously affect a partner particle far away. He argued that particles must carry hidden “instruction cards” from the moment they are created—like a pair of gloves placed in two suitcases.',
            highlightCallout:
              'For 30 years, physicists thought there was no experiment that could tell the difference between Einstein’s hidden cards and true quantum entanglement.',
            keyTerm: 'Hidden Instructions',
          },
          {
            heading: '2. John Bell’s Ingenious Game (1964)',
            body: 'In 1964, physicist John Stewart Bell proved mathematically that if two distant experimenters tilt their detectors at intermediate angles (like 22.5 degrees), any particles carrying pre-written instruction cards can agree only up to a strict limit. Quantum mechanics predicts they will agree significantly more often.',
            keyTerm: 'Bell’s Test',
          },
          {
            heading: '3. Why We Still Can’t Send Faster-Than-Light Texts',
            body: 'Even though entangled particles coordinate instantly, each experimenter looking only at their own detector sees a completely random 50/50 stream of heads and tails. You only see the magic correlation when you bring both logs together afterward by regular phone or fiber optics.',
            keyTerm: 'No Faster-Than-Light Chat',
          },
        ],
        quiz: {
          question: 'Why does an entangled particle pair differ from putting one red sock and one blue sock into two separate boxes?',
          options: [
            'When measured at tilted detector angles, entangled particles correlate more strongly than any pre-existing property could allow',
            'Because socks cannot travel at the speed of light',
            'Because entangled particles let you send Morse code faster than light',
            'Because both entangled particles always turn into gold when measured',
          ],
          correctIndex: 0,
          explanation:
            'Bell’s theorem proves that pre-assigned properties (like red/blue socks) obey a strict mathematical ceiling at intermediate measurement angles, which entangled particles decisively break.',
        },
      },
      intermediate: {
        subtitle: 'Non-separable joint wavefunctions, the EPR paradox, and how CHSH Bell experiments rule out local realism.',
        levelCalibrationNote:
          'Calibrated for Intermediate: Explains superposition, the CHSH inequality |S| ≤ 2 vs. 2√2, and the no-signaling principle.',
        tldr: 'Two systems are entangled when their joint quantum state cannot be factored into a product of individual states. Bell’s inequality tests whether measurement outcomes can be explained by Local Realism—the assumption that particles possess definite pre-existing values and cannot influence each other faster than light.',
        mentalModelOrFormalism: {
          label: 'Core Principle · Linear Classical Bound vs. Cosine Quantum Curve',
          content:
            'Any local hidden-variable model produces correlations that change at most linearly with detector angle, bounding the CHSH combination of four angle pairs to |S| ≤ 2. Quantum polarization projections follow Malus’s cosine law −cos(2Δθ), which bows outward and reaches 2√2 ≈ 2.828 at Δθ = 22.5°.',
          formulaOrCode: '|Ψ⁻⟩ = (|01⟩ - |10⟩) / √2   ⟹   S_CHSH = |E(a,b) - E(a,b′) + E(a′,b) + E(a′,b′)| = 2√2 > 2',
        },
        sections: [
          {
            heading: '1. Separable vs. Entangled States',
            body: 'If Photon A is horizontal |H⟩ and Photon B is vertical |V⟩, their joint state |H⟩⊗|V⟩ is separable: each photon has its own independent identity. In the Bell singlet state (|HV⟩ − |VH⟩)/√2, neither photon has a definite polarization on its own—only their relative relationship is defined.',
            keyTerm: 'Non-Separability',
          },
          {
            heading: '2. The CHSH Inequality (|S| ≤ 2)',
            body: 'Suppose Alice chooses between two detector angles (a, a′) and Bob chooses between (b, b′), each recording +1 or −1. If predetermined hidden values A(λ), B(λ) ∈ {±1} existed, then for every single trial A(b − b′) + A′(b + b′) equals either +2 or −2, forcing the average |S| ≤ 2.',
            highlightCallout:
              'Setting angles 22.5° apart gives cos(45°) = √2/2 ≈ 0.707 per term, summing to 4 × 0.707 = 2.828.',
            keyTerm: 'CHSH Inequality',
          },
          {
            heading: '3. Closing the Experimental Loopholes',
            body: 'Decades of experiments by Clauser, Aspect, and Zeilinger progressively closed the “locality loophole” (switching polarizer angles in flight faster than light can travel between labs) and the “detection loophole” (using high-efficiency superconducting detectors).',
            keyTerm: 'Loophole-Free Bell Test',
          },
        ],
        quiz: {
          question: 'What is the maximum value of the CHSH parameter S achieved by quantum mechanics (Tsirelson’s bound)?',
          options: [
            '2√2 ≈ 2.828',
            'Exactly 2.000',
            '4.000 (the algebraic maximum of four ±1 terms)',
            'π ≈ 3.1416',
          ],
          correctIndex: 0,
          explanation:
            'At relative angles of 22.5°, three cos(45°) terms and one −cos(135°) term each contribute √2/2, yielding 4 × (√2/2) = 2√2 ≈ 2.828.',
        },
      },
      advanced: {
        subtitle: 'Tensor-product Hilbert spaces, reduced density matrices, Werner states, and the No-Signaling theorem.',
        levelCalibrationNote:
          'Calibrated for Advanced: Uses partial traces, von Neumann entanglement entropy, Werner visibility thresholds, and CHSH operator algebra.',
        tldr: 'For a bipartite pure state |Ψ⟩ ∈ ℋ_A ⊗ ℋ_B, entanglement is quantified by the von Neumann entropy S(ρ_A) = −Tr(ρ_A log₂ ρ_A) of the reduced density matrix ρ_A = Tr_B(|Ψ⟩⟨Ψ|). Even when |Ψ⟩ is globally pure (zero entropy), a maximally entangled subsystem has ρ_A = I/2 (maximal mixedness), reconciling non-local correlations with relativistic causality.',
        mentalModelOrFormalism: {
          label: 'Operator Formalism · Partial Trace & Werner Visibility Threshold',
          content:
            'In a noisy Werner state ρ_W = V |Ψ⁻⟩⟨Ψ⁻| + (1−V) I/4, the CHSH expectation value scales linearly with visibility: S = 2√2 · V. Consequently, a state violates the CHSH inequality if and only if V > 1/√2 ≈ 70.7%, even though it remains non-separable (by the Peres-Horodecki PPT criterion) down to V > 1/3.',
          formulaOrCode:
            'ρ_A = Tr_B(|Ψ⁻⟩⟨Ψ⁻|) = ½(|0⟩⟨0| + |1⟩⟨1|) = I/2   (Independent of Bob’s Unitary/POVM)',
        },
        sections: [
          {
            heading: '1. Global Purity vs. Local Mixedness',
            body: 'The hallmark of entanglement is that complete knowledge of the composite system |Ψ_AB⟩ implies zero local directional knowledge of subsystem A. Taking the partial trace over Bob’s Hilbert space yields ρ_A = I/2 regardless of what measurement basis Bob selects, proving the No-Signaling Theorem.',
            highlightCallout:
              'A mixed state ρ_W with 1/3 < V ≤ 1/√2 is entangled (violates PPT) yet admits a local hidden-variable model for projective measurements.',
            keyTerm: 'Partial Trace & No-Signaling',
          },
          {
            heading: '2. Tsirelson’s Operator Proof via Commutators',
            body: 'Defining Hermitian dichotomic observables A_0, A_1 on ℋ_A and B_0, B_1 on ℋ_B with A_i² = B_j² = I, the squared CHSH operator satisfies ℬ² = 4I − [A_0, A_1] ⊗ [B_0, B_1]. Since ‖[X, Y]‖ ≤ 2‖X‖‖Y‖ = 2, the spectral norm satisfies ‖ℬ²‖ ≤ 4 + 4 = 8, proving ‖ℬ‖ ≤ 2√2.',
            keyTerm: 'Tsirelson Operator Bound',
          },
          {
            heading: '3. Device-Independent Quantum Cryptography (DI-QKD)',
            body: 'Because observing S > 2 guarantees that measurement outcomes cannot be predetermined by an eavesdropper Eve (monogamy of entanglement), Alice and Bob can bound Eve’s Holevo information strictly from their observed CHSH score without trusting the internal fabrication of their devices.',
            keyTerm: 'Monogamy & DI-QKD',
          },
        ],
        quiz: {
          question:
            'For a two-qubit isotropic Werner state ρ(V) = V|Ψ⁻⟩⟨Ψ⁻| + (1−V)I/4, in what visibility range is the state entangled yet unable to violate the standard CHSH inequality?',
          options: [
            '1/3 < V ≤ 1/√2 (approx. 33.3% to 70.7%)',
            '0 < V ≤ 1/3',
            '1/√2 < V ≤ 1',
            'No such range exists; all entangled states violate CHSH',
          ],
          correctIndex: 0,
          explanation:
            'By the Peres-Horodecki positive partial transpose (PPT) criterion, the Werner state is entangled for V > 1/3, but CHSH violation requires 2√2 V > 2, i.e., V > 1/√2.',
        },
      },
      pro: {
        subtitle:
          'Non-local polytopes, PR-boxes vs. Information Causality, MIP* = RE, and holographic Ryu-Takayanagi geometry.',
        levelCalibrationNote:
          'Calibrated for Pro: Explores the No-Signaling polytope vs. elliptope of quantum correlations, Tsirelson’s problem (MIP* = RE), and holographic entanglement wedges.',
        tldr: 'In correlation space, classical behaviors form the Local Polytope ℒ (bounded by Bell facets |S| ≤ 2), No-Signaling theories form a strictly larger polytope 𝒩𝒮 (whose extremal Popescu-Rohrlich boxes reach S = 4), and Quantum Theory occupies a convex body 𝒬 bounded by Tsirelson’s 2√2—carved out by principles such as Information Causality and macroscopic locality.',
        mentalModelOrFormalism: {
          label: 'Foundational Hierarchy · ℒ ⊂ 𝒬_spatial = 𝒬_commuting ⊂ 𝒩𝒮',
          content:
            'Why does nature stop at S = 2√2 instead of the algebraic No-Signaling limit S = 4 (Popescu-Rohrlich box)? If S > 2√2 were physically realizable, distributed communication complexity would collapse (making all nonlocal boolean functions trivially computable with O(1) bits) and violate Information Causality.',
          formulaOrCode:
            'ℬ² = 4𝕀 - [A_0, A_1][B_0, B_1] ≤ 8𝕀  (Tsirelson)   |   MIP* = RE ⟹ 𝒬_tensor ≠ 𝒬_commuting (Connes Embedding Refuted)',
        },
        sections: [
          {
            heading: '1. Popescu-Rohrlich (PR) Boxes & Information Causality',
            body: 'A hypothetical PR-box satisfies x · y = a ⊕ b (mod 2) while keeping marginals uniform (strictly no-signaling), achieving S = 4. Pawłowski et al. proved that sending m classical bits assisted by shared state ρ can convey at most m bits of mutual information about an unknown remote dataset—a bound that recovers Tsirelson’s 2√2 exactly.',
            highlightCallout:
              'Tsirelson’s bound 2√2 is the exact threshold above which random-access coding violates Information Causality.',
            keyTerm: 'Information Causality',
          },
          {
            heading: '2. Tsirelson’s Problem, Connes Embedding, and MIP* = RE',
            body: 'In infinite-dimensional Hilbert spaces, one can model space-like separation either via tensor products ℋ_A ⊗ ℋ_B (C_qa) or via commuting operator algebras [A_i, B_j] = 0 on a single ℋ (C_qc). The landmark MIP* = RE theorem (Ji et al., 2020) proved that deciding the optimal value of a nonlocal game with entangled provers is equivalent to the Halting Problem, separating C_qa ≠ C_qc and refuting Connes’ Embedding Conjecture.',
            keyTerm: 'MIP* = RE & Operator Algebras',
          },
          {
            heading: '3. Holographic Entanglement Entropy & ER = EPR',
            body: 'In AdS/CFT holographic duality, the Ryu-Takayanagi formula identifies the von Neumann entanglement entropy S(ρ_A) of a boundary CFT region A with the area of the minimal bulk extremal surface γ_A divided by 4G_N ℏ—suggesting spacetime connectivity itself emerges from boundary quantum entanglement.',
            keyTerm: 'Ryu-Takayanagi Surface',
          },
        ],
        quiz: {
          question:
            'What fundamental question in operator algebras was resolved negatively by the MIP* = RE breakthrough regarding quantum nonlocal correlations?',
          options: [
            'Tsirelson’s problem / Connes’ Embedding Problem: whether the closure of finite-dimensional tensor-product correlations (C_qa) equals commuting-operator correlations (C_qc)',
            'Whether two-qubit pure states obey the CHSH inequality',
            'Whether relativistic quantum field theories preserve CPT symmetry',
            'Whether Bell tests require more than two measurement settings per party',
          ],
          correctIndex: 0,
          explanation:
            'MIP* = RE showed that approximating the value of nonlocal games in the tensor-product model is uncomputable (recursively enumerable), whereas C_qc admits outer semidefinite programming hierarchies, proving C_qa ≠ C_qc.',
        },
      },
    },
  },
  {
    slug: 'monetary-policy',
    label: 'Central Banks, Rates & Inflation',
    category: 'Macroeconomics & Finance',
    entityType: 'concept',
    base: {
      topic: 'Monetary Policy, Interest Rates & Inflation',
      category: 'Macroeconomics & Finance',
      entityType: 'concept',
      readingTimeMinutes: 4,
      keyFacts: [
        {
          label: 'Inflation Target',
          value: '2.0% Annual',
          detail: 'Standard medium-term price stability target adopted by the Fed, ECB, and Bank of England.',
        },
        {
          label: 'Taylor Principle',
          value: 'Δi > Δπ',
          detail: 'Nominal policy rates must rise more than one-for-one with inflation to raise the real interest rate.',
        },
        {
          label: 'Dual Mandate',
          value: 'Prices + Jobs',
          detail: 'U.S. Federal Reserve balances maximum sustainable employment with stable prices.',
        },
        {
          label: 'Transmission Lag',
          value: '12–18 Months',
          detail: 'Policy rate changes propagate through bond yields, mortgages, credit, and wages with variable lags.',
        },
      ],
      illustration: {
        title: 'Monetary Transmission Pipeline & Taylor Feedback Loop',
        caption:
          'Click any node to inspect how central bank policy rates propagate through money markets, credit channels, aggregate demand, and inflation expectations.',
        visualTheme: 'equilibrium',
        nodes: [
          {
            id: 'policy-rate',
            label: 'Policy Rate Corridor',
            sublabel: 'IORB / Overnight Rate i_t',
            x: 16,
            y: 48,
            detail:
              'The central bank sets the floor on overnight interbank lending via Interest on Reserve Balances (IORB) and reverse repo facilities.',
            group: 'input',
          },
          {
            id: 'yield-curve',
            label: 'Yield Curve & Credit',
            sublabel: 'Forward Guidance + Term Premia',
            x: 44,
            y: 26,
            detail:
              'Expectations of future policy rates plus Quantitative Tightening/Easing shape 2-year to 30-year Treasury yields, mortgages, and corporate borrowing costs.',
            group: 'core',
          },
          {
            id: 'aggregate-demand',
            label: 'Output Gap (y_t − y*)',
            sublabel: 'Consumption & Investment',
            x: 52,
            y: 72,
            detail:
              'Higher real interest rates reward saving and increase hurdle rates for capital investment, cooling labor tightness and spending.',
            group: 'core',
          },
          {
            id: 'inflation',
            label: 'Inflation & Expectations',
            sublabel: 'π_t = β E_t[π_{t+1}] + κ y_t',
            x: 84,
            y: 48,
            detail:
              'Actual inflation reflects both current capacity pressures (the Phillips curve slope κ) and anchored long-run inflation expectations.',
            group: 'output',
          },
        ],
        connections: [
          { from: 'policy-rate', to: 'yield-curve', label: 'Expectations Channel' },
          { from: 'yield-curve', to: 'aggregate-demand', label: 'Real Rate r = i − E[π]' },
          { from: 'aggregate-demand', to: 'inflation', label: 'Phillips Curve Pressure' },
          { from: 'inflation', to: 'policy-rate', label: 'Taylor Rule Reaction' },
        ],
      },
      widget: {
        widgetType: 'simulation',
        title: 'Interactive Taylor Rule & Real Interest Rate Simulator',
        subtitle:
          'Adjust current inflation, the output gap, and the neutral real rate (r*) to compute the prescribed policy rate and macroeconomic trajectory.',
        explanation:
          'When the central bank raises the nominal policy rate faster than inflation (the Taylor Principle), the real interest rate r = i − π turns restrictive and bends inflation back toward the 2% target.',
        parameters: [
          {
            id: 'inflation',
            label: 'Current Core Inflation (π)',
            unit: '%',
            min: 0.0,
            max: 9.0,
            step: 0.25,
            defaultValue: 3.5,
            description: 'Year-over-year core price inflation relative to the 2.0% target.',
          },
          {
            id: 'outputGap',
            label: 'Output / Labor Gap (y − y*)',
            unit: '%',
            min: -4.0,
            max: 4.0,
            step: 0.25,
            defaultValue: 1.0,
            description: 'Positive when GDP runs above potential (overheating); negative in recession.',
          },
          {
            id: 'rStar',
            label: 'Neutral Real Rate (r*)',
            unit: '%',
            min: 0.0,
            max: 3.0,
            step: 0.25,
            defaultValue: 1.25,
            description: 'Equilibrium real interest rate that neither stimulates nor restricts growth.',
          },
        ],
        formulaType: 'saturation-logistic',
        xAxisLabel: 'Quarters Ahead after Policy Impulse (Q1 → Q12)',
        yAxisLabel: 'Inflation Convergence Trajectory toward 2% Target',
        outputMetricLabel: 'Prescribed Taylor Policy Rate (i)',
        outputMetricUnit: '%',
        regimeThresholds: {
          lowLabel: 'Accommodative / Stimulus Stance',
          midLabel: 'Neutral Calibration Corridor',
          highLabel: 'Restrictive Disinflation Stance',
        },
      },
      rabbitHoles: [
        'Paul Volcker & The 1980s Disinflation',
        'New Keynesian Phillips Curve',
        'Quantitative Easing vs. Floor System',
        'Yield Curve Inversion & Term Premia',
      ],
      visualMode: 'widget',
      books: [
        {
          title: '21st Century Monetary Policy',
          author: 'Ben S. Bernanke',
          year: '2022',
          whyRead:
            'Clear historical and analytical account of how inflation targeting, QE, and forward guidance evolved since the 1970s.',
          url: 'https://www.google.com/search?q=21st+Century+Monetary+Policy+Ben+Bernanke',
        },
        {
          title: 'Monetary Policy, Inflation, and the Business Cycle',
          author: 'Jordi Galí',
          year: '2015',
          whyRead:
            'Rigorous graduate-level exposition of the 3-equation New Keynesian model, Taylor rules, and optimal policy.',
          url: 'https://www.google.com/search?q=Monetary+Policy+Inflation+and+the+Business+Cycle+Jordi+Gali',
        },
        {
          title: 'Lords of Finance: The Bankers Who Broke the World',
          author: 'Liaquat Ahamed',
          year: '2009',
          whyRead:
            'Pulitzer Prize-winning narrative showing how central bank rate decisions and monetary regimes shape global history.',
          url: 'https://www.google.com/search?q=Lords+of+Finance+Liaquat+Ahamed',
        },
      ],
      sources: [
        {
          title: 'Discretion versus Policy Rules in Practice (1993)',
          publisher: 'John B. Taylor / Carnegie-Rochester Series',
          url: 'https://web.stanford.edu/~johntayl/Onlinepaperscombinedbyyear/1993/Discretion_versus_Policy_Rules_in_Practice.pdf',
          relevance: 'Introduces the Taylor Rule relating policy interest rates to inflation and output gaps.',
        },
        {
          title: 'Monetary Policy, Inflation, and the Business Cycle',
          publisher: 'Jordi Galí / Princeton University Press',
          url: 'https://press.princeton.edu/books/hardcover/9780691164786/monetary-policy-inflation-and-the-business-cycle',
          relevance: 'Standard 3-equation New Keynesian framework (Dynamic IS, NKPC, Taylor Rule).',
        },
      ],
      model: 'Curated + Gemini Interactive Engine',
      grounded: true,
    },
    byLevel: {
      novice: {
        subtitle: 'How the central bank acts as the thermostat of the economy—cooling runaway prices or warming up job growth.',
        levelCalibrationNote:
          'Calibrated for Novice: Explains interest rates using the home thermostat analogy and everyday mortgage/borrowing examples.',
        tldr: 'When too many dollars chase too few goods, prices rise rapidly (inflation). To cool things down, the central bank raises its benchmark interest rate, making mortgages, car loans, and business credit more expensive so spending slows down to a healthy pace.',
        mentalModelOrFormalism: {
          label: 'Intuitive Mental Model · The Economic Thermostat',
          content:
            'Think of the central bank as a smart thermostat set to a comfortable 2% inflation temperature. When the economy overheats (high inflation), it turns on the air conditioning by raising interest rates. When the economy gets too cold (rising unemployment), it turns on the heat by cutting rates.',
          formulaOrCode: 'Higher Interest Rates → Costlier Loans → Slower Spending → Cooler Inflation',
        },
        sections: [
          {
            heading: '1. Why a Little Inflation (2%) Is Considered Healthy',
            body: 'Central banks don’t aim for 0% inflation because falling prices (deflation) can trap an economy: if people expect laptops and houses to be cheaper next year, everyone delays buying today, causing businesses to lay off workers. A steady 2% target provides a safety cushion.',
            keyTerm: '2% Price Stability',
          },
          {
            heading: '2. How One Overnight Rate Touches Your Mortgage',
            body: 'The Federal Reserve or European Central Bank doesn’t directly set your credit card or mortgage rate. Instead, it sets the overnight interest rate that commercial banks earn on their cash reserves. Banks immediately adjust the rates they charge households and companies to match.',
            highlightCallout:
              'When the central bank raises its rate by 1%, auto loans, business lines of credit, and savings accounts move in tandem.',
            keyTerm: 'Base Interest Rate',
          },
          {
            heading: '3. The Soft Landing Challenge',
            body: 'Because rate hikes take about a year to fully ripple through construction and hiring, central bankers are like captains steering a giant cargo ship: turn the wheel too hard and you cause a recession; turn too little and inflation stays high.',
            keyTerm: 'Soft Landing',
          },
        ],
        quiz: {
          question: 'When inflation is running much higher than the 2% target, what does a central bank typically do?',
          options: [
            'Raise interest rates to make borrowing more expensive and cool down excess spending',
            'Cut interest rates to zero so everyone takes out bigger loans',
            'Print extra paper currency and mail it to banks',
            'Outlaw price tags in grocery stores',
          ],
          correctIndex: 0,
          explanation:
            'Raising interest rates increases the cost of credit and rewards saving, reducing aggregate demand pressure so price growth moderates.',
        },
      },
      intermediate: {
        subtitle: 'Nominal vs. real interest rates, the Taylor Rule, and why expectations anchor price stability.',
        levelCalibrationNote:
          'Calibrated for Intermediate: Distinguishes nominal vs. real rates (r = i − π^e), introduces the Taylor Rule, and explains the dual mandate.',
        tldr: 'Borrowers and savers care about the real interest rate (the nominal rate minus expected inflation). According to the Taylor Rule, a central bank must raise nominal interest rates by more than the rise in inflation so that the real interest rate actually increases and restrains excess demand.',
        mentalModelOrFormalism: {
          label: 'Core Formula · The Fisher Equation & Taylor Rule',
          content:
            'If inflation jumps from 2% to 5% and the central bank only raises its rate from 3% to 5%, the real interest rate actually fell from +1% to 0%—which stimulates even more borrowing! The Taylor Rule prescribes raising the nominal rate by 1.5% for every 1% excess inflation.',
          formulaOrCode: 'i_t = r* + π_t + 0.5(π_t - π*) + 0.5(y_t - y*)   [Taylor 1993 Rule]',
        },
        sections: [
          {
            heading: '1. Nominal Rates vs. Real Rates (r = i − π^e)',
            body: 'A 6% nominal interest rate sounds high when inflation is 1% (a +5% real rate), but it is cheap money when inflation is 8% (a −2% real rate). Monetary policy only tightens financial conditions when the real rate rises above the neutral rate r*.',
            keyTerm: 'Real Interest Rate',
          },
          {
            heading: '2. The Neutral Rate (r*) Benchmark',
            body: 'Economists define r* (r-star) as the theoretical real interest rate at which the economy grows at its full potential with stable inflation. When r > r*, monetary policy is restrictive; when r < r*, policy is accommodative.',
            highlightCallout:
              'Because r* cannot be observed directly, central banks must infer it from productivity trends, demographics, and global savings.',
            keyTerm: 'Neutral Rate r*',
          },
          {
            heading: '3. Anchoring Inflation Expectations',
            body: 'If workers and businesses trust that the central bank will bring inflation back to 2%, temporary supply shocks (like an oil spike) quickly fade. If expectations become “unanchored,” businesses raise prices preemptively and workers demand higher wages in a self-fulfilling spiral.',
            keyTerm: 'Expectations Anchor',
          },
        ],
        quiz: {
          question:
            'According to the Taylor Principle, if inflation rises by 2 percentage points above target, how must the central bank adjust the nominal policy rate?',
          options: [
            'Raise the nominal rate by MORE than 2 percentage points so that the real interest rate increases',
            'Raise the nominal rate by less than 1 percentage point',
            'Cut the nominal rate by 2 percentage points',
            'Keep the nominal rate frozen so real interest rates fall',
          ],
          correctIndex: 0,
          explanation:
            'By the Fisher identity r = i − π, nominal rates must rise more than 1-for-1 with inflation (Δi/Δπ > 1) to make real financial conditions more restrictive.',
        },
      },
      advanced: {
        subtitle: 'The 3-Equation New Keynesian model, Blanchard-Kahn determinacy, and ample-reserves floor systems.',
        levelCalibrationNote:
          'Calibrated for Advanced: Presents the log-linearized New Keynesian system (Dynamic IS + NKPC + Taylor Rule) and floor-system plumbing (IORB/ON RRP).',
        tldr: 'Modern monetary policy analysis rests on the canonical 3-equation New Keynesian DSGE framework combining an intertemporal Euler equation (Dynamic IS curve), Calvo sticky-price optimization (New Keynesian Phillips Curve), and an interest-rate feedback rule subject to the Blanchard-Kahn determinacy condition.',
        mentalModelOrFormalism: {
          label: 'Canonical 3-Equation New Keynesian System',
          content:
            'In log-deviation terms around the zero-inflation steady state, forward-looking households smooth consumption via elasticity σ⁻¹, firms face Calvo price-reset hazard (1−θ) yielding slope κ, and the central bank sets i_t. Equilibrium uniqueness requires φ_π + ((1−β)/κ) φ_y > 1.',
          formulaOrCode:
            'IS: y_t = E_t[y_{t+1}] - σ⁻¹(i_t - E_t[π_{t+1}] - r_t^n)   |   NKPC: π_t = β E_t[π_{t+1}] + κ y_t + u_t',
        },
        sections: [
          {
            heading: '1. Forward Guidance & Iterating the Dynamic IS Curve',
            body: 'Solving the Dynamic IS equation forward shows that current output gap y_t depends not primarily on today’s overnight rate i_t, but on the entire expected path of future real short rates: y_t = −σ⁻¹ E_t ∑_{k=0}^∞ (i_{t+k} − π_{t+1+k} − r_{t+k}^n). Consequently, credible communication about the terminal rate moves financial conditions long before hike execution.',
            highlightCallout:
              'Long-term bond yields reflect the expected path of short rates plus a time-varying term premium.',
            keyTerm: 'Iterated Euler Path',
          },
          {
            heading: '2. Ample Reserves & Administered Rate Floors (IORB / ON RRP)',
            body: 'Before 2008, the Fed adjusted scarce reserve supply via daily open-market operations to move the Fed Funds rate along a steep demand curve. Today’s large balance sheet operates on the flat portion of the reserve demand curve (“ample reserves”), pinning short rates via Interest on Reserve Balances (IORB) and the Overnight Reverse Repo (ON RRP) sub-floor.',
            keyTerm: 'Ample-Reserves Floor',
          },
          {
            heading: '3. Supply Shocks (Cost-Push u_t) vs. Divine Coincidence',
            body: 'Under pure demand shocks (r_t^n), stabilizing the output gap (y_t = 0) simultaneously stabilizes inflation (π_t = 0)—Blanchard and Galí’s “Divine Coincidence.” Cost-push shocks (u_t ≠ 0) break this coincidence, forcing an optimal policy frontier governed by the loss function L = π_t² + λ y_t².',
            keyTerm: 'Divine Coincidence Breakdown',
          },
        ],
        quiz: {
          question:
            'In the canonical 3-equation New Keynesian model, what happens if the central bank violates the Taylor Principle (φ_π < 1) in its reaction function?',
          options: [
            'The rational-expectations equilibrium becomes indeterminate, allowing self-fulfilling sunspot inflation fluctuations',
            'Inflation immediately drops to absolute zero in one period',
            'The Phillips curve slope κ becomes negative',
            'Commercial banks can no longer hold central bank reserves',
          ],
          correctIndex: 0,
          explanation:
            'When φ_π < 1, the system has fewer explosive eigenvalues than jump variables (violating the Blanchard-Kahn condition), opening the door to sunspot-driven multiple equilibria.',
        },
      },
      pro: {
        subtitle:
          'HANK heterogeneous-agent transmission, Fiscal Theory of the Price Level (FTPL), and nonlinear Phillips convexity.',
        levelCalibrationNote:
          'Calibrated for Pro: Examines HANK vs. RANK decomposition, Leeper active/passive fiscal regimes, and state-dependent Menu-Cost convexity.',
        tldr: 'Representative-Agent New Keynesian (RANK) models attribute >80% of monetary transmission to direct intertemporal substitution by an unconstrained Euler household. Heterogeneous-Agent New Keynesian (HANK) models with uninsurable idiosyncratic income risk and illiquid housing assets show transmission is instead dominated by general-equilibrium labor income and cash-flow channels across high-MPC hand-to-mouth households.',
        mentalModelOrFormalism: {
          label: 'Frontier Decomposition · RANK vs. HANK & Leeper Regimes',
          content:
            'Decomposing the aggregate consumption response dC_0 to a real rate path {dr_t} yields a Direct Substitution effect (small empirically) plus an Indirect General Equilibrium effect weighted by the cross-sectional covariance of marginal propensities to consume (MPC_i) and net nominal asset exposures.',
          formulaOrCode:
            'dC_0 = ∫ (∂c_0/∂r_0) dμ(a,z) [Direct] + ∫ MPC_i · dY_i(r) dμ(a,z) [Indirect GE] + Fisher Redistribution',
        },
        sections: [
          {
            heading: '1. HANK Cross-Sectional Redistribution & Cash-Flow Channels',
            body: 'In Auclert’s sufficient-statistic decomposition, an unexpected rate hike redistributes purchasing power via three channels: Earnings Heterogeneity (low-income high-MPC workers face higher cyclical unemployment sensitivity), Fisher Deflation (debtors lose to creditors), and Unhedged Interest Rate Exposure (URE, governed by adjustable-rate vs. fixed-rate mortgage maturity structures).',
            highlightCallout:
              'Economies dominated by 30-year fixed-rate mortgages exhibit muted URE cash-flow squeeze on existing homeowners alongside severe housing-turnover lock-in.',
            keyTerm: 'Unhedged Rate Exposure',
          },
          {
            heading: '2. Leeper Regimes & Fiscal Dominance (FTPL)',
            body: 'In Leeper (1991), unique price determination requires pairing Active Monetary policy (φ_π > 1) with Passive Fiscal policy (primary surpluses s_t respond to stabilize real debt b_t). Under Active Fiscal policy (unbacked fiscal expansion), higher nominal interest rates increase sovereign interest expense, expanding nominal wealth and potentially raising inflation via the intertemporal government budget constraint B_t / P_t = E_t ∑ β^k s_{t+k}.',
            keyTerm: 'Active vs. Passive Fiscal Regime',
          },
          {
            heading: '3. State-Dependent Pricing (Ss Menu Costs) & Phillips Convexity',
            body: 'Unlike Calvo’s exogenous time-dependent hazard θ, Golosov-Lucas menu-cost models feature an endogenous (s, S) inaction band. Under large aggregate shocks, the distribution of firm price gaps shifts toward the adjustment boundary, causing the extensive margin (fraction of firms repricing) to surge and steepening the Phillips curve slope κ nonlinearly.',
            keyTerm: 'Ss Menu-Cost Convexity',
          },
        ],
        quiz: {
          question:
            'In Leeper’s classification of monetary-fiscal interactions, what occurs in an “Active Monetary + Active Fiscal” regime when primary surpluses fail to back sovereign debt?',
          options: [
            'No bounded stationary rational-expectations equilibrium exists; debt-to-GDP explodes or forces a regime switch / fiscal inflation',
            'Inflation converges faster to 2% with zero output loss',
            'The neutral real rate r* permanently drops to −5%',
            'The intertemporal Euler equation becomes independent of interest rates',
          ],
          correctIndex: 0,
          explanation:
            'When both monetary policy (φ_π > 1) and fiscal policy (unresponsive surpluses) are active, both eigenvalues lie outside the unit circle, causing explosive debt dynamics unless one authority yields.',
        },
      },
    },
  },
];

export function buildPresetMicrosite(
  slug: string,
  level: ExpertiseLevel
): MicrositeData | null {
  const preset = PRESET_TOPICS.find((p) => p.slug === slug);
  if (!preset) return null;
  const variant = preset.byLevel[level];
  return {
    ...preset.base,
    level,
    ...variant,
  };
}
