/** Non-deterministic RNG backed by Math.random (runtime animation). */
export function createMathRandomSource(): import('../types').RandomSource {
  return {
    random: () => Math.random(),
    randFloat: (min, max) => min + Math.random() * (max - min),
    randFloatSpread: (range) => (Math.random() - 0.5) * range,
  };
}

/** Deterministic LCG RNG for reproducible tests and snapshots. */
export function createSeededRandomSource(seed: number): import('../types').RandomSource {
  let state = seed >>> 0;

  const random = () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0x100000000;
  };

  return {
    random,
    randFloat: (min, max) => min + random() * (max - min),
    randFloatSpread: (range) => (random() - 0.5) * range,
  };
}
