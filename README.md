# Cidade Viva — Jogo2

**Versão atual: Beta 0.1.0**

Protótipo de jogo 3D de mundo aberto urbano.

## Beta 0.1.0

- Núcleo da gameplay reorganizado para reduzir os remendos acumulados das versões 0.0.x
- HUD mobile redesenhado sem emojis e com linguagem visual mais próxima de jogos de ação
- Player possui seleção entre soco, pistola e bandagem
- Adicionados controles dedicados de ataque/tiro, mira, cura, correr, agachar, deitar e pular
- Pistola usa mira em primeira pessoa quando o botão MIRA está ativo
- Bandagens recuperam vida e possuem quantidade limitada
- HUD mantém dinheiro e vida do player
- Interface de direção continua separada da interface a pé
- Veículo mantém velocímetro, integridade e combustível
- Árvores e postes continuam derrubáveis
- Dano de atropelamento continua proporcional ao impacto
- Serviço de guincho refeito para utilizar a malha viária: o guincho nasce na rua, percorre a via até a região do acidente, posiciona-se, espera durante o processo de engate e só depois reboca a carcaça para fora do mapa
- Carcaças destruídas não desaparecem imediatamente
- Removida a rotação CSS do DOM inteiro que deixava o jogo lateral no Safari
- Manifest PWA continua declarando `orientation: landscape` e `display: fullscreen`
- Browsers que oferecem Orientation Lock recebem solicitação de landscape após a primeira interação

## Orientação no iPhone

O projeto é um jogo web. Instalado/adicionado à tela inicial como PWA, utiliza `display: fullscreen` e `orientation: landscape` do manifest. Aberto como uma aba normal do Safari, o navegador pode negar o bloqueio programático de orientação; nessa situação a Beta 0.1.0 mantém o layout íntegro em vez de rotacionar artificialmente toda a página.

## Recursos atuais

- Vida e dinheiro
- Soco, pistola e bandagem
- Tiro e mira
- Correr, agachar, deitar e pular
- Câmera em primeira pessoa ao mirar com pistola
- Veículos dirigíveis
- Integridade, combustível e velocímetro
- Tráfego autônomo
- Dano e explosão de veículos
- Árvores e postes derrubáveis
- Dano progressivo por atropelamento
- Serviço urbano de guincho
- Faixas de pedestre
- NPCs circulando pelo mapa
- Colisões entre player, NPCs, veículos e objetos sólidos

## Controles PC

- `WASD`: mover / dirigir
- `F`: trocar slot
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
