import { Candidates } from './screens/Candidates'
import { Edit } from './screens/Edit'
import { Home } from './screens/Home'
import { Library } from './screens/Library'
import { Progress } from './screens/Progress'
import { Result } from './screens/Result'
import { StoreProvider, useStore } from './store'
import { Shell } from './ui'

function Screen() {
  const { state } = useStore()
  if (state.view === 'library') return <Library />
  switch (state.project?.phase ?? 'home') {
    case 'home':
      return <Home />
    case 'analyzing':
      return <Progress kind="analyzing" />
    case 'candidates':
      return <Candidates />
    case 'edit':
      return <Edit />
    case 'rendering':
      return <Progress kind="rendering" />
    case 'result':
      return <Result />
  }
}

export default function App() {
  return (
    <StoreProvider>
      <Shell>
        <Screen />
      </Shell>
    </StoreProvider>
  )
}
