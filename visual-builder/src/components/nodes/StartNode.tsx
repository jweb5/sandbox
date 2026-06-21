import React from 'react'

export function StartNode() {
  return (
    <div
      style={{
        position: 'absolute',
        top: 50,
        left: 2,
        width: 60,
        height: 60,
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        border: '2px solid #4ade80',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: '0.08em',
        fontFamily: 'Inter, sans-serif',
        boxShadow: '0 0 20px rgba(34,197,94,0.35)',
        userSelect: 'none',
        gap: 2,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5,3 19,12 5,21" />
      </svg>
      START
    </div>
  )
}
