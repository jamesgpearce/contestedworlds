'use client';
import { ChevronDown, X } from 'lucide-react';
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
            {ids.length === 1 ? selected[0].name : `${ids.length} islands`}
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
            onClick={() => onChange([inspected])}
          >
            Keep only {islands.find((i) => i.id === inspected)?.name}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {[...new Set(islands.map((i) => i.region))].map((region) => (
            <DropdownMenuGroup key={region}>
              <DropdownMenuLabel>{region}</DropdownMenuLabel>
              {islands
                .filter((i) => i.region === region)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((i) => (
                  <DropdownMenuCheckboxItem
                    key={i.id}
                    checked={ids.includes(i.id)}
                    closeOnClick={false}
                    disabled={ids.length === 1 && ids[0] === i.id}
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
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      <details className="selection-list">
        <summary>
          {ids.length} islands in chart · inspecting{' '}
          {islands.find((i) => i.id === inspected)?.name}
        </summary>
        <div className="selected-islands" aria-label="Islands in the chart">
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
              {ids.length > 1 && (
                <button
                  className="remove-island"
                  aria-label={`Remove ${i.name}`}
                  onClick={() => onChange(ids.filter((id) => id !== i.id))}
                >
                  <X size={12} aria-hidden="true" />
                </button>
              )}
            </span>
          ))}
        </div>
      </details>
    </>
  );
}
