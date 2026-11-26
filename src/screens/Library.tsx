import { useEffect, useState } from 'react'
import { HUES } from '../design'
import { fmt, type Project } from '../model'
import { useStore } from '../store'
import { Button, Modal } from '../ui'
import { PublishModal } from './PublishModal'

type Status = 'todo' | 'making' | 'done'
type StepState = 'done' | 'doing' | 'wait'
type Clip = { id: string; title: string; sec: number; hue: string; suggest?: string }
type Row = {
  id: string
  title: string
  kind: 'video' | 'article'
  status: Status
  badge: string
  updated: string
  hue: string
  steps: StepState[]
  picked: [number, number] // [고른 후보, 전체 후보]
  clips: Clip[]
  current: boolean
}

const STEP_LABELS = ['영상 분석', '구간 찾기', '영상 생성', '품질 검사']
const DONE4: StepState[] = ['done', 'done', 'done', 'done']
const LOAD_MS = 600 // 펼칠 때 그 숏폼의 영상만 불러오는 것을 흉내 낸다

// 지난 숏폼은 고정 데이터. 진행 중인 숏폼 하나만 제작 흐름으로 열 수 있다.
const FIXTURES: Row[] = [
  {
    id: 'f1', title: '[신인감독 김연경2] 7회 선공개 그렇게 할 거면 넌 여기서 살아', kind: 'video', status: 'done', badge: '완성', updated: '11. 24. 오후 03:57', hue: HUES.c2, steps: DONE4, picked: [1, 4], current: false,
    clips: [{ id: 'v1', title: '분장하고 나타난 창피형? 현장 대혼란', sec: 15, hue: HUES.c3 }],
  },
  {
    id: 'f2', title: '"강남 엄청 떨어져…분양 걱정 말고 지어라" 네이트 뉴스', kind: 'article', status: 'done', badge: '완성', updated: '11. 24. 오후 02:48', hue: HUES.c1, steps: DONE4, picked: [2, 2], current: false,
    clips: [
      { id: 'v1', title: '핵심만 30초 요약', sec: 30, hue: HUES.c1 },
      { id: 'v2', title: '숫자로 보는 분양 시장', sec: 25, hue: HUES.c4 },
    ],
  },
  {
    id: 'f3', title: '"내년 AI 업계 자금난 닥친다"…현금 부족 사태 경고', kind: 'article', status: 'done', badge: '완성', updated: '11. 24. 오후 02:25', hue: HUES.c4, steps: DONE4, picked: [2, 2], current: false,
    clips: [
      { id: 'v1', title: 'AI 업계 자금난, 3줄 정리', sec: 28, hue: HUES.c4 },
      { id: 'v2', title: '현금 부족 경고가 나온 이유', sec: 22, hue: HUES.c2 },
    ],
  },
  {
    id: 'f4', title: '[신인감독 김연경2] 7회 선공개 그렇게 할 거면 넌 여기서 살아', kind: 'video', status: 'done', badge: '완성', updated: '11. 26. 오전 11:54', hue: HUES.c3, steps: DONE4, picked: [1, 4], current: false,
    clips: [{ id: 'v1', title: '김연경 감독의 일침 타이밍은 좋았는데', sec: 16, hue: HUES.c2, suggest: '김연경 감독의 화끈한 피드백' }],
  },
]

function summarize(p: Project): Row {
  const selected = p.candidates.filter((c) => c.selected)
  const needsCheck = p.candidates.some((c) => c.blockedBy.length > 0) && !p.rightsConfirmedAt
  const making = p.phase === 'analyzing' || p.phase === 'rendering'
  const analyzed = p.phase !== 'analyzing'
  const done = p.phase === 'result'
  return {
    id: 'current',
    title: p.source.title,
    kind: p.source.kind === 'youtube' ? 'video' : 'article',
    status: done ? 'done' : making ? 'making' : 'todo',
    badge: done ? '완성' : making ? '만드는 중' : needsCheck ? '확인 필요' : '할 일',
    updated: new Date(p.phaseStartedAt).toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit' }),
    hue: 'from-orange-500 to-rose-700',
    steps: [analyzed ? 'done' : 'doing', analyzed ? 'done' : 'wait', done ? 'done' : p.phase === 'rendering' ? 'doing' : 'wait', done ? 'done' : 'wait'],
    picked: [selected.length, p.candidates.length],
    clips: done ? selected.map((c) => ({ id: c.id, title: c.title, sec: c.range.end - c.range.start, hue: HUES[c.id] ?? HUES.c1 })) : [],
    current: true,
  }
}

