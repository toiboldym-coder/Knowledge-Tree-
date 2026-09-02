export const TOKENS = {
  bg: "#07080b",
  bg2: "#0c0e14",
  text: "#eceae4",
  muted: "#8c8880",
  line: "rgba(232,230,225,0.10)",
  star: "#c4a36a",
  duration: {
    ui: 160,
    standard: 280,
    panel: 380,
    cameraMin: 650,
    cameraMax: 1100,
  },
  z: {
    universe: 0,
    chrome: 20,
    panel: 24,
    overlay: 30,
    intro: 36,
    grain: 40,
  },
} as const;

export const DOMAIN_COLOR: Record<string, string> = {
  ROOT: "#d7c7a2",
  "hubbard-knowledge-map": "#d7c7a2",
  D01: "#c4a36a",
  D02: "#c46b5a",
  D03: "#6f8f7a",
  D04: "#c4924a",
  D05: "#6a8a9a",
  D06: "#9a7f6a",
  D07: "#7a8a6a",
  D08: "#8a6f55",
  B01: "#c4a36a",
  B02: "#c46b5a",
  B03: "#6f8f7a",
  B04: "#c4924a",
  B05: "#6a8a9a",
  B06: "#9a7f6a",
  B07: "#7a8a6a",
  B08: "#7a8888",
  B09: "#8a6f55",
  B10: "#a8946e",
  B11: "#9a9a94",
  B12: "#8a5a4a",
};

export function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgba(hex: string, a: number): string {
  const [r, g, b] = hexRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
