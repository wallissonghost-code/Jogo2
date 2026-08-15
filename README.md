# Cidade Viva — Jogo2

**Versão ativa: Beta 0.1.9**

Protótipo 3D de mundo aberto urbano executado diretamente no navegador/GitHub Pages.

## Runtime de produção

A versão ativa usa somente:

`index.html -> styles.css + game.js -> Three.js`

O `game.js` é o runtime consolidado. Builds antigas foram movidas para `legacy/` e existem apenas como histórico.

## Estrutura principal

- `game.js` — jogo ativo.
- `styles.css` — interface ativa.
- `manifest.webmanifest` — configuração PWA.
- `assets/vehicles/` — modelos 3D de veículos.
- `legacy/` — versões antigas; não são executadas.
- `docs/ARCHITECTURE.md` — regras de arquitetura e evolução.
- `scripts/validate.mjs` — validação contra regressões estruturais.

## Segurança contra quebra do runtime

Antes de aceitar mudanças, `npm run validate` verifica:

- sintaxe de `game.js`;
- tamanho mínimo do runtime para detectar truncamento acidental;
- presença do render loop e do guard de inicialização;
- consistência da versão entre HTML e JavaScript;
- ausência de `beta*.js` na raiz;
- ausência de `fetch/replace/Blob/import` usado para montar versões em runtime;
- presença dos assets principais.

O GitHub Actions executa essa validação automaticamente em pushes e pull requests para `main`.

## Regra de desenvolvimento

Não criar novas versões empilhando patches. Cada mudança deve evoluir o runtime atual ou, futuramente, módulos estáticos em `src/`, sempre com uma build completa e validável.

Consulte `docs/ARCHITECTURE.md` antes de alterações grandes.
