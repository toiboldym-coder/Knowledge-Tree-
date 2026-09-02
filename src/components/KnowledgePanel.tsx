import {
  ArrowLeft,
  ArrowRight,
  ArrowSquareOut,
  BookOpen,
  CaretDown,
  Copy,
  Crosshair,
  Path,
  PushPin,
  TreeStructure,
  X,
} from "@phosphor-icons/react";
import { useState } from "react";
import {
  branchLabel,
  breadcrumbOf,
  childrenOf,
  depthMeta,
  LEARNING_PATHS,
  parentsOf,
  relatedOf,
  secondDegreeOf,
  sourceTitle,
  sourceUrl,
  nodeById,
} from "../lib/graph";
import { classifyStatus, statusLabel } from "../lib/status";
import type { GraphNode } from "../types";
import { useAtlas } from "../state/AtlasContext";

export function KnowledgePanel() {
  const {
    selected,
    selectedId,
    selectNode,
    panelOpen,
    setPanelOpen,
    readingMode,
    setReadingMode,
    pins,
    togglePin,
    notes,
    setNote,
    goBack,
    canBack,
    setView,
    setFocusMode,
    setSourceKey,
    copyLink,
    pathId,
    pathIndex,
    goPath,
    t,
    lang,
  } = useAtlas();

  const [openExtra, setOpenExtra] = useState(false);
  if (!panelOpen || !selected) return null;

  const crumbs = breadcrumbOf(selected.id);
  const related = relatedOf(selected.id);
  const relatedIds = new Set(related.map((n) => n.id));
  const cross = [...secondDegreeOf(selected.id)]
    .map((id) => nodeById.get(id))
    .filter((n): n is GraphNode => n !== undefined && n.type === "concept" && !relatedIds.has(n.id))
    .slice(0, 8);
  const parents = parentsOf(selected.id);
  const children = childrenOf(selected.id);
  const depth = depthMeta(selected, lang);
  const path = LEARNING_PATHS.find((p) => p.id === pathId) ?? LEARNING_PATHS[0];
  const statusKind = classifyStatus(selected.status, selected.statusKey);

  return (
    <aside
      className={`ease-panel absolute inset-x-0 bottom-0 z-[24] flex max-h-[78dvh] flex-col border-t border-white/10 md:inset-y-auto md:top-16 md:bottom-0 md:left-auto md:right-0 md:max-h-none md:border-l md:border-t-0 ${
        readingMode ? "md:w-[min(62vw,760px)]" : "md:w-[min(38vw,460px)]"
      } glass`}
    >
      <div className="flex items-start justify-between gap-3 px-5 pt-4">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
            {t("level")} {depth.level} — {depth.label}
            {selected.domain ? ` · ${branchLabel(selected.domain, lang)}` : ""}
          </p>
          <h2 className="mt-1 text-[26px] font-medium leading-[1.1] tracking-tight text-ivory">{selected.title}</h2>
          {lang === "ru" && selected.originalTerm && (
            <p className="mt-1 text-[12px] text-mist">
              {t("originalTerm")}: {selected.originalTerm}
            </p>
          )}
        </div>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            onClick={() => togglePin(selected.id)}
            className={`grid size-8 place-items-center border border-white/10 text-mist ease-ui hover:text-ivory active:scale-[0.98] ${
              pins.includes(selected.id) ? "text-star" : ""
            }`}
            aria-label={t("pin")}
          >
            <PushPin size={14} weight={pins.includes(selected.id) ? "fill" : "light"} />
          </button>
          <button
            type="button"
            onClick={() => setPanelOpen(false)}
            className="grid size-8 place-items-center border border-white/10 text-mist hover:text-ivory"
            aria-label={t("closePanel")}
          >
            <X size={14} weight="light" />
          </button>
        </div>
      </div>

      <ol className="flex flex-wrap gap-1 px-5 pt-3 text-[12px] text-mist">
        {crumbs.map((c, i) => (
          <li key={c.id} className="flex items-center gap-1">
            {i > 0 && <span className="opacity-40">/</span>}
            <button type="button" onClick={() => selectNode(c.id)} className="hover:text-ivory">
              {c.type === "root" ? t("home") : c.type === "branch" ? branchLabel(c.id, lang) : c.title}
            </button>
          </li>
        ))}
      </ol>

      <div className="panel-scroll min-h-0 flex-1 overflow-auto px-5 py-4">
        <p className="max-w-[65ch] text-[16px] leading-relaxed text-ivory">{selected.short ?? selected.summary}</p>

        {selected.status && (
          <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.14em] text-star/80">
            {selected.status === statusLabel(statusKind, lang)
              ? selected.status
              : `${statusLabel(statusKind, lang)} · ${selected.status}`}
          </p>
        )}

        {selected.explanation && (
          <section className="mt-6">
            <h3 className="mb-2 text-[12px] uppercase tracking-[0.16em] text-mist">{t("coreIdea")}</h3>
            <p className="max-w-[65ch] text-[14px] leading-relaxed text-ivory/80">{selected.explanation}</p>
          </section>
        )}

        {selected.example && (
          <section className="mt-6">
            <h3 className="mb-2 text-[12px] uppercase tracking-[0.16em] text-mist">{t("example")}</h3>
            <p className="max-w-[65ch] text-[14px] leading-relaxed text-ivory/75">{selected.example}</p>
          </section>
        )}

        {(parents.length > 0 || children.length > 0) && (
          <section className="mt-6 grid gap-4">
            {parents.length > 0 && (
              <div>
                <h3 className="mb-2 text-[12px] uppercase tracking-[0.16em] text-mist">{t("parent")}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {parents.map((n) => (
                    <Chip key={n.id} label={n.title} onClick={() => selectNode(n.id)} />
                  ))}
                </div>
              </div>
            )}
            {children.length > 0 && (
              <div>
                <h3 className="mb-2 text-[12px] uppercase tracking-[0.16em] text-mist">{t("children")}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {children.map((n) => (
                    <Chip key={n.id} label={n.title} onClick={() => selectNode(n.id)} />
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {related.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 text-[12px] uppercase tracking-[0.16em] text-mist">{t("related")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {related.map((n) => (
                <Chip key={n.id} label={n.title} onClick={() => selectNode(n.id)} />
              ))}
            </div>
          </section>
        )}

        {cross.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 text-[12px] uppercase tracking-[0.16em] text-mist">{t("crossDomain")}</h3>
            <div className="flex flex-wrap gap-1.5">
              {cross.map((n) => (
                <Chip key={n.id} label={n.title} onClick={() => selectNode(n.id)} />
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          onClick={() => setOpenExtra((v) => !v)}
          className="mt-6 flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] text-mist hover:text-ivory"
        >
          <CaretDown size={12} className={`ease-ui ${openExtra ? "rotate-180" : ""}`} />
          {t("sourcesNotes")}
        </button>

        {openExtra && (
          <div className="mt-3 space-y-5">
            {selected.refs.length > 0 ? (
              <ul className="space-y-2">
                {selected.refs.map((key) => {
                  const url = sourceUrl(key);
                  return (
                    <li key={key}>
                      {url ? (
                        <a
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-start justify-between gap-2 text-[13px] text-ivory/85 hover:text-star"
                        >
                          <span>{sourceTitle(key)}</span>
                          <ArrowSquareOut size={13} weight="light" />
                        </a>
                      ) : (
                        <button type="button" onClick={() => setSourceKey(key)} className="text-left text-[13px]">
                          {sourceTitle(key)}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="text-[13px] text-mist">{t("noSources")}</p>
            )}
            <label className="block">
              <span className="mb-1 block text-[12px] uppercase tracking-[0.14em] text-mist">{t("localNote")}</span>
              <textarea
                value={notes[selectedId] ?? ""}
                onChange={(e) => setNote(selectedId, e.target.value)}
                rows={4}
                className="w-full border border-white/10 bg-white/5 px-3 py-2 text-[13px] text-ivory outline-none focus:border-white/25"
                placeholder={t("notePlaceholder")}
              />
            </label>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-1 border-t border-white/10 p-3 sm:grid-cols-4">
        <Action icon={Crosshair} label={t("focus")} onClick={() => { setView("universe"); setFocusMode(true); selectNode(selected.id); }} />
        <Action icon={TreeStructure} label={t("subtree")} onClick={() => setView("tree")} />
        <Action icon={BookOpen} label={readingMode ? t("graph") : t("read")} onClick={() => setReadingMode(!readingMode)} />
        <Action icon={Copy} label={t("copyLink")} onClick={() => void copyLink()} />
        <Action icon={ArrowLeft} label={t("back")} onClick={goBack} disabled={!canBack} />
        <Action
          icon={ArrowRight}
          label={t("nextRelated")}
          onClick={() => related[0] && selectNode(related[0].id)}
          disabled={!related[0]}
        />
        <Action icon={Path} label={t("path")} onClick={() => setView("paths")} />
        <Action
          icon={ArrowRight}
          label={t("nextStep")}
          onClick={() => goPath(pathIndex < 0 ? 0 : pathIndex + 1)}
          disabled={pathIndex >= path.nodeIds.length - 1 && pathIndex !== -1}
        />
      </div>
    </aside>
  );
}

function Chip({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-white/10 px-2 py-1 text-left text-[12px] text-ivory/85 ease-ui hover:border-star/50 hover:text-star active:scale-[0.98]"
    >
      {label}
    </button>
  );
}

function Action({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: typeof Crosshair;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-2 px-2 py-2 text-left text-[11px] uppercase tracking-[0.12em] text-mist ease-ui hover:bg-white/5 hover:text-ivory disabled:opacity-30"
    >
      <Icon size={13} weight="light" />
      {label}
    </button>
  );
}
