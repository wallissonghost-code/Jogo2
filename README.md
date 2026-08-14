# Cidade Viva — Jogo2

**Versão atual: Beta 0.0.7**

Protótipo de jogo 3D em terceira pessoa inspirado em jogos de mundo aberto urbano.

## Beta 0.0.7

- Árvores agora podem ser derrubadas por impacto de veículos
- Veículos recebem vida própria e dano por colisão
- Carros podem ficar avariados e explodir ao chegar a 0 de integridade
- Colisões carro x carro causam dano proporcional ao impacto
- Colisões carro x prédio/poste/árvore também danificam o veículo
- Player atropelado perde vida conforme a velocidade do impacto
- NPC atropelado perde vida e pode morrer conforme a força da colisão
- Player morto entra em estado de recuperação e reaparece em spawn seguro
- Saída de veículo refeita com múltiplos pontos de saída ao redor do carro
- Se nenhuma saída estiver livre, o player é enviado automaticamente para um spawn seguro
- Estado do joystick e controles de direção é zerado ao sair do carro para evitar travamento
- Validação inicial procura carros sobrepostos, carros dentro de objetos e NPCs presos
- NPCs que aparecem dentro de obstáculos são reposicionados para pontos seguros
- Tráfego continua com sete carros e NPCs motoristas

## Recursos atuais

- Dinheiro e vida no HUD
- Soco e pistola
- Correr e agachar
- Entrada e saída de veículos
- Câmera interna do veículo
- Tráfego autônomo com NPCs motoristas
- Dano e explosão de veículos
- Árvores derrubáveis
- Dano por atropelamento
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
2. Sistema de polícia, crimes e nível de procurado
3. Animações e modelos 3D melhores
4. Física com massa, derrapagem e resposta de impacto mais avançada
5. Casas, lojas e interiores
6. Inventário e múltiplas armas
7. Diálogos e rotina diária dos NPCs
8. Memória de longo prazo mais estruturada
9. Economia e missões
10. Multiplayer posteriormente