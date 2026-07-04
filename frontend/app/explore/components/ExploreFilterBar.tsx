'use client';

import { useState, type ReactNode } from 'react';
import { Filter, Wand2, X, RotateCcw, ArrowUpDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { Input } from '@/components/ui/Input';
import { Sheet } from '@/components/ui/Sheet';
import { cn } from '@/lib/utils';

export interface FilterValues {
  minPrice: string;
  maxPrice: string;
  minRating: string;
  capacity?: string;
}

interface ExploreFilterBarProps {
  type: 'abodes' | 'experiences';
  total: number;
  showing: number;
  sort: string;
  filters: FilterValues;
  onFilterChange: (key: string, value: string) => void;
  onApplyFilters: () => void;
  onClearFilters: () => void;
  onSortChange: (sort: string) => void;
  showRefine: boolean;
  onToggleRefine: () => void;
  refineApplied: boolean;
}

const SORT_OPTIONS = [
  { value: 'rating', label: 'Highest rated' },
  { value: 'price', label: 'Price: low to high' },
  { value: 'newest', label: 'Newest' },
];

function FilterChip({
  children,
  onClick,
  active,
  className,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm font-medium transition-colors touch-target',
        active
          ? 'border-text-primary bg-text-primary text-white'
          : 'border-border bg-surface text-text-primary hover:border-text-secondary/50',
        className
      )}
    >
      {children}
    </button>
  );
}

export default function ExploreFilterBar({
  type,
  total,
  showing,
  sort,
  filters,
  onFilterChange,
  onApplyFilters,
  onClearFilters,
  onSortChange,
  showRefine,
  onToggleRefine,
  refineApplied,
}: ExploreFilterBarProps) {
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const label = type === 'abodes' ? 'homestays' : 'experiences';
  const sortLabel = SORT_OPTIONS.find((o) => o.value === sort)?.label ?? 'Sort';

  const hasActiveFilters =
    Boolean(filters.minPrice) ||
    Boolean(filters.maxPrice) ||
    Boolean(filters.minRating) ||
    Boolean(filters.capacity);

  const filterContent = (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Min price (₹)</label>
        <Input
          type="number"
          value={filters.minPrice}
          onChange={(e) => onFilterChange('minPrice', e.target.value)}
          placeholder="0"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Max price (₹)</label>
        <Input
          type="number"
          value={filters.maxPrice}
          onChange={(e) => onFilterChange('maxPrice', e.target.value)}
          placeholder="10000"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-text-primary mb-2">Min rating</label>
        <Input
          type="number"
          min="0"
          max="5"
          step="0.1"
          value={filters.minRating}
          onChange={(e) => onFilterChange('minRating', e.target.value)}
          placeholder="0"
        />
      </div>
      {type === 'abodes' && (
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Guests</label>
          <Input
            type="number"
            min="1"
            value={filters.capacity || ''}
            onChange={(e) => onFilterChange('capacity', e.target.value)}
            placeholder="2"
          />
        </div>
      )}
      <div className="flex gap-2 pt-2">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => {
            onClearFilters();
            setFilterOpen(false);
          }}
        >
          Clear
        </Button>
        <Button
          className="flex-1"
          onClick={() => {
            onApplyFilters();
            setFilterOpen(false);
          }}
        >
          Show {total} {label}
        </Button>
      </div>
    </div>
  );

  const sortContent = (
    <div className="space-y-1">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => {
            onSortChange(opt.value);
            setSortOpen(false);
          }}
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors touch-target',
            sort === opt.value
              ? 'bg-surface-muted text-text-primary'
              : 'text-text-secondary hover:bg-surface-muted/60'
          )}
        >
          {opt.label}
          {sort === opt.value && <Check className="w-4 h-4 text-brand" />}
        </button>
      ))}
    </div>
  );

  return (
    <div className="mb-4">
      {/* Mobile: scrollable filter chips */}
      <div className="md:hidden space-y-2.5">
        <p className="text-xs text-text-secondary">
          <span className="font-semibold text-text-primary">{showing}</span> of{' '}
          <span className="font-semibold text-text-primary">{total}</span> {label}
        </p>
        <div className="-mx-page px-page flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
          <FilterChip onClick={() => setFilterOpen(true)} active={hasActiveFilters}>
            <Filter className="w-3.5 h-3.5" />
            Filters
          </FilterChip>
          <FilterChip onClick={() => setSortOpen(true)}>
            <ArrowUpDown className="w-3.5 h-3.5" />
            {sortLabel}
          </FilterChip>
          <FilterChip onClick={onToggleRefine} active={refineApplied || showRefine}>
            <Wand2 className="w-3.5 h-3.5" />
            {refineApplied ? 'Refined' : 'Refine'}
          </FilterChip>
        </div>
      </div>

      {/* Desktop: original toolbar */}
      <div className="hidden md:flex md:items-center md:justify-between md:gap-4">
        <p className="text-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{showing}</span> of{' '}
          <span className="font-semibold text-text-primary">{total}</span> {label}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => setFilterOpen(true)}>
            <Filter className="w-4 h-4" />
            Filters
          </Button>

          <DropdownMenu
            trigger={
              <Button variant="secondary" size="sm">
                Sort
              </Button>
            }
          >
            {SORT_OPTIONS.map((opt) => (
              <DropdownMenuItem
                key={opt.value}
                active={sort === opt.value}
                onClick={() => onSortChange(opt.value)}
              >
                {opt.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenu>

          <Button
            variant={refineApplied ? 'primary' : 'secondary'}
            size="sm"
            onClick={onToggleRefine}
          >
            <Wand2 className="w-4 h-4" />
            {refineApplied ? 'Refined' : 'Refine'}
          </Button>
        </div>
      </div>

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title={`Filter ${label}`}>
        {filterContent}
      </Sheet>

      <Sheet open={sortOpen} onClose={() => setSortOpen(false)} title="Sort by" className="md:hidden">
        {sortContent}
      </Sheet>
    </div>
  );
}

interface RefinePromptProps {
  open: boolean;
  value: string;
  applied: boolean;
  placeholder: string;
  suggestions: string[];
  onChange: (value: string) => void;
  onApply: () => void;
  onClear: () => void;
  title: string;
  subtitle: string;
}

export function RefinePrompt({
  open,
  value,
  applied,
  placeholder,
  suggestions,
  onChange,
  onApply,
  onClear,
  title,
  subtitle,
}: RefinePromptProps) {
  if (!open) return null;

  return (
    <div className="rounded-xl border border-border bg-surface p-3 sm:p-4 mb-4 sm:mb-6 max-w-2xl">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-text-primary">{title}</p>
          <p className="text-xs text-text-secondary">{subtitle}</p>
        </div>
        {applied && (
          <span className="text-xs font-medium text-success bg-success/10 px-2 py-1 rounded-full shrink-0">
            Applied
          </span>
        )}
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && value.trim()) onApply();
              if (e.key === 'Escape') onChange('');
            }}
            placeholder={placeholder}
            className="pr-10"
          />
          {value.length > 0 && (
            <button
              type="button"
              onClick={() => onChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-text-secondary hover:text-text-primary touch-target"
              aria-label="Clear"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={onApply} disabled={!value.trim()} size="sm" className="flex-1 sm:flex-none">
            <Wand2 className="w-4 h-4" />
            Apply
          </Button>
          {applied && (
            <Button variant="secondary" onClick={onClear} size="sm">
              <RotateCcw className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
        {suggestions.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => onChange(label)}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs text-text-secondary hover:border-brand/50 hover:text-brand-hover touch-target"
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
