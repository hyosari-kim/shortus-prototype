import { designOf, fmt } from '../model'
import { useStore } from '../store'
import { Button, StepHeader, Thumb } from '../ui'

export function Result() {
  const { state, dispatch } = useStore()
  const p = state.project!
  const made = p.candidates.filter((c) => c.selected)
  return (
    <div className="mx-auto max-w-6xl px-10 py-10">
      <StepHeader phase="result" title="6단계 · 결과">
        <h2 className="mt-3 text-3xl font-black">숏폼 {made.length}개를 만들었어요</h2>
        <p className="mt-2 text-zinc-500">
          {p.mode === 'auto' && !p.rightsConfirmedAt ? '자동 완성으로 끝까지 만들었어요.' : '고른 후보로 만들었어요.'}
          {p.rightsConfirmedAt && ` 권리 확인 기록: ${new Date(p.rightsConfirmedAt).toLocaleString('ko-KR')}`}
        </p>
      </StepHeader>
      <div className="flex flex-wrap gap-6">
        {made.map((c) => {
          const d = designOf(p, c)
          return (
            <div key={c.id} className="w-56">
              <Thumb c={c} overlay={<div className="absolute top-10 right-3 left-3 text-center text-sm font-black text-white">{c.title}</div>} />
              <div className="mt-2 text-sm font-bold">{c.title}</div>
              <div className="text-xs text-zinc-500">
                {fmt(c.range.end - c.range.start)} · {d.template} · {d.ratio} · {d.resolution}
              </div>
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => alert('프로토타입: 다운로드는 목업입니다')}>
                  다운로드
                </Button>
                <Button variant="ghost" className="px-3 py-1.5 text-xs" onClick={() => alert('프로토타입: 발행은 목업입니다')}>
                  발행
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-10 flex gap-3">
        <Button variant="ghost" onClick={() => dispatch({ type: 'goto', phase: 'edit' })}>
          편집·디자인 다시 고치기
        </Button>
        <Button onClick={() => dispatch({ type: 'newShort' })}>새 숏폼 만들기</Button>
      </div>
    </div>
  )
}
