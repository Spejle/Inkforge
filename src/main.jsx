import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadInstalled } from './plugins/registry'
import { loadFeatures } from './plugins/features'

import { feature } from './plugins/features'

// ?player=1 is the Fog of war player window: the map only, sent by the GM's window
const player = new URLSearchParams(window.location.search).has('player')

Promise.all([loadInstalled(), loadFeatures()]).finally(() => {
  const PlayerView = player ? feature('fog')?.PlayerView : null
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      {player ? (PlayerView ? <PlayerView /> : <p style={{ padding: 24 }}>Install the Fog of war plugin to use the player view.</p>) : <App />}
    </StrictMode>,
  )
})
