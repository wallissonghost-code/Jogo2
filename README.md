# Cidade Viva — Jogo2

**Versão atual: Beta 0.0.3**

Protótipo de jogo 3D em terceira pessoa inspirado em jogos de mundo aberto urbano.

## Beta 0.0.3

- HUD remodelado para jogo em tela horizontal
- Versão visível no canto superior esquerdo
- Dinheiro e vida no HUD
- Troca entre soco e pistola
- Correr e agachar
- Joystick mobile analógico
- Controles mobile específicos para dirigir
- Botão Entrar/Sair dinâmico
- Câmera do jogador refeita
- Câmera interna do veículo refeita
- Geometria dos carros corrigida
- Faixas de pedestre refeitas
- Semáforos adicionados às travessias
- Árvores reposicionadas apenas nas áreas de calçada
- NPCs priorizam calçadas e atravessam usando rotas de faixa
- Atropelamento continua possível quando um NPC estiver efetivamente na travessia
- Memórias dos NPCs persistidas em `localStorage`

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

O layout é projetado para **modo paisagem**. Em modo retrato, o jogo solicita que o aparelho seja girado.

## Tecnologia

HTML/CSS/JavaScript + Three.js, preparado para execução no navegador e GitHub Pages.

## Próximos marcos

1. Colisões físicas com prédios, postes e veículos
2. Animações e modelos 3D melhores
3. Trânsito autônomo e respeito aos semáforos
4. Polícia, crimes e nível de procurado
5. Casas, lojas e interiores
6. Inventário e múltiplas armas
7. Diálogos e rotina diária dos NPCs
8. Memória de longo prazo mais estruturada
9. Economia e missões
10. Multiplayer posteriormente