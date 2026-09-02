import { APPLICATION_TOPICS, nodeById } from "../lib/graph";
import { useAtlas } from "../state/AtlasContext";

export function ApplicationView() {
  const { t, selectNode, selectedId } = useAtlas();

  return (
    <div className="absolute inset-0 z-[1] overflow-auto bg-void/94">
      <div className="mx-auto w-full max-w-[1100px] px-4 py-10 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{t("application")}</p>
        <h2 className="mt-2 text-[32px] font-medium tracking-tight text-ivory">{t("application")}</h2>
        <p className="mt-3 max-w-[65ch] text-[14px] text-mist">{t("applicationLead")}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {APPLICATION_TOPICS.map((topic) => (
            <section key={topic.id} className="border border-white/10 p-4">
              <h3 className="text-[18px] font-medium text-ivory">{topic.title}</h3>
              <p className="mt-1 text-[13px] text-mist">{topic.short}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {topic.linkedConceptIds.map((id) => {
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
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
