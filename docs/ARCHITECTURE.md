# Arquitetura — Cidade Viva

## Runtime ativo

A produção deve carregar somente esta cadeia:

`index.html -> styles.css + game.js -> Three.js`

Arquivos em `legacy/` são histórico e **nunca** podem ser importados pelo runtime.

## Estrutura

- `index.html`: shell, HUD e controles.
- `game.js`: runtime consolidado atual.
- `styles.css`: estilos ativos.
- `manifest.webmanifest`: PWA/orientação.
- `assets/vehicles/`: modelos 3D de veículos.
- `legacy/js/`: builds e patches antigos preservados apenas para referência.
- `legacy/css/`: estilos antigos preservados apenas para referência.
- `docs/`: documentação técnica e histórico.
- `scripts/validate.mjs`: invariantes que impedem regressões estruturais.
- `.github/workflows/validate.yml`: validação automática em push/PR.

## Regras obrigatórias para novas versões

1. Nunca criar `betaXYZ.js` para modificar outra versão em runtime.
2. Nunca usar `fetch -> replace -> Blob -> import` para montar o jogo.
3. Alterar o runtime consolidado e manter `index.html` apontando apenas para `game.js`.
4. Versões devem existir no histórico Git/commits/tags, não como cadeias executáveis.
5. Antes de promover uma mudança para `main`, executar `npm run validate`.
6. O boot precisa manter `showFatal` e só esconder loading depois do primeiro frame.
7. Assets devem ficar organizados em `assets/`, nunca soltos na raiz.

## Próxima evolução recomendada

`game.js` ainda é monolítico. A próxima refatoração deve ser feita por módulos ES estáticos, sem alterar comportamento:

- `src/core/` — boot, renderer, clock e loop.
- `src/world/` — mapa, ruas, semáforos e colisores estáticos.
- `src/entities/` — Player, NPC e Car.
- `src/systems/` — tráfego, armas, SAMU, guincho e polícia.
- `src/ui/` — HUD e controles.

Essa migração deve ocorrer gradualmente em branch, mantendo uma versão executável validada a cada etapa.
