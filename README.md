# Hubbard Knowledge Map

Interactive bilingual map of concepts from L. Ron Hubbard’s system. English is the default language; Russian is a full alternate UI.

The live graph is `src/data/knowledge.v2.json` (8 domains, canonical English slugs). The original 12-ray dump stays in `src/data/Hubbard_Knowledge_Graph.json` as an archive. Legacy IDs such as `E03` still resolve.

```bash
npm install
npm run validate:knowledge
npm run dev
```

Open `http://localhost:5173`. Shareable routes:

- `/en/concept/overt-act`
- `/ru/concept/overt-act`
- `/en/tree`, `/en/timeline`, `/en/application`, `/en/paths`, `/en/sources`, `/en/formal`

The language switcher **EN | RU** keeps the selected concept and view. Old query links still work: `/?n=E03` redirects to the canonical slug.

Keyboard: `/` or `⌘K` for search (both languages) and commands.
