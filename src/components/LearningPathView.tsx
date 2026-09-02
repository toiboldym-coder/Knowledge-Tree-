import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { LEARNING_PATHS, branchLabel, nodeById, sourceTitle } from "../lib/graph";
import { useAtlas } from "../state/AtlasContext";

export function LearningPathView() {
  const { pathId, setPathId, selectedId, selectNode, goPath, pathIndex, t, lang } = useAtlas();
  const path = LEARNING_PATHS.find((p) => p.id === pathId) ?? LEARNING_PATHS[0];
  const i = Math.max(0, pathIndex);
  const current = nodeById.get(path.nodeIds[i] ?? path.nodeIds[0]);
  const prev = nodeById.get(path.nodeIds[i - 1] ?? "");
  const next = nodeById.get(path.nodeIds[i + 1] ?? "");

  return (
    <div className="absolute inset-x-0 top-0 z-[1] border-b border-white/10 bg-void/80 px-4 py-3 backdrop-blur-xl md:px-6">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{t("learningPath")}</p>
          <h2 className="text-[20px] font-medium tracking-tight text-ivory">{path.title}</h2>
          <p className="text-[13px] text-mist">{path.subtitle}</p>
        </div>
        <p className="font-mono text-[11px] text-mist">
          {i + 1} / {path.nodeIds.length}
        </p>
      </div>
      <div className="mb-3 flex gap-1 overflow-x-auto pb-1">
        {LEARNING_PATHS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPathId(p.id)}
            className={`shrink-0 border px-2 py-1 text-[11px] uppercase tracking-[0.12em] ${
              p.id === path.id ? "border-star/50 text-star" : "border-white/10 text-mist hover:text-ivory"
            }`}
          >
            {p.title}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center">
        <button
          type="button"
          disabled={!prev}
          onClick={() => goPath(i - 1)}
          className="flex items-center gap-2 text-left text-[13px] text-mist disabled:opacity-30"
        >
          <CaretLeft size={14} />
          <span>{prev ? prev.title : t("start")}</span>
        </button>
        <div className="text-center">
          <p className="text-[15px] text-ivory">{current?.title}</p>
          <p className="text-[12px] text-mist">
            {current?.branch ? branchLabel(current.branch, lang) : ""} · {t("level")} {current?.level ?? 3}
          </p>
        </div>
        <button
          type="button"
          disabled={!next}
          onClick={() => goPath(i + 1)}
          className="flex items-center justify-end gap-2 text-right text-[13px] text-mist disabled:opacity-30"
        >
          <span>{next ? next.title : t("end")}</span>
          <CaretRight size={14} />
        </button>
      </div>
      {current?.refs[0] && (
        <p className="mt-2 text-center text-[12px] text-mist">{t("source")}: {sourceTitle(current.refs[0])}</p>
      )}
      <div className="mt-3 h-px bg-white/10">
        <div className="h-px bg-star" style={{ width: `${((i + 1) / path.nodeIds.length) * 100}%` }} />
      </div>
      <div className="mt-2 flex gap-1 overflow-x-auto">
        {path.nodeIds.map((id, idx) => {
          const node = nodeById.get(id);
          if (!node) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => selectNode(id)}
              className={`shrink-0 border px-2 py-1 text-[11px] ${
                id === selectedId ? "border-star/60 text-ivory" : "border-white/10 text-mist"
              }`}
            >
              {idx + 1}. {node.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
