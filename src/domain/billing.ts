import type { ComputedLine } from './types'

export const parseDecimal = (value: string): number | null => {
  const normalized = value.replace(',', '.').trim()
  if (!normalized) {
    return null
  }

  const parsed = Number.parseFloat(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

export const computeDelta = (previous: string, current: string): ComputedLine => {
  const previousValue = parseDecimal(previous)
  const currentValue = parseDecimal(current)

  if (previousValue === null || currentValue === null) {
    return { delta: null, hasError: false }
  }

  const delta = currentValue - previousValue
  return {
    delta,
    hasError: delta < 0,
  }
}

export const computeKwhPrice = (totalBillAr: string, totalConsumptionKwh: number): number => {
  const billValue = parseDecimal(totalBillAr)

  if (billValue === null || totalConsumptionKwh <= 0) {
    return 0
  }

  return billValue / totalConsumptionKwh
}

export const formatAr = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

export const formatKwh = (value: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
