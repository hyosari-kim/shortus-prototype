import { useEffect, useState } from 'react'
import { ANALYZE_MS, ANALYZE_STAGES, fmt, RENDER_MS } from '../model'
import { useStore } from '../store'
import { useNow } from '../ui'

// 분석(가져오기·말 듣기·후보 고르기)과 렌더(만들기)를 같은 화면에서 보여 준다.
// 진행률은 저장하지 않고 phaseStartedAt에서 계산해서, 새로고침해도 이어진다.
export function Progress({ kind }: { kind: 'analyzing' | 'rendering' }) {
  const { state, dispatch } = useStore()
  const p = state.project!
  const now = useNow()
  const total = kind === 'analyzing' ? ANALYZE_MS : RENDER_MS
  const ratio = Math.min(1, (now - p.phaseStartedAt) / total)
  const pct = Math.round(ratio * 100)
  const stage = kind === 'analyzing' ? Math.min(2, Math.floor(ratio * 3)) : 3
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    if (ratio >= 1) dispatch(kind === 'analyzing' ? { type: 'analysisDone', now: Date.now() } : { type: 'renderDone' })
  }, [ratio, kind, dispatch])

  const R = 46
  const C = 2 * Math.PI * R
  return (
    <div className="mx-auto flex max-w-5xl items-center gap-16 px-8 py-12">
      <div className="relative grid aspect-[9/16] w-[340px] shrink-0 place-items-center overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 to-rose-900">
        <div className="absolute top-8 left-6 right-6 truncate text-2xl font-black text-white/90">{p.source.url}</div>
        <svg viewBox="0 0 100 100" className="size-36 -rotate-90">
          <circle cx="50" cy="50" r={R} fill="rgba(0,0,0,.55)" stroke="rgba(255,255,255,.2)" strokeWidth="4" />
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-brand)" strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - ratio)} />
        </svg>
        <span className="absolute text-3xl font-bold text-white">{pct}%</span>
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="aspect-video w-24 rounded-lg bg-gradient-to-br from-orange-500 to-rose-700" />
          <div className="min-w-0">
            <div className="truncate text-sm font-bold">{p.source.url}</div>
            <div className="text-xs text-zinc-500">
              {p.source.kind === 'youtube' ? `유튜브 · ${fmt(p.analyzeRange.start)} – ${fmt(p.analyzeRange.end)}` : '기사'}
            </div>
          </div>
        </div>
        <h2 className="mt-6 text-xl font-bold">{kind === 'analyzing' ? '좋은 장면을 찾고 있어요' : '영상을 만들고 있어요'} …</h2>
        <ol className="mt-5 space-y-3">
          {ANALYZE_STAGES.map((s, i) => (
            <li key={s} className={`flex items-center gap-3 text-sm ${i <= stage ? 'font-bold text-ink' : 'text-zinc-400'}`}>
              <span className={`grid size-6 place-items-center rounded-full text-xs ${i < stage ? 'bg-ink text-white' : i === stage ? 'bg-brand text-white' : 'border border-zinc-300'}`}>
                {i < stage ? '✓' : i + 1}
              </span>
              {s}
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-zinc-500">🔔 닫아도 계속 만들어요. 다 되면 알림함에 남겨 둘게요</p>
        <label className="mt-5 flex items-center justify-between border-y border-zinc-200 py-4">
          <span>
            <span className="font-bold">완성 전 미리 보기</span>
            {preview && <span className="block text-xs text-zinc-500">켜면 끌 수 없어요</span>}
          </span>
          <input type="checkbox" role="switch" checked={preview} disabled={preview} onChange={() => setPreview(true)} className="size-5 accent-brand" />
        </label>
        <p className="mt-3 text-xs text-zinc-400">프로토타입: 실제 분석 대신 {total / 1000}초 타이머로 진행합니다.</p>
      </div>
    </div>
  )
}
