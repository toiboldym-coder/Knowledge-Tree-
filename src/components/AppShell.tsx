import { useEffect } from "react";
import {
  BookOpen,
  Compass,
  Crosshair,
  House,
  MagnifyingGlass,
  Path,
  Question,
  Scales,
  Stack,
  TreeStructure,
} from "@phosphor-icons/react";
import { branchLabel, breadcrumbOf, graphMeta } from "../lib/graph";
import { pick } from "../lib/i18n";
import type { ViewMode } from "../types";
import { useAtlas } from "../state/AtlasContext";
import { UniverseCanvas } from "./UniverseCanvas";
import { KnowledgePanel } from "./KnowledgePanel";
import { TreeView } from "./TreeView";
import { LearningPathView } from "./LearningPathView";
import { SourceBrowser } from "./SourceBrowser";
import { SearchCommand } from "./SearchCommand";
import { PinCompare } from "./PinCompare";
import { LanguageSwitch } from "./LanguageSwitch";
import { TimelineView } from "./TimelineView";
import { ApplicationView } from "./ApplicationView";
import { FormalFrameworkView } from "./FormalFrameworkView";

const VIEW_ICONS: { id: ViewMode; icon: typeof Crosshair; key: "universe" | "tree" | "timeline" | "application" | "paths" | "sources" | "formal" }[] = [
  { id: "universe", icon: Crosshair, key: "universe" },
  { id: "tree", icon: TreeStructure, key: "tree" },
  { id: "timeline", icon: Compass, key: "timeline" },
  { id: "application", icon: Scales, key: "application" },
  { id: "paths", icon: Path, key: "paths" },
  { id: "sources", icon: Stack, key: "sources" },
  { id: "formal", icon: BookOpen, key: "formal" },
];

