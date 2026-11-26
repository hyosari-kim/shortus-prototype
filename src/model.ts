// 퍼널 전체가 공유하는 데이터 형태와 상태 전이.
// 화면은 이 파일의 상태를 읽고 액션만 보낸다.

export type Phase = 'home' | 'analyzing' | 'candidates' | 'edit' | 'rendering' | 'result'
export type Mode = 'auto' | 'manual'
export type BlockReason = 'sentence_cut' | 'sports_broadcast'

export type Range = { start: number; end: number } // 초

export type Source = {
  kind: 'youtube' | 'article'
  url: string
  title: string
  durationSec: number
}

export type Design = {
  template: '기본' | '뉴스' | '임팩트'
  font: '제목 · 자막' | '굵게' | '손글씨'
  ratio: '9:16 여백 포함' | '9:16 꽉 채움'
  autoCut: boolean
  logo: boolean
  resolution: '720p' | '1080p'
}

export type Candidate = {
  id: string
  range: Range
  title: string
  hookLine: string
  score: number
  reasons: string[]
  blockedBy: BlockReason[]
  selected: boolean
  design?: Design // 없으면 project.sharedDesign을 쓴다
}

export type Project = {
  source: Source
  analyzeRange: Range
  mode: Mode
  phase: Phase
  phaseStartedAt: number // 분석·렌더 진행률은 저장하지 않고 이 시각에서 계산한다
  candidates: Candidate[]
  activeId: string | null
  sharedDesign: Design
  rightsConfirmedAt: number | null
}

// library: 내 숏폼 목록, work: 링크 입력부터 결과까지의 제작 흐름
export type View = 'library' | 'work'

export type State = {
  view: View
  credits: number
  creditLimit: number
  // 영상별 발행 시각. 키는 `${숏폼 id}:${영상 id}`, 진행 중인 숏폼은 숏폼 id가 'current'
  published: Record<string, number>
  project: Project | null
}

export const BLOCK_LABEL: Record<BlockReason, string> = {
  sentence_cut: '문장 중간 끊김',
  sports_broadcast: '스포츠 중계',
}
export const BLOCK_HELP: Record<BlockReason, string> = {
  sentence_cut: '말이 문장 중간에서 끝나서 자동으로 만들지 않았어요. 고른 뒤 구간 탭에서 끝을 늘릴 수 있어요.',
  sports_broadcast: '스포츠 중계로 보여서 자동으로 만들지 않았어요. 권리를 확인한 뒤 골라 주세요.',
}

export const ANALYZE_MS = 6000
export const RENDER_MS = 5000
export const ANALYZE_STAGES = ['가져오기', '말 듣기', '후보 고르기', '만들기'] as const

export const DEFAULT_DESIGN: Design = {
  template: '기본',
  font: '제목 · 자막',
  ratio: '9:16 여백 포함',
  autoCut: false,
  logo: false,
  resolution: '1080p',
}

export const initialState: State = {
  view: 'library',
  credits: 5,
  creditLimit: 50,
  published: { 'f2:v1': Date.parse('2026-11-24T15:10:00+09:00') },
  project: null,
}

// 분석 비용: 고른 구간 1분마다 4크레딧. 분석이 끝나 후보가 나올 때 차감한다.
export const analyzeCost = (r: Range) => Math.max(1, Math.ceil((r.end - r.start) / 60)) * 4

export function detectSource(input: string): Source | null {
  const text = input.trim()
  if (!text) return null
  if (/youtube\.com|youtu\.be/.test(text)) {
    return {
      kind: 'youtube',
      url: text,
      title: '[신인감독 김연경2] 195cm 베트남 프로팀의 높이를 막아라 드디어 완성된 블로킹 전략',
      durationSec: 28 * 60 + 40,
    }
  }
  return { kind: 'article', url: text, title: '기사로 만드는 숏폼', durationSec: 0 }
}

// 실제 서비스의 AI 분석 결과 대신 쓰는 고정 데이터.
// 유튜브(스포츠) 링크는 자동 생성이 막힌 후보가 섞이고, 기사는 모두 통과해 자동 완성이 끝까지 간다.
function fakeCandidates(source: Source, range: Range): Candidate[] {
  const at = (offset: number, len: number): Range => ({ start: range.start + offset, end: range.start + offset + len })
  const rows: Omit<Candidate, 'selected'>[] =
    source.kind === 'youtube'
      ? [
          { id: 'c1', range: at(2, 19), title: '오늘의 선발 라인업 공개', hookLine: '세터 티쳐야 분럭, 아웃사이드 히터 부이홍뭉,', score: 78, reasons: ['경기 시작 직전 긴장감', '선수 소개로 맥락이 짧게 잡힘'], blockedBy: ['sports_broadcast'] },
          { id: 'c2', range: at(30, 26), title: '지민경의 보답, 시작되는 1세트', hookLine: '과연 지민경은 위드메 배구에 보답할 수 있을까요?', score: 83, reasons: ['질문형 훅', '인물 서사가 한 구간에 담김'], blockedBy: ['sports_broadcast'] },
          { id: 'c3', range: at(5, 15), title: '분장하고 나타난 창피형? 현장 대혼란', hookLine: '야, 창피형이 무슨 분장을 하고 있어', score: 85, reasons: ['웃음 반응 구간', '첫 2초 안에 대사 시작'], blockedBy: [] },
          { id: 'c4', range: at(40, 17), title: '잘하다 까먹고? 지민경 선수의 기록 분석', hookLine: '잘하다 까먹고 잘하다 까먹고', score: 80, reasons: ['반복 대사로 리듬감'], blockedBy: ['sentence_cut'] },
        ]
      : [
          { id: 'c1', range: at(0, 30), title: '핵심만 30초 요약', hookLine: '이 기사, 세 줄이면 충분합니다', score: 88, reasons: ['기사 첫 문단이 명확함'], blockedBy: [] },
          { id: 'c2', range: at(0, 25), title: '숫자로 보는 이번 이슈', hookLine: '62.8%, 이 숫자가 말하는 것', score: 82, reasons: ['수치 강조형 훅'], blockedBy: [] },
        ]
  return rows.map((c) => ({ ...c, selected: c.blockedBy.length === 0 }))
}

