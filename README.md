# Cidade Viva — Jogo2

**Versão atual: Beta 0.0.9**

Protótipo de jogo 3D de mundo aberto urbano.

## Beta 0.0.9

- Corrigido o z-fighting que fazia o chão verde piscar por cima das ruas
- Terreno, asfalto e faixas passam a usar alturas separadas no eixo Y
- Inicialização mobile preparada para landscape
- Manifest do jogo agora declara orientação `landscape`
- Em navegadores compatíveis, fullscreen + orientation lock são solicitados na primeira interação
- Em iPhone/Safari, onde o navegador pode bloquear o orientation lock, o jogo usa um fallback visual horizontal sem loop de rotação
- Canvas e câmera passam a usar proporção lógica landscape também no fallback
- Removido o comportamento de tela pulando ao tentar alternar orientação repetidamente

## Beta 0.0.8

- Atropelamento passou a usar faixas de dano por velocidade e intensidade do impacto
- Impactos leves derrubam NPCs por alguns segundos e permitem que eles levantem feridos
- Impactos médios empurram e podem arremessar NPCs
- Impactos muito fortes podem matar, mas um atropelamento comum não causa mais morte instantânea
- Player recebe a mesma lógica de dano progressivo por impacto
- Pistola usa câmera em primeira pessoa
- Árvores, postes e semáforos podem cair quando atingidos com força suficiente
- Veículos explodem quando a integridade chega a 0
- Veículos possuem integridade, combustível e velocidade
- HUD de direção mostra velocidade em km/h, vida do veículo e combustível
- Carros destruídos permanecem na rua e são removidos por um guincho NPC

## Recursos atuais

- Dinheiro e vida do player
- Soco e pistola
- Câmera em primeira pessoa com arma
- Correr e agachar
- Veículos dirigíveis
- Saúde, combustível e velocímetro dos veículos
- Tráfego autônomo com NPCs motoristas
- Dano, avarias e explosão de veículos
- Árvores e postes derrubáveis
- Dano progressivo por atropelamento
- Serviço de guincho para carros destruídos
- Faixas de pedestre e semáforos
- NPCs circulando pelo mapa
- Colisão física entre player, NPCs, carros e elementos sólidos

## Controles PC

- `WASD`: mover / dirigir
- `Shift`: correr
- `C`: agachar
- `F`: alternar soco/pistola
- Clique esquerdo: socar ou atirar
- Botão direito + arrastar: câmera
- `E`: entrar/sair do carro

## Mobile

O jogo é projetado para landscape. Instalado como PWA, o manifest solicita landscape em fullscreen. Em navegadores que não liberam orientation lock, a interface usa um fallback horizontal estável.

## Tecnologia

HTML/CSS/JavaScript + Three.js, preparado para execução no navegador e GitHub Pages.

## Próximos marcos

1. Tráfego fazendo curvas e respeitando semáforos de forma sincronizada
2. Polícia, crimes e nível de procurado
3. Animações e modelos 3D melhores
4. Física de veículos com massa e derrapagem
5. Postos de combustível e oficinas
6. Casas, lojas e interiores
7. Inventário e múltiplas armas
8. Rotina diária e memória de longo prazo dos NPCs
9. Economia e missões
10. Multiplayer posteriormente
