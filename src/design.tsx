import { designOf, fmt, type Candidate, type Design } from './model'
import { useStore } from './store'

type Row = { key: keyof Design; label: string; options: Design[keyof Design][]; show?: (d: Design) => string }

// 각 설정 줄은 누를 때마다 다음 값으로 돌아간다. 세부 선택 화면은 목업 범위 밖.
const ROWS: Row[] = [
  { key: 'template', label: '템플릿', options: ['기본', '뉴스', '임팩트'] },
  { key: 'font', label: '폰트', options: ['제목 · 자막', '굵게', '손글씨'] },
  { key: 'ratio', label: '화면 비율', options: ['9:16 여백 포함', '9:16 꽉 채움'] },
  { key: 'autoCut', label: '자동 컷', options: [false, true], show: (d) => (d.autoCut ? '켬' : '끔') },
  { key: 'resolution', label: '세부 설정', options: ['1080p', '720p'], show: (d) => `${d.logo ? '로고 사용' : '로고 없음'} · mp4 · ${d.resolution} · 고화질` },
]

// 편집·디자인 화면의 디자인 탭. 위쪽 후보 탭에서 고른 후보에만 적용한다.
export function DesignSettings() {
  const { state, dispatch } = useStore()
  const p = state.project!
  const active = p.candidates.find((c) => c.id === p.activeId)!
  const d = designOf(p, active)
  return (
    <ul className="divide-y divide-zinc-200">
      {ROWS.map((r) => {
        const cur = d[r.key]
        const next = r.options[(r.options.indexOf(cur) + 1) % r.options.length]
        return (
          <li key={r.key}>
            <button className="flex w-full justify-between py-4 text-sm" onClick={() => dispatch({ type: 'setDesign', patch: { [r.key]: next } })}>
              <b>{r.label}</b>
              <span className="text-zinc-500">{r.show ? r.show(d) : String(cur)} ›</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export const HUES: Record<string, string> = { c1: 'from-teal-500 to-sky-700', c2: 'from-orange-500 to-rose-700', c3: 'from-amber-400 to-red-600', c4: 'from-indigo-500 to-fuchsia-700' }
const TEMPLATE_TEXT: Record<Design['template'], string> = {
  기본: 'text-white',
  뉴스: 'bg-brand px-2 py-1 text-white',
  임팩트: 'text-yellow-300 text-lg',
}
const FONT: Record<Design['font'], string> = { '제목 · 자막': 'font-bold', 굵게: 'font-black', 손글씨: 'font-serif italic' }

// 구간·자막·디자인을 모두 반영하는 미리보기
export function Preview({ c }: { c: Candidate }) {
  const { state } = useStore()
  const d = designOf(state.project!, c)
  const fill = d.ratio === '9:16 꽉 채움'
  return (
    <div className="relative flex aspect-[9/16] flex-col justify-center overflow-hidden rounded-xl bg-black">
      <div className={`bg-gradient-to-br ${HUES[c.id] ?? 'from-zinc-500 to-zinc-800'} ${fill ? 'absolute inset-0' : 'aspect-video'}`} />
      <div className="absolute top-10 right-4 left-4 text-center">
        <span className={`inline-block text-sm leading-snug ${TEMPLATE_TEXT[d.template]} ${FONT[d.font]}`}>{c.hookLine}</span>
      </div>
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 text-[10px] text-white">
        {d.template} · {fill ? '꽉 채움' : '여백'}
      </span>
      <span className="absolute right-2 bottom-2 rounded bg-black/60 px-1.5 text-xs text-white">{fmt(c.range.end - c.range.start)}</span>
    </div>
  )
}
