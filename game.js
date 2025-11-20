const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // fallback sky color

const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// FPS camera rig
const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();
yaw.add(pitch);
pitch.add(camera);
camera.position.y = 1.6;
scene.add(yaw);

// Movement and physics
const controls = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
let verticalVelocity = 0;
const gravity = -0.01;
const jumpStrength = 0.2;
let isGrounded = true;
let isAiming = false;

const raycaster = new THREE.Raycaster();
let enemies = [];

document.addEventListener("contextmenu", e => e.preventDefault());

// Procedural terrain
const terrainGeo = new THREE.PlaneGeometry(100, 100, 64, 64);
for (let i = 0; i < terrainGeo.vertices?.length || terrainGeo.attributes.position.count; i++) {
  const y = Math.random() * 0.5;
  if (terrainGeo.vertices) terrainGeo.vertices[i].z = y;
  else terrainGeo.attributes.position.setY(i, y);
}
terrainGeo.computeVertexNormals();

const terrainMat = new THREE.MeshLambertMaterial({ color: 0x228B22 }); // forest green
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

// Sky dome
const skyGeo = new THREE.SphereGeometry(500, 32, 32);
const skyMat = new THREE.MeshBasicMaterial({ color: 0x87ceeb, side: THREE.BackSide });
const sky = new THREE.Mesh(skyGeo, skyMat);
scene.add(sky);

// Lighting
const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(50, 100, 50);
sun.castShadow = true;
scene.add(sun);

const ambient = new THREE.AmbientLight(0xaaaaaa);
scene.add(ambient);

// Gun model
const gun = new THREE.Mesh(
  new THREE.BoxGeometry(0.3, 0.2, 1),
  new THREE.MeshBasicMaterial({ color: 0x888888 })
);
gun.position.set(0.4, -0.3, -0.8);
camera.add(gun);

// Enemies
function spawnEnemy() {
  const enemy = new THREE.Mesh(
    new THREE.BoxGeometry(1, 2, 1),
    new THREE.MeshBasicMaterial({ color: 0xff0000 })
  );
  enemy.position.set(Math.random() * 40 - 20, 1, Math.random() * 40 - 20);
  enemy.castShadow = true;
  scene.add(enemy);
  enemies.push(enemy);
  document.getElementById("enemyCount").textContent = enemies.length;
}
for (let i = 0; i < 10; i++) spawnEnemy();

// Shooting
function shoot() {
  raycaster.setFromCamera({ x: 0, y: 0 }, camera);
  const hits = raycaster.intersectObjects(enemies);
  if (hits.length > 0) {
    const hit = hits[0].object;
    scene.remove(hit);
    enemies = enemies.filter(e => e !== hit);
    document.getElementById("enemyCount").textContent = enemies.length;
  }
}

// Pointer lock
document.addEventListener("click", () => {
  if (document.pointerLockElement !== renderer.domElement) {
    renderer.domElement.requestPointerLock();
  } else {
    shoot();
  }
});

document.addEventListener("pointerlockchange", () => {
  if (document.pointerLockElement === renderer.domElement) {
    document.addEventListener("mousemove", onMouseMove, false);
  } else {
    document.removeEventListener("mousemove", onMouseMove, false);
  }
});

function onMouseMove(e) {
  const sensitivity = isAiming ? 0.001 : 0.002;
  yaw.rotation.y -= e.movementX * sensitivity;
  pitch.rotation.x -= e.movementY * sensitivity;
  pitch.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch.rotation.x));
}

// Mouse buttons
document.addEventListener("mousedown", e => {
  if (e.button === 2) {
    isAiming = true;
    camera.fov = 45;
    camera.updateProjectionMatrix();
  }
});
document.addEventListener("mouseup", e => {
  if (e.button === 2) {
    isAiming = false;
    camera.fov = 75;
    camera.updateProjectionMatrix();
  }
});

// Keyboard
document.addEventListener("keydown", e => {
  if (e.code === "KeyW") controls.forward = true;
  if (e.code === "KeyS") controls.backward = true;
  if (e.code === "KeyA") controls.left = true;
  if (e.code === "KeyD") controls.right = true;
  if (e.code === "Space" && isGrounded) {
    verticalVelocity = jumpStrength;
    isGrounded = false;
  }
});
document.addEventListener("keyup", e => {
  if (e.code === "KeyW") controls.forward = false;
  if (e.code === "KeyS") controls.backward = false;
  if (e.code === "KeyA") controls.left = false;
  if (e.code === "KeyD") controls.right = false;
});

// Game loop
function animate() {
  requestAnimationFrame(animate);

  direction.set(0, 0, 0);
  if (controls.forward) direction.z -= 1;
  if (controls.backward) direction.z += 1;
  if (controls.left) direction.x -= 1;
  if (controls.right) direction.x += 1;
  direction.normalize();

  velocity.copy(direction).applyEuler(yaw.rotation).multiplyScalar(0.1);

  verticalVelocity += gravity;
  yaw.position.y += verticalVelocity;
  if (yaw.position.y <= 0) {
    yaw.position.y = 0;
    verticalVelocity = 0;
    isGrounded = true;
  }

  yaw.position.add(new THREE.Vector3(velocity.x, 0, velocity.z));
  renderer.render(scene, camera);
}
animate();
