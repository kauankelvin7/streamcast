# 🎬 StreamCast - Video Player Pro

Sistema avançado de reprodução de vídeos com playlist e agendamento automático.

## ✨ Recursos

- 📺 **Player de Vídeo Customizado** - Controles personalizados e interface moderna
- 📋 **Sistema de Playlist** - Adicione múltiplos vídeos em sequência
- ⏰ **Agendamento Inteligente** - Configure vídeos para dias e horários específicos
- 💾 **Armazenamento Persistente** - Todas as configurações são salvas localmente
- 🔄 **Sincronização Automática** - Compartilhe configurações entre múltiplas instâncias
- 🎨 **Interface Moderna** - Design elegante com Tailwind CSS
- 🌐 **Modo Embed** - Incorpore o player em qualquer site
- 🔍 **Busca TMDB** - Busque filmes e séries diretamente da API do TMDB
- 🏷️ **Sistema de Tags** - Organize vídeos por gêneros
- 🛡️ **AdBlocker Integrado** - Bloqueio avançado de pop-ups e propagandas
- ☁️ **Firebase Cross-Origin** - Sincronização entre domínios diferentes

## 🚀 Como Rodar

### 1. Instalar Dependências
```bash
npm install
```

### 2. (Opcional) Configurar Firebase para Cross-Origin

Se você vai hospedar o embed em **outro domínio** (ex: `admin.com` e `site.com`):

