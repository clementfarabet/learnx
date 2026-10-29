#!/usr/bin/env node
import http from 'node:http';
import https from 'node:https';
import net from 'node:net';

// Enable Happy Eyeballs fast multi-IP fallback so a single slow IP never causes UND_ERR_CONNECT_TIMEOUT
if (typeof net.setDefaultAutoSelectFamily === 'function') {
  net.setDefaultAutoSelectFamily(true);
}
if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout === 'function') {
  net.setDefaultAutoSelectFamilyAttemptTimeout(400);
}

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 32,
  timeout: 30000,
  autoSelectFamily: true,
  autoSelectFamilyAttemptTimeout: 400,
});

const PORT = Number(process.env.LEARNX_PORT || 8792);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = process.env.LEARNX_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-3.5-flash-lite';
const PRIMARY_IMAGE_MODEL = 'gemini-3.1-flash-lite-image';
const FALLBACK_IMAGE_MODEL = 'gemini-nano-banana-2.1';

// In-memory LRU-style cache on the server so repeated queries or level switches are instant
const RESPONSE_CACHE = new Map();
const MAX_CACHE_ENTRIES = 200;

const IMAGE_CACHE = new Map();
const MAX_IMAGE_CACHE_ENTRIES = 80;

const LEVEL_INSTRUCTIONS = {
  child: `TARGET LEVEL: CHILD (L0 - Playful Picture Book for Ages 7-10).
- Write for a curious 7-to-10-year-old child!
- Use warm, joyful, magical picture-book storytelling, everyday toys, animals, Lego blocks, flashlights, or playground metaphors.
- Never use scary jargon or heavy formulas; in mentalModelOrFormalism.formulaOrCode, write a fun 3-step chain separated by " → " with emojis (e.g. "1. Ask a Question 🔦 → 2. Find the Best Clue ✨ → 3. Tell the Story 📖").
- Make the 4 illustration.nodes labels and details super kid-friendly (e.g. "Step 1: ...", "How It Works", etc.).
- Include a fun, playful 4-option riddle in "quiz" (question, 4 options, correctIndex 0..3, and a cheerful explanation).`,
  novice: `TARGET LEVEL: NOVICE (L1 - Intuitive & Visual).
- Assume zero prior background in the field.
- Use vivid everyday analogies, storytelling, and real-world intuition.
- Avoid unexplained jargon or dense equations; in mentalModelOrFormalism, present an intuitive metaphor and a simple conceptual flow.`,
  intermediate: `TARGET LEVEL: INTERMEDIATE (L2 - Foundational & Curious).
- Connect intuitive concepts to the actual domain vocabulary, core mechanisms, and causal building blocks.
- Explain HOW and WHY the parts interact in clear, accessible technical prose.`,
  advanced: `TARGET LEVEL: ADVANCED (L3 - Practitioner & Technical).
- Address an informed practitioner, engineer, or upper-division student.
- Include quantitative relationships, governing equations or architectural specifications in mentalModelOrFormalism, and real-world bottlenecks or trade-offs.`,
  pro: `TARGET LEVEL: PRO / EXPERT (L4 - Frontier & Rigorous).
- Address a domain specialist or researcher.
- Use rigorous formal definitions, mathematical/theoretical bounds, subtle edge cases, failure modes, and state-of-the-art research frontiers.`,
};

