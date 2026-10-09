import { Fragment } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { play } from '../audio/AudioManager'
import { PROFILE, SCROLLS, type ScrollId } from '../data/cv'
import { LEVEL } from '../data/level'
import { useMission } from '../game/missionStore'

const fmt = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

function Debrief() {
  const s = useMission()
  if (!s.endedAt) return null
  const acc = s.shots ? Math.round((s.hits / s.shots) * 100) : 0
  const rank = s.alerts === 0 ? 'GHOST' : acc >= 60 ? 'MARKSMAN' : 'BREACHER'
  const rows: [string, string][] = [
    ['Time', fmt(s.endedAt - s.startedAt)],
    ['Hostiles', `${s.kills.length}/${LEVEL.enemies.length}`],
    ['Takedowns', String(s.takedowns)],
    ['Headshots', String(s.headshots)],
    ['Accuracy', `${acc}%`],
    ['Times spotted', String(s.alerts)],
  ]
  return (
    <motion.div
      className="glass pointer-events-auto absolute left-4 top-4 hidden w-60 rounded-xl p-4 font-hud text-white sm:block md:left-8 md:top-8"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.4 }}
    >
      <div className="text-xs tracking-[0.4em] text-amber-300">DEBRIEF</div>
      <div className="text-3xl font-bold tracking-wider">{rank}</div>
      <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
        {rows.map(([k, v]) => (
          <Fragment key={k}>
            <dt className="text-white/60">{k}</dt>
            <dd className="text-right font-bold tabular-nums">{v}</dd>
          </Fragment>
        ))}
      </dl>
    </motion.div>
  )
}

export default function ScrollViewer() {
  const id = useMission((s) => s.scroll)
  const scroll = SCROLLS.find((s) => s.id === id) ?? SCROLLS[0]
  const { start, toMenu } = useMission.getState()
  const select = (sid: ScrollId) => {
    play('scrollUnroll')
    useMission.getState().setScroll(sid)
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex flex-col justify-end md:flex-row md:items-center md:justify-end md:p-8">
      <Debrief />
      <motion.aside
        className="pointer-events-auto flex max-h-[64vh] w-full flex-col rounded-t-2xl bg-black/40 p-3 backdrop-blur md:max-h-[90vh] md:w-[540px] md:rounded-2xl"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 22 }}
      >
        <header className="px-2 pb-2 font-hud text-white">
          <div className="text-xs tracking-[0.4em] text-amber-300/90">THE RECOVERED SCROLLS</div>
          <div className="text-2xl font-bold">
            {PROFILE.name} <span className="text-white/50">· {PROFILE.title}</span>
          </div>
          <p className="mt-1 text-sm text-white/70">{PROFILE.summary}</p>
        </header>

        <nav className="flex gap-2 overflow-x-auto px-1 pb-3">
          {SCROLLS.map((s) => (
            <button
              key={s.id}
              onClick={() => select(s.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 font-scroll text-sm font-bold transition ${
                s.id === id ? 'bg-amber-300 text-black' : 'bg-white/10 text-amber-100 hover:bg-white/20'
              }`}
            >
              {s.numeral} · {s.title.replace('Scroll of ', '')}
            </button>
          ))}
        </nav>

        <AnimatePresence mode="wait">
          <motion.article
            key={scroll.id}
            className="parchment scrollable min-h-0 flex-1 rounded-xl p-5"
            style={{ originY: 0 }}
            initial={{ scaleY: 0.15, opacity: 0 }}
            animate={{ scaleY: 1, opacity: 1 }}
            exit={{ scaleY: 0.15, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
          >
            <h2 className="font-scroll text-2xl font-bold">
              {scroll.numeral}. {scroll.title}
            </h2>
            <p className="font-hud text-sm italic opacity-70">{scroll.tagline}</p>
            <div className="mt-4 space-y-5">
              {scroll.entries.map((e) => (
                <section key={e.title}>
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <h3 className="font-scroll text-lg font-bold">{e.title}</h3>
                    {e.subtitle && <span className="font-hud text-sm opacity-70">{e.subtitle}</span>}
                    {e.period && <span className="ml-auto font-hud text-xs opacity-60">{e.period}</span>}
                  </div>
                  <p className="mt-1 font-hud text-base leading-snug">{e.body}</p>
                  {e.bullets && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 font-hud text-sm leading-snug">
                      {e.bullets.map((b) => (
                        <li key={b}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {e.tags && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {e.tags.map((t) => (
                        <span
                          key={t}
                          className="rounded-full border border-[#3b2414]/30 bg-[#3b2414]/10 px-2 py-0.5 font-hud text-xs font-semibold"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {e.links && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {e.links.map((l) => (
                        <a
                          key={l.label}
                          href={l.href}
                          target={l.href.startsWith('/') ? undefined : '_blank'}
                          rel="noreferrer"
                          download={l.href.endsWith('.pdf') ? true : undefined}
                          className="rounded-md bg-[#3b2414] px-3 py-1.5 font-hud text-sm font-bold tracking-wide text-amber-100 hover:bg-[#5a3820]"
                        >
                          {l.label} →
                        </a>
                      ))}
                    </div>
                  )}
                </section>
              ))}
            </div>
          </motion.article>
        </AnimatePresence>

        <footer className="flex flex-wrap gap-2 px-1 pt-3">
          <a href={PROFILE.cvUrl} download className="btn bg-amber-400 text-black hover:bg-amber-300">
            Download CV
          </a>
          <button className="btn glass text-white hover:bg-white/10" onClick={start}>
            Play mission
          </button>
          <button className="btn glass text-white hover:bg-white/10" onClick={toMenu}>
            Menu
          </button>
        </footer>
      </motion.aside>
    </div>
  )
}