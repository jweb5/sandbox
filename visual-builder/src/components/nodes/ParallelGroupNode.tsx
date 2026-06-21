import React from 'react'
import type { ParallelNodeInternalType } from '@harnessio/pipeline-graph'

interface ParallelGroupData {
  id: string
  name: string
  selected: boolean
  onSelect: (id: string) => void
}

export function ParallelGroupNode({
  node,
  children,
  collapsed = false,
  setCollapsed,
}: {
  node: ParallelNodeInternalType<ParallelGroupData>
  children: React.ReactElement
  collapsed?: boolean
  setCollapsed?: (c: boolean) => void
}) {
  const { data } = node
  const stageCount = node.children.length

  return (
    <div
      style={{
        boxSizing: 'border-box',
        borderRadius: 12,
        border: data.selected
          ? '1.5px solid rgba(245,158,11,0.7)'
          : '1px dashed rgba(245,158,11,0.25)',
        background: 'rgba(245,158,11,0.03)',
        backdropFilter: 'blur(8px)',
        boxShadow: data.selected
          ? '0 0 0 3px rgba(245,158,11,0.15)'
          : '0 4px 20px rgba(0,0,0,0.3)',
      }}
    >
      {/* Header */}
      <div
        onClick={() => data.onSelect(data.id)}
        style={{
          height: 100,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: '0 16px 12px',
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
            background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
            opacity: data.selected ? 1 : 0.3,
          }}
        />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#fbbf24',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                {data.name}
              </div>
            </div>
            <div
              style={{
                fontSize: 10,
                color: 'rgba(148,163,184,0.5)',
                fontFamily: 'Inter, sans-serif',
                marginTop: 2,
              }}
            >
              {stageCount} parallel stage{stageCount !== 1 ? 's' : ''}
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
              background: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.2)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              fontSize: 10,
              padding: 0,
            }}
          >
            {collapsed ? '▶' : '▼'}
          </button>
        </div>
      </div>
      <div style={{ padding: '0 16px 16px' }}>{children}</div>
    </div>
  )
}
