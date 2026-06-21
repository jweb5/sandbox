import React from 'react'
import { REGISTRY } from '../registry'
import { useBuilder } from '../store'

export function BuilderCanvas() {
  const { state, dispatch } = useBuilder()
  const { items, selectedId } = state

  return (
    <main className="canvas-area">
      <div className="canvas-toolbar">
        <span className="canvas-label">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          Canvas — {items.length} component{items.length !== 1 ? 's' : ''}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          {items.length > 0 && (
            <button
              className="canvas-action-btn"
              onClick={() => dispatch({ type: 'CLEAR' })}
              title="Clear canvas"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="canvas-scroll">
        {items.length === 0 ? (
          <div className="canvas-empty">
            <div className="canvas-empty-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div className="canvas-empty-title">Canvas is empty</div>
            <div className="canvas-empty-sub">Click any component in the library to add it here</div>
          </div>
        ) : (
          <div className="canvas-items">
            {items.map((item, idx) => {
              const entry = REGISTRY.find(e => e.id === item.componentId)
              if (!entry) return null
              const isSelected = selectedId === item.id

              return (
                <div
                  key={item.id}
                  className={`canvas-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => dispatch({ type: 'SELECT', id: item.id })}
                >
                  {/* Item header */}
                  <div className="canvas-item-header">
                    <div className="canvas-item-meta">
                      <span className="canvas-item-category">{entry.category}</span>
                      <span className="canvas-item-name">{entry.name}</span>
                    </div>
                    <div className="canvas-item-actions">
                      <button
                        className="item-btn"
                        onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE', id: item.id, direction: 'up' }) }}
                        disabled={idx === 0}
                        title="Move up"
                      >↑</button>
                      <button
                        className="item-btn"
                        onClick={e => { e.stopPropagation(); dispatch({ type: 'MOVE', id: item.id, direction: 'down' }) }}
                        disabled={idx === items.length - 1}
                        title="Move down"
                      >↓</button>
                      <button
                        className="item-btn danger"
                        onClick={e => { e.stopPropagation(); dispatch({ type: 'REMOVE', id: item.id }) }}
                        title="Remove"
                      >×</button>
                    </div>
                  </div>

                  {/* Rendered component */}
                  <div className="canvas-item-preview">
                    <ErrorBoundary>
                      {entry.render(item.props)}
                    </ErrorBoundary>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(err: Error) {
    return { error: err.message }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 11 }}>
          Render error: {this.state.error}
        </div>
      )
    }
    return this.props.children
  }
}
