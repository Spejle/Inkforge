// Ramer–Douglas–Peucker: drops points that deviate less than eps from the straight line,
// so a hand-drawn river keeps its bends but loses pixel jitter.
export function simplifyPath(pts, eps = 2.5) {
  if (pts.length < 3) return pts;
  const [ax, ay] = pts[0];
  const [bx, by] = pts[pts.length - 1];
  const len = Math.hypot(bx - ax, by - ay) || 1;
  let maxD = 0;
  let idx = 0;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs((by - ay) * pts[i][0] - (bx - ax) * pts[i][1] + bx * ay - by * ax) / len;
    if (d > maxD) { maxD = d; idx = i; }
  }
  if (maxD <= eps) return [pts[0], pts[pts.length - 1]];
  return [...simplifyPath(pts.slice(0, idx + 1), eps).slice(0, -1), ...simplifyPath(pts.slice(idx), eps)];
}
