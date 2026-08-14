import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

const isPortrait = () => window.innerHeight > window.innerWidth;

// Beta 0.0.9: elimina o z-fighting que fazia o chão verde piscar sobre o asfalto.
const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  for (const object of objects) {
    if (object?.isMesh && object.geometry?.type === 'PlaneGeometry') {
      const width = object.geometry.parameters?.width;
      const height = object.geometry.parameters?.height;
      if (width === 240 && height === 240) object.position.y = -0.04;
      if ((width === 18 && height === 240) || (width === 240 && height === 18)) object.position.y = 0.02;
    }
  }
  return originalSceneAdd.apply(this, objects);
};

// Quando o aparelho está fisicamente em pé, o jogo usa dimensões lógicas de landscape.
const originalSetSize = THREE.WebGLRenderer.prototype.setSize;
THREE.WebGLRenderer.prototype.setSize = function (width, height, updateStyle = true) {
  if (isPortrait()) return originalSetSize.call(this, height, width, updateStyle);
  return originalSetSize.call(this, width, height, updateStyle);
};

const originalUpdateProjection = THREE.PerspectiveCamera.prototype.updateProjectionMatrix;
THREE.PerspectiveCamera.prototype.updateProjectionMatrix = function () {
  if (isPortrait() && this.aspect < 1) this.aspect = 1 / this.aspect;
  return originalUpdateProjection.call(this);
};

const shell = document.querySelector('#landscape-shell');
function applyLandscapeFallback() {
  const portrait = isPortrait();
  document.documentElement.classList.toggle('portrait-device', portrait);
  if (shell) shell.dataset.logicalOrientation = portrait ? 'landscape-fallback' : 'landscape-native';
}
applyLandscapeFallback();

let lastPortrait = isPortrait();
window.addEventListener('resize', () => {
  const portrait = isPortrait();
  if (portrait !== lastPortrait) {
    lastPortrait = portrait;
    applyLandscapeFallback();
  }
}, { passive: true });

// Em Android/PWA e browsers compatíveis, a primeira interação confirma fullscreen + landscape.
let landscapeRequested = false;
async function requestLandscape() {
  if (landscapeRequested) return;
  landscapeRequested = true;
  try {
    if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
  } catch (_) {}
  try {
    if (screen.orientation?.lock) await screen.orientation.lock('landscape');
  } catch (_) {}
}
document.addEventListener('pointerdown', requestLandscape, { once: true, passive: true });
document.addEventListener('touchstart', requestLandscape, { once: true, passive: true });
