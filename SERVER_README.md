# 🎬 Servidor de Vídeos Local - Streamcast

Servidor HTTP simples para servir vídeos na sua rede local.

## 🚀 Como Usar

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Iniciar o Servidor

```bash
npm run server
```

Você verá algo assim:

```
🎬 ===================================
   SERVIDOR DE VÍDEOS RODANDO!
===================================

📂 Pasta de vídeos: C:\Users\Kauan\Desktop\streamcast\videos

🌐 Acesse de qualquer PC na rede:

   http://192.168.1.10:3002

📝 Instruções:
   1. Coloque vídeos na pasta "videos/"
   2. Copie o IP acima
   3. Use no Streamcast: http://IP:3002/videos/filme.mp4

===================================
```

### 3️⃣ Adicionar Vídeos

1. Crie a pasta `videos/` (se não existir)
2. Coloque seus filmes lá:
   ```
   videos/
   ├── filme1.mp4
   ├── serie-s01e01.mp4
   └── documentario.mkv
   ```

### 4️⃣ Usar no Streamcast

1. Abra o painel Admin
2. Vá em "Buscar"
3. Adicione URL direta:
   ```
   http://192.168.1.10:3002/videos/filme1.mp4
   ```
4. Pronto! Agora funciona em TODOS os PCs da rede! 🎉

---

## 🌐 API Endpoints

### Listar Vídeos

```
GET http://SEU_IP:3002/api/videos
```

Retorna JSON:

```json
[
  {
    "name": "filme1.mp4",
    "url": "http://192.168.1.10:3002/videos/filme1.mp4"
  },
  {
    "name": "serie-s01e01.mp4",
    "url": "http://192.168.1.10:3002/videos/serie-s01e01.mp4"
  }
]
```

### Acessar Vídeo

```
GET http://SEU_IP:3002/videos/NOME_DO_ARQUIVO.mp4
```

---

## ✅ Vantagens

- ✅ **Grátis**: Nenhum custo
- ✅ **Rápido**: Streaming direto na rede local
- ✅ **Funciona offline**: Não precisa de internet
- ✅ **Multi-dispositivo**: Qualquer PC/celular na mesma WiFi
- ✅ **Sincronização total**: Play/pause/mute/volume sincronizam via Firebase

---

## ⚠️ Limitações

- ❌ **Apenas na mesma rede WiFi**: Não funciona fora da sua rede
- ❌ **Precisa manter o servidor rodando**: Se fechar o terminal, para de funcionar
- ❌ **Não funciona na internet**: Apenas rede local

---

## 🌍 Quer Acesso pela Internet?

Se quiser acessar de QUALQUER lugar (não só na sua rede), use:

### Opção 1: ngrok (Túnel Temporário - Grátis)

```bash
# Instalar ngrok: https://ngrok.com/download
ngrok http 3002
```

Você receberá uma URL pública:

```
https://abc123.ngrok.io → http://localhost:3002
```

### Opção 2: Cloudflare Tunnel (Permanente - Grátis)

```bash
# Instalar cloudflared
npm install -g cloudflared

# Criar túnel
cloudflared tunnel --url http://localhost:3002
```

---

## 🛠️ Solução de Problemas

### Porta 3002 já está em uso?

Edite `server.js` e mude a porta:

```javascript
const PORT = 3003; // ou qualquer porta livre
```

### Firewall bloqueando?

Adicione exceção no firewall do Windows para a porta 3002.

### Não aparece o IP?

Certifique-se de estar conectado na WiFi (não cabo ethernet).

---

## 📊 Formatos Suportados

- ✅ MP4
- ✅ WebM
- ✅ MKV
- ✅ AVI
- ✅ MOV

---

**Desenvolvido para Streamcast** 🎬
