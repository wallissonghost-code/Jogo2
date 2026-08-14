# Cidade Viva — Jogo2

**Versão atual: Beta 0.0.4**

Protótipo de jogo 3D em terceira pessoa inspirado em jogos de mundo aberto urbano.

## Beta 0.0.4

- Câmera do player refeita com suavização e inércia controlada
- Joystick analógico refeito com zona morta e velocidade progressiva
- Movimento do personagem mais suave e rotação gradual
- Área da câmera separada da área do joystick no touch
- HUD mobile remodelado com visual mais profissional
- Tela de carregamento adicionada
- Jogo usa viewport lógico em landscape no celular
- Em modo retrato, a interface inteira é rotacionada para executar horizontalmente
- Tentativa automática de bloquear orientação em landscape quando o navegador permitir
- Beta 0.0.4 visível no HUD

## Recursos atuais

- Dinheiro e vida no HUD
- Soco e pistola
- Correr e agachar
- Entrada e saída de veículos
- Câmera interna do veículo
- Faixas de pedestre e semáforos
- NPCs circulando por calçadas e atravessando pelas faixas
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

O jogo é desenhado para formato horizontal. Quando aberto com o aparelho em pé, o viewport do jogo é montado e rotacionado para landscape sem mostrar uma tela obrigando o usuário a girar o aparelho. Quando o navegador permitir, o jogo também tenta bloquear a orientação em landscape após a primeira interação.

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