# Ghost 3D Forge

Novo projeto do antigo repositório Jogo2. O conteúdo anterior foi substituído por um MVP de reconstrução 3D **Frente + Verso → GLB**.

## O que funciona agora

- upload de PNG/JPG/WebP da frente e do verso;
- espelhamento automático do verso;
- máscara por transparência/fundo branco;
- reconstrução local de uma malha 3D fechada por silhueta;
- preview 3D com Three.js;
- controle de resolução, espessura e threshold;
- exportação `.glb` diretamente no navegador;
- sem servidor e sem API paga nesta primeira fase.

## Limite atual

Esta versão é um **MVP geométrico**, não um modelo generativo equivalente a Meshy. Ela reconstrói volume a partir das duas silhuetas. Para chegar ao nível profissional, a próxima fase deve adicionar estimativa de profundidade, vista lateral opcional, normal maps, retopologia e um backend com modelo Image-to-3D open-source.

## Executar

Sirva os arquivos por HTTP (GitHub Pages, Vercel, Firebase Hosting ou servidor local). Abrir apenas o arquivo HTML localmente pode impedir módulos ES por regras do navegador.
