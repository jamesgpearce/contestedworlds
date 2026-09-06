/** Contemporary identifiers, not a reconstruction of flags at each historical date. */
const flagFiles: Record<string, string> = {
  spain: 'es',
  netherlands: 'nl',
  britain: 'gb',
  france: 'fr',
  usa: 'us',
  denmark: 'dk',
  sweden: 'se',
  haiti: 'ht',
  venezuela: 've',
};
export const powerAbbreviations: Record<string, string> = {
  indigenous: 'Indig.',
  contested: 'Shared',
  spain: 'ES',
  netherlands: 'NL',
  britain: 'UK',
  france: 'FR',
  usa: 'US',
  denmark: 'DK',
  sweden: 'SE',
  courland: 'Curl.',
  malta: 'Order',
  haiti: 'Haiti',
  colombia: 'G.Col.',
  venezuela: 'VE',
  independent: 'Indep.',
  other: 'Other',
};
export function PowerSymbol({
  id,
  x = 0,
  y = 0,
}: {
  id: string;
  x?: number;
  y?: number;
}) {
  const flag = flagFiles[id];
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      {flag ? (
        <image href={`/flags/${flag}.svg`} width={22} height={16.5} />
      ) : id === 'malta' ? (
        <g>
          <rect width={22} height={16.5} fill="#b8192d" />
          <path d="M8 0v16.5M0 8.25h22" stroke="white" strokeWidth={3} />
        </g>
      ) : id === 'indigenous' ? (
        <g fill="none" stroke="currentColor" strokeWidth={1.2}>
          <circle cx={7} cy={6} r={3} />
          <circle cx={14} cy={6} r={3} />
          <circle cx={10.5} cy={12} r={3} />
        </g>
      ) : id === 'independent' ? (
        <g fill="none" stroke="currentColor" strokeWidth={1.2}>
          <circle cx={11} cy={8} r={6} />
          <circle cx={11} cy={8} r={2} />
        </g>
      ) : id === 'contested' ? (
        <path
          d="M2 3h6l6 11h6M2 14h6L14 3h6"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
        />
      ) : id === 'other' ? (
        <g fill="currentColor">
          {[4, 11, 18].map((cx) => (
            <circle key={cx} cx={cx} cy={8} r={1.7} />
          ))}
        </g>
      ) : (
        <g>
          <rect
            x={0.5}
            y={0.5}
            width={21}
            height={15.5}
            fill="none"
            stroke="currentColor"
            opacity={0.45}
          />
          <text
            x={11}
            y={12}
            textAnchor="middle"
            fill="currentColor"
            style={{ font: '10px Arial' }}
          >
            {id === 'courland' ? 'C' : 'GC'}
          </text>
        </g>
      )}
    </g>
  );
}
