import { useEffect, useRef } from "react";
import {
  ROOT_ID,
  allEdges,
  branchLabel,
  colorOf,
  mapNodes,
  nodeById,
} from "../lib/graph";
import { cameraTarget, posOf, WORLD_BOUNDS } from "../lib/layout";
import { rgba, TOKENS } from "../lib/tokens";
import { useAtlas } from "../state/AtlasContext";

type Cam = { x: number; y: number; k: number; vx: number; vy: number };

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
}

function radius(type: string) {
  if (type === "root") return 18;
  if (type === "branch") return 10;
  return 3.6;
}

export function UniverseCanvas() {
  const {
    selectedId,
    hoveredId,
    setHovered,
    selectNode,
    visibleIds,
    neighborIds,
    secondIds,
    ancestry,
    focusMode,
    showSources,
    showRelLabels,
    camera,
    introDone,
    reducedMotion,
    readingMode,
    panelOpen,
  } = useAtlas();

  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cam = useRef<Cam>({ x: 0, y: 0, k: 0.22, vx: 0, vy: 0 });
  const flyRef = useRef<{
    from: Cam;
    to: { x: number; y: number; k: number };
    t0: number;
    dur: number;
  } | null>(null);
  const drag = useRef<{
    pan: boolean;
    sx: number;
    sy: number;
    lx: number;
    ly: number;
    moved: boolean;
  } | null>(null);
  const hover = useRef<string | null>(null);
  const size = useRef({ w: 800, h: 600 });
  const stars = useRef<{ x: number; y: number; r: number; a: number }[]>([]);
  const raf = useRef(0);
  const reveal = useRef(introDone ? 1 : 0);
  const stateRef = useRef({
    selectedId,
    hoveredId,
    visibleIds,
    neighborIds,
    secondIds,
    ancestry,
    focusMode,
    showSources,
    showRelLabels,
    reducedMotion,
  });
  stateRef.current = {
    selectedId,
    hoveredId,
    visibleIds,
    neighborIds,
    secondIds,
    ancestry,
    focusMode,
    showSources,
    showRelLabels,
    reducedMotion,
  };

  useEffect(() => {
    if (stars.current.length) return;
    const list = [];
    for (let i = 0; i < 110; i++) {
      list.push({
        x: (Math.random() - 0.5) * 2400,
        y: (Math.random() - 0.5) * 2400,
        r: Math.random() * 1.1 + 0.2,
        a: 0.12 + Math.random() * 0.35,
      });
    }
    stars.current = list;
  }, []);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      size.current = { w: el.clientWidth, h: el.clientHeight };
    });
    ro.observe(el);
    size.current = { w: el.clientWidth, h: el.clientHeight };
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const target = cameraTarget(camera.id);
    const from = { ...cam.current };
    const dist = Math.hypot(target.x - from.x, target.y - from.y) + Math.abs(target.k - from.k) * 200;
    if (stateRef.current.reducedMotion) {
      cam.current.x = target.x;
      cam.current.y = target.y;
      cam.current.k = target.k;
      flyRef.current = null;
      return;
    }
    flyRef.current = {
      from,
      to: target,
      t0: performance.now(),
      dur: Math.min(TOKENS.duration.cameraMax, TOKENS.duration.cameraMin + dist * 0.35),
    };
  }, [camera]);

  useEffect(() => {
    if (introDone) reveal.current = 1;
  }, [introDone]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const loop = (now: number) => {
      const fly = flyRef.current;
      if (fly) {
        const t = Math.min(1, (now - fly.t0) / fly.dur);
        const e = ease(t);
        cam.current.x = fly.from.x + (fly.to.x - fly.from.x) * e;
        cam.current.y = fly.from.y + (fly.to.y - fly.from.y) * e;
        cam.current.k = fly.from.k + (fly.to.k - fly.from.k) * e;
        if (t >= 1) flyRef.current = null;
      } else if (!drag.current) {
        cam.current.x -= cam.current.vx / cam.current.k;
        cam.current.y -= cam.current.vy / cam.current.k;
        cam.current.vx *= 0.9;
        cam.current.vy *= 0.9;
        if (Math.abs(cam.current.vx) < 0.02) cam.current.vx = 0;
        if (Math.abs(cam.current.vy) < 0.02) cam.current.vy = 0;
      }
      if (!stateRef.current.reducedMotion && reveal.current < 1) {
        reveal.current = Math.min(1, reveal.current + 0.008);
      }
      draw(ctx, now);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = toWorld(sx, sy);
      const nextK = Math.min(2.8, Math.max(0.28, cam.current.k * (e.deltaY < 0 ? 1.08 : 0.92)));
      cam.current.k = nextK;
      const after = toWorld(sx, sy);
      cam.current.x += world.x - after.x;
      cam.current.y += world.y - after.y;
    };
    canvas.addEventListener("wheel", onWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", onWheel);
  }, []);

  const toScreen = (wx: number, wy: number) => {
    const { w, h } = size.current;
    const { x, y, k } = cam.current;
    return { x: (wx - x) * k + w / 2, y: (wy - y) * k + h / 2 };
  };

  const toWorld = (sx: number, sy: number) => {
    const { w, h } = size.current;
    const { x, y, k } = cam.current;
    return { x: (sx - w / 2) / k + x, y: (sy - h / 2) / k + y };
  };

  const draw = (ctx: CanvasRenderingContext2D, now: number) => {
    const { w, h } = size.current;
    const dpr = window.devicePixelRatio || 1;
    const canvas = ctx.canvas;
    if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = TOKENS.bg;
    ctx.fillRect(0, 0, w, h);

    const g = ctx.createRadialGradient(w * 0.5, h * 0.42, 40, w * 0.5, h * 0.5, Math.max(w, h) * 0.72);
    g.addColorStop(0, "rgba(20, 28, 40, 0.55)");
    g.addColorStop(1, "rgba(7, 8, 11, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const st = stateRef.current;
    const k = cam.current.k;
    const rev = reveal.current;

    if (!st.reducedMotion) {
      for (const star of stars.current) {
        const p = toScreen(star.x * 0.22, star.y * 0.22);
        ctx.fillStyle = `rgba(236,234,228,${star.a * 0.7})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, star.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const dimOf = (id: string) => {
      if (!st.visibleIds.has(id)) return 0.04;
      if (st.focusMode) {
        if (id === st.selectedId || st.neighborIds.has(id) || st.secondIds.has(id) || st.ancestry.includes(id)) return 1;
        return 0.08;
      }
      if (st.hoveredId && id !== st.hoveredId && !st.neighborIds.has(id) && id !== st.selectedId) {
        if (nodeById.get(id)?.type === "concept") return 0.18;
      }
      if (st.selectedId !== ROOT_ID && id !== st.selectedId && !st.neighborIds.has(id) && !st.ancestry.includes(id)) {
        return 0.28;
      }
      return 1;
    };

    const showConcept = k > 0.92;
    const showConceptLabels = k > 1.35;
    const showNearLabels = k > 1.85;

    ctx.lineCap = "round";
    const mapIds = new Set(mapNodes().map((n) => n.id));
    for (const edge of allEdges) {
      if (!mapIds.has(edge.source) || !mapIds.has(edge.target)) continue;
      if (!st.visibleIds.has(edge.source) && !st.visibleIds.has(edge.target)) continue;
      const a = nodeById.get(edge.source);
      const b = nodeById.get(edge.target);
      if (!a || !b) continue;
      if (a.type === "concept" && b.type === "concept" && !showConcept) continue;
      const pa = posOf(a.id);
      const pb = posOf(b.id);
      const sa = toScreen(pa.x, pa.y);
      const sb = toScreen(pb.x, pb.y);
      const mx = (sa.x + sb.x) / 2 - (sb.y - sa.y) * 0.12;
      const my = (sa.y + sb.y) / 2 + (sb.x - sa.x) * 0.12;
      const hot =
        a.id === st.selectedId ||
        b.id === st.selectedId ||
        (st.hoveredId && (a.id === st.hoveredId || b.id === st.hoveredId));
      const onPath = st.ancestry.includes(a.id) && st.ancestry.includes(b.id);
      const alpha = (hot || onPath ? 0.55 : edge.type === "contains" ? 0.16 : 0.08) * Math.min(dimOf(a.id), dimOf(b.id)) * rev;
      ctx.beginPath();
      ctx.moveTo(sa.x, sa.y);
      ctx.quadraticCurveTo(mx, my, sb.x, sb.y);
      ctx.strokeStyle = onPath || hot ? rgba(colorOf(a.id === st.selectedId ? a : b), alpha) : `rgba(236,234,228,${alpha})`;
      ctx.lineWidth = onPath ? 1.6 : hot ? 1.25 : edge.type === "contains" ? 1 : 0.7;
      ctx.stroke();
      if (st.showRelLabels && hot && k > 1.2) {
        ctx.fillStyle = "rgba(236,234,228,0.55)";
        ctx.font = "10px Manrope, sans-serif";
        ctx.fillText(edge.type === "contains" ? "part of" : "related", mx, my);
      }
    }

    const drawable = mapNodes();
    for (const node of drawable) {
      if (node.type === "concept" && !showConcept && node.id !== st.selectedId && node.id !== st.hoveredId) continue;
      if (!st.visibleIds.has(node.id) && node.id !== st.selectedId) continue;
      const p = posOf(node.id);
      const s = toScreen(p.x, p.y);
      const dim = dimOf(node.id) * rev;
      if (dim < 0.03) continue;
      const r = radius(node.type) * (node.type === "concept" ? Math.min(1.15, 0.75 + k * 0.2) : 1);
      const col = colorOf(node);
      const selected = node.id === st.selectedId;
      const hovered = node.id === st.hoveredId || node.id === hover.current;

      if (node.type !== "concept" || selected || hovered) {
        const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * (selected ? 7 : 5));
        glow.addColorStop(0, rgba(col, selected ? 0.42 : 0.22));
        glow.addColorStop(1, rgba(col, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 7, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.beginPath();
      if (node.type === "root") {
        const pulse = st.reducedMotion ? 1 : 1 + Math.sin(now / 900) * 0.04;
        ctx.arc(s.x, s.y, r * pulse, 0, Math.PI * 2);
        ctx.fillStyle = rgba("#d7c7a2", 0.95 * dim);
        ctx.fill();
        ctx.strokeStyle = rgba("#d7c7a2", 0.35 * dim);
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 1.7 * pulse, 0, Math.PI * 2);
        ctx.stroke();
      } else if (node.type === "branch") {
        ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, 0.92 * dim);
        ctx.fill();
      } else {
        ctx.arc(s.x, s.y, r + (hovered || selected ? 1.2 : 0), 0, Math.PI * 2);
        ctx.fillStyle = rgba(col, (selected || hovered ? 0.98 : 0.72) * dim);
        ctx.fill();
      }

      if (st.showSources && node.refs.length && k > 1.9) {
        ctx.fillStyle = rgba("#eceae4", 0.45 * dim);
        ctx.fillRect(s.x + r + 3, s.y - 2, 3, 3);
      }

      const label =
        node.type === "branch"
          ? branchLabel(node.id)
          : node.type === "root"
            ? "Hubbard"
            : node.title;
      const showLabel =
        node.type !== "concept"
          ? true
          : selected || hovered || (showNearLabels && dim > 0.6) || (showConceptLabels && (st.neighborIds.has(node.id) || selected));
      if (showLabel && dim > 0.2) {
        ctx.font = `${node.type === "concept" ? 11 : node.type === "branch" ? 13 : 15}px Manrope, sans-serif`;
        ctx.fillStyle = rgba("#eceae4", (selected ? 0.95 : 0.72) * dim);
        ctx.textBaseline = "middle";
        const lift = node.type === "concept" && (selected || hovered) ? -10 : node.type === "concept" ? 8 : 0;
        ctx.fillText(label, s.x + r + 8, s.y + lift);
      }
    }
  };

  const hit = (sx: number, sy: number) => {
    const st = stateRef.current;
    const k = cam.current.k;
    let found: string | null = null;
    let best = 18;
    for (const node of mapNodes()) {
      if (node.type === "concept" && k < 0.88 && node.id !== st.selectedId) continue;
      if (!st.visibleIds.has(node.id) && node.id !== st.selectedId) continue;
      const p = toScreen(posOf(node.id).x, posOf(node.id).y);
      const d = Math.hypot(p.x - sx, p.y - sy);
      const lim = radius(node.type) + 12;
      if (d < lim && d < best) {
        best = d;
        found = node.id;
      }
    }
    return found;
  };

  return (
    <div ref={wrapRef} className="absolute inset-0">
      <canvas
        ref={canvasRef}
        className="block h-full w-full cursor-grab touch-none active:cursor-grabbing"
        onPointerDown={(e) => {
          const rect = canvasRef.current!.getBoundingClientRect();
          drag.current = {
            pan: true,
            sx: e.clientX,
            sy: e.clientY,
            lx: e.clientX,
            ly: e.clientY,
            moved: false,
          };
          cam.current.vx = 0;
          cam.current.vy = 0;
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          void rect;
        }}
        onPointerMove={(e) => {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const sx = e.clientX - rect.left;
          const sy = e.clientY - rect.top;
          if (drag.current) {
            const dx = e.clientX - drag.current.lx;
            const dy = e.clientY - drag.current.ly;
            if (Math.hypot(e.clientX - drag.current.sx, e.clientY - drag.current.sy) > 4) drag.current.moved = true;
            cam.current.x -= dx / cam.current.k;
            cam.current.y -= dy / cam.current.k;
            cam.current.vx = dx;
            cam.current.vy = dy;
            drag.current.lx = e.clientX;
            drag.current.ly = e.clientY;
            return;
          }
          const id = hit(sx, sy);
          if (id !== hover.current) {
            hover.current = id;
            setHovered(id);
          }
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d || d.moved) return;
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          const id = hit(e.clientX - rect.left, e.clientY - rect.top);
          if (id) selectNode(id);
        }}
        onPointerLeave={() => {
          hover.current = null;
          setHovered(null);
        }}
      />
      {hoveredId && nodeById.get(hoveredId) && (
        <div className="pointer-events-none absolute bottom-16 left-1/2 w-[min(360px,90vw)] -translate-x-1/2 glass px-3 py-2">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
            {nodeById.get(hoveredId)?.type === "branch"
              ? "Domain"
              : nodeById.get(hoveredId)?.type === "root"
                ? "Core"
                : branchLabel(nodeById.get(hoveredId)?.branch ?? "") || "Concept"}
          </p>
          <p className="text-[14px] text-ivory">{nodeById.get(hoveredId)?.title}</p>
          <p className="line-clamp-2 text-[12px] text-mist">
            {nodeById.get(hoveredId)?.short ?? nodeById.get(hoveredId)?.summary}
          </p>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-4 left-4 font-mono text-[10px] uppercase tracking-[0.16em] text-mist">
        {focusMode ? "Focus neighborhood" : "Universe"}
        {readingMode || panelOpen ? "" : ""}
        {` · ${Math.round(WORLD_BOUNDS.ring)}`}
      </div>
    </div>
  );
}