const SYSTEM_INSTRUCTION = `You are LearnX, a fast, rigorous editorial & educational microsite synthesizer.
Given ANY user query (a scientific concept, mathematical theorem, technology, historical event, philosophical idea, or known person/biography) and an expertise level (child, novice, intermediate, advanced, or pro), generate a concise, factually accurate learning microsite in JSON.

Keep all strings crisp, dense, and high-signal so generation is fast:
1. "visualMode":
   - Default to "diagram" for most topics (biographies, historical events, biological processes, system architectures, philosophies, and qualitative concepts, or whenever level="child") where a clean chronology or step-by-step sequence is best.
   - Set "visualMode" to "widget" ONLY when the topic is governed by a quantitative mathematical law, physical wave/curve, or financial/economic formula where scrubbing numerical parameters genuinely adds value.
2. "illustration" (Chronology & Milestone Timeline):
   - Structure "illustration.nodes" as a 4-to-5-step CHRONOLOGY of key historical milestones, discoveries, or sequential stages in chronological order.
   - For each item in "illustration.nodes":
     * "sublabel": The Year, Date Range, or Stage Marker (e.g. "1843", "1905 · Annus Mirabilis", "2017", or "Stage 1 · Trigger").
     * "label": The concise milestone or stage title.
     * "detail": 1-2 crisp sentences explaining what happened at this milestone or why it was a turning point.
     * "id": "m1", "m2", "m3", "m4" (and "x": 20..80, "y": 20..80, "group": "core").
   - You may leave "illustration.connections" as an empty array [].
3. "widget":
   - If visualMode="widget", set widgetType="simulation", populate "parameters" with 3 interactive sliders (id, label, unit, min, max, step, defaultValue, description), set formulaType ("resonance-peak", "harmonic-wave", "saturation-logistic", "exponential-growth", or "inverse-power"), and leave "events" as [].
   - If visualMode="diagram", you may leave "parameters" and "events" as empty arrays [].
4. "books":
   - Provide 3 real, authoritative books in "books" (title, author, year, whyRead) that are the best books to read to learn more about this topic at or near the requested expertise level.
5. "quiz":
   - Provide a 1-question multiple-choice comprehension check or riddle in "quiz" (question, 4 options, correctIndex 0..3, explanation).
6. Calibrate ALL text (subtitle, levelCalibrationNote, tldr, mentalModelOrFormalism, sections, books, and quiz) strictly to the requested expertise level (child, novice, intermediate, advanced, or pro).`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    topic: { type: 'STRING' },
    subtitle: { type: 'STRING' },
    category: { type: 'STRING' },
    entityType: { type: 'STRING' },
    visualMode: { type: 'STRING' },
    levelCalibrationNote: { type: 'STRING' },
    readingTimeMinutes: { type: 'NUMBER' },
    tldr: { type: 'STRING' },
    mentalModelOrFormalism: {
      type: 'OBJECT',
      properties: {
        label: { type: 'STRING' },
        content: { type: 'STRING' },
        formulaOrCode: { type: 'STRING' },
      },
      required: ['label', 'content', 'formulaOrCode'],
    },
    sections: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          heading: { type: 'STRING' },
          body: { type: 'STRING' },
          highlightCallout: { type: 'STRING' },
          keyTerm: { type: 'STRING' },
        },
        required: ['heading', 'body', 'highlightCallout', 'keyTerm'],
      },
    },
    keyFacts: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          label: { type: 'STRING' },
          value: { type: 'STRING' },
          detail: { type: 'STRING' },
        },
        required: ['label', 'value', 'detail'],
      },
    },
    illustration: {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        caption: { type: 'STRING' },
        visualTheme: { type: 'STRING' },
        nodes: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
              label: { type: 'STRING' },
              sublabel: { type: 'STRING' },
              x: { type: 'NUMBER' },
              y: { type: 'NUMBER' },
              detail: { type: 'STRING' },
              group: { type: 'STRING' },
            },
            required: ['id', 'label', 'sublabel', 'x', 'y', 'detail', 'group'],
          },
        },
        connections: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              from: { type: 'STRING' },
              to: { type: 'STRING' },
              label: { type: 'STRING' },
            },
            required: ['from', 'to', 'label'],
          },
        },
      },
      required: ['title', 'caption', 'visualTheme', 'nodes', 'connections'],
    },
    widget: {
      type: 'OBJECT',
      properties: {
        widgetType: { type: 'STRING' },
        title: { type: 'STRING' },
        subtitle: { type: 'STRING' },
        explanation: { type: 'STRING' },
        formulaType: { type: 'STRING' },
        xAxisLabel: { type: 'STRING' },
        yAxisLabel: { type: 'STRING' },
        outputMetricLabel: { type: 'STRING' },
        outputMetricUnit: { type: 'STRING' },
        regimeThresholds: {
          type: 'OBJECT',
          properties: {
            lowLabel: { type: 'STRING' },
            midLabel: { type: 'STRING' },
            highLabel: { type: 'STRING' },
          },
          required: ['lowLabel', 'midLabel', 'highLabel'],
        },
        parameters: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              id: { type: 'STRING' },
              label: { type: 'STRING' },
              unit: { type: 'STRING' },
              min: { type: 'NUMBER' },
              max: { type: 'NUMBER' },
              step: { type: 'NUMBER' },
              defaultValue: { type: 'NUMBER' },
              description: { type: 'STRING' },
            },
            required: [
              'id',
              'label',
              'unit',
              'min',
              'max',
              'step',
              'defaultValue',
              'description',
            ],
          },
        },
        events: {
          type: 'ARRAY',
          items: {
            type: 'OBJECT',
            properties: {
              year: { type: 'STRING' },
              title: { type: 'STRING' },
              summary: { type: 'STRING' },
              impactScore: { type: 'NUMBER' },
              deeperInsight: { type: 'STRING' },
              domainTag: { type: 'STRING' },
            },
            required: [
              'year',
              'title',
              'summary',
              'impactScore',
              'deeperInsight',
              'domainTag',
            ],
          },
        },
      },
      required: [
        'widgetType',
        'title',
        'subtitle',
        'explanation',
        'formulaType',
        'xAxisLabel',
        'yAxisLabel',
        'outputMetricLabel',
        'outputMetricUnit',
        'regimeThresholds',
        'parameters',
        'events',
      ],
    },
    books: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          author: { type: 'STRING' },
          year: { type: 'STRING' },
          whyRead: { type: 'STRING' },
        },
        required: ['title', 'author', 'year', 'whyRead'],
      },
    },
    rabbitHoles: {
      type: 'ARRAY',
      items: { type: 'STRING' },
    },
    sources: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          publisher: { type: 'STRING' },
          relevance: { type: 'STRING' },
        },
        required: ['title', 'publisher', 'relevance'],
      },
    },
    quiz: {
      type: 'OBJECT',
      properties: {
        question: { type: 'STRING' },
        options: {
          type: 'ARRAY',
          items: { type: 'STRING' },
        },
        correctIndex: { type: 'NUMBER' },
        explanation: { type: 'STRING' },
      },
      required: ['question', 'options', 'correctIndex', 'explanation'],
    },
  },
  required: [
    'topic',
    'subtitle',
    'category',
    'entityType',
    'visualMode',
    'levelCalibrationNote',
    'readingTimeMinutes',
    'tldr',
    'mentalModelOrFormalism',
    'sections',
    'keyFacts',
    'illustration',
    'widget',
    'books',
    'rabbitHoles',
    'sources',
    'quiz',
  ],
};

