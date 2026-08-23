export function randomFrom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

export function experimentId(seed: number, scenario: string) {
  const suffix = [...scenario].reduce((sum, char) => sum + char.charCodeAt(0), seed)
    .toString(36).toUpperCase().padStart(6, "0").slice(-6);
  return `SIM-${seed}-${suffix}`;
}
