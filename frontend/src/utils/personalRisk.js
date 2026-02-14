export const DEFAULT_CHAT_MESSAGE =
  'Answer the yes/no profile questions and I will generate personalized heat and fog route guidance.'

export const QUESTION_SET = [
  {
    id: 'dehydrate_fast',
    prompt: 'Do you dehydrate quickly or use medication that increases dehydration risk?',
    heatWeight: 28,
    fogWeight: 0,
    reason: 'you reported dehydration sensitivity',
  },
  {
    id: 'heat_medical',
    prompt: 'Do you have a heart, kidney, or respiratory condition that can worsen in heat?',
    heatWeight: 24,
    fogWeight: 6,
    reason: 'your medical profile increases heat strain',
  },
  {
    id: 'outdoor_duration',
    prompt: 'Will you be outside for more than 20 minutes this trip?',
    heatWeight: 14,
    fogWeight: 8,
    reason: 'your exposure time is longer than average',
  },
  {
    id: 'night_vision',
    prompt: 'Do low-light conditions make driving or walking harder for you?',
    heatWeight: 0,
    fogWeight: 26,
    reason: 'you flagged reduced low-visibility tolerance',
  },
  {
    id: 'lens_fogging',
    prompt: 'Do your glasses/helmet visor fog up easily?',
    heatWeight: 0,
    fogWeight: 22,
    reason: 'you are prone to visual obstruction in fog',
  },
  {
    id: 'bike_or_walk',
    prompt: 'Are you biking or walking near vehicle traffic today?',
    heatWeight: 5,
    fogWeight: 14,
    reason: 'you are in a higher exposure mobility mode',
  },
]

export function createDefaultAnswers() {
  return QUESTION_SET.reduce((acc, q) => ({ ...acc, [q.id]: null }), {})
}

export function normalizeAnswers(raw) {
  const defaults = createDefaultAnswers()
  if (!raw || typeof raw !== 'object') return defaults

  const normalized = { ...defaults }
  for (const q of QUESTION_SET) {
    if (raw[q.id] === true || raw[q.id] === false || raw[q.id] === null) {
      normalized[q.id] = raw[q.id]
    }
  }
  return normalized
}

export function classifyRisk(score) {
  if (score >= 75) return { label: 'EXTREME', color: 'red' }
  if (score >= 55) return { label: 'HIGH', color: 'orange' }
  if (score >= 35) return { label: 'MODERATE', color: 'yellow' }
  return { label: 'LOW', color: 'green' }
}

export function computeProfile(answers, risks) {
  const unanswered = QUESTION_SET.some((q) => answers[q.id] === null)
  const reasons = []
  let heatBase = 10
  let fogBase = 10

  for (const q of QUESTION_SET) {
    if (answers[q.id]) {
      heatBase += q.heatWeight
      fogBase += q.fogWeight
      reasons.push(q.reason)
    }
  }

  const maxHeat = risks.length ? Math.max(...risks.map((r) => r.heat_risk)) : 0
  const maxFog = risks.length ? Math.max(...risks.map((r) => r.fog_risk)) : 0

  const personalHeat = Math.min(100, Math.round(heatBase))
  const personalFog = Math.min(100, Math.round(fogBase))
  const heatScore = Math.min(100, Math.round(personalHeat * 0.65 + maxHeat * 0.35))
  const fogScore = Math.min(100, Math.round(personalFog * 0.65 + maxFog * 0.35))

  return {
    unanswered,
    reasons,
    personalHeat,
    personalFog,
    heatScore,
    fogScore,
  }
}

export function pickRouteAdvice(risks, hazardKey) {
  if (!risks.length) return null

  const sorted = [...risks].sort((a, b) => b[hazardKey] - a[hazardKey])
  const avoid = sorted[0]

  const sameZoneAlt = [...risks]
    .filter((r) => r.node_id !== avoid.node_id && r.zone === avoid.zone)
    .sort((a, b) => a.combined_risk - b.combined_risk)[0]

  const fallbackAlt = [...risks]
    .filter((r) => r.node_id !== avoid.node_id)
    .sort((a, b) => a.combined_risk - b.combined_risk)[0]

  return { avoid, alternate: sameZoneAlt || fallbackAlt }
}

