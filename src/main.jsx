import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Setting from '../src/setting/index.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Setting />
  </StrictMode>,
)
