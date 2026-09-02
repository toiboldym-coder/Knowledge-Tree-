export type Lang = "en" | "ru";

export type NodeType =
  | "root"
  | "branch"
  | "concept"
  | "timeline_era"
  | "application_topic"
  | "formal_framework";

export type EdgeType = "contains" | "related";

export type ViewMode =
  | "universe"
  | "tree"
  | "timeline"
  | "application"
  | "paths"
  | "sources"
  | "formal";

export type LocalizedText = {
  en: string;
  ru: string;
};

export type StatusKey =
  | "internal_model"
  | "historical_dianetics_model"
  | "religious_doctrinal_claim"
  | "internal_technical_term"
  | "organizational_framework"
  | "formal_system_statement";

export type GraphNode = {
  id: string;
  title: string;
  type: NodeType;
  summary?: string;
  short?: string;
  explanation?: string;
  example?: string;
  status?: string;
  statusKey?: StatusKey;
  refs: string[];
  links: string[];
  branch?: string;
  level: number;
  domain?: string;
  legacyIds: string[];
  originalTerm?: string;
  coreIdea?: string;
  relatedDomains: string[];
  applicationContextIds: string[];
  i18n: {
    title: LocalizedText;
    short: LocalizedText;
    explanation: LocalizedText;
    example: LocalizedText;
    status: LocalizedText;
  };
};

export type GraphEdge = {
  source: string;
  target: string;
  type: EdgeType;
};

export type Source = {
  title: string;
  url: string;
  originalTitle?: string;
  sourceType?: string;
};

export type CorpusItem = {
  title: string;
  focus: string;
  source_key: string;
};

export type Filters = {
  branches: string[];
  types: NodeType[];
  statusGroups: string[];
  neighborhoodOnly: boolean;
};

export type LearningPath = {
  id: string;
  title: string;
  subtitle: string;
  nodeIds: string[];
};

export type TimelineEra = {
  id: string;
  period: string;
  title: string;
  summary: string;
  linkedConceptIds: string[];
  sourceIds: string[];
};

export type ApplicationTopic = {
  id: string;
  title: string;
  short: string;
  linkedConceptIds: string[];
};

export type CameraRequest = {
  id: string;
  nonce: number;
};

export type Vec2 = { x: number; y: number };
