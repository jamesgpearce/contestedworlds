/** SVG units follow CSS pixels, keeping labels readable as the plot reflows. */
export function chartLayout(
  width: number,
  height: number,
  range: [number, number],
  rowCount: number,
) {
  const compact = width < 600;
  const numbered = width >= 960;
  const left = compact ? 76 : numbered ? 188 : 154;
  const right = compact ? 17 : 25;
  const top = compact ? 30 : numbered ? 68 : 34;
  const bottom = 21;
  const step = (height - top - bottom) / Math.max(1, rowCount - 1);
  const plotWidth = width - left - right;
  const span = range[1] - range[0];
  const tickStep =
    [25, 50, 100, 200, 500].find(
      (interval) => (interval / span) * plotWidth >= 54,
    ) || 500;
  // Include both ends; reserve enough room around them for full four-digit years.
  const ticks = [range[0]];
  for (
    let tick = Math.ceil(range[0] / tickStep) * tickStep;
    tick < range[1];
    tick += tickStep
  ) {
    if (
      ((tick - range[0]) / span) * plotWidth >= 48 &&
      ((range[1] - tick) / span) * plotWidth >= 48
    )
      ticks.push(tick);
  }
  ticks.push(range[1]);
  return {
    width,
    height,
    compact,
    numbered,
    left,
    right,
    top,
    step,
    ticks,
    x: (year: number) => left + ((year - range[0]) / span) * plotWidth,
    y: (row: number) => top + row * step,
    laneStep: Math.min(0.63, (step * 0.54) / 36),
  };
}
