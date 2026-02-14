import { useState, useEffect } from 'react'
import { Stack, Text, Badge, Group, Button } from '@mantine/core'
import { useWebSocket } from './hooks/useWebSocket'
import DavisMap from './components/DavisMap'
import AlertBanner from './components/AlertBanner'
import WeatherPanel from './components/WeatherPanel'
import ScenarioControls from './components/ScenarioControls'
import ThresholdControls from './components/ThresholdControls'
import SorcererPanel from './components/SorcererPanel'
import TopRiskList from './components/TopRiskList'
import AlertPanel from './components/AlertPanel'
import UserPage from './components/UserPage'

const appStyle = {
  width: '100vw',
  height: '100vh',
  display: 'flex',
  flexDirection: 'column',
  background: '#111',
  color: '#e5e5e5',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  overflow: 'hidden',
}

const mainStyle = {
  display: 'flex',
  flex: 1,
  overflow: 'hidden',
}

const mapStyle = {
  flex: '7 1 0',
  position: 'relative',
}

const sidebarStyle = {
  flex: '3 1 0',
  minWidth: 300,
  maxWidth: 400,
  overflowY: 'auto',
  padding: 12,
  background: '#141517',
  borderLeft: '1px solid #2d2d2d',
}

export default function App() {
  const { data, connected } = useWebSocket()
  const [pathname, setPathname] = useState(window.location.pathname)
  const [heatThreshold, setHeatThreshold] = useState(95)

  const sensors = data?.sensors || []
  const risks = data?.risks || []
  const alerts = data?.alerts || []
  const atmospheric = data?.atmospheric || null
  const scenario = data?.scenario || 'clear_day'
  const isUserPage = pathname.startsWith('/user')

  useEffect(() => {
    const onPopState = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const navigate = (path) => {
    if (window.location.pathname === path) return
    window.history.pushState({}, '', path)
    setPathname(path)
  }

  return (
    <div style={appStyle}>
      {/* CSS for pulsing markers */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.4); opacity: 0.7; }
        }
      `}</style>

      <AlertBanner alerts={alerts} />

      <div style={{ padding: '8px 16px', background: '#1a1b1e', borderBottom: '1px solid #2d2d2d', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Group gap={8}>
          <Text fw={700} size="lg">Davis Microclimate Safety Network</Text>
          <Badge size="xs" color={connected ? 'green' : 'red'} variant="dot">
            {connected ? 'LIVE' : 'OFFLINE'}
          </Badge>
          <Group gap={6}>
            <Button
              size="compact-xs"
              variant={isUserPage ? 'light' : 'filled'}
              color={isUserPage ? 'gray' : 'blue'}
              onClick={() => navigate('/')}
            >
              Dashboard
            </Button>
            <Button
              size="compact-xs"
              variant={isUserPage ? 'filled' : 'light'}
              color={isUserPage ? 'teal' : 'gray'}
              onClick={() => navigate('/user')}
            >
              User Insights
            </Button>
          </Group>
        </Group>
        <Text size="xs" c="dimmed">
          {sensors.length} sensors · Tick #{data?.tick || 0}
        </Text>
      </div>

      {isUserPage ? (
        <UserPage
          risks={risks}
          sensors={sensors}
          connected={connected}
          tick={data?.tick || 0}
          scenario={scenario}
        />
      ) : (
        <div style={mainStyle}>
          <div style={mapStyle}>
            <DavisMap risks={risks} sensors={sensors} />
          </div>

          <div style={sidebarStyle}>
            <Stack gap={12}>
              <WeatherPanel />
              <ScenarioControls activeScenario={scenario} />
              <ThresholdControls heatThreshold={heatThreshold} setHeatThreshold={setHeatThreshold} />
              <SorcererPanel atmospheric={atmospheric} />
              <TopRiskList risks={risks} />
              <AlertPanel alerts={alerts} />
            </Stack>
          </div>
        </div>
      )}
    </div>
  )
}
