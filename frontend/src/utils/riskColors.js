export const RISK_COLORS = {
  LOW: '#22c55e',
  MODERATE: '#eab308',
  HIGH: '#f97316',
  EXTREME: '#ef4444',
}

export function riskColor(level) {
  return RISK_COLORS[level] || '#6b7280'
}

export function riskScoreToColor(score) {
  if (score < 25) return RISK_COLORS.LOW
  if (score < 50) return RISK_COLORS.MODERATE
  if (score < 75) return RISK_COLORS.HIGH
  return RISK_COLORS.EXTREME
}

/**
 * Continuous gradient: every score 0-100 gets a unique color.
 *  0-25:  green → yellow
 * 25-50:  yellow → orange
 * 50-75:  orange → red
 * 75-100: red → dark red
 */
export function riskScoreToGradient(score) {
  const stops = [
    { at: 0,   r: 0x22, g: 0xc5, b: 0x5e }, // green  #22c55e
    { at: 25,  r: 0xea, g: 0xb3, b: 0x08 }, // yellow #eab308
    { at: 50,  r: 0xf9, g: 0x73, b: 0x16 }, // orange #f97316
    { at: 75,  r: 0xef, g: 0x44, b: 0x44 }, // red    #ef4444
    { at: 100, r: 0x99, g: 0x1b, b: 0x1b }, // dark   #991b1b
  ]

  const s = Math.max(0, Math.min(100, score))

  // Find the two stops we sit between
  let lo = stops[0], hi = stops[stops.length - 1]
  for (let i = 0; i < stops.length - 1; i++) {
    if (s >= stops[i].at && s <= stops[i + 1].at) {
      lo = stops[i]
      hi = stops[i + 1]
      break
    }
  }

  const t = hi.at === lo.at ? 0 : (s - lo.at) / (hi.at - lo.at)
  const r = Math.round(lo.r + (hi.r - lo.r) * t)
  const g = Math.round(lo.g + (hi.g - lo.g) * t)
  const b = Math.round(lo.b + (hi.b - lo.b) * t)

  return `rgb(${r}, ${g}, ${b})`
}
