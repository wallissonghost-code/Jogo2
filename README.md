# Cidade Viva — Jogo2

**Versão atual: Beta 0.0.5**

Protótipo de jogo 3D em terceira pessoa inspirado em jogos de mundo aberto urbano.

## Beta 0.0.5

- Removido o conflito entre rotação por CSS e `screen.orientation`
- Tela em retrato não fica mais tentando girar repetidamente
- Layout passa a se adaptar ao tamanho real da tela
- Seleção de texto, callout e zoom acidental bloqueados durante a gameplay
- Joystick lateral corrigido em relação à orientação da câmera
- Movimento e rotação do player refinados
- Pose com pistola refeita com os braços apontados para frente
- Mira permanece alinhada ao centro da câmera
- Controles a pé somem completamente ao entrar no carro
- Veículo recebe interface própria: direção, freio, acelerador e sair
- Colisão básica adicionada a prédios, árvores e postes
- Player não atravessa carros nem prédios
- NPCs fazem separação física simples entre si e desviam de obstáculos
- Carros param ao bater em prédios e outros carros
- Carros empurram NPCs em baixa velocidade e causam atropelamento em velocidade maior
- Beta 0.0.5 visível no HUD e na tela de carregamento

## Recursos atuais

- Dinheiro e vida no HUD
- Soco e pistola
- Correr e agachar
- Entrada e saída de veículos
- Câmera interna do veículo
- Faixas de pedestre e semáforos
- NPCs circulando por calçadas e atravessando pelas faixas
- Memórias dos NPCs persistidas em `localStorage`
- Colisão física básica entre elementos principais do mundo

## Controles PC

- `WASD`: mover / dirigir
- `Shift`: correr
- `C`: agachar
- `F`: alternar soco/pistola
- Clique esquerdo: socar ou atirar
- Botão direito + arrastar: câmera
- Scroll: zoom
- `E`: entrar/sair do carro
- `Q`: memória do NPC

## Mobile

O jogo se adapta ao tamanho e à orientação reais da tela. Não tenta mais rotacionar artificialmente o navegador, evitando o efeito de tela pulando no Safari/iPhone. Em landscape o HUD usa o formato principal de gameplay; em portrait ele permanece utilizável sem loop de rotação.

## Tecnologia

HTML/CSS/JavaScript + Three.js, preparado para execução no navegador e GitHub Pages.

## Próximos marcos

1. Física mais avançada e colisores orientados para veículos
2. Animações e modelos 3D melhores
3. Trânsito autônomo e respeito aos semáforos
4. Polícia, crimes e nível de procurado
5. Casas, lojas e interiores
6. Inventário e múltiplas armas
7. Diálogos e rotina diária dos NPCs
8. Memória de longo prazo mais estruturada
9. Economia e missões
10. Multiplayer posteriormente