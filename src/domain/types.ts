export type MeterId = 'meter1' | 'meter2'

export interface MainMeterConfig {
  id: MeterId
  name: string
  subMeterCount: number
}

export interface SubMeterConfig {
  id: string
  mainMeterId: MeterId
  label: string
}

export interface ReadingInput {
  previous: string
  current: string
}

export type TotalConsumptionSource = 'mainMeters' | 'jiramaDirect'

export interface MeterBillingInput {
  totalBillAr: string
  totalConsumptionSource: TotalConsumptionSource
  jiramaTotalKwh: string
}

export interface AppState {
  monthLabel: string
  meterBilling: Record<MeterId, MeterBillingInput>
  mainReadings: Record<MeterId, ReadingInput>
  subReadings: Record<string, ReadingInput>
}

export interface ComputedLine {
  delta: number | null
  hasError: boolean
}

export interface SubMeterComputed extends ComputedLine {
  id: string
  label: string
  mainMeterId: MeterId
  amountAr: number
}
