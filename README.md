# LearnX — Interactive Learning Microsites (Novice to Pro)

LearnX turns any user query (scientific concept, theorem, system architecture, historical event, or notable person) into a self-contained **interactive microsite** calibrated to the user's selected expertise level:

1. **Novice (`L1 · Intuitive`)** — Zero jargon, vivid real-world analogies, first-principles storytelling.
2. **Intermediate (`L2 · Foundational`)** — Core terminology, causal mechanisms, and structural building blocks.
3. **Advanced (`L3 · Technical`)** — Governing equations, quantitative models, architectural bottlenecks, and trade-offs.
4. **Pro (`L4 · Frontier`)** — Formal rigor, theoretical bounds, subtle failure modes, and open research questions.

Each microsite pairs:
- A level-calibrated **short article**, **executive synthesis**, **mental model / mathematical formalism box**, and **interactive comprehension checkpoint**.
- An **Interactive Concept Illustration** with clickable, inspectable architectural/conceptual nodes.
- A **Dynamic Playable Widget** (real-time multi-parameter response curve simulator or interactive chronological impact scrubber).

## Development & Deployment

```bash
npm install
npm run dev      # Local Vite dev server
npm run build    # Type-check & production bundle in dist/
npm run deploy   # Deploy frontend to clmt.ai:/var/www/learnandplay/learnx
```
