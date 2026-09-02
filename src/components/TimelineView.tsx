import { TIMELINE, nodeById, sourceTitle } from "../lib/graph";
import { useAtlas } from "../state/AtlasContext";

export function TimelineView() {
  const { t, selectNode, selectedId } = useAtlas();

  return (
    <div className="absolute inset-0 z-[1] overflow-auto bg-void/94">
      <div className="mx-auto w-full max-w-[920px] px-4 py-10 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{t("timeline")}</p>
        <h2 className="mt-2 text-[32px] font-medium tracking-tight text-ivory">{t("timeline")}</h2>
        <p className="mt-3 max-w-[65ch] text-[14px] text-mist">{t("timelineLead")}</p>
        <ol className="mt-10 space-y-8">
          {TIMELINE.map((era) => (
            <li key={era.id} className="border-l border-white/10 pl-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-star/80">{era.period}</p>
              <h3 className="mt-1 text-[20px] font-medium text-ivory">{era.title}</h3>
              <p className="mt-2 max-w-[65ch] text-[14px] leading-relaxed text-ivory/80">{era.summary}</p>
              {era.sourceIds.length > 0 && (
                <p className="mt-2 text-[12px] text-mist">{era.sourceIds.map((id) => sourceTitle(id)).join(" · ")}</p>
              )}
              {era.linkedConceptIds.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {era.linkedConceptIds.map((id) => {
                    const node = nodeById.get(id);
                    if (!node) return null;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => selectNode(id)}
                        className={`border px-2 py-1 text-[12px] ${
                          id === selectedId ? "border-star/60 text-ivory" : "border-white/10 text-ivory/80 hover:text-star"
                        }`}
                      >
                        {node.title}
                      </button>
                    );
                  })}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
