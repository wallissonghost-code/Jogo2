# Cidade Viva — Jogo2

**Versão atual: Beta 0.0.8**

Protótipo de jogo 3D de mundo aberto urbano.

## Beta 0.0.8

- Atropelamento passou a usar faixas de dano por velocidade e intensidade do impacto
- Impactos leves derrubam NPCs por alguns segundos e permitem que eles levantem feridos
- Impactos médios empurram e podem arremessar NPCs
- Impactos muito fortes podem matar, mas um atropelamento comum não causa mais morte instantânea
- Player recebe a mesma lógica de dano progressivo por impacto
- Pistola passa a usar câmera em primeira pessoa
- Árvores continuam derrubáveis e postes/semáforos agora também podem cair quando atingidos com força suficiente
- Veículos explodem quando a integridade chega exatamente a 0
- Veículos agora possuem integridade, combustível e velocidade
- HUD de direção mostra velocidade em km/h, vida do veículo e combustível
- Combustível é consumido durante a condução e o carro perde aceleração ao chegar a zero
- Carros destruídos permanecem fisicamente na rua por alguns segundos
- Sistema de serviço urbano adiciona um guincho NPC para buscar veículos destruídos
- Guincho aproxima, engata o veículo e o leva para fora do mapa antes da remoção definitiva
- Tráfego continua com NPCs motoristas
- Saída segura de veículos e colisões volumétricas continuam ativas

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

O jogo possui interfaces separadas para movimentação a pé e direção e se adapta ao tamanho real da tela.

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