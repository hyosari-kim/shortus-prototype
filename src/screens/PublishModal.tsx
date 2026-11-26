import { useState } from 'react'
import { fmt } from '../model'
import { Button, Modal } from '../ui'

export type PublishClip = { key: string; title: string; sec: number; hue: string; suggest?: string }
type Visibility = '비공개' | '일부공개' | '공개'

const CHANNEL = '내 채널'
// 제목이 연결어미로 끝나면 문장이 중간에 끊긴 것으로 본다
const CUT_ENDING = /(는데|은데|인데|고|며|서|,)$/

// Part2 가설 1: 목록에서 바로 여는 "채널로 발행" 모달. 실서비스의 발행 모달을 재현한다.
export function PublishModal({ clips, onPublish, onClose, onShowStatus }: { clips: PublishClip[]; onPublish: (keys: string[]) => void; onClose: () => void; onShowStatus: () => void }) {
  const single = clips.length === 1
  const [title, setTitle] = useState(clips[0].title)
  const [desc, setDesc] = useState('')
  const [visibility, setVisibility] = useState<Visibility>('비공개')
  const [channelOn, setChannelOn] = useState(true)
  const [extraOpen, setExtraOpen] = useState(false)
  const [started, setStarted] = useState(false)
  const cut = single && CUT_ENDING.test(title.trim())

  const start = () => {
    onPublish(clips.map((c) => c.key))
    setStarted(true)
  }

  return (
    <Modal title="채널로 발행" onClose={onClose} width="w-[960px]">
      <div className="rounded-xl border border-zinc-200 px-4 py-3 text-sm">
        <b>발행 전에 워터마크를 지울까요?</b> 유료 플랜으로 바꾼 뒤 다시 만들면 워터마크 없이 올라가요. <span className="underline">요금제 보기</span>
      </div>

      <div className="mt-5 flex gap-8">
        <div className="w-52 shrink-0">
          <div className={`relative grid aspect-[9/16] place-items-center overflow-hidden rounded-xl bg-gradient-to-br ${clips[0].hue}`}>
            <span className="absolute top-6 right-3 left-3 text-center text-sm font-black text-white">{single ? title : clips[0].title}</span>
            <span className="grid size-12 place-items-center rounded-full bg-white/90 text-ink">▶</span>
            {!single && <span className="absolute right-2 bottom-2 rounded bg-black/60 px-2 text-xs text-white">외 {clips.length - 1}개</span>}
          </div>
          <div className="mt-3 text-center text-sm font-bold">{single ? title : `영상 ${clips.length}개`}</div>
          {!single && (
            <ul className="mt-2 space-y-1 text-xs text-zinc-500">
              {clips.map((c) => (
                <li key={c.key} className="truncate">
                  · {c.title} ({fmt(c.sec)})
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-5">
          <section>
            <h3 className="mb-2 font-bold">어디에 올릴까요</h3>
            <div className="flex items-center gap-3 rounded-xl border-2 border-ink px-4 py-3">
              <input type="checkbox" checked={channelOn} disabled={started} onChange={(e) => setChannelOn(e.target.checked)} className="size-5 accent-ink" aria-label={`${CHANNEL} 선택`} />
              <span className="text-sm text-zinc-500">▶ YouTube</span>
              <b>{CHANNEL}</b>
              {started ? (
                <span className="text-sm text-zinc-500">✓ 발행됨</span>
              ) : (
                <div className="ml-auto inline-flex rounded-lg bg-zinc-100 p-1 text-sm">
                  {(['비공개', '일부공개', '공개'] as const).map((v) => (
                    <button key={v} onClick={() => setVisibility(v)} className={`rounded-md px-3 py-1.5 ${visibility === v ? 'bg-white font-bold shadow-sm' : 'text-zinc-500'}`}>
                      {v}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          {single && (
            <section>
              <div className="mb-2 flex justify-between">
                <h3 className="font-bold">제목</h3>
                <span className="text-sm text-zinc-500">{title.length}/100</span>
              </div>
              <input value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-xl bg-zinc-100 px-4 py-3" />
              {cut && (
                <div className="mt-2">
                  <p className="text-sm text-amber-700">ⓘ 제목이 문장 중간에서 끊겨 보여요. 발행 전에 한 번 다듬어 보세요.</p>
                  {clips[0].suggest && (
                    <button onClick={() => setTitle(clips[0].suggest!)} className="mt-2 rounded-full border border-zinc-200 px-4 py-1.5 text-sm">
                      「{clips[0].suggest}」로 바꾸기
                    </button>
                  )}
                </div>
              )}
            </section>
          )}

          <section>
            <div className="mb-2 flex justify-between">
              <h3 className="font-bold">
                설명 <span className="font-normal text-zinc-500">(선택)</span>
              </h3>
              <span className="text-sm text-zinc-500">{desc.length}/5000</span>
            </div>
            <textarea value={desc} maxLength={5000} onChange={(e) => setDesc(e.target.value)} className="h-24 w-full rounded-xl bg-zinc-100 px-4 py-3" />
          </section>

          <section className="rounded-xl border border-zinc-200 px-4 py-3">
            <button onClick={() => setExtraOpen(!extraOpen)} className="flex w-full items-center justify-between text-left">
              <span>
                <b>YouTube 추가 설정</b>
                <span className="block text-xs text-zinc-500">태그 없음 · 지금 업로드 · 구독자 알림 켬 · AI 합성 표시 켬</span>
              </span>
              <span>{extraOpen ? '▴' : '▾'}</span>
            </button>
            {extraOpen && <p className="mt-3 text-xs text-zinc-400">프로토타입: 태그·예약 업로드 설정은 목업이에요.</p>}
          </section>

          <p className="rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-600">
            ⓘ 이 영상에는 AI가 합성한 음성·자막이 포함됩니다. 플랫폼이 제공하는 합성 미디어 표시는 각 플랫폼 정책에 따라 적용되며, 게시 내용에 대한 책임은 채널 소유자에게 있습니다.
          </p>
        </div>
      </div>

      <footer className="mt-6 flex items-center justify-between gap-4 border-t border-zinc-100 pt-5">
        {started ? (
          <div className="flex-1 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <b>✓ 발행을 시작했어요</b>
            <p className="mt-1">올라가는 진행은 발행 현황에서 볼 수 있어요. 이 창은 닫아도 됩니다.</p>
          </div>
        ) : (
          <div className="text-sm">
            <b>총 {channelOn ? clips.length : 0}건 업로드</b>
            <div className="text-zinc-500">{channelOn ? `${CHANNEL}로 ${clips.length}건 (${visibility})` : '올릴 채널을 골라 주세요'}</div>
          </div>
        )}
        <div className="flex shrink-0 gap-2">
          <Button variant="ghost" onClick={onClose}>
            {started ? '닫기' : '취소'}
          </Button>
          {started ? (
            <Button onClick={onShowStatus}>발행 현황 보기</Button>
          ) : (
            <Button disabled={!channelOn || (single && !title.trim())} onClick={start}>
              발행 시작
            </Button>
          )}
        </div>
      </footer>
    </Modal>
  )
}
