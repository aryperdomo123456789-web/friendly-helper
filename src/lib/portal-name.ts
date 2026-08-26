export function portalName(position: number) {
  return `Portal ${Math.max(0, Math.trunc(position)) + 1}`;
}
