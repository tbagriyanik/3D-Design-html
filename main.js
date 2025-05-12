import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.153.0/build/three.module.js';
// CSG is loaded via script tag in index.html

// Menu titles and buttons map (global scope)
const menuMap = {
  'Dosya': { tr: 'Dosya', en: 'File' },
  'Düzen': { tr: 'Düzen', en: 'Edit' },
  'Yeni': { tr: 'Yeni', en: 'New' },
  'Kaydet': { tr: 'Kaydet', en: 'Save' },
  'Farklı Kaydet': { tr: 'Farklı Kaydet', en: 'Save As' },
  'Aç': { tr: 'Aç', en: 'Open' },
  'Geri Al': { tr: 'Geri Al', en: 'Undo' },
  'Yinele': { tr: 'Yinele', en: 'Redo' },
  'Kopyala': { tr: 'Kopyala', en: 'Copy' },
  'Yapıştır': { tr: 'Yapıştır', en: 'Paste' },
  'Sil': { tr: 'Sil', en: 'Delete' },
  'Ekle': { tr: 'Ekle', en: 'Add' },
  'Küp': { tr: 'Küp', en: 'Cube' },
  'Küre': { tr: 'Küre', en: 'Sphere' },
  'Silindir': { tr: 'Silindir', en: 'Cylinder' },
  'Plane': { tr: 'Düzlem', en: 'Plane' },
  'Ayarlar': { tr: 'Ayarlar', en: 'Settings' },
  'Hakkında': { tr: 'Hakkında', en: 'About' },
  'Dil': { tr: 'Dil >', en: 'Language >' },
  'Türkçe': { tr: 'Türkçe', en: 'Turkish' },
  'İngilizce': { tr: 'İngilizce', en: 'English' },
  'Tema': { tr: 'Tema >', en: 'Theme >' },
  'Koyu': { tr: 'Koyu', en: 'Dark' },
  'Açık': { tr: 'Açık', en: 'Light' },
  'Grafik Kalitesi': { tr: 'Grafik >', en: 'Graphics >' },
  'İyi': { tr: 'İyi', en: 'Good' },
  'Orta': { tr: 'Orta', en: 'Medium' },
  'Basit': { tr: 'Basit', en: 'Simple' }
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
globalThis.currentGraphicsQuality = getCookie('graphicsQuality') || 'iyi'; // Default to Good

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
      ? 'Kısayollar: [Sürükle] Taşı | [Shift+Sürükle] Döndür | [Ctrl] Ölçekle | [Alt] Adımlı Hareket | [Sağ Tık] Reset | [Del] Sil | [Orta Tık] Pan | [Ctrl+Z] Geri Al | [Ctrl+Y] Yinele'
      : 'Shortcuts: [Drag] Move | [Shift+Drag] Rotate | [Ctrl] Scale | [Alt] Snap/Grid Move | [Right Click] Reset | [Del] Delete | [Middle Click] Pan | [Ctrl+Z] Undo | [Ctrl+Y] Redo';
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

  // Update graphics quality buttons
  const graphicsGoodBtn = document.getElementById('graphicsGood');
  const graphicsMediumBtn = document.getElementById('graphicsMedium');
  const graphicsSimpleBtn = document.getElementById('graphicsSimple');
  if (graphicsGoodBtn) graphicsGoodBtn.textContent = menuMap['İyi'][currentLanguage];
  if (graphicsMediumBtn) graphicsMediumBtn.textContent = menuMap['Orta'][currentLanguage];
  if (graphicsSimpleBtn) graphicsSimpleBtn.textContent = menuMap['Basit'][currentLanguage];

  // Properties panel localization
  const propHeader = document.getElementById('propertiesHeader');
  if (propHeader) {
    const shapeLabels = {
      cube: { tr: 'Küp', en: 'Cube' },
      sphere: { tr: 'Küre', en: 'Sphere' },
      cylinder: { tr: 'Silindir', en: 'Cylinder' },
      plane: { tr: 'Plane', en: 'Plane' }
    };
    propHeader.textContent = (selected && shapeLabels[selected.name])
      ? shapeLabels[selected.name][currentLanguage]
      : (currentLanguage === 'tr' ? 'Özellikler' : 'Properties');
  }
  const groupLabels = {
    labelPos: { tr: 'Konum:', en: 'Position:' },
    labelRot: { tr: 'Dönüş:', en: 'Rotation:' },
    labelScale: { tr: 'Ölçek:', en: 'Scale:' },
    labelColor: { tr: 'Renk:', en: 'Color:' }
  };
  for (const [id, texts] of Object.entries(groupLabels)) {
    const lbl = document.getElementById(id);
    if (lbl) lbl.childNodes[0].textContent = texts[currentLanguage];
  }

  // Boolean panel localization
  const boolHeader = document.getElementById('booleanHeader');
  if (boolHeader) {
    boolHeader.textContent = currentLanguage === 'tr' ? 'Boolean İşlemleri' : 'Boolean Operations';
  }
  
  const boolLabels = {
    'boolUnion': {tr: 'Birleştir', en: 'Union'},
    'boolSubtract': {tr: 'Çıkar', en: 'Subtract'},
    'boolIntersect': {tr: 'Kesişim', en: 'Intersect'}
  };
  
  for (const [id, texts] of Object.entries(boolLabels)) {
    const btn = document.getElementById(id);
    if (btn) btn.textContent = texts[currentLanguage];
  }
}

// Theme handling
function setTheme(theme) {
  document.body.className = theme;
  setCookie('theme', theme, 365);

  if (theme === 'dark') {
    renderer.setClearColor(0x151c2c);
    if (sky) sky.material = skyMaterialDark;
    if (grid) grid.material.opacity = 0.5;
  } else {
    renderer.setClearColor(0xf5f7fa);
    if (sky) sky.material = skyMaterialLight;
    if (grid) grid.material.opacity = 0.35;
  }
}

// Apply saved theme on page load
let savedTheme = getCookie('theme') || 'dark';
document.body.className = savedTheme;

// Graphics Quality Settings
function applyGraphicsQuality() {
    if (!renderer || !light) return; // Ensure renderer and light are initialized

    switch (currentGraphicsQuality) {
        case 'iyi': // Good
            renderer.setPixelRatio(window.devicePixelRatio > 1 ? window.devicePixelRatio : 2);
            renderer.shadowMap.enabled = true;
            light.shadow.mapSize.width = 4096;
            light.shadow.mapSize.height = 4096;
            break;
        case 'orta': // Medium
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            renderer.shadowMap.enabled = true;
            light.shadow.mapSize.width = 2048;
            light.shadow.mapSize.height = 2048;
            break;
        case 'basit': // Simple
            renderer.setPixelRatio(1);
            renderer.shadowMap.enabled = false;
            // light.shadow.mapSize.width = 1024; // Shadow map size irrelevant if disabled
            // light.shadow.mapSize.height = 1024;
            break;
        default: // Fallback to good
            renderer.setPixelRatio(window.devicePixelRatio > 1 ? window.devicePixelRatio : 2);
            renderer.shadowMap.enabled = true;
            light.shadow.mapSize.width = 4096;
            light.shadow.mapSize.height = 4096;
            break;
    }
}

function setGraphicsQuality(quality) {
    currentGraphicsQuality = quality;
    setCookie('graphicsQuality', quality, 365);
    applyGraphicsQuality();
}

// All script code moved here
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 5000);
let renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('scene'),
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance'
});
renderer.setPixelRatio(window.devicePixelRatio > 1 ? window.devicePixelRatio : 2);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.setClearColor(savedTheme === 'dark' ? 0x151c2c : 0xf5f7fa);
renderer.setSize(window.innerWidth, window.innerHeight);

// Main directional light with shadows
let light = new THREE.DirectionalLight(0xffffff, 1.2);
light.position.set(1, 1.5, 2);
light.castShadow = true;
// Improve shadow quality
light.shadow.mapSize.width = 4096;
light.shadow.mapSize.height = 4096;
light.shadow.camera.near = 0.1;
light.shadow.camera.far = 2000;
light.shadow.bias = -0.0001;
light.shadow.normalBias = 0.02;
let shadowSize = 400;
light.shadow.camera.left = -shadowSize;
light.shadow.camera.right = shadowSize;
light.shadow.camera.top = shadowSize;
light.shadow.camera.bottom = -shadowSize;
scene.add(light);

