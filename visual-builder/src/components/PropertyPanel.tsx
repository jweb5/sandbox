import React, { useEffect, useState } from 'react'
import { SelectedNode, StepType, STEP_TYPE_COLORS, STEP_TYPE_LABELS } from '../pipeline/types'
import { PipelineStep, PipelineStage } from '../pipeline/types'

interface PropertyPanelProps {
  selected: SelectedNode
  onDeleteSelected: () => void
  onUpdateStep: (stepId: string, updates: Partial<PipelineStep>) => void
  onUpdateStage: (stageId: string, updates: Partial<PipelineStage>) => void
}

const STEP_TYPES: StepType[] = ['clone', 'build', 'test', 'deploy', 'script', 'approval']

export function PropertyPanel({ selected, onDeleteSelected, onUpdateStep, onUpdateStage }: PropertyPanelProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [stepType, setStepType] = useState<StepType>('script')
  const [commands, setCommands] = useState('')

  useEffect(() => {
    if (!selected) return
    if (selected.kind === 'step') {
      setName(selected.node.name)
      setDescription(selected.node.description ?? '')
      setStepType(selected.node.stepType)
      setCommands((selected.node.commands ?? []).join('\n'))
    } else if (selected.kind === 'stage') {
      setName(selected.node.name)
    } else if (selected.kind === 'parallel') {
      setName(selected.node.name)
    }
  }, [selected])

  const handleSave = () => {
    if (!selected) return
    if (selected.kind === 'step') {
      onUpdateStep(selected.node.id, {
        name,
        description,
        stepType,
        commands: commands.split('\n').filter(Boolean),
      })
    } else if (selected.kind === 'stage') {
      onUpdateStage(selected.node.id, { name })
    }
  }

  return (
    <aside
      style={{
        width: 260,
        flexShrink: 0,
        background: 'rgba(10,13,22,0.95)',
        borderLeft: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#e2e8f0',
            fontFamily: 'Inter, sans-serif',
            letterSpacing: '0.02em',
          }}
        >
          Properties
        </span>
      </div>

      {!selected ? (
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              background: 'rgba(99,102,241,0.08)',
              border: '1px solid rgba(99,102,241,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="1.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
            </svg>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'rgba(100,116,139,0.6)',
              fontFamily: 'Inter, sans-serif',
              textAlign: 'center',
              lineHeight: 1.6,
            }}
          >
            Click on any node in the canvas to view and edit its properties
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {/* Node type badge */}
          <div style={{ marginBottom: 16 }}>
            <NodeTypeBadge selected={selected} />
          </div>

          {/* Name field */}
          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              placeholder="Enter name..."
            />
          </div>

          {/* Step-specific fields */}
          {selected.kind === 'step' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Type</label>
                <select
                  value={stepType}
                  onChange={e => setStepType(e.target.value as StepType)}
                  style={{ ...inputStyle, cursor: 'pointer' }}
                >
                  {STEP_TYPES.map(t => (
                    <option key={t} value={t}>
                      {STEP_TYPE_LABELS[t]}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label style={labelStyle}>Description</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  style={inputStyle}
                  placeholder="Brief description..."
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={labelStyle}>Commands (one per line)</label>
                <textarea
                  value={commands}
                  onChange={e => setCommands(e.target.value)}
                  style={{
                    ...inputStyle,
                    height: 80,
                    resize: 'vertical',
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                  }}
                  placeholder="npm run build&#10;echo Done"
                />
              </div>
            </>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button onClick={handleSave} style={saveBtn}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              Save Changes
            </button>
            <button onClick={onDeleteSelected} style={deleteBtn}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Delete {selected.kind === 'step' ? 'Step' : selected.kind === 'stage' ? 'Stage' : 'Group'}
            </button>
          </div>

          {/* Metadata */}
          <div
            style={{
              marginTop: 16,
              padding: '10px 12px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <div style={{ fontSize: 10, color: 'rgba(100,116,139,0.5)', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
              Node ID
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(148,163,184,0.6)',
                fontFamily: 'JetBrains Mono, monospace',
                wordBreak: 'break-all',
              }}
            >
              {selected.node.id}
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

function NodeTypeBadge({ selected }: { selected: NonNullable<SelectedNode> }) {
  if (selected.kind === 'step') {
    const color = STEP_TYPE_COLORS[selected.node.stepType]
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 20,
          background: `${color}15`,
          border: `1px solid ${color}35`,
          fontSize: 10,
          fontWeight: 700,
          color: color,
          fontFamily: 'Inter, sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
        }}
      >
        Step · {STEP_TYPE_LABELS[selected.node.stepType]}
      </div>
    )
  }
  if (selected.kind === 'parallel') {
    return (
      <div style={{ ...badgeStyle, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>
        Parallel Group
      </div>
    )
  }
  return (
    <div style={{ ...badgeStyle, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>
      Stage
    </div>
  )
}

const badgeStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 10,
  fontWeight: 700,
  fontFamily: 'Inter, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  fontWeight: 600,
  color: 'rgba(100,116,139,0.8)',
  fontFamily: 'Inter, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 5,
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '7px 10px',
  borderRadius: 7,
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.09)',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const saveBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '8px 14px',
  borderRadius: 8,
  background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  border: 'none',
  color: '#fff',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
  transition: 'opacity 0.15s',
}

const deleteBtn: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 7,
  padding: '8px 14px',
  borderRadius: 8,
  background: 'rgba(239,68,68,0.08)',
  border: '1px solid rgba(239,68,68,0.25)',
  color: '#f87171',
  fontSize: 12,
  fontWeight: 600,
  fontFamily: 'Inter, sans-serif',
  cursor: 'pointer',
  transition: 'all 0.15s',
}
