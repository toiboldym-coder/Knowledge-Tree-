import knowledge from "../data/knowledge.v2.json";
import type {
  ApplicationTopic,
  CorpusItem,
  GraphEdge,
  GraphNode,
  Lang,
  LearningPath,
  LocalizedText,
  NodeType,
  Source,
  StatusKey,
  TimelineEra,
} from "../types";
import { pick } from "./i18n";
import { DOMAIN_COLOR } from "./tokens";

export const ROOT_ID = "hubbard-knowledge-map";

type RawNode = {
  id: string;
  legacyIds?: string[];
  type: string;
  primaryDomainId?: string | null;
  parentId?: string | null;
  title: LocalizedText;
  shortDefinition?: LocalizedText;
  coreIdea?: LocalizedText;
  explanation?: LocalizedText;
  simpleExample?: LocalizedText;
  epistemicStatus?: { key?: string; label?: LocalizedText };
  sourceIds?: string[];
  relatedDomains?: string[];
  applicationContextIds?: string[];
  metadata?: { originalTerm?: string };
  linkedConceptIds?: string[];
};

type RawRel = {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
};

type RawSource = {
  id: string;
  originalTitle?: string;
  title: LocalizedText;
  url?: string;
  sourceType?: string;
  linkedConceptIds?: string[];
};

type RawPath = {
  id: string;
  title: LocalizedText;
  subtitle: LocalizedText;
  nodeIds: string[];
};

type RawEra = {
  id: string;
  period: string;
  title: LocalizedText;
  summary: LocalizedText;
  linkedConceptIds: string[];
  sourceIds: string[];
};

type RawKnowledge = {
  meta: { version: string; epistemic_note: LocalizedText };
  nodes: RawNode[];
  relations: RawRel[];
  sources: RawSource[];
  learningPaths: RawPath[];
  timeline: RawEra[];
  applicationTopics: RawNode[];
};

const data = knowledge as RawKnowledge;

function emptyLoc(): LocalizedText {
  return { en: "", ru: "" };
}

function mapType(raw: RawNode): NodeType {
  if (raw.id === ROOT_ID) return "root";
  if (raw.type === "domain") return "branch";
  if (raw.type === "timeline_era") return "timeline_era";
  if (raw.type === "application_topic") return "application_topic";
  if (raw.type === "formal_framework") return "formal_framework";
  return "concept";
}

function levelOf(type: NodeType): number {
  if (type === "root") return 0;
  if (type === "branch") return 1;
  return 3;
}

function localizeNode(raw: RawNode, lang: Lang): GraphNode {
  const type = mapType(raw);
  const title = pick(raw.title, lang);
  const short = pick(raw.shortDefinition, lang);
  const explanation = pick(raw.explanation ?? raw.coreIdea, lang);
  const example = pick(raw.simpleExample, lang);
  const status = pick(raw.epistemicStatus?.label, lang);
  const domain = raw.primaryDomainId ?? (type === "branch" ? raw.id : undefined) ?? undefined;
  return {
    id: raw.id,
    title,
    type,
    summary: short,
    short,
    explanation: explanation || undefined,
    example: example || undefined,
    status: status || undefined,
    statusKey: (raw.epistemicStatus?.key as StatusKey | undefined) ?? undefined,
    refs: [...(raw.sourceIds ?? [])],
    links: [],
    branch: type === "concept" || type === "formal_framework" || type === "application_topic" ? domain : undefined,
    level: levelOf(type),
    domain,
    legacyIds: [...(raw.legacyIds ?? [])],
    originalTerm: raw.metadata?.originalTerm,
    coreIdea: explanation || undefined,
    relatedDomains: [...(raw.relatedDomains ?? [])],
    applicationContextIds: [...(raw.applicationContextIds ?? [])],
    i18n: {
      title: raw.title ?? emptyLoc(),
      short: raw.shortDefinition ?? emptyLoc(),
      explanation: raw.explanation ?? raw.coreIdea ?? emptyLoc(),
      example: raw.simpleExample ?? emptyLoc(),
      status: raw.epistemicStatus?.label ?? emptyLoc(),
    },
  };
}

