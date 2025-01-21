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

  // If no scene exists, create one
  if (!scene) {
      scene = document.createElement('a-scene');
      scene.setAttribute('embedded', '');
      document.body.appendChild(scene);
  }

  // Create a sky background
  let sky = document.createElement('a-sky');
  sky.setAttribute('radius', '3000');
  scene.appendChild(sky);

  // Create the camera group
  let cameraGroup = document.createElement('a-entity');
  cameraGroup.setAttribute('position', '0 0 300');
  cameraGroup.setAttribute('movement-controls', 'controls: gamepad, touch; fly: true; speed: 7');

  // Create the left camera
  let leftCamera = document.createElement('a-entity');
  leftCamera.setAttribute('id', 'left-camera');
  leftCamera.setAttribute('camera', '');
  leftCamera.setAttribute('position', '-0.05 0 0'); // Slight left offset
  leftCamera.setAttribute('look-controls', 'pointerLockEnabled: false');
  leftCamera.setAttribute('wasd-controls', 'fly: true; acceleration: 700');

  // Create the right camera
  let rightCamera = document.createElement('a-entity');
  rightCamera.setAttribute('id', 'right-camera');
  rightCamera.setAttribute('camera', '');
  rightCamera.setAttribute('position', '0.05 0 0'); // Slight right offset
  rightCamera.setAttribute('look-controls', 'pointerLockEnabled: false');
  rightCamera.setAttribute('wasd-controls', 'fly: true; acceleration: 700');

  // Attach cameras to the scene
  cameraGroup.appendChild(leftCamera);
  cameraGroup.appendChild(rightCamera);
  scene.appendChild(cameraGroup);
}

// Function to create the graph with A-Frame cameras
function createGraph(containerId) {
  const graph = ForceGraphVR()
      .jsonUrl('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/2b99aa7abcf5646ee9244ce39bf4eb2ecf7536ec/medical_data.json')
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
          sprite.raycast = () => {}; // Disable raycasting on text
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

// Function to synchronize user input across both graphs
function syncInput() {
  const leftCamera = document.querySelector('#left-camera');
  const rightCamera = document.querySelector('#right-camera');
  
  function applyMovement(event) {
      if (!leftCamera || !rightCamera){
        console.log("error cameras not there");
        return;
      } 

      // Get current positions and rotations
      let leftPos = leftCamera.getAttribute('position');
      let leftRot = leftCamera.getAttribute('rotation');

      // Apply the same movement & rotation to both cameras
      rightCamera.setAttribute('position', leftPos);
      rightCamera.setAttribute('rotation', leftRot);

      console.log(leftPos);
      console.log(leftRot);
  }

  // Listen to all movement-related events and apply them to both displays
  document.addEventListener('keydown', applyMovement);
  document.addEventListener('keyup', applyMovement);
  document.addEventListener('mousemove', applyMovement);
  document.addEventListener('wheel', applyMovement);
}

// Run input sync when A-Frame is ready
setTimeout(syncInput, 2000);
