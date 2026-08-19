# 🌍 Ngrok - Acesso pela Internet

## ✅ **JÁ ESTÁ CONFIGURADO!**

O ngrok já está integrado no servidor e inicia **automaticamente**!

---

## 🚀 **Como Usar**

### **1️⃣ Iniciar o Servidor**
```bash
npm run server
```

Você verá algo assim:

```
🎬 ===================================
   SERVIDOR DE VÍDEOS RODANDO!
===================================

📂 Pasta de vídeos: C:\Users\Kauan\Desktop\streamcast\videos

🌐 Acesse LOCALMENTE (mesma rede WiFi):

   http://192.168.1.10:3002

🌍 Iniciando túnel ngrok (acesso pela INTERNET)...

✅ TÚNEL NGROK ATIVO!

🔗 URL PÚBLICA (funciona DE QUALQUER LUGAR):
   https://abc123-456-789.ngrok-free.app

💡 Use esta URL nos seus vídeos:
   https://abc123-456-789.ngrok-free.app/videos/seu-filme.mp4

⚠️  IMPORTANTE: Esta URL é TEMPORÁRIA!
   Se reiniciar o servidor, a URL muda.
   Para URL permanente, crie conta grátis em https://ngrok.com

===================================
```

### **2️⃣ Usar a URL Pública**

Copie a URL do ngrok:
```
https://abc123-456-789.ngrok-free.app
```

No painel Admin do Streamcast, adicione:
```
https://abc123-456-789.ngrok-free.app/videos/filme.mp4
```

**Pronto!** Agora funciona de **QUALQUER LUGAR DO MUNDO**! 🌍

---

## 🎯 **Vantagens do Ngrok**

- ✅ **Acesso Global**: Funciona em qualquer lugar (não só na sua rede)
- ✅ **Fácil**: Já está configurado, só rodar `npm run server`
- ✅ **HTTPS**: Conexão segura automaticamente
- ✅ **Grátis**: Sem custos

---

## ⚠️ **Limitações (Plano Grátis)**

- ⚠️ **URL Temporária**: Muda toda vez que reinicia o servidor
- ⚠️ **Página de aviso**: Ngrok mostra uma página de confirmação antes de acessar
- ⚠️ **Limite de conexões**: Máximo de 40 conexões/minuto

---

## 🔓 **Remover Limitações (Conta Grátis)**

### **1️⃣ Criar Conta**
1. Acesse: https://dashboard.ngrok.com/signup
2. Crie conta grátis (email + senha)
3. Copie seu **authtoken**

### **2️⃣ Configurar Authtoken**

Crie arquivo `.env` na raiz do projeto:
```env
NGROK_AUTHTOKEN=seu_token_aqui
```

### **3️⃣ Atualizar server.js**

O código já está preparado! Só adicionar:
```javascript
const url = await ngrok.connect({
  addr: PORT,
  authtoken: process.env.NGROK_AUTHTOKEN, // ← Adicione esta linha
  region: 'us'
});
```

### **4️⃣ Benefícios com Conta**

- ✅ **URL Fixa**: Pode reservar um domínio fixo (ex: `seu-nome.ngrok.app`)
- ✅ **Sem página de aviso**: Acesso direto
- ✅ **Mais conexões**: Até 120 conexões/minuto
- ✅ **Túneis múltiplos**: Até 3 túneis simultâneos

---

## 🆚 **Quando Usar Cada Um**

| Situação | Use |
|----------|-----|
| **Assistir em casa (mesma WiFi)** | IP Local (192.168.x.x) |
| **Assistir fora de casa** | Ngrok URL |
| **Compartilhar com amigos** | Ngrok URL |
| **Demo/Apresentação** | Ngrok URL |
| **Produção 24/7** | Servidor dedicado (VPS) |

---

## 🔧 **Comandos Úteis**

### Servidor com ngrok (padrão)
```bash
npm run server
```

### Servidor SEM ngrok (só rede local)
```bash
npm run server:local
```

### Ver túneis ativos
1. Acesse: http://localhost:4040
2. Veja status, logs, requisições

---

## 📊 **Alternativas ao Ngrok**

Se não gostar do ngrok, outras opções:

### **Cloudflare Tunnel** (Grátis, Permanente)
```bash
npx cloudflared tunnel --url http://localhost:3002
```

### **LocalTunnel** (Grátis, Simples)
```bash
npm install -g localtunnel
lt --port 3002
```

### **Serveo** (Grátis, SSH)
```bash
ssh -R 80:localhost:3002 serveo.net
```

---

## 🎬 **Exemplo Completo**

```bash
# 1. Iniciar servidor
npm run server

# 2. Copiar URL do ngrok
https://abc123.ngrok-free.app

# 3. Adicionar vídeo no Streamcast
https://abc123.ngrok-free.app/videos/filme.mp4

# 4. Funciona em QUALQUER dispositivo! 🎉
```

---

**Desenvolvido para Streamcast** 🌍
