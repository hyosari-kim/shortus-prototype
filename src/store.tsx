import { createContext, useContext, useEffect, useReducer, type Dispatch, type ReactNode } from 'react'
import { initialState, reducer, type Action, type State } from './model'

const KEY = 'shortus-prototype:v8'
const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState, (init) => {
    const saved = localStorage.getItem(KEY)
    return saved ? (JSON.parse(saved) as State) : init
  })
  useEffect(() => localStorage.setItem(KEY, JSON.stringify(state)), [state])
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('StoreProvider 밖에서 useStore를 불렀습니다')
  return v
}
