import React from 'react'
import { StepType, STEP_TYPE_COLORS, STEP_TYPE_LABELS } from '../pipeline/types'

interface SidebarProps {
  onAddStep: (stepType: StepType) => void
  onAddStage: () => void
  onAddParallelGroup: () => void
  hasSelectedStage: boolean
}

const STEP_DESCRIPTIONS: Record<StepType, string> = {
  clone: 'Checkout source code',
  build: 'Compile & bundle',
  test: 'Run test suites',
  deploy: 'Deploy to environment',
  script: 'Run shell commands',
  approval: 'Manual gate approval',
}

const STEP_ICONS: Record<StepType, React.ReactNode> = {
  clone: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866" />
      <path d="M18 21H10c-1.105 0-2-.911-2-2.036V10.036C8 8.91 8.895 8 10 8h8c1.105 0 2 .911 2 2.036v8.927C20 20.09 19.105 21 18 21z" />
    </svg>
  ),
  build: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  test: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 1-2-2V9m6 5h10a2 2 0 0 0 2-2V9" />
    </svg>
  ),
  deploy: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13" /><path d="M22 2L15 22 11 13 2 9l20-7z" />
    </svg>
  ),
  script: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  approval: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
}

const STEP_TYPES: StepType[] = ['clone', 'build', 'test', 'deploy', 'script', 'approval']

export function Sidebar({ onAddStep, onAddStage, onAddParallelGroup, hasSelectedStage }: SidebarProps) {
  return (
    <aside
      style={{
        width: 220,
        flexShrink: 0,
        background: 'rgba(10,13,22,0.95)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Structure section */}
      <div style={{ padding: '16px 14px 12px' }}>
        <div style={sectionLabel}>Structure</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <button onClick={onAddStage} style={structureBtn('#6366f1')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Stage
          </button>
          <button onClick={onAddParallelGroup} style={structureBtn('#f59e0b')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Add Parallel Group
          </button>
        </div>
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 14px' }} />

      {/* Steps section */}
      <div style={{ padding: '12px 14px', flex: 1, overflowY: 'auto' }}>
        <div style={sectionLabel}>Step Types</div>
        {!hasSelectedStage && (
          <div
            style={{
              marginTop: 8,
              padding: '8px 10px',
              borderRadius: 7,
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.2)',
              fontSize: 10,
              color: 'rgba(245,158,11,0.8)',
              fontFamily: 'Inter, sans-serif',
              lineHeight: 1.4,
            }}
          >
            Select a stage in the canvas to add steps
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
          {STEP_TYPES.map(type => {
            const color = STEP_TYPE_COLORS[type]
            return (
              <button
                key={type}
                onClick={() => onAddStep(type)}
                disabled={!hasSelectedStage}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.02)',
                  border: `1px solid rgba(255,255,255,0.06)`,
                  color: hasSelectedStage ? '#cbd5e1' : 'rgba(100,116,139,0.4)',
                  cursor: hasSelectedStage ? 'pointer' : 'not-allowed',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  opacity: hasSelectedStage ? 1 : 0.5,
                }}
                title={hasSelectedStage ? `Add ${STEP_TYPE_LABELS[type]} step` : 'Select a stage first'}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: `${color}18`,
                    border: `1px solid ${color}35`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    flexShrink: 0,
                  }}
                >
                  {STEP_ICONS[type]}
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, fontFamily: 'Inter, sans-serif' }}>
                    {STEP_TYPE_LABELS[type]}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(100,116,139,0.8)', fontFamily: 'Inter, sans-serif' }}>
                    {STEP_DESCRIPTIONS[type]}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}

const sectionLabel: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  color: 'rgba(100,116,139,0.7)',
  fontFamily: 'Inter, sans-serif',
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
}

function structureBtn(color: string): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 12px',
    borderRadius: 8,
    background: `${color}12`,
    border: `1px solid ${color}30`,
    color: color,
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 600,
    fontFamily: 'Inter, sans-serif',
    transition: 'all 0.15s',
  }
}
