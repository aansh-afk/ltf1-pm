import React from 'react'
import ReactDOM from 'react-dom/client'
import AppWrapper from './AppWrapper.tsx'
import './styles/globals.css'
import { initConsoleCapture } from './utils/consoleCapture'

initConsoleCapture()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppWrapper />
  </React.StrictMode>,
)