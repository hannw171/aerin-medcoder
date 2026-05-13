"use client";

import React, { useState, useEffect } from "react";

export type CodeItem = { id: string; code: string; description: string; insight?: string; };

export function SearchableICDInput({
  type,
  placeholder,
  onSelect,
  onCancel,
  value,
  onChange,
}: {
  type: 'icd10' | 'icd9';
  placeholder: string;
  onSelect: (item: CodeItem) => void;
  onCancel?: () => void;
  value?: string;
  onChange?: (val: string) => void;
}) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState<CodeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [tempSelection, setTempSelection] = useState<CodeItem | null>(null);
  const skipSearchRef = React.useRef(!!value);

  // Sync value prop to query state
  useEffect(() => {
    if (value !== undefined && value !== query) {
      setQuery(value);
    }
  }, [value]);

  const handleSelect = (item: CodeItem) => {
    if (onCancel) {
      setTempSelection(item);
      setQuery(`${item.code} - ${item.description}`);
      setIsOpen(false);
      setResults([]);
    } else {
      skipSearchRef.current = true;
      if (onChange) {
        onChange(item.code);
      }
      setQuery(item.code);
      onSelect(item);
      setIsOpen(false);
      setResults([]);
    }
  };

  useEffect(() => {
    if (!query) {
      setResults([]);
      setIsOpen(false);
      setSelectedIndex(-1);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      if (tempSelection && query === `${tempSelection.code} - ${tempSelection.description}`) {
        return;
      }
      if (skipSearchRef.current) {
        skipSearchRef.current = false;
        return;
      }
      
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search-icd?q=${encodeURIComponent(query)}&type=${type}`);
        const data = await res.json();
        setResults(data);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query, type, tempSelection, value]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const indexToSelect = selectedIndex >= 0 ? selectedIndex : 0;
      if (results[indexToSelect]) {
        handleSelect({ 
          id: results[indexToSelect].code, 
          code: results[indexToSelect].code, 
          description: results[indexToSelect].description 
        });
        setSelectedIndex(-1);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (onChange) onChange(val);
    setSelectedIndex(-1);
  };

  return (
    <div className="relative flex-1">
      <input
        type="text"
        autoFocus={!value}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-md px-3 py-2 font-body-md text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:italic placeholder:text-on-surface-variant"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
        onFocus={() => {
          if (results.length > 0) setIsOpen(true);
        }}
      />
      {isLoading && (
        <span className="absolute right-3 top-2.5 material-symbols-outlined animate-spin text-on-surface-variant text-sm">
          progress_activity
        </span>
      )}
      {isOpen && results.length > 0 && (
        <ul className="absolute z-50 w-full mt-1 bg-surface-container-lowest border border-outline-variant rounded-md shadow-lg max-h-60 overflow-auto">
          {results.map((item, index) => (
            <li
              key={item.code}
              className={`px-3 py-2 hover:bg-surface-container-low cursor-pointer flex gap-3 border-b border-outline-variant/30 last:border-b-0 ${index === selectedIndex ? 'bg-surface-container-low' : ''}`}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect({ id: item.code, code: item.code, description: item.description });
              }}
            >
              <span className="font-mono-data text-mono-data font-semibold whitespace-nowrap">{item.code}</span>
              <span className="font-body-md text-body-md text-on-surface truncate">{item.description}</span>
            </li>
          ))}
        </ul>
      )}
      {onCancel && (
        <div className="flex gap-3 mt-4">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 bg-slate-200 text-slate-700 rounded-md hover:bg-slate-300 transition-colors font-semibold text-sm"
          >
            Batal
          </button>
          <button
            disabled={!tempSelection}
            onClick={() => tempSelection && onSelect(tempSelection)}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors font-semibold text-sm disabled:opacity-50 shadow-sm"
          >
            Simpan Perubahan
          </button>
        </div>
      )}
    </div>
  );
}
