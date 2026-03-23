import { MAIN_METERS, SUB_METERS } from '../config/meters'
import type { AppState, MeterId, ReadingInput } from '../domain/types'

const STORAGE_KEY = 'jirama-electricity-v1'

const emptyReading = (): ReadingInput => ({ previous: '', current: '' })

export const createDefaultState = (): AppState => {
  const mainReadings = MAIN_METERS.reduce<Record<MeterId, ReadingInput>>(
    (accumulator, meter) => {
      accumulator[meter.id] = emptyReading()
      return accumulator
    },
    {
      meter1: emptyReading(),
      meter2: emptyReading(),
    },
  )

  const subReadings = SUB_METERS.reduce<Record<string, ReadingInput>>(
    (accumulator, subMeter) => {
      accumulator[subMeter.id] = emptyReading()
      return accumulator
    },
    {},
  )

  return {
    monthLabel: '',
    meterBilling: {
      meter1: {
        totalBillAr: '',
        totalConsumptionSource: 'mainMeters',
        jiramaTotalKwh: '',
      },
      meter2: {
        totalBillAr: '',
        totalConsumptionSource: 'mainMeters',
        jiramaTotalKwh: '',
      },
    },
    mainReadings,
    subReadings,
  }
}

export const loadState = (): AppState => {
  const defaultState = createDefaultState()

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return defaultState
    }

    const parsed = JSON.parse(raw) as Partial<AppState> & {
      totalBillAr?: string
      totalConsumptionSource?: AppState['meterBilling']['meter1']['totalConsumptionSource']
      jiramaTotalKwh?: string
    }

    const legacyMeterBilling = {
      totalBillAr: parsed.totalBillAr ?? '',
      totalConsumptionSource: parsed.totalConsumptionSource ?? 'mainMeters',
      jiramaTotalKwh: parsed.jiramaTotalKwh ?? '',
    }

    return {
      monthLabel: parsed.monthLabel ?? defaultState.monthLabel,
      meterBilling: {
        meter1: {
          totalBillAr: parsed.meterBilling?.meter1?.totalBillAr ?? legacyMeterBilling.totalBillAr,
          totalConsumptionSource:
            parsed.meterBilling?.meter1?.totalConsumptionSource ?? legacyMeterBilling.totalConsumptionSource,
          jiramaTotalKwh: parsed.meterBilling?.meter1?.jiramaTotalKwh ?? legacyMeterBilling.jiramaTotalKwh,
        },
        meter2: {
          totalBillAr: parsed.meterBilling?.meter2?.totalBillAr ?? legacyMeterBilling.totalBillAr,
          totalConsumptionSource:
            parsed.meterBilling?.meter2?.totalConsumptionSource ?? legacyMeterBilling.totalConsumptionSource,
          jiramaTotalKwh: parsed.meterBilling?.meter2?.jiramaTotalKwh ?? legacyMeterBilling.jiramaTotalKwh,
        },
      },
      mainReadings: {
        meter1: {
          previous: parsed.mainReadings?.meter1?.previous ?? defaultState.mainReadings.meter1.previous,
          current: parsed.mainReadings?.meter1?.current ?? defaultState.mainReadings.meter1.current,
        },
        meter2: {
          previous: parsed.mainReadings?.meter2?.previous ?? defaultState.mainReadings.meter2.previous,
          current: parsed.mainReadings?.meter2?.current ?? defaultState.mainReadings.meter2.current,
        },
      },
      subReadings: SUB_METERS.reduce<Record<string, ReadingInput>>((accumulator, subMeter) => {
        accumulator[subMeter.id] = {
          previous: parsed.subReadings?.[subMeter.id]?.previous ?? defaultState.subReadings[subMeter.id].previous,
          current: parsed.subReadings?.[subMeter.id]?.current ?? defaultState.subReadings[subMeter.id].current,
        }
        return accumulator
      }, {}),
    }
  } catch {
    return defaultState
  }
}

export const saveState = (state: AppState): void => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}
