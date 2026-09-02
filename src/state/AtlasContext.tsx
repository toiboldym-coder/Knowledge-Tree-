import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CameraRequest, Filters, GraphNode, Lang, NodeType, ViewMode } from "../types";
import {
  LEARNING_PATHS,
  ROOT_ID,
  neighborIdSet,
  nodeById,
  nodesForSource,
  resolveId,
  secondDegreeOf,
  setGraphLang,
} from "../lib/graph";
import { classifyStatus } from "../lib/status";
import { LANGS, readStoredLang, storeLang, ui, type UiKey } from "../lib/i18n";
import { loadNotes, loadPins, saveNotes, savePins } from "../lib/storage";

type Nav = { stack: string[]; i: number };

const VIEW_PATH: Record<ViewMode, string> = {
  universe: "map",
  tree: "tree",
  timeline: "timeline",
  application: "application",
  paths: "paths",
  sources: "sources",
  formal: "formal",
};

const PATH_VIEW: Record<string, ViewMode> = {
  map: "universe",
  universe: "universe",
  tree: "tree",
  timeline: "timeline",
  application: "application",
  paths: "paths",
  sources: "sources",
  formal: "formal",
};

type AtlasValue = {
  lang: Lang;
  t: (key: UiKey) => string;
  setLang: (lang: Lang) => void;
  selectedId: string;
  selected: GraphNode | undefined;
  hoveredId: string | null;
  view: ViewMode;
  pathId: string;
  filters: Filters;
  visibleIds: Set<string>;
  neighborIds: Set<string>;
  secondIds: Set<string>;
  ancestry: string[];
  canBack: boolean;
  canForward: boolean;
  pins: string[];
  notes: Record<string, string>;
  panelOpen: boolean;
  readingMode: boolean;
  focusMode: boolean;
  sourceKey: string | null;
  showSources: boolean;
  showRelLabels: boolean;
  searchOpen: boolean;
  helpOpen: boolean;
  compareOpen: boolean;
  introDone: boolean;
  reducedMotion: boolean;
  camera: CameraRequest;
  pathIndex: number;
  selectNode: (id: string, opts?: { fly?: boolean; fromHistory?: boolean }) => void;
  setHovered: (id: string | null) => void;
  setView: (view: ViewMode) => void;
  setPathId: (id: string) => void;
  setFilters: (next: Filters) => void;
  goBack: () => void;
  goForward: () => void;
  togglePin: (id: string) => void;
  setNote: (id: string, text: string) => void;
  setPanelOpen: (open: boolean) => void;
  setReadingMode: (open: boolean) => void;
  setFocusMode: (open: boolean) => void;
  setSourceKey: (key: string | null) => void;
  setShowSources: (open: boolean) => void;
  setShowRelLabels: (open: boolean) => void;
  setSearchOpen: (open: boolean) => void;
  setHelpOpen: (open: boolean) => void;
  setCompareOpen: (open: boolean) => void;
  setIntroDone: () => void;
  flyHome: () => void;
  goPath: (index: number) => void;
  copyLink: () => Promise<void>;
};

const AtlasContext = createContext<AtlasValue | null>(null);

const emptyFilters: Filters = {
  branches: [],
  types: [],
  statusGroups: [],
  neighborhoodOnly: false,
};

function parseRoute() {
  const parts = window.location.pathname.split("/").filter(Boolean);
  const params = new URLSearchParams(window.location.search);
  let lang: Lang | null = parts[0] === "en" || parts[0] === "ru" ? parts[0] : null;
  const rest = lang ? parts.slice(1) : parts;
  let view: ViewMode = "universe";
  let id: string | undefined;

  if (rest[0] === "concept" && rest[1]) {
    id = rest[1];
    view = PATH_VIEW[params.get("view") ?? ""] ?? "universe";
  } else if (rest[0] && PATH_VIEW[rest[0]]) {
    view = PATH_VIEW[rest[0]];
    id = rest[1] || undefined;
  }

  const fromQuery = params.get("n") ?? params.get("node");
  if (!id && fromQuery) id = fromQuery;
  if (!lang) lang = readStoredLang() ?? "en";

  const resolved = resolveId(id) ?? ROOT_ID;
  const path = params.get("path") ?? "survival-ethics";
  return { lang, id: resolved, view, source: params.get("s"), path, deep: Boolean(id && resolveId(id) && resolveId(id) !== ROOT_ID) };
}

function writeRoute(state: { lang: Lang; id: string; view: ViewMode; source: string | null; path: string }, replace: boolean) {
  const parts: string[] = [state.lang];
  if (state.view === "universe" && state.id !== ROOT_ID) {
    parts.push("concept", state.id);
  } else {
    parts.push(VIEW_PATH[state.view]);
    if (state.id !== ROOT_ID && state.view !== "universe") parts.push(state.id);
  }
  const p = new URLSearchParams();
  if (state.source) p.set("s", state.source);
  if (state.path !== "survival-ethics") p.set("path", state.path);
  const qs = p.toString();
  const next = `/${parts.join("/")}${qs ? `?${qs}` : ""}`;
  if (replace) window.history.replaceState(state, "", next);
  else window.history.pushState(state, "", next);
}

