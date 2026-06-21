import React from 'react'
import type { LeafNodeInternalType } from '@harnessio/pipeline-graph'
import { STEP_TYPE_COLORS, STEP_TYPE_LABELS, StepType } from '../../pipeline/types'

interface StepNodeData {
  id: string
  name: string
  stepType: StepType
  description?: string
  selected: boolean
  onSelect: (id: string) => void
}

const STEP_ICONS: Record<StepType, React.ReactNode> = {
  clone: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M8 17.929H6c-1.105 0-2-.912-2-2.036V5.036C4 3.91 4.895 3 6 3h8c1.105 0 2 .911 2 2.036v1.866" />
      <path d="M18 21H10c-1.105 0-2-.911-2-2.036V10.036C8 8.91 8.895 8 10 8h8c1.105 0 2 .911 2 2.036v8.927C20 20.09 19.105 21 18 21z" />
    </svg>
  ),
  build: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  test: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v11m0 0H5a2 2 0 0 1-2-2V9m6 5h10a2 2 0 0 0 2-2V9m-6 5v3m0 0H9m6 0h2" />
    </svg>
  ),
  deploy: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13" />
      <path d="M22 2L15 22 11 13 2 9l20-7z" />
    </svg>
  ),
  script: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  approval: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M9 11l3 3L22 4" />
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
    </svg>
  ),
}

export function StepNode({ node }: { node: LeafNodeInternalType<StepNodeData> }) {
  const { data } = node
  const color = STEP_TYPE_COLORS[data.stepType] ?? '#6b7280'
  const label = STEP_TYPE_LABELS[data.stepType] ?? data.stepType
  const icon = STEP_ICONS[data.stepType]

  return (
    <div
      onClick={() => data.onSelect(data.id)}
      style={{
        position: 'absolute',
        top: 30,
        left: 0,
        width: 150,
        height: 100,
        borderRadius: 10,
        background: data.selected
          ? 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)'
          : 'linear-gradient(135deg, rgba(30,35,50,0.9) 0%, rgba(20,25,40,0.95) 100%)',
        border: data.selected ? `2px solid ${color}` : '1px solid rgba(255,255,255,0.08)',
        boxShadow: data.selected
          ? `0 0 0 1px ${color}40, 0 4px 20px rgba(0,0,0,0.4)`
          : '0 2px 12px rgba(0,0,0,0.3)',
        display: 'flex',
        flexDirection: 'column',
        padding: '10px 12px',
        gap: 6,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        boxSizing: 'border-box',
        overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            background: `${color}20`,
            border: `1px solid ${color}40`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#e2e8f0',
              fontFamily: 'Inter, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {data.name}
          </div>
          <div
            style={{
              fontSize: 9,
              fontWeight: 500,
              color: color,
              fontFamily: 'Inter, sans-serif',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
            }}
          >
            {label}
          </div>
        </div>
      </div>
      {data.description && (
        <div
          style={{
            fontSize: 10,
            color: 'rgba(148,163,184,0.7)',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}
        >
          {data.description}
        </div>
      )}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          borderRadius: '10px 10px 0 0',
          background: color,
          opacity: data.selected ? 1 : 0.5,
        }}
      />
    </div>
  )
}