export function AppShell() {
  const {
    view,
    setView,
    selected,
    selectedId,
    selectNode,
    setSearchOpen,
    setHelpOpen,
    helpOpen,
    introDone,
    setIntroDone,
    flyHome,
    setFocusMode,
    focusMode,
    setReadingMode,
    readingMode,
    pins,
    setCompareOpen,
    filters,
    setFilters,
    t,
    lang,
  } = useAtlas();

  const crumbs = breadcrumbOf(selectedId);
  const domain = selected?.type === "branch" ? selected.id : selected?.branch;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-void text-ivory">
      <UniverseCanvas />
      {view === "tree" && <TreeView />}
      {view === "sources" && <SourceBrowser />}
      {view === "paths" && <LearningPathView />}
      {view === "timeline" && <TimelineView />}
      {view === "application" && <ApplicationView />}
      {view === "formal" && <FormalFrameworkView />}

      <header className="pointer-events-none absolute inset-x-0 top-0 z-[28] flex items-start justify-between gap-3 p-3 md:p-4">
        <div className="pointer-events-auto max-w-[280px]">
          <button type="button" onClick={flyHome} className="text-left">
            <h1 className="text-[18px] font-medium tracking-tight text-ivory">{t("product")}</h1>
            <p className="hidden text-[11px] text-mist sm:block">{t("tagline")}</p>
          </button>
          {domain && (
            <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.16em] text-star/80">
              {branchLabel(domain, lang)}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSearchOpen(true)}
          className="pointer-events-auto glass hidden items-center gap-2 px-3 py-2 text-[13px] text-mist md:flex"
        >
          <MagnifyingGlass size={14} weight="light" />
          {t("search")}
          <kbd className="font-mono text-[10px] text-mist/70">⌘K</kbd>
        </button>
        <div className="pointer-events-auto flex max-w-[58vw] flex-wrap items-center justify-end gap-1">
          {VIEW_ICONS.map((v) => {
            const Icon = v.icon;
            const on = view === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => setView(v.id)}
                className={`grid size-9 place-items-center border border-white/10 ease-ui hover:text-ivory ${
                  on ? "bg-white/10 text-ivory" : "text-mist"
                }`}
                aria-label={t(v.key)}
              >
                <Icon size={15} weight="light" />
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="grid size-9 place-items-center border border-white/10 text-mist md:hidden"
            aria-label={t("search")}
          >
            <MagnifyingGlass size={15} weight="light" />
          </button>
          <LanguageSwitch />
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="grid size-9 place-items-center border border-white/10 text-mist"
            aria-label={t("help")}
          >
            <Question size={15} weight="light" />
          </button>
        </div>
      </header>

      <div className="pointer-events-none absolute bottom-4 left-3 z-20 flex flex-col gap-1 md:left-4">
        <div className="pointer-events-auto flex flex-col border border-white/10">
          <button type="button" onClick={flyHome} className="grid size-8 place-items-center text-mist hover:text-ivory" aria-label={t("home")}>
            <House size={13} weight="light" />
          </button>
          <button
            type="button"
            onClick={() => setFocusMode(!focusMode)}
            className={`grid size-8 place-items-center ${focusMode ? "text-star" : "text-mist hover:text-ivory"}`}
            aria-label={t("focus")}
          >
            <Crosshair size={13} weight="light" />
          </button>
          <button
            type="button"
            onClick={() => setReadingMode(!readingMode)}
            className={`grid size-8 place-items-center ${readingMode ? "text-star" : "text-mist hover:text-ivory"}`}
            aria-label={t("read")}
          >
            <BookOpen size={13} weight="light" />
          </button>
        </div>
        {pins.length > 0 && (
          <button
            type="button"
            onClick={() => setCompareOpen(true)}
            className="pointer-events-auto border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-mist"
          >
            {t("compare")} {pins.length}
          </button>
        )}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-1/2 z-20 hidden w-[min(70vw,640px)] -translate-x-1/2 md:block">
        <ol className="flex flex-wrap justify-center gap-1 text-[11px] text-mist">
          {crumbs.map((c, i) => (
            <li key={c.id} className="pointer-events-auto flex items-center gap-1">
              {i > 0 && <span>/</span>}
              <button type="button" onClick={() => selectNode(c.id)} className="hover:text-ivory">
                {c.type === "root" ? t("home") : c.type === "branch" ? branchLabel(c.id, lang) : c.title}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <KnowledgePanel />
      <SearchCommand />
      <PinCompare />

      {!introDone && (
        <button
          type="button"
          className="absolute inset-0 z-[36] flex flex-col items-start justify-end bg-[radial-gradient(ellipse_at_center,rgba(20,28,40,0.35),rgba(7,8,11,0.88))] p-8 text-left md:p-14"
          onClick={setIntroDone}
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-star/80">{t("introKicker")}</p>
          <h2 className="mt-3 max-w-[16ch] text-[48px] leading-[0.95] font-medium tracking-tight md:text-[72px]">
            {t("product")}
          </h2>
          <p className="mt-4 text-[15px] text-mist">{t("introCta")}</p>
        </button>
      )}

      {helpOpen && (
        <div className="fixed inset-0 z-30 grid place-items-center bg-black/50 p-4" onClick={() => setHelpOpen(false)}>
          <div className="glass max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{t("help")}</p>
            <ul className="mt-4 space-y-2 text-[14px] text-ivory/80">
              <li>{t("helpSearch")}</li>
              <li>{t("helpNav")}</li>
              <li>{t("helpViews")}</li>
              <li>{t("helpFocus")}</li>
            </ul>
            <p className="mt-6 text-[12px] leading-relaxed text-mist">{pick(graphMeta.epistemic_note, lang)}</p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() =>
          setFilters({
            ...filters,
            neighborhoodOnly: !filters.neighborhoodOnly,
          })
        }
        className="pointer-events-auto absolute bottom-16 left-3 z-20 border border-white/10 px-2 py-1 text-[10px] uppercase tracking-[0.12em] text-mist md:left-4"
      >
        {filters.neighborhoodOnly ? t("showAll") : t("neighborhood")}
      </button>
    </div>
  );
}
