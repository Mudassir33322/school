'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { forwardRef } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import clsx from 'clsx'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  name?: string
  id?: string
  disabled?: boolean
  className?: string
  searchable?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, value, onChange, name, id, disabled, className, searchable = true }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    const [open, setOpen] = useState(false)
    const [search, setSearch] = useState('')
    const [highlightIndex, setHighlightIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const searchRef = useRef<HTMLInputElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const selectedLabel = useMemo(() => {
      const opt = options.find(o => o.value === value)
      return opt ? opt.label : ''
    }, [options, value])

    const filtered = useMemo(() => {
      if (!search) return options
      const q = search.toLowerCase()
      return options.filter(o => o.label.toLowerCase().includes(q))
    }, [options, search])

    const handleClose = useCallback(() => {
      setOpen(false)
      setSearch('')
      setHighlightIndex(-1)
    }, [])

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          handleClose()
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [handleClose])

    useEffect(() => {
      if (open && searchRef.current) {
        searchRef.current.focus()
      }
    }, [open])

    useEffect(() => {
      if (highlightIndex >= 0 && listRef.current) {
        const item = listRef.current.children[highlightIndex] as HTMLElement
        item?.scrollIntoView({ block: 'nearest' })
      }
    }, [highlightIndex])

    const selectOption = (val: string) => {
      onChange?.({ target: { value: val } })
      handleClose()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightIndex(prev => Math.max(prev - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (highlightIndex >= 0 && filtered[highlightIndex]) {
            selectOption(filtered[highlightIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          handleClose()
          break
      }
    }

    if (!searchable) {
      return (
        <div className="w-full">
          {label && (
            <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">
              {label}
            </label>
          )}
          <select
            ref={ref}
            id={selectId}
            name={name}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={clsx(
              'block w-full rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-all duration-150',
              'bg-background text-foreground',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/30'
                : 'border-border focus:border-ring',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
          >
            <option value="">{placeholder || `Select ${label || 'option'}`}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {error && (
            <p className="mt-1 text-sm text-danger" role="alert">{error}</p>
          )}
        </div>
      )
    }

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div ref={containerRef} className="relative" onKeyDown={handleKeyDown}>
          <button
            id={selectId}
            type="button"
            disabled={disabled}
            onClick={() => { if (!disabled) setOpen(!open) }}
            className={clsx(
              'flex w-full items-center justify-between rounded-lg border px-3 py-2.5 text-sm shadow-sm transition-all duration-150',
              'bg-background text-left',
              'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/30'
                : 'border-border focus:border-ring',
              disabled && 'opacity-50 cursor-not-allowed',
              !selectedLabel && 'text-muted-foreground',
              className
            )}
            aria-haspopup="listbox"
            aria-expanded={open}
          >
            <span className="truncate">{selectedLabel || placeholder || `Select ${label || 'option'}`}</span>
            <ChevronDown className={clsx('ml-2 h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')} />
          </button>

          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); selectOption('') }}
              className="absolute right-8 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          {open && (
            <div className="absolute z-50 mt-1 w-full rounded-lg border border-border bg-card shadow-lg">
              {options.length > 5 && (
                <div className="border-b border-border p-2">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search..."
                      value={search}
                      onChange={(e) => { setSearch(e.target.value); setHighlightIndex(0) }}
                      className="w-full rounded-md border border-border bg-background pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>
              )}
              <ul ref={listRef} role="listbox" className="max-h-60 overflow-auto py-1">
                {filtered.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-muted-foreground">No results found</li>
                ) : (
                  filtered.map((option, i) => (
                    <li
                      key={option.value}
                      role="option"
                      aria-selected={option.value === value}
                      onClick={() => selectOption(option.value)}
                      onMouseEnter={() => setHighlightIndex(i)}
                      className={clsx(
                        'cursor-pointer px-3 py-2 text-sm transition-colors',
                        option.value === value && 'bg-primary/10 text-primary font-medium',
                        highlightIndex === i && option.value !== value && 'bg-muted',
                        option.value !== value && highlightIndex !== i && 'text-foreground hover:bg-muted/50'
                      )}
                    >
                      {option.label}
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-danger" role="alert">{error}</p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'
export default Select
