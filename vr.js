// Define helper functions before they are used
function getColorByDayDifference(dateStr) {
  if (!dateStr) return 'gray';

  const dateParts = dateStr.split('-');
  const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));

  const colorScale = ['grey', 'green', 'lightblue', 'blue', 'violet', 'yellow', 'orange', 'red'];

  return colorScale[Math.min(Math.abs(diffDays) / 2, colorScale.length - 1)];
}

function createTextCanvas(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 256;
  context.fillStyle = 'rgba(255, 255, 255, 1)';
  context.font = '48px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  return canvas;
}

// Function to create the scene and cameras
function createScene() {
  let scene = document.querySelector('a-scene');

  if (!scene) {
      scene = document.createElement('a-scene');
      scene.setAttribute('embedded', '');
      document.body.appendChild(scene);
  }

  let sky = document.createElement('a-sky');
  sky.setAttribute('radius', '3000');
  scene.appendChild(sky);

  // ✅ Remove existing cameras to prevent duplication
  document.querySelectorAll('a-entity[camera]').forEach(cam => cam.remove());

  let cameraGroup = document.createElement('a-entity');
  cameraGroup.setAttribute('movement-controls', 'controls: gamepad, touch; fly: true; speed: 7');

  // ✅ Ensure exactly two cameras are created
  for (let i = 0; i < 2; i++) {
      let camera = document.createElement('a-entity');
      camera.setAttribute('camera', '');
      camera.setAttribute('look-controls', 'pointerLockEnabled: false');
      camera.setAttribute('wasd-controls', 'fly: true; acceleration: 500');
      cameraGroup.appendChild(camera);
  }

  scene.appendChild(cameraGroup);

  // ✅ Set both cameras to the same initial position after scene loads
  scene.addEventListener('loaded', () => {
      let cameras = document.querySelectorAll('a-entity[camera]');

      if (cameras.length === 2) {
          cameras.forEach(camera => {
              camera.setAttribute('position', '0 0 300');
              camera.setAttribute('rotation', '0 0 0');
          });
          console.log("Cameras initialized at (0,0,300)");
      } else {
          console.warn("Unexpected number of cameras detected:", cameras.length);
      }
  });
}

let allNodes = {}; // ✅ Shared list of nodes for both graphs
let leftGraphFinalized = false; // ✅ Tracks if left graph is fully settled

function createGraph(containerId) {
  const graph = ForceGraphVR()
      .jsonUrl('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/2b99aa7abcf5646ee9244ce39bf4eb2ecf7536ec/medical_data.json')
      .width(window.innerWidth / 2)  // ✅ Make each graph take up half the screen width
      .height(window.innerHeight)  // ✅ Full height
      .numDimensions(3)
      .forceEngine("d3")
      .cooldownTicks(100)
      .d3AlphaDecay(0.03)
      .d3VelocityDecay(0.3)
      .nodeAutoColorBy('id')
      .nodeLabel(node => node.id)
      .nodeThreeObject(node => {
          const spriteMaterial = new THREE.SpriteMaterial({
              map: new THREE.CanvasTexture(createTextCanvas(node.id)),
              transparent: true
          });
          const sprite = new THREE.Sprite(spriteMaterial);
          sprite.scale.set(50, 25, 1);
          sprite.position.set(0, 15, 0);
          sprite.raycast = () => {};
          sprite.frustumCulled = false;
          node.__textSprite = sprite;
          return sprite;
      })
      .nodeThreeObjectExtend(true)
      .linkColor(link => getColorByDayDifference(link.time))
      .linkWidth(2)
      .linkCurvature(link => (link.source === link.target ? 1 : 0.1))
      .nodeColor(() => 'white')
      .nodeOpacity(0.7)
      .onNodeClick(node => {
          if (node.link) window.open(node.link, '_blank');
      })
      .linkDirectionalArrowLength(5)
      .linkDirectionalArrowColor(() => 'white')
      .linkDirectionalArrowRelPos(0.99)
      .linkDirectionalArrowResolution(8)
      .linkDirectionalParticles(2)
      .linkDirectionalParticleSpeed(0.01)
      .linkDirectionalParticleColor(() => 'orange')
      (document.getElementById(containerId));

  return graph;
}






