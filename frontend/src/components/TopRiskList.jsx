import { Card, Text, Stack } from '@mantine/core'
import RiskBadge from './RiskBadge'
import { formatTemp, formatVisibility } from '../utils/formatters'

export default function TopRiskList({ risks }) {
  if (!risks || risks.length === 0) return null

  const sorted = [...risks]
    .sort((a, b) => b.combined_risk - a.combined_risk)
    .slice(0, 5)

  return (
    <Card padding="sm" radius="md" style={{ background: '#1a1b1e', maxHeight: 250, overflowY: 'auto' }}>
      <Text fw={600} size="sm" mb="xs">Top Risk Intersections</Text>
      <Stack gap={6}>
        {sorted.map((r, i) => (
          <div
            key={r.node_id}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 8px',
              borderRadius: 6,
              background: '#25262b',
            }}
          >
            <div>
              <Text size="xs" fw={500}>
                {i + 1}. {r.name}
              </Text>
              <Text size="xs" c="dimmed">
                {formatTemp(r.temp_f)} · {formatVisibility(r.visibility_ft)}
              </Text>
            </div>
            <RiskBadge level={r.risk_level} score={r.combined_risk} />
          </div>
        ))}
      </Stack>
    </Card>
  )
}
