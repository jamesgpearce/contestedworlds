import { sources } from '@/lib/history';

export const Cite = ({ ids }: { ids: string[] }) => (
  <span className="citations">
    {Array.from(new Set(ids)).map((id, n) => (
      <a
        key={id}
        href={sources[id]?.url}
        target="_blank"
        rel="noreferrer"
        title={`${sources[id]?.publisher}: ${sources[id]?.title}`}
      >
        [{n + 1}]
        <span className="sr-only"> {sources[id]?.title} (opens a new tab)</span>
      </a>
    ))}
  </span>
);
