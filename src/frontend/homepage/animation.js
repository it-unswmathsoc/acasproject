export function buildFloatingMathSymbols(tick) {
  const symbols = ['∑', 'π', '∫', '√', '∞', 'Δ', 'θ', 'λ', '∂', 'φ', '≈', '⊕', '∀', '∃', '≠', '≤', '≥', '⊂', '⊆', '∈'];
  return Array.from({ length: 34 }, (_, i) => ({
    sym: symbols[i % symbols.length],
    x: (i * 89.3) % 100,
    y: ((i * 41 + tick * (0.2 + (i % 5) * 0.04)) % 125) - 10,
    opacity: 0.14 + (i % 6) * 0.055,
    size: 18 + (i % 6) * 8,
    drift: ((i % 7) - 3) * 0.08,
  }));
}