export function AtlasProvider({ children }: { children: ReactNode }) {
  const boot = parseRoute();
  const [lang, setLangState] = useState<Lang>(boot.lang);
  const [tick, setTick] = useState(0);
  const [selectedId, setSelectedId] = useState(boot.id);
  const [hoveredId, setHovered] = useState<string | null>(null);
  const [view, setViewState] = useState<ViewMode>(boot.view);
  const [pathId, setPathIdState] = useState(boot.path);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [nav, setNav] = useState<Nav>({ stack: [boot.id], i: 0 });
  const [pins, setPins] = useState<string[]>(() => loadPins());
  const [notes, setNotes] = useState<Record<string, string>>(() => loadNotes());
  const [panelOpen, setPanelOpen] = useState(boot.deep);
  const [readingMode, setReadingMode] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [sourceKey, setSourceKeyState] = useState<string | null>(boot.source);
  const [showSources, setShowSources] = useState(false);
  const [showRelLabels, setShowRelLabels] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);
  const [introDone, setIntroDoneState] = useState(boot.deep);
  const [camera, setCamera] = useState<CameraRequest>({ id: boot.id, nonce: 0 });
  const [reducedMotion, setReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const skipUrl = useRef(false);
  const firstWrite = useRef(true);

  useLayoutEffect(() => {
    setGraphLang(lang);
    storeLang(lang);
    setTick((n) => n + 1);
  }, [lang]);

  const selected = nodeById.get(selectedId);

  const fly = useCallback((id: string) => {
    setCamera((c) => ({ id, nonce: c.nonce + 1 }));
  }, []);

  const selectNode = useCallback((id: string, opts?: { fly?: boolean; fromHistory?: boolean }) => {
    const resolved = resolveId(id);
    if (!resolved || !nodeById.has(resolved)) return;
    setSelectedId(resolved);
    setPanelOpen(true);
    setSearchOpen(false);
    if (opts?.fly !== false) fly(resolved);
    if (!opts?.fromHistory) {
      setNav((prev) => {
        const stack = prev.stack.slice(0, prev.i + 1);
        if (stack[stack.length - 1] === resolved) return prev;
        return { stack: [...stack, resolved], i: stack.length };
      });
    }
  }, [fly]);

  const setLang = useCallback((next: Lang) => {
    if (!LANGS.includes(next)) return;
    setLangState(next);
  }, []);

  const setView = useCallback((next: ViewMode) => {
    setViewState(next);
    if (next !== "sources") setSourceKeyState(null);
    if (next === "universe") fly(selectedId);
  }, [fly, selectedId]);

  const setPathId = useCallback((id: string) => {
    setPathIdState(id);
    const path = LEARNING_PATHS.find((p) => p.id === id);
    const first = path?.nodeIds[0];
    if (first) selectNode(first);
    setViewState("paths");
  }, [selectNode]);

  const goBack = useCallback(() => {
    setNav((prev) => {
      if (prev.i <= 0) return prev;
      const i = prev.i - 1;
      const id = prev.stack[i];
      setSelectedId(id);
      setPanelOpen(true);
      fly(id);
      return { ...prev, i };
    });
  }, [fly]);

  const goForward = useCallback(() => {
    setNav((prev) => {
      if (prev.i >= prev.stack.length - 1) return prev;
      const i = prev.i + 1;
      const id = prev.stack[i];
      setSelectedId(id);
      setPanelOpen(true);
      fly(id);
      return { ...prev, i };
    });
  }, [fly]);

  const togglePin = useCallback((id: string) => {
    setPins((prev) => {
      const next = prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id].slice(-4);
      savePins(next);
      return next;
    });
  }, []);

  const setNote = useCallback((id: string, text: string) => {
    setNotes((prev) => {
      const next = { ...prev };
      if (text.trim()) next[id] = text;
      else delete next[id];
      saveNotes(next);
      return next;
    });
  }, []);

  const setSourceKey = useCallback((key: string | null) => {
    setSourceKeyState(key);
    if (key) setViewState("sources");
  }, []);

  const goPath = useCallback(
    (index: number) => {
      const path = LEARNING_PATHS.find((p) => p.id === pathId) ?? LEARNING_PATHS[0];
      const id = path.nodeIds[Math.max(0, Math.min(path.nodeIds.length - 1, index))];
      if (id) {
        setViewState("paths");
        selectNode(id);
      }
    },
    [pathId, selectNode],
  );

  const flyHome = useCallback(() => {
    selectNode(ROOT_ID);
    setFocusMode(false);
    setReadingMode(false);
  }, [selectNode]);

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(window.location.href);
  }, []);

  const t = useCallback((key: UiKey) => ui(lang, key), [lang]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReducedMotion(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  useEffect(() => {
    if (skipUrl.current) {
      skipUrl.current = false;
      return;
    }
    writeRoute({ lang, id: selectedId, view, source: sourceKey, path: pathId }, firstWrite.current);
    firstWrite.current = false;
  }, [lang, selectedId, view, sourceKey, pathId]);

  useEffect(() => {
    const onPop = () => {
      const next = parseRoute();
      skipUrl.current = true;
      setLangState(next.lang);
      setSelectedId(next.id);
      setViewState(next.view);
      setSourceKeyState(next.source);
      setPathIdState(next.path);
      fly(next.id);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [fly]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA";
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
        setHelpOpen(false);
        setCompareOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const neighborIds = useMemo(() => neighborIdSet(selectedId), [selectedId, tick]);
  const secondIds = useMemo(() => secondDegreeOf(selectedId), [selectedId, tick]);
  const ancestry = useMemo(() => {
    const ids: string[] = [];
    let cur = nodeById.get(selectedId);
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      ids.unshift(cur.id);
      seen.add(cur.id);
      if (cur.type === "root") break;
      if (cur.branch) cur = nodeById.get(cur.branch);
      else break;
    }
    if (ids[0] !== ROOT_ID) ids.unshift(ROOT_ID);
    return ids;
  }, [selectedId, tick]);

  const visibleIds = useMemo(() => {
    let pool = [...nodeById.values()].filter((n) => n.type === "root" || n.type === "branch" || n.type === "concept");
    if (view === "sources" && sourceKey) pool = nodesForSource(sourceKey);
    const hasB = filters.branches.length > 0;
    const hasT = filters.types.length > 0;
    const hasS = filters.statusGroups.length > 0;
    const filtered = pool.filter((node) => {
      if (hasT && !filters.types.includes(node.type as NodeType)) return false;
      if (hasB) {
        if (node.type === "root") return true;
        if (node.type === "branch") return filters.branches.includes(node.id);
        return Boolean(node.branch && filters.branches.includes(node.branch));
      }
      if (hasS && !filters.statusGroups.includes(classifyStatus(node.status, node.statusKey))) return false;
      return true;
    });
    const ids = new Set(filtered.map((n) => n.id));
    if (filters.neighborhoodOnly) {
      const keep = new Set<string>([selectedId, ...neighborIds, ...secondIds, ...ancestry]);
      return new Set([...ids].filter((id) => keep.has(id)));
    }
    return ids;
  }, [filters, view, sourceKey, selectedId, neighborIds, secondIds, ancestry, tick]);

  const activePath = LEARNING_PATHS.find((p) => p.id === pathId) ?? LEARNING_PATHS[0];
  const currentPathIndex = activePath?.nodeIds.indexOf(selectedId) ?? -1;

  const value = useMemo<AtlasValue>(
    () => ({
      lang,
      t,
      setLang,
      selectedId,
      selected,
      hoveredId,
      view,
      pathId,
      filters,
      visibleIds,
      neighborIds,
      secondIds,
      ancestry,
      canBack: nav.i > 0,
      canForward: nav.i < nav.stack.length - 1,
      pins,
      notes,
      panelOpen,
      readingMode,
      focusMode,
      sourceKey,
      showSources,
      showRelLabels,
      searchOpen,
      helpOpen,
      compareOpen,
      introDone,
      reducedMotion,
      camera,
      pathIndex: currentPathIndex,
      selectNode,
      setHovered,
      setView,
      setPathId,
      setFilters,
      goBack,
      goForward,
      togglePin,
      setNote,
      setPanelOpen,
      setReadingMode,
      setFocusMode,
      setSourceKey,
      setShowSources,
      setShowRelLabels,
      setSearchOpen,
      setHelpOpen,
      setCompareOpen,
      setIntroDone: () => setIntroDoneState(true),
      flyHome,
      goPath,
      copyLink,
    }),
    [
      lang,
      t,
      setLang,
      selectedId,
      selected,
      hoveredId,
      view,
      pathId,
      filters,
      visibleIds,
      neighborIds,
      secondIds,
      ancestry,
      nav,
      pins,
      notes,
      panelOpen,
      readingMode,
      focusMode,
      sourceKey,
      showSources,
      showRelLabels,
      searchOpen,
      helpOpen,
      compareOpen,
      introDone,
      reducedMotion,
      camera,
      currentPathIndex,
      selectNode,
      setView,
      setPathId,
      goBack,
      goForward,
      togglePin,
      setNote,
      flyHome,
      goPath,
      copyLink,
      tick,
    ],
  );

  return <AtlasContext.Provider value={value}>{children}</AtlasContext.Provider>;
}

export function useAtlas() {
  const ctx = useContext(AtlasContext);
  if (!ctx) throw new Error("useAtlas must be used inside AtlasProvider");
  return ctx;
}
