import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

// Menu titles and buttons map (global scope)
const menuMap = {
  'Dosya': {tr: 'Dosya', en: 'File'},
  'Yeni': {tr: 'Yeni', en: 'New'},
  'Kaydet': {tr: 'Kaydet', en: 'Save'},
  'Farklı Kaydet': {tr: 'Farklı Kaydet', en: 'Save As'},
  'Aç': {tr: 'Aç', en: 'Open'},
  'Ekle': {tr: 'Ekle', en: 'Add'},
  'Küp': {tr: 'Küp', en: 'Cube'},
  'Küre': {tr: 'Küre', en: 'Sphere'},
  'Silindir': {tr: 'Silindir', en: 'Cylinder'},
  'Plane': {tr: 'Plane', en: 'Plane'},
  'Ayarlar': {tr: 'Ayarlar', en: 'Settings'},
  'Hakkında': {tr: 'Hakkında', en: 'About'},
  'Dil': {tr: 'Dil >', en: 'Language >'},
  'Türkçe': {tr: 'Türkçe', en: 'Turkish'},
  'İngilizce': {tr: 'İngilizce', en: 'English'},
  'Geri Al': {tr: 'Geri Al', en: 'Undo'},
  'Yinele': {tr: 'Yinele', en: 'Redo'},
  'Tema': {tr: 'Tema >', en: 'Theme >'},
  'Koyu': {tr: 'Koyu', en: 'Dark'},
  'Açık': {tr: 'Açık', en: 'Light'}
};

// Function to handle cookie operations
function setCookie(name, value, days) {
    let expires = '';
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
}

function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
}

// Read language from cookie, default to 'tr' if not set
globalThis.currentLanguage = getCookie('lang') || 'tr'; // Default to Turkish

function updateLanguage() {
    // Update menu and other UI elements
    // Title
    updateAppTitle();
    // Check if mobile
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    let statusText = '';
    if (isMobile) {
      statusText = currentLanguage === 'tr'
        ? 'Kısayollar: [Tek Dokun] Seç/Sürükle | [Çift Dokun] Sil | [İki Parmak] Kamera | [İki Parmak Sürükle] Pan | [Uzun Bas] Menü'
        : 'Shortcuts: [Tap] Select/Move | [Double Tap] Delete | [Two Fingers] Camera | [Two Fingers Drag] Pan | [Long Press] Menu';
    } else {
      statusText = currentLanguage === 'tr'
        ? 'Kısayollar: [Shift] Taşı | [Ctrl] Ölçekle | [Sağ Tık] Reset | [Del] Sil | [Orta Tık] Pan | [Ctrl+Z] Geri Al | [Ctrl+Y] Yinele'
        : 'Shortcuts: [Shift] Move | [Ctrl] Scale | [Right Click] Reset | [Del] Delete | [Middle Click] Pan | [Ctrl+Z] Undo | [Ctrl+Y] Redo';
    }
    document.getElementById('statusBar').textContent = statusText;
    // Menu titles and buttons
    document.querySelectorAll('#menu button').forEach(btn => {
      const label = btn.getAttribute('data-label');
      if (label && menuMap[label]) {
        btn.textContent = menuMap[label][currentLanguage];
      }
    });

    // Update theme buttons
    const darkThemeBtn = document.getElementById('darkTema');
    const lightThemeBtn = document.getElementById('lightTema');
    if (darkThemeBtn) {
        darkThemeBtn.textContent = menuMap['Koyu'][currentLanguage];
    }
    if (lightThemeBtn) {
        lightThemeBtn.textContent = menuMap['Açık'][currentLanguage];
    }
}

// Theme handling
function setTheme(theme) {
    document.body.className = theme;
    setCookie('theme', theme, 365);
    
    if (theme === 'dark') {
        renderer.setClearColor(0x1a2233);
        grid.material.color.setHex(0xffffff);
    } else {
        renderer.setClearColor(0xf0f0f0);
        grid.material.color.setHex(0x666666); // Daha koyu gri renk
    }
}

