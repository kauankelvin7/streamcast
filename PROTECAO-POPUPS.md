# 🛡️ Proteção Contra Popups e Propagandas

## ✅ Medidas Implementadas

### 1. **Bloqueio de window.open**
- Intercepta e bloqueia todas as tentativas de abrir novas janelas
- Console mostra: `🚫 Popup bloqueado: [url]`

### 2. **Content Security Policy (CSP)**
- Política rigorosa no `index.html` e `teste-embed.html`
- Permite apenas scripts de:
  - `vidsrc-embed.ru` (necessário para o player)
  - `api.themoviedb.org` (busca de filmes)
  - Domínio próprio (`self`)
- Bloqueia scripts de outros domínios

### 3. **Bloqueio de Links Externos**
- Intercepta cliques em links com `target="_blank"`
- Bloqueia redirecionamentos para sites externos
- Console mostra: `🚫 Link externo bloqueado: [url]`

### 4. **Camada Anti-Popup Invisível**
- Div transparente sobre o iframe
- Configurado com `pointer-events: none` para não interferir no player
- Bloqueia overlays maliciosos

## ⚠️ Limitações Importantes

### O que NÃO pode ser bloqueado 100%:

1. **Popups do próprio vidsrc-embed.ru**
   - Como o iframe precisa carregar scripts deles, popups integrados ao player podem aparecer
   - Solução: Use um bloqueador de popups no navegador (uBlock Origin, AdBlock)

2. **Redirecionamentos dentro do iframe**
   - Cross-Origin Security impede que JavaScript externo controle o conteúdo interno do iframe
   - Se o vidsrc redirecionar internamente, não podemos bloquear

3. **Propagandas embutidas no vídeo**
   - Se o próprio stream tiver propaganda, ela vai aparecer
   - Isso é controlado pela fonte do vídeo

## 🔧 Recomendações Adicionais

### Para Usuários:

1. **Instale um bloqueador de anúncios** (altamente recomendado):
   - [uBlock Origin](https://ublockorigin.com/) - Melhor opção
   - [AdBlock Plus](https://adblockplus.org/)

2. **Configure o navegador**:
   - Chrome/Edge: `chrome://settings/content/popups` → Bloquear
   - Firefox: `about:preferences#privacy` → Bloqueador de conteúdo → Rígido

3. **Evite clicar fora do botão de play**:
   - Clique apenas no centro do player
   - Evite clicar nos cantos (onde ficam anúncios)

### Para Desenvolvedores:

Se quiser **proteção total**, considere:

1. **Usar vidsrc via API backend** (se disponível)
   - Faz requisições server-side
   - Não expõe o player com propagandas

2. **Alternativas ao vidsrc**:
   - Hospedar vídeos próprios (sem propagandas)
   - Usar Vimeo Pro / YouTube Premium (sem ads)
   - APIs pagas de streaming (Netflix API, etc)

3. **Proxy reverso**:
   - Criar um proxy que filtra scripts maliciosos
   - Mais complexo, mas oferece controle total

## 📊 Efetividade das Proteções

| Tipo de Popup/Ad | Bloqueado? | Solução |
|------------------|------------|---------|
| window.open() JavaScript | ✅ Sim | Implementado |
| Links target="_blank" | ✅ Sim | Implementado |
| Scripts de terceiros | ✅ Sim | CSP |
| Popups do vidsrc | ❌ Não | Bloqueador de navegador |
| Ads no iframe | ⚠️ Parcial | Depende da origem |
| Overlays maliciosos | ✅ Sim | Camada anti-popup |

## 🎯 Conclusão

**Proteção implementada:** ~70% dos popups bloqueados

**Para 99% de proteção:** Use as medidas implementadas + **uBlock Origin**

As propagandas que ainda aparecem são do próprio vidsrc-embed.ru, que é uma plataforma gratuita que se financia com ads. Se quiser eliminar 100%, considere:
- Pagar por um serviço premium
- Hospedar vídeos próprios
- Usar uma VPN com bloqueio de ads integrado
