import { useState, useEffect } from 'react'
import { Card, Text, Group, Stack } from '@mantine/core'
import { fetchWeather } from '../api'

export default function WeatherPanel() {
  const [weather, setWeather] = useState(null)

  useEffect(() => {
    const load = () => fetchWeather().then(setWeather).catch(() => {})
    load()
    const id = setInterval(load, 60_000)
    return () => clearInterval(id)
  }, [])

  if (!weather || !weather.available) {
    return (
      <Card padding="sm" radius="sm" style={{ background: '#1a1b1e' }}>
        <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
          Live Weather — Davis, CA
        </Text>
        <Text size="xs" c="dimmed">
          Weather data unavailable (no API key or fetch failed)
        </Text>
      </Card>
    )
  }

  const rows = [
    ['Temperature', `${weather.temp_f}°F`],
    ['Feels Like', `${weather.feelslike_f}°F`],
    ['Humidity', `${weather.humidity}%`],
    ['Wind', `${weather.wind_mph} mph`],
    ['Visibility', `${Math.round(weather.vis_ft).toLocaleString()} ft`],
  ]

  return (
    <Card padding="sm" radius="sm" style={{ background: '#1a1b1e' }}>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
        Live Weather — Davis, CA
      </Text>
      <Stack gap={2}>
        {rows.map(([label, value]) => (
          <Group key={label} justify="space-between">
            <Text size="xs" c="dimmed">{label}</Text>
            <Text size="xs" fw={600}>{value}</Text>
          </Group>
        ))}
      </Stack>
    </Card>
  )
}