const BADGE_TONE: Record<string, string> = {
  완성: 'bg-emerald-50 text-emerald-700',
  '확인 필요': 'bg-zinc-100 text-zinc-600',
  '만드는 중': 'bg-sky-50 text-sky-700',
}

export function Library() {
  const { state, dispatch } = useStore()
  const rows = [...(state.project ? [summarize(state.project)] : []), ...FIXTURES]
  const [status, setStatus] = useState<Status | 'all'>('all')
  const [kind, setKind] = useState<Row['kind'] | 'all'>('all')
  const [q, setQ] = useState('')
  const [picked, setPicked] = useState(rows[0].id)
  const [open, setOpen] = useState<string | null>(null)
  const [viewing, setViewing] = useState<{ row: Row; clip: Clip } | null>(null)
  const [publishing, setPublishing] = useState<{ row: Row; clips: Clip[] } | null>(null)
  const [showTips, setShowTips] = useState(true)

  const shown = rows.filter((r) => (status === 'all' || r.status === status) && (kind === 'all' || r.kind === kind) && r.title.includes(q.trim()))
  const sel = rows.find((r) => r.id === picked) ?? rows[0]
  const count = (s: Status) => rows.filter((r) => r.status === s).length
  const isPublished = (r: Row, c: Clip) => Boolean(state.published[`${r.id}:${c.id}`])
  const publishedCount = (r: Row) => r.clips.filter((c) => isPublished(r, c)).length
  const requestPublish = (row: Row, clips: Clip[]) => setPublishing({ row, clips })

  return (
    <div className="flex gap-8 px-10 py-10">
      <div className="min-w-0 flex-1">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-black">
            내 숏폼 <span className="ml-2 text-sm font-normal text-zinc-500">오늘 {state.project ? 1 : 0}편 생성</span>
          </h1>
          <Button className="px-6 py-3" onClick={() => dispatch({ type: 'newShort' })}>
            + 새 숏폼
          </Button>
        </header>

        {showTips && (
          <section className="mt-8">
            <div className="flex justify-between text-sm text-zinc-500">
              이런 것도 할 수 있어요
              <button aria-label="안내 닫기" onClick={() => setShowTips(false)}>
                ✕
              </button>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-4">
              {[
                ['자동 발행', 'RSS·유튜브 채널에 새 소재가 올라오면 숏폼을 만들어 정해진 시간에 채널로 올려요.'],
                ['보이스 클론', '내 목소리를 등록해 내레이션으로 쓸 수 있어요.'],
                ['API·MCP', 'AI 에이전트에서 바로 숏폼을 만들 수 있어요.'],
              ].map(([t, d]) => (
                <div key={t} className="rounded-2xl border border-zinc-200 bg-white p-5">
                  <div className="font-bold">{t}</div>
                  <p className="mt-2 text-sm text-zinc-500">{d}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-2 text-sm">
          {(
            [
              ['all', '전체', rows.length],
              ['todo', '할 일', count('todo')],
              ['making', '만드는 중', count('making')],
              ['done', '완성', count('done')],
            ] as const
          ).map(([v, label, n]) => (
            <Pill key={v} on={status === v} onClick={() => setStatus(v)}>
              {label} {n}
            </Pill>
          ))}
          <span className="mx-2 h-5 w-px bg-zinc-200" />
          {(
            [
              ['all', '모든 종류'],
              ['article', '글·기사'],
              ['video', '영상'],
            ] as const
          ).map(([v, label]) => (
            <Pill key={v} on={kind === v} onClick={() => setKind(v)}>
              {label}
            </Pill>
          ))}
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="제목으로 검색" className="ml-auto w-64 rounded-full border border-zinc-200 bg-white px-4 py-2" />
        </div>

        <ul className="mt-5 space-y-3">
          {shown.map((r) => {
            const expanded = open === r.id
            const pub = publishedCount(r)
            return (
              <li key={r.id} className={`rounded-2xl border-2 bg-white ${r.id === sel.id ? 'border-brand' : 'border-transparent shadow-sm'}`}>
                <div onClick={() => setPicked(r.id)} className="flex cursor-pointer items-center gap-4 p-4">
                  <div className={`h-16 w-10 shrink-0 rounded-md bg-gradient-to-br ${r.hue}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-bold">{r.title}</div>
                    <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500">
                      <span>수정 {r.updated}</span>
                      <span className="text-zinc-300">|</span>
                      <span>
                        영상 <b className="text-ink">{r.clips.length}</b> · 발행 <b className={pub < r.clips.length ? 'text-amber-600' : 'text-ink'}>{pub}</b>
                      </span>
                    </div>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONE[r.badge] ?? 'bg-amber-50 text-amber-700'}`}>{r.badge}</span>
                  <button
                    disabled={r.clips.length === 0}
                    aria-expanded={expanded}
                    onClick={(e) => {
                      e.stopPropagation()
                      setPicked(r.id)
                      setOpen(expanded ? null : r.id)
                    }}
                    className="rounded-full border border-zinc-200 px-3 py-2 text-sm font-semibold disabled:text-zinc-300"
                  >
                    영상 {expanded ? '접기 ▴' : '보기 ▾'}
                  </button>
                  <button
                    aria-label="열기"
                    onClick={(e) => {
                      e.stopPropagation()
                      openProject(r)
                    }}
                    className="grid size-10 place-items-center rounded-full border border-zinc-200"
                  >
                    →
                  </button>
                </div>
                {expanded && <ClipList key={r.id} row={r} isPublished={isPublished} onPublish={(clips) => requestPublish(r, clips)} onView={(clip) => setViewing({ row: r, clip })} />}
              </li>
            )
          })}
          {shown.length === 0 && <li className="py-10 text-center text-sm text-zinc-400">조건에 맞는 숏폼이 없어요.</li>}
        </ul>
      </div>

      <aside className="sticky top-10 h-fit w-80 shrink-0 rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-bold">숏폼 상세</h2>
        <div className="mt-4 flex gap-4">
          <div className={`relative aspect-[9/16] w-28 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${sel.hue}`}>
            <span className="absolute top-2 right-2 left-2 line-clamp-2 text-xs font-bold text-white">{sel.title}</span>
          </div>
          <dl className="space-y-2 text-sm">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BADGE_TONE[sel.badge] ?? 'bg-amber-50 text-amber-700'}`}>{sel.badge}</span>
            <Stat label="후보" value={`${sel.picked[0]}/${sel.picked[1]}`} />
            <Stat label="완성 클립" value={sel.clips.length} />
            <Stat label="발행" value={publishedCount(sel)} />
          </dl>
        </div>
        <ol className="mt-6 space-y-4">
          {STEP_LABELS.map((label, i) => (
            <li key={label} className="flex items-center gap-3 text-sm">
              <span
                className={`grid size-6 place-items-center rounded-full text-xs ${
                  sel.steps[i] === 'done' ? 'border border-emerald-500 text-emerald-600' : sel.steps[i] === 'doing' ? 'bg-brand text-white' : 'border border-zinc-300 text-zinc-400'
                }`}
              >
                {sel.steps[i] === 'done' ? '✓' : i + 1}
              </span>
              <div>
                <div className="font-bold">{label}</div>
                <div className="text-xs text-zinc-500">{{ done: '완료', doing: '진행 중', wait: '대기' }[sel.steps[i]]}</div>
              </div>
            </li>
          ))}
        </ol>
        <Button className="mt-6 w-full py-3" onClick={() => openProject(sel)}>
          {!sel.current ? '열기' : sel.status === 'done' ? '결과 보기' : sel.status === 'making' ? '진행 보기' : '검수하기'}
        </Button>
        {!sel.current && <p className="mt-2 text-center text-xs text-zinc-400">프로토타입: 지난 숏폼은 고정 데이터라 열리지 않아요</p>}
      </aside>

      {viewing && (
        <Modal title={viewing.clip.title} sub={`${fmt(viewing.clip.sec)} · ${viewing.row.title}`} onClose={() => setViewing(null)}>
          <div className={`mx-auto grid aspect-[9/16] w-60 place-items-center rounded-2xl bg-gradient-to-br ${viewing.clip.hue}`}>
            <span className="grid size-14 place-items-center rounded-full bg-black/40 text-2xl text-white">▶</span>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setViewing(null)}>
              닫기
            </Button>
            <PublishButton
              published={isPublished(viewing.row, viewing.clip)}
              onPublish={() => {
                setViewing(null)
                requestPublish(viewing.row, [viewing.clip])
              }}
            />
          </div>
        </Modal>
      )}

      {publishing && (
        <PublishModal
          clips={publishing.clips.map((c) => ({ key: `${publishing.row.id}:${c.id}`, title: c.title, sec: c.sec, hue: c.hue, suggest: c.suggest }))}
          onPublish={(keys) => keys.forEach((key) => dispatch({ type: 'publish', key, now: Date.now() }))}
          onClose={() => setPublishing(null)}
          onShowStatus={() => {
            setPicked(publishing.row.id)
            setOpen(publishing.row.id)
            setPublishing(null)
          }}
        />
      )}
    </div>
  )

  function openProject(r: Row) {
    if (r.current) dispatch({ type: 'openProject' })
  }
}

// 펼친 숏폼의 영상 목록. 열 때 그 숏폼 것만 불러온다.
function ClipList(props: { row: Row; isPublished: (r: Row, c: Clip) => boolean; onPublish: (clips: Clip[]) => void; onView: (c: Clip) => void }) {
  const { row } = props
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), LOAD_MS)
    return () => clearTimeout(t)
  }, [])
  const unpublished = row.clips.filter((c) => !props.isPublished(row, c))

  return (
    <div className="border-t border-zinc-100 px-4 pt-3 pb-4">
      <div className="mb-2 flex items-center justify-between text-xs text-zinc-500">
        <span>
          영상 {row.clips.length}개 · 발행 {row.clips.length - unpublished.length}개
        </span>
        {loaded && unpublished.length > 1 && (
          <button className="font-semibold text-brand" onClick={() => props.onPublish(unpublished)}>
            남은 {unpublished.length}개 모두 발행
          </button>
        )}
      </div>
      {!loaded ? (
        <ul className="space-y-2" aria-label="영상 불러오는 중">
          {row.clips.map((c) => (
            <li key={c.id} className="h-16 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </ul>
      ) : (
        <ul className="space-y-2">
          {row.clips.map((c) => {
            const published = props.isPublished(row, c)
            return (
              <li key={c.id} className="flex items-center gap-3 rounded-xl bg-zinc-50 p-2 pr-3">
                <button onClick={() => props.onView(c)} aria-label={`${c.title} 보기`} className={`relative grid h-14 w-8 shrink-0 place-items-center rounded bg-gradient-to-br ${c.hue}`}>
                  <span className="text-[10px] text-white">▶</span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{c.title}</div>
                  <div className="text-xs text-zinc-500">{fmt(c.sec)}</div>
                </div>
                <span className={`text-xs font-semibold ${published ? 'text-emerald-600' : 'text-zinc-400'}`}>{published ? '발행됨' : '미발행'}</span>
                <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => props.onView(c)}>
                  보기
                </Button>
                <PublishButton small published={published} onPublish={() => props.onPublish([c])} />
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function PublishButton({ published, onPublish, small }: { published: boolean; onPublish: () => void; small?: boolean }) {
  const size = small ? 'px-3 py-1.5 text-xs' : ''
  if (published) {
    return (
      <Button variant="ghost" disabled className={`${size} text-emerald-600`}>
        ✓ 발행됨
      </Button>
    )
  }
  return (
    <Button className={size} onClick={onPublish}>
      발행
    </Button>
  )
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`rounded-full border px-4 py-1.5 font-semibold ${on ? 'border-ink bg-ink text-white' : 'border-zinc-200 bg-white'}`}>
      {children}
    </button>
  )
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="font-bold">{value}</dd>
    </div>
  )
}
