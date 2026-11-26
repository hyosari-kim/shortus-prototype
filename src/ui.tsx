import { useEffect, useState, type ReactNode } from 'react'
import { blockedSummary, type Candidate, type Phase } from './model'
import { HUES } from './design'
import { useStore } from './store'

export function useNow(ms = 100) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms)
    return () => clearInterval(t)
  }, [ms])
  return now
}

export function Shell({ children }: { children: ReactNode }) {
  const { state, dispatch } = useStore()
  const used = state.creditLimit - state.credits
  const menu = ['내 숏폼', '카드뉴스', '라이브러리', '채널·발행', '소재 찾기', 'BGM 만들기']
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 flex h-screen w-56 shrink-0 flex-col bg-ink px-4 py-6 text-zinc-300">
        <button className="mb-8 text-left" onClick={() => dispatch({ type: 'openLibrary' })}>
          <div className="text-lg font-black italic text-white">
            Short<span className="text-brand">Us</span>
          </div>
          <div className="text-[10px] font-semibold tracking-wide text-zinc-400">AI SHORTS STUDIO · 프로토타입</div>
        </button>
        <nav className="flex flex-col gap-1 text-sm">
          <div className={`flex items-center justify-between rounded-lg pr-2 ${state.view === 'library' ? 'bg-white/10' : ''}`}>
            <button onClick={() => dispatch({ type: 'openLibrary' })} className="flex-1 px-3 py-2.5 text-left font-semibold text-white">
              {menu[0]}
            </button>
            <button
              aria-label="새 숏폼"
              onClick={() => dispatch({ type: 'newShort' })}
              className="grid size-7 place-items-center rounded-full border border-brand text-brand hover:bg-brand hover:text-white"
            >
              +
            </button>
          </div>
          {menu.slice(1).map((m) => (
            <button key={m} className="cursor-default rounded-lg px-3 py-2.5 text-left font-semibold text-zinc-500">
              {m}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-white/10 p-3 text-xs">
          <div className="text-zinc-400">크레딧</div>
          <div className="mt-1 text-base font-bold text-amber-400">{state.credits} 남음</div>
          <div className="mt-2 h-1 rounded bg-white/10">
            <div className="h-1 rounded bg-brand" style={{ width: `${(used / state.creditLimit) * 100}%` }} />
          </div>
          <div className="mt-2 text-zinc-500">
            사용 {used} / {state.creditLimit} · 12월 1일 리셋
          </div>
          <button className="mt-2 text-zinc-400 underline" onClick={() => dispatch({ type: 'resetDemo' })}>
            데모 초기화
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}

const STEPS: { phase: Phase; label: string }[] = [
  { phase: 'home', label: '입력' },
  { phase: 'candidates', label: '후보' },
  { phase: 'edit', label: '편집·디자인' },
  { phase: 'rendering', label: '만들기' },
  { phase: 'result', label: '결과' },
]

export function Stepper({ current }: { current: Phase }) {
  const idx = STEPS.findIndex((s) => s.phase === current)
  return (
    <ol className="flex items-center gap-3">
      {STEPS.map((s, i) => (
        <li key={s.label} className="flex flex-1 items-center gap-3 last:flex-none">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
              i < idx ? 'bg-ink text-white' : i === idx ? 'bg-brand text-white' : 'border border-zinc-300 text-zinc-400'
            }`}
          >
            {i < idx ? '✓' : i + 1}
          </span>
          <span className={`text-sm font-semibold ${i <= idx ? 'text-ink' : 'text-zinc-400'}`}>{s.label}</span>
          {i < STEPS.length - 1 && <span className={`h-px flex-1 ${i < idx ? 'bg-ink' : 'bg-zinc-200'}`} />}
        </li>
      ))}
    </ol>
  )
}

export function StepHeader({ phase, title, children }: { phase: Phase; title: string; children?: ReactNode }) {
  const { state } = useStore()
  const p = state.project!
  return (
    <header className="mb-8">
      <h1 className="mb-6 truncate text-base font-bold">{p.source.title}</h1>
      <Stepper current={phase} />
      <div className="mt-10 flex items-center gap-2 text-xs text-zinc-500">
        <span className="h-1 w-8 rounded bg-brand" />
        {title}
      </div>
      {children}
    </header>
  )
}

// 실제 영상 대신 쓰는 세로 썸네일. 후보 id로 색을 고정한다.
export function Thumb({ c, overlay, className = '' }: { c: Candidate; overlay?: ReactNode; className?: string }) {
  return (
    <div className={`relative flex aspect-[9/16] flex-col justify-center overflow-hidden rounded-xl bg-black ${className}`}>
      <div className={`grid aspect-video place-items-center bg-gradient-to-br ${HUES[c.id] ?? 'from-zinc-500 to-zinc-800'} px-3`}>
        <span className="text-center text-sm font-black text-white drop-shadow">{c.title}</span>
      </div>
      <span className="absolute bottom-2 right-2 rounded bg-black/60 px-1.5 text-xs text-white">{fmtLen(c)}</span>
      {overlay}
    </div>
  )
}
const fmtLen = (c: Candidate) => `0:${String(Math.round(c.range.end - c.range.start)).padStart(2, '0')}`

export function Button({ variant = 'primary', className = '', ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'dark' }) {
  const v = {
    primary: 'bg-brand text-white hover:brightness-95 disabled:bg-zinc-300',
    ghost: 'border border-zinc-300 bg-white text-ink hover:bg-zinc-50',
    dark: 'bg-ink text-white',
  }[variant]
  return <button className={`rounded-full px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed ${v} ${className}`} {...rest} />
}

export function Modal({ title, sub, onClose, children, width = 'w-[520px]' }: { title: string; sub?: string; onClose: () => void; children: ReactNode; width?: string }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40" onClick={onClose}>
      <div className={`${width} max-h-[92vh] overflow-y-auto rounded-3xl bg-white p-6 shadow-xl`} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold">{title}</h2>
            {sub && <p className="mt-1 text-sm text-zinc-500">{sub}</p>}
          </div>
          <button aria-label="닫기" className="grid size-8 place-items-center rounded-full bg-zinc-100" onClick={onClose}>
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

// 편집·디자인 단계 하단의 "자동으로 만들지 않았어요" 알림
export function BlockedToast() {
  const { state, dispatch } = useStore()
  const p = state.project!
  const blocked = p.candidates.filter((c) => c.selected && c.blockedBy.length > 0)
  const [hidden, setHidden] = useState(false)
  if (hidden || blocked.length === 0 || p.rightsConfirmedAt) return null
  return (
    <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-2xl border border-zinc-200 bg-white px-5 py-3 shadow-lg">
      <div className="text-sm font-bold">
        후보 {blocked.length}개를 자동으로 만들지 않았어요 · {blockedSummary(blocked)}
      </div>
      <Button onClick={() => dispatch({ type: 'make', now: Date.now() })}>확인하고 만들기</Button>
      <button aria-label="알림 닫기" onClick={() => setHidden(true)} className="text-zinc-400">
        ✕
      </button>
    </div>
  )
}

// 편집·디자인 단계 상단의 선택 후보 탭
export function CandidateTabs() {
  const { state, dispatch } = useStore()
  const p = state.project!
  return (
    <div className="mt-4 flex gap-2">
      {p.candidates
        .filter((c) => c.selected)
        .map((c) => (
          <button
            key={c.id}
            onClick={() => dispatch({ type: 'setActive', id: c.id })}
            className={`flex items-center gap-3 rounded-xl border bg-white px-3 py-2 text-left text-xs ${c.id === p.activeId ? 'border-ink' : 'border-zinc-200'}`}
          >
            <div>
              <div className="font-bold">
                후보 {c.id.slice(1)} · {fmtLen(c)}
              </div>
              <div className="text-zinc-500">{c.title}</div>
            </div>
            {c.blockedBy.length > 0 && !p.rightsConfirmedAt && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">확인 필요</span>
            )}
          </button>
        ))}
    </div>
  )
}
