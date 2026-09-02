import { formalNodes } from "../lib/graph";
import { useAtlas } from "../state/AtlasContext";

export function FormalFrameworkView() {
  const { t, selectNode, selectedId } = useAtlas();
  const nodes = formalNodes();

  return (
    <div className="absolute inset-0 z-[1] overflow-auto bg-void/94">
      <div className="mx-auto w-full max-w-[920px] px-4 py-10 md:px-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-mist">{t("formal")}</p>
        <h2 className="mt-2 text-[32px] font-medium tracking-tight text-ivory">{t("formal")}</h2>
        <p className="mt-3 max-w-[65ch] text-[14px] text-mist">{t("formalLead")}</p>
        <ul className="mt-10 divide-y divide-white/10">
          {nodes.map((node) => (
            <li key={node.id}>
              <button
                type="button"
                onClick={() => selectNode(node.id)}
                className={`flex w-full items-start justify-between gap-3 py-4 text-left ${
                  node.id === selectedId ? "text-star" : "text-ivory hover:text-ivory"
                }`}
              >
                <span>
                  <span className="block text-[16px] font-medium">{node.title}</span>
                  <span className="mt-1 block max-w-[65ch] text-[13px] text-mist">{node.short}</span>
                </span>
                <span className="font-mono text-[10px] text-mist">{node.originalTerm ?? node.id}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
