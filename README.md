# Character Forge 3D

Protótipo de editor de personagem 3D modular criado sobre o antigo `Jogo2`.

## Base atual

- personagem humanoide pré-moldado e editável;
- hierarquia de corpo: cabeça, pescoço, tronco, quadril, braços, antebraços, mãos, coxas, pernas e pés;
- rig/skeleton hierárquico com controles individuais de rotação;
- proporções editáveis de altura, cabeça, ombros, tronco, braços, pernas, mãos e pés;
- presets Humano, Herói, Stylized e Slim;
- materiais PBR básicos com cor, roughness e metallic;
- upload de textura para o material principal;
- movimentos procedurais: Idle, Andar, Correr, Pular, Acenar e Ataque;
- câmera frente/lado/costas;
- exportação do personagem atual para `.glb`.

## Objetivo

Evoluir para um editor de personagem completo: mesh deformável, skeleton/skin weights, roupas/acessórios modulares, texturas por região, biblioteca de animações e exportação game-ready.

## Executar

Hospede `index.html`, `styles.css` e `app.js` via GitHub Pages ou outro servidor HTTP estático. O projeto usa Three.js por CDN.
