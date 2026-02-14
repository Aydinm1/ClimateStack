import { Button, Card, Text, Group } from '@mantine/core'
import { setScenario } from '../api'

const PRESETS = [
  { id: 'live', label: 'Live Weather', color: 'cyan' },
  { id: 'clear_day', label: 'Clear Day', color: 'green' },
  { id: 'mild_heat', label: 'Mild Heat', color: 'yellow' },
  { id: 'heat_wave', label: 'Heat Wave', color: 'red' },
  { id: 'light_fog', label: 'Light Fog', color: 'gray' },
  { id: 'dense_tule_fog', label: 'Dense Tule Fog', color: 'violet' },
]

export default function ScenarioControls({ activeScenario }) {
  return (
    <Card padding="sm" radius="md" style={{ background: '#1a1b1e' }}>
      <Text fw={600} size="sm" mb="xs">Scenario Presets</Text>
      <Group gap={6}>
        {PRESETS.map((p) => (
          <Button
            key={p.id}
            size="xs"
            color={p.color}
            variant={activeScenario === p.id ? 'filled' : 'outline'}
            onClick={() => setScenario(p.id)}
            style={{ flex: '1 1 auto' }}
          >
            {p.label}
          </Button>
        ))}
      </Group>
    </Card>
  )
}
