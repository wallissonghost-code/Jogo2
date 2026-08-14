# Cidade Viva — Jogo2

**Versão atual: Beta 0.1.3**

Protótipo de jogo 3D de mundo aberto urbano.

## Beta 0.1.3

- Corrigido o serviço de guincho para usar um veículo real da classe `Car`
- Guincho agora participa da mesma física e das mesmas colisões dos carros normais
- Guincho não deve atravessar carros, prédios, postes ou carcaças
- Guincho reduz e para quando encontra obstáculo, NPC ou veículo à frente
- Guincho continua respeitando os semáforos do mapa
- Adicionado NPC motorista visível dentro do guincho
- Veículo de serviço possui HP e combustível próprios e pode sofrer colisões
- Guincho continua saindo da base, indo até a ocorrência, engatando a carcaça e retornando para a base
- Veículo de serviço não pode ser roubado/dirigido pelo player
- Inicialização mobile revisada para priorizar landscape sem loop de rotação
- Manifest continua configurado como `fullscreen` e `orientation: landscape`

## Beta 0.1.2

- Base/garagem do guincho
- Semáforos verde, amarelo e vermelho com ciclo temporal
- Tráfego para em amarelo/vermelho
- Projéteis causam dano em NPCs e veículos
- Carcaças explodidas continuam sólidas

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
- Serviço urbano de guincho com base própria e NPC motorista
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
