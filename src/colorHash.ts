export interface BannerColor {
  hue: number;
  saturation: number;
  lightness: number;
  background: string;
  backgroundHex: string;
  foreground: string;
}

const SATURATION = 70;
const LIGHTNESS = 45;

export function hslToHex(h: number, s: number, l: number): string {
  const sNorm = s / 100;
  const lNorm = l / 100;
  const k = (n: number): number => (n + h / 30) % 12;
  const a = sNorm * Math.min(lNorm, 1 - lNorm);
  const f = (n: number): number =>
    lNorm - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number): string =>
    Math.round(x * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`;
}

export function hashString(input: string): number {
  // FNV-1a 32-bit. Math.imul keeps the multiplication in 32-bit space so the
  // result is stable across runtimes (no float drift).
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function projectNameToColor(name: string): BannerColor {
  const hue = hashString(name) % 360;
  return {
    hue,
    saturation: SATURATION,
    lightness: LIGHTNESS,
    background: `hsl(${hue}, ${SATURATION}%, ${LIGHTNESS}%)`,
    backgroundHex: hslToHex(hue, SATURATION, LIGHTNESS),
    foreground: LIGHTNESS < 55 ? "#ffffff" : "#111111",
  };
}
