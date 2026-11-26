import { useState } from 'react'
import { DesignSettings, Preview } from '../design'
import { fmt } from '../model'
import { useStore } from '../store'
import { BlockedToast, Button, CandidateTabs, StepHeader } from '../ui'

// Part1 가설 1: 디자인 단계를 없애고 이 화면의 탭으로 옮겼다
const TABS = ['구간', '자막', '디자인', '장면', '댓글'] as const
const MAX_LEN = 180

export function Edit() {
  const { state, dispatch } = useStore()
  const p = state.project!
  const c = p.candidates.find((x) => x.id === p.activeId)!
  const [tab, setTab] = useState<(typeof TABS)[number]>('구간')
  const selectedCount = p.candidates.filter((x) => x.selected).length
  const span = p.analyzeRange
  const total = span.end - span.start
  const pos = (t: number) => `${((t - span.start) / total) * 100}%`
  const len = c.range.end - c.range.start
  const setRange = (start: number, end: number) => {
    const s = Math.max(span.start, Math.min(start, end - 1))
    const e = Math.min(span.end, Math.max(end, s + 1), s + MAX_LEN)
    dispatch({ type: 'updateCandidate', id: c.id, patch: { range: { start: s, end: e } } })
  }

  return (
    <div className="mx-auto max-w-6xl px-10 py-10 pb-32">
      <StepHeader phase="edit" title="3단계 · 편집·디자인">
        <CandidateTabs />
        <h2 className="mt-6 text-3xl font-black">편집·디자인</h2>
        <p className="mt-2 text-zinc-500">
          구간·자막을 다듬고 디자인까지 여기서 정해요. 고칠 게 없으면 바로 영상을 만들어요.
        </p>
      </StepHeader>

      <div className="flex gap-6">
        <section className="flex-1 rounded-3xl border border-zinc-200 bg-white p-6">
          <div className="inline-flex rounded-xl bg-zinc-100 p-1">
            {TABS.map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === t ? 'bg-white shadow-sm' : 'text-zinc-500'}`}>
                {t}
              </button>
            ))}
          </div>

          {tab === '구간' && (
            <div className="mt-6">
              <h3 className="font-bold">구간</h3>
              <p className="text-xs text-zinc-500">쓸 구간의 시작·끝을 다듬고 후보 이름을 정해요.</p>
              <div className="relative mt-4 h-12 rounded-lg bg-zinc-100">
                {[8, 22, 35, 52, 68, 84].map((x) => (
                  <span key={x} className="absolute inset-y-3 w-[10%] rounded bg-zinc-300" style={{ left: `${x}%` }} />
                ))}
                <div className="absolute inset-y-0 rounded-lg border-2 border-brand bg-brand/20" style={{ left: pos(c.range.start), width: `${(len / total) * 100}%` }} />
              </div>
              <div className="mt-4 flex items-end gap-3">
                <NumField label="시작(초)" value={c.range.start} onChange={(v) => setRange(v, c.range.end)} />
                <NumField label="끝(초)" value={c.range.end} onChange={(v) => setRange(c.range.start, v)} />
                <span className="pb-2 text-sm font-bold">
                  {fmt(len)} <span className="font-normal text-zinc-400">최대 {fmt(MAX_LEN)}</span>
                </span>
              </div>
              <label className="mt-6 block text-sm font-bold">
                후보 이름
                <input
                  value={c.title}
                  onChange={(e) => dispatch({ type: 'updateCandidate', id: c.id, patch: { title: e.target.value } })}
                  className="mt-2 block w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-normal"
                />
              </label>
            </div>
          )}
          {tab === '자막' && (
            <label className="mt-6 block text-sm font-bold">
              첫 자막
              <textarea
                value={c.hookLine}
                onChange={(e) => dispatch({ type: 'updateCandidate', id: c.id, patch: { hookLine: e.target.value } })}
                className="mt-2 block h-24 w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-normal"
              />
            </label>
          )}
          {tab === '디자인' && (
            <div className="mt-6">
              <h3 className="font-bold">디자인</h3>
              <p className="mb-3 text-xs text-zinc-500">템플릿·폰트·화면 비율·자동 컷을 바꾸면 오른쪽 미리보기에 바로 보여요.</p>
              <DesignSettings />
            </div>
          )}
          {(tab === '장면' || tab === '댓글') && <p className="mt-6 text-sm text-zinc-400">프로토타입 범위 밖 ({tab} 탭은 목업만 있습니다)</p>}
        </section>

        <aside className="w-72 rounded-3xl border border-zinc-200 bg-white p-4">
          <h3 className="mb-3 font-bold">실시간 미리보기</h3>
          <Preview c={c} />
        </aside>
      </div>

      <BlockedToast />
      <footer className="fixed right-0 bottom-0 left-56 flex justify-between border-t border-zinc-200 bg-white px-10 py-4">
        <Button variant="ghost" onClick={() => dispatch({ type: 'goto', phase: 'candidates' })}>
          ← 후보로
        </Button>
        <Button onClick={() => dispatch({ type: 'make', now: Date.now() })} className="px-7 py-3">
          영상 만들기 ({selectedCount}개)
        </Button>
      </footer>
    </div>
  )
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="text-sm text-zinc-500">
      {label}
      <input type="number" step={0.5} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-1 block w-28 rounded-lg border border-zinc-200 px-3 py-2 text-ink" />
    </label>
  )
}
