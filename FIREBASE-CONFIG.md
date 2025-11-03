# 🔥 Configuração do Firebase - StreamCast

## Passo a Passo Rápido

### 1. Criar Projeto no Firebase

1. Acesse: https://console.firebase.google.com
2. Clique em "Adicionar projeto"
3. Nome: `streamcast` (ou qualquer nome)
4. Desative Google Analytics (não necessário)
5. Criar projeto

### 2. Ativar Realtime Database

1. Menu lateral → **Realtime Database**
2. Criar banco de dados
3. Local: `us-central1` (ou mais próximo)
4. Modo: **Teste** (permite leitura/escrita por 30 dias)
5. Ativar

### 3. Configurar Regras de Segurança

No Realtime Database, vá em **Regras** e cole:

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

Clique em **Publicar**.

⚠️ **Para produção**, recomenda-se autenticação:

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

### 4. Obter Credenciais

1. Ícone de engrenagem ⚙️ → **Configurações do projeto**
2. Role até **"Seus aplicativos"**
3. Clique no ícone **</>** (Web)
4. Nome do app: `StreamCast Web`
5. **NÃO** marque "Firebase Hosting"
6. Registrar app
7. **COPIE** o código `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "streamcast-xxxx.firebaseapp.com",
  databaseURL: "https://streamcast-xxxx-default-rtdb.firebaseio.com",
  projectId: "streamcast-xxxx",
  storageBucket: "streamcast-xxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

### 5. Configurar no StreamCast

1. Abra: `src/api/firebase.ts`
2. Localize a linha 16 (aproximadamente):

```typescript
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",  // ← SUBSTITUA TUDO
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto-default-rtdb.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

3. **COLE** suas credenciais do Firebase
4. Salve o arquivo
5. Pronto! ✅

### 6. Testar

```bash
npm install
npm run dev
```

No console do navegador (F12), você deve ver:

```
✅ Firebase inicializado com sucesso
☁️ [EMBED] Firebase ativado - escutando mudanças em tempo real
```

---

## 📊 Verificar se Funciona

### Admin:

1. Abra: http://localhost:3000
2. Configure vídeos
3. Clique em "Salvar e Sincronizar"
4. Veja no console:

```
💾 Dados salvos localmente
☁️ Dados sincronizados com Firebase (cross-origin disponível)
```

### Firebase Console:

1. Volte ao Firebase Console
2. Realtime Database → **Dados**
3. Você deve ver:

```
streamcast
  ├─ config
  ├─ playlist
  ├─ schedules
  └─ lastUpdate: 1234567890
```

### Embed (Cross-Origin):

Em outro domínio/porta, o embed carregará automaticamente:

```
📥 Dados carregados do Firebase
🔄 [EMBED] Dados atualizados via Firebase
🎬 [EMBED] Vídeo selecionado: Homem Aranha
```

---

## 🎯 Exemplo Completo

**Arquivo:** `src/api/firebase.ts`

```typescript
const firebaseConfig = {
  apiKey: "AIzaSyDEMO_KEY_NOT_REAL_123456789",
  authDomain: "streamcast-demo.firebaseapp.com",
  databaseURL: "https://streamcast-demo-default-rtdb.firebaseio.com",
  projectId: "streamcast-demo",
  storageBucket: "streamcast-demo.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
};
```

---

## ⚠️ Troubleshooting

### "Firebase não configurado"

**Causa:** Credenciais não foram substituídas

**Solução:** 
1. Verifique se `apiKey` NÃO é `"SUA_API_KEY_AQUI"`
2. Certifique-se que copiou TODAS as propriedades
3. Salve o arquivo
4. Recarregue a página (Ctrl + R)

### "Permission denied"

**Causa:** Regras de segurança muito restritivas

**Solução:**
1. Firebase Console → Realtime Database → **Regras**
2. Use as regras públicas (ver Passo 3)
3. Publicar

### Firebase não sincroniza

**Causa:** Não instalou as dependências

**Solução:**
```bash
npm install
```

Verifique se Firebase foi instalado:
```bash
npm list firebase
```

Deve mostrar: `firebase@10.13.1`

---

## 💰 Custos

**Plano Spark (Grátis):**
- 1 GB armazenamento
- 10 GB/mês download
- 100 conexões simultâneas

**Suficiente para:**
- Até 10.000 usuários/dia
- Streaming leve (só configurações, não vídeos)

**Upgrade (se necessário):**
- Plano Blaze: Pay-as-you-go
- Primeiros GB grátis
- Depois: ~$5/GB

---

## 🔒 Segurança (Opcional)

### Ativar Autenticação Anônima:

1. Firebase Console → **Authentication**
2. Começar
3. **Provedores de login** → Anônimo
4. Ativar

### Atualizar Regras:

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

### Código (Admin):

```typescript
import { getAuth, signInAnonymously } from 'firebase/auth';

const auth = getAuth();
signInAnonymously(auth)
  .then(() => {
    console.log('✅ Autenticado');
  });
```

---

**Configuração completa! 🚀**

Qualquer dúvida, consulte: https://firebase.google.com/docs/database