// Apply saved theme on page load
const savedTheme = getCookie('theme') || 'dark';
document.body.className = savedTheme;

// All script code moved here
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 1, 2000);
let renderer = new THREE.WebGLRenderer({canvas: document.getElementById('scene'), antialias:true});
renderer.setClearColor(0x222222);
renderer.setSize(window.innerWidth, window.innerHeight);

let light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1,1,2);
scene.add(light);
scene.add(new THREE.AmbientLight(0xffffff, 0.5));

// Ensure the grid is always visible by adjusting its rendering order and visibility
const grid = new THREE.GridHelper(800, 20, 0x888888, 0x444444);
grid.position.y = -50;
grid.renderOrder = -1; // Render the grid below other objects
scene.add(grid);

let objects = [];
let selected = null;
let drag = false, lastX = 0, lastY = 0;
let isShift = false;
let isCtrl = false;
let cameraOrbit = {rotY: 0, rotX: 0, distance: 400};
let cameraTargetOrbit = {...cameraOrbit};
let isCameraDrag = false;
let currentFileName = '';
let isDirty = false;
let selectedFaceNormal = null;
let isPanning = false;
let lastPan = null;
let panOffset = {x: 0, y: 0};
const PAN_SMOOTHNESS = 0.08; // Increased from 0.02 for faster pan movement
let targetPanOffset = { x: 0, y: 0 };

let undoStack = [];
let redoStack = [];

// Undo/redo stack'lerine maksimum boyut sınırı ekle
function saveStateForUndo() {
  const state = objects.map(obj => ({
    type: obj.geometry.type,
    position: [obj.position.x, obj.position.y, obj.position.z],
    scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    rotX: obj.userData.rotX || 0,
    rotY: obj.userData.rotY || 0,
    color: obj.material.color.getHex()
  }));
  undoStack.push(JSON.stringify(state));
  if (undoStack.length > 50) undoStack.shift(); // Maksimum 50 adım
  redoStack = [];
}

function restoreState(stateStr) {
  try {
    const arr = JSON.parse(stateStr);
    for (const obj of objects) {
      scene.remove(obj);
      if (obj.userData.outline) scene.remove(obj.userData.outline);
    }
    objects = [];
    for (const item of arr) {
      let mesh, geometry;
      const color = new THREE.Color(item.color);
      if (item.type === 'BoxGeometry') {
        geometry = new THREE.BoxGeometry(50,50,50);
        mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshPhongMaterial({color, transparent:true, opacity:0.8})
        );
      } else if (item.type === 'SphereGeometry') {
        geometry = new THREE.SphereGeometry(30, 32, 24);
        mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshPhongMaterial({color, transparent:true, opacity:0.8})
        );
      } else if (item.type === 'CylinderGeometry') {
        geometry = new THREE.CylinderGeometry(25,25,60, 32);
        mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshPhongMaterial({color, transparent:true, opacity:0.8})
        );
      } else if (item.type === 'PlaneGeometry') {
        geometry = new THREE.PlaneGeometry(80, 80, 1, 1);
        mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshPhongMaterial({color, transparent:true, opacity:0.8, side: THREE.DoubleSide})
        );
      } else {
        continue;
      }
      mesh.position.fromArray(item.position);
      mesh.scale.fromArray(item.scale);
      mesh.userData = {rotX: item.rotX, rotY: item.rotY};
      scene.add(mesh);
      addOutline(mesh, geometry);
      objects.push(mesh);
    }
    selected = null;
  } catch(err) { alert('Undo/redo failed!'); }
}

