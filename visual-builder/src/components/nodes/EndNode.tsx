import React from 'react'

export function EndNode() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        left: 2,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
        border: '2px solid #94a3b8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 0 16px rgba(100,116,139,0.3)',
        userSelect: 'none',
        gap: 2,
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <rect x="4" y="4" width="16" height="16" rx="2" />
      </svg>
      END
    </div>
  )
}
