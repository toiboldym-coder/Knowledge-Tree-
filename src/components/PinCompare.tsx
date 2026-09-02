import { X } from "@phosphor-icons/react";
import { nodeById, relatedOf, sourceTitle } from "../lib/graph";
import { useAtlas } from "../state/AtlasContext";

export function PinCompare() {
  const { pins, togglePin, compareOpen, setCompareOpen, selectNode, t } = useAtlas();
  if (!compareOpen) return null;
  const cards = pins.map((id) => nodeById.get(id)).filter(Boolean);

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-black/55 p-3 md:p-6">
      <div className="glass flex max-h-[90dvh] w-full max-w-[1400px] flex-col">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-mist">{t("pinnedComparison")}</p>
            <p className="text-[14px] text-ivory">{cards.length} {t("of")} 4</p>
          </div>
          <button
            type="button"
            onClick={() => setCompareOpen(false)}
            className="grid size-8 place-items-center border border-white/10 text-mist"
            aria-label="Close comparison"
          >
            <X size={14} weight="light" />
          </button>
        </div>
        {cards.length === 0 ? (
          <p className="px-4 py-10 text-[14px] text-mist">{t("pinHint")}</p>
        ) : (
          <div className="panel-scroll grid min-h-0 flex-1 grid-cols-1 gap-px overflow-auto bg-white/5 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((node) => {
              if (!node) return null;
              const related = relatedOf(node.id);
              return (
                <article key={node.id} className="flex min-w-0 flex-col bg-void-2 p-4">
                  <div className="mb-3 flex items-start justify-between gap-2">
                    <button type="button" onClick={() => selectNode(node.id)} className="text-left">
                      <p className="font-mono text-[10px] text-mist">{node.id}</p>
                      <h3 className="text-[18px] font-medium leading-tight">{node.title}</h3>
                    </button>
                    <button type="button" onClick={() => togglePin(node.id)} className="text-mist hover:text-star">
                      <X size={14} />
                    </button>
                  </div>
                  {node.status && <p className="mb-3 text-[12px] text-star/80">{node.status}</p>}
                  <p className="mb-3 text-[14px] leading-relaxed text-ivory">{node.short ?? node.summary}</p>
                  {node.explanation && <p className="mb-3 text-[13px] leading-relaxed text-mist">{node.explanation}</p>}
                  {related.length > 0 && (
                    <p className="mt-auto text-[12px] text-mist">{t("related")}: {related.map((n) => n.title).join(" · ")}</p>
                  )}
                  {node.refs.length > 0 && (
                    <p className="mt-2 text-[12px] text-mist">{node.refs.map((key) => sourceTitle(key)).join(" · ")}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