function postJsonHttps(urlString, headers, payloadObj, timeoutMs = 28000) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlString);
    const bodyStr = JSON.stringify(payloadObj);

    const req = https.request(
      {
        hostname: url.hostname,
        port: 443,
        path: url.pathname + url.search,
        method: 'POST',
        agent: httpsAgent,
        headers: {
          ...headers,
          'Content-Length': Buffer.byteLength(bodyStr),
        },
        timeout: timeoutMs,
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            try {
              resolve(JSON.parse(text));
            } catch (parseErr) {
              reject(new Error(`Invalid JSON from upstream: ${parseErr.message}`));
            }
          } else {
            reject(
              new Error(`HTTP ${res.statusCode}: ${text.slice(0, 240)}`)
            );
          }
        });
      }
    );

    req.on('timeout', () => {
      req.destroy(new Error(`Request timed out after ${timeoutMs}ms`));
    });
    req.on('error', (err) => reject(err));
    req.write(bodyStr);
    req.end();
  });
}

async function callGeminiInteraction(modelName, userInput, timeoutMs = 25000) {
  const payload = {
    model: modelName,
    store: false,
    generation_config: {
      thinking_level: 'low',
    },
    system_instruction: SYSTEM_INSTRUCTION,
    input: userInput,
    response_format: RESPONSE_SCHEMA,
  };

  // Retry once automatically on any transient socket/connect error
  try {
    return await postJsonHttps(
      'https://generativelanguage.googleapis.com/v1/interactions',
      {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      payload,
      timeoutMs
    );
  } catch (err) {
    console.warn(`Attempt 1 with ${modelName} failed (${err.message}), retrying...`);
    return await postJsonHttps(
      'https://generativelanguage.googleapis.com/v1/interactions',
      {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY,
      },
      payload,
      timeoutMs
    );
  }
}

async function callImageInteraction(modelName, promptText, timeoutMs = 18000) {
  const payload = {
    model: modelName,
    store: false,
    input: promptText,
  };
  const interaction = await postJsonHttps(
    'https://generativelanguage.googleapis.com/v1/interactions',
    {
      'Content-Type': 'application/json',
      'x-goog-api-key': GEMINI_API_KEY,
    },
    payload,
    timeoutMs
  );
  const steps = Array.isArray(interaction.steps) ? interaction.steps : [];
  for (let i = steps.length - 1; i >= 0; i--) {
    if (steps[i].type === 'model_output' && Array.isArray(steps[i].content)) {
      const imgPart = steps[i].content.find(
        (c) => c.type === 'image' && c.data
      );
      if (imgPart) {
        const mime = imgPart.mime_type || 'image/jpeg';
        return `data:${mime};base64,${imgPart.data}`;
      }
    }
  }
  throw new Error('No image data returned in interaction steps');
}

async function generateChildIllustration(
  topicQuery,
  subtitle = '',
  forceRefresh = false
) {
  const cleanTopic = String(topicQuery || '').trim();
  if (!cleanTopic || !GEMINI_API_KEY) return null;

  const cacheKey = cleanTopic.toLowerCase();
  if (!forceRefresh && IMAGE_CACHE.has(cacheKey)) {
    return IMAGE_CACHE.get(cacheKey);
  }

  const promptText = `Warm, whimsical children's picture-book editorial illustration on soft cream paper (#FAF7F2) with hand-drawn dark ink outlines and gentle watercolor washes in warm amber, sky blue, and soft violet. Subject: a cheerful, friendly, imaginative visual scene explaining "${cleanTopic}"${
    subtitle ? ` (${subtitle})` : ''
  } for a curious 8-year-old child. Centered composition, charming characters or objects in action, zero text, zero words, zero letters, no labels or numbers inside the drawing.`;

  let dataUri = null;
  try {
    dataUri = await callImageInteraction(
      PRIMARY_IMAGE_MODEL,
      promptText,
      16000
    );
  } catch (err) {
    console.warn(
      `Primary image model (${PRIMARY_IMAGE_MODEL}) failed (${err.message}), trying ${FALLBACK_IMAGE_MODEL}...`
    );
    try {
      dataUri = await callImageInteraction(
        FALLBACK_IMAGE_MODEL,
        promptText,
        20000
      );
    } catch (fallbackErr) {
      console.warn(
        `Fallback image model (${FALLBACK_IMAGE_MODEL}) failed (${fallbackErr.message})`
      );
      return null;
    }
  }

  if (dataUri) {
    if (IMAGE_CACHE.size >= MAX_IMAGE_CACHE_ENTRIES) {
      const oldestKey = IMAGE_CACHE.keys().next().value;
      if (oldestKey) IMAGE_CACHE.delete(oldestKey);
    }
    IMAGE_CACHE.set(cacheKey, dataUri);
  }
  return dataUri;
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url?.startsWith('/learnx/api/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        ok: true,
        service: 'learnx-api',
        model: 'AI',
        cachedEntries: RESPONSE_CACHE.size,
        cachedImages: IMAGE_CACHE.size,
        hasKey: Boolean(GEMINI_API_KEY),
      })
    );
    return;
  }

  if (
    req.method === 'POST' &&
    req.url?.startsWith('/learnx/api/child-illustration')
  ) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 32000) req.destroy();
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const topic = String(parsed.topic || '').trim();
        const subtitle = String(parsed.subtitle || '').trim();
        const forceRefresh = Boolean(parsed.forceRefresh);

        if (!topic || topic.length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Please provide a valid topic.' }));
          return;
        }

        const imageUrl = await generateChildIllustration(
          topic,
          subtitle,
          forceRefresh
        );
        if (!imageUrl) {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ error: 'Failed to generate illustration.' })
          );
          return;
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, imageUrl }));
      } catch (err) {
        console.error('Child illustration error:', err.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Failed to generate illustration.',
            message: err.message,
          })
        );
      }
    });
    return;
  }

  if (req.method === 'POST' && req.url?.startsWith('/learnx/api/learn')) {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 32000) req.destroy();
    });

    req.on('end', async () => {
      try {
        const parsed = JSON.parse(body || '{}');
        const query = String(parsed.query || '').trim();
        const rawLevel = String(parsed.level || 'intermediate')
          .trim()
          .toLowerCase();
        const level = [
          'child',
          'novice',
          'intermediate',
          'advanced',
          'pro',
        ].includes(rawLevel)
          ? rawLevel
          : 'intermediate';
        const rawLocale = String(parsed.locale || 'en')
          .trim()
          .toLowerCase();
        const locale = ['en', 'fr', 'de', 'zh', 'ja'].includes(rawLocale)
          ? rawLocale
          : 'en';
        const LOCALE_NAMES = {
          en: 'English',
          fr: 'French (Français)',
          de: 'German (Deutsch)',
          zh: 'Simplified Chinese (简体中文)',
          ja: 'Japanese (日本語)',
        };
        const targetLangName = LOCALE_NAMES[locale] || 'English';

        if (!query || query.length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ error: 'Please enter a valid topic or query.' })
          );
          return;
        }

        const cacheKey = `${query.toLowerCase()}::${level}::${locale}`;
        if (RESPONSE_CACHE.has(cacheKey)) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(RESPONSE_CACHE.get(cacheKey)));
          return;
        }

        if (!GEMINI_API_KEY) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ error: 'Server missing GEMINI_API_KEY.' })
          );
          return;
        }

        const levelGuide =
          LEVEL_INSTRUCTIONS[level] || LEVEL_INSTRUCTIONS.intermediate;

        const userInput = `Topic / Query: "${query}"
Selected Expertise Level: ${level.toUpperCase()}
Target Output Language: ${targetLangName} (locale="${locale}")

${levelGuide}

IMPORTANT LANGUAGE REQUIREMENT:
Write ALL user-facing text fields (topic, subtitle, category, levelCalibrationNote, tldr, mentalModelOrFormalism.label, mentalModelOrFormalism.content, sections, keyFacts, illustration.title, illustration.caption, illustration.nodes[].label, illustration.nodes[].detail, widget.title, widget.subtitle, widget.explanation, widget.parameters[].label, widget.parameters[].description, books[].whyRead, rabbitHoles, sources[].relevance, quiz.question, quiz.options, quiz.explanation) natively in ${targetLangName}. Keep illustration.nodes[].group strictly in ["input", "core", "output", "context"] and entityType in ["concept", "person", "system", "phenomenon", "event"].

Generate the microsite JSON for "${query}" calibrated for ${level.toUpperCase()} level in ${targetLangName}:
- 3 concise article sections (2-3 sentences per section)
- 4 keyFacts cards
- 4-5 chronological milestones in "illustration.nodes" (ordered chronologically, with "sublabel" = Year/Era or Step marker, "label" = Milestone Title, and "detail" = 1-2 sentence significance)
- Set "visualMode" to "diagram" unless "${query}" is a quantitative mathematical, physical, or financial formula where interactive parameter sliders add genuine value (in which case set "visualMode" to "widget" and populate 3 realistic "widget.parameters").
- 3 authoritative book recommendations in "books" (title, author, year, whyRead).
- 1 engaging 4-option multiple-choice riddle/question in "quiz" (question, 4 options, correctIndex 0..3, explanation).`;

        const childImagePromise =
          level === 'child'
            ? generateChildIllustration(query, '', false).catch(() => null)
            : Promise.resolve(null);

        let interaction;
        let usedModel = PRIMARY_MODEL;
        try {
          interaction = await callGeminiInteraction(
            PRIMARY_MODEL,
            userInput,
            24000
          );
        } catch (primaryErr) {
          console.warn(
            `Primary model (${PRIMARY_MODEL}) failed (${primaryErr.message}), falling back to ${FALLBACK_MODEL}...`
          );
          usedModel = FALLBACK_MODEL;
          interaction = await callGeminiInteraction(
            FALLBACK_MODEL,
            userInput,
            22000
          );
        }

        const steps = Array.isArray(interaction.steps) ? interaction.steps : [];
        let outputText = '';
        for (let i = steps.length - 1; i >= 0; i--) {
          if (
            steps[i].type === 'model_output' &&
            Array.isArray(steps[i].content)
          ) {
            outputText = steps[i].content
              .filter((c) => c.type === 'text' && c.text)
              .map((c) => c.text)
              .join('');
            if (outputText) break;
          }
        }

        const resultObj = JSON.parse(outputText);
        resultObj.level = level;
        resultObj.model = 'AI';
        resultObj.grounded = true;

        if (level === 'child') {
          const heroImageUrl = await childImagePromise;
          if (heroImageUrl) {
            resultObj.heroImageUrl = heroImageUrl;
          }
        }

        // Normalize entityType
        const validEntities = [
          'concept',
          'person',
          'system',
          'phenomenon',
          'event',
        ];
        if (!validEntities.includes(resultObj.entityType)) {
          resultObj.entityType = 'concept';
        }

        // Normalize visualMode: only use 'widget' when explicitly requested AND valid parameters exist
        const hasValidParams =
          resultObj.widget &&
          Array.isArray(resultObj.widget.parameters) &&
          resultObj.widget.parameters.length >= 2;
        if (
          resultObj.visualMode === 'widget' &&
          resultObj.entityType !== 'person' &&
          hasValidParams
        ) {
          resultObj.visualMode = 'widget';
          resultObj.widget.widgetType = 'simulation';
        } else {
          resultObj.visualMode = 'diagram';
        }

        // Build clean search URLs for recommended books
        if (Array.isArray(resultObj.books)) {
          resultObj.books = resultObj.books.map((b) => {
            const title = String(b.title || query).trim();
            const author = String(b.author || '').trim();
            return {
              title,
              author,
              year: String(b.year || '').trim(),
              whyRead: String(b.whyRead || '').trim(),
              url: `https://www.google.com/search?q=${encodeURIComponent(
                `${title} ${author} book`
              )}`,
            };
          });
        } else {
          resultObj.books = [];
        }

        // Build clean search URLs for grounded sources
        if (Array.isArray(resultObj.sources)) {
          resultObj.sources = resultObj.sources.map((s) => {
            const title = String(s.title || query).trim();
            const publisher = String(s.publisher || 'Reference').trim();
            return {
              title,
              publisher,
              url: `https://www.google.com/search?q=${encodeURIComponent(
                `${title} ${publisher}`
              )}`,
              relevance: String(s.relevance || ''),
            };
          });
        } else {
          resultObj.sources = [];
        }

        if (RESPONSE_CACHE.size >= MAX_CACHE_ENTRIES) {
          const oldestKey = RESPONSE_CACHE.keys().next().value;
          if (oldestKey) RESPONSE_CACHE.delete(oldestKey);
        }
        RESPONSE_CACHE.set(cacheKey, resultObj);

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(resultObj));
      } catch (err) {
        console.error('Error generating LearnX microsite:', err);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(
          JSON.stringify({
            error: 'Failed to synthesize microsite',
            message: err instanceof Error ? err.message : String(err),
          })
        );
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(
    `LearnX Interactive Microsite Server (${PRIMARY_MODEL}) listening on http://127.0.0.1:${PORT}`
  );
});
