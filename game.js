const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, innerWidth / innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// FPS camera rig
const yaw = new THREE.Object3D();
const pitch = new THREE.Object3D();
yaw.add(pitch);
pitch.add(camera);
camera.position.y = 1.6;
scene.add(yaw);

const controls = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
let enemies = [];

// Floor
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(100, 100),
  new THREE.MeshBasicMaterial({ color: 0x222222 })
);
floor.rotation.x = -Math.PI / 2;
scene.add(floor);

// Light
scene.add(new THREE.AmbientLight(0xffffff));

// Gun
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
  yaw.rotation.y -= e.movementX * 0.002;
  pitch.rotation.x -= e.movementY * 0.002;
  pitch.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch.rotation.x));
}

// Movement
document.addEventListener("keydown", e => {
  if (e.code === "KeyW") controls.forward = true;
  if (e.code === "KeyS") controls.backward = true;
  if (e.code === "KeyA") controls.left = true;
  if (e.code === "KeyD") controls.right = true;
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
  yaw.position.add(velocity);

  renderer.render(scene, camera);
}
animate();
