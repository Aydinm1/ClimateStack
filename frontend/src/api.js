const BASE = ''

export async function fetchSensors() {
  const res = await fetch(`${BASE}/api/sensors`)
  return res.json()
}

export async function fetchRiskMap() {
  const res = await fetch(`${BASE}/api/risk-map`)
  return res.json()
}

export async function fetchTopRisk(limit = 5) {
  const res = await fetch(`${BASE}/api/top-risk?limit=${limit}`)
  return res.json()
}

export async function fetchAlerts() {
  const res = await fetch(`${BASE}/api/alerts`)
  return res.json()
}

export async function fetchSorcerer() {
  const res = await fetch(`${BASE}/api/sorcerer`)
  return res.json()
}

export async function fetchWeather() {
  const res = await fetch(`${BASE}/api/weather`)
  return res.json()
}

export async function setScenario(preset) {
  const res = await fetch(`${BASE}/api/scenario/${preset}`, { method: 'POST' })
  return res.json()
}