function undo() {
  if (undoStack.length === 0) return;
  const currentState = objects.map(obj => ({
    type: obj.geometry.type,
    position: [obj.position.x, obj.position.y, obj.position.z],
    scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    rotX: obj.userData.rotX || 0,
    rotY: obj.userData.rotY || 0,
    color: obj.material.color.getHex()
  }));
  redoStack.push(JSON.stringify(currentState));
  const prevState = undoStack.pop();
  restoreState(prevState);
  markDirty();
}

function redo() {
  if (redoStack.length === 0) return;
  saveStateForUndo();
  const nextState = redoStack.pop();
  restoreState(nextState);
  markDirty();
}

// <title> etiketini güncelle
function updateAppTitle() {
  let title = '3D Design';
  if (currentFileName) title += ' - ' + currentFileName;
  if (isDirty) title += ' *';
  document.getElementById('projectName').textContent = title;
  document.title = title;
}

function markDirty() {
  isDirty = true;
  updateAppTitle();
}

function markClean() {
  isDirty = false;
  updateAppTitle();
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', e => {
  if (e.key === 'Shift') isShift = true;
  if (e.key === 'Control') isCtrl = true;
  if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undo();
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  }
  if (!selected) return;
  if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
    if (e.key==='ArrowUp') selected.userData.rotX -= 5;
    if (e.key==='ArrowDown') selected.userData.rotX += 5;
    if (e.key==='ArrowLeft') selected.userData.rotY -= 5;
    if (e.key==='ArrowRight') selected.userData.rotY += 5;
  }
  // Delete key to remove selected object
  if (e.key === 'Delete' || e.key === 'Del') {
    if (selected) {
      saveStateForUndo();
      scene.remove(selected);
      if (selected.userData.outline) scene.remove(selected.userData.outline);
      objects = objects.filter(obj => obj !== selected);
      selected = null;
      markDirty();
    }
  }
});
window.addEventListener('keyup', e => {
  if (e.key === 'Shift') isShift = false;
  if (e.key === 'Control') isCtrl = false;
});