// Create the scene and cameras
createScene();

// Create the two graphs with two displays
const graphLeft = createGraph('3d-graph-left');
const graphRight = createGraph('3d-graph-right');

console.log(graphLeft.graphData());

// Function to synchronize user input across both graphs
function syncInput(graph) {
  let cameras = document.querySelectorAll('a-entity[camera]');

  if (cameras.length < 2) {
      console.warn("Cameras not found for input sync, retrying...");
      setTimeout(syncInput, 100); // Wait 100ms before retrying
      return;
  }

  let leftCamera = cameras[0];
  let rightCamera = cameras[1];

  function updateCameras() {
    let cameras = document.querySelectorAll('a-entity[camera]');
    //console.log(cameras);


    let leftCamera = cameras[0];
    let rightCamera = cameras[1];

    let leftPos = leftCamera.getAttribute('position');
    let leftRot = leftCamera.getAttribute('rotation');

    // // Sync the second camera to the first camera using `setAttribute`
    // rightCamera.setAttribute('position', `${leftPos.x} ${leftPos.y} ${leftPos.z}`);
    // rightCamera.setAttribute('rotation', `${leftRot.x} ${leftRot.y} ${leftRot.z}`);

    document.querySelectorAll('a-entity[camera]').forEach(camera => {
      camera.setAttribute('position', leftPos);
      camera.setAttribute('rotation', leftRot);
  });

    requestAnimationFrame(updateCameras);

    
}

  // Start syncing continuously
  updateCameras();

}
//not using rn
function moveToNode(position) {
  console.log(`Moving cameras to "Cut CD" node at (${position.x}, ${position.y}, ${position.z})`);

  document.querySelectorAll('a-entity[camera]').forEach(camera => {
      smoothMove(camera, position.x, position.y, position.z);
  });
}

// ✅ Function to move camera smoothly
function smoothMove(camera, targetX, targetY, targetZ) {
  let currentPos = camera.getAttribute("position");

  let step = 0;
  let steps = 50; // Smooth transition in 50 frames
  function animateMove() {
      step++;
      let newX = currentPos.x + ((targetX - currentPos.x) * (step / steps));
      let newY = currentPos.y + ((targetY - currentPos.y) * (step / steps));
      let newZ = currentPos.z + ((targetZ - currentPos.z) * (step / steps));

      camera.setAttribute("position", `${newX} ${newY} ${newZ}`);

      if (step < steps) {
          requestAnimationFrame(animateMove);
      }
  }

  animateMove();
}

function logCameraPositions() {
  let cameras = document.querySelectorAll('a-entity[camera]');

  // if (cameras.length !== 2) {
  //     console.warn("Cameras not found, retrying...");
  //     setTimeout(logCameraPositions, 500);
  //     return;
  // }

  let leftCamera = cameras[0];
  let rightCamera = cameras[1];

  function printPositions() {
      let leftPos = leftCamera.getAttribute('position');
      let rightPos = rightCamera.getAttribute('position');

      console.log(`📍 Left Camera Position: x=${leftPos.x}, y=${leftPos.y}, z=${leftPos.z}`);
      console.log(`📍 Right Camera Position: x=${rightPos.x}, y=${rightPos.y}, z=${rightPos.z}`);
      console.log(`🔄 Camera Desync: Δx=${Math.abs(leftPos.x - rightPos.x)}, Δy=${Math.abs(leftPos.y - rightPos.y)}, Δz=${Math.abs(leftPos.z - rightPos.z)}`);

      requestAnimationFrame(printPositions);
  }

  printPositions();
}





// Run input sync when A-Frame is ready
//setTimeout(syncInput, 2000);

window.onload = () => {
  console.log("Window fully loaded, initializing input sync...");
  syncInput(graphLeft);
  logCameraPositions();
  
};