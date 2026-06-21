import React from 'react'
import type { SerialNodeInternalType } from '@harnessio/pipeline-graph'

interface StageNodeData {
  id: string
  name: string
  selected: boolean
  onSelect: (id: string) => void
}

export function StageNode({
  node,
  children,
  collapsed = false,
  setCollapsed,
}: {
  node: SerialNodeInternalType<StageNodeData>
  children: React.ReactElement
  collapsed?: boolean
  setCollapsed?: (c: boolean) => void
}) {
  const { data } = node
  const stepCount = node.children.length

  return (
    <div
      style={{
        boxSizing: 'border-box',
        borderRadius: 12,
        border: data.selected
          ? '1.5px solid rgba(99,102,241,0.7)'
          : '1px solid rgba(255,255,255,0.06)',
        background: data.selected
          ? 'rgba(99,102,241,0.05)'
          : 'rgba(15,18,30,0.7)',
        backdropFilter: 'blur(8px)',
        boxShadow: data.selected
          ? '0 0 0 3px rgba(99,102,241,0.15), 0 8px 32px rgba(0,0,0,0.4)'
          : '0 4px 24px rgba(0,0,0,0.3)',
        minWidth: 180,
      }}
    >
      {/* Stage header */}
      <div
        onClick={() => data.onSelect(data.id)}
        style={{
          height: 150,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 16px 16px',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 3,
            borderRadius: '12px 12px 0 0',
            background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
            opacity: data.selected ? 1 : 0.4,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: '#e2e8f0',
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.02em',
              }}
            >
              {data.name}
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(148,163,184,0.6)',
                fontFamily: 'Inter, sans-serif',
                marginTop: 2,
              }}
            >
              {stepCount} step{stepCount !== 1 ? 's' : ''}
            </div>
          </div>
          <button
            onClick={e => {
              e.stopPropagation()
              setCollapsed?.(!collapsed)
            }}
            style={{
              width: 22,
              height: 22,
              borderRadius: 5,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(148,163,184,0.8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 10,
              flexShrink: 0,
              padding: 0,
            }}
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '▶' : '▼'}
          </button>
        </div>
      </div>

      {/* Steps area */}
      <div style={{ padding: '0 16px 16px' }}>{children}</div>
    </div>
  )
}
