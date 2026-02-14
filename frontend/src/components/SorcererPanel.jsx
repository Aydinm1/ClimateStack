import { Card, Text, Progress, Stack } from '@mantine/core'

export default function SorcererPanel({ atmospheric }) {
  if (!atmospheric) return null

  return (
    <Card padding="sm" radius="md" style={{ background: '#1a1b1e' }}>
      <Text fw={600} size="sm" mb="xs">Sorcerer Atmospheric</Text>
      <Stack gap={8}>
        <div>
          <Text size="xs" c="dimmed">Wind</Text>
          <Text size="sm">{atmospheric.wind_speed_mph} mph {atmospheric.wind_direction}</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">Boundary Layer</Text>
          <Text size="sm">{Math.round(atmospheric.boundary_layer_height_m)}m</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">Fog Probability</Text>
          <Progress
            value={atmospheric.fog_probability * 100}
            color={atmospheric.fog_probability > 0.7 ? 'red' : atmospheric.fog_probability > 0.4 ? 'yellow' : 'green'}
            size="lg"
            mt={4}
          />
          <Text size="xs" ta="right">{(atmospheric.fog_probability * 100).toFixed(1)}%</Text>
        </div>
        <div>
          <Text size="xs" c="dimmed">Dew Point Depression</Text>
          <Text size="sm">{atmospheric.dew_point_depression_f}°F</Text>
        </div>
      </Stack>
    </Card>
  )
}