const canvas = document.getElementById('scene');
canvas.addEventListener('mousedown', e => {
  if (e.button === 1) { // Middle button (mouse wheel)
    isPanning = true;
    lastX = e.clientX;
    lastY = e.clientY;
    e.preventDefault();
    return;
  }
  if (e.button !== 0) return;
  const rect = canvas.getBoundingClientRect();
  const mx = ((e.clientX-rect.left)/rect.width)*2-1;
  const my = -(((e.clientY-rect.top)/rect.height)*2-1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera({x:mx, y:my}, camera);
  const intersects = ray.intersectObjects(objects);
  if (intersects.length) {
    selectObject(intersects[0].object);
    drag = true;
    lastX = e.clientX;
    lastY = e.clientY;
    isCameraDrag = false;
    // For Plane, normal will now be taken in the classic way
    selectedFaceNormal = intersects[0].face ? intersects[0].face.normal.clone() : null;
  } else {
    selectObject(null);
    isCameraDrag = true;
    lastX = e.clientX;
    lastY = e.clientY;
    selectedFaceNormal = null;
  }
});
document.addEventListener('mouseup', ()=> { drag=false; isCameraDrag=false; isPanning=false; });
document.addEventListener('mousemove', e => {
  if (isPanning) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    targetPanOffset.x -= dx * 1.0; // Increased from 0.5
    targetPanOffset.y += dy * 1.0; // Increased from 0.5
    lastX = e.clientX;
    lastY = e.clientY;
    return;
  }
  if (drag && selected) {
    if (isCtrl || isShift) saveStateForUndo();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (isCtrl) {
      // For Plane, scale only in X and Z axes
      if (selected.geometry && selected.geometry.type === 'PlaneGeometry') {
        let scaleX = selected.scale.x + dx * 0.01;
        let scaleZ = selected.scale.z + dy * 0.01;
        scaleX = Math.max(0.1, Math.min(10, scaleX));
        scaleZ = Math.max(0.1, Math.min(10, scaleZ));
        selected.scale.x = scaleX;
        selected.scale.z = scaleZ;
        if (selected.userData.outline) {
          selected.userData.outline.scale.copy(selected.scale);
        }
      } else if (selectedFaceNormal) {
        // Choose axis based on the largest component of the normal
        const abs = selectedFaceNormal.clone().set(Math.abs(selectedFaceNormal.x), Math.abs(selectedFaceNormal.y), Math.abs(selectedFaceNormal.z));
        let axis = 'x';
        if (abs.y >= abs.x && abs.y >= abs.z) axis = 'y';
        else if (abs.z >= abs.x && abs.z >= abs.y) axis = 'z';
        // Scale only on that axis
        let scaleDelta = (axis === 'y' ? -dy : dx) * 0.01;
        let newScale = selected.scale[axis] + scaleDelta;
        newScale = Math.max(0.1, Math.min(10, newScale));
        selected.scale[axis] = newScale;
        if (selected.userData.outline) {
          selected.userData.outline.scale.copy(selected.scale);
        }
      } else {
        // Old behavior (scale on all axes)
        let scaleX = selected.scale.x + dx * 0.01;
        let scaleY = selected.scale.y - dy * 0.01;
        scaleX = Math.max(0.1, Math.min(10, scaleX));
        scaleY = Math.max(0.1, Math.min(10, scaleY));
        selected.scale.x = scaleX;
        selected.scale.y = scaleY;
        selected.scale.z = (scaleX + scaleY) / 2;
        if (selected.userData.outline) {
          selected.userData.outline.scale.copy(selected.scale);
        }
      }
    } else if (isShift) {
      if (selectedFaceNormal) {
        const abs = selectedFaceNormal.clone().set(Math.abs(selectedFaceNormal.x), Math.abs(selectedFaceNormal.y), Math.abs(selectedFaceNormal.z));
        let axis = 'x';
        if (abs.y >= abs.x && abs.y >= abs.z) axis = 'y';
        else if (abs.z >= abs.x && abs.z >= abs.y) axis = 'z';
        let moveDelta = (axis === 'y' ? -dy : dx);
        selected.position[axis] += moveDelta;
        if (selected.userData.outline) {
          selected.userData.outline.position.copy(selected.position);
        }
      } else {
        selected.position.x += dx;
        selected.position.y -= dy;
        if (selected.userData.outline) {
          selected.userData.outline.position.copy(selected.position);
        }
      }
    } else {
      // For Plane, classic rotation (all angles)
      const speed = 0.5;
      selected.userData.rotY += dx * speed;
      selected.userData.rotX += dy * speed;
    }
    lastX = e.clientX;
    lastY = e.clientY;
    markDirty();
  } else if (isCameraDrag) {
    // Camera rotation
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    cameraTargetOrbit.rotY += dx * 0.5;
    cameraTargetOrbit.rotX += dy * 0.5;
    cameraTargetOrbit.rotX = Math.max(-89, Math.min(89, cameraTargetOrbit.rotX));
    lastX = e.clientX;
    lastY = e.clientY;
  }
});
canvas.addEventListener('wheel', e => {
  cameraTargetOrbit.distance += e.deltaY * 0.5;
  cameraTargetOrbit.distance = Math.max(100, Math.min(1000, cameraTargetOrbit.distance));
  e.preventDefault();
}, { passive: false });

