import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from 'react'
import { FiX, FiChevronDown, FiSearch } from 'react-icons/fi'

interface MultiSelectProps {
  options: Array<{ value: string; label: string }>
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  disabled?: boolean
}

export default function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = 'Seleccionar...',
  searchPlaceholder = 'Buscar...',
  disabled = false,
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(search.toLowerCase()),
  )

  const selectedOptions = options.filter((opt) => selected.includes(opt.value))

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
        setSearch('')
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen && searchRef.current) {
      searchRef.current.focus()
    }
  }, [isOpen])

  const toggleOption = useCallback(
    (value: string) => {
      if (selected.includes(value)) {
        onChange(selected.filter((v) => v !== value))
      } else {
        onChange([...selected, value])
      }
    },
    [selected, onChange],
  )

  const removeOption = useCallback(
    (value: string, e: React.MouseEvent) => {
      e.stopPropagation()
      onChange(selected.filter((v) => v !== value))
    },
    [selected, onChange],
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
          e.preventDefault()
          setIsOpen(true)
        }
        return
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setFocusedIndex((prev) => (prev + 1) % filteredOptions.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setFocusedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length)
          break
        case 'Enter':
        case ' ':
          e.preventDefault()
          if (focusedIndex >= 0 && filteredOptions[focusedIndex]) {
            toggleOption(filteredOptions[focusedIndex].value)
          }
          break
        case 'Escape':
          e.preventDefault()
          setIsOpen(false)
          setSearch('')
          setFocusedIndex(-1)
          break
      }
    },
    [isOpen, focusedIndex, filteredOptions, toggleOption],
  )

  useEffect(() => {
    if (listRef.current && focusedIndex >= 0) {
      const focusedElement = listRef.current.children[focusedIndex] as HTMLElement
      focusedElement?.scrollIntoView({ block: 'nearest' })
    }
  }, [focusedIndex])

  return (
    <div
      ref={containerRef}
      className="multi-select"
      onKeyDown={handleKeyDown}
      aria-disabled={disabled}
    >
      <button
        type="button"
        className="multi-select-trigger"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        disabled={disabled}
      >
        <div className="multi-select-value">
          {selectedOptions.length === 0 ? (
            <span className="multi-select-placeholder">{placeholder}</span>
          ) : (
            <div className="multi-select-chips">
              {selectedOptions.map((opt) => (
                <span key={opt.value} className="multi-select-chip">
                  {opt.label}
                  <button
                    type="button"
                    className="multi-select-chip-remove"
                    onClick={(e) => removeOption(opt.value, e)}
                    aria-label={`Remover ${opt.label}`}
                  >
                    <FiX size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="multi-select-indicators">
          {selected.length > 0 && (
            <span className="multi-select-count">{selected.length}</span>
          )}
          <FiChevronDown
            size={16}
            className={`multi-select-icon ${isOpen ? 'rotated' : ''}`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="multi-select-dropdown">
          <div className="multi-select-search-wrapper">
            <FiSearch size={14} className="multi-select-search-icon" />
            <input
              ref={searchRef}
              type="text"
              className="multi-select-search"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setFocusedIndex(-1)
              }}
              aria-label="Buscar opciones"
            />
          </div>
          <ul
            ref={listRef}
            className="multi-select-list"
            role="listbox"
            aria-multiselectable="true"
            aria-label="Opciones disponibles"
          >
            {filteredOptions.length === 0 ? (
              <li className="multi-select-empty">No se encontraron opciones</li>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = selected.includes(opt.value)
                const isFocused = index === focusedIndex
                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    className={`multi-select-option ${isSelected ? 'selected' : ''} ${isFocused ? 'focused' : ''}`}
                    onClick={() => toggleOption(opt.value)}
                    onMouseEnter={() => setFocusedIndex(index)}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      tabIndex={-1}
                      aria-hidden="true"
                    />
                    <span>{opt.label}</span>
                  </li>
                )
              })
            )}
          </ul>
        </div>
      )}
    </div>
  )
}
