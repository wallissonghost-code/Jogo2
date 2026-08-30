# Live+ SDK

Este jogo usa o SDK canônico do Live+ v1 hospedado pelo Projeto Daniel.

Fonte canônica:
`https://wallissonghost-code.github.io/projeto-daniel/sdk/liveplus-game-sdk-v1.js`

O arquivo local `js/liveplus-game-session.js` é apenas um adaptador do Jogo2 para compactar imagens ao sincronizar estado. A conexão, ticket invisível, relay, WebRTC, provisionamento e fallback pertencem ao SDK canônico.

Novos jogos devem usar o SDK v1 diretamente e implementar somente manifesto + comandos do próprio jogo.