import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';

// Debug message to confirm script execution
console.log('main.js is loaded and running.');

// Menü başlıkları ve butonları haritası (global scope)
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
  'Dil': {tr: 'Dil', en: 'Language'},
  'Türkçe': {tr: 'Türkçe', en: 'Turkish'},
  'İngilizce': {tr: 'İngilizce', en: 'English'},
  'Geri Al': {tr: 'Geri Al', en: 'Undo'},
  'Yinele': {tr: 'Yinele', en: 'Redo'}
};

// Tüm script kodları buraya taşındı
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

let undoStack = [];
let redoStack = [];

function saveStateForUndo() {
  // Sahnenin sadece objelerin temel bilgilerini kaydet
  const state = objects.map(obj => ({
    type: obj.geometry.type,
    position: [obj.position.x, obj.position.y, obj.position.z],
    scale: [obj.scale.x, obj.scale.y, obj.scale.z],
    rotX: obj.userData.rotX || 0,
    rotY: obj.userData.rotY || 0,
    color: obj.material.color.getHex()
  }));
  undoStack.push(JSON.stringify(state));
  // Undo sonrası yeni işlemde redo stack temizlenir
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
  } catch(err) { alert('Geri alma/yinele başarısız!'); }
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

function updateAppTitle() {
  let title = '3D Tasarım';
  if (currentFileName) title += ' - ' + currentFileName;
  if (isDirty) title += ' *';
  document.getElementById('projectName').textContent = title;
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
  // Del tuşu ile seçili nesneyi sil
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
  if (e.button === 1) { // Orta tuş (mouse wheel)
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
    // Plane için normal artık klasik şekilde alınacak
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
    panOffset.x -= dx;
    panOffset.y += dy;
    lastX = e.clientX;
    lastY = e.clientY;
    return;
  }
  if (drag && selected) {
    if (isCtrl || isShift) saveStateForUndo();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    if (isCtrl) {
      // Plane için sadece X ve Z ekseninde scale
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
        // Normalin en büyük bileşenine göre eksen seç
        const abs = selectedFaceNormal.clone().set(Math.abs(selectedFaceNormal.x), Math.abs(selectedFaceNormal.y), Math.abs(selectedFaceNormal.z));
        let axis = 'x';
        if (abs.y >= abs.x && abs.y >= abs.z) axis = 'y';
        else if (abs.z >= abs.x && abs.z >= abs.y) axis = 'z';
        // Sadece o eksende ölçekle
        let scaleDelta = (axis === 'y' ? -dy : dx) * 0.01;
        let newScale = selected.scale[axis] + scaleDelta;
        newScale = Math.max(0.1, Math.min(10, newScale));
        selected.scale[axis] = newScale;
        if (selected.userData.outline) {
          selected.userData.outline.scale.copy(selected.scale);
        }
      } else {
        // Eski davranış (tüm eksenlerde)
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
      // Plane için de klasik döndürme (tüm açılarda)
      const speed = 0.5;
      selected.userData.rotY += dx * speed;
      selected.userData.rotX += dy * speed;
    }
    lastX = e.clientX;
    lastY = e.clientY;
    markDirty();
  } else if (isCameraDrag) {
    // Kamera döndürme
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
    obj.position.set(0, grid.position.y + 1, 0); // Grid'den 1 birim üstte
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
    panOffset = {x: 0, y: 0};
  }
});

// Touch event desteği (mobil uyumluluk)
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
      // Plane için normal artık klasik şekilde alınacak
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
    panOffset.x -= dx;
    panOffset.y += dy;
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
        // Plane için de klasik döndürme (tüm açılarda)
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

