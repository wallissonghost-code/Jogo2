# Live Battle Board

Projeto organizado em duas interfaces separadas:

- `/` — tela limpa da live.
- `/admin/` — painel administrativo em outra aba/dispositivo.
- `/js/state.js` — estado e normalização dos dados.
- `/js/realtime.js` — comunicação online em tempo real.
- `/js/live.js` — renderização exclusiva da tela da live.
- `/js/admin.js` — controles exclusivos do painel.
- `/assets/styles.css` — estilos compartilhados.

## Sincronização realtime

A comunicação principal usa Supabase Realtime por canal broadcast. O painel administrativo publica o estado sempre que há uma alteração e a tela da live recebe a mudança imediatamente, sem recarregar a página.

Isso permite usar, por exemplo, o painel no celular/iPad e a tela da live em outro computador/OBS. `BroadcastChannel` e `localStorage` continuam apenas como apoio local quando as duas páginas estão no mesmo navegador.

Neste estágio não existe integração com TikTok nem automação de presentes. A camada realtime serve somente para manter Painel Admin e Tela da Live conversando entre si.
