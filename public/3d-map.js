/* 3D Interactive Building Map for SmartSearch Floor Manager PRO */

let scene, camera, renderer, controls;
let roomMeshes = [];
let hoveredMesh = null;
let selectedRoomData = null;
let currentFloorFilter = "ALL";
let animationFrameId = null;

const statusColors = {
  FREE: 0x10b981,   // Emerald green
  SOON: 0xf59e0b,   // Amber yellow
  BUSY: 0xef4444    // Crimson red
};

const floorYPositions = {
  "Ground Floor": 0,
  "1st Floor": 2.8,
  "2nd Floor": 5.6,
  "3rd Floor": 8.4
};

function init3DMap(containerId = "map3dContainer") {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = ""; // Clear existing canvas if any

  const width = container.clientWidth || 800;
  const height = container.clientHeight || 500;

  // 1. Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f172a); // Deep slate background

  // 2. Camera (Isometric Orthographic style or Perspective)
  const aspect = width / height;
  camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
  camera.position.set(22, 24, 28);
  camera.lookAt(0, 4, 0);

  // 3. Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  // 4. Orbit Controls
  if (window.THREE.OrbitControls) {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2.1; // Don't flip under ground
    controls.target.set(0, 4, 0);
  }

  // 5. Lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.9);
  dirLight.position.set(30, 40, 20);
  dirLight.castShadow = true;
  dirLight.shadow.mapSize.width = 1024;
  dirLight.shadow.mapSize.height = 1024;
  scene.add(dirLight);

  const blueLight = new THREE.PointLight(0x3b82f6, 0.5, 50);
  blueLight.position.set(-20, 15, -20);
  scene.add(blueLight);

  // Grid Helper on ground
  const gridHelper = new THREE.GridHelper(40, 20, 0x334155, 0x1e293b);
  gridHelper.position.y = -0.1;
  scene.add(gridHelper);

  // Raycaster for hover/click
  setupRaycaster(container);

  // Window Resize
  window.addEventListener("resize", () => {
    if (!container) return;
    const w = container.clientWidth;
    const h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  animate();
}

function update3DMapRooms(roomsData) {
  if (!scene) return;

  // Remove existing room meshes & floor plates
  roomMeshes.forEach(mesh => scene.remove(mesh));
  roomMeshes = [];

  const existingPlates = scene.children.filter(c => c.userData && c.userData.isFloorPlate);
  existingPlates.forEach(p => scene.remove(p));

  const floors = ["Ground Floor", "1st Floor", "2nd Floor", "3rd Floor"];

  // Build Floor Slab Plates
  floors.forEach(floorName => {
    const y = floorYPositions[floorName];
    const plateGeo = new THREE.BoxGeometry(18, 0.3, 14);
    const plateMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      transparent: true,
      opacity: 0.85,
      roughness: 0.4,
      metalness: 0.1
    });
    const plate = new THREE.Mesh(plateGeo, plateMat);
    plate.position.set(0, y - 0.2, 0);
    plate.receiveShadow = true;
    plate.userData = { isFloorPlate: true, floorName };
    scene.add(plate);
  });

  // Group rooms by floor to layout on grid
  floors.forEach(floorName => {
    const roomsOnFloor = roomsData.filter(r => r.floor === floorName);
    const yBase = floorYPositions[floorName];

    // Layout rooms in a 2x3 or 2x2 grid per floor slab
    roomsOnFloor.forEach((room, idx) => {
      const row = Math.floor(idx / 3);
      const col = idx % 3;

      const x = (col - 1) * 5.2;
      const z = (row - 0.5) * 5.2;

      const colorHex = statusColors[room.status] || statusColors.FREE;

      const roomGeo = new THREE.BoxGeometry(4.5, 1.8, 4.5);
      const roomMat = new THREE.MeshStandardMaterial({
        color: colorHex,
        roughness: 0.3,
        metalness: 0.2,
        transparent: true,
        opacity: 0.9
      });

      const roomMesh = new THREE.Mesh(roomGeo, roomMat);
      roomMesh.position.set(x, yBase + 0.9, z);
      roomMesh.castShadow = true;
      roomMesh.receiveShadow = true;

      // Add outline wireframe edge
      const edges = new THREE.EdgesGeometry(roomGeo);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.4, transparent: true });
      const line = new THREE.LineSegments(edges, lineMat);
      roomMesh.add(line);

      // Store metadata
      roomMesh.userData = {
        isRoom: true,
        roomData: room,
        originalY: yBase + 0.9,
        originalColor: colorHex,
        floorName
      };

      scene.add(roomMesh);
      roomMeshes.push(roomMesh);
    });
  });

  filter3DMapByFloor(currentFloorFilter);
}

