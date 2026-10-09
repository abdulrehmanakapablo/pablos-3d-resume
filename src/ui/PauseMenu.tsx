import { motion } from 'framer-motion'
import { lockPointer } from '../game/inputStore'
import { useMission } from '../game/missionStore'
import { useSettings, type QualitySetting } from '../game/settingsStore'

const QUALITY: QualitySetting[] = ['auto', 'low', 'medium', 'high', 'ultra']

function Range({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}) {
  return (
    <label className="grid gap-1">
      <span className="flex justify-between text-white/70">
        <span>{label}</span>
        <span className="tabular-nums text-white">{format ? format(value) : value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="accent-amber-400"
      />
    </label>
  )
}

export function SettingsPanel() {
  const s = useSettings()
  return (
    <div className="glass pointer-events-auto grid gap-3 rounded-xl p-4 font-hud text-sm text-white">
      <label className="flex items-center justify-between gap-4">
        <span className="text-white/70">Quality</span>
        <select
          value={s.quality}
          onChange={(e) => s.set({ quality: e.target.value as QualitySetting })}
          className="rounded bg-black/60 px-2 py-1 text-white"
        >
          {QUALITY.map((q) => (
            <option key={q} value={q}>
              {q.toUpperCase()}
            </option>
          ))}
        </select>
      </label>
      <Range label="Sensitivity" value={s.sensitivity} min={0.3} max={2.5} step={0.05} onChange={(v) => s.set({ sensitivity: v })} format={(v) => v.toFixed(2)} />
      <Range label="Field of view" value={s.fov} min={60} max={100} step={1} onChange={(v) => s.set({ fov: v })} />
      <Range label="Volume" value={s.volume} min={0} max={1} step={0.05} onChange={(v) => s.set({ volume: v })} format={(v) => `${Math.round(v * 100)}%`} />
      <label className="flex items-center justify-between">
        <span className="text-white/70">Mute</span>
        <input
          type="checkbox"
          checked={s.muted}
          onChange={(e) => s.set({ muted: e.target.checked })}
          className="h-4 w-4 accent-amber-400"
        />
      </label>
    </div>
  )
}

export default function PauseMenu() {
  const { restart, skipToCV, toMenu } = useMission.getState()
  const resume = () => {
    lockPointer()
    useMission.getState().resume()
  }

  return (
    <motion.div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-6 font-hud text-white backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex max-h-full w-full max-w-sm flex-col gap-3 overflow-y-auto">
        <h2 className="mb-2 text-center text-4xl font-bold tracking-[0.3em]">PAUSED</h2>
        <button className="btn bg-amber-400 text-black hover:bg-amber-300" onClick={resume}>
          Resume
        </button>
        <button className="btn glass hover:bg-white/10" onClick={restart}>
          Restart
        </button>
        <button className="btn glass hover:bg-white/10" onClick={skipToCV}>
          Skip to CV
        </button>
        <button className="btn glass hover:bg-white/10" onClick={toMenu}>
          Quit to menu
        </button>
        <SettingsPanel />
      </div>
    </motion.div>
  )
}