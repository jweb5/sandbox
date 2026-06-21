import React, { useState } from 'react'
import { REGISTRY, CATEGORIES, getDefaultProps } from '../registry'
import { useBuilder } from '../store'

export function ComponentLibrary() {
  const { dispatch } = useBuilder()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)

  const filtered = REGISTRY.filter(c => {
    const matchesSearch = search === '' || c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = activeCategory === null || c.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const grouped = CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(c => c.category === cat)
    if (items.length > 0) acc[cat] = items
    return acc
  }, {} as Record<string, typeof REGISTRY>)

  return (
    <aside className="library-panel">
      <div className="library-header">
        <span className="panel-title">Components</span>
        <span className="component-count">{REGISTRY.length}</span>
      </div>

      <div className="library-search">
        <div className="search-input-wrap">
          <svg className="search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="search-input"
            placeholder="Search components…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>×</button>
          )}
        </div>
      </div>

      <div className="category-tabs">
        <button
          className={`cat-btn ${activeCategory === null ? 'active' : ''}`}
          onClick={() => setActiveCategory(null)}
        >All</button>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            className={`cat-btn ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(prev => prev === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="library-list">
        {Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="lib-category">
            <div className="lib-category-label">{category}</div>
            {items.map(entry => (
              <button
                key={entry.id}
                className="lib-item"
                onClick={() => dispatch({ type: 'ADD_ITEM', componentId: entry.id, defaultProps: getDefaultProps(entry) })}
                title={entry.description}
              >
                <div className="lib-item-icon">{CATEGORY_ICONS[entry.category] ?? '⊞'}</div>
                <div className="lib-item-info">
                  <div className="lib-item-name">{entry.name}</div>
                  <div className="lib-item-desc">{entry.description}</div>
                </div>
                <div className="lib-item-add">+</div>
              </button>
            ))}
          </div>
        ))}
        {Object.keys(grouped).length === 0 && (
          <div className="lib-empty">No components match "{search}"</div>
        )}
      </div>
    </aside>
  )
}

const CATEGORY_ICONS: Record<string, string> = {
  Actions: '⚡',
  Forms: '✏️',
  Display: '👁',
  Navigation: '🧭',
  Content: '📄',
  Feedback: '💬',
}
