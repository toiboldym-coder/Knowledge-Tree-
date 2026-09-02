import { useEffect, useMemo, useState } from "react";
import { CaretDown, CaretRight, MagnifyingGlass } from "@phosphor-icons/react";
import { BRANCH_COLOR, ROOT_ID, branchLabel, branches, childrenOf, nodeById } from "../lib/graph";
import { useAtlas } from "../state/AtlasContext";

export function TreeView() {
  const { selectedId, selectNode, setFocusMode, setView, notes, t, lang } = useAtlas();
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [cursor, setCursor] = useState(selectedId);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const out: { id: string; depth: number; title: string; meta: string }[] = [
      { id: ROOT_ID, depth: 0, title: t("product"), meta: "core" },
    ];
    for (const branch of branches) {
      const kids = childrenOf(branch.id).filter((n) => n.type === "concept");
      const short = branchLabel(branch.id, lang);
      const matchBranch = !q || branch.title.toLowerCase().includes(q) || short.toLowerCase().includes(q);
      const visibleKids = q
        ? kids.filter(
            (n) =>
              n.title.toLowerCase().includes(q) ||
              (n.short ?? "").toLowerCase().includes(q) ||
              n.id.toLowerCase().includes(q) ||
              n.i18n.title.en.toLowerCase().includes(q) ||
              n.i18n.title.ru.toLowerCase().includes(q) ||
              n.legacyIds.some((id) => id.toLowerCase().includes(q)),
          )
        : kids;
      if (!matchBranch && visibleKids.length === 0) continue;
      out.push({
        id: branch.id,
        depth: 1,
        title: `${short} — ${branch.title}`,
        meta: `${kids.length}`,
      });
      if (!collapsed[branch.id] || q) {
        for (const kid of q ? visibleKids : kids) {
          out.push({ id: kid.id, depth: 2, title: kid.title, meta: kid.id });
        }
      }
    }
    return out;
  }, [query, collapsed, t, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      const i = rows.findIndex((r) => r.id === cursor);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = rows[Math.min(rows.length - 1, i + 1)];
        if (next) setCursor(next.id);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const next = rows[Math.max(0, i - 1)];
        if (next) setCursor(next.id);
      } else if (e.key === "Enter" && cursor) {
        selectNode(cursor);
      } else if (e.key === "ArrowRight" && cursor.startsWith("D")) {
        setCollapsed((s) => ({ ...s, [cursor]: false }));
      } else if (e.key === "ArrowLeft" && cursor.startsWith("D")) {
        setCollapsed((s) => ({ ...s, [cursor]: true }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rows, cursor, selectNode]);

  return (
    <div className="absolute inset-0 z-[1] overflow-auto bg-void/92">
      <div className="mx-auto w-full max-w-[920px] px-4 py-10 md:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{t("treeView")}</p>
            <h2 className="text-[32px] font-medium tracking-tight text-ivory">{t("structure")}</h2>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              className="border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-mist hover:text-ivory"
              onClick={() => setCollapsed({})}
            >
              {t("expandAll")}
            </button>
            <button
              type="button"
              className="border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-mist hover:text-ivory"
              onClick={() => setCollapsed(Object.fromEntries(branches.map((b) => [b.id, true])))}
            >
              {t("collapseAll")}
            </button>
            <button
              type="button"
              className="border border-white/10 px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] text-mist hover:text-ivory"
              onClick={() => {
                const node = nodeById.get(selectedId);
                setFocusMode(true);
                setView("universe");
                if (node?.branch) selectNode(node.branch);
              }}
            >
              {t("focusSubtree")}
            </button>
          </div>
        </div>
        <label className="mb-6 flex items-center gap-2 border border-white/10 px-3 py-2">
          <MagnifyingGlass size={14} weight="light" className="text-mist" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("filterTree")}
            className="w-full bg-transparent text-[14px] outline-none placeholder:text-mist"
          />
        </label>
        <ul>
          {rows.map((row) => {
            const on = row.id === selectedId;
            const active = row.id === cursor;
            const node = nodeById.get(row.id);
            return (
              <li key={row.id}>
                <div className="flex items-stretch">
                  {row.depth === 1 && (
                    <button
                      type="button"
                      className="grid w-7 place-items-center text-mist"
                      onClick={() => setCollapsed((s) => ({ ...s, [row.id]: !s[row.id] }))}
                    >
                      {collapsed[row.id] ? <CaretRight size={12} /> : <CaretDown size={12} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCursor(row.id);
                      selectNode(row.id);
                    }}
                    className={`flex min-w-0 flex-1 items-center justify-between px-3 py-2 text-left ${
                      on ? "bg-white/10 text-ivory" : active ? "bg-white/5 text-ivory" : "text-ivory/75 hover:bg-white/5"
                    }`}
                    style={{ paddingLeft: row.depth === 0 ? 12 : row.depth === 1 ? 8 : 36 }}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {node?.type === "branch" && (
                        <i className="size-1.5 shrink-0" style={{ background: BRANCH_COLOR[row.id] }} />
                      )}
                      <span className="truncate">{row.title}</span>
                      {notes[row.id] && <span className="text-[10px] text-star">{t("note")}</span>}
                    </span>
                    <span className="font-mono text-[10px] text-mist">{row.meta}</span>
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {rows.length === 1 && query && <p className="mt-8 text-[14px] text-mist">{t("noMatching")}</p>}
      </div>
    </div>
  );
}
