'use client';
import { ChevronDown, Minus } from 'lucide-react';
import { islands } from '@/lib/history';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

export function IslandPicker({
  ids,
  inspected,
  onChange,
}: {
  ids: string[];
  inspected: string;
  onChange: (ids: string[]) => void;
}) {
  const selected = islands.filter((i) => ids.includes(i.id));
  const region = selected[0]?.region;
  const wholeRegion =
    selected.length > 0 &&
    selected.every((i) => i.region === region) &&
    selected.length === islands.filter((i) => i.region === region).length;
  let label = 'Choose islands';
  if (selected.length === islands.length) {
    label = `All ${islands.length} islands`;
  } else if (selected.length === 1) {
    label = selected[0].name;
  } else if (wholeRegion) {
    label = region!;
  } else if (selected.length === 2) {
    label = `${selected[0].name} and ${selected[1].name}`;
  } else if (selected.length > 2) {
    const others = selected.length - 2;
    label = `${selected[0].name}, ${selected[1].name}, and ${others} other${others === 1 ? '' : 's'}…`;
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="islands-trigger"
        aria-label={`Choose islands: ${label}`}
      >
        <span>{label}</span>
        <ChevronDown size={18} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="islands-menu" align="start">
        <DropdownMenuItem
          closeOnClick={false}
          onClick={() => onChange(islands.map((i) => i.id))}
        >
          Select all {islands.length} islands
        </DropdownMenuItem>
        <DropdownMenuItem
          closeOnClick={false}
          disabled={!ids.length}
          onClick={() => onChange([])}
        >
          Clear selection
        </DropdownMenuItem>
        {ids.length > 0 && (
          <DropdownMenuItem
            closeOnClick={false}
            onClick={() => onChange([inspected])}
          >
            Keep only {islands.find((i) => i.id === inspected)?.name}
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        {[...new Set(islands.map((i) => i.region))].map((region) => {
          const members = islands
            .filter((i) => i.region === region)
            .sort((a, b) => a.name.localeCompare(b.name));
          const memberIds = new Set(members.map((i) => i.id));
          const count = members.filter((i) => ids.includes(i.id)).length;
          const allSelected = count === members.length;
          const partial = count > 0 && !allSelected;
          return (
            <DropdownMenuGroup key={region}>
              <DropdownMenuLabel className="sr-only">
                {region}
              </DropdownMenuLabel>
              <DropdownMenuCheckboxItem
                className="island-group-toggle"
                checked={allSelected}
                aria-checked={partial ? 'mixed' : allSelected}
                aria-label={`${region}, ${count} of ${members.length} selected`}
                label={region}
                closeOnClick={false}
                onCheckedChange={(checked) =>
                  onChange(
                    checked
                      ? [
                          ...ids,
                          ...members
                            .filter((i) => !ids.includes(i.id))
                            .map((i) => i.id),
                        ]
                      : ids.filter((id) => !memberIds.has(id)),
                  )
                }
              >
                <span>{region}</span>
                <span className="island-group-count" aria-hidden="true">
                  {count}/{members.length}
                </span>
                {partial && (
                  <Minus
                    className="island-group-mixed"
                    size={16}
                    aria-hidden="true"
                  />
                )}
              </DropdownMenuCheckboxItem>
              {members.map((i) => (
                <DropdownMenuCheckboxItem
                  className="island-group-member"
                  key={i.id}
                  checked={ids.includes(i.id)}
                  closeOnClick={false}
                  onCheckedChange={(checked) =>
                    onChange(
                      checked
                        ? [...ids, i.id]
                        : ids.filter((id) => id !== i.id),
                    )
                  }
                >
                  {i.name}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuGroup>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
