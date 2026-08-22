# Live Battle Board

Projeto organizado em duas interfaces separadas:

- `/` — tela limpa da live.
- `/admin/` — painel administrativo em outra aba.
- `/js/state.js` — estado compartilhado e sincronização entre abas.
- `/js/live.js` — renderização exclusiva da tela da live.
- `/js/admin.js` — controles exclusivos do painel.
- `/assets/styles.css` — estilos compartilhados.

## Sincronização

A comunicação local entre a tela da live e o painel usa `BroadcastChannel` com fallback por `localStorage`. Quando as duas abas estão abertas no mesmo navegador/origem, alterações de nome, votos, fotos, quantidade de participantes, rodada e valores dos presentes refletem imediatamente na tela da live.

Essa base foi separada deliberadamente para evitar misturar interface pública e administração no mesmo arquivo.
