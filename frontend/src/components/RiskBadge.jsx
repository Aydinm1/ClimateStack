import { Badge } from '@mantine/core'
import { riskColor } from '../utils/riskColors'

export default function RiskBadge({ level, score }) {
  return (
    <Badge
      color={riskColor(level)}
      variant="filled"
      size="sm"
      style={{ minWidth: 80 }}
    >
      {level} {score !== undefined ? `(${Math.round(score)}%)` : ''}
    </Badge>
  )
}
