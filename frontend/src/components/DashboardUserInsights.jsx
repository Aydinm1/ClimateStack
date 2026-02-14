import { Card, Text, Group, Badge, Button, Stack } from '@mantine/core'
import { classifyRisk, pickRouteAdvice, DEFAULT_CHAT_MESSAGE } from '../utils/personalRisk'

export default function DashboardUserInsights({
  profile,
  risks,
  messages,
  onOpenUser,
  onGenerateInsights,
}) {
  const heatClass = classifyRisk(profile.heatScore)
  const fogClass = classifyRisk(profile.fogScore)
  const dominantHazard = profile.heatScore >= profile.fogScore ? 'heat_risk' : 'fog_risk'
  const dominantLabel = dominantHazard === 'heat_risk' ? 'heat' : 'fog'
  const advice = pickRouteAdvice(risks || [], dominantHazard)
  const latestAssistantInsight = [...(messages || [])]
    .reverse()
    .find((m) => m.role === 'assistant' && m.text !== DEFAULT_CHAT_MESSAGE)

  if (profile.unanswered) {
    return (
      <Card padding="sm" radius="md" style={{ background: '#1a1b1e' }}>
        <Group justify="space-between" mb={6}>
          <Text fw={600} size="sm">Personalized Insights</Text>
          <Badge variant="outline" color="gray">Profile needed</Badge>
        </Group>
        <Text size="xs" c="dimmed" mb={10}>
          Complete your yes/no profile in User Insights to persist personalized heat and fog guidance here.
        </Text>
        <Button size="xs" color="teal" variant="light" onClick={onOpenUser}>
          Open User Insights
        </Button>
      </Card>
    )
  }

  return (
    <Card padding="sm" radius="md" style={{ background: '#1a1b1e' }}>
      <Group justify="space-between" mb={6}>
        <Text fw={600} size="sm">Personalized Insights</Text>
        <Badge variant="light" color="teal">Live</Badge>
      </Group>

      <Group gap={6} mb={8}>
        <Badge color={heatClass.color}>Heat {profile.heatScore}</Badge>
        <Badge color={fogClass.color}>Fog {profile.fogScore}</Badge>
      </Group>

      <Stack gap={4} mb={10}>
        {advice?.avoid && advice?.alternate ? (
          <>
            <Text size="xs">
              Avoid <strong>{advice.avoid.name}</strong> now due to elevated {dominantLabel}.
            </Text>
            <Text size="xs" c="dimmed">
              Safer route right now: <strong>{advice.alternate.name}</strong>.
            </Text>
          </>
        ) : (
          <Text size="xs" c="dimmed">
            Waiting for live risk data to compute route-level recommendations.
          </Text>
        )}
      </Stack>

      {latestAssistantInsight ? (
        <div
          style={{
            background: '#25262b',
            borderRadius: 6,
            padding: '8px 10px',
            marginBottom: 10,
          }}
        >
          <Text size="xs" c="dimmed" mb={2}>Latest generated insight</Text>
          <Text size="xs">{latestAssistantInsight.text}</Text>
        </div>
      ) : null}

      <Group grow>
        <Button size="xs" color="teal" variant="filled" onClick={onGenerateInsights}>
          Generate Insights
        </Button>
        <Button size="xs" color="teal" variant="light" onClick={onOpenUser}>
          Edit Profile
        </Button>
      </Group>
    </Card>
  )
}
