const SYMBOLS = ['∑', 'π', '∫', '√', '∞', 'Δ', 'θ', 'λ', '∂', 'φ', '≈', '⊕', '∀', '∃', '≠', '≤', '≥', '⊂', '⊆', '∈'];

const SIZE_VARIANTS = [26, 32, 36, 40, 44, 50, 56, 62, 68, 72].map((s) => Math.round(s * 0.75));

/** Deterministic 0–1 value per index (stable across renders). */
function hash01(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function pickHorizontalPosition(index, usedPositions, minGapPercent) {
  for (let attempt = 0; attempt < 24; attempt += 1) {
    const x = 5 + hash01(index * 17 + attempt * 31) * 90;
    const tooClose = usedPositions.some((other) => Math.abs(other - x) < minGapPercent);
    if (!tooClose) {
      return x;
    }
  }
  return 5 + hash01(index * 41) * 90;
}

export function buildFloatingMathSymbols() {
  const count = 68;
  const usedPositions = [];

  return Array.from({ length: count }, (_, i) => {
    const x = pickHorizontalPosition(i, usedPositions, 4.2);
    usedPositions.push(x);

    const durationSec = 24 + hash01(i * 3 + 1) * 26;
    const delaySec = -hash01(i * 11 + 2) * durationSec;

    return {
      sym: SYMBOLS[i % SYMBOLS.length],
      x,
      opacity: 0.12 + hash01(i * 19) * 0.1,
      size: SIZE_VARIANTS[Math.floor(hash01(i * 23) * SIZE_VARIANTS.length)],
      drift: `${Math.round((hash01(i * 7) - 0.5) * 20)}px`,
      duration: `${durationSec.toFixed(2)}s`,
      delay: `${delaySec.toFixed(2)}s`,
    };
  });
}
