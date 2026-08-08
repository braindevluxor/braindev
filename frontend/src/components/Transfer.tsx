import { useState, useMemo } from 'react'
import { FiSearch } from 'react-icons/fi'

interface TransferProps {
  options: Array<{ value: string; label: string }>
  targetKeys: string[]
  onChange: (targetKeys: string[]) => void
  titles?: [string, string]
  disabled?: boolean
}

export default function Transfer({
  options,
  targetKeys,
  onChange,
  titles = ['Disponible', 'Seleccionado'],
  disabled = false,
}: TransferProps) {
  const [checkedKeys, setCheckedKeys] = useState<Set<string>>(new Set())
  const [searchLeft, setSearchLeft] = useState('')
  const [searchRight, setSearchRight] = useState('')

  const availableKeys = useMemo(
    () => options.map((o) => o.value).filter((k) => !targetKeys.includes(k)),
    [options, targetKeys],
  )

  const filteredLeft = useMemo(
    () =>
      options.filter(
        (o) =>
          availableKeys.includes(o.value) &&
          o.label.toLowerCase().includes(searchLeft.toLowerCase()),
      ),
    [options, availableKeys, searchLeft],
  )

  const filteredRight = useMemo(
    () =>
      options.filter(
        (o) =>
          targetKeys.includes(o.value) &&
          o.label.toLowerCase().includes(searchRight.toLowerCase()),
      ),
    [options, targetKeys, searchRight],
  )

  const checkedInLeft = filteredLeft.filter((o) => checkedKeys.has(o.value))
  const checkedInRight = filteredRight.filter((o) => checkedKeys.has(o.value))

  function toggleCheck(key: string) {
    setCheckedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  function moveRight() {
    const toMove = checkedInLeft.map((o) => o.value)
    if (toMove.length === 0) return
    onChange([...targetKeys, ...toMove])
    setCheckedKeys(new Set())
  }

  function moveLeft() {
    const toRemove = new Set(checkedInRight.map((o) => o.value))
    if (toRemove.size === 0) return
    onChange(targetKeys.filter((k) => !toRemove.has(k)))
    setCheckedKeys(new Set())
  }

  function toggleAllLeft() {
    const allChecked = filteredLeft.every((o) => checkedKeys.has(o.value))
    if (allChecked) {
      setCheckedKeys((prev) => {
        const next = new Set(prev)
        filteredLeft.forEach((o) => next.delete(o.value))
        return next
      })
    } else {
      setCheckedKeys((prev) => {
        const next = new Set(prev)
        filteredLeft.forEach((o) => next.add(o.value))
        return next
      })
    }
  }

  function toggleAllRight() {
    const allChecked = filteredRight.every((o) => checkedKeys.has(o.value))
    if (allChecked) {
      setCheckedKeys((prev) => {
        const next = new Set(prev)
        filteredRight.forEach((o) => next.delete(o.value))
        return next
      })
    } else {
      setCheckedKeys((prev) => {
        const next = new Set(prev)
        filteredRight.forEach((o) => next.add(o.value))
        return next
      })
    }
  }

  return (
    <div className={`transfer ${disabled ? 'disabled' : ''}`}>
      <div className="transfer-pane">
        <div className="transfer-pane-header">
          <label className="transfer-checkbox">
            <input
              type="checkbox"
              checked={filteredLeft.length > 0 && filteredLeft.every((o) => checkedKeys.has(o.value))}
              onChange={toggleAllLeft}
              disabled={disabled || filteredLeft.length === 0}
            />
          </label>
          <span className="transfer-pane-title">{titles[0]}</span>
          <span className="transfer-pane-count">
            {checkedInLeft.length}/{filteredLeft.length}
          </span>
        </div>
        <div className="transfer-search-wrapper">
          <FiSearch size={14} className="transfer-search-icon" />
          <input
            type="text"
            className="transfer-search"
            placeholder="Buscar..."
            value={searchLeft}
            onChange={(e) => setSearchLeft(e.target.value)}
            disabled={disabled}
          />
        </div>
        <ul className="transfer-list" role="listbox" aria-multiselectable="true">
          {filteredLeft.length === 0 ? (
            <li className="transfer-empty">Sin opciones</li>
          ) : (
            filteredLeft.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={checkedKeys.has(opt.value)}
                className={`transfer-item ${checkedKeys.has(opt.value) ? 'checked' : ''}`}
                onClick={() => !disabled && toggleCheck(opt.value)}
              >
                <input
                  type="checkbox"
                  checked={checkedKeys.has(opt.value)}
                  onChange={() => {}}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <span>{opt.label}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="transfer-operations">
        <button
          type="button"
          className="transfer-btn"
          onClick={moveRight}
          disabled={disabled || checkedInLeft.length === 0}
          aria-label="Mover a seleccionado"
        >
          →
        </button>
        <button
          type="button"
          className="transfer-btn"
          onClick={moveLeft}
          disabled={disabled || checkedInRight.length === 0}
          aria-label="Mover a disponible"
        >
          ←
        </button>
      </div>

      <div className="transfer-pane">
        <div className="transfer-pane-header">
          <label className="transfer-checkbox">
            <input
              type="checkbox"
              checked={filteredRight.length > 0 && filteredRight.every((o) => checkedKeys.has(o.value))}
              onChange={toggleAllRight}
              disabled={disabled || filteredRight.length === 0}
            />
          </label>
          <span className="transfer-pane-title">{titles[1]}</span>
          <span className="transfer-pane-count">
            {checkedInRight.length}/{filteredRight.length}
          </span>
        </div>
        <div className="transfer-search-wrapper">
          <FiSearch size={14} className="transfer-search-icon" />
          <input
            type="text"
            className="transfer-search"
            placeholder="Buscar..."
            value={searchRight}
            onChange={(e) => setSearchRight(e.target.value)}
            disabled={disabled}
          />
        </div>
        <ul className="transfer-list" role="listbox" aria-multiselectable="true">
          {filteredRight.length === 0 ? (
            <li className="transfer-empty">Sin opciones</li>
          ) : (
            filteredRight.map((opt) => (
              <li
                key={opt.value}
                role="option"
                aria-selected={checkedKeys.has(opt.value)}
                className={`transfer-item ${checkedKeys.has(opt.value) ? 'checked' : ''}`}
                onClick={() => !disabled && toggleCheck(opt.value)}
              >
                <input
                  type="checkbox"
                  checked={checkedKeys.has(opt.value)}
                  onChange={() => {}}
                  tabIndex={-1}
                  aria-hidden="true"
                />
                <span>{opt.label}</span>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  )
}
