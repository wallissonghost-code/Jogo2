# Cidade Viva — Jogo2

**Versão atual: Beta 0.0.6**

Protótipo de jogo 3D em terceira pessoa inspirado em jogos de mundo aberto urbano.

## Beta 0.0.6

- Tráfego autônomo adicionado ao mapa
- NPCs passam a ser associados aos veículos de tráfego como motoristas
- Sete carros de tráfego circulando pelas vias
- Veículos reduzem/paralisam quando existe outro carro diretamente à frente
- Colisão dos carros refeita usando o volume inteiro do veículo
- Frente, traseira e laterais passam a bloquear corretamente o player e NPCs
- Colisão carro x carro usa pontos distribuídos pelo comprimento e largura do veículo
- Colisão de veículos com prédios/postes/árvores usa vários pontos do chassi
- Player não consegue mais entrar fisicamente na frente ou traseira do carro por causa de uma barreira apenas central
- NPCs reconhecem o volume completo dos veículos ao caminhar
- Spawn seguro continua ativo
- HUD refinado e mais compacto
- Indicador de quantidade de tráfego adicionado ao HUD
- Ajustes de iluminação, fog, contraste e materiais

## Recursos atuais

- Dinheiro e vida no HUD
- Soco e pistola
- Correr e agachar
- Entrada e saída de veículos
- Câmera interna do veículo
- Tráfego autônomo
- Faixas de pedestre e semáforos
- NPCs circulando por calçadas e atravessando pelas faixas
- Memórias dos NPCs persistidas em `localStorage`
- Colisão física entre player, NPCs, carros e elementos sólidos do mapa

## Controles PC

- `WASD`: mover / dirigir
- `Shift`: correr
- `C`: agachar
- `F`: alternar soco/pistola
- Clique esquerdo: socar ou atirar
- Botão direito + arrastar: câmera
- `E`: entrar/sair do carro
- `Q`: memória do NPC

## Mobile

O jogo se adapta ao tamanho e à orientação reais da tela e possui interfaces separadas para movimentação a pé e direção.

## Tecnologia

HTML/CSS/JavaScript + Three.js, preparado para execução no navegador e GitHub Pages.

## Próximos marcos

1. Trânsito fazendo curvas e respeitando semáforos de forma sincronizada
2. Física mais avançada com resposta de impacto e massa
3. Animações e modelos 3D melhores
4. Polícia, crimes e nível de procurado
5. Casas, lojas e interiores
6. Inventário e múltiplas armas
7. Diálogos e rotina diária dos NPCs
8. Memória de longo prazo mais estruturada
9. Economia e missões
10. Multiplayer posteriormente