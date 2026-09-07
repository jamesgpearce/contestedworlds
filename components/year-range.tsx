'use client';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { START, END } from '@/lib/history';

export function YearRange({
  range,
  onChange,
}: {
  range: [number, number];
  onChange: (range: [number, number]) => void;
}) {
  const [editing, setEditing] = useState({
    range,
    values: range.map(String),
    error: '',
  });
  const draft = editing.range === range ? editing.values : range.map(String);
  const error = editing.range === range ? editing.error : '';
  const setError = (message: string) =>
    setEditing({ range, values: draft, error: message });
  const apply = () => {
    const [start, end] = draft.map(Number);
    if (
      draft.some((value) => !value.trim()) ||
      !Number.isInteger(start) ||
      !Number.isInteger(end) ||
      start < START ||
      start > END ||
      end < START ||
      end > END
    ) {
      setError(`Enter whole years from ${START} to ${END}.`);
    } else if (start > end) {
      setError('The start year must not be after the end year.');
    } else {
      setError('');
      if (start !== range[0] || end !== range[1]) onChange([start, end]);
    }
  };
  return (
    <div className="year-range">
      {['Start year', 'End year'].map((label, index) => (
        <label key={label} htmlFor={`range-year-${index}`}>
          <span>{label}</span>
          <Input
            id={`range-year-${index}`}
            type="number"
            inputMode="numeric"
            min={START}
            max={END}
            step={1}
            value={draft[index]}
            aria-invalid={!!error}
            aria-describedby={error ? 'year-range-error' : undefined}
            onChange={(e) => {
              setEditing({
                range,
                values: draft.map((value, n) =>
                  n === index ? e.target.value : value,
                ),
                error: '',
              });
            }}
            onBlur={apply}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                apply();
              }
            }}
          />
        </label>
      ))}
      {error && (
        <p className="range-error" id="year-range-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
