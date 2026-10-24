import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { loadInstalled } from './plugins/registry'
import { loadFeatures } from './plugins/features'

Promise.all([loadInstalled(), loadFeatures()]).finally(() => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
))
