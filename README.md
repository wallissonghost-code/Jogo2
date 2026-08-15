# Cidade Viva — Jogo2

**Versão atual: Beta 0.2.0**

Protótipo de jogo 3D de mundo aberto urbano.

## Arquitetura estabilizada

- Runtime consolidado em um único `game.js`
- Sem cadeia de patches `betaXXX -> betaXXX`
- Sem substituições textuais/Blob/import dinâmico para alterar versões antigas
- `index.html` aponta diretamente para `game.js`
- Falhas de inicialização exibem erro explícito
- Arquivos `beta*.js` antigos permanecem apenas como histórico

## Recursos atuais

- Vida, dinheiro e HUD mobile
- Soco, pistola, bandagem, carregador, reserva e recarga
- Projéteis visíveis e dano em NPCs/veículos
- Hitbox de cabeça e corpo
- Correr, agachar, deitar e pular
- Veículos dirigíveis e roubáveis
- Motoristas NPC visíveis no tráfego
- Carcaças destruídas sólidas
- Integridade, combustível e velocímetro
- Tráfego autônomo e semáforos temporizados
- Árvores e postes derrubáveis
- Dano progressivo por atropelamento
- Guincho físico, roubável, com aproximação de ré e modelo `tow_truck_simple.glb`
- Serviço de SAMU com médicos ocupando a ambulância e modelo `Bu.glb`
- Viaturas com modelo `police_car_simple.glb`, policiais armados e sistema de perseguição/procurado
- Ocupantes saem quando o veículo é roubado e podem tentar recuperar o veículo
- NPCs podem cometer roubo de veículo e serem tratados como criminosos
- IA local de percepção, memória e decisão dos NPCs

## Controles PC

- `WASD`: mover / dirigir
- `F`: trocar slot
- `R`: recarregar pistola
- `E`: entrar/sair de veículo
- `Espaço`: pular
- Arrastar câmera: olhar ao redor

## Tecnologia

HTML/CSS/JavaScript + Three.js, preparado para GitHub Pages e instalação como PWA.
