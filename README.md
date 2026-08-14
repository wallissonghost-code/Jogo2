# Cidade Viva — Jogo2

**Versão atual: Beta 0.1.5**

Protótipo de jogo 3D de mundo aberto urbano.

## Estabilização da Beta 0.1.5

- Runtime consolidado em um único `game.js`
- Removida da execução principal a cadeia `beta015 -> beta014 -> beta012`
- Removidos `fetch`, substituições textuais e `Blob/import` em runtime da versão ativa
- `index.html` aponta diretamente para `game.js`
- Tela de carregamento só desaparece após o primeiro frame renderizado
- Falha de inicialização agora mostra erro explícito na tela em vez de carregar indefinidamente
- Mantida a versão Beta 0.1.5
- Arquivos `beta*.js` antigos permanecem apenas como histórico e não são carregados pelo jogo

## Recursos atuais

- Vida, dinheiro e HUD mobile
- Soco, pistola, bandagem, carregador, reserva e recarga
- Projéteis visíveis e dano em NPCs/veículos
- Hitbox de cabeça e corpo
- Correr, agachar, deitar e pular
- Veículos dirigíveis e roubáveis
- Motoristas NPC visíveis no tráfego
- Carcaças destruídas sólidas
- Integridade, combustível e velocímetro
- Tráfego autônomo e semáforos temporizados
- Árvores e postes derrubáveis
- Dano progressivo por atropelamento
- Guincho físico, roubável e com aproximação de ré
- Serviço de SAMU para NPCs feridos

## Controles PC

- `WASD`: mover / dirigir
- `F`: trocar slot
- `R`: recarregar pistola
- `E`: entrar/sair de veículo
- `Espaço`: pular
- Arrastar câmera: olhar ao redor

## Arquitetura

A versão ativa usa `index.html -> game.js -> Three.js`. Novas versões não devem modificar código antigo por `replace()` em runtime. Mudanças devem ser feitas no código-fonte consolidado, validadas em branch e só então promovidas para `main`.

## Tecnologia

HTML/CSS/JavaScript + Three.js, preparado para GitHub Pages e instalação como PWA.
