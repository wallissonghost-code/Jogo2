# Cidade Viva — Jogo2

**Versão atual: Beta 0.1.2**

Protótipo de jogo 3D de mundo aberto urbano.

## Beta 0.1.2

- Guincho passa a ter volume físico completo e não deve atravessar prédios, carros ou obstáculos
- Guincho utiliza a mesma lógica de bloqueio frontal usada pelos veículos de tráfego
- Serviço de guincho passa a circular pela malha viária até o local da ocorrência
- Adicionada base/garagem do serviço de guincho no mapa
- Depois do engate, a carcaça é levada de volta para a base antes da remoção definitiva
- Atendimento do guincho mantém tempo de espera, aproximação, posicionamento e engate
- Semáforos passam a ter três luzes: verde, amarelo e vermelho
- Ciclo inicial: 8 s verde, 2 s amarelo e 8 s vermelho
- Fluxos perpendiculares usam fases diferentes para reduzir cruzamentos simultâneos
- Tráfego e guincho verificam o estado do semáforo à frente e param no amarelo/vermelho
- Revisada a balística: projéteis visíveis causam 38 de dano em NPCs
- NPC morre somente quando o HP chega a zero
- Projéteis causam 10 de dano por acerto em veículos ainda não destruídos
- Carcaças explodidas continuam sólidas até o serviço de guincho removê-las

## Beta 0.1.1

- Carros destruídos continuam com colisão física completa até serem realmente removidos pelo guincho
- Pistola física na mão do player
- Projéteis visíveis
- Carregador de 12 munições + 72 de reserva
- HUD de carregador/reserva e recarga

## Recursos atuais

- Vida e dinheiro
- Soco, pistola e bandagem
- Pistola com carregador, reserva, recarga e projéteis físicos
- Tiro causa dano em NPCs e veículos
- Correr, agachar, deitar e pular
- Veículos dirigíveis
- Carcaças destruídas sólidas
- Integridade, combustível e velocímetro
- Tráfego autônomo
- Semáforos verde/amarelo/vermelho com ciclo temporal
- Dano e explosão de veículos
- Árvores e postes derrubáveis
- Dano progressivo por atropelamento
- Serviço urbano de guincho com base própria
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
