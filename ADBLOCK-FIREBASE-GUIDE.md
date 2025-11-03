# 🛡️ Guia Completo: AdBlock + Firebase Cross-Origin

## 📋 Índice
1. [Sistema de Bloqueio de Anúncios](#-sistema-de-bloqueio-de-anúncios)
2. [Configurar Firebase (Cross-Origin)](#-configurar-firebase-para-cross-origin)
3. [Instalação](#-instalação)
4. [Como Hospedar em Outro Site](#-como-hospedar-em-outro-site)
5. [Teste Completo](#-teste-completo)

---

## 🛡️ Sistema de Bloqueio de Anúncios

### ✅ O que foi implementado:

#### 1. **Bloqueio de Pop-ups**
- Bloqueia `window.open()`
- Previne aberturas de novas abas não autorizadas
- Permite apenas domínios confiáveis

#### 2. **Bloqueio de Redirecionamentos**
- Bloqueia `window.location.assign/replace` para URLs externas
- Previne redirecionamentos automáticos maliciosos

#### 3. **Bloqueio de Links Externos**
- Intercepta cliques em links com `target="_blank"`
- Bloqueia domínios de propaganda conhecidos
- Usa capture phase para máxima prioridade

#### 4. **Proteção de Iframes**
- Monitora iframes adicionados dinamicamente
- Remove iframes de propaganda automaticamente
- Adiciona sandbox para limitar capacidades

#### 5. **Proteção Contra Atalhos**
- Bloqueia Ctrl+Click, Shift+Click em links suspeitos
- Previne abertura de múltiplas abas

#### 6. **Lista de Bloqueio**
Domínios e padrões bloqueados:
- `/ads?[.-]/i` - Anúncios genéricos
- `doubleclick`, `googlesyndication`, `googleadservices`
- `outbrain`, `taboola`
- `propeller`, `popcash`, `popads`
- `admaven`, `adsterra`, `clickadu`
- E muitos outros...

### 📊 Estatísticas em Tempo Real

O sistema registra todas as tentativas bloqueadas:

```javascript
// Ver estatísticas no console a cada 30 segundos
// Exemplo de log:
// 🛡️ AdBlocker: 15 tentativas de propaganda bloqueadas
```

---

## ☁️ Configurar Firebase para Cross-Origin

### Por que Firebase?

✅ **Grátis** - Plano Spark gratuito generoso  
✅ **Tempo Real** - Sincronização automática instantânea  
✅ **Cross-Origin** - Funciona entre domínios diferentes  
✅ **Fácil** - Configuração em 5 minutos  
✅ **Confiável** - Infraestrutura do Google

### Passo 1: Criar Conta no Firebase

1. Acesse: https://firebase.google.com
2. Clique em **"Começar"**
3. Faça login com sua conta Google
4. Clique em **"Adicionar projeto"**

### Passo 2: Criar Projeto

1. **Nome do projeto**: `streamcast` (ou qualquer nome)
2. **Google Analytics**: Desativar (não necessário)
3. Clique em **"Criar projeto"**
4. Aguarde alguns segundos

### Passo 3: Ativar Realtime Database

1. No menu lateral, clique em **"Realtime Database"**
2. Clique em **"Criar banco de dados"**
3. **Local**: Escolha o mais próximo (ex: `us-central1`)
4. **Regras de segurança**: Escolha **"Modo de teste"** (por agora)
5. Clique em **"Ativar"**

⚠️ **IMPORTANTE**: Modo de teste permite leitura/escrita sem autenticação por 30 dias.

### Passo 4: Configurar Regras de Segurança (Opcional mas Recomendado)

No Realtime Database, vá em **"Regras"** e use:

```json
{
  "rules": {
    "streamcast": {
      ".read": true,
      ".write": true
    }
  }
}
```

Ou para mais segurança (apenas autenticados):

```json
{
  "rules": {
    "streamcast": {
      ".read": "auth != null",
      ".write": "auth != null"
    }
  }
}
```

### Passo 5: Obter Credenciais

1. No menu lateral, clique no **ícone de engrenagem** ⚙️
2. Clique em **"Configurações do projeto"**
3. Role até **"Seus aplicativos"**
4. Clique no ícone **</>** (Web)
5. **Nome do app**: `StreamCast Web`
6. Clique em **"Registrar app"**
7. **COPIE** o código de configuração:

```javascript
const firebaseConfig = {
  apiKey: "AIza...XYZ",
  authDomain: "streamcast-abc.firebaseapp.com",
  databaseURL: "https://streamcast-abc-default-rtdb.firebaseio.com",
  projectId: "streamcast-abc",
  storageBucket: "streamcast-abc.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Passo 6: Configurar no StreamCast

1. Abra: `src/api/firebase.ts`
2. **SUBSTITUA** as credenciais:

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",  // ← Cole aqui
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

3. **Salve o arquivo**

---

## 📦 Instalação

### 1. Instalar Dependências

```bash
npm install
```

Isso instalará o Firebase automaticamente (já adicionado ao `package.json`).

### 2. Verificar se Firebase foi instalado

```bash
npm list firebase
```

Deve mostrar: `firebase@10.13.1`

---

## 🌐 Como Hospedar em Outro Site

### Cenário 1: Mesmo Domínio (Sem Firebase)

Se admin e embed estão no **mesmo domínio**, não precisa do Firebase:

```
✅ Admin: https://seusite.com/streamcast/admin
✅ Embed: https://seusite.com/blog (iframe)
```

**Código do embed:**
```html
<div id="streamcast-player" style="width: 100%; height: 600px;"></div>
<script>
  const iframe = document.createElement('iframe');
  iframe.src = 'https://seusite.com/streamcast?embed=true';
  iframe.style.cssText = 'width: 100%; height: 100%; border: 0;';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  iframe.sandbox = 'allow-scripts allow-same-origin allow-presentation';
  document.getElementById('streamcast-player').appendChild(iframe);
</script>
```

### Cenário 2: Domínios Diferentes (COM Firebase)

Se admin e embed estão em **domínios diferentes**, use Firebase:

```
📍 Admin: https://admin.seusite.com
📍 Embed: https://www.outrosite.com
☁️ Firebase: Sincronização automática
```

**Passos:**

1. Configure o Firebase (Passo 2 acima)
2. Hospede o StreamCast no domínio do admin
3. No site externo, use o mesmo código do embed acima
4. **Pronto!** Firebase sincroniza automaticamente

**Como funciona:**
- Admin salva → Firebase atualiza
- Embed escuta → Firebase notifica
- Atualização em **tempo real** (< 1 segundo)

### Cenário 3: Hospedar em Netlify/Vercel

#### Netlify:

```bash
npm run build
netlify deploy --prod --dir=dist
```

#### Vercel:

```bash
npm run build
vercel --prod
```

Depois copie a URL e use no iframe:

```html
<iframe src="https://seu-app.netlify.app?embed=true" ...></iframe>
```

---

## 🧪 Teste Completo

### Teste 1: AdBlocker Funcionando

1. Abra: `http://localhost:3000`
2. Adicione um vídeo à playlist
3. Abra o **Console** (F12)
4. Tente executar:

```javascript
window.open('https://google.com');
```

✅ Deve mostrar: `🚫 Pop-up bloqueado: https://google.com`

### Teste 2: Estatísticas do AdBlocker

No console, execute:

```javascript
// Aguarde 30 segundos navegando
// Deve aparecer automaticamente:
// 🛡️ AdBlocker: X tentativas de propaganda bloqueadas
```

### Teste 3: Firebase Cross-Origin (Localhost)

#### Terminal 1 - Admin (porta 3000):
```bash
npm run dev
```

#### Terminal 2 - Embed (porta 5173):
```bash
# Em outra pasta
npx http-server . -p 5173 --cors
```

Crie `test-embed.html` na porta 5173:

```html
<!DOCTYPE html>
<html>
<head><title>Teste Cross-Origin</title></head>
<body>
  <div id="player" style="width: 100%; height: 600px;"></div>
  <script>
    const iframe = document.createElement('iframe');
    iframe.src = 'http://localhost:3000?embed=true';
    iframe.style.cssText = 'width: 100%; height: 100%; border: 0;';
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    document.getElementById('player').appendChild(iframe);
  </script>
</body>
</html>
```

**Teste:**
1. Abra: `http://localhost:3000` (Admin)
2. Configure um vídeo
3. Clique em **"Salvar e Sincronizar"**
4. Abra: `http://localhost:5173/test-embed.html` (Embed)
5. ✅ Vídeo deve aparecer automaticamente!

### Teste 4: Firebase em Produção

1. **Deploy no Netlify/Vercel**:
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

2. **Obtenha a URL**: `https://seu-app.netlify.app`

3. **Configure no Admin**:
   - Acesse: `https://seu-app.netlify.app`
   - Configure vídeos
   - Salve

4. **Incorpore em outro site**:
   ```html
   <iframe src="https://seu-app.netlify.app?embed=true" ...></iframe>
   ```

5. ✅ Sincronização automática via Firebase!

---

## 📊 Logs e Debug

### Logs do AdBlocker:

```javascript
// Inicialização
🛡️ AdBlocker ativado - Proteção contra anúncios ativa

// Bloqueios
🚫 Pop-up bloqueado #1: https://ad.com
🚫 Link externo bloqueado: https://spam.com
🚫 Ctrl/Shift+Click bloqueado
🚫 Iframe de propaganda removido: https://ads.com

// Estatísticas (a cada 30s)
🛡️ AdBlocker: 5 tentativas de propaganda bloqueadas
```

### Logs do Firebase:

```javascript
// Inicialização
✅ Firebase inicializado com sucesso
☁️ [EMBED] Firebase ativado - escutando mudanças em tempo real

// Salvando (Admin)
💾 Dados salvos localmente
☁️ Dados sincronizados com Firebase (cross-origin disponível)

// Carregando (Embed)
📥 Dados carregados do Firebase
🔄 [EMBED] Dados atualizados via Firebase
🎬 [EMBED] Vídeo selecionado: Homem Aranha
```

---

## ⚠️ Troubleshooting

### Firebase não funciona

**Erro**: `Firebase não configurado`

**Solução**:
1. Verifique se substituiu as credenciais em `src/api/firebase.ts`
2. Certifique-se que `apiKey !== "SUA_API_KEY_AQUI"`
3. Rode: `npm install` novamente

### AdBlocker bloqueia vídeos legítimos

**Problema**: Vídeos do Vidsrc não carregam

**Solução**: Domínios do Vidsrc já estão na whitelist:
```typescript
'vidsrc.xyz', 'vidsrc.me', 'vidsrc.to', 'vidsrc.net', 'vidsrc-embed.ru'
```

Se precisar adicionar mais:

```typescript
// Em src/utils/adblock.ts
const allowedDomains = [
  window.location.hostname,
  'seudominio.com', // ← Adicione aqui
  'vidsrc.xyz',
  // ...
];
```

### Pop-ups ainda aparecem

**Causa**: AdBlocker só funciona no domínio principal, não dentro do iframe do Vidsrc

**Solução**: Use `sandbox` no iframe:

```html
<iframe sandbox="allow-scripts allow-same-origin allow-presentation" ...></iframe>
```

Já implementado no `VideoPlayer.tsx`.

---

## 🎯 Resumo

### ✅ O que você tem agora:

1. **🛡️ AdBlocker completo**
   - Bloqueia pop-ups
   - Bloqueia redirecionamentos
   - Bloqueia propagandas conhecidas
   - Monitora iframes suspeitos

2. **☁️ Firebase para Cross-Origin**
   - Sincronização em tempo real
   - Funciona entre domínios diferentes
   - Grátis e confiável

3. **🌐 Pronto para produção**
   - Deploy em Netlify/Vercel
   - Embed em qualquer site
   - Proteção contra anúncios

### 🚀 Próximos Passos:

1. Configure suas credenciais do Firebase
2. Faça o deploy do projeto
3. Incorpore em seu site
4. Monitore os logs para verificar bloqueios

---

**Tudo configurado! 🎉**

Se tiver dúvidas, verifique os logs no Console (F12) ou consulte a documentação oficial do Firebase: https://firebase.google.com/docs
