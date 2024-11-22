const myGraph = ForceGraphVR()
    .jsonUrl('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/bb31fd8d9fa1e5b7d62677036493f24a22ef0235/medical_data.json')
    .nodeAutoColorBy('id') // Color nodes based on their ID
    .nodeLabel(node => node.id)

    // Define a 3D text object for each node
    .nodeThreeObject(node => {
        // Create a text label using THREE.Sprite
        const spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(createTextCanvas(node.id)),
        transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(50, 25, 1); // Larger scale for better readability
        sprite.position.set(0, 15, 0); // Adjust position above the node

        // Disable raycasting for this sprite
        sprite.raycast = () => {}; // Prevent the sprite from being raycasted
        sprite.frustumCulled = false; // Ensure it’s always rendered, even outside the frustum

        // Store a reference for visibility control
        node.__textSprite = sprite;

        return sprite; // Return the text object
    })
    .nodeThreeObjectExtend(true) // Extend the default node object with custom additions

    // Style the links (edges)
    .linkColor(() => 'white')  // Set the color of links to blue (change as desired)
    .linkWidth(2)
    // link curvature so double edged visability
    .linkCurvature(link => {
      // Example: Curvature based on link properties
      if (link.source === link.target) {
        return 1; // Loop for self-referencing links
      }
      return 0.1; // Curvature for other links
    })

    //node color and size
    .nodeColor(() => 'white')
    .nodeOpacity(0.7)

    // Open link on left-click
    .onNodeClick(node => {
      if (node.link) {
        window.open(node.link, '_blank');  // Open link in a new tab
      }
    })


    // Add directional arrows to indicate edge direction
    .linkDirectionalArrowLength(5)  // Set the length of the arrow head
    .linkDirectionalArrowColor(() => 'white')  // Set arrow color (e.g., red)
    .linkDirectionalArrowRelPos(0.99)  // Position the arrow in the middle of the link
    .linkDirectionalArrowResolution(8)  // Set the resolution of the arrow head

    // Optional: Add particles to visualize the direction along the links
    .linkDirectionalParticles(2)  // Number of particles to display along the link
    .linkDirectionalParticleSpeed(0.01)  // Speed of particles
    .linkDirectionalParticleColor(() => 'orange');  // Particle color

    // Attach the graph to the DOM element
    myGraph(document.getElementById('3d-graph'));

    // Helper function to create a text canvas
    function createTextCanvas(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512; // Larger canvas for better resolution
        canvas.height = 256;

        context.fillStyle = 'rgba(255, 255, 255, 1)';
        const maxFontSize = 48; // Default maximum font size
        const minFontSize = 24; // Minimum font size for very long text
        const fontSize = Math.max(
            minFontSize,
            maxFontSize - Math.floor((text.length - 10) * 1.5) // Linear scaling
          );

        context.font = `${fontSize}px Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.clearRect(0, 0, canvas.width, canvas.height); // Clear canvas
        context.fillText(text, canvas.width / 2, canvas.height / 2);
      
        return canvas;
      }
//for lag
myGraph.onEngineTick(() => {
    // Access the A-Frame camera
    const camera = document.querySelector('[camera]').object3D; // A-Frame camera object
    if (!camera) return; // Ensure the camera exists
  
    const cameraZ = camera.position.z; // Get the camera's current Z position
  
    // Iterate through the nodes to adjust visibility of text labels
    myGraph.graphData().nodes.forEach(node => {
      const nodeZ = node.z || 0; // Default Z position for the node
      const distanceZ = Math.abs(cameraZ - nodeZ);
  
      if (node.__textSprite) {
        node.__textSprite.visible = distanceZ < 200; // Show text if within threshold
      }
    });
  });
  
  