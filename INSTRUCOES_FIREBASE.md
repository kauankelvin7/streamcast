# 🔥 Como Configurar Firebase para Sincronização Global

## Por que preciso do Firebase?

- **BroadcastChannel**: Só funciona no mesmo navegador/domínio (local)
- **Firebase Realtime Database**: Funciona em qualquer site/dispositivo (global)

## Passo a Passo

### 1️⃣ Criar Projeto Firebase

1. Acesse: https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Nome: `streamcast-sync` (ou qualquer nome)
4. Desative Google Analytics (opcional)
5. Clique em "Criar projeto"

### 2️⃣ Configurar Realtime Database

1. No menu lateral, clique em **"Realtime Database"**
2. Clique em **"Criar banco de dados"**
3. Localização: **Estados Unidos** (us-central1)
4. Regras de segurança: **"Modo de teste"** (temporário)
5. Clique em **"Ativar"**

⚠️ **IMPORTANTE**: Depois configure regras de segurança:

```json
{
  "rules": {
    "playerSync": {
      ".read": true,
      ".write": true
    }
  }
}
```

### 3️⃣ Obter Configurações do Firebase

1. Clique no ícone de **engrenagem** ⚙️ > **Configurações do projeto**
2. Role até **"Seus aplicativos"**
3. Clique no ícone **</>** (Web)
4. Nome do app: `streamcast`
5. **NÃO** marque "Firebase Hosting"
6. Clique em **"Registrar app"**
7. **COPIE** o objeto `firebaseConfig`:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 4️⃣ Instalar Firebase SDK

```bash
npm install firebase
```

### 5️⃣ Criar arquivo de configuração

Crie o arquivo `src/api/firebase.ts`:

```typescript
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database } from 'firebase/database';

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  databaseURL: "https://seu-projeto.firebaseio.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};

let app: FirebaseApp | null = null;
let database: Database | null = null;

export function initFirebase(): boolean {
  if (app) return true;
  
  try {
    app = initializeApp(firebaseConfig);
    database = getDatabase(app);
    console.log('✅ Firebase inicializado com sucesso!');
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase:', error);
    return false;
  }
}

export function getFirebaseDatabase(): Database | null {
  if (!database) {
    initFirebase();
  }
  return database;
}
```

### 6️⃣ Testar

1. Rode o build:
```bash
npm run build
npm run dev
```

2. Abra em **2 navegadores diferentes** ou **2 dispositivos**
3. Dê play/pause em um
4. Verifique se sincroniza no outro ✅

### 7️⃣ Embedar em Outros Sites

Agora você pode embedar o player em **qualquer site** e todos vão sincronizar:

```html
<!-- Site A (seusite.com) -->
<iframe src="https://seu-dominio.com?embed=true"></iframe>

<!-- Site B (outrosite.com) -->
<iframe src="https://seu-dominio.com?embed=true"></iframe>

<!-- Ambos vão sincronizar play/pause automaticamente! -->
```

## 🔒 Segurança (Produção)

**NUNCA deixe as regras em "modo de teste" em produção!**

Configure regras adequadas:

```json
{
  "rules": {
    "playerSync": {
      ".read": true,
      ".write": "auth != null || data.val() == null || (now - data.child('timestamp').val()) < 10000"
    }
  }
}
```

Isso permite:
- ✅ Qualquer um pode LER o estado
- ✅ Usuários autenticados podem ESCREVER
- ✅ Escritas antigas (>10s) podem ser substituídas

## 📊 Monitoramento

No Firebase Console, você pode ver em tempo real:
- Quantas conexões ativas
- Dados sendo sincronizados
- Uso de bandwidth

## 💰 Custos

**Plano Spark (Gratuito)**:
- 100 conexões simultâneas
- 1 GB armazenado
- 10 GB/mês de transferência

Para uso pessoal/pequeno, é **totalmente grátis**!

## 🎯 Resumo

**Sem Firebase**:
- ✅ Sincroniza: Mesma aba, mesmo domínio
- ❌ NÃO sincroniza: Outros sites, outros dispositivos

**Com Firebase**:
- ✅ Sincroniza: TUDO (qualquer site, qualquer dispositivo, qualquer navegador)
- 🌍 **Global**: Players em diferentes sites sincronizam perfeitamente!