export type Action =
  | { type: 'start'; source: Source; range: Range; mode: Mode; now: number }
  | { type: 'analysisDone'; now: number }
  | { type: 'toggleSelect'; id: string }
  | { type: 'selectAll' }
  | { type: 'goto'; phase: 'candidates' | 'edit' }
  | { type: 'setActive'; id: string }
  | { type: 'updateCandidate'; id: string; patch: Partial<Pick<Candidate, 'range' | 'title' | 'hookLine'>> }
  | { type: 'removeCandidate'; id: string }
  | { type: 'setDesign'; patch: Partial<Design> }
  | { type: 'make'; now: number }
  | { type: 'renderDone' }
  | { type: 'resetDemo' }
  | { type: 'openLibrary' }
  | { type: 'openProject' }
  | { type: 'newShort' }
  | { type: 'publish'; key: string; now: number }

const selectedOf = (p: Project) => p.candidates.filter((c) => c.selected)
export const designOf = (p: Project, c: Candidate) => c.design ?? p.sharedDesign
export const blockedSummary = (cs: Candidate[]) => {
  const counts = new Map<BlockReason, number>()
  for (const c of cs) for (const r of c.blockedBy) counts.set(r, (counts.get(r) ?? 0) + 1)
  return [...counts].map(([r, n]) => `${BLOCK_LABEL[r]} ${n}`).join(' · ')
}

// 새 숏폼을 시작하면 이전 진행 숏폼의 발행 기록은 의미가 없다
const withoutCurrent = (m: Record<string, number>) => Object.fromEntries(Object.entries(m).filter(([k]) => !k.startsWith('current:')))

export function reducer(state: State, action: Action): State {
  const p = state.project
  if (action.type === 'start') {
    return {
      ...state,
      published: withoutCurrent(state.published),
      project: {
        source: action.source,
        analyzeRange: action.range,
        mode: action.mode,
        phase: 'analyzing',
        phaseStartedAt: action.now,
        candidates: [],
        activeId: null,
        sharedDesign: DEFAULT_DESIGN,
        rightsConfirmedAt: null,
      },
    }
  }
  // 크레딧과 진행 중인 숏폼만 처음으로. 보고 있던 화면은 남긴다.
  if (action.type === 'resetDemo') return { ...initialState, view: state.view }
  if (action.type === 'openLibrary') return { ...state, view: 'library' }
  if (action.type === 'openProject') return { ...state, view: 'work' }
  // 프로토타입은 진행 중인 숏폼을 하나만 둔다. 새로 만들면 이전 것은 사라진다.
  if (action.type === 'newShort') return { ...state, view: 'work', project: null }
  if (action.type === 'publish') return { ...state, published: { ...state.published, [action.key]: state.published[action.key] ?? action.now } }
  if (!p) return state

  const put = (patch: Partial<Project>): State => ({ ...state, project: { ...p, ...patch } })
  const mapC = (fn: (c: Candidate) => Candidate) => p.candidates.map(fn)

  switch (action.type) {
    case 'analysisDone': {
      if (p.phase !== 'analyzing') return state // 타이머가 두 번 불려도 한 번만 차감
      const candidates = fakeCandidates(p.source, p.analyzeRange)
      const credits = state.credits - analyzeCost(p.analyzeRange)
      const nothingBlocked = candidates.every((c) => c.blockedBy.length === 0)
      // 자동 완성: 막힌 후보가 없으면 사람 손을 거치지 않고 바로 만든다.
      const phase: Phase = p.mode === 'auto' && nothingBlocked ? 'rendering' : 'candidates'
      return {
        ...state,
        credits,
        project: { ...p, candidates, phase, phaseStartedAt: action.now, activeId: candidates[0]?.id ?? null },
      }
    }
    case 'toggleSelect':
      return put({ candidates: mapC((c) => (c.id === action.id ? { ...c, selected: !c.selected } : c)) })
    case 'selectAll':
      return put({ candidates: mapC((c) => ({ ...c, selected: true })) })
    case 'goto': {
      const first = selectedOf(p)[0]
      const keepActive = p.candidates.some((c) => c.id === p.activeId && c.selected)
      return put({ phase: action.phase, activeId: keepActive ? p.activeId : (first?.id ?? null) })
    }
    case 'setActive':
      return put({ activeId: action.id })
    case 'updateCandidate':
      return put({ candidates: mapC((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) })
    case 'removeCandidate': {
      const candidates = mapC((c) => (c.id === action.id ? { ...c, selected: false } : c))
      const next = candidates.find((c) => c.selected)
      return put({ candidates, activeId: next?.id ?? null })
    }
    case 'setDesign':
      return put({
        candidates: mapC((c) => (c.id === p.activeId ? { ...c, design: { ...designOf(p, c), ...action.patch } } : c)),
      })
    case 'make': {
      if (selectedOf(p).length === 0) return state
      return put({ phase: 'rendering', phaseStartedAt: action.now, rightsConfirmedAt: p.rightsConfirmedAt ?? action.now })
    }
    case 'renderDone':
      if (p.phase !== 'rendering') return state
      return put({ phase: 'result' })
  }
  return state
}

export const fmt = (sec: number) => {
  const s = Math.max(0, Math.round(sec))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
