import { Card, Text, NumberInput } from '@mantine/core'

export default function ThresholdControls({ heatThreshold, setHeatThreshold }) {
  return (
    <Card padding="sm" radius="sm" style={{ background: '#1a1b1e' }}>
      <Text size="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
        Block Heat Overlay
      </Text>
      <NumberInput
        label="Baseline threshold (°F)"
        value={heatThreshold}
        onChange={(val) => val !== '' && setHeatThreshold(val)}
        min={50}
        max={130}
        step={1}
        size="xs"
        styles={{ input: { background: '#25262b', borderColor: '#373A40', color: '#e5e5e5' } }}
      />
      <Text size="xs" c="dimmed" mt={6}>
        A block turns red only when all 4 corner sensors exceed both the
        global average temp and this threshold.
      </Text>
    </Card>
  )
}
