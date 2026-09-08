import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Minus } from 'lucide-react';
import { islands } from '@/lib/history';

export function IslandPicker({
  ids,
  inspected,
  onChange,
}: {
  ids: string[];
  inspected: string;
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);
  const selected = islands.filter((island) => ids.includes(island.id));
  const region = selected[0]?.region;
  const wholeRegion =
    selected.length > 0 &&
    selected.every((island) => island.region === region) &&
    selected.length ===
      islands.filter((island) => island.region === region).length;
  let label = 'Choose islands';
  if (selected.length === islands.length)
    label = `All ${islands.length} islands`;
  else if (selected.length === 1) label = selected[0].name;
  else if (wholeRegion) label = region!;
  else if (selected.length === 2)
    label = `${selected[0].name} and ${selected[1].name}`;
  else if (selected.length > 2) {
    const others = selected.length - 2;
    label = `${selected[0].name}, ${selected[1].name}, and ${others} other${others === 1 ? '' : 's'}…`;
  }
  const choose = (next: string[]) => onChange(next);
  return (
    <div ref={rootRef} className="island-picker">
      <button
        type="button"
        className="islands-trigger"
        aria-label={`Choose islands: ${label}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span>{label}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </button>
      {open && (
        <div className="islands-menu" role="menu">
          <button
            type="button"
            className="menu-item"
            onClick={() => choose(islands.map((island) => island.id))}
          >
            Select all {islands.length} islands
          </button>
          <button
            type="button"
            className="menu-item"
            disabled={!ids.length}
            onClick={() => choose([])}
          >
            Clear selection
          </button>
          {ids.length > 0 && (
            <button
              type="button"
              className="menu-item"
              onClick={() => choose([inspected])}
            >
              Keep only{' '}
              {islands.find((island) => island.id === inspected)?.name}
            </button>
          )}
          {Array.from(new Set(islands.map((island) => island.region))).map(
            (group) => {
              const members = islands
                .filter((island) => island.region === group)
                .sort((a, b) => a.name.localeCompare(b.name));
              const memberIds = new Set(members.map((island) => island.id));
              const count = members.filter((island) =>
                ids.includes(island.id),
              ).length;
              const allSelected = count === members.length;
              const partial = count > 0 && !allSelected;
              const toggleGroup = () =>
                choose(
                  allSelected
                    ? ids.filter((id) => !memberIds.has(id))
                    : [
                        ...ids,
                        ...members
                          .filter((island) => !ids.includes(island.id))
                          .map((island) => island.id),
                      ],
                );
              return (
                <div className="island-group" key={group}>
                  <button
                    type="button"
                    className="island-group-toggle"
                    role="menuitemcheckbox"
                    aria-checked={partial ? 'mixed' : allSelected}
                    onClick={toggleGroup}
                  >
                    <span>{group}</span>
                    <span className="island-group-count">
                      {count}/{members.length}
                    </span>
                    {partial ? (
                      <Minus
                        className="island-group-mixed"
                        size={16}
                        aria-hidden="true"
                      />
                    ) : allSelected ? (
                      <Check size={16} aria-hidden="true" />
                    ) : null}
                  </button>
                  {members.map((island) => {
                    const checked = ids.includes(island.id);
                    return (
                      <button
                        type="button"
                        className="island-group-member"
                        role="menuitemcheckbox"
                        aria-checked={checked}
                        key={island.id}
                        onClick={() =>
                          choose(
                            checked
                              ? ids.filter((id) => id !== island.id)
                              : [...ids, island.id],
                          )
                        }
                      >
                        {island.name}
                        {checked && <Check size={15} aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              );
            },
          )}
        </div>
      )}
    </div>
  );
}
