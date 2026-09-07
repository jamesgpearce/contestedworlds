export type Point = { x: number; y: number };
export type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

const cross = (a: Point, b: Point, p: Point) =>
  (b.x - a.x) * (p.y - a.y) - (b.y - a.y) * (p.x - a.x);
function inTriangle(p: Point, a: Point, b: Point, c: Point) {
  if (cross(a, b, c) === 0) return false;
  const signs = [cross(a, b, p), cross(b, c, p), cross(c, a, p)];
  return signs.every((n) => n >= 0) || signs.every((n) => n <= 0);
}

/** Protect direct pointer paths from the departure point to any edge of the card. */
export function withinCardCorridor(point: Point, origin: Point, card: Bounds) {
  const pad = 6;
  const left = card.left - pad,
    right = card.right + pad;
  const top = card.top - pad,
    bottom = card.bottom + pad;
  if (
    point.x >= left &&
    point.x <= right &&
    point.y >= top &&
    point.y <= bottom
  )
    return true;
  if (
    Math.abs(point.x - origin.x) <= pad &&
    Math.abs(point.y - origin.y) <= pad
  )
    return true;
  const corners = [
    { x: left, y: top },
    { x: right, y: top },
    { x: right, y: bottom },
    { x: left, y: bottom },
  ];
  return corners.some((corner, n) =>
    inTriangle(point, origin, corner, corners[(n + 1) % 4]),
  );
}
