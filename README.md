# Ghost 3D Forge

Projeto de geração 3D a partir de imagens.

## Modos atuais

### 1. Visual Hull local
- frente + verso obrigatórios;
- laterais opcionais/recomendadas;
- roda totalmente no navegador;
- exporta `.glb`;
- não usa servidor nem API paga;
- bom para volume geral, mas limitado em detalhes finos.

### 2. IA no Google Colab com Stable Fast 3D
Foi adicionado o notebook:

`colab/Ghost_3D_Forge_SF3D.ipynb`

Abrir diretamente no Colab:

https://colab.research.google.com/github/wallissonghost-code/Jogo2/blob/main/colab/Ghost_3D_Forge_SF3D.ipynb

O notebook:
1. verifica GPU;
2. instala o SF3D oficial;
3. faz login no Hugging Face;
4. recebe uma imagem;
5. gera o modelo 3D com textura;
6. baixa o resultado em GLB.

## Observação importante

O SF3D oficial trabalha com uma imagem por geração. Para o primeiro teste, use a imagem frontal mais limpa e bem centralizada. A reconstrução multi-view real será uma etapa posterior.

## Requisito do SF3D

O modelo oficial da Stability AI é gated no Hugging Face, então é necessário solicitar acesso ao modelo e usar um token de leitura no Colab.
