import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function EmbedCodePanel() {
  const [copied, setCopied] = useState(false);
  const [codeType, setCodeType] = useState<'html' | 'react'>('html');
  const embedUrl = `${window.location.origin}/embed`;

  const htmlCode = `<iframe\n  src="${embedUrl}"\n  width="100%"\n  height="100%"\n  frameborder="0"\n  allowfullscreen\n  allow="autoplay; fullscreen"\n></iframe>`;
  
  const reactCode = `<iframe\n  src="${embedUrl}"\n  style={{ width: '100%', height: '100%', border: 'none' }}\n  allowFullScreen\n  allow="autoplay; fullscreen"\n/>`;

  const iframeCode = codeType === 'html' ? htmlCode : reactCode;

  function handleCopy() {
    navigator.clipboard.writeText(iframeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{
      width: '100%',
      background: '#141418',
      border: '1px solid rgba(255,255,255,0.05)',
      borderRadius: 24,
      padding: '28px 32px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
    }}>
      <p style={{
        color: 'rgba(255,255,255,0.5)',
        fontFamily: "'Inter', sans-serif",
        fontSize: 14,
        lineHeight: 1.6,
        marginBottom: 24,
        maxWidth: 560,
      }}>
        Cole este código no seu site. Se estiver usando Next.js ou React, selecione a aba "React" para evitar erros de compilação (Server-side exception).
      </p>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          onClick={() => setCodeType('html')}
          style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            background: codeType === 'html' ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: codeType === 'html' ? '#fff' : 'rgba(255,255,255,0.4)'
          }}
        >
          HTML Padrão
        </button>
        <button
          onClick={() => setCodeType('react')}
          style={{
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, fontFamily: "'Inter', sans-serif", cursor: 'pointer', border: 'none', transition: 'all 0.2s',
            background: codeType === 'react' ? 'rgba(97,218,251,0.15)' : 'transparent',
            color: codeType === 'react' ? '#61dafb' : 'rgba(255,255,255,0.4)'
          }}
        >
          React / Next.js
        </button>
      </div>

      {/* macOS Code Block */}
      <div style={{
        background: '#0A0A0C',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        overflow: 'hidden',
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)',
      }}>
        {/* Title Bar */}
        <div style={{
          background: 'rgba(255,255,255,0.025)',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', gap: 7 }}>
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FF5F56' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#FFBD2E' }} />
            <div style={{ width: 11, height: 11, borderRadius: '50%', background: '#27C93F' }} />
          </div>

          <button 
            onClick={handleCopy}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: "'Inter', sans-serif",
              fontWeight: 500,
              fontSize: 12,
              padding: '5px 14px',
              borderRadius: 999,
              cursor: 'pointer',
              border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(255,255,255,0.08)',
              background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.04)',
              color: copied ? '#10b981' : 'rgba(255,255,255,0.5)',
              transition: 'all 0.2s ease',
              outline: 'none',
            }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {/* Code */}
        <pre style={{
          padding: '20px 24px',
          fontFamily: "'SF Mono', 'Fira Code', 'Fira Mono', Consolas, monospace",
          fontSize: 13,
          lineHeight: 1.8,
          color: codeType === 'react' ? '#61dafb' : '#A8B5C8',
          overflowX: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          margin: 0,
        }}>
          {iframeCode}
        </pre>
      </div>
    </div>
  );
}
