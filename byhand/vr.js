document.addEventListener("DOMContentLoaded", async () => {
  const leftContainer = document.getElementById('graph-left');
  const rightContainer = document.getElementById('graph-right');

  if (!leftContainer || !rightContainer) {
      console.error("❌ Graph containers not found.");
      return;
  }

  let storedGraphData = { nodes: [], links: [] }; // Manual storage

  try {
      console.log("Fetching graph data...");
      
      // Fetch JSON data manually
      const response = await fetch('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/2b99aa7abcf5646ee9244ce39bf4eb2ecf7536ec/medical_data.json');
      storedGraphData = await response.json();
      
      if (!storedGraphData.nodes || storedGraphData.nodes.length === 0) {
          throw new Error("❌ Fetched graph data is empty.");
      }

      console.log("✅ Graph data successfully fetched and stored:", storedGraphData);

      // Set Graph Size to Match Container
      const graphWidth = leftContainer.clientWidth;
      const graphHeight = leftContainer.clientHeight;

      // Define Camera Offsets for Stereoscopic Effect
      const cameraOffset = 0.065; // ~6.5cm human eye distance

      // Create the first graph (original)
      const graph1 = ForceGraphVR()
          .graphData(storedGraphData) // Use manually fetched data
          .nodeAutoColorBy('id')
          .nodeLabel(node => node.id)
          .width(graphWidth)
          .height(graphHeight)
          .nodeThreeObject(node => {
              const group = new THREE.Group();
              const spriteMaterial = new THREE.SpriteMaterial({
                  map: new THREE.CanvasTexture(createTextCanvas(node.id)),
                  transparent: true
              });

              const sprite = new THREE.Sprite(spriteMaterial);
              sprite.scale.set(50, 25, 1);
              sprite.position.set(0, 15, 0);
              sprite.raycast = () => {}; // Disable raycasting on text

              group.add(sprite);
              return group;
          })
          .nodeThreeObjectExtend(true)
          .linkColor(() => '#3da7c4')
          .linkOpacity(0.7)
          .linkWidth(2)
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
          .linkDirectionalParticleColor(() => 'orange');

      graph1(leftContainer);

      // **Step 1: Wait for `graph1` to stabilize before mirroring**
      setTimeout(() => {
          console.log("✅ Left Graph Stabilized. Locking node positions...");

          // **Step 2: Lock all node positions (Prevent Left Graph from Moving)**
          storedGraphData.nodes.forEach(node => {
              node.fx = node.x;
              node.fy = node.y;
              node.fz = node.z;
          });

          console.log("✅ Node positions locked for left graph:", storedGraphData);

          // **Step 3: Create the mirrored graph**
          const mirroredNodes = storedGraphData.nodes.map(node => ({
              ...node,
              x: node.x, // Mirror X-axis
              y: node.y,
              z: node.z,
              fx: node.x, // Fix mirrored positions too
              fy: node.y,
              fz: node.z
          }));

          const mirroredGraphData = {
              nodes: mirroredNodes,
              links: storedGraphData.links.map(link => ({ ...link })) // Copy links exactly
          };

          console.log("✅ Mirrored Graph Data Prepared:", mirroredGraphData);

          const graph2 = ForceGraphVR()
              .graphData(mirroredGraphData) // Use stored mirrored data
              .nodeAutoColorBy('id')
              .nodeLabel(node => node.id)
              .width(graphWidth)
              .height(graphHeight)
              .nodeThreeObject(node => {
                  const group = new THREE.Group();
                  const spriteMaterial = new THREE.SpriteMaterial({
                      map: new THREE.CanvasTexture(createTextCanvas(node.id)),
                      transparent: true
                  });
                  const sprite = new THREE.Sprite(spriteMaterial);
                  sprite.scale.set(50, 25, 1);
                  sprite.position.set(0, 15, 0);
                  sprite.raycast = () => {}; // Disable raycasting on text
                  group.add(sprite);
                  return group;
              })
              .nodeThreeObjectExtend(true)
              .linkColor(() => '#3da7c4')
              .linkOpacity(0.7)
              .linkWidth(2)
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
              .linkDirectionalParticleColor(() => 'orange');

          graph2(rightContainer);
          console.log("✅ Mirrored graph successfully created.");
      }, 3000); // Delay to ensure first graph fully loads

  } catch (error) {
      console.error(error.message);
  }
});

// Helper function to create a text canvas
function createTextCanvas(text) {
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 512;
  canvas.height = 256;

  context.fillStyle = 'rgba(255, 255, 255, 1)';
  const maxFontSize = 48;
  const minFontSize = 24;
  const fontSize = Math.max(
      minFontSize,
      maxFontSize - Math.floor((text.length - 10) * 1.5)
  );

  context.font = `${fontSize}px Arial`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas;
}

console.log("THREE.js Version:", THREE.REVISION);
console.log("AFRAME is available:", typeof AFRAME !== "undefined");
