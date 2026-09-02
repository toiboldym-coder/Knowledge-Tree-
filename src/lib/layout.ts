import { ROOT_ID, branches, childrenOf, nodeById } from "./graph";
import type { Vec2 } from "../types";

const RING = 560;

export const layout = new Map<string, Vec2>();

function place() {
  layout.set(ROOT_ID, { x: 0, y: 0 });
  branches.forEach((branch, i) => {
    const a = (i / branches.length) * Math.PI * 2 - Math.PI / 2;
    const bx = Math.cos(a) * RING;
    const by = Math.sin(a) * RING;
    layout.set(branch.id, { x: bx, y: by });
    const kids = childrenOf(branch.id).filter((n) => n.type === "concept");
    kids.forEach((child, j) => {
      const spread = Math.min(2.05, 0.34 + kids.length * 0.07);
      const local = a + (j / Math.max(kids.length, 1) - 0.5) * spread;
      const r = 108 + (j % 3) * 36;
      layout.set(child.id, {
        x: bx + Math.cos(local) * r,
        y: by + Math.sin(local) * r,
      });
    });
  });
}

place();

export function posOf(id: string): Vec2 {
  return layout.get(id) ?? { x: 0, y: 0 };
}

export function cameraTarget(id: string): { x: number; y: number; k: number } {
  const node = nodeById.get(id);
  const p = posOf(id);
  if (!node || node.type === "root") return { x: 0, y: 0, k: 0.62 };
  if (node.type === "branch") return { x: p.x, y: p.y, k: 1.05 };
  return { x: p.x, y: p.y, k: 1.72 };
}

export const WORLD_BOUNDS = { min: -820, max: 820, ring: RING };
