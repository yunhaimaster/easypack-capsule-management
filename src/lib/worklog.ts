import { DateTime } from 'luxon'

const HK_TZ = 'Asia/Hong_Kong'

interface WorklogCalculationInput {
  date: string
  startTime: string
  endTime: string
  headcount: number
}

const LUNCH_START = { hour: 12, minute: 30 }
const LUNCH_END = { hour: 13, minute: 30 }

export function calculateEffectiveMinutes({ date, startTime, endTime }: WorklogCalculationInput): number {
  const start = DateTime.fromISO(`${date}T${startTime}`, { zone: HK_TZ })
  const end = DateTime.fromISO(`${date}T${endTime}`, { zone: HK_TZ })

  if (!start.isValid || !end.isValid || end <= start) {
    return 0
  }

  let total = end.diff(start, 'minutes').minutes

  const lunchStart = DateTime.fromObject({ ...start.toObject(), ...LUNCH_START }, { zone: HK_TZ })
  const lunchEnd = DateTime.fromObject({ ...start.toObject(), ...LUNCH_END }, { zone: HK_TZ })

  const overlapStart = start > lunchStart ? start : lunchStart
  const overlapEnd = end < lunchEnd ? end : lunchEnd
  if (overlapEnd > overlapStart) {
    total -= overlapEnd.diff(overlapStart, 'minutes').minutes
  }

  return Math.max(0, Math.floor(total))
}

export function calculateWorkUnits(input: WorklogCalculationInput): { minutes: number; units: number } {
  const minutes = calculateEffectiveMinutes(input)
  if (minutes <= 0 || input.headcount <= 0) {
    return { minutes: 0, units: 0 }
  }

  const hours = minutes / 60
  const rounded = Math.ceil(hours * 2) / 2
  const units = rounded * input.headcount

  return { minutes, units }
}

export function sumWorkUnits(entries: Array<{ calculatedWorkUnits: number }>): number {
  return entries.reduce((sum, entry) => sum + (entry.calculatedWorkUnits || 0), 0)
}

