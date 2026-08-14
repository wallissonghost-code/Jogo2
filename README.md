# Cidade Viva — Jogo2

**Versão atual: Beta 0.1.5**

Protótipo de jogo 3D de mundo aberto urbano.

## Beta 0.1.5

- Guincho passa a alinhar antes do atendimento e faz a aproximação final de ré para engatar a carcaça
- Mantida a fila de chamados de guincho para evitar veículos de serviço travados entre si
- Dano balístico passa a considerar regiões do corpo
- Headshot em NPC é fatal
- Tiro no corpo causa dano e derruba NPC vivo
- Motoristas dentro dos veículos passam a poder receber dano por tiro
- Motorista morto faz o veículo autônomo parar
- Adicionado serviço de SAMU para NPCs feridos
- Ambulância nasce na base, usa a malha viária, respeita obstáculos e vai até o NPC ferido
- Socorrista desce da ambulância, caminha até o paciente, realiza atendimento e recupera parte da vida
- NPC atendido levanta após o tratamento
- Atropelamento do player agora diferencia impacto leve, médio e forte
- Impacto leve derruba; impacto médio/forte arremessa o player por distância proporcional à velocidade

## Beta 0.1.4

- Revisão geral de tráfego e posicionamento inicial
- NPCs são validados e reposicionados para calçadas quando necessário
- Carros autônomos são realinhados para faixas de rua válidas
- Todo carro autônomo passa a ter motorista NPC visível
- Player pode roubar qualquer veículo inteiro e próximo, inclusive carros de tráfego e guinchos
- Guincho passa a ser roubável, receber dano e explodir como carro comum
- Chamados de guincho usam fila: apenas um atendimento ativo por vez
- Corrigido dano contínuo ao manter o acelerador pressionado contra um obstáculo
- Dano de colisão possui cooldown por impacto

## Recursos atuais

- Vida e dinheiro
- Soco, pistola e bandagem
- Pistola com carregador, reserva, recarga e projéteis físicos
- Hitbox de cabeça e corpo
- Tiro causa dano em NPCs, motoristas e veículos
- Correr, agachar, deitar e pular
- Veículos dirigíveis e roubáveis
- Motoristas NPC visíveis no tráfego
- Carcaças destruídas sólidas
- Integridade, combustível e velocímetro
- Tráfego autônomo
- Semáforos com ciclo temporal
- Dano e explosão de veículos
- Árvores e postes derrubáveis
- Dano progressivo por atropelamento e arremesso
- Serviço urbano de guincho com base própria
- SAMU com ambulância e socorrista
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