function edgesFromRelations(relations: RawRel[]): GraphEdge[] {
  const out: GraphEdge[] = [];
  const seen = new Set<string>();
  for (const rel of relations) {
    const type: GraphEdge["type"] = rel.type === "parent_of" || rel.type === "child_of" ? "contains" : "related";
    const source = rel.type === "child_of" ? rel.targetId : rel.sourceId;
    const target = rel.type === "child_of" ? rel.sourceId : rel.targetId;
    const key = `${type}:${source}->${target}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ source, target, type });
  }
  return out;
}

export const graphMeta = data.meta;

export let currentLang: Lang = "en";
export let allNodes: GraphNode[] = [];
export const nodeById = new Map<string, GraphNode>();
export const legacyToId = new Map<string, string>();

for (const raw of data.nodes) {
  for (const old of raw.legacyIds ?? []) legacyToId.set(old, raw.id);
  legacyToId.set(raw.id, raw.id);
}

export const allEdges: GraphEdge[] = edgesFromRelations(data.relations);
export const allSources: Record<string, Source> = {};
export const sourceI18n: Record<string, RawSource> = {};

for (const src of data.sources) {
  sourceI18n[src.id] = src;
  allSources[src.id] = {
    title: src.title.en,
    url: src.url ?? "",
    originalTitle: src.originalTitle,
    sourceType: src.sourceType,
  };
}

const children = new Map<string, string[]>();
const parents = new Map<string, string[]>();
const related = new Map<string, string[]>();

function pushUnique(map: Map<string, string[]>, key: string, value: string) {
  const list = map.get(key) ?? [];
  if (!list.includes(value)) list.push(value);
  map.set(key, list);
}

for (const edge of allEdges) {
  if (edge.type === "contains") {
    pushUnique(children, edge.source, edge.target);
    pushUnique(parents, edge.target, edge.source);
  } else {
    pushUnique(related, edge.source, edge.target);
    pushUnique(related, edge.target, edge.source);
  }
}

export let branches: GraphNode[] = [];
export let concepts: GraphNode[] = [];
export let studyPath: GraphNode[] = [];
export let LEARNING_PATHS: LearningPath[] = [];
export let TIMELINE: TimelineEra[] = [];
export let APPLICATION_TOPICS: ApplicationTopic[] = [];
export let primaryCorpus: CorpusItem[] = [];

export function resolveId(id: string | null | undefined): string | undefined {
  if (!id) return undefined;
  return legacyToId.get(id) ?? (nodeById.has(id) ? id : undefined);
}

export function setGraphLang(lang: Lang) {
  currentLang = lang;
  allNodes = data.nodes.map((raw) => localizeNode(raw, lang));
  nodeById.clear();
  for (const node of allNodes) nodeById.set(node.id, node);
  branches = allNodes.filter((n) => n.type === "branch").sort((a, b) => a.id.localeCompare(b.id));
  concepts = allNodes.filter((n) => n.type === "concept");
  studyPath = concepts;
  LEARNING_PATHS = data.learningPaths.map((p) => ({
    id: p.id,
    title: pick(p.title, lang),
    subtitle: pick(p.subtitle, lang),
    nodeIds: p.nodeIds,
  }));
  TIMELINE = data.timeline.map((era) => ({
    id: era.id,
    period: era.period,
    title: pick(era.title, lang),
    summary: pick(era.summary, lang),
    linkedConceptIds: era.linkedConceptIds,
    sourceIds: era.sourceIds,
  }));
  APPLICATION_TOPICS = (data.applicationTopics ?? [])
    .filter((n) => n.id.startsWith("application-"))
    .map((n) => ({
      id: n.id,
      title: pick(n.title, lang),
      short: pick(n.shortDefinition, lang),
      linkedConceptIds: n.linkedConceptIds ?? [],
    }));
  primaryCorpus = data.sources.slice(0, 12).map((s) => ({
    title: pick(s.title, lang),
    focus: s.originalTitle ?? s.title.en,
    source_key: s.id,
  }));
  for (const src of data.sources) {
    allSources[src.id] = {
      title: pick(src.title, lang),
      url: src.url ?? "",
      originalTitle: src.originalTitle,
      sourceType: src.sourceType,
    };
  }
}

setGraphLang("en");

export function childrenOf(id: string): GraphNode[] {
  return (children.get(id) ?? []).map((cid) => nodeById.get(cid)).filter(Boolean) as GraphNode[];
}

export function parentsOf(id: string): GraphNode[] {
  return (parents.get(id) ?? []).map((pid) => nodeById.get(pid)).filter(Boolean) as GraphNode[];
}

export function relatedOf(id: string): GraphNode[] {
  const ids = new Set(related.get(id) ?? []);
  const node = nodeById.get(id);
  if (node) {
    for (const link of node.links) ids.add(link);
  }
  return [...ids]
    .map((rid) => nodeById.get(rid))
    .filter((n): n is GraphNode => n !== undefined && n.id !== id && (n.type === "concept" || n.type === "branch"));
}

export function neighborsOf(id: string): GraphNode[] {
  const ids = new Set<string>();
  for (const n of childrenOf(id)) ids.add(n.id);
  for (const n of parentsOf(id)) ids.add(n.id);
  for (const n of relatedOf(id)) ids.add(n.id);
  return [...ids].map((nid) => nodeById.get(nid)).filter(Boolean) as GraphNode[];
}

export function neighborIdSet(id: string): Set<string> {
  return new Set(neighborsOf(id).map((n) => n.id));
}

export function breadcrumbOf(id: string): GraphNode[] {
  const path: GraphNode[] = [];
  const seen = new Set<string>();
  let current = nodeById.get(id);
  while (current && !seen.has(current.id)) {
    path.unshift(current);
    seen.add(current.id);
    if (current.type === "root") break;
    if (current.branch) {
      current = nodeById.get(current.branch);
      continue;
    }
    const ups = parentsOf(current.id);
    current = ups[0];
  }
  const root = nodeById.get(ROOT_ID);
  if (root && path[0]?.id !== ROOT_ID) path.unshift(root);
  return path;
}

export function subtreeOf(id: string): GraphNode[] {
  const start = nodeById.get(id);
  if (!start) return [];
  if (start.type === "root") return allNodes.filter((n) => n.type === "root" || n.type === "branch" || n.type === "concept");
  if (start.type === "branch") {
    return [start, ...allNodes.filter((n) => n.branch === start.id && n.type === "concept")];
  }
  return [start];
}

export function nodesForSource(sourceKey: string): GraphNode[] {
  return allNodes.filter((n) => n.refs.includes(sourceKey));
}

export const BRANCH_SHORT: Record<string, string> = {
  D01: "Foundations",
  D02: "Survival",
  D03: "Ethics",
  D04: "Mind",
  D05: "ARC",
  D06: "Study",
  D07: "Auditing",
  D08: "Organization",
};

export const BRANCH_RU: Record<string, string> = {
  D01: "Фундамент",
  D02: "Выживание",
  D03: "Этика",
  D04: "Разум",
  D05: "АРО",
  D06: "Обучение",
  D07: "Одитинг",
  D08: "Организация",
};

export function branchLabel(id: string, lang: Lang = currentLang): string {
  if (lang === "ru") return BRANCH_RU[id] ?? nodeById.get(id)?.title ?? id;
  return BRANCH_SHORT[id] ?? nodeById.get(id)?.title ?? id;
}

export const BRANCH_COLOR = DOMAIN_COLOR;

export function colorOf(node: GraphNode | string): string {
  const n = typeof node === "string" ? nodeById.get(node) : node;
  if (!n) return DOMAIN_COLOR.ROOT;
  if (n.type === "root") return DOMAIN_COLOR.ROOT;
  if (n.type === "branch") return DOMAIN_COLOR[n.id] ?? DOMAIN_COLOR.ROOT;
  return DOMAIN_COLOR[n.branch ?? n.domain ?? ""] ?? DOMAIN_COLOR.ROOT;
}

export function depthMeta(node: GraphNode, lang: Lang = currentLang): { level: number; label: string } {
  if (node.type === "root") return { level: 0, label: lang === "ru" ? "Ядро системы" : "System core" };
  if (node.type === "branch") return { level: 1, label: lang === "ru" ? "Домен" : "Domain" };
  if (node.type === "timeline_era") return { level: 2, label: lang === "ru" ? "Эпоха" : "Era" };
  if (node.type === "application_topic") return { level: 2, label: lang === "ru" ? "Контекст" : "Context" };
  if (node.type === "formal_framework") return { level: 2, label: lang === "ru" ? "Формальное" : "Formal" };
  return { level: 3, label: lang === "ru" ? "Понятие" : "Concept" };
}

export function secondDegreeOf(id: string): Set<string> {
  const first = neighborIdSet(id);
  const out = new Set<string>();
  for (const nid of first) {
    for (const n of neighborsOf(nid)) {
      if (n.id !== id && !first.has(n.id)) out.add(n.id);
    }
  }
  return out;
}

export function pathIndex(pathId: string, nodeId: string): number {
  const path = LEARNING_PATHS.find((p) => p.id === pathId);
  return path ? path.nodeIds.indexOf(nodeId) : -1;
}

export function sourceTitle(key: string, lang: Lang = currentLang): string {
  const raw = sourceI18n[key];
  if (raw) return pick(raw.title, lang);
  return allSources[key]?.title ?? key;
}

export function sourceUrl(key: string): string | undefined {
  return allSources[key]?.url || undefined;
}

export function locOf(node: GraphNode, field: keyof GraphNode["i18n"], lang: Lang = currentLang): string {
  return pick(node.i18n[field], lang);
}

export function mapNodes(): GraphNode[] {
  return allNodes.filter((n) => n.type === "root" || n.type === "branch" || n.type === "concept");
}

export function formalNodes(): GraphNode[] {
  const extras = allNodes.filter((n) => n.type === "formal_framework");
  const admin = nodeById.get("admin-scale");
  if (admin && !extras.some((n) => n.id === admin.id)) return [...extras, admin];
  return extras;
}
