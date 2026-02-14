import { useState } from 'react'
import {
  Card,
  Stack,
  Text,
  Group,
  Badge,
  Progress,
  Button,
  TextInput,
  ScrollArea,
  Divider,
} from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import {
  QUESTION_SET,
  classifyRisk,
  buildInitialInsights,
  generateAssistantReply,
} from '../utils/personalRisk'

const cardStyle = {
  background: '#1a1b1e',
  border: '1px solid #2d2d2d',
}

const chatWindowStyle = {
  background: '#141517',
  border: '1px solid #2d2d2d',
  borderRadius: 10,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
}

function MessageBubble({ role, text }) {
  const isUser = role === 'user'
  return (
    <div
      style={{
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        borderRadius: 10,
        padding: '8px 10px',
        background: isUser ? '#1971c2' : '#25262b',
        color: isUser ? '#fff' : '#d9d9d9',
      }}
    >
      <Text size="sm">{text}</Text>
    </div>
  )
}

export default function UserPage({
  risks,
  sensors,
  connected,
  tick,
  scenario,
  answers,
  setAnswers,
  profile,
  messages,
  setMessages,
  onClearUserData,
}) {
  const isMobile = useMediaQuery('(max-width: 900px)')
  const [chatInput, setChatInput] = useState('')

  const heatClass = classifyRisk(profile.heatScore)
  const fogClass = classifyRisk(profile.fogScore)
  const shellStyle = {
    flex: 1,
    overflow: isMobile ? 'auto' : 'hidden',
    display: 'grid',
    gridTemplateColumns: isMobile ? '1fr' : 'minmax(300px, 420px) 1fr',
    gridTemplateRows: isMobile ? 'auto minmax(360px, 1fr)' : '1fr',
    gap: 12,
    padding: 12,
  }

  const generateInsights = () => {
    const insightMessages = buildInitialInsights(profile, risks || [])
    setMessages((prev) => [
      ...prev,
      ...insightMessages,
    ])
  }

  const sendMessage = () => {
    const trimmed = chatInput.trim()
    if (!trimmed || profile.unanswered) return
    const reply = generateAssistantReply(trimmed, profile, risks || [])
    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: reply },
    ])
    setChatInput('')
  }

  return (
    <div style={shellStyle}>
      <Stack gap={12} style={{ minWidth: 0 }}>
        <Card padding="md" radius="md" style={cardStyle}>
          <Stack gap={8}>
            <Group justify="space-between">
              <Text fw={700}>Traveler Risk Profile</Text>
              <Group gap={6}>
                <Badge variant="light" color={connected ? 'green' : 'red'}>
                  {connected ? 'Live data connected' : 'Offline'}
                </Badge>
                {onClearUserData ? (
                  <Button
                    size="compact-xs"
                    variant="light"
                    color="red"
                    onClick={onClearUserData}
                  >
                    Clear User Data
                  </Button>
                ) : null}
              </Group>
            </Group>
            <Text size="xs" c="dimmed">
              Tick #{tick} · Scenario {scenario} · {sensors?.length || 0} sensor feeds
            </Text>
            <Text size="sm" c="dimmed">
              Answer these yes/no prompts so we can estimate your vulnerability to heat and fog conditions in real time.
            </Text>
            <Text size="xs" c="dimmed">
              Your profile persists across pages and updates automatically when weather scenario changes.
            </Text>
            <Divider color="#2d2d2d" />
            {QUESTION_SET.map((q) => (
              <Stack key={q.id} gap={4}>
                <Text size="sm">{q.prompt}</Text>
                <Group grow>
                  <Button
                    variant={answers[q.id] === true ? 'filled' : 'outline'}
                    color={answers[q.id] === true ? 'teal' : 'gray'}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: true,
                      }))
                    }
                  >
                    Yes
                  </Button>
                  <Button
                    variant={answers[q.id] === false ? 'filled' : 'outline'}
                    color={answers[q.id] === false ? 'teal' : 'gray'}
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [q.id]: false,
                      }))
                    }
                  >
                    No
                  </Button>
                </Group>
              </Stack>
            ))}
          </Stack>
        </Card>

        <Card padding="md" radius="md" style={cardStyle}>
          <Stack gap={8}>
            <Text fw={700} size="sm">Your Current Risk Levels</Text>
            <div>
              <Group justify="space-between" mb={4}>
                <Text size="sm">Heat</Text>
                <Badge color={heatClass.color}>{heatClass.label} · {profile.heatScore}</Badge>
              </Group>
              <Progress value={profile.heatScore} color={heatClass.color} radius="xl" />
            </div>
            <div>
              <Group justify="space-between" mb={4}>
                <Text size="sm">Fog</Text>
                <Badge color={fogClass.color}>{fogClass.label} · {profile.fogScore}</Badge>
              </Group>
              <Progress value={profile.fogScore} color={fogClass.color} radius="xl" />
            </div>
            <Button
              onClick={generateInsights}
              disabled={profile.unanswered}
              color="teal"
              variant="filled"
            >
              Generate Custom Insights
            </Button>
          </Stack>
        </Card>
      </Stack>

      <div style={chatWindowStyle}>
        <Group justify="space-between" p="md" style={{ borderBottom: '1px solid #2d2d2d' }}>
          <Text fw={700}>Safety Chat</Text>
          <Badge variant="outline" color="gray">Personalized</Badge>
        </Group>

        <ScrollArea style={{ flex: 1 }} p="md">
          <Stack gap={8}>
            {messages.map((m, idx) => (
              <MessageBubble key={idx} role={m.role} text={m.text} />
            ))}
          </Stack>
        </ScrollArea>

        <Group p="md" gap={8} style={{ borderTop: '1px solid #2d2d2d' }}>
          <TextInput
            placeholder={profile.unanswered ? 'Complete profile first...' : 'Ask for route, heat, or fog advice'}
            value={chatInput}
            onChange={(event) => setChatInput(event.currentTarget.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') sendMessage()
            }}
            style={{ flex: 1 }}
            disabled={profile.unanswered}
          />
          <Button onClick={sendMessage} disabled={profile.unanswered || !chatInput.trim()}>
            Send
          </Button>
        </Group>
      </div>
    </div>
  )
}
