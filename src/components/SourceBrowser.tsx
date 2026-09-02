import { allSources, nodesForSource, primaryCorpus, sourceTitle, sourceUrl } from "../lib/graph";
import { useAtlas } from "../state/AtlasContext";

export function SourceBrowser() {
  const { sourceKey, setSourceKey, selectNode, setView, t } = useAtlas();
  const keys = Object.keys(allSources);
  const related = sourceKey ? nodesForSource(sourceKey) : [];

  return (
    <div className="absolute inset-0 z-[1] overflow-auto bg-void/94">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 gap-8 px-4 py-10 md:grid-cols-[1fr_1fr] md:px-8">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{t("sources")}</p>
          <h2 className="mb-6 text-[32px] font-medium tracking-tight">{t("referenceCorpus")}</h2>
          <ul className="divide-y divide-white/10">
            {keys.map((key) => {
              const count = nodesForSource(key).length;
              const url = sourceUrl(key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setSourceKey(key)}
                    className={`flex w-full items-start justify-between gap-3 py-3 text-left ${
                      sourceKey === key ? "text-star" : "text-ivory/85 hover:text-ivory"
                    }`}
                  >
                    <span>
                      <span className="block text-[14px]">{sourceTitle(key)}</span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.12em] text-mist">
                        {t("bookLecture")} · {count} {t("conceptsCount")}
                      </span>
                    </span>
                    {url && (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] text-mist hover:text-star"
                      >
                        {t("open")}
                      </a>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          <h3 className="mt-10 text-[12px] uppercase tracking-[0.16em] text-mist">{t("primaryCorpus")}</h3>
          <ul className="mt-3 space-y-3">
            {primaryCorpus.map((item) => (
              <li key={item.title}>
                <button type="button" onClick={() => setSourceKey(item.source_key)} className="text-left">
                  <span className="block text-[14px] text-ivory">{item.title}</span>
                  <span className="block text-[12px] text-mist">{item.focus}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">
            {sourceKey ? `${related.length} ${t("linkedConcepts")}` : t("selectSource")}
          </p>
          {related.length === 0 ? (
            <p className="mt-6 text-[14px] text-mist">{t("chooseSource")}</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {related.map((node) => (
                <li key={node.id}>
                  <button
                    type="button"
                    onClick={() => {
                      selectNode(node.id);
                      setView("universe");
                    }}
                    className="flex w-full items-start justify-between gap-3 py-3 text-left"
                  >
                    <span>
                      <span className="block text-[14px] text-ivory">{node.title}</span>
                      <span className="block text-[12px] text-mist">{node.short ?? node.summary}</span>
                    </span>
                    <span className="font-mono text-[10px] text-mist">{node.id}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
