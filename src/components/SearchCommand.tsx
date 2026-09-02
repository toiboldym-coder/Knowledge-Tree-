import { useEffect, useMemo, useState } from "react";
import { branchLabel, breadcrumbOf } from "../lib/graph";
import { searchNodes } from "../lib/search";
import type { ViewMode } from "../types";
import { useAtlas } from "../state/AtlasContext";
import type { UiKey } from "../lib/i18n";

export function SearchCommand() {
  const {
    searchOpen,
    setSearchOpen,
    selectNode,
    setView,
    flyHome,
    setFocusMode,
    setShowRelLabels,
    showRelLabels,
    setShowSources,
    showSources,
    setHelpOpen,
    t,
    lang,
  } = useAtlas();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);

  const commands: { id: string; title: UiKey; run: string }[] = [
    { id: "cmd-root", title: "goRoot", run: "root" },
    { id: "cmd-universe", title: "openUniverse", run: "universe" },
    { id: "cmd-tree", title: "openTree", run: "tree" },
    { id: "cmd-timeline", title: "openTimeline", run: "timeline" },
    { id: "cmd-application", title: "openApplication", run: "application" },
    { id: "cmd-paths", title: "openPaths", run: "paths" },
    { id: "cmd-sources", title: "openSources", run: "sources" },
    { id: "cmd-formal", title: "openFormal", run: "formal" },
    { id: "cmd-focus", title: "focusSelected", run: "focus" },
    { id: "cmd-reset", title: "resetCamera", run: "reset" },
    { id: "cmd-rel", title: "toggleRel", run: "rel" },
    { id: "cmd-src", title: "toggleSrc", run: "src" },
    { id: "cmd-help", title: "openHelp", run: "help" },
  ];

  const nodes = useMemo(() => searchNodes(q, 16), [q, lang]);
  const cmds = q ? commands.filter((c) => t(c.title).toLowerCase().includes(q.toLowerCase())) : commands;
  const rows = [
    ...nodes.map((n) => ({ kind: "node" as const, id: n.id, node: n })),
    ...cmds.map((c) => ({ kind: "cmd" as const, id: c.id, cmd: c })),
  ];

  useEffect(() => {
    setActive(0);
  }, [q, searchOpen]);

  if (!searchOpen) return null;

  const run = (row: (typeof rows)[number]) => {
    if (row.kind === "node") {
      selectNode(row.node.id);
      setView("universe");
      setQ("");
      return;
    }
    const r = row.cmd.run;
    if (r === "root" || r === "reset") flyHome();
    if (["universe", "tree", "timeline", "application", "paths", "sources", "formal"].includes(r)) {
      setView(r as ViewMode);
    }
    if (r === "focus") setFocusMode(true);
    if (r === "rel") setShowRelLabels(!showRelLabels);
    if (r === "src") setShowSources(!showSources);
    if (r === "help") setHelpOpen(true);
    setSearchOpen(false);
    setQ("");
  };

  return (
    <div className="fixed inset-0 z-30 grid place-items-start bg-black/50 px-3 pt-[12vh]" onClick={() => setSearchOpen(false)}>
      <div className="glass w-full max-w-[640px]" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((i) => Math.min(rows.length - 1, i + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((i) => Math.max(0, i - 1));
            } else if (e.key === "Enter" && rows[active]) run(rows[active]);
          }}
          placeholder={t("searchPlaceholder")}
          className="w-full border-b border-white/10 bg-transparent px-4 py-3 text-[16px] outline-none placeholder:text-mist"
        />
        <ul className="max-h-[50vh] overflow-auto py-1">
          {rows.map((row, i) => (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => run(row)}
                className={`flex w-full items-start justify-between gap-3 px-4 py-2 text-left ${
                  i === active ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                {row.kind === "node" ? (
                  <>
                    <span>
                      <span className="block text-[14px] text-ivory">{row.node.title}</span>
                      <span className="block text-[12px] text-mist">
                        {branchLabel(row.node.branch ?? "", lang) || row.node.type} · {row.node.short ?? row.node.summary}
                      </span>
                      <span className="block text-[11px] text-mist/70">
                        {breadcrumbOf(row.node.id)
                          .map((c) => (c.type === "branch" ? branchLabel(c.id, lang) : c.type === "root" ? t("home") : c.title))
                          .join(" / ")}
                      </span>
                    </span>
                    <span className="font-mono text-[10px] text-mist">{row.node.id}</span>
                  </>
                ) : (
                  <span className="text-[13px] text-star">{t(row.cmd.title)}</span>
                )}
              </button>
            </li>
          ))}
          {rows.length === 0 && <li className="px-4 py-6 text-[13px] text-mist">{t("noMatchCmd")}</li>}
        </ul>
      </div>
    </div>
  );
}
