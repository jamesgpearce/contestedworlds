'use client';
import { ChevronDown, Minus, X } from 'lucide-react';
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
  onInspect,
}: {
  ids: string[];
  inspected: string;
  onChange: (ids: string[]) => void;
  onInspect: (id: string) => void;
}) {
  const selected = islands.filter((i) => ids.includes(i.id));
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className="islands-trigger"
          aria-label={`Choose islands, ${ids.length} selected`}
        >
          <span>
            {ids.length === 0
              ? 'Choose islands'
              : ids.length === 1
                ? selected[0].name
                : `${ids.length} islands`}
          </span>
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
      {ids.length > 0 && (
        <details className="selection-list">
          <summary>
            {ids.length} {ids.length === 1 ? 'island' : 'islands'} selected ·
            inspecting {islands.find((i) => i.id === inspected)?.name}
          </summary>
          <div className="selected-islands" aria-label="Selected islands">
            {selected.map((i) => (
              <span
                className="selection-chip"
                key={i.id}
                data-inspected={i.id === inspected}
              >
                <button
                  onClick={() => onInspect(i.id)}
                  aria-pressed={i.id === inspected}
                >
                  {i.name}
                </button>
                <button
                  className="remove-island"
                  aria-label={`Remove ${i.name}`}
                  onClick={() => onChange(ids.filter((id) => id !== i.id))}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              </span>
            ))}
          </div>
        </details>
      )}
    </>
  );
}