canvas.addEventListener('contextmenu', (e) => {
  e.preventDefault(); // Prevent the default context menu

  const rect = canvas.getBoundingClientRect();
  const mx = ((e.clientX - rect.left) / rect.width) *2 - 1;
  const my = -(((e.clientY - rect.top) / rect.height) *2 - 1);
  const ray = new THREE.Raycaster();
  ray.setFromCamera({ x: mx, y: my }, camera);
  const intersects = ray.intersectObjects(objects);

  if (intersects.length) {
    // Reset the selected object's position, scale, and rotation
    const obj = intersects[0].object;
    obj.position.set(0, grid.position.y + 1, 0); // 1 unit above the grid
    obj.scale.set(1, 1, 1);
    if (obj.geometry && obj.geometry.type === 'PlaneGeometry') {
      obj.rotation.set(-Math.PI / 2, 0, 0);
    } else {
      obj.rotation.set(0, 0, 0);
    }
    obj.userData.rotX = 0;
    obj.userData.rotY = 0;
    if (obj.userData.outline) {
      obj.userData.outline.position.copy(obj.position);
      obj.userData.outline.scale.copy(obj.scale);
      obj.userData.outline.rotation.copy(obj.rotation);
    }
  } else {
    // Reset the camera's position and orientation
    cameraTargetOrbit = { rotY: 0, rotX: 0, distance: 400 };
    targetPanOffset = {x: 0, y: 0};
  }
});

// Touch event support (mobile compatibility)
let lastTouchX = 0, lastTouchY = 0;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mx = ((touch.clientX-rect.left)/rect.width)*2-1;
    const my = -(((touch.clientY-rect.top)/rect.height)*2-1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera({x:mx, y:my}, camera);
    const intersects = ray.intersectObjects(objects);
    if (intersects.length) {
      selectObject(intersects[0].object);
      drag = true;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      isCameraDrag = false;
      // For Plane, normal will now be taken in the classic way
      selectedFaceNormal = intersects[0].face ? intersects[0].face.normal.clone() : null;
    } else {
      selectObject(null);
      isCameraDrag = true;
      lastTouchX = touch.clientX;
      lastTouchY = touch.clientY;
      selectedFaceNormal = null;
    }
  }
}, { passive: false });
canvas.addEventListener('touchmove', e => {
  if (e.touches.length === 2) {
    const t1 = e.touches[0];
    const t2 = e.touches[1];
    const mx = (t1.clientX + t2.clientX) / 2;
    const my = (t1.clientY + t2.clientY) / 2;
    if (!lastPan) lastPan = {x: mx, y: my};
    const dx = mx - lastPan.x;
    const dy = my - lastPan.y;
    targetPanOffset.x -= dx;
    targetPanOffset.y += dy;
    lastPan = {x: mx, y: my};
    e.preventDefault();
    return;
  } else {
    lastPan = null;
  }
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const dx = touch.clientX - lastTouchX;
    const dy = touch.clientY - lastTouchY;
    if (drag && selected) {
      if (isCtrl || isShift) saveStateForUndo();
      if (isCtrl) {
        if (selected.geometry && selected.geometry.type === 'PlaneGeometry') {
          let scaleX = selected.scale.x + dx * 0.01;
          let scaleZ = selected.scale.z + dy * 0.01;
          scaleX = Math.max(0.1, Math.min(10, scaleX));
          scaleZ = Math.max(0.1, Math.min(10, scaleZ));
          selected.scale.x = scaleX;
          selected.scale.z = scaleZ;
          if (selected.userData.outline) {
            selected.userData.outline.scale.copy(selected.scale);
          }
        } else if (selectedFaceNormal) {
          const abs = selectedFaceNormal.clone().set(Math.abs(selectedFaceNormal.x), Math.abs(selectedFaceNormal.y), Math.abs(selectedFaceNormal.z));
          let axis = 'x';
          if (abs.y >= abs.x && abs.y >= abs.z) axis = 'y';
          else if (abs.z >= abs.x && abs.z >= abs.y) axis = 'z';
          let scaleDelta = (axis === 'y' ? -dy : dx) * 0.01;
          let newScale = selected.scale[axis] + scaleDelta;
          newScale = Math.max(0.1, Math.min(10, newScale));
          selected.scale[axis] = newScale;
          if (selected.userData.outline) {
            selected.userData.outline.scale.copy(selected.scale);
          }
        } else {
          let scaleX = selected.scale.x + dx * 0.01;
          let scaleY = selected.scale.y - dy * 0.01;
          scaleX = Math.max(0.1, Math.min(10, scaleX));
          scaleY = Math.max(0.1, Math.min(10, scaleY));
          selected.scale.x = scaleX;
          selected.scale.y = scaleY;
          selected.scale.z = (scaleX + scaleY) / 2;
          if (selected.userData.outline) {
            selected.userData.outline.scale.copy(selected.scale);
          }
        }
      } else if (isShift) {
        if (selectedFaceNormal) {
          const abs = selectedFaceNormal.clone().set(Math.abs(selectedFaceNormal.x), Math.abs(selectedFaceNormal.y), Math.abs(selectedFaceNormal.z));
          let axis = 'x';
          if (abs.y >= abs.x && abs.y >= abs.z) axis = 'y';
          else if (abs.z >= abs.x && abs.z >= abs.y) axis = 'z';
          let moveDelta = (axis === 'y' ? -dy : dx);
          selected.position[axis] += moveDelta;
          if (selected.userData.outline) {
            selected.userData.outline.position.copy(selected.position);
          }
        } else {
          selected.position.x += dx;
          selected.position.y -= dy;
          if (selected.userData.outline) {
            selected.userData.outline.position.copy(selected.position);
          }
        }
      } else {
        // For Plane, classic rotation (all angles)
        const speed = 0.5;
        selected.userData.rotY += dx * speed;
        selected.userData.rotX += dy * speed;
      }
      markDirty();
    } else if (isCameraDrag) {
      cameraTargetOrbit.rotY += dx * 0.5;
      cameraTargetOrbit.rotX += dy * 0.5;
      cameraTargetOrbit.rotX = Math.max(-89, Math.min(89, cameraTargetOrbit.rotX));
    }
    lastTouchX = touch.clientX;
    lastTouchY = touch.clientY;
    e.preventDefault();
  }
}, { passive: false });

