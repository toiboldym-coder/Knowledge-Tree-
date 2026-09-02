#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "src/data/knowledge.v2.json"), "utf8"));

const errors = [];
const warn = [];
const ids = new Set();
const legacy = new Map();

for (const node of data.nodes) {
  if (ids.has(node.id)) errors.push(`duplicate id: ${node.id}`);
  ids.add(node.id);
  for (const old of node.legacyIds ?? []) {
    if (legacy.has(old) && legacy.get(old) !== node.id) {
      errors.push(`legacy ID collision: ${old} → ${legacy.get(old)} and ${node.id}`);
    }
    legacy.set(old, node.id);
  }
  if (!node.title?.en) errors.push(`missing EN title: ${node.id}`);
  if (!node.title?.ru) errors.push(`missing RU title: ${node.id}`);
  if (node.type === "concept" && !node.primaryDomainId) errors.push(`concept without primary domain: ${node.id}`);
  for (const sid of node.sourceIds ?? []) {
    if (!data.sources.some((s) => s.id === sid)) errors.push(`missing source ${sid} on ${node.id}`);
  }
}

for (const rel of data.relations) {
  if (!ids.has(rel.sourceId)) errors.push(`broken relation source: ${rel.id} ${rel.sourceId}`);
  if (!ids.has(rel.targetId)) errors.push(`broken relation target: ${rel.id} ${rel.targetId}`);
}

const titleIndex = new Map();
for (const node of data.nodes) {
  if (node.type !== "concept") continue;
  const key = node.title.en.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  if (!titleIndex.has(key)) titleIndex.set(key, []);
  titleIndex.get(key).push(node.id);
}
for (const [title, list] of titleIndex) {
  if (list.length > 1) errors.push(`duplicate semantic title "${title}": ${list.join(", ")}`);
}

const timelineConcepts = new Set();
for (const era of data.timeline ?? []) {
  if (ids.has(era.id) && data.nodes.find((n) => n.id === era.id && n.type === "concept")) {
    errors.push(`timeline era cloned as concept: ${era.id}`);
  }
  for (const cid of era.linkedConceptIds ?? []) {
    if (!ids.has(cid)) errors.push(`timeline ${era.id} missing concept ${cid}`);
    if (timelineConcepts.has(`${era.id}:${cid}`)) warn.push(`timeline duplicate link ${era.id} ${cid}`);
    timelineConcepts.add(`${era.id}:${cid}`);
  }
}

for (const node of data.nodes) {
  if (node.type === "concept" && !(node.explanation?.en || node.coreIdea?.en || node.shortDefinition?.en)) {
    warn.push(`thin EN body: ${node.id}`);
  }
}

if (errors.length) {
  console.error(`validate:knowledge failed (${errors.length} errors)`);
  for (const e of errors) console.error(" -", e);
  process.exit(1);
}
console.log(`validate:knowledge ok · ${ids.size} nodes · ${data.relations.length} relations · ${warn.length} warnings`);
for (const w of warn) console.log(" !", w);
