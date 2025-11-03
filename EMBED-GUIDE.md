# 🎬 StreamCast - Guia de Embed

## 📖 Índice
- [Problema Identificado](#-problema-identificado)
- [Solução Implementada](#-solução-implementada)
- [Como Testar Localmente](#-como-testar-localmente)
- [Como Usar em Outro Site](#-como-usar-em-outro-site)
- [Sincronização Cross-Origin](#-sincronização-cross-origin)
- [Troubleshooting](#-troubleshooting)

---

## 🔍 Problema Identificado

Você tentou incorporar o StreamCast em outro site, mas o vídeo não apareceu. Os problemas foram:

### 1. **localStorage Cross-Origin**
- O `localStorage` **não sincroniza** entre domínios diferentes
- `file:///` vs `http://localhost:3000` são considerados origens diferentes
- Navegadores bloqueiam compartilhamento de `localStorage` por segurança

### 2. **Falta de Sincronização em Tempo Real**
- O embed verificava dados apenas a cada 60 segundos
- Sem notificação quando o admin salvava novos dados
- Sem fallback quando a playlist estava vazia

---

## ✅ Solução Implementada

### 1. **Sistema de Sincronização Melhorado**

#### No Embed Player (`embedPlayer.tsx`):
```typescript
// ✅ Listener para mudanças no localStorage (mesma origem)
window.addEventListener('storage', handleStorageChange);

// ✅ Listener para mensagens do parent (iframe)
window.addEventListener('message', handleMessage);

// ✅ Verificação a cada 10 segundos (antes era 60s)
const interval = setInterval(loadPlayerData, 10000);

// ✅ Notifica parent quando está pronto
window.parent.postMessage({ type: 'STREAMCAST_EMBED_READY' }, '*');
```

#### No Admin Panel (`AdminPanel.tsx`):
```typescript
// ✅ Notifica todos os iframes quando salvar
frames.forEach(frame => {
  frame.contentWindow?.postMessage({ type: 'STREAMCAST_SYNC' }, '*');
});

// ✅ Dispara evento customizado para outras abas
window.dispatchEvent(new StorageEvent('storage', {
  key: 'streamcast-sync',
  newValue: Date.now().toString()
}));
```

### 2. **Interface de Fallback**
- Mostra mensagem amigável quando a playlist está vazia
- Instrui o usuário a configurar vídeos no admin
- Indica visualmente o status de carregamento

### 3. **Página de Exemplo Melhorada**
- `exemplo-embed.html` com detecção automática de protocolo
- Alertas visuais sobre modo de operação
- Instruções passo a passo
- Status de conexão em tempo real

---

## 🧪 Como Testar Localmente

### Passo 1: Inicie o Servidor
```bash
npm run dev
```

### Passo 2: Acesse o Admin
1. Abra: http://localhost:3000
2. Clique em **"Admin"** (canto superior direito)
3. Vá para aba **"Buscar"**
4. Busque um filme: `Homem Aranha`, `Avatar`, `Breaking Bad`
5. Clique em **"Adicionar à Playlist"**
6. Role até o final e clique em **"Salvar e Sincronizar"**

### Passo 3: Teste o Embed
Abra em outra aba ou janela:
```
http://localhost:3000/exemplo-embed.html
```

✅ O vídeo deve aparecer **automaticamente**!

---

## 🌐 Como Usar em Outro Site

### Opção 1: Mesma Origem (Recomendado)
Se o StreamCast e seu site estão no **mesmo domínio**:

```html
<div id="streamcast-player" style="width: 100%; height: 100vh;"></div>
<script>
  const iframe = document.createElement('iframe');
  iframe.src = 'https://seusite.com/streamcast?embed=true';
  iframe.style.cssText = 'width: 100%; height: 100%; border: 0;';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media';
  iframe.allowFullscreen = true;
  document.getElementById('streamcast-player').appendChild(iframe);
  
  // Listener para quando o embed estiver pronto
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'STREAMCAST_EMBED_READY') {
      console.log('✅ StreamCast carregado!');
    }
  });
</script>
```

### Opção 2: Cross-Origin (Origens Diferentes)

#### ⚠️ Limitações do localStorage Cross-Origin:
O `localStorage` **NÃO compartilha** entre domínios diferentes por questões de segurança.

**Exemplo que NÃO funciona:**
- Admin em: `http://localhost:3000`
- Embed em: `http://meusite.com`
- ❌ `localStorage` não sincroniza

#### 💡 Soluções para Cross-Origin:

**Solução A: Usar PostMessage (Comunicação Manual)**
```javascript
// No site que hospeda o embed
const iframe = document.getElementById('streamcast-iframe');

// Enviar configuração para o embed
iframe.contentWindow.postMessage({
  type: 'STREAMCAST_CONFIG',
  config: {
    playlist: [
      {
        id: '1',
        type: 'movie',
        title: 'Homem Aranha',
        tmdb: '557',
        // ...
      }
    ]
  }
}, '*');
```

**Solução B: API Backend (Recomendado para Produção)**
1. Criar API REST para salvar/carregar configurações
2. Admin salva no backend (MongoDB, Firebase, Supabase)
3. Embed carrega do backend
4. Funciona em qualquer domínio

**Solução C: Hospedar Ambos no Mesmo Domínio**
- Admin: `https://seusite.com/admin`
- Embed: `https://seusite.com/player?embed=true`
- ✅ `localStorage` compartilhado!

---

## 🔄 Sincronização Cross-Origin

### Exemplo com Firebase (Grátis)

#### 1. Instalar Firebase
```bash
npm install firebase
```

#### 2. Configurar (`src/api/firebase.ts`)
```typescript
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, onValue } from 'firebase/database';

const firebaseConfig = {
  // Suas credenciais do Firebase
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const saveConfig = (data: any) => {
  return set(ref(db, 'streamcast/config'), data);
};

export const listenConfig = (callback: (data: any) => void) => {
  const configRef = ref(db, 'streamcast/config');
  onValue(configRef, (snapshot) => {
    callback(snapshot.val());
  });
};
```

#### 3. Usar no Admin
```typescript
// Ao salvar
await saveConfig({ config, playlist, schedules });
```

#### 4. Usar no Embed
```typescript
// Escutar mudanças
listenConfig((data) => {
  setConfig(data.config);
  setPlaylist(data.playlist);
});
```

---

## 🔧 Troubleshooting

### Problema: Vídeo não aparece no embed

#### ✅ Checklist:
1. **Servidor rodando?**
   ```bash
   npm run dev
   ```

2. **Playlist configurada?**
   - Vá em Admin → Buscar
   - Adicione pelo menos 1 vídeo
   - Clique em "Salvar e Sincronizar"

3. **Acessando via servidor HTTP?**
   - ✅ Use: `http://localhost:3000/exemplo-embed.html`
   - ❌ Não use: `file:///C:/Users/.../exemplo-embed.html`

4. **Mesma origem?**
   - Admin e Embed devem estar no mesmo domínio
   - Ou use uma das soluções cross-origin acima

5. **Console do navegador (F12)?**
   - Procure por erros em vermelho
   - Verifique logs do tipo: `[EMBED] Carregando dados`

### Problema: "Nenhum vídeo na playlist"

#### Causas:
- Playlist realmente vazia
- localStorage não sincronizou
- Cross-origin sem solução adequada

#### Solução:
1. Abra o Console (F12)
2. Digite:
   ```javascript
   localStorage.getItem('streamcast-playlist')
   ```
3. Se retornar `null` ou `[]`:
   - Vá no Admin
   - Adicione vídeos
   - Salve

### Problema: Cross-Origin não funciona

#### Por Quê?
Navegadores bloqueiam `localStorage` entre origens diferentes por segurança.

#### Solução:
Use uma das soluções mencionadas:
- **Backend API** (melhor para produção)
- **Firebase/Supabase** (rápido e grátis)
- **Hospedar no mesmo domínio**

---

## 📝 Código de Exemplo Completo

### HTML Básico (Mesmo Domínio)
```html
<!DOCTYPE html>
<html>
<head>
    <title>Meu Site com StreamCast</title>
    <style>
        #player-container {
            width: 100%;
            height: 100vh;
        }
    </style>
</head>
<body>
    <div id="player-container"></div>
    
    <script>
        const iframe = document.createElement('iframe');
        iframe.src = 'http://localhost:3000?embed=true';
        iframe.style.cssText = 'width: 100%; height: 100%; border: 0;';
        iframe.allow = 'autoplay; fullscreen';
        iframe.allowFullscreen = true;
        
        document.getElementById('player-container').appendChild(iframe);
        
        // Sincronizar quando admin salvar (mesma origem)
        window.addEventListener('storage', (e) => {
            if (e.key?.startsWith('streamcast-')) {
                iframe.contentWindow.location.reload();
            }
        });
    </script>
</body>
</html>
```

---

## 🎯 Resumo

### ✅ O que foi corrigido:
1. **Sincronização em tempo real** com `storage` events
2. **Comunicação iframe** via `postMessage`
3. **Fallback visual** quando playlist vazia
4. **Verificação mais frequente** (10s vs 60s)
5. **Página de exemplo** completa e funcional
6. **Logs detalhados** para debug

### 🚀 Próximos Passos (Opcional):
1. Implementar **backend API** para sincronização real cross-origin
2. Adicionar **autenticação** no admin
3. Criar **dashboard de analytics**
4. Suporte a **múltiplos canais** (playlists diferentes)

---

## 📞 Suporte

Se ainda tiver problemas:
1. Verifique o Console do navegador (F12)
2. Teste com `exemplo-embed.html` primeiro
3. Confirme que está usando `http://` e não `file://`
4. Verifique se a playlist tem vídeos configurados

**Boa sorte! 🎬✨**
