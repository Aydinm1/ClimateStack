import { useState, useEffect } from 'react'

export default function AlertBanner({ alerts }) {
  const [visible, setVisible] = useState(true)

  const emergencies = (alerts || []).filter(
    (a) => a.active && (a.severity === 'emergency' || a.severity === 'warning')
  )

  useEffect(() => {
    if (emergencies.length === 0) return
    const interval = setInterval(() => setVisible((v) => !v), 800)
    return () => clearInterval(interval)
  }, [emergencies.length])

  if (emergencies.length === 0) return null

  const worst = emergencies[0]

  return (
    <div
      style={{
        width: '100%',
        padding: '10px 20px',
        background: visible
          ? worst.severity === 'emergency'
            ? '#dc2626'
            : '#ea580c'
          : worst.severity === 'emergency'
            ? '#991b1b'
            : '#9a3412',
        color: 'white',
        fontWeight: 700,
        fontSize: 14,
        textAlign: 'center',
        transition: 'background 0.3s',
        zIndex: 100,
      }}
    >
      {worst.message} {emergencies.length > 1 ? `(+${emergencies.length - 1} more intersections)` : ''}
    </div>
  )
}