function filter3DMapByFloor(floorName) {
  currentFloorFilter = floorName;
  if (!scene) return;

  roomMeshes.forEach(mesh => {
    if (floorName === "ALL" || mesh.userData.floorName === floorName) {
      mesh.visible = true;
    } else {
      mesh.visible = false;
    }
  });

  const plates = scene.children.filter(c => c.userData && c.userData.isFloorPlate);
  plates.forEach(p => {
    if (floorName === "ALL" || p.userData.floorName === floorName) {
      p.visible = true;
    } else {
      p.visible = false;
    }
  });
}

function setupRaycaster(container) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onPointerMove(event) {
    const rect = container.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(roomMeshes.filter(m => m.visible));

    if (intersects.length > 0) {
      const hit = intersects[0].object;
      if (hoveredMesh !== hit) {
        if (hoveredMesh) resetMeshState(hoveredMesh);
        hoveredMesh = hit;
        hoveredMesh.position.y = hoveredMesh.userData.originalY + 0.3;
        hoveredMesh.material.emissive = new THREE.Color(0x38bdf8);
        hoveredMesh.material.emissiveIntensity = 0.4;
        container.style.cursor = "pointer";

        showTooltip(event, hit.userData.roomData);
      } else {
        moveTooltip(event);
      }
    } else {
      if (hoveredMesh) {
        resetMeshState(hoveredMesh);
        hoveredMesh = null;
        container.style.cursor = "default";
      }
      hideTooltip();
    }
  }

  function onClick(event) {
    if (hoveredMesh && hoveredMesh.userData.roomData) {
      const room = hoveredMesh.userData.roomData;
      if (window.openRoomModal) {
        window.openRoomModal(room);
      }
    }
  }

  function resetMeshState(mesh) {
    mesh.position.y = mesh.userData.originalY;
    mesh.material.emissive = new THREE.Color(0x000000);
    mesh.material.emissiveIntensity = 0;
  }

  container.addEventListener("pointermove", onPointerMove);
  container.addEventListener("click", onClick);
}

function showTooltip(event, room) {
  let tt = document.getElementById("map3dTooltip");
  if (!tt) {
    tt = document.createElement("div");
    tt.id = "map3dTooltip";
    tt.className = "map-tooltip";
    document.body.appendChild(tt);
  }
  const badgeClass = room.status === "FREE" ? "free" : (room.status === "SOON" ? "soon" : "busy");
  tt.innerHTML = `
    <strong>${room.id}</strong> <span class="badge ${badgeClass}">${room.status}</span><br/>
    <small>${room.name}</small><br/>
    <small>Free until: <b>${room.freeUntil || 'N/A'}</b></small>
  `;
  tt.style.display = "block";
  moveTooltip(event);
}

function moveTooltip(event) {
  const tt = document.getElementById("map3dTooltip");
  if (tt) {
    tt.style.left = (event.clientX + 15) + "px";
    tt.style.top = (event.clientY + 15) + "px";
  }
}

function hideTooltip() {
  const tt = document.getElementById("map3dTooltip");
  if (tt) tt.style.display = "none";
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);
  if (controls) controls.update();
  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

window.init3DMap = init3DMap;
window.update3DMapRooms = update3DMapRooms;
window.filter3DMapByFloor = filter3DMapByFloor;
