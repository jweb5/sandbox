import React from 'react'
import { REGISTRY } from '../registry'
import { useBuilder } from '../store'
import { PropDef } from '../registry'

export function PropertiesPanel() {
  const { state, dispatch } = useBuilder()
  const { items, selectedId, activeTab } = state

  const selected = items.find(i => i.id === selectedId)
  const entry = selected ? REGISTRY.find(e => e.id === selected.componentId) : null

  const allCode = items.map(item => {
    const e = REGISTRY.find(r => r.id === item.componentId)
    return e ? e.code(item.props) : ''
  }).join('\n\n')

  return (
    <aside className="props-panel">
      {/* Tabs */}
      <div className="props-tabs">
        <button
          className={`props-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_TAB', tab: 'properties' })}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          Properties
        </button>
        <button
          className={`props-tab ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => dispatch({ type: 'SET_TAB', tab: 'code' })}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
          </svg>
          Code
        </button>
      </div>

      {activeTab === 'code' ? (
        <CodeView code={allCode} count={items.length} />
      ) : !selected || !entry ? (
        <EmptyState />
      ) : (
        <div className="props-content">
          {/* Header */}
          <div className="props-component-header">
            <div className="props-component-name">{entry.name}</div>
            <div className="props-component-cat">{entry.category}</div>
          </div>

          {/* Props */}
          <div className="props-list">
            {entry.props.map(def => (
              <PropField
                key={def.key}
                def={def}
                value={selected.props[def.key]}
                onChange={val =>
                  dispatch({ type: 'UPDATE_PROPS', id: selected.id, props: { [def.key]: val } })
                }
              />
            ))}
          </div>

          {/* Actions */}
          <div className="props-actions">
            <button
              className="props-delete-btn"
              onClick={() => dispatch({ type: 'REMOVE', id: selected.id })}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Remove Component
            </button>
          </div>

          {/* Code snippet */}
          <div className="props-code-preview">
            <div className="props-code-label">Generated code</div>
            <pre className="props-code-block">{entry.code(selected.props)}</pre>
          </div>
        </div>
      )}
    </aside>
  )
}

function PropField({ def, value, onChange }: { def: PropDef; value: unknown; onChange: (v: unknown) => void }) {
  return (
    <div className="prop-field">
      <label className="prop-label">{def.label}</label>
      {def.type === 'string' && (
        <input
          className="prop-input"
          value={String(value ?? '')}
          onChange={e => onChange(e.target.value)}
        />
      )}
      {def.type === 'number' && (
        <input
          className="prop-input"
          type="number"
          value={String(value ?? 0)}
          onChange={e => onChange(Number(e.target.value))}
        />
      )}
      {def.type === 'boolean' && (
        <label className="prop-toggle">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
          />
          <span className="prop-toggle-track" />
          <span className="prop-toggle-label">{value ? 'Enabled' : 'Disabled'}</span>
        </label>
      )}
      {def.type === 'select' && (
        <select
          className="prop-select"
          value={String(value ?? def.defaultValue)}
          onChange={e => onChange(e.target.value)}
        >
          {def.options?.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      )}
      {def.type === 'range' && (
        <div className="prop-range">
          <input
            type="range"
            className="prop-range-input"
            value={Number(value ?? def.defaultValue)}
            min={def.min}
            max={def.max}
            step={def.step}
            onChange={e => onChange(Number(e.target.value))}
          />
          <span className="prop-range-value">{String(value)}</span>
        </div>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="props-empty">
      <div className="props-empty-icon">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      </div>
      <div className="props-empty-title">No component selected</div>
      <div className="props-empty-sub">Click a component on the canvas to edit its properties</div>
    </div>
  )
}

function CodeView({ code, count }: { code: string; count: number }) {
  const [copied, setCopied] = React.useState(false)

  const fullCode = `import {\n  // import components you use\n} from '@harnessio/ui/components'\n\nexport default function MyPage() {\n  return (\n    <>\n${code.split('\n').map(l => '      ' + l).join('\n')}\n    </>\n  )\n}`

  const handleCopy = () => {
    navigator.clipboard.writeText(fullCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="code-view">
      <div className="code-view-header">
        <span className="code-view-title">
          {count === 0 ? 'No components added yet' : `${count} component${count !== 1 ? 's' : ''}`}
        </span>
        {count > 0 && (
          <button className="copy-btn" onClick={handleCopy}>
            {copied ? (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>Copied!</>
            ) : (
              <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>Copy</>
            )}
          </button>
        )}
      </div>
      <pre className="code-block">{count === 0 ? '// Add components from the\n// library to see code here' : fullCode}</pre>
    </div>
  )
}
