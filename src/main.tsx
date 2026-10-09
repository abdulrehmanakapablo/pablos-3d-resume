import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initStudio } from './cinematics/theatre'

const root = document.getElementById('root')
if (!root) throw new Error('#root missing')

void initStudio().finally(() => {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})