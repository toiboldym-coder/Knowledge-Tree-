import { resolveId } from "./graph";

const NOTES_KEY = "hubbard.atlas.notes.v1";
const PINS_KEY = "hubbard.atlas.pins.v1";

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function remapId(id: string): string {
  return resolveId(id) ?? id;
}

export function loadNotes(): Record<string, string> {
  const raw = readJson<Record<string, string>>(NOTES_KEY, {});
  const next: Record<string, string> = {};
  for (const [id, text] of Object.entries(raw)) {
    const nid = remapId(id);
    next[nid] = next[nid] ? `${next[nid]}\n\n${text}` : text;
  }
  return next;
}

export function saveNotes(notes: Record<string, string>) {
  localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
}

export function loadPins(): string[] {
  return readJson<string[]>(PINS_KEY, [])
    .map(remapId)
    .filter((id, i, arr) => arr.indexOf(id) === i)
    .slice(0, 4);
}

export function savePins(pins: string[]) {
  localStorage.setItem(PINS_KEY, JSON.stringify(pins.map(remapId).slice(0, 4)));
}