export function buildInitialInsights(profile, risks) {
  if (profile.unanswered) {
    return []
  }

  const dominantHazard = profile.heatScore >= profile.fogScore ? 'heat_risk' : 'fog_risk'
  const advice = pickRouteAdvice(risks, dominantHazard)
  const dominantLabel = dominantHazard === 'heat_risk' ? 'heat' : 'fog'
  const dominantScore = dominantHazard === 'heat_risk' ? profile.heatScore : profile.fogScore
  const profileReason = profile.reasons[0] || 'your self-reported sensitivity'

  const messages = [
    {
      role: 'assistant',
      text: `Profile complete. Your current personal risk is ${classifyRisk(profile.heatScore).label} for heat (${profile.heatScore}/100) and ${classifyRisk(profile.fogScore).label} for fog (${profile.fogScore}/100).`,
    },
  ]

  if (advice?.avoid && advice?.alternate) {
    messages.push({
      role: 'assistant',
      text: `Avoid ${advice.avoid.name} right now. ${dominantLabel === 'heat' ? `Heat risk is ${Math.round(advice.avoid.heat_risk)}` : `Fog risk is ${Math.round(advice.avoid.fog_risk)}`}, and ${profileReason}. Prefer ${advice.alternate.name} instead (combined risk ${Math.round(advice.alternate.combined_risk)}).`,
    })
  }

  messages.push({
    role: 'assistant',
    text: dominantLabel === 'heat'
      ? `Heat is your dominant concern at ${dominantScore}/100. Bring water and shorten direct sun exposure windows.`
      : `Fog is your dominant concern at ${dominantScore}/100. Favor routes with better sightlines and avoid sudden crossings.`,
  })

  return messages
}

export function generateAssistantReply(prompt, profile, risks) {
  const input = prompt.toLowerCase()
  const heatHotspots = [...risks].sort((a, b) => b.heat_risk - a.heat_risk).slice(0, 2)
  const fogHotspots = [...risks].sort((a, b) => b.fog_risk - a.fog_risk).slice(0, 2)
  const dominantHazard = profile.heatScore >= profile.fogScore ? 'heat_risk' : 'fog_risk'
  const advice = pickRouteAdvice(risks, dominantHazard)

  if (input.includes('route') || input.includes('intersection') || input.includes('avoid')) {
    if (!advice?.avoid || !advice?.alternate) {
      return 'I do not have enough live risk data to suggest a safer route yet.'
    }
    const hazardValue = dominantHazard === 'heat_risk'
      ? Math.round(advice.avoid.heat_risk)
      : Math.round(advice.avoid.fog_risk)
    return `Ignore ${advice.avoid.name} for now (${dominantHazard === 'heat_risk' ? 'heat' : 'fog'} risk ${hazardValue}) and route via ${advice.alternate.name} instead. This better matches your profile.`
  }

  if (input.includes('heat') || input.includes('dehydrat') || input.includes('water')) {
    if (!heatHotspots.length) return 'Heat risk data is still loading.'
    return `Your heat risk profile is ${classifyRisk(profile.heatScore).label}. Stay cautious near ${heatHotspots[0].name}${heatHotspots[1] ? ` and ${heatHotspots[1].name}` : ''}, where conditions are hottest right now.`
  }

  if (input.includes('fog') || input.includes('visibility')) {
    if (!fogHotspots.length) return 'Fog risk data is still loading.'
    return `Your fog risk profile is ${classifyRisk(profile.fogScore).label}. Avoid low-visibility areas around ${fogHotspots[0].name}${fogHotspots[1] ? ` and ${fogHotspots[1].name}` : ''} until conditions improve.`
  }

  return `Current profile summary: heat ${profile.heatScore}/100, fog ${profile.fogScore}/100. Ask me for route, heat, or fog guidance and I will tailor it to your answers.`
}