// Add fill light from opposite direction (no shadows)
let fillLight = new THREE.DirectionalLight(0xffffff, 0.5);
fillLight.position.set(-1, 0.5, -1);
scene.add(fillLight);

// Softer ambient light for better ambient occlusion look
scene.add(new THREE.AmbientLight(0xffffff, 0.4));

// Add subtle hemisphere light for better environment feel
let hemiLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.5);
scene.add(hemiLight);

// Create a smooth gradient background using a large skybox
const skyGeometry = new THREE.SphereGeometry(4000, 32, 32);
// Dark theme gradient is deep blue to darker blue
// Light theme gradient is light blue to white
const skyMaterialDark = new THREE.ShaderMaterial({
  uniforms: {
    topColor: { value: new THREE.Color(0xeeffee) },
    bottomColor: { value: new THREE.Color(0x112233) },
    offset: { value: 1000 },
    exponent: { value: 0.8 }
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPosition = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPosition.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    
    // Star generation function
    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }
    
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      vec3 skyColor = mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0));
      
      // Add stars in dark mode
      vec2 pos = vWorldPosition.xz * 0.01;
      float brightness = random(pos);
      
      // Only show brightest stars and vary their intensity
      if (brightness > 0.997) {
        float starIntensity = (brightness - 0.997) * 100.0;
        skyColor += vec3(starIntensity * 0.8, starIntensity * 0.8, starIntensity);
      }
      
      gl_FragColor = vec4(skyColor, 1.0);
    }
  `,
  side: THREE.BackSide
});

const skyMaterialLight = new THREE.ShaderMaterial({
  uniforms: {
    topColor: { value: new THREE.Color(0xadd8e6) },
    bottomColor: { value: new THREE.Color(0xfffffc) },
    offset: { value: 1000 },
    exponent: { value: 0.8 }
  },
  vertexShader: skyMaterialDark.vertexShader,
  fragmentShader: skyMaterialDark.fragmentShader,
  side: THREE.BackSide
});

const sky = new THREE.Mesh(skyGeometry, savedTheme === 'dark' ? skyMaterialDark : skyMaterialLight);
scene.add(sky);

// Ensure the grid is always visible by adjusting its rendering order and visibility
const grid = new THREE.GridHelper(800, 20, 0x00ff00, 0x444444); // Z axis green
// Color X axis red
grid.material.color.setHex(0xaaaaaa); // Lighter grid color
grid.material.vertexColors = false;
grid.material.transparent = true;
grid.material.opacity = savedTheme === 'dark' ? 0.5 : 0.35;
grid.material.linewidth = 2; // Try to make lines thicker
if (grid.geometry && grid.geometry.attributes && grid.geometry.attributes.color) {
  // For Three.js r125+ GridHelper, color the main axes
  const colorAttr = grid.geometry.attributes.color;
  // X axis (first line): red
  colorAttr.setXYZ(0, 1, 0, 0); colorAttr.setXYZ(1, 1, 0, 0);
  // Z axis (last line): green
  colorAttr.setXYZ(40, 0, 1, 0); colorAttr.setXYZ(41, 0, 1, 0);
  colorAttr.needsUpdate = true;
}
// Add thick X (red) and Z (green) axis lines
const axisMaterialX = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 8 });
const axisMaterialZ = new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 8 });
const axisLen = 400;
const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(-axisLen, -50, 0),
  new THREE.Vector3(axisLen, -50, 0)
]);
const zAxisGeom = new THREE.BufferGeometry().setFromPoints([
  new THREE.Vector3(0, -50, -axisLen),
  new THREE.Vector3(0, -50, axisLen)
]);
const xAxisLine = new THREE.Line(xAxisGeom, axisMaterialX);
const zAxisLine = new THREE.Line(zAxisGeom, axisMaterialZ);
scene.add(xAxisLine);
scene.add(zAxisLine);
grid.position.y = -50;
grid.renderOrder = -1; // Render the grid below other objects
scene.add(grid);
// Grid should receive shadows but not cast them
grid.receiveShadow = true;

let objects = [];
let selected = null;
let selectedObjects = []; // Array to store multiple selected objects
let drag = false, lastX = 0, lastY = 0;
let isShift = false;
let isCtrl = false;
let isAlt = false;
let cameraOrbit = { rotY: 30, rotX: 10, distance: 400 };
let cameraTargetOrbit = { rotY: 30, rotX: 10, distance: 400 };
let isCameraDrag = false;
let currentFileName = '';
let isDirty = false;
let selectedFaceNormal = null;
let isPanning = false;
let lastPan = null;
let panOffset = { x: 0, y: 0 };
const CAMERA_SMOOTHNESS = 0.08; // Increased for smoother camera movement
const PAN_SMOOTHNESS = 0.12; // Increased for smoother pan
let targetPanOffset = { x: 0, y: 0 };

let undoStack = [];
let redoStack = [];

const GRID_SIZE = 800;
const GRID_DIVISIONS = 20;
const GRID_STEP = GRID_SIZE / GRID_DIVISIONS; // 40

let objectIdCounter = 1;

// Performance optimizations
const PERFORMANCE_SETTINGS = {
  maxObjects: 1000,
  maxUndoSteps: 50,
  outlineUpdateInterval: 2, // Update outlines every 2 frames
  materialPoolSize: 20
};

// Material pool for better performance
const materialPool = {
  standard: [],
  outline: [],
  
  getStandard(color) {
    let material = createStandardMaterial(color);
    this.standard.push(material);
    if (this.standard.length > PERFORMANCE_SETTINGS.materialPoolSize) {
      this.standard.shift().dispose();
    }
    return material;
  },
  
  getOutline() {
    let material = this.outline.find(m => !m.isUsed);
    if (!material) {
      material = new THREE.LineBasicMaterial({ 
        color: 0xFF00FF, 
        linewidth: 10,
        transparent: true,
        opacity: 0.8
      });
      material.isUsed = true;
      this.outline.push(material);
      if (this.outline.length > PERFORMANCE_SETTINGS.materialPoolSize) {
        this.outline.shift().dispose();
      }
    }
    return material;
  },
  
  releaseOutline(material) {
    if (material) {
      material.isUsed = false;
    }
  }
};

// Optimize object creation
function createObject(type, color) {
  try {
    let geometry;
    switch(type) {
      case 'cube':
        geometry = new THREE.BoxGeometry(50, 50, 50);
        break;
      case 'sphere':
        geometry = new THREE.SphereGeometry(30, 32, 24);
        break;
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(25, 25, 60, 32);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(80, 80, 1, 1);
        break;
      default:
        throw new Error('Invalid object type');
    }
    
    // Ensure the color is not fuchsia (0xFF00FF)
    let newColor = color;
    if (newColor === 0xFF00FF) {
      newColor = Math.floor(Math.random() * 16777215); // Generate a random hex color
    }

    const material = materialPool.getStandard(new THREE.Color(newColor));
    const mesh = new THREE.Mesh(geometry, material);
    
    // Set initial properties
    mesh.name = `${type}_${objectIdCounter++}`;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.position.set(0, grid.position.y + 1, 0);
    mesh.scale.set(1, 1, 1);
    mesh.userData = { rotX: 0, rotY: 0 };
    
    if (type === 'plane') {
      mesh.rotation.set(-Math.PI / 2, 0, 0);
      mesh.userData.rotX = -90;
    }
    
    scene.add(mesh);
    addOutline(mesh, geometry);
    objects.push(mesh);
    
    // Check object limit
    if (objects.length > PERFORMANCE_SETTINGS.maxObjects) {
      const oldest = objects.shift();
      scene.remove(oldest);
      if (oldest.userData.outline) {
        scene.remove(oldest.userData.outline);
        materialPool.releaseOutline(oldest.userData.outline.material);
      }
    }
    
    return mesh;
  } catch (error) {
    showToast(currentLanguage === 'tr' ? 'Nesne oluşturulamadı!' : 'Failed to create object!');
    return null;
  }
}

// Optimize addShape function
function addShape(type) {
  try {
    saveStateForUndo();
    
    const r = Math.random() * 0.7;
    const g = Math.random() * 0.7;
    const b = Math.random() * 0.7;
    const color = new THREE.Color(r, g, b);
    
    const mesh = createObject(type, color);
    if (mesh) {
      selectObject(mesh);
      markDirty();
    }
  } catch (error) {
    showToast(currentLanguage === 'tr' ? 'Şekil ekleme başarısız!' : 'Failed to add shape!');
  }
}

// Optimize cleanup
function cleanup() {
  // Dispose geometries
  objects.forEach(obj => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(m => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    if (obj.userData.outline) {
      obj.userData.outline.geometry.dispose();
      obj.userData.outline.material.dispose();
    }
  });
  
  // Clear material pools
  materialPool.standard.forEach(m => m.dispose());
  materialPool.outline.forEach(m => m.dispose());
  materialPool.standard = [];
  materialPool.outline = [];
  
  // Clear arrays
  objects = [];
  selectedObjects = [];
  selected = null;
  undoStack = [];
  redoStack = [];
}

// Add cleanup on page unload
window.addEventListener('beforeunload', cleanup);

// Optimize memory usage
function optimizeMemory() {
  // Limit undo stack
  if (undoStack.length > PERFORMANCE_SETTINGS.maxUndoSteps) {
    undoStack = undoStack.slice(-PERFORMANCE_SETTINGS.maxUndoSteps);
  }

  // Clear redo stack if too large
  if (redoStack.length > PERFORMANCE_SETTINGS.maxUndoSteps) {
    redoStack = redoStack.slice(-PERFORMANCE_SETTINGS.maxUndoSteps);
  }

  // Dispose of unused geometries and materials
  scene.children.forEach(child => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry && !objects.includes(child)) {
        child.geometry.dispose();
      }
      if (child.material && !objects.includes(child)) {
        child.material.dispose();
      }
    }
  });

  // Force garbage collection if available
  if (window.gc) {
    window.gc();
  }
}

// Add periodic memory optimization
setInterval(optimizeMemory, 30000); // Every 30 seconds

// Improved undo/redo: store selected, camera, pan; only clear redoStack on user changes
function saveStateForUndo(isUserAction = true) {
  const state = {
    objects: objects.map(obj => {
      let geometryData = null;
      if (obj.geometry instanceof THREE.BufferGeometry) {
        geometryData = obj.geometry.toJSON();
      }

      return {
        name: obj.name,
        type: obj.geometry.type,
        position: [obj.position.x, obj.position.y, obj.position.z],
        scale: [obj.scale.x, obj.scale.y, obj.scale.z],
        rotX: obj.userData.rotX || 0,
        rotY: obj.userData.rotY || 0,
        color: obj.material.color.getHex(),
        transparent: obj.material.transparent,
        opacity: obj.material.opacity,
        shininess: obj.material.shininess !== undefined ? obj.material.shininess : 30,
        specular: obj.material.specular ? obj.material.specular.getHex() : null,
        geometryData: geometryData
      };
    }),
    selectedIndex: selected ? objects.indexOf(selected) : -1,
    camera: { ...cameraTargetOrbit },
    pan: { ...targetPanOffset }
  };
  
  // Only push if different from last
  if (undoStack.length === 0 || JSON.stringify(undoStack[undoStack.length - 1]) !== JSON.stringify(state)) {
    undoStack.push(JSON.stringify(state));
    if (undoStack.length > 50) undoStack.shift();
    if (isUserAction) redoStack = [];
  }
}

function restoreState(stateStr) {
  try {
    const state = JSON.parse(stateStr);
    // Remove all objects
    for (const obj of objects) {
      scene.remove(obj);
      if (obj.userData.outline) scene.remove(obj.userData.outline);
    }
    objects = [];
    
    for (const item of state.objects) {
      let mesh, geometry;
      const color = new THREE.Color(item.color);
      const material = new THREE.MeshPhongMaterial({
        color,
        transparent: item.transparent,
        opacity: item.opacity,
        shininess: item.shininess !== undefined ? item.shininess : 30,
        specular: item.specular ? new THREE.Color(item.specular) : null
      });

      if (item.geometryData) {
        geometry = THREE.BufferGeometry.fromJSON(item.geometryData);
      } else if (item.type === 'BoxGeometry') {
        geometry = new THREE.BoxGeometry(50, 50, 50);
      } else if (item.type === 'SphereGeometry') {
        geometry = new THREE.SphereGeometry(30, 32, 24);
      } else if (item.type === 'CylinderGeometry') {
        geometry = new THREE.CylinderGeometry(25, 25, 60, 32);
      } else {
        geometry = new THREE.PlaneGeometry(80, 80, 1, 1);
      }
      mesh = new THREE.Mesh(
        geometry,
        material
      );
      mesh.name = item.name;
      mesh.position.fromArray(item.position);
      mesh.rotation.set(THREE.MathUtils.degToRad(item.rotX), THREE.MathUtils.degToRad(item.rotY), 0);
      mesh.scale.fromArray(item.scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      addOutline(mesh, geometry);
      objects.push(mesh);
      const idMatch = item.name.match(/\d+/);
      if (idMatch) {
        const idNum = parseInt(idMatch[1]);
        if (idNum >= objectIdCounter) objectIdCounter = idNum + 1;
      }
    }
    cameraTargetOrbit = state.camera;
    targetPanOffset = state.pan;
    // Restore selection by name if possible
    selected = null;
    selectedObjects = [];
    updatePropertiesPanel();
    updateBooleanPanel();
    selectObject(objects[state.selectedIndex]);
  } catch (err) {
    showToast(currentLanguage === 'tr' ? 'Durum geri yüklenemedi!' : 'Failed to restore state!');
  }
}

function undo() {
  if (undoStack.length <= 1) return;
  const currentState = undoStack.pop();
  redoStack.push(currentState);
  restoreState(undoStack[undoStack.length - 1]);
  markDirty();
  updatePropertiesPanel();
  updateBooleanPanel();
}

function redo() {
  if (redoStack.length === 0) return;
  const nextState = redoStack.pop();
  undoStack.push(nextState);
  restoreState(nextState);
  markDirty();
  updatePropertiesPanel();
  updateBooleanPanel();
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
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
});

window.addEventListener('keydown', e => {
  if (e.key === 'Shift') isShift = true;
  if (e.key === 'Control') isCtrl = true;
  if (e.key === 'Alt') isAlt = true;
  if (e.ctrlKey && e.key.toLowerCase() === 'z') {
    e.preventDefault();
    undo();
  }
  if (e.ctrlKey && e.key.toLowerCase() === 'y') {
    e.preventDefault();
    redo();
  }
  // Prevent DEL from deleting object if a properties input is focused
  const propInputs = [
    'propPosX', 'propPosY', 'propPosZ',
    'propRotX', 'propRotY', 'propRotZ',
    'propScaleX', 'propScaleY', 'propScaleZ', 'propColor'
  ];
  const isPropInputFocused = document.activeElement && propInputs.includes(document.activeElement.id);
  if ((e.key === 'Delete' || e.key === 'Del') && isPropInputFocused) {
    e.stopPropagation();
    e.preventDefault();
    return;
  }
  // Prevent object movement with arrow keys if a property input is focused
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && isPropInputFocused) {
    // Allow default for number input (increment/decrement)
    return;
  }
  if (selectedObjects.length === 0) return;
  
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    // Apply rotation to all selected objects
    for (const obj of selectedObjects) {
      if (e.key==='ArrowUp') obj.userData.rotX -= 5;
      if (e.key==='ArrowDown') obj.userData.rotX += 5;
      if (e.key==='ArrowLeft') obj.userData.rotY -= 5;
      if (e.key==='ArrowRight') obj.userData.rotY += 5;
    }
  }
  
  // Delete key to remove selected objects
  if (e.key === 'Delete' || e.key === 'Del') {
    if (selectedObjects.length > 0) {
      saveStateForUndo(false);
      for (const obj of selectedObjects) {
        scene.remove(obj);
        if (obj.userData && obj.userData.outline) scene.remove(obj.userData.outline);
        objects = objects.filter(o => o !== obj);
      }
      selectedObjects = [];
      selected = null;
      markDirty();
      updatePropertiesPanel();
      updateBooleanPanel();
    }
  }
});
window.addEventListener('keyup', e => {
  if (e.key === 'Shift') isShift = false;
  if (e.key === 'Control') isCtrl = false;
  if (e.key === 'Alt') isAlt = false;
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
    // If shift is pressed, append to selection
    selectObject(intersects[0].object, isShift);
    drag = true;
    lastX = e.clientX;
    lastY = e.clientY;
    isCameraDrag = false;
    selectedFaceNormal = intersects[0].face ? intersects[0].face.normal.clone() : null;
  } else {
    if (!isShift) {
      // Only clear selection unless appending
      selectObject(null);
    }
    isCameraDrag = true;
    lastX = e.clientX;
    lastY = e.clientY;
    selectedFaceNormal = null;
  }
});
document.addEventListener('mouseup', () => { drag = false; isCameraDrag = false; isPanning = false; });
document.addEventListener('mousemove', e => {
  if (isPanning) {
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    targetPanOffset.x -= dx * 1.0;
    targetPanOffset.y += dy * 1.0;
    lastX = e.clientX;
    lastY = e.clientY;
    return;
  }
  if (drag && selected) {
    if (isCtrl || isShift) saveStateForUndo();
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    const moveSnap = isAlt ? GRID_STEP / 16 : 0.2; // finer snap for smoother movement
    const rotSnap = isAlt ? 1 : 0.1; // finer snap for smoother rotation
    const scaleSnap = isAlt ? (GRID_STEP / 160) / 4 : 0.005; // finer snap for smoother scaling
    if (isCtrl) {
      // For Plane, scale only in X and Z axes
      if (selected.geometry && selected.geometry.type === 'PlaneGeometry') {
        let scaleX = selected.scale.x + dx * scaleSnap;
        let scaleZ = selected.scale.z + dy * scaleSnap;
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
        let scaleDelta = (axis === 'y' ? -dy : dx) * scaleSnap;
        let newScale = selected.scale[axis] + scaleDelta;
        newScale = Math.max(0.1, Math.min(10, newScale));
        selected.scale[axis] = newScale;
        if (selected.userData.outline) {
          selected.userData.outline.scale.copy(selected.scale);
        }
      } else {
        // Old behavior (scale on all axes)
        let scaleX = selected.scale.x + dx * scaleSnap;
        let scaleY = selected.scale.y - dy * scaleSnap;
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
      // rotation with Shift
      const speed = rotSnap; // smoother rotation speed
      selected.userData.rotY += dx * speed;
      selected.userData.rotX += dy * speed;
    } else {
      // translation on normal drag
      if (selectedFaceNormal) {
        const abs = selectedFaceNormal.clone().set(Math.abs(selectedFaceNormal.x), Math.abs(selectedFaceNormal.y), Math.abs(selectedFaceNormal.z));
        let axis = 'x';
        if (abs.y >= abs.x && abs.y >= abs.z) axis = 'y';
        else if (abs.z >= abs.x && abs.z >= abs.y) axis = 'z';
        let moveDelta = (axis === 'y' ? -dy : dx) * moveSnap;
        selected.position[axis] += moveDelta;
        if (selected.userData.outline) {
          selected.userData.outline.position.copy(selected.position);
        }
      } else {
        selected.position.x += dx * moveSnap;
        selected.position.y -= dy * moveSnap;
        if (selected.userData.outline) {
          selected.userData.outline.position.copy(selected.position);
        }
      }
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
  const mx = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  const my = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
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
      obj.userData.rotX = -90;
    } else {
      obj.rotation.set(0, 0, 0);
      obj.userData.rotX = 0;
    }
    obj.userData.rotY = 0;
    if (obj.userData.outline) {
      obj.userData.outline.position.copy(obj.position);
      obj.userData.outline.scale.copy(obj.scale);
      obj.userData.outline.rotation.copy(obj.rotation);
    }
  } else {
    // Reset the camera's position and orientation
    cameraTargetOrbit = { rotY: 30, rotX: 10, distance: 400 };
    targetPanOffset = { x: 0, y: 0 };
  }
});

// Touch event support (mobile compatibility)
let lastTouchX = 0, lastTouchY = 0;
canvas.addEventListener('touchstart', e => {
  if (e.touches.length === 1) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const mx = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
    const my = -(((touch.clientY - rect.top) / rect.height) * 2 - 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera({ x: mx, y: my }, camera);
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
    if (!lastPan) lastPan = { x: mx, y: my };
    const dx = mx - lastPan.x;
    const dy = my - lastPan.y;
    targetPanOffset.x -= dx;
    targetPanOffset.y += dy;
    lastPan = { x: mx, y: my };
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
        // rotation with Shift
        const speed = 0.5;
        selected.userData.rotY += dx * speed;
        selected.userData.rotX += dy * speed;
      } else {
        // translation on normal drag
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
      saveStateForUndo(false);
      scene.remove(selected);
      if (selected.userData && selected.userData.outline) scene.remove(selected.userData.outline);
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
  try {
    if (!mesh || !geometry) return;
    
    // Remove existing outline if any
    if (mesh.userData && mesh.userData.outline) {
      try {
        scene.remove(mesh.userData.outline);
      } catch (e) {
        console.warn('Failed to remove existing outline:', e);
      }
    }
    
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ 
        color: 0xFF00FF, 
        linewidth: 10,
        transparent: true,
        opacity: 0.8
      })
    );
    
    if (mesh.position) line.position.copy(mesh.position);
    if (mesh.rotation) line.rotation.copy(mesh.rotation);
    if (mesh.scale) line.scale.copy(mesh.scale);
    
    scene.add(line);
    mesh.userData = mesh.userData || {};
    mesh.userData.outline = line;
  } catch (error) {
    showToast(currentLanguage === 'tr' ? 'Çizgi oluşturulamadı!' : 'Failed to create outline!');
  }
}

function updateOutline(obj) {
  try {
    if (!obj || !obj.userData || !obj.userData.outline) return;
    
    const outline = obj.userData.outline;
    if (!outline || !outline.position || !outline.rotation || !outline.scale) {
      console.warn('Invalid outline object:', outline);
      return;
    }

    if (obj.isGroup) {
      outline.update();
    } else {
      if (obj.position) outline.position.copy(obj.position);
      if (obj.rotation) outline.rotation.copy(obj.rotation);
      if (obj.scale) outline.scale.copy(obj.scale);
    }
  } catch (error) {
    showToast(currentLanguage === 'tr' ? 'Çizgi güncellenemedi!' : 'Failed to update outline!');
    // Clean up invalid outline
    if (obj && obj.userData && obj.userData.outline) {
      try {
        scene.remove(obj.userData.outline);
        obj.userData.outline = null;
      } catch (e) {
        console.warn('Failed to clean up invalid outline:', e);
      }
    }
  }
}

// Function to save the scene as JSON
function saveScene(filename) {
  const arr = objects.map(obj => {
    let geometryData = null;
    if (obj.geometry instanceof THREE.BufferGeometry) {
      geometryData = obj.geometry.toJSON();
    }

    return {
      name: obj.name,
      type: obj.geometry.type,
      position: [obj.position.x, obj.position.y, obj.position.z],
      scale: [obj.scale.x, obj.scale.y, obj.scale.z],
      rotX: obj.userData.rotX || 0,
      rotY: obj.userData.rotY || 0,
      color: obj.material.color.getHex(),
      transparent: obj.material.transparent,
      opacity: obj.material.opacity,
      shininess: obj.material.shininess !== undefined ? obj.material.shininess : 30,
      specular: obj.material.specular ? obj.material.specular.getHex() : null,
      geometryData: geometryData
    };
  });
  const blob = new Blob([JSON.stringify(arr, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function selectObject(obj, appendToSelection = false) {
  if (!appendToSelection) {
    // Clear previous selection unless appending
    for (const o of selectedObjects) {
      if (o.userData && o.userData.outline) {
        o.userData.outline.visible = false;
      }
    }
    selectedObjects = [];
  }
  
  // If already selected, deselect
  const index = selectedObjects.indexOf(obj);
  if (index !== -1 && appendToSelection) {
    selectedObjects.splice(index, 1);
    if (obj && obj.userData && obj.userData.outline) {
      obj.userData.outline.visible = false;
    }
  } else if (obj !== null) {
    selectedObjects.push(obj);
    if (obj.userData && obj.userData.outline) {
      obj.userData.outline.visible = true;
    }
  }
  
  // Set the primary selected object (for single-object operations)
  selected = selectedObjects.length > 0 ? selectedObjects[selectedObjects.length - 1] : null;
  
  canvas.focus();
  updatePropertiesPanel();
  updateBooleanPanel();
}

function animate() {
  try {
    // Camera movement
    cameraOrbit.rotY += (cameraTargetOrbit.rotY - cameraOrbit.rotY) * CAMERA_SMOOTHNESS;
    cameraOrbit.rotX += (cameraTargetOrbit.rotX - cameraOrbit.rotX) * CAMERA_SMOOTHNESS;
    cameraOrbit.distance += (cameraTargetOrbit.distance - cameraOrbit.distance) * CAMERA_SMOOTHNESS;

    // Pan movement
    panOffset.x += (targetPanOffset.x - panOffset.x) * PAN_SMOOTHNESS;
    panOffset.y += (targetPanOffset.y - panOffset.y) * PAN_SMOOTHNESS;

    // Update camera
    const phi = THREE.MathUtils.degToRad(90 - cameraOrbit.rotX);
    const theta = THREE.MathUtils.degToRad(cameraOrbit.rotY);
    camera.position.x = cameraOrbit.distance * Math.sin(phi) * Math.sin(theta) + panOffset.x;
    camera.position.y = cameraOrbit.distance * Math.cos(phi) + panOffset.y;
    camera.position.z = cameraOrbit.distance * Math.sin(phi) * Math.cos(theta);
    camera.lookAt(panOffset.x, panOffset.y, 0);

    // Update objects
    for (const obj of objects) {
      if (!obj) continue;

      // Apply rotations
      if (obj.userData.targetRotX !== undefined) {
        obj.userData.rotX += (obj.userData.targetRotX - obj.userData.rotX) * 0.15;
        delete obj.userData.targetRotX;
      }
      if (obj.userData.targetRotY !== undefined) {
        obj.userData.rotY += (obj.userData.targetRotY - obj.userData.rotY) * 0.15;
        delete obj.userData.targetRotY;
      }
      
      obj.rotation.x = THREE.MathUtils.degToRad(obj.userData.rotX || 0);
      obj.rotation.y = THREE.MathUtils.degToRad(obj.userData.rotY || 0);
      
      // Update materials and outlines
      if (obj === selected) {
        if (obj.isGroup) {
          obj.children.forEach(child => {
            if (child.material) {
              child.material.emissive = new THREE.Color(1,1,0);
              child.material.emissiveIntensity = 0.5;
            }
          });
        } else if (obj.material) {
          obj.material.emissive = new THREE.Color(1,1,0);
          obj.material.emissiveIntensity = 0.5;
        }
        updateOutline(obj);
      } else {
        if (obj.isGroup) {
          obj.children.forEach(child => {
            if (child.material) {
              child.material.emissive = new THREE.Color(0,0,0);
              child.material.emissiveIntensity = 0;
            }
          });
        } else if (obj.material) {
          obj.material.emissive = new THREE.Color(0,0,0);
          obj.material.emissiveIntensity = 0;
        }
        updateOutline(obj);
      }
    }

    // Update theme
    if (savedTheme !== document.body.className) {
      savedTheme = document.body.className;
      sky.material = savedTheme === 'dark' ? skyMaterialDark : skyMaterialLight;
      renderer.setClearColor(savedTheme === 'dark' ? 0x151c2c : 0xf5f7fa);
      grid.material.opacity = savedTheme === 'dark' ? 0.5 : 0.35;
    }

    renderer.render(scene, camera);
    updatePropertiesPanel();
    requestAnimationFrame(animate);
  } catch (error) {
    showToast(currentLanguage === 'tr' ? 'Animasyon hatası!' : 'Animation error!');
    requestAnimationFrame(animate);
  }
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
    if (obj.userData && obj.userData.outline) scene.remove(obj.userData.outline);
  }
  objects = [];
  selected = null;
  selectedObjects = [];
  currentFileName = '';
  objectIdCounter = 1;
  markClean();
  cameraTargetOrbit = { rotY: 30, rotX: 10, distance: 400 };
  targetPanOffset = { x: 0, y: 0 };
  document.getElementById('propertiesPanel').style.display = 'none';
  document.getElementById('booleanPanel').style.display = 'none';
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
        if (obj.userData && obj.userData.outline) scene.remove(obj.userData.outline);
      }
      objects = [];
      let maxId = 0;
      objectIdCounter = 1; // Reset objectIdCounter
      for (const item of arr) {
        let mesh, geometry;
        const color = new THREE.Color(item.color);
        const material = new THREE.MeshPhongMaterial({
          color,
          transparent: item.transparent,
          opacity: item.opacity,
          shininess: item.shininess !== undefined ? item.shininess : 30,
          specular: item.specular ? new THREE.Color(item.specular) : null
        });

        if (item.geometryData) {
          try {
            geometry = THREE.BufferGeometry.fromJSON(item.geometryData);
          } catch (e) {
            showToast(currentLanguage === 'tr' ? 'Geometri verisi hatalı!' : 'Invalid geometry data!');
            return;
          }
        } else if (item.type === 'BoxGeometry') {
          geometry = new THREE.BoxGeometry(50, 50, 50);
        } else if (item.type === 'SphereGeometry') {
          geometry = new THREE.SphereGeometry(30, 32, 24);
        } else if (item.type === 'CylinderGeometry') {
          geometry = new THREE.CylinderGeometry(25, 25, 60, 32);
        } else {
          geometry = new THREE.PlaneGeometry(80, 80, 1, 1);
        }
        mesh = new THREE.Mesh(
          geometry,
          material
        );
        mesh.name = item.name;
        mesh.position.fromArray(item.position);
        mesh.rotation.set(THREE.MathUtils.degToRad(item.rotX), THREE.MathUtils.degToRad(item.rotY), 0);
        mesh.scale.fromArray(item.scale);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);
        addOutline(mesh, geometry);
        objects.push(mesh);
        const idMatch = item.name.match(/\d+/);
        if (idMatch) {
          const idNum = parseInt(idMatch[1]);
          if (idNum >= objectIdCounter) objectIdCounter = idNum + 1;
        }
      }
      cameraTargetOrbit = { rotY: 30, rotX: 10, distance: 400 };
      targetPanOffset = { x: 0, y: 0 };
      // Restore selection by name if possible
      selected = null;
      selectedObjects = [];
      updatePropertiesPanel();
    } catch (err) {
      showToast(currentLanguage === 'tr' ? 'Durum geri yüklenemedi!' : 'Failed to restore state!');
    }
  };
  reader.readAsText(file);
  document.getElementById('propertiesPanel').style.display = 'none';
  document.getElementById('booleanPanel').style.display = 'none';
};

// Undo/redo buttons
document.getElementById('undoBtn').onclick = undo;
document.getElementById('redoBtn').onclick = redo;

// About button
document.getElementById('aboutBtn').onclick = () => {
  const message = currentLanguage === 'tr' ? 'Tarik Bağrıyanık, Mayıs 2025' : 'Tarik Bagriyanik, May 2025';
  showToast(message);
};

// Language handling
const trBtn = document.getElementById('trDil');
const enBtn = document.getElementById('engDil');
const handleLanguageClick = (lang) => {
  currentLanguage = lang;
  setCookie('lang', currentLanguage, 365);
  updateLanguage();
  const langMsg = currentLanguage === 'tr' ? 'Dil Türkçe olarak ayarlandı' : 'Language set to English';
  showToast(langMsg);
};
if (trBtn) trBtn.onclick = (e) => { e.stopPropagation(); handleLanguageClick('tr'); };
if (enBtn) enBtn.onclick = (e) => { e.stopPropagation(); handleLanguageClick('en'); };

// Theme buttons
const darkThemeBtn = document.getElementById('darkTema');
const lightThemeBtn = document.getElementById('lightTema');

if (darkThemeBtn) darkThemeBtn.addEventListener('click', () => setTheme('dark'));
if (lightThemeBtn) lightThemeBtn.addEventListener('click', () => setTheme('light'));

// Graphics Quality Buttons
const graphicsGoodBtn = document.getElementById('graphicsGood');
const graphicsMediumBtn = document.getElementById('graphicsMedium');
const graphicsSimpleBtn = document.getElementById('graphicsSimple');

if (graphicsGoodBtn) graphicsGoodBtn.addEventListener('click', (e) => { e.stopPropagation(); setGraphicsQuality('iyi'); });
if (graphicsMediumBtn) graphicsMediumBtn.addEventListener('click', (e) => { e.stopPropagation(); setGraphicsQuality('orta'); });
if (graphicsSimpleBtn) graphicsSimpleBtn.addEventListener('click', (e) => { e.stopPropagation(); setGraphicsQuality('basit'); });

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  // Apply initial theme
  setTheme(savedTheme);
  // Apply initial graphics quality
  applyGraphicsQuality(); // Call this after renderer and light are surely initialized.
  // Apply current language
  updateLanguage();
  setCookie('lang', currentLanguage, 365); // This might be redundant if already set
});

// SECOND_EDIT: Add properties panel initialization, drag-and-drop, and update function
const panel = document.createElement('div');
panel.id = 'propertiesPanel';
panel.innerHTML = `
  <div id="propertiesHeader">Properties</div>
  <div id="propertiesContent">
    <label id="labelPos">Position: <input type="number" id="propPosX" step="3" min="-1000" max="1000" style="width:50px;"/> <input type="number" id="propPosY" step="3" min="-1000" max="1000" style="width:50px;"/> <input type="number" id="propPosZ" step="3" min="-1000" max="1000" style="width:50px;"/></label>
    <label id="labelRot">Rotation: <input type="number" id="propRotX" step="3" min="-180" max="180" style="width:50px;"/> <input type="number" id="propRotY" step="3" min="-180" max="180" style="width:50px;"/> <input type="number" id="propRotZ" step="3" min="-180" max="180" style="width:50px;"/></label>
    <label id="labelScale">Scale: <input type="number" id="propScaleX" step="0.2" min="0.1" max="100" style="width:50px;"/> <input type="number" id="propScaleY" step="0.2" min="0.1" max="100" style="width:50px;"/> <input type="number" id="propScaleZ" step="0.2" min="0.1" max="100" style="width:50px;"/></label>
    <label id="labelColor">Color: <input type="color" id="propColor"/></label>
  </div>
