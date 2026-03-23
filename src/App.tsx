import { useEffect, useMemo, useState } from 'react'
import { MAIN_METERS, SUB_METERS } from './config/meters'
import { computeDelta, computeKwhPrice, formatAr, formatKwh, parseDecimal } from './domain/billing'
import type { AppState, MeterId, SubMeterComputed, TotalConsumptionSource } from './domain/types'
import { createDefaultState, loadState, saveState } from './services/storage'
import './App.css'

function App() {
  const [state, setState] = useState<AppState>(() => loadState())
  const [selectedMeterId, setSelectedMeterId] = useState<MeterId>('meter1')
  const [showScrollTop, setShowScrollTop] = useState(false)

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 360)
    }

    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const mainResults = useMemo(() => {
    return MAIN_METERS.map((meter) => {
      const reading = state.mainReadings[meter.id]
      const computed = computeDelta(reading.previous, reading.current)
      return {
        meter,
        ...computed,
      }
    })
  }, [state.mainReadings])

  const selectedMeterMainLine = useMemo(
    () => mainResults.find((line) => line.meter.id === selectedMeterId),
    [mainResults, selectedMeterId],
  )

  const selectedBilling = state.meterBilling[selectedMeterId]

  const totalConsumptionUsed = useMemo(() => {
    if (selectedBilling.totalConsumptionSource === 'jiramaDirect') {
      const directValue = parseDecimal(selectedBilling.jiramaTotalKwh)
      return directValue !== null && directValue > 0 ? directValue : 0
    }

    if (!selectedMeterMainLine || selectedMeterMainLine.delta === null || selectedMeterMainLine.hasError) {
      return 0
    }

    return selectedMeterMainLine.delta
  }, [selectedBilling.jiramaTotalKwh, selectedBilling.totalConsumptionSource, selectedMeterMainLine])

  const pricePerKwh = useMemo(() => {
    return computeKwhPrice(selectedBilling.totalBillAr, totalConsumptionUsed)
  }, [selectedBilling.totalBillAr, totalConsumptionUsed])

  const selectedSubMeterResults = useMemo<SubMeterComputed[]>(() => {
    return SUB_METERS.filter((subMeter) => subMeter.mainMeterId === selectedMeterId).map((subMeter) => {
      const reading = state.subReadings[subMeter.id]
      const computed = computeDelta(reading.previous, reading.current)
      const amountAr = computed.delta !== null && !computed.hasError ? computed.delta * pricePerKwh : 0

      return {
        id: subMeter.id,
        label: subMeter.label,
        mainMeterId: subMeter.mainMeterId,
        delta: computed.delta,
        hasError: computed.hasError,
        amountAr,
      }
    })
  }, [pricePerKwh, selectedMeterId, state.subReadings])

  const totalSubAmount = useMemo(() => {
    return selectedSubMeterResults.reduce((accumulator, line) => {
      if (line.delta === null || line.hasError) {
        return accumulator
      }
      return accumulator + line.amountAr
    }, 0)
  }, [selectedSubMeterResults])

  const updateMonthLabel = (value: string) => {
    setState((previous) => ({
      ...previous,
      monthLabel: value,
    }))
  }

  const updateTotalBill = (value: string) => {
    setState((previous) => ({
      ...previous,
      meterBilling: {
        ...previous.meterBilling,
        [selectedMeterId]: {
          ...previous.meterBilling[selectedMeterId],
          totalBillAr: value,
        },
      },
    }))
  }

  const updateTotalConsumptionSource = (value: TotalConsumptionSource) => {
    setState((previous) => ({
      ...previous,
      meterBilling: {
        ...previous.meterBilling,
        [selectedMeterId]: {
          ...previous.meterBilling[selectedMeterId],
          totalConsumptionSource: value,
        },
      },
    }))
  }

  const updateJiramaTotalKwh = (value: string) => {
    setState((previous) => ({
      ...previous,
      meterBilling: {
        ...previous.meterBilling,
        [selectedMeterId]: {
          ...previous.meterBilling[selectedMeterId],
          jiramaTotalKwh: value,
        },
      },
    }))
  }

  const updateMainReading = (
    meterId: MeterId,
    field: 'previous' | 'current',
    value: string,
  ) => {
    setState((previous) => ({
      ...previous,
      mainReadings: {
        ...previous.mainReadings,
        [meterId]: {
          ...previous.mainReadings[meterId],
          [field]: value,
        },
      },
    }))
  }

  const updateSubReading = (
    subMeterId: string,
    field: 'previous' | 'current',
    value: string,
  ) => {
    setState((previous) => ({
      ...previous,
      subReadings: {
        ...previous.subReadings,
        [subMeterId]: {
          ...previous.subReadings[subMeterId],
          [field]: value,
        },
      },
    }))
  }

  const resetAll = () => {
    setState(createDefaultState())
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const visibleMeters = MAIN_METERS.filter((meter) => meter.id === selectedMeterId)

  const visibleMeterIds = new Set(visibleMeters.map((meter) => meter.id))
  const visibleMainResults = mainResults.filter((line) => visibleMeterIds.has(line.meter.id))

  return (
    <main className="app-shell">
      <header className="panel">
        <div>
          <p className="eyebrow">Gestion Electricité Maison</p>
          <h1>Suivi JIRAMA: 2 compteurs principaux et 13 sous-compteurs</h1>
          <p className="hint">Saisir relevés précédent/actuel, puis obtenir le prix kWh et le montant par sous-compteur.</p>
        </div>
        <button className="ghost" type="button" onClick={resetAll}>
          Réinitialiser
        </button>
      </header>

      <section className="panel grid-two">
        <label>
          Mois de facturation
          <input
            type="text"
            placeholder="Ex: Mars 2026"
            value={state.monthLabel}
            onChange={(event) => updateMonthLabel(event.target.value)}
          />
        </label>
        <label>
          Facture totale JIRAMA ({selectedMeterId === 'meter1' ? 'Compteur 1' : 'Compteur 2'}) (AR)
          <input
            type="text"
            inputMode="decimal"
            placeholder="Ex: 100000"
            value={selectedBilling.totalBillAr}
            onChange={(event) => updateTotalBill(event.target.value)}
          />
        </label>
      </section>

      <section className="panel">
        <h2>Choisir le compteur à compléter</h2>
        <p className="hint">Seul le compteur sélectionné est affiché pour faciliter la saisie.</p>
        <div className="meter-picker" role="tablist" aria-label="Choix compteur">
          <button
            type="button"
            className={`meter-tab ${selectedMeterId === 'meter1' ? 'active' : ''}`}
            onClick={() => setSelectedMeterId('meter1')}
          >
            Compteur principal 1
          </button>
          <button
            type="button"
            className={`meter-tab ${selectedMeterId === 'meter2' ? 'active' : ''}`}
            onClick={() => setSelectedMeterId('meter2')}
          >
            Compteur principal 2
          </button>
        </div>
      </section>

      <section className="panel">
        <h2>Source de la consommation totale</h2>
        <div className="source-switch">
          <label className="choice-card" htmlFor="source-main">
            <input
              id="source-main"
              type="radio"
              name="consumption-source"
              checked={selectedBilling.totalConsumptionSource === 'mainMeters'}
              onChange={() => updateTotalConsumptionSource('mainMeters')}
            />
            <span>Calculer via compteurs principaux</span>
          </label>

          <label className="choice-card" htmlFor="source-direct">
            <input
              id="source-direct"
              type="radio"
              name="consumption-source"
              checked={selectedBilling.totalConsumptionSource === 'jiramaDirect'}
              onChange={() => updateTotalConsumptionSource('jiramaDirect')}
            />
            <span>Utiliser la consommation totale donnée par JIRAMA</span>
          </label>
        </div>

        {selectedBilling.totalConsumptionSource === 'jiramaDirect' ? (
          <div className="direct-input-row">
            <label>
              Consommation totale JIRAMA ({selectedMeterId === 'meter1' ? 'Compteur 1' : 'Compteur 2'}) (kWh)
              <input
                type="text"
                inputMode="decimal"
                placeholder="Ex: 199"
                value={selectedBilling.jiramaTotalKwh}
                onChange={(event) => updateJiramaTotalKwh(event.target.value)}
              />
            </label>
          </div>
        ) : null}
      </section>

      <section className="panel">
        <h2>Relevés des compteurs principaux</h2>
        <p className="hint">Cette section sert au mode automatique. En mode JIRAMA direct, elle reste informative.</p>
        <div className="table-wrap">
          <table className="readings-table">
            <thead>
              <tr>
                <th>Compteur</th>
                <th>Mois précédent</th>
                <th>Mois actuel</th>
                <th>Consommation (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {visibleMainResults.map((line) => (
                <tr key={line.meter.id}>
                  <td data-label="Compteur">{line.meter.name}</td>
                  <td data-label="Mois précédent">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={state.mainReadings[line.meter.id].previous}
                      onChange={(event) =>
                        updateMainReading(line.meter.id, 'previous', event.target.value)
                      }
                    />
                  </td>
                  <td data-label="Mois actuel">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={state.mainReadings[line.meter.id].current}
                      onChange={(event) =>
                        updateMainReading(line.meter.id, 'current', event.target.value)
                      }
                    />
                  </td>
                  <td data-label="Consommation (kWh)" className={line.hasError ? 'error' : ''}>
                    {line.delta === null ? '-' : `${formatKwh(line.delta)} kWh`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel kpi-grid">
        <article>
          <p>
            Consommation totale utilisée ({selectedBilling.totalConsumptionSource === 'jiramaDirect' ? 'JIRAMA' : 'compteurs principaux'})
          </p>
          <strong>{formatKwh(totalConsumptionUsed)} kWh</strong>
        </article>
        <article>
          <p>Prix de 1 kWh</p>
          <strong>{formatKwh(pricePerKwh)} AR</strong>
        </article>
        <article>
          <p>Total estimé des sous-compteurs</p>
          <strong>{formatAr(totalSubAmount)} AR</strong>
        </article>
      </section>

      {visibleMeters.map((meter) => {
        const meterSubLines = selectedSubMeterResults.filter((line) => line.mainMeterId === meter.id)
        const meterMainLine = mainResults.find((line) => line.meter.id === meter.id)

        const meterSubConsumptionTotal = meterSubLines.reduce((accumulator, line) => {
          if (line.delta === null || line.hasError) {
            return accumulator
          }

          return accumulator + line.delta
        }, 0)

        const meterSubAmountTotal = meterSubLines.reduce((accumulator, line) => {
          if (line.delta === null || line.hasError) {
            return accumulator
          }

          return accumulator + line.amountAr
        }, 0)

        const meterGapKwh =
          meterMainLine && meterMainLine.delta !== null && !meterMainLine.hasError
            ? meterMainLine.delta - meterSubConsumptionTotal
            : null

        return (
          <section className="panel" key={meter.id}>
            <h2>{meter.name}</h2>
            <p className="hint">S = Sous-compteur</p>
            <div className="meter-summary">
              <article>
                <p>Total consommation sous-compteurs</p>
                <strong>{formatKwh(meterSubConsumptionTotal)} kWh</strong>
              </article>
              <article>
                <p>Total à payer ({meter.name})</p>
                <strong>{formatAr(meterSubAmountTotal)} AR</strong>
              </article>
              <article>
                <p>Écart de vérification (principal - sous)</p>
                <strong className={meterGapKwh !== null && meterGapKwh < 0 ? 'error' : ''}>
                  {meterGapKwh === null ? '-' : `${formatKwh(meterGapKwh)} kWh`}
                </strong>
              </article>
            </div>
            <div className="table-wrap">
              <table className="readings-table sub-table">
                <thead>
                  <tr>
                    <th>Sous-compteur</th>
                    <th>Mois précédent</th>
                    <th>Mois actuel</th>
                    <th>Consommation (kWh)</th>
                    <th>Montant (AR)</th>
                  </tr>
                </thead>
                <tbody>
                  {meterSubLines.map((line) => (
                    <tr key={line.id}>
                      <td data-label="Sous-compteur">{line.label}</td>
                      <td data-label="Mois précédent">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={state.subReadings[line.id].previous}
                          onChange={(event) =>
                            updateSubReading(line.id, 'previous', event.target.value)
                          }
                        />
                      </td>
                      <td data-label="Mois actuel">
                        <input
                          type="text"
                          inputMode="decimal"
                          value={state.subReadings[line.id].current}
                          onChange={(event) =>
                            updateSubReading(line.id, 'current', event.target.value)
                          }
                        />
                      </td>
                      <td data-label="Consommation (kWh)" className={line.hasError ? 'error' : ''}>
                        {line.delta === null ? '-' : `${formatKwh(line.delta)} kWh`}
                      </td>
                      <td data-label="Montant (AR)">{line.delta === null || line.hasError ? '-' : `${formatAr(line.amountAr)} AR`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}

      <button
        type="button"
        className={`scroll-top-btn ${showScrollTop ? 'show' : ''}`}
        onClick={scrollToTop}
        aria-label="Aller en haut"
      >
        ↑
      </button>
    </main>
  )
}

export default App
