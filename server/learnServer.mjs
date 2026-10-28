#!/usr/bin/env node
import http from 'node:http';
import dns from 'node:dns';

dns.setDefaultResultOrder('ipv4first');

const PORT = Number(process.env.PORT || 8792);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODEL = 'gemini-4-argon';

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

const SYSTEM_INSTRUCTION = `You are LearnX, an interactive educational microsite synthesizer.
Given ANY user query (a scientific concept, mathematical theorem, technology, historical event, philosophical idea, or known person/biography) and an expertise level (novice, intermediate, advanced, or pro), generate a complete, factually grounded interactive learning microsite in JSON.

Use Google Search when helpful to ground biographical dates, empirical metrics, and primary references.

Rules for visual & interactive components:
1. "illustration":
   - Create 4 or 5 inspectable nodes positioned nicely across the canvas (x in [15, 85], y in [20, 80], well-spaced so they do not overlap) with ids "n1", "n2", "n3", "n4" (and optionally "n5").
   - Connect them logically in "connections" using those exact node ids ("from", "to", "label").
   - Pick visualTheme from: "orbital", "network", "wave", "portrait-constellation", "architecture", "equilibrium".
2. "widget":
   - If the query is primarily about a KNOWN PERSON, BIOGRAPHY, or HISTORICAL EVENT/ERA, set widgetType="timeline" and populate "events" with 5 chronological milestones (year, title, summary, impactScore 40..100, deeperInsight, domainTag).
   - Otherwise, prefer widgetType="simulation" and populate "parameters" with 3 interactive sliders (id, label, unit, min, max, step, defaultValue, description), plus formulaType ("resonance-peak", "harmonic-wave", "saturation-logistic", "exponential-growth", or "inverse-power"), xAxisLabel, yAxisLabel, outputMetricLabel, outputMetricUnit, and regimeThresholds.
3. Calibrate ALL text (subtitle, levelCalibrationNote, tldr, mentalModelOrFormalism, sections, and quiz) strictly to the requested expertise level (novice, intermediate, advanced, or pro).`;

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    topic: { type: 'STRING' },
    subtitle: { type: 'STRING' },
    category: { type: 'STRING' },
    entityType: { type: 'STRING' },
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
    'levelCalibrationNote',
    'readingTimeMinutes',
    'tldr',
    'mentalModelOrFormalism',
    'sections',
    'keyFacts',
    'illustration',
    'widget',
    'quiz',
    'rabbitHoles',
    'sources',
  ],
};

async function callGeminiInteraction(modelName, userInput, timeoutMs = 35000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(
      'https://generativelanguage.googleapis.com/v1/interactions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY,
        },
        body: JSON.stringify({
          model: modelName,
          store: false,
          generation_config: {
            thinking_level: 'low',
          },
          tools: [{ type: 'google_search' }],
          system_instruction: SYSTEM_INSTRUCTION,
          input: userInput,
          response_format: RESPONSE_SCHEMA,
        }),
        signal: controller.signal,
      }
    );
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`HTTP ${resp.status}: ${errText.slice(0, 240)}`);
    }
    return await resp.json();
  } finally {
    clearTimeout(timer);
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

Generate the complete interactive microsite JSON for "${query}" calibrated specifically for ${level.toUpperCase()} level.
Ensure:
- 3 crisp, high-signal article sections in "sections"
- 4 keyFacts cards
- 4 or 5 well-spaced nodes in "illustration.nodes" (x between 16 and 84, y between 22 and 78) with matching "illustration.connections"
- Both "widget.parameters" (3 realistic sliders with min < defaultValue < max and step > 0) AND "widget.events" (4-5 milestones) populated so the user can interact with the simulation or timeline seamlessly.`;

        let interaction;
        let usedModel = PRIMARY_MODEL;
        try {
          interaction = await callGeminiInteraction(
            PRIMARY_MODEL,
            userInput,
            32000
          );
        } catch (primaryErr) {
          console.warn(
            `Primary model (${PRIMARY_MODEL}) failed (${primaryErr.message}), retrying with ${FALLBACK_MODEL}...`
          );
          usedModel = FALLBACK_MODEL;
          interaction = await callGeminiInteraction(
            FALLBACK_MODEL,
            userInput,
            32000
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

        // Normalize widgetType
        if (
          resultObj.entityType === 'person' &&
          Array.isArray(resultObj.widget?.events) &&
          resultObj.widget.events.length >= 3
        ) {
          resultObj.widget.widgetType = 'timeline';
        } else if (
          !['simulation', 'timeline'].includes(resultObj.widget?.widgetType)
        ) {
          resultObj.widget.widgetType = 'simulation';
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