`;
document.body.appendChild(panel);

// Make panel draggable and save its position
let isDraggingPanel = false;
let panelOffset = { x: 0, y: 0 };
const header = document.getElementById('propertiesHeader');
header.addEventListener('mousedown', (e) => {
  isDraggingPanel = true;
  panelOffset.x = e.clientX - panel.offsetLeft;
  panelOffset.y = e.clientY - panel.offsetTop;
});
document.addEventListener('mousemove', (e) => {
  if (!isDraggingPanel) return;
  panel.style.left = (e.clientX - panelOffset.x) + 'px';
  panel.style.top = (e.clientY - panelOffset.y) + 'px';
});
document.addEventListener('mouseup', () => {
  if (isDraggingPanel) {
    isDraggingPanel = false;
    localStorage.setItem('propertiesPanelPos', JSON.stringify({ x: panel.offsetLeft, y: panel.offsetTop }));
  }
});

// Load saved panel position
const savedPos = JSON.parse(localStorage.getItem('propertiesPanelPos') || 'null');
if (savedPos) {
  panel.style.left = savedPos.x + 'px';
  panel.style.top = savedPos.y + 'px';
}

// Function to refresh panel values based on selected object
function updatePropertiesPanel() {
  if (selectedObjects.length === 0) {
    panel.style.display = 'none';
    return;
  }
  
  panel.style.display = 'block';
  
  // Update title based on number of selected objects
  const header = document.getElementById('propertiesHeader');
  
  if (selectedObjects.length > 1) {
    header.textContent = currentLanguage === 'tr' 
      ? `${selectedObjects.length} Nesne Seçildi` 
      : `${selectedObjects.length} Objects Selected`;
      
    // For multiple selection, show only common properties or disable specific fields
    document.querySelectorAll('#propertiesContent input').forEach(input => {
      input.disabled = selectedObjects.length > 1;
    });
    
    // Enable color for multiple objects
    document.getElementById('propColor').disabled = false;
  } else {
    // Single object selected - normal behavior
    document.querySelectorAll('#propertiesContent input').forEach(input => {
      input.disabled = false;
    });
    
    const shapeLabels = { 
      cube: {tr: 'Küp', en: 'Cube'}, 
      sphere: {tr: 'Küre', en: 'Sphere'}, 
      cylinder: {tr: 'Silindir', en: 'Cylinder'}, 
      plane: {tr: 'Plane', en: 'Plane'} 
    };
    
    // Handle group objects
    if (selected && selected.isGroup) {
      header.textContent = currentLanguage === 'tr' 
        ? `Grup (${selected.children.length} nesne)`
        : `Group (${selected.children.length} objects)`;
    } else if (selected) {
      // Use name if available, otherwise use type
      header.textContent = selected.name || 
        (selected.geometry && shapeLabels[selected.geometry.type]?.[currentLanguage]) || 
        (selected.geometry && selected.geometry.type);
    }
    
    if (selected) {
      document.getElementById('propPosX').value = selected.position.x.toFixed(2);
      document.getElementById('propPosY').value = selected.position.y.toFixed(2);
      document.getElementById('propPosZ').value = selected.position.z.toFixed(2);
      document.getElementById('propRotX').value = (selected.userData.rotX || 0).toFixed(2);
      document.getElementById('propRotY').value = (selected.userData.rotY || 0).toFixed(2);
      document.getElementById('propRotZ').value = THREE.MathUtils.radToDeg(selected.rotation.z).toFixed(2);
      document.getElementById('propScaleX').value = selected.scale.x.toFixed(2);
      document.getElementById('propScaleY').value = selected.scale.y.toFixed(2);
      document.getElementById('propScaleZ').value = selected.scale.z.toFixed(2);
      
      const propColorInput = document.getElementById('propColor');
      if (propColorInput && document.activeElement !== propColorInput) {
        // For groups, use the first child's color
        const colorObj = selected.isGroup ? selected.children[0] : selected;
        if (colorObj && colorObj.material && colorObj.material.color) {
          propColorInput.value = '#' + colorObj.material.color.getHexString();
        }
      }
    }
  }
}

// Update the properties panel color input for multi-select
const colorInput = document.getElementById('propColor');
if (colorInput) {
  ['change','input'].forEach(evt => {
    colorInput.addEventListener(evt, e => {
      if (selectedObjects.length === 0) return;
      
      // Apply color to all selected objects
      for (const obj of selectedObjects) {
        obj.material.color.set(e.target.value);
      }
      markDirty();
    });
  });
}

// Prevent arrow keys from changing input fields and let them control object
['propPosX', 'propPosY', 'propPosZ', 'propRotX', 'propRotY', 'propRotZ', 'propScaleX', 'propScaleY', 'propScaleZ'].forEach(id => {
  const input = document.getElementById(id);
  if (input) {
    ['change', 'input'].forEach(evt => {
      input.addEventListener(evt, e => {
        if (!selected) return;
        const val = parseFloat(e.target.value);
        switch (id) {
          case 'propPosX': selected.position.x = val; break;
          case 'propPosY': selected.position.y = val; break;
          case 'propPosZ': selected.position.z = val; break;
          case 'propRotX': selected.userData.rotX = val; selected.rotation.x = THREE.MathUtils.degToRad(val); break;
          case 'propRotY': selected.userData.rotY = val; selected.rotation.y = THREE.MathUtils.degToRad(val); break;
          case 'propRotZ': selected.rotation.z = THREE.MathUtils.degToRad(val); break;
          case 'propScaleX': selected.scale.x = val; break;
          case 'propScaleY': selected.scale.y = val; break;
          case 'propScaleZ': selected.scale.z = val; break;
        }
        if (selected.userData.outline) {
          selected.userData.outline.position.copy(selected.position);
          selected.userData.outline.rotation.copy(selected.rotation);
          selected.userData.outline.scale.copy(selected.scale);
        }
        markDirty();
      });
    });
  }
});

// Create boolean operations panel
const booleanPanel = document.createElement('div');
booleanPanel.id = 'booleanPanel';
booleanPanel.className = 'hidden';
booleanPanel.innerHTML = `
  <div id="booleanHeader">${currentLanguage === 'tr' ? 'Boolean İşlemleri' : 'Boolean Operations'}</div>
  <div id="booleanContent">
    <button id="groupBtn">${currentLanguage === 'tr' ? 'Grupla' : 'Group'}</button>
    <button id="unionBtn">${currentLanguage === 'tr' ? 'Birleştir' : 'Union'}</button>
    <button id="subtractBtn">${currentLanguage === 'tr' ? 'Çıkar' : 'Subtract'}</button>
    <button id="intersectBtn">${currentLanguage === 'tr' ? 'Kesişim' : 'Intersect'}</button>
  </div>
