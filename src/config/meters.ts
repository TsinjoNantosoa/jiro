import type { MainMeterConfig, SubMeterConfig } from '../domain/types'

export const MAIN_METERS: MainMeterConfig[] = [
  { id: 'meter1', name: 'Compteur principal 1', subMeterCount: 7 },
  { id: 'meter2', name: 'Compteur principal 2', subMeterCount: 6 },
]

export const SUB_METERS: SubMeterConfig[] = MAIN_METERS.flatMap((meter) =>
  Array.from({ length: meter.subMeterCount }, (_, index) => {
    const label = `S ${String(index + 1).padStart(2, '0')}`
    return {
      id: `${meter.id}-${index + 1}`,
      mainMeterId: meter.id,
      label,
    }
  }),
)