// Mobilde çift dokunma ile nesne silme
let lastTap = 0;
canvas.addEventListener('touchend', e => {
  const now = Date.now();
  if (e.touches.length === 0 && selected) {
    if (now - lastTap < 400) { // 400ms içinde iki kez dokunursa sil
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
  // Reset halleriyle başlat
  mesh.position.set(0, grid.position.y + 1, 0); // Grid'den 1 birim üstte
  mesh.scale.set(1, 1, 1);
  mesh.userData = {rotX:0, rotY:0};
  if (type === 'plane') {
    mesh.rotation.set(-Math.PI / 2, 0, 0); // Plane'i yatay yap
  } else {
    mesh.rotation.set(0, 0, 0);
  }
  scene.add(mesh);
  addOutline(mesh, geometry);
  objects.push(mesh);
  selectObject(mesh);
  markDirty();
}

// Sahneyi JSON olarak kaydeden fonksiyon
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
  // Kamera smooth hareket
  cameraOrbit.rotY += (cameraTargetOrbit.rotY - cameraOrbit.rotY) * 0.15;
  cameraOrbit.rotX += (cameraTargetOrbit.rotX - cameraOrbit.rotX) * 0.15;
  cameraOrbit.distance += (cameraTargetOrbit.distance - cameraOrbit.distance) * 0.15;

  // Kamera pozisyonunu güncelle
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

document.addEventListener('DOMContentLoaded', function() {
  // Menü işlevselliği için event listener'ları güncelle
  document.querySelectorAll('#menu button[data-shape]').forEach(btn => {
    btn.addEventListener('click', () => addShape(btn.dataset.shape));
  });

  // Dosya menüsü işlemleri
  document.getElementById('newBtn').addEventListener('click', () => {
    saveStateForUndo();
    // Tüm nesneleri temizle
    for (const obj of objects) {
      scene.remove(obj);
      if (obj.userData.outline) scene.remove(obj.userData.outline);
    }
    objects = [];
    selected = null;
    currentFileName = '';
    markClean();
    cameraTargetOrbit = { rotY: 0, rotX: 0, distance: 400 };
    panOffset = { x: 0, y: 0 };
  });

  document.getElementById('saveBtn').onclick = function() {
    let fileName = currentFileName || 'scene.json';
    saveScene(fileName);
    markClean();
  }

  document.getElementById('saveAsBtn').onclick = function() {
    let fileName = prompt('Dosya adı:', currentFileName || 'scene.json');
    if (fileName) {
      currentFileName = fileName;
      saveScene(fileName);
      markClean();
    }
  }

  document.getElementById('loadBtn').onclick = function() {
    document.getElementById('fileInput').click();
  }

  document.getElementById('fileInput').onchange = function(e) {
    const file = e.target.files[0];
    if (!file) return;
    currentFileName = file.name;
    markClean();
    const reader = new FileReader();
    reader.onload = function(ev) {
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
        cameraTargetOrbit = { rotY: 0, rotX: 0, distance: 400 };
        panOffset = { x: 0, y: 0 };
      } catch(err) { alert('Dosya okunamadı!'); }
    }
    reader.readAsText(file);
  }

  // Undo/redo butonları
  document.getElementById('undoBtn').onclick = undo;
  document.getElementById('redoBtn').onclick = redo;

  // Hakkında butonu
  const aboutBtn = document.getElementById('aboutBtn');
  aboutBtn.onclick = function () {
    const message = currentLanguage === 'tr' ? 'Tarik Bağrıyanık, Mayıs 2025' : 'Tarik Bagriyanik, May 2025';
    alert(message);
  };

  // Cookie'den dil oku, yoksa varsayılanı 'tr' yap
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }
  function setCookie(name, value, days) {
    let expires = '';
    if (days) {
      const date = new Date();
      date.setTime(date.getTime() + (days*24*60*60*1000));
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + value + expires + '; path=/';
  }

  let currentLanguage = getCookie('lang') || 'tr'; // Varsayılan Türkçe

  // Dil butonları için id ile seçim (mobilde de çalışır)
  const trBtn = document.getElementById('trDil');
  const enBtn = document.getElementById('engDil');
  function handleLanguageClick(lang) {
    currentLanguage = lang;
    setCookie('lang', currentLanguage, 365);
    updateLanguage();
  }
  if (trBtn) trBtn.onclick = function(e) { e.stopPropagation(); handleLanguageClick('tr'); };
  if (enBtn) enBtn.onclick = function(e) { e.stopPropagation(); handleLanguageClick('en'); };

  function updateLanguage() {
    // Menü ve diğer UI elemanlarını güncelle
    // Başlık
    updateAppTitle();
    // Mobil mi kontrolü
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
    // Menü başlıkları ve butonları
    document.querySelectorAll('#menu button').forEach(btn => {
      const label = btn.getAttribute('data-label');
      if (label && menuMap[label]) {
        btn.textContent = menuMap[label][currentLanguage];
      }
    });
  }

  // Sayfa yüklendiğinde mevcut dili uygula
  updateLanguage();
  setCookie('lang', currentLanguage, 365);
});

animate();