1. Crie uma conta no [Firebase](https://firebase.google.com)
2. Crie um projeto e ative o Realtime Database
3. Copie suas credenciais
4. Cole em `src/api/firebase.ts`

📖 **Guia completo**: [ADBLOCK-FIREBASE-GUIDE.md](./ADBLOCK-FIREBASE-GUIDE.md)

💡 **Não é necessário** se admin e embed estão no mesmo domínio.

### 3. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

O aplicativo abrirá automaticamente em: http://localhost:3000

### 4. Build para Produção
```bash
npm run build
```

Os arquivos de produção estarão em: `dist/`

## 📖 Como Usar

### Configuração Inicial

1. **Abra o Painel Admin**
   - Clique no botão "Admin" no canto superior direito

2. **Busque e Adicione Vídeos**
   - Vá para a aba "Buscar"
   - Digite o nome de um filme ou série (ex: "Homem Aranha", "Breaking Bad")
   - Cole sua chave da API do TMDB (obtenha grátis em https://www.themoviedb.org/settings/api)
   - Clique em "Buscar"
   - Clique em "Adicionar à Playlist" nos resultados

3. **Gerencie a Playlist**
   - Vá para a aba "Playlist"
   - Visualize todos os vídeos adicionados
   - Adicione tags/gêneros clicando no ícone de tag
   - Remova vídeos indesejados

4. **Configure Agendamentos (Opcional)**
   - Vá para a aba "Agendar"
   - Crie agendamentos para reproduzir vídeos específicos em horários definidos
   - Selecione os dias da semana
   - Defina horário de início e fim

5. **Ajuste as Configurações**
   - Aba "Config"
   - Ative/desative autoplay, loop e início mudo
   - Configure o idioma preferido (áudio/legenda)
   - Cole sua chave da API do TMDB

6. **Salvar**
   - Clique em "Salvar e Sincronizar" na parte inferior

### 🌐 Modo Embed (Incorporar em Outro Site)

#### Testar Localmente

1. Inicie o servidor: `npm run dev`
2. Configure vídeos no Admin (passos acima)
3. Abra: `http://localhost:3000/exemplo-embed.html`

#### Usar em Seu Site

**Mesma Origem (Recomendado):**
```html
<div id="streamcast-player" style="width: 100%; height: 100vh;"></div>
<script>
  const iframe = document.createElement('iframe');
  iframe.src = 'https://seusite.com/streamcast?embed=true';
  iframe.style.cssText = 'width: 100%; height: 100%; border: 0;';
  iframe.allow = 'autoplay; fullscreen; picture-in-picture';
  iframe.allowFullscreen = true;
  document.getElementById('streamcast-player').appendChild(iframe);
</script>
```

**Cross-Origin (Diferentes Domínios):**

Para sincronizar entre domínios diferentes, configure o Firebase:

📖 **Guia completo**: **[ADBLOCK-FIREBASE-GUIDE.md](./ADBLOCK-FIREBASE-GUIDE.md)**

**Como funciona:**
1. Admin salva → Firebase atualiza na nuvem
2. Embed (outro domínio) escuta → Firebase notifica em tempo real
3. Sincronização automática instantânea

Veja o guia completo em: **[EMBED-GUIDE.md](./EMBED-GUIDE.md)**

#### 🛡️ Proteção Contra Anúncios

O StreamCast inclui um **AdBlocker integrado** que:
- Bloqueia pop-ups e janelas indesejadas
- Previne redirecionamentos maliciosos
- Remove iframes de propaganda
- Protege contra cliques em anúncios

**Estatísticas em tempo real** no Console (F12):
```
🛡️ AdBlocker: 15 tentativas de propaganda bloqueadas
```

📖 **Guia completo**: **[ADBLOCK-FIREBASE-GUIDE.md](./ADBLOCK-FIREBASE-GUIDE.md)**

#### Arquivos de Exemplo

- `exemplo-embed.html` - Página de demonstração completa
- `teste-embed.html` - Teste simples
- `src/api/sync-api-example.ts` - Exemplo de API para cross-origin

### Controles do Player

| Tecla | Ação |
|-------|------|
| `Espaço` | Play/Pause |
| `M` | Mute/Unmute |
| `F` | Fullscreen |

## 🏗️ Estrutura do Projeto

```
StreamCast/
├── src/
│   ├── castPlayer.tsx    # Componente principal
│   ├── storage.ts        # API de armazenamento
│   ├── main.tsx          # Entry point
│   └── index.css         # Estilos globais
├── index.html
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── tsconfig.json
```

## 🔧 Tecnologias

- **React 18** - Framework UI
- **TypeScript** - Tipagem estática
- **Vite** - Build tool ultrarrápido
- **Tailwind CSS** - Framework CSS utilitário
- **Lucide React** - Ícones modernos
- **Firebase** - Sincronização cross-origin em tempo real
- **AdBlocker Custom** - Sistema próprio de bloqueio de anúncios

## 📝 Formatos de Vídeo Suportados

- MP4
- WebM
- OGG
- Qualquer formato suportado pela tag `<video>` do HTML5

## 💡 Exemplos de URLs

```
# Vídeo local
/videos/exemplo.mp4

# Vídeo remoto
https://example.com/video.mp4

# Vídeo do servidor
http://localhost:8000/sample.webm
```

## ⚙️ Configurações Disponíveis

- **Autoplay**: Reprodução automática ao carregar
- **Loop**: Repetir playlist ao terminar
- **Start Muted**: Iniciar com áudio desativado

## 🎯 Casos de Uso

1. **Sinalização Digital** - Exiba conteúdo em TVs/monitores
2. **Galeria de Vídeos** - Portfólio de trabalhos
3. **Player Institucional** - Vídeos corporativos programados
4. **Kiosk Interativo** - Player para totens

## 🐛 Troubleshooting

### Vídeo não carrega
- Verifique se adicionou vídeos à playlist no Admin
- Confirme que salvou as configurações ("Salvar e Sincronizar")
- Verifique se a API do TMDB está configurada corretamente
- Abra o Console (F12) e procure por erros

### Embed não sincroniza
- **Arquivo Local (`file:///`)**: NÃO funciona! Use servidor HTTP
- **Cross-Origin**: localStorage não sincroniza entre domínios diferentes
  - Use Firebase/API backend (veja EMBED-GUIDE.md)
  - Ou hospede admin e embed no mesmo domínio
- **Mesma Origem**: Certifique-se de salvar no Admin antes
  - Recarregue a página do embed após salvar

### Configurações não salvam
- Verifique o console do navegador (F12)
- Limpe o cache (Ctrl + Shift + Delete)
- Tente em modo anônimo
- Verifique se tem espaço no localStorage

### Player mostra "Nenhum vídeo na playlist"
- Vá no Admin → Buscar
- Adicione pelo menos 1 vídeo
- Clique em "Salvar e Sincronizar"
- Recarregue a página

### Busca de filmes não funciona
- Cole sua chave da API do TMDB nas configurações
- Obtenha gratuitamente em: https://www.themoviedb.org/settings/api
- Verifique sua conexão com a internet

## 📄 Licença

MIT - Livre para uso pessoal e comercial

---

**Desenvolvido com ❤️ usando React + TypeScript + Vite**