`;
document.body.appendChild(booleanPanel);

// Make boolean panel draggable with improved performance
let isDraggingBooleanPanel = false;
let booleanPanelOffset = { x: 0, y: 0 };
const booleanHeader = document.getElementById('booleanHeader');

booleanHeader.addEventListener('mousedown', (e) => {
  isDraggingBooleanPanel = true;
  booleanPanelOffset.x = e.clientX - booleanPanel.offsetLeft;
  booleanPanelOffset.y = e.clientY - booleanPanel.offsetTop;
  e.preventDefault(); // Prevent text selection
});

// Use requestAnimationFrame for smooth dragging
let lastMouseX = 0;
let lastMouseY = 0;

function updateBooleanPanelPosition(e) {
  if (!isDraggingBooleanPanel) return;
  
  const newX = e.clientX - booleanPanelOffset.x;
  const newY = e.clientY - booleanPanelOffset.y;
  
  // Apply position directly without transition
  booleanPanel.style.transform = 'none';
  booleanPanel.style.left = newX + 'px';
  booleanPanel.style.top = newY + 'px';
  
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
  
  requestAnimationFrame(() => updateBooleanPanelPosition(e));
}

document.addEventListener('mousemove', (e) => {
  if (isDraggingBooleanPanel) {
    updateBooleanPanelPosition(e);
  }
});

document.addEventListener('mouseup', () => {
  if (isDraggingBooleanPanel) {
    isDraggingBooleanPanel = false;
    localStorage.setItem('booleanPanelPos', JSON.stringify({ 
      x: booleanPanel.offsetLeft, 
      y: booleanPanel.offsetTop 
    }));
  }
});

// Function to update boolean panel visibility and language
function updateBooleanPanel() {
  if (selectedObjects.length >= 2) {
    booleanPanel.style.display = 'block';
    // Update language
    document.getElementById('booleanHeader').textContent = 
      currentLanguage === 'tr' ? 'Boolean İşlemleri' : 'Boolean Operations';
    document.getElementById('groupBtn').textContent = 
      currentLanguage === 'tr' ? 'Grupla' : 'Group';
    document.getElementById('unionBtn').textContent = 
      currentLanguage === 'tr' ? 'Birleştir' : 'Union';
    document.getElementById('subtractBtn').textContent = 
      currentLanguage === 'tr' ? 'Çıkar' : 'Subtract';
    document.getElementById('intersectBtn').textContent = 
      currentLanguage === 'tr' ? 'Kesişim' : 'Intersect';
  } else {
    booleanPanel.style.display = 'none';
  }
}

// Enhanced material creation with better reflections
function createStandardMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    transparent: true,
    opacity: 0.9,
    metalness: 0.7, // Increased from 0.4
    roughness: 0.1, // Decreased from 0.2
    envMapIntensity: 2.0, // Increased from 1.5
    side: THREE.DoubleSide
  });
}

// Add group operation
function performGroupOperation() {
  if (selectedObjects.length < 2) {
    showToast(currentLanguage === 'tr' ? 'En az iki nesne seçin' : 'Select at least two objects');
    return;
  }
  
  try {
    saveStateForUndo();
    
    // Create a new mesh that combines all selected objects
    const geometries = [];
    const materials = [];
    
    // Collect all geometries and materials
    for (const obj of selectedObjects) {
      if (obj.isGroup) {
        // If object is already a group, add its children
        obj.children.forEach(child => {
          geometries.push(child.geometry.clone());
          materials.push(child.material.clone());
        });
      } else {
        geometries.push(obj.geometry.clone());
        materials.push(obj.material.clone());
      }
    }
    
    // Create a new geometry that combines all geometries
    const combinedGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    let vertexOffset = 0;
    
    // Combine all geometries
    for (let i = 0; i < geometries.length; i++) {
      const geometry = geometries[i];
      const position = geometry.attributes.position;
      const index = geometry.index;
      
      // Add vertices
      for (let j = 0; j < position.count; j++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(position, j);
        vertex.applyMatrix4(geometry.matrix);
        vertices.push(vertex.x, vertex.y, vertex.z);
      }
      
      // Add indices
      if (index) {
        for (let j = 0; j < index.count; j += 3) {
          indices.push(
            index.getX(j) + vertexOffset,
            index.getX(j + 1) + vertexOffset,
            index.getX(j + 2) + vertexOffset
          );
        }
      } else {
        for (let j = 0; j < position.count; j += 3) {
          indices.push(j, j + 1, j + 2);
        }
      }
      
      vertexOffset += position.count;
    }
    
    // Set combined geometry attributes
    combinedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    if (indices.length > 0) {
      combinedGeometry.setIndex(indices);
    }
    combinedGeometry.computeVertexNormals();
    
    // Create new mesh with combined geometry
    const combinedMaterial = new THREE.MeshStandardMaterial({
      color: selectedObjects[0].material.color,
      transparent: true,
      opacity: 0.9,
      metalness: 0.7,
      roughness: 0.1,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide
    });
    
    const combinedMesh = new THREE.Mesh(
      combinedGeometry,
      combinedMaterial
    );
    combinedMesh.name = `combined_${objectIdCounter++}`;
    combinedMesh.castShadow = true;
    combinedMesh.receiveShadow = true;
    
    // Set position to the center of selected objects
    const center = new THREE.Vector3();
    selectedObjects.forEach(obj => {
      center.add(obj.position);
    });
    center.divideScalar(selectedObjects.length);
    combinedMesh.position.copy(center);
    
    // Remove old objects
    for (const obj of selectedObjects) {
      scene.remove(obj);
      if (obj.userData && obj.userData.outline) scene.remove(obj.userData.outline);
      objects = objects.filter(o => o !== obj);
    }
    
    // Add new combined mesh
    scene.add(combinedMesh);
    objects.push(combinedMesh);
    
    // Add outline
    addOutline(combinedMesh, combinedGeometry);
    
    // Select the new combined mesh
    selectedObjects = [];
    selectObject(combinedMesh);
    
    markDirty();
    
  } catch (error) {
    showToast(currentLanguage === 'tr' ? 'Gruplama başarısız!' : 'Grouping failed!');
  }
}

// Add boolean operations
function performBooleanOperation(operation) {
  if (selectedObjects.length !== 2) {
    showToast(currentLanguage === 'tr' ? 'Tam olarak iki nesne seçin' : 'Select exactly two objects');
    return;
  }
  
  try {
    saveStateForUndo();
    
    const obj1 = selectedObjects[0];
    const obj2 = selectedObjects[1];
    
    // Convert Three.js geometries to CSG polygons
    function geometryToCSG(geometry, matrix) {
      const vertices = [];
      const indices = [];
      
      // Get position attribute
      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      
      // Convert vertices
      for (let i = 0; i < position.count; i++) {
        const vertex = new THREE.Vector3();
        vertex.fromBufferAttribute(position, i);
        vertex.applyMatrix4(matrix);
        vertices.push(vertex);
      }
      
      // Get indices
      if (geometry.index) {
        for (let i = 0; i < geometry.index.count; i += 3) {
          indices.push(
            geometry.index.getX(i),
            geometry.index.getX(i + 1),
            geometry.index.getX(i + 2)
          );
        }
      } else {
        for (let i = 0; i < position.count; i += 3) {
          indices.push(i, i + 1, i + 2);
        }
      }
      
      // Create CSG polygons
      const polygons = [];
      for (let i = 0; i < indices.length; i += 3) {
        const a = vertices[indices[i]];
        const b = vertices[indices[i + 1]];
        const c = vertices[indices[i + 2]];
        
        // Calculate normal
        const normal = new THREE.Vector3()
          .crossVectors(
            new THREE.Vector3().subVectors(b, a),
            new THREE.Vector3().subVectors(c, a)
          )
          .normalize();
        
        // Create CSG polygon
        const polygon = new CSG.Polygon([
          new CSG.Vertex(new CSG.Vector(a.x, a.y, a.z), new CSG.Vector(normal.x, normal.y, normal.z)),
          new CSG.Vertex(new CSG.Vector(b.x, b.y, b.z), new CSG.Vector(normal.x, normal.y, normal.z)),
          new CSG.Vertex(new CSG.Vector(c.x, c.y, c.z), new CSG.Vector(normal.x, normal.y, normal.z))
        ]);
        
        polygons.push(polygon);
      }
      
      return CSG.fromPolygons(polygons);
    }
    
    // Convert geometries to CSG
    const csg1 = geometryToCSG(obj1.geometry, obj1.matrix);
    const csg2 = geometryToCSG(obj2.geometry, obj2.matrix);
    
    // Perform boolean operation
    let result;
    switch(operation) {
      case 'union':
        result = csg1.union(csg2);
        break;
      case 'subtract':
        result = csg1.subtract(csg2);
        break;
      case 'intersect':
        result = csg1.intersect(csg2);
        break;
      default:
        throw new Error('Invalid operation');
    }
    
    // Convert result back to Three.js geometry
    const resultGeometry = new THREE.BufferGeometry();
    const vertices = [];
    const normals = [];
    const indices = [];
    
    // Convert CSG polygons to Three.js geometry
    result.toPolygons().forEach((polygon, polygonIndex) => {
      const baseIndex = vertices.length / 3;
      polygon.vertices.forEach((vertex, vertexIndex) => {
        vertices.push(vertex.pos.x, vertex.pos.y, vertex.pos.z);
        normals.push(vertex.normal.x, vertex.normal.y, vertex.normal.z);
      });
      
      // Create triangles (assuming convex polygons)
      for (let i = 1; i < polygon.vertices.length - 1; i++) {
        indices.push(baseIndex, baseIndex + i, baseIndex + i + 1);
      }
    });
    
    // Set geometry attributes
    resultGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    resultGeometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
    resultGeometry.setIndex(indices);
    resultGeometry.computeVertexNormals();
    
    // Create new mesh with result geometry
    const resultMaterial = new THREE.MeshStandardMaterial({
      color: obj1.material.color,
      transparent: true,
      opacity: 0.9,
      metalness: 0.7,
      roughness: 0.1,
      envMapIntensity: 2.0,
      side: THREE.DoubleSide
    });
    
    const resultMesh = new THREE.Mesh(resultGeometry, resultMaterial);
    resultMesh.name = `${operation}_${objectIdCounter++}`;
    resultMesh.castShadow = true;
    resultMesh.receiveShadow = true;
    
    // Set position to the center of selected objects
    const center = new THREE.Vector3();
    selectedObjects.forEach(obj => {
      center.add(obj.position);
    });
    center.divideScalar(selectedObjects.length);
    resultMesh.position.copy(center);
    
    // Remove old objects
    for (const obj of selectedObjects) {
      scene.remove(obj);
      if (obj.userData && obj.userData.outline) scene.remove(obj.userData.outline);
      objects = objects.filter(o => o !== obj);
    }
    
    // Add new result mesh
    scene.add(resultMesh);
    objects.push(resultMesh);
    
    // Add outline
    addOutline(resultMesh, resultGeometry);
    
    // Select the new result mesh
    selectedObjects = [];
    selectObject(resultMesh);
    
    markDirty();
    
  } catch (error) {
    showToast(currentLanguage === 'tr' ? 'Boolean işlemi başarısız!' : 'Boolean operation failed!');
  }
}

// Attach event listeners to boolean operation buttons
document.getElementById('unionBtn').addEventListener('click', () => performBooleanOperation('union'));
document.getElementById('subtractBtn').addEventListener('click', () => performBooleanOperation('subtract'));
document.getElementById('intersectBtn').addEventListener('click', () => performBooleanOperation('intersect'));

// Attach event listener to group button
document.getElementById('groupBtn').addEventListener('click', performGroupOperation);

animate();

let copiedObject = null;

// Add copy object function
function copyObject() {
  if (selected) {
    copiedObject = selected.clone();
    copiedObject.name = `Copied ${selected.name}`;
    // Store the copied object in local storage
    localStorage.setItem('copiedObject', JSON.stringify(copiedObject.toJSON()));
    showToast(currentLanguage === 'tr' ? 'Nesne kopyalandı!' : 'Object copied!');
  } else {
    showToast(currentLanguage === 'tr' ? 'Lütfen önce bir nesne seçin!' : 'Please select an object first!');
  }
}

// Add paste object function
function pasteObject() {
  if (localStorage.getItem('copiedObject')) {
    try {
      const storedObject = localStorage.getItem('copiedObject');
      const copiedObjectData = JSON.parse(storedObject);
      let geometry, material, mesh;

      if (copiedObjectData.geometry) {
        try {
          geometry = THREE.BufferGeometry.fromJSON(copiedObjectData.geometry);
        } catch (e) {
          showToast(currentLanguage === 'tr' ? 'Geometri verisi hatalı!' : 'Invalid geometry data!');
          return;
        }
      } else {
        console.warn('No geometry data found for pasted object.');
        showToast(currentLanguage === 'tr' ? 'Geometri verisi bulunamadı!' : 'No geometry data found!');
        return;
      }

      material = new THREE.MeshPhongMaterial({
        color: new THREE.Color(copiedObjectData.material.color),
        transparent: copiedObjectData.material.transparent,
        opacity: copiedObjectData.material.opacity,
        shininess: copiedObjectData.material.shininess !== undefined ? copiedObjectData.material.shininess : 30,
        specular: copiedObjectData.material.specular ? new THREE.Color(copiedObjectData.material.specular) : null
      });

      mesh = new THREE.Mesh(
        geometry,
        material
      );
      mesh.name = `Pasted ${copiedObjectData.name}`; // Use the name from stored data
      mesh.position.set(copiedObjectData.position[0] + 10, copiedObjectData.position[1] + 10, copiedObjectData.position[2] + 10);
      mesh.rotation.set(copiedObjectData.rotation[0], copiedObjectData.rotation[1], copiedObjectData.rotation[2]);
      mesh.scale.set(copiedObjectData.scale[0], copiedObjectData.scale[1], copiedObjectData.scale[2]);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      scene.add(mesh);
      addOutline(mesh, geometry);
      objects.push(mesh);
      saveStateForUndo();
      markDirty();
      showToast(currentLanguage === 'tr' ? 'Nesne yapıştırıldı!' : 'Object pasted!');
    } catch (e) {
      showToast(currentLanguage === 'tr' ? 'Yapıştırma sırasında bir hata oluştu' : 'An error occurred during paste');
    }
  } else {
    showToast(currentLanguage === 'tr' ? 'Lütfen önce bir nesne kopyalayın!' : 'Please copy an object first!');
  }
}
document.getElementById('copyBtn').addEventListener('click', copyObject);
document.getElementById('pasteBtn').addEventListener('click', pasteObject);

animate();

// Toast message function
function showToast(msg, duration = 3000) {
  const statusBar = document.getElementById('statusBar');
  const toast = document.createElement('div');
  toast.innerText = msg;
  toast.style.position = 'absolute';
  toast.style.bottom = (statusBar.offsetHeight + 10) + 'px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = 'rgba(0, 0, 0, 0.7)';
  toast.style.color = '#fff';
  toast.style.padding = '8px 12px';
  toast.style.borderRadius = '4px';
  toast.style.pointerEvents = 'none';
  toast.style.zIndex = '1000';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = 'opacity 0.5s';
    toast.style.opacity = '0';
    setTimeout(() => document.body.removeChild(toast), 500);
  }, duration);
}

// Delete selected objects via menu
function deleteSelected() {
  if (selectedObjects.length > 0) {
    saveStateForUndo(false);
    for (const obj of selectedObjects) {
      scene.remove(obj);
      if (obj.userData && obj.userData.outline) scene.remove(obj.userData.outline);
      objects = objects.filter(o => o !== obj);
    }
    selectedObjects = [];
    selected = null;
    markDirty();
    updatePropertiesPanel();
    updateBooleanPanel();
  } else {
    showToast(currentLanguage === 'tr' ? 'Lütfen önce bir nesne seçin!' : 'Please select an object first!');
  }
}
document.getElementById('deleteBtn').addEventListener('click', deleteSelected);

animate();
