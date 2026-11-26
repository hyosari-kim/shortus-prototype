import { useState } from 'react'
import { analyzeCost, detectSource, fmt, type Mode, type Range } from '../model'
import { useStore } from '../store'
import { Button, Modal } from '../ui'

const SAMPLE_YT = 'https://www.youtube.com/watch?v=1zyv2zJluVA'
const SAMPLE_ARTICLE = 'https://news.example.com/article/ai-funding'

export function Home() {
  const { state, dispatch } = useStore()
  const [input, setInput] = useState('')
  const [range, setRange] = useState<Range>({ start: 480, end: 540 })
  const [modal, setModal] = useState<'mode' | 'range' | null>(null)
  const [mode, setMode] = useState<Mode>('auto')
  const [rightsOk, setRightsOk] = useState(true)

  const source = detectSource(input)
  const effectiveRange = source?.kind === 'youtube' ? range : { start: 0, end: 60 }
  const cost = analyzeCost(effectiveRange)
  const left = state.credits - cost

  const start = () => {
    if (!source) return
    dispatch({ type: 'start', source, range: effectiveRange, mode, now: Date.now() })
  }
  const pickMode = (m: Mode) => {
    setMode(m)
    // 기사·글은 고를 구간이 없어서 바로 분석한다
    if (source?.kind === 'youtube') setModal('range')
    else {
      setModal(null)
      if (source) dispatch({ type: 'start', source, range: effectiveRange, mode: m, now: Date.now() })
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-16">
      <h1 className="text-center text-5xl leading-tight font-black">
        링크 하나면
        <br />
        숏폼이 나와요
      </h1>
      <p className="mt-4 text-center text-zinc-500">기사·유튜브 링크 하나로 숏폼 제작까지 한 번에</p>

      <form
        className="mt-10 flex items-center gap-3 rounded-full border-2 border-ink bg-white p-2 pl-5 shadow-[0_0_0_6px_var(--color-brand-soft)]"
        onSubmit={(e) => {
          e.preventDefault()
          if (source) setModal('mode')
        }}
      >
        {source && (
          <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            ✓ {source.kind === 'youtube' ? '유튜브 영상' : '기사 링크'}
          </span>
        )}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="기사·유튜브 링크나 글을 붙여넣으세요"
          className="min-w-0 flex-1 bg-transparent py-3 text-lg outline-none"
        />
        <Button type="submit" disabled={!source} className="px-7 py-3.5 text-lg">
          만들기 →
        </Button>
      </form>

      <div className="mt-4 flex gap-2 text-sm text-zinc-500">
        <span>예시로 채우기</span>
        <button className="underline" onClick={() => setInput(SAMPLE_YT)}>
          유튜브(스포츠)
        </button>
        <button className="underline" onClick={() => setInput(SAMPLE_ARTICLE)}>
          기사
        </button>
      </div>

      {source?.kind === 'youtube' && (
        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-5">
          <div className="flex gap-4">
            <div className="aspect-video w-40 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-rose-700" />
            <div>
              <div className="font-bold">{source.title}</div>
              <div className="mt-1 text-sm text-zinc-500">{Math.floor(source.durationSec / 60)}분 {source.durationSec % 60}초</div>
            </div>
          </div>
          <RangePicker duration={source.durationSec} range={range} onChange={setRange} />
          <div className="mt-3 flex justify-between text-sm">
            <span>
              사용 크레딧 <b>{cost}</b>
            </span>
            <span className={left < 0 ? 'text-brand' : ''}>
              분석 후 남는 크레딧 <b>{left}</b>
            </span>
          </div>
        </section>
      )}

      {modal === 'mode' && (
        <Modal title="어떻게 만들까요?" onClose={() => setModal(null)}>
          {left < 0 && (
            <div className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800">
              <span>
                크레딧이 부족해요 · 필요 {cost} · 남은 {state.credits}
              </span>
              <Button variant="ghost" className="shrink-0 px-4 py-1.5 text-xs" onClick={() => dispatch({ type: 'resetDemo' })}>
                데모 초기화
              </Button>
            </div>
          )}
          <ModeOption
            highlight
            title="자동 완성"
            badge="추천"
            desc="알아서 끝까지 만들어요"
            disabled={!rightsOk || left < 0}
            onClick={() => pickMode('auto')}
          />
          <ModeOption title="직접 편집" desc="구간·디자인을 직접 골라요" disabled={!rightsOk || left < 0} onClick={() => pickMode('manual')} />
          {left >= 0 && (
            <p className="mt-4 text-center text-xs text-zinc-500">
              이번에 {cost}크레딧 · 남은 {state.credits} · 분석할 때 차감
            </p>
          )}
          <label className="mt-3 flex items-start justify-center gap-2 text-xs text-zinc-600">
            <input type="checkbox" checked={rightsOk} onChange={(e) => setRightsOk(e.target.checked)} className="mt-0.5 accent-brand" />
            권리를 보유했거나 권리자의 허락을 받은 영상만 넣어 주세요.
          </label>
        </Modal>
      )}

      {modal === 'range' && (
        <Modal title="어느 부분을 분석할까요?" sub={`고른 구간을 분석하면 남은 크레딧 ${state.credits} 중 ${cost}를 써요.`} onClose={() => setModal(null)}>
          <div className="flex items-center justify-between rounded-xl border-2 border-ink p-4">
            <div>
              <div className="font-bold">◉ 고른 구간</div>
              <div className="text-xs text-zinc-500">
                {fmt(range.start)} – {fmt(range.end)} · {Math.round((range.end - range.start) / 60)}분
              </div>
            </div>
            <div className="text-right">
              <div className="font-bold">{cost}크레딧</div>
              <div className={`text-xs ${left < 0 ? 'text-brand' : 'text-amber-600'}`}>{left < 0 ? '크레딧이 부족해요' : `분석 후 ${left} 남음`}</div>
            </div>
          </div>
          <button className="mt-3 w-full rounded-xl border border-zinc-200 p-4 text-left" onClick={() => setModal(null)}>
            <div className="font-bold">○ 직접 고르기</div>
            <div className="text-xs text-zinc-500">창을 닫고 구간 칸에서 시작·끝을 정해요</div>
          </button>
          <p className="mt-4 text-xs text-zinc-500">분석이 끝나 후보가 나오면 차감돼요. 분석에 실패하면 차감되지 않아요.</p>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setModal(null)}>
              취소
            </Button>
            <Button disabled={left < 0} onClick={start}>
              {Math.round((range.end - range.start) / 60)}분 분석 · {cost}크레딧
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function RangePicker({ duration, range, onChange }: { duration: number; range: Range; onChange: (r: Range) => void }) {
  const len = range.end - range.start
  return (
    <div className="mt-5">
      <div className="relative h-10 rounded-lg bg-zinc-100">
        <div
          className="absolute inset-y-0 rounded-lg border-2 border-brand bg-brand/15"
          style={{ left: `${(range.start / duration) * 100}%`, width: `${(len / duration) * 100}%` }}
        />
        <input
          type="range"
          aria-label="분석 시작 위치"
          min={0}
          max={duration - len}
          step={10}
          value={range.start}
          onChange={(e) => onChange({ start: +e.target.value, end: +e.target.value + len })}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
        />
      </div>
      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="border-b border-dashed border-zinc-400">
          {fmt(range.start)} – {fmt(range.end)} · {Math.round(len / 60)}분
        </span>
        <span className="flex gap-1">
          {[1, 2].map((m) => (
            <button
              key={m}
              onClick={() => onChange({ start: Math.min(range.start, duration - m * 60), end: Math.min(range.start, duration - m * 60) + m * 60 })}
              className={`rounded-full px-3 py-1 text-xs ${len === m * 60 ? 'bg-ink text-white' : 'bg-zinc-100'}`}
            >
              {m}분
            </button>
          ))}
          <button onClick={() => onChange({ start: 0, end: 60 })} className="rounded-full bg-zinc-100 px-3 py-1 text-xs">
            앞 1분
          </button>
        </span>
      </div>
    </div>
  )
}

function ModeOption(props: { title: string; desc: string; badge?: string; highlight?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      disabled={props.disabled}
      onClick={props.onClick}
      className={`mb-3 flex w-full items-center justify-between rounded-2xl border-2 p-4 text-left disabled:opacity-40 ${props.highlight ? 'border-brand bg-brand-soft' : 'border-zinc-200'}`}
    >
      <div>
        <div className="font-bold">
          {props.title}
          {props.badge && <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[11px] text-white">{props.badge}</span>}
        </div>
        <div className="text-sm text-zinc-500">{props.desc}</div>
      </div>
      <span>›</span>
    </button>
  )
}
