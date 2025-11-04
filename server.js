/**
 * Servidor HTTP simples para servir vídeos na rede local
 * 
 * Como usar:
 * 1. Coloque seus vídeos na pasta 'videos/'
 * 2. Execute: node server.js
 * 3. Acesse de qualquer PC na rede: http://SEU_IP:3002
 */

import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3002;

// Criar pasta de vídeos se não existir
const videosDir = join(__dirname, 'videos');
if (!existsSync(videosDir)) {
  mkdirSync(videosDir);
  console.log('📁 Pasta "videos/" criada. Coloque seus vídeos lá!');
}

// Habilitar CORS (permite acesso de outros domínios)
app.use(cors());

// Servir arquivos estáticos da pasta 'videos'
app.use('/videos', express.static(videosDir, {
  setHeaders: (res, path) => {
    // Headers para suportar streaming de vídeo
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    // Define tipo MIME correto
    if (path.endsWith('.mp4')) {
      res.setHeader('Content-Type', 'video/mp4');
    } else if (path.endsWith('.webm')) {
      res.setHeader('Content-Type', 'video/webm');
    } else if (path.endsWith('.mkv')) {
      res.setHeader('Content-Type', 'video/x-matroska');
    }
  }
}));

// Endpoint para listar vídeos disponíveis
app.get('/api/videos', (req, res) => {
  const fs = require('fs');
  const files = fs.readdirSync(videosDir)
    .filter(file => /\.(mp4|webm|mkv|avi|mov)$/i.test(file))
    .map(file => ({
      name: file,
      url: `http://${req.hostname}:${PORT}/videos/${encodeURIComponent(file)}`
    }));
  
  res.json(files);
});

// Página inicial com instruções
app.get('/', (req, res) => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  const ips = [];
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        ips.push(iface.address);
      }
    });
  });

  res.send(`
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Servidor de Vídeos - Streamcast</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px 20px;
          min-height: 100vh;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
        }
        h1 {
          font-size: 2.5rem;
          margin-bottom: 10px;
          text-align: center;
        }
        .subtitle {
          text-align: center;
          opacity: 0.9;
          margin-bottom: 40px;
          font-size: 1.1rem;
        }
        .status {
          background: rgba(16, 185, 129, 0.2);
          border: 2px solid #10b981;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .status h2 {
          color: #10b981;
          margin-bottom: 15px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ip-list {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 15px;
          margin-top: 10px;
        }
        .ip-item {
          padding: 8px;
          margin: 5px 0;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          font-family: 'Courier New', monospace;
          font-size: 0.95rem;
        }
        .instructions {
          background: rgba(59, 130, 246, 0.2);
          border: 2px solid #3b82f6;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 30px;
        }
        .instructions h2 {
          color: #3b82f6;
          margin-bottom: 15px;
        }
        .instructions ol {
          margin-left: 20px;
        }
        .instructions li {
          margin: 10px 0;
          line-height: 1.6;
        }
        code {
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 8px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          opacity: 0.8;
          font-size: 0.9rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎬 Servidor de Vídeos</h1>
        <p class="subtitle">Streamcast - Servidor Local Rodando</p>
        
        <div class="status">
          <h2>✅ Servidor Online</h2>
          <p>Acesse de qualquer dispositivo na mesma rede WiFi:</p>
          <div class="ip-list">
            ${ips.map(ip => `<div class="ip-item">http://${ip}:${PORT}</div>`).join('')}
          </div>
        </div>
        
        <div class="instructions">
          <h2>📝 Como Usar</h2>
          <ol>
            <li>Coloque seus vídeos na pasta <code>videos/</code></li>
            <li>Copie um dos IPs acima</li>
            <li>No painel Admin do Streamcast, vá em "Buscar"</li>
            <li>Adicione URL direta: <code>http://IP:3002/videos/seu-filme.mp4</code></li>
            <li>Agora funciona em TODOS os PCs da rede! 🎉</li>
          </ol>
        </div>
        
        <div class="instructions">
          <h2>🔗 API de Vídeos</h2>
          <p>Liste todos os vídeos disponíveis:</p>
          <div class="ip-list">
            <div class="ip-item">GET /api/videos</div>
          </div>
        </div>
        
        <div class="footer">
          <p>Desenvolvido para Streamcast 🎬</p>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const networkInterfaces = os.networkInterfaces();
  
  console.log('\n🎬 ===================================');
  console.log('   SERVIDOR DE VÍDEOS RODANDO!');
  console.log('===================================\n');
  
  console.log('📂 Pasta de vídeos:', videosDir);
  console.log('\n🌐 Acesse de qualquer PC na rede:\n');
  
  Object.keys(networkInterfaces).forEach((interfaceName) => {
    networkInterfaces[interfaceName].forEach((iface) => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   http://${iface.address}:${PORT}`);
      }
    });
  });
  
  console.log('\n📝 Instruções:');
  console.log('   1. Coloque vídeos na pasta "videos/"');
  console.log('   2. Copie o IP acima');
  console.log('   3. Use no Streamcast: http://IP:3002/videos/filme.mp4\n');
  console.log('===================================\n');
});