// Double tap on mobile to delete object
let lastTap = 0;
canvas.addEventListener('touchend', e => {
  const now = Date.now();
  if (e.touches.length === 0 && selected) {
    if (now - lastTap < 400) { // Delete if tapped twice within 400ms
      saveStateForUndo();
      scene.remove(selected);
      if (selected.userData.outline) scene.remove(selected.userData.outline);
      objects = objects.filter(obj => obj !== selected);
      selected = null;
      markDirty();
    }
    lastTap = now;
  }
  drag = false;
  isCameraDrag = false;
}, { passive: false });

function addOutline(mesh, geometry) {
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffff00, linewidth: 3 })
  );
  line.position.copy(mesh.position);
  scene.add(line);
  mesh.userData.outline = line;
}

function addShape(type, x, y) {
  saveStateForUndo();
  let mesh;
  let geometry;
  const color = new THREE.Color(Math.random(), Math.random(), Math.random());
  if (type === 'cube') {
    geometry = new THREE.BoxGeometry(50,50,50);
    mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({color, transparent:true, opacity:0.8})
    );
  } else if (type === 'sphere') {
    geometry = new THREE.SphereGeometry(30, 32, 24);
    mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({color, transparent:true, opacity:0.8})
    );
  } else if (type === 'cylinder') {
    geometry = new THREE.CylinderGeometry(25,25,60, 32);
    mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({color, transparent:true, opacity:0.8})
    );
  } else if (type === 'plane') {
    geometry = new THREE.PlaneGeometry(80, 80, 1, 1);
    mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({color, transparent:true, opacity:0.8, side: THREE.DoubleSide})
    );
  }
  // Start with reset states
  mesh.position.set(0, grid.position.y + 1, 0); // 1 unit above the grid
  mesh.scale.set(1, 1, 1);
  mesh.userData = {rotX:0, rotY:0};
  if (type === 'plane') {
    mesh.rotation.set(-Math.PI / 2, 0, 0); // Make Plane horizontal
  } else {
    mesh.rotation.set(0, 0, 0);
  }
  scene.add(mesh);
  addOutline(mesh, geometry);
  objects.push(mesh);
  selectObject(mesh);
  markDirty();
}

