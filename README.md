# 🎬 StreamCast - Video Player Pro

Sistema avançado de reprodução de vídeos com playlist e agendamento automático.

## ✨ Recursos

- 📺 **Player de Vídeo Customizado** - Controles personalizados e interface moderna
- 📋 **Sistema de Playlist** - Adicione múltiplos vídeos em sequência
- ⏰ **Agendamento Inteligente** - Configure vídeos para dias e horários específicos
- 💾 **Armazenamento Persistente** - Todas as configurações são salvas localmente
- 🔄 **Sincronização Automática** - Compartilhe configurações entre múltiplas instâncias
- 🎨 **Interface Moderna** - Design elegante com Tailwind CSS

## 🚀 Como Rodar

### 1. Instalar Dependências
```bash
npm install
```

### 2. Iniciar Servidor de Desenvolvimento
```bash
npm run dev
```

O aplicativo abrirá automaticamente em: http://localhost:3000

### 3. Build para Produção
```bash
npm run build
```

Os arquivos de produção estarão em: `dist/`

## 📖 Como Usar

### Configuração Inicial

1. **Abra o Painel Admin**
   - Clique no botão "Admin" no canto superior direito

2. **Adicione Vídeos à Playlist**
   - Vá para a aba "Playlist"
   - Insira a URL do vídeo (MP4, WebM, OGG)
   - Adicione um título (opcional)
   - Clique em "Adicionar à Playlist"

3. **Configure Agendamentos (Opcional)**
   - Vá para a aba "Agendamento"
   - Crie agendamentos para reproduzir vídeos específicos em horários definidos
   - Selecione os dias da semana
   - Defina horário de início e fim

4. **Ajuste as Configurações**
   - Aba "Configurações"
   - Ative/desative autoplay, loop e início mudo

5. **Salvar**
   - Clique em "Salvar e Aplicar em Todos os Sites"

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
- Verifique se a URL está correta
- Confirme que o formato é suportado
- Verifique CORS se for vídeo externo

### Configurações não salvam
- Verifique o console do navegador
- Limpe o cache (Ctrl + Shift + Delete)
- Tente em modo anônimo

## 📄 Licença

MIT - Livre para uso pessoal e comercial

---

**Desenvolvido com ❤️ usando React + TypeScript + Vite**
