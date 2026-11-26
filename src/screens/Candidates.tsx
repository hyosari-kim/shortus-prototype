import { useState } from 'react'
import { Preview } from '../design'
import { BLOCK_HELP, BLOCK_LABEL, blockedSummary, fmt, type Candidate } from '../model'
import { useStore } from '../store'
import { Button, StepHeader } from '../ui'

type Sort = 'time' | 'score'

// Part1 가설 2: 후보 목록 / 영상 미리보기 / 후보 정보와 AI 선정 이유의 3단 후보 선택 화면
export function Candidates() {
  const { state, dispatch } = useStore()
  const p = state.project!
  const [sort, setSort] = useState<Sort>('time')
  const list = [...p.candidates].sort((a, b) => (sort === 'time' ? a.range.start - b.range.start : b.score - a.score))
  const active = list.find((c) => c.id === p.activeId) ?? list[0]
  const go = (c: Candidate) => dispatch({ type: 'setActive', id: c.id })

  return (
    <div className="mx-auto max-w-7xl px-10 py-10 pb-32">
      <CandidatesHeader />

      <div className="flex border-y border-zinc-200">
        {/* 왼쪽: 후보 목록 */}
        <section className="w-72 shrink-0 py-4 pr-4">
          <div className="mb-2 grid grid-cols-2 rounded-xl bg-zinc-100 p-1 text-sm">
            {(
              [
                ['time', '원본 시간순'],
                ['score', 'AI 추천순'],
              ] as const
            ).map(([v, label]) => (
              <button key={v} onClick={() => setSort(v)} className={`rounded-lg py-1.5 font-semibold ${sort === v ? 'bg-white shadow-sm' : 'text-zinc-500'}`}>
                {label}
              </button>
            ))}
          </div>
          <ul className="space-y-1">
            {list.map((c) => (
              <li key={c.id}>
                <div
                  onClick={() => go(c)}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl p-3 ${c.id === active.id ? 'bg-brand-soft ring-2 ring-brand' : 'hover:bg-zinc-100'}`}
                >
                  <input
                    type="checkbox"
                    checked={c.selected}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => dispatch({ type: 'toggleSelect', id: c.id })}
                    aria-label={`후보 ${c.id.slice(1)} 고르기`}
                    className="mt-1 size-4 accent-brand"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-xs text-zinc-500">
                      <span>
                        {fmt(c.range.start)} – {fmt(c.range.end)}
                      </span>
                      <span>{c.score}점</span>
                    </div>
                    <div className="mt-0.5 line-clamp-2 text-sm font-semibold">{c.title}</div>
                    {c.blockedBy.length > 0 && <div className="mt-1 text-xs text-amber-700">ⓘ {c.blockedBy.map((r) => BLOCK_LABEL[r]).join(' · ')}</div>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* 가운데: 영상 */}
        <section className="grid min-w-0 flex-1 place-items-center border-x border-zinc-200 px-6 py-6">
          <div className="relative w-72">
            <Preview c={active} />
            <span className="absolute inset-0 m-auto grid size-14 place-items-center rounded-full bg-black/40 text-2xl text-white">▶</span>
          </div>
        </section>

        {/* 오른쪽: 후보 정보와 AI 선정 이유 */}
        <aside className="w-80 shrink-0 py-6 pl-6">
          <div className="text-sm text-zinc-500">후보 {active.id.slice(1)}</div>
          <h3 className="mt-1 text-xl font-bold">{active.title}</h3>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">길이</dt>
              <dd>{fmt(active.range.end - active.range.start)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">원본 구간</dt>
              <dd>
                {fmt(active.range.start)} – {fmt(active.range.end)}
              </dd>
            </div>
          </dl>

          <h4 className="mt-6 border-t border-zinc-200 pt-5 font-bold">AI 선정 이유</h4>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-black">{active.score}</span>
            <span className="text-zinc-400">/100</span>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {active.reasons.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="text-emerald-600">✓</span>
                {r}
              </li>
            ))}
          </ul>
          {active.blockedBy.map((r) => (
            <p key={r} className="mt-4 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
              ⓘ {BLOCK_HELP[r]}
            </p>
          ))}
          <Button variant={active.selected ? 'ghost' : 'primary'} className="mt-6 w-full py-3" onClick={() => dispatch({ type: 'toggleSelect', id: active.id })}>
            {active.selected ? '✓ 고름 · 빼기' : '이 후보 고르기'}
          </Button>
        </aside>
      </div>

      <CandidatesFooter />
    </div>
  )
}

function CandidatesHeader() {
  const { state, dispatch } = useStore()
  const p = state.project!
  const blocked = p.candidates.filter((c) => c.blockedBy.length > 0)
  const unselected = p.candidates.filter((c) => !c.selected)
  return (
    <StepHeader phase="candidates" title="2단계 · 후보">
      <h2 className="mt-3 text-3xl font-black">숏폼 후보 {p.candidates.length}개</h2>
      <p className="mt-2 text-zinc-500">만들 후보를 골라 주세요. 여러 개를 고를 수 있어요.</p>
      {blocked.length > 0 && (
        <div className="mt-5">
          <p className="text-sm text-amber-700">
            ⓘ 후보 {blocked.length}개를 자동으로 만들지 않았어요 · {blockedSummary(blocked)}
          </p>
          <p className="mt-1 text-sm">권리와 내용을 확인한 후보를 골라 주세요. 만들기를 누르면 확인한 것으로 기록돼요.</p>
          {unselected.length > 0 && (
            <Button variant="ghost" className="mt-3" onClick={() => dispatch({ type: 'selectAll' })}>
              남은 {unselected.length}개 모두 고르기
            </Button>
          )}
        </div>
      )}
    </StepHeader>
  )
}

function CandidatesFooter() {
  const { state, dispatch } = useStore()
  const p = state.project!
  const selectedCount = p.candidates.filter((c) => c.selected).length
  return (
    <footer className="fixed right-0 bottom-0 left-56 flex justify-end border-t border-zinc-200 bg-white px-10 py-4">
      <Button disabled={selectedCount === 0} onClick={() => dispatch({ type: 'goto', phase: 'edit' })} className="px-7 py-3">
        선택한 {selectedCount}개 편집하기
      </Button>
    </footer>
  )
}