// Function to save the scene as JSON
function saveScene(filename) {
  const arr = objects.map(obj => ({
    type: obj.geometry.type,
    position: [obj.position.x, obj.position.y, obj.position.z],
    scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    rotX: obj.userData.rotX || 0,
    rotY: obj.userData.rotY || 0,
    color: obj.material.color.getHex()
  }));
  const blob = new Blob([JSON.stringify(arr, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function selectObject(obj) {
  selected = obj;
  canvas.focus();
  for (const o of objects) {
    if (o.userData.outline) o.userData.outline.visible = (o === obj);
  }
}

function animate() {
  // Smooth camera movement
  cameraOrbit.rotY += (cameraTargetOrbit.rotY - cameraOrbit.rotY) * 0.15;
  cameraOrbit.rotX += (cameraTargetOrbit.rotX - cameraOrbit.rotX) * 0.15;
  cameraOrbit.distance += (cameraTargetOrbit.distance - cameraOrbit.distance) * 0.15;

  // Extra smooth pan movement
  panOffset.x += (targetPanOffset.x - panOffset.x) * PAN_SMOOTHNESS;
  panOffset.y += (targetPanOffset.y - panOffset.y) * PAN_SMOOTHNESS;

  // Update camera position with smooth pan
  const phi = THREE.MathUtils.degToRad(90 - cameraOrbit.rotX);
  const theta = THREE.MathUtils.degToRad(cameraOrbit.rotY);
  camera.position.x = cameraOrbit.distance * Math.sin(phi) * Math.sin(theta) + panOffset.x;
  camera.position.y = cameraOrbit.distance * Math.cos(phi) + panOffset.y;
  camera.position.z = cameraOrbit.distance * Math.sin(phi) * Math.cos(theta);
  camera.lookAt(panOffset.x, panOffset.y, 0);
  for (const obj of objects) {
    obj.rotation.x = THREE.MathUtils.degToRad(obj.userData.rotX||0);
    obj.rotation.y = THREE.MathUtils.degToRad(obj.userData.rotY||0);
    if (obj === selected) {
      obj.material.emissive = new THREE.Color(1,1,0);
      obj.material.emissiveIntensity = 0.5;
      if (obj.userData.outline) obj.userData.outline.visible = true;
    } else {
      obj.material.emissive = new THREE.Color(0,0,0);
      if (obj.userData.outline) obj.userData.outline.visible = false;
    }
    if (obj.userData.outline) {
      obj.userData.outline.position.copy(obj.position);
      obj.userData.outline.rotation.copy(obj.rotation);
    }
  }
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Event delegation for menu buttons
document.getElementById('menu').addEventListener('click', (e) => {
    const shapeBtn = e.target.closest('button[data-shape]');
    if (shapeBtn) {
        addShape(shapeBtn.dataset.shape);
        return;
    }
});

// File menu operations
const confirmOnChange = () => {
    if (isDirty) {
        return confirm(currentLanguage === 'tr' ? 'Kaydedilmemiş değişiklikler var. Devam etmek istediğinize emin misiniz?' : 'You have unsaved changes. Are you sure you want to continue?');
    }
    return true;
};

document.getElementById('newBtn').addEventListener('click', () => {
    if (!confirmOnChange()) return;
    undoStack = [];
    redoStack = [];
    saveStateForUndo();
    for (const obj of objects) {
        scene.remove(obj);
        if (obj.userData.outline) scene.remove(obj.userData.outline);
    }
    objects = [];
    selected = null;
    currentFileName = '';
    markClean();
    cameraTargetOrbit = { rotY: 0, rotX: 0, distance: 400 };
    targetPanOffset = { x: 0, y: 0 };
});

// Save operations
document.getElementById('saveBtn').onclick = () => {
    const fileName = currentFileName || 'scene.json';
    saveScene(fileName);
    markClean();
};

document.getElementById('saveAsBtn').onclick = () => {
    const fileName = prompt('File name:', currentFileName || 'scene.json');
    if (fileName) {
        currentFileName = fileName;
        saveScene(fileName);
        markClean();
    }
};

// Load operation
document.getElementById('loadBtn').onclick = () => {
    if (!confirmOnChange()) return;
    document.getElementById('fileInput').click();
};

// File input change handler
document.getElementById('fileInput').onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    undoStack = [];
    redoStack = [];
    currentFileName = file.name;
    markClean();
    
    const reader = new FileReader();
    reader.onload = (ev) => {
        try {
            const arr = JSON.parse(ev.target.result);
            for (const obj of objects) {
                scene.remove(obj);
                if (obj.userData.outline) scene.remove(obj.userData.outline);
            }
            objects = [];
            for (const item of arr) {
                let mesh, geometry;
                const color = new THREE.Color(item.color);
                if (item.type === 'BoxGeometry') {
                    geometry = new THREE.BoxGeometry(50,50,50);
                } else if (item.type === 'SphereGeometry') {
                    geometry = new THREE.SphereGeometry(30, 32, 24);
                } else if (item.type === 'CylinderGeometry') {
                    geometry = new THREE.CylinderGeometry(25,25,60, 32);
                } else if (item.type === 'PlaneGeometry') {
                    geometry = new THREE.PlaneGeometry(80, 80, 1, 1);
                } else {
                    continue;
                }
                
                mesh = new THREE.Mesh(
                    geometry,
                    new THREE.MeshPhongMaterial({
                        color, 
                        transparent: true, 
                        opacity: 0.8,
                        side: item.type === 'PlaneGeometry' ? THREE.DoubleSide : THREE.FrontSide
                    })
                );
                
                mesh.position.fromArray(item.position);
                mesh.scale.fromArray(item.scale);
                mesh.userData = {rotX: item.rotX, rotY: item.rotY};
                scene.add(mesh);
                addOutline(mesh, geometry);
                objects.push(mesh);
            }
            cameraTargetOrbit = { rotY: 0, rotX: 0, distance: 400 };
            targetPanOffset = { x: 0, y: 0 };
        } catch(err) { 
            alert(currentLanguage === 'tr' ? 'Dosya okunamadı veya bozuk!' : 'File could not be read or is corrupted!'); 
        }
    };
    reader.readAsText(file);
};

// Undo/redo buttons
document.getElementById('undoBtn').onclick = undo;
document.getElementById('redoBtn').onclick = redo;

// About button
document.getElementById('aboutBtn').onclick = () => {
    const message = currentLanguage === 'tr' ? 'Tarik Bağrıyanık, Mayıs 2025' : 'Tarik Bagriyanik, May 2025';
    alert(message);
};

// Language handling
const trBtn = document.getElementById('trDil');
const enBtn = document.getElementById('engDil');
const handleLanguageClick = (lang) => {
    currentLanguage = lang;
    setCookie('lang', currentLanguage, 365);
    updateLanguage();
};

if (trBtn) trBtn.onclick = (e) => { e.stopPropagation(); handleLanguageClick('tr'); };
if (enBtn) enBtn.onclick = (e) => { e.stopPropagation(); handleLanguageClick('en'); };

// Theme buttons
const darkThemeBtn = document.getElementById('darkTema');
const lightThemeBtn = document.getElementById('lightTema');

if (darkThemeBtn) darkThemeBtn.addEventListener('click', () => setTheme('dark'));
if (lightThemeBtn) lightThemeBtn.addEventListener('click', () => setTheme('light'));

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
    // Apply initial theme
    setTheme(savedTheme);
    // Apply current language
    updateLanguage();
    setCookie('lang', currentLanguage, 365);
});

animate();
