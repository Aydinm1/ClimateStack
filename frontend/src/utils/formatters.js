export function formatTemp(f) {
  return `${Math.round(f)}°F`
}

export function formatVisibility(ft) {
  if (ft >= 5280) return `${(ft / 5280).toFixed(1)} mi`
  return `${Math.round(ft)} ft`
}

export function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}
