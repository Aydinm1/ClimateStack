import { Card, Text, Stack, Badge, Group, Button } from '@mantine/core'
import { formatTime } from '../utils/formatters'

const severityColor = {
  advisory: 'yellow',
  warning: 'orange',
  emergency: 'red',
}

export default function AlertPanel({ alerts, onClear, clearing }) {
  if (!alerts || alerts.length === 0) {
    return (
      <Card padding="sm" radius="md" style={{ background: '#1a1b1e' }}>
        <Group justify="space-between" align="center">
          <Text size="sm" c="dimmed">No alerts</Text>
          {onClear ? (
            <Button size="compact-xs" variant="light" color="gray" disabled>
              Clear
            </Button>
          ) : null}
        </Group>
      </Card>
    )
  }

  return (
    <Card padding="sm" radius="md" style={{ background: '#1a1b1e', maxHeight: 250, overflowY: 'auto' }}>
      <Group justify="space-between" mb="xs">
        <Text fw={600} size="sm">Alerts</Text>
        {onClear ? (
          <Button
            size="compact-xs"
            variant="light"
            color="red"
            onClick={onClear}
            loading={clearing}
          >
            Clear
          </Button>
        ) : null}
      </Group>
      <Stack gap={6}>
        {alerts.map((a) => (
          <div
            key={a.id}
            style={{
              padding: '6px 8px',
              borderRadius: 6,
              background: a.active ? '#2d1b1b' : '#1e1e1e',
              borderLeft: `3px solid ${a.active ? (severityColor[a.severity] === 'red' ? '#ef4444' : severityColor[a.severity] === 'orange' ? '#f97316' : '#eab308') : '#4b5563'}`,
              opacity: a.active ? 1 : 0.6,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6 }}>
              <Badge size="xs" color={severityColor[a.severity]} variant="filled">
                {a.severity}
              </Badge>
              <Text size="xs" c="dimmed">{formatTime(a.timestamp)}</Text>
            </div>
            <Text size="xs" mt={2}>{a.message}</Text>
          </div>
        ))}
      </Stack>
    </Card>
  )
}
