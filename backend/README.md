# Ghost 3D Forge — AI Backend

O frontend do GitHub Pages não consegue executar modelos 3D pesados. Esta pasta prepara o projeto para usar um worker GPU externo.

## Motor inicial recomendado

**Stable Fast 3D (SF3D)** para o primeiro backend: gera GLB diretamente, requer aproximadamente 6 GB de VRAM e já possui UV, materiais e opções de remesh.

Depois podemos adicionar Hunyuan3D 2.1 como modo Premium para geometria/PBR de maior qualidade.

## Fluxo

1. Frontend envia frente/verso/laterais para `POST /generate`.
2. Backend escolhe a vista principal e prepara as referências.
3. SF3D gera a malha base em GLB.
4. Blender headless executa limpeza, smooth, decimate/remesh, normais e exportação final.
5. `GET /jobs/{id}` informa progresso.
6. `GET /jobs/{id}/download` devolve o GLB.

## Execução local do gateway

```bash
pip install -r backend/requirements.txt
uvicorn backend.server:app --host 0.0.0.0 --port 8000
```

Configure:

- `SF3D_DIR`: caminho do clone de `Stability-AI/stable-fast-3d`
- `BLENDER_BIN`: executável do Blender, opcional
- `GHOST3D_WORKDIR`: pasta temporária, opcional

> GitHub Pages continua sendo apenas o frontend. Para geração neural real é necessário executar este backend em uma máquina/serviço com GPU.
