'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  allowFreeText?: boolean;
  id?: string;
}

const normalize = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Digite ou selecione',
  label,
  allowFreeText = false,
  id,
}: SearchableSelectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedLabel = useMemo(() => {
    const found = options.find((o) => o.value === value);
    return found?.label ?? value;
  }, [options, value]);

  const filtered = useMemo(() => {
    const term = normalize(search);
    const matches = term
      ? options.filter((o) => normalize(o.label).includes(term))
      : [...options];

    if (allowFreeText && search.trim() && !matches.some((o) => normalize(o.label) === normalize(search))) {
      matches.unshift({ value: search.trim(), label: `Usar "${search.trim()}"` });
    }

    return matches;
  }, [options, search, allowFreeText]);

  const openDropdown = () => {
    setIsOpen(true);
    setSearch('');
    setHighlightedIndex(0);
  };

  const closeDropdown = () => {
    setIsOpen(false);
    setSearch('');
  };

  const selectOption = (option: SearchableSelectOption) => {
    onChange(option.value === `Usar "${search.trim()}"` ? search.trim() : option.value);
    closeDropdown();
    inputRef.current?.blur();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      setHighlightedIndex((prev) => {
        const next = prev < filtered.length - 1 ? prev + 1 : 0;
        scrollToItem(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        openDropdown();
        return;
      }
      setHighlightedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filtered.length - 1;
        scrollToItem(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (isOpen && filtered.length > 0) {
        selectOption(filtered[highlightedIndex]);
      } else if (allowFreeText && search.trim()) {
        onChange(search.trim());
        closeDropdown();
      }
    } else if (e.key === 'Escape') {
      closeDropdown();
      inputRef.current?.blur();
    } else if (e.key === 'Tab') {
      if (isOpen && allowFreeText && search.trim() && filtered.length > 1) {
        // Tab accepts free text if that's the first option
        const first = filtered[0];
        if (first.label.startsWith('Usar "')) {
          onChange(search.trim());
        } else {
          onChange(first.value);
        }
      }
      closeDropdown();
    }
  };

  const scrollToItem = (index: number) => {
    if (!listRef.current) return;
    const item = listRef.current.children[index] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: 'nearest' });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Reset highlighted index when filtered list changes
  useEffect(() => {
    setHighlightedIndex((prev) => Math.min(prev, Math.max(0, filtered.length - 1)));
  }, [filtered.length]);

  const inputId = id ?? `searchable-select-${label ?? Math.random().toString(36).slice(2, 8)}`;

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-gray-900 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
          aria-controls={isOpen ? `${inputId}-listbox` : undefined}
          aria-activedescendant={isOpen && filtered[highlightedIndex] ? `${inputId}-option-${highlightedIndex}` : undefined}
          value={isOpen ? search : selectedLabel}
          onChange={handleInputChange}
          onFocus={openDropdown}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:border-transparent outline-none transition-all duration-200 text-gray-900 placeholder-gray-500 pr-10"
        />
        <button
          type="button"
          onClick={() => {
            if (isOpen) {
              closeDropdown();
              inputRef.current?.blur();
            } else {
              inputRef.current?.focus();
              openDropdown();
            }
          }}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
          aria-label={isOpen ? 'Fechar lista' : 'Abrir lista'}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div
          ref={listRef}
          id={`${inputId}-listbox`}
          role="listbox"
          className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto py-1"
        >
          {filtered.length === 0 ? (
            <div className="px-4 py-3 text-sm text-gray-500">Nenhuma opção encontrada</div>
          ) : (
            filtered.map((option, index) => {
              const isSelected = option.value === value;
              const isHighlighted = index === highlightedIndex;
              return (
                <div
                  key={`${option.value}-${index}`}
                  id={`${inputId}-option-${index}`}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                  className={`px-4 py-2.5 text-sm cursor-pointer flex items-center justify-between ${
                    isHighlighted ? 'bg-emerald-50 text-emerald-900' : 'text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <span>{option.label}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
