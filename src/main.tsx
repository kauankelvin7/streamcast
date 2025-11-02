import React from 'react'
import ReactDOM from 'react-dom/client'
import CastPlayerApp from './castPlayer'
import EmbedPlayer from './embedPlayer'
import './storage' // Inicializa o storage
import './index.css'

// Detecta se é modo embed (sem interface de admin)
const isEmbed = window.location.search.includes('embed=true') || window.location.pathname.includes('/embed');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isEmbed ? <EmbedPlayer /> : <CastPlayerApp />}
  </React.StrictMode>,
)
