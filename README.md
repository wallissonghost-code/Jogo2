# Cidade Viva — Jogo2

**Versão atual: Beta 0.1.4**

Protótipo de jogo 3D de mundo aberto urbano.

## Beta 0.1.4

- Revisão geral de tráfego e posicionamento inicial
- NPCs são validados e reposicionados para calçadas quando necessário
- Carros autônomos são realinhados para faixas de rua válidas
- Todo carro autônomo passa a ter motorista NPC visível
- Player pode roubar qualquer veículo inteiro e próximo, inclusive carros de tráfego e guinchos
- Ao roubar um carro com NPC, o motorista deixa o controle do veículo
- Guincho passa a ser roubável, receber dano e explodir como carro comum
- Chamados de guincho passam a usar fila: apenas um atendimento ativo por vez
- Se um guincho for roubado ou destruído durante um chamado, o serviço agenda outro atendimento
- Guinchos verificam carros, NPCs, obstáculos e semáforos à frente
- Corrigido dano contínuo ao manter o acelerador pressionado contra um obstáculo
- Dano de colisão agora possui cooldown e é aplicado por evento de impacto, não a cada frame
- HUD do player recebeu refinamento visual com cards menores, contraste melhor e controles mais consistentes

## Beta 0.1.3

- Guincho passou a usar veículo da classe Car
- NPC motorista visível no guincho
- Colisões e física do guincho alinhadas com os demais veículos

## Beta 0.1.2

- Base do guincho
- Semáforos verde/amarelo/vermelho com ciclo temporal
- Balística com dano em NPCs e veículos

## Recursos atuais

- Vida e dinheiro
- Soco, pistola e bandagem
- Pistola com carregador, reserva, recarga e projéteis físicos
- Tiro causa dano em NPCs e veículos
- Correr, agachar, deitar e pular
- Veículos dirigíveis e roubáveis
- Motoristas NPC visíveis no tráfego
- Carcaças destruídas sólidas
- Integridade, combustível e velocímetro
- Tráfego autônomo
- Semáforos com ciclo temporal
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
