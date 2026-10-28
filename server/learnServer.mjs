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

// In-memory LRU-style cache on the server so repeated queries or level switches are instant
const RESPONSE_CACHE = new Map();
const MAX_CACHE_ENTRIES = 200;

const LEVEL_INSTRUCTIONS = {
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
Given ANY user query (a scientific concept, mathematical theorem, technology, historical event, philosophical idea, or known person/biography) and an expertise level (novice, intermediate, advanced, or pro), generate a concise, factually accurate learning microsite in JSON.

Keep all strings crisp, dense, and high-signal so generation is fast:
1. "visualMode":
   - Default to "diagram" for most topics (biographies, historical events, biological processes, system architectures, philosophies, and qualitative concepts) where a clean static schematic diagram is best.
   - Set "visualMode" to "widget" ONLY when the topic is governed by a quantitative mathematical law, physical wave/curve, or financial/economic formula where scrubbing numerical parameters genuinely adds value.
2. "illustration":
   - Create 4 nodes positioned across the schematic canvas (x in [18, 82], y in [22, 78], well-spaced) with ids "n1", "n2", "n3", "n4".
   - Connect them logically in "connections" using those exact node ids ("from", "to", "label").
   - Pick visualTheme from: "orbital", "network", "wave", "portrait-constellation", "architecture", "equilibrium".
3. "widget":
   - If visualMode="widget", set widgetType="simulation", populate "parameters" with 3 interactive sliders (id, label, unit, min, max, step, defaultValue, description), set formulaType ("resonance-peak", "harmonic-wave", "saturation-logistic", "exponential-growth", or "inverse-power"), and leave "events" as [].
   - If visualMode="diagram", you may leave "parameters" and "events" as empty arrays [].
4. "books":
   - Provide 3 real, authoritative books in "books" (title, author, year, whyRead) that are the best books to read to learn more about this topic at or near the requested expertise level.
5. Calibrate ALL text (subtitle, levelCalibrationNote, tldr, mentalModelOrFormalism, sections, and books) strictly to the requested expertise level (novice, intermediate, advanced, or pro).`;

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
        model: PRIMARY_MODEL,
        fallbackModel: FALLBACK_MODEL,
        cachedEntries: RESPONSE_CACHE.size,
        hasKey: Boolean(GEMINI_API_KEY),
      })
    );
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
        const level = ['novice', 'intermediate', 'advanced', 'pro'].includes(
          rawLevel
        )
          ? rawLevel
          : 'intermediate';

        if (!query || query.length < 2) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({ error: 'Please enter a valid topic or query.' })
          );
          return;
        }

        const cacheKey = `${query.toLowerCase()}::${level}`;
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

${levelGuide}

Generate the microsite JSON for "${query}" calibrated for ${level.toUpperCase()} level:
- 3 concise article sections (2-3 sentences per section)
- 4 keyFacts cards
- 4 schematic nodes in "illustration.nodes" (ids "n1".."n4", x in 18..82, y in 22..78) and 3-4 "illustration.connections"
- Set "visualMode" to "diagram" unless "${query}" is a quantitative mathematical, physical, or financial formula where interactive parameter sliders add genuine value (in which case set "visualMode" to "widget" and populate 3 realistic "widget.parameters").
- 3 authoritative book recommendations in "books" (title, author, year, whyRead).`;

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
        resultObj.model = interaction.model || usedModel;
        resultObj.grounded = true;

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
