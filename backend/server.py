import os, sys, uuid, shutil, subprocess
from pathlib import Path
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Ghost 3D Forge AI")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

ROOT = Path(os.getenv("GHOST3D_WORKDIR", "/tmp/ghost3d"))
ROOT.mkdir(parents=True, exist_ok=True)
SF3D_DIR = Path(os.getenv("SF3D_DIR", "stable-fast-3d"))
BLENDER = os.getenv("BLENDER_BIN", "blender")
jobs = {}

async def save_upload(file: UploadFile, dest: Path):
    with dest.open("wb") as f:
        while chunk := await file.read(1024 * 1024): f.write(chunk)

def run_job(job_id: str, main_image: Path, job_dir: Path):
    jobs[job_id] = {"status":"generating", "progress":20}
    out = job_dir / "sf3d"
    out.mkdir(exist_ok=True)
    try:
        cmd = [sys.executable, str(SF3D_DIR / "run.py"), str(main_image), "--output-dir", str(out), "--remesh_option", "triangle", "--target_vertex_count", "50000"]
        subprocess.run(cmd, cwd=SF3D_DIR, check=True)
        candidates = list(out.rglob("*.glb"))
        if not candidates: raise RuntimeError("SF3D não produziu GLB")
        generated = candidates[0]
        final = job_dir / "ghost3d-final.glb"
        jobs[job_id] = {"status":"optimizing", "progress":75}
        blender_script = Path(__file__).with_name("blender_cleanup.py")
        if shutil.which(BLENDER):
            subprocess.run([BLENDER,"--background","--python",str(blender_script),"--",str(generated),str(final)], check=True)
        else:
            shutil.copy2(generated, final)
        jobs[job_id] = {"status":"done", "progress":100, "file":str(final)}
    except Exception as e:
        jobs[job_id] = {"status":"error", "progress":0, "error":str(e)}

@app.get("/health")
def health():
    return {"ok":True, "engine":"stable-fast-3d", "sf3d_found":(SF3D_DIR / "run.py").exists()}

@app.post("/generate")
async def generate(background_tasks: BackgroundTasks, front: UploadFile = File(...), back: UploadFile | None = File(None), left: UploadFile | None = File(None), right: UploadFile | None = File(None), top: UploadFile | None = File(None)):
    job_id = uuid.uuid4().hex
    job_dir = ROOT / job_id
    job_dir.mkdir(parents=True)
    front_path = job_dir / "front.png"
    await save_upload(front, front_path)
    for name, upload in [("back",back),("left",left),("right",right),("top",top)]:
        if upload: await save_upload(upload, job_dir / f"{name}.png")
    jobs[job_id] = {"status":"queued", "progress":5}
    background_tasks.add_task(run_job, job_id, front_path, job_dir)
    return {"job_id":job_id}

@app.get("/jobs/{job_id}")
def job(job_id: str):
    if job_id not in jobs: raise HTTPException(404,"Job não encontrado")
    return jobs[job_id]

@app.get("/jobs/{job_id}/download")
def download(job_id: str):
    data=jobs.get(job_id)
    if not data or data.get("status")!="done": raise HTTPException(409,"GLB ainda não está pronto")
    return FileResponse(data["file"], media_type="model/gltf-binary", filename="ghost3d-final.glb")
