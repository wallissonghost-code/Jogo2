import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

// Beta 0.0.9 bootstrap: corrige z-fighting entre o terreno e as vias antes do mundo ser criado.
const originalSceneAdd = THREE.Scene.prototype.add;
THREE.Scene.prototype.add = function (...objects) {
  for (const object of objects) {
    if (object?.isMesh && object.geometry?.type === 'PlaneGeometry') {
      const width = object.geometry.parameters?.width;
      const height = object.geometry.parameters?.height;
      if (width === 240 && height === 240) object.position.y = -0.035;
      if ((width === 18 && height === 240) || (width === 240 && height === 18)) object.position.y = 0.018;
    }
  }
  return originalSceneAdd.apply(this, objects);
};

const shell = document.querySelector('#landscape-shell');

function applyLandscapeFallback() {
  const portrait = window.innerHeight > window.innerWidth;
  document.documentElement.classList.toggle('portrait-device', portrait);
  if (!shell) return;
  shell.dataset.logicalOrientation = portrait ? 'landscape-fallback' : 'landscape-native';
}

applyLandscapeFallback();

// Atualiza somente quando a orientação realmente muda; evita loop de resize no Safari.
let lastPortrait = window.innerHeight > window.innerWidth;
window.addEventListener('resize', () => {
  const portrait = window.innerHeight > window.innerWidth;
  if (portrait !== lastPortrait) {
    lastPortrait = portrait;
    applyLandscapeFallback();
  }
}, { passive: true });

// Browsers que suportam orientation lock podem entrar em landscape após a primeira interação.
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
