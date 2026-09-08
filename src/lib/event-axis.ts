/** Equal spacing for unique event dates; intermediate dates interpolate locally. */
export function eventAxis(range: [number, number], dates: number[]) {
  const domain = [
    ...new Set([
      range[0],
      ...dates.filter(
        (t) => Number.isFinite(t) && t > range[0] && t < range[1],
      ),
      range[1],
    ]),
  ].sort((a, b) => a - b);
  const segments = domain.length - 1;
  function position(date: number) {
    if (date <= domain[0]) return 0;
    if (date >= domain[segments]) return 1;
    let low = 1,
      high = segments;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (domain[mid] < date) low = mid + 1;
      else high = mid;
    }
    return (
      (low - 1 + (date - domain[low - 1]) / (domain[low] - domain[low - 1])) /
      segments
    );
  }
  function at(fraction: number) {
    const point = Math.max(0, Math.min(1, fraction)) * segments;
    const index = Math.min(segments - 1, Math.floor(point));
    return (
      domain[index] + (point - index) * (domain[index + 1] - domain[index])
    );
  }
  function labels(width: number, gap = 54) {
    const result = [domain[0]];
    for (const date of domain.slice(1, -1))
      if (
        (position(date) - position(result.at(-1)!)) * width >= gap &&
        (1 - position(date)) * width >= gap
      )
        result.push(date);
    result.push(domain[segments]);
    return result;
  }
  return { domain, position, at, labels };
}
