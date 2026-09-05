/* oxlint-disable jsx-a11y/prefer-tag-over-role -- An inline SVG image requires role=img for consistent screen-reader support. */
import land from '@/lib/coastlines.json';
import {
  islands,
  owners,
  stateAt,
  type Island,
  type Mode,
} from '@/lib/history';

export function IslandMap({
  island,
  year,
  mode,
}: {
  island: Island;
  year: number;
  mode: Mode;
}) {
  const project = ([lon, lat]: number[]) => [
    ((lon + 89) / 31) * 300,
    ((29 - lat) / 20) * 200,
  ];
  const [x, y] = project(island.coordinates);
  return (
    <figure className="locator-map">
      <svg
        viewBox="0 0 300 200"
        role="img"
        aria-label={`Location of ${island.name} in the Caribbean. Dots show political power in ${Math.floor(year)}; the ring marks the selected island.`}
      >
        <rect width="300" height="200" fill="#eef1ea" />
        {[15, 20, 25].map((lat) => (
          <line
            key={lat}
            x1="0"
            x2="300"
            y1={(29 - lat) * 10}
            y2={(29 - lat) * 10}
            stroke="#dde4d8"
            strokeWidth=".5"
          />
        ))}
        {[-85, -75, -65].map((lon) => (
          <line
            key={lon}
            y1="0"
            y2="200"
            x1={((lon + 89) / 31) * 300}
            x2={((lon + 89) / 31) * 300}
            stroke="#dde4d8"
            strokeWidth=".5"
          />
        ))}
        {land.paths.map((d, n) => (
          <path
            key={n}
            d={d}
            fill="#d4ddcd"
            stroke="#bccab5"
            strokeWidth=".6"
          />
        ))}
        <text x="108" y="145" textAnchor="middle" className="sea-label">
          CARIBBEAN SEA
        </text>
        {islands.map((i) => {
          const [cx, cy] = project(i.coordinates);
          return (
            <circle
              key={i.id}
              cx={cx}
              cy={cy}
              r={i.id === island.id ? 3 : 1.9}
              fill={owners[stateAt(i, year, mode)].color}
              stroke="#fffef9"
              strokeWidth=".6"
            />
          );
        })}
        <circle
          cx={x}
          cy={y}
          r="7"
          fill="none"
          stroke="#283b3b"
          strokeWidth="1"
        />
        <path
          d={`M${x - 11},${y}h3M${x + 8},${y}h3M${x},${y - 11}v3M${x},${y + 8}v3`}
          fill="none"
          stroke="#283b3b"
          strokeWidth=".6"
        />
      </svg>
      <figcaption>
        <span>Political power · {Math.floor(year)}</span>
        <a
          href={land.url}
          target="_blank"
          rel="noreferrer"
          title="Natural Earth public-domain coastlines"
        >
          Natural Earth ↗
        </a>
      </figcaption>
    </figure>
  );
}
