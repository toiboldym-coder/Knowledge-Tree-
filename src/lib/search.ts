import { allNodes, allSources, sourceTitle } from "./graph";
import type { GraphNode } from "../types";

function fold(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchNodes(query: string, limit = 24): GraphNode[] {
  const q = fold(query.trim());
  if (q.length < 1) return [];

  const scored = allNodes
    .filter((node) => node.type !== "application_topic" || node.id.startsWith("application-") === false)
    .map((node) => {
      const titles = [node.title, node.i18n.title.en, node.i18n.title.ru, node.originalTerm ?? ""];
      const shorts = [node.short ?? "", node.i18n.short.en, node.i18n.short.ru];
      const bodies = [
        node.explanation ?? "",
        node.example ?? "",
        node.i18n.explanation.en,
        node.i18n.explanation.ru,
        node.i18n.example.en,
        node.i18n.example.ru,
      ];
      const ids = [node.id, ...node.legacyIds];
      const refs = node.refs.map((key) => fold(`${key} ${sourceTitle(key)} ${allSources[key]?.url ?? ""}`)).join(" ");
      let score = 0;
      for (const id of ids) {
        const fid = fold(id);
        if (fid === q) score += 100;
        else if (fid.includes(q)) score += 40;
      }
      for (const title of titles) {
        const t = fold(title);
        if (!t) continue;
        if (t === q) score += 90;
        else if (t.startsWith(q)) score += 70;
        else if (t.includes(q)) score += 50;
      }
      if (shorts.some((s) => fold(s).includes(q))) score += 30;
      if (refs.includes(q)) score += 20;
      if (bodies.some((b) => fold(b).includes(q))) score += 10;
      if (node.type === "concept") score += 8;
      return { node, score };
    })
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.node.title.localeCompare(b.node.title, "en"));

  return scored.slice(0, limit).map((row) => row.node);
}
