# Autoplay e reprodução contínua — auditoria 2026-10-21

## O que é comprovado e o que não é

- **EmbedMaster:** `autoplay=on&welcome_page=off` e comandos de `play`/`mute` estão documentados, mas dependem das permissões do navegador e da disponibilidade do player. API: https://embedmaster.com/documentation/
- **VidSrc TW/vSEmbed:** `autoplay=1&autonext=1` é documentado para séries. No domínio público, **autoplay sem o primeiro clique não é suportado**, conforme a documentação do próprio provedor. Fontes: https://vidsrc.tw/vidsrc/docs/ e https://vsembed.ru/vidsrc/docs/
- **VidSrc CC, 2Embed e MultiEmbed:** sem evidência suficiente de uma API pública de comandos de play/mute/evento de término nestas versões. Não tentar clicar no DOM cross-origin ou enviar comandos genéricos inventados.
- **Vídeo próprio HTML5:** `<video muted autoPlay playsInline>` e `play().catch(...)` são os mecanismos padrão, com `ended` para próxima mídia. Fontes: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay e https://developer.mozilla.org/en-US/docs/Web/API/HTMLMediaElement/play
- **Políticas do Chrome:** autoplay mutado é normalmente permitido; `allow="autoplay"` delega a permissão para iframes, mas não supera a decisão do provedor nem autoriza autoplay sonoro. https://developer.chrome.com/blog/autoplay/

## Ativar sequência do próprio servidor no embed

Apenas para os provedores que documentam `autonext`:

- `/embed?provider=vidsrc-tw&nativeAutonext=1`
- `/embed?provider=vidsrc-me&nativeAutonext=1`

Neste modo, o Streamcast deixa de trocar o iframe quando recebe `completed` para séries. **O provedor assume a responsabilidade pela sequência**, evitando dupla transição. Se o primeiro vídeo mostrar botão Play, será necessário o clique: isso é uma restrição explícita do domínio público do provedor. O painel externo do Streamcast não deve assumir que conhece a posição do episódio que avançou internamente.

Sem o parâmetro ou nos outros provedores, `autonext=0` e o Streamcast mantém o controle próprio dos eventos compatíveis; os demais não têm auto-next comprovado.

## Validação reproduzível no Chrome/Edge

1. Abrir a rota `/embed` com a URL acima num navegador com perfil limpo.
2. Em DevTools → Network, confirmar que o iframe recebe `autoplay=1&autonext=1` no VidSrc TW ou vSEmbed, ou `autoplay=on&welcome_page=off` no EmbedMaster.
3. Registrar se apareceu botão de Play e se o vídeo começou sem interação. **Não considerar o mero carregamento do iframe como reprodução comprovada.**
4. Verificar se iniciou **sem áudio** antes de qualquer gesto humano; a ausência de API mute no VidSrc impede afirmar isso previamente.
5. Reproduzir um episódio curto disponibilizado legalmente pelo provedor, coletar os `PLAYER_EVENT` `playing` e `completed` com timestamp (sem registrar URLs sensíveis, cookies ou mídia) e verificar transição sem recarga do iframe pelo Streamcast.
6. Repetir para pausa, buffering, troca de servidor e episódio seguinte. Testar outro navegador/perfil, pois autoplay depende de política e preferências.
7. Para HTML5 próprio, monitorar `video.play()` e `NotAllowedError`; quando negado, mostrar uma ação de Play genuinamente clicável, nunca simular eventos artificiais.

## Limitações de segurança

Não usar hacks de clique sintético, scripts injetados, proxies não autorizados nem extensão que tente violar a mesma-origem. Chrome possui switches e políticas para instalação **gerenciada pelo dono do navegador**, mas isso não altera a UI nem o servidor do provedor. A sugestão de domínio personalizado da VidSrc exige controle de DNS e SSL, não foi aplicada; verificar termos e segurança (o guia sugere Cloudflare SSL Flexible, que **não cifra** o trecho Cloudflare → origem). Não alterar infraestrutura sem análise e aprovação específica.

## Evidência automatizada

A CI roda `npm ci`, `npm test`, `npx tsc --noEmit`, `npm run build`. Esses testes demonstram regras locais e formato das URLs/comunicações, **não provam** a reprodução de filmes/episódios em provedores externos no navegador.
