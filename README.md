# Cidade Viva — Jogo2

**Versão atual: Beta 0.1.1**

Protótipo de jogo 3D de mundo aberto urbano.

## Beta 0.1.1

- Carros destruídos continuam com colisão física completa até serem realmente removidos pelo guincho
- A carcaça explodida fica escurecida/queimada, mas não vira um objeto atravessável
- Colisões de outros veículos também reconhecem a carcaça como obstáculo
- Pistola passa a existir fisicamente na mão do player
- Disparo cria projétil visível no mundo em vez de apenas raycast invisível
- Projétil pode atingir NPCs, veículos e objetos sólidos
- Pistola usa carregador de 12 munições
- Munição inicial: 12 no carregador + 72 de reserva
- HUD de munição mostra carregador e reserva separadamente
- Adicionado botão RECARREGAR no mobile
- Tecla `R` recarrega no PC
- Recarga transfere munição da reserva para o carregador e não cria munição do nada
- Ao zerar o carregador, tentar atirar inicia recarga se ainda houver munição reserva

## Beta 0.1.0

- HUD mobile redesenhado sem emojis
- Player possui soco, pistola e bandagem
- Controles de ataque/tiro, mira, cura, correr, agachar, deitar e pular
- Interface de direção separada
- Veículos com velocímetro, integridade e combustível
- Guincho usa a malha viária e leva tempo para atender uma ocorrência
- Manifest PWA declara `orientation: landscape` e `display: fullscreen`

## Recursos atuais

- Vida e dinheiro
- Soco, pistola e bandagem
- Pistola com carregador, reserva e recarga
- Projéteis visíveis
- Tiro e mira
- Correr, agachar, deitar e pular
- Veículos dirigíveis
- Carcaças destruídas sólidas
- Integridade, combustível e velocímetro
- Tráfego autônomo
- Dano e explosão de veículos
- Árvores e postes derrubáveis
- Dano progressivo por atropelamento
- Serviço urbano de guincho
- NPCs e colisões físicas

## Controles PC

- `WASD`: mover / dirigir
- `F`: trocar slot
- `R`: recarregar pistola
- `E`: entrar/sair de veículo
- `Espaço`: pular
- Arrastar câmera: olhar ao redor

## Tecnologia

HTML/CSS/JavaScript + Three.js, preparado para GitHub Pages e instalação como PWA.

## Próximos marcos

1. Trânsito com curvas e semáforos sincronizados
2. Polícia, crimes e nível de procurado
3. Animações e modelos 3D melhores
4. Física automotiva com massa, derrapagem e suspensão
5. Postos de combustível e oficinas
6. Casas, lojas e interiores
7. Inventário de armas
8. Rotina diária e memória de longo prazo dos NPCs
9. Economia e missões
10. Multiplayer posteriormente
