import { breadcrumbOf, sourceTitle, subtreeOf } from "./graph";
import type { GraphNode } from "../types";

function nodeBlock(node: GraphNode): string {
  const crumbs = breadcrumbOf(node.id)
    .map((n) => n.title)
    .join(" / ");
  const lines = [
    `## ${node.title}`,
    "",
    `- ID: \`${node.id}\``,
    `- Тип: ${node.type}`,
    node.status ? `- Статус: ${node.status}` : "",
    crumbs ? `- Путь: ${crumbs}` : "",
    "",
  ].filter(Boolean);

  if (node.short || node.summary) {
    lines.push("### Суть", "", node.short ?? node.summary ?? "", "");
  }
  if (node.explanation) {
    lines.push("### Пояснение", "", node.explanation, "");
  }
  if (node.example) {
    lines.push("### Пример", "", node.example, "");
  }
  if (node.refs.length) {
    lines.push("### Источники", "");
    for (const ref of node.refs) lines.push(`- ${sourceTitle(ref)}`);
    lines.push("");
  }
  return lines.join("\n");
}

export function exportSubtreeMarkdown(id: string): string {
  const nodes = subtreeOf(id);
  const root = nodes[0];
  const header = [
    `# ${root?.title ?? "Поддерево"}`,
    "",
    "Экспорт из интерактивной карты работ Л. Рона Хаббарда.",
    "Утверждения отображаются как элементы системы; эпистемический статус сохранён.",
    "",
  ];
  return [...header, ...nodes.map(nodeBlock)].join("\n");
}

export function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
