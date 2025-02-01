const myGraph = ForceGraphVR()
    //testing json file for colors of links
    //.jsonUrl('https://gist.githubusercontent.com/jloughney/62eee2ad5748f8bcfb57f746f87bc748/raw/a11cc766faecc2622bdc1c5970eb71ed1bdaf89f/testing-colors.json')
    
    .jsonUrl('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/2b99aa7abcf5646ee9244ce39bf4eb2ecf7536ec/medical_data.json')
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
    .linkDirectionalParticleColor(() => 'orange')  // Particle color

    .linkColor(link => {
      if (!link.time) {
          console.warn('Missing time for link:', link);
          return 'gray'; // Default color for missing dates
      }
  
      // Parse the link time (assumes format "YYYY-MM-DD")
      const dateParts = link.time.split('-'); // Split into [YYYY, MM, DD]
      const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // Convert to Date object
  
      // Get today's date without time
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight
  
      // Calculate the difference in days
      const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
  
      console.log('Link Time:', link.time, 'Parsed Date:', date, 'Today:', today, 'Difference in Days:', diffDays);
  
      // Map the day difference to a color
      return getColorByDayDifference(diffDays);
  });
  

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
    // Helper function to map dates to colors
    //date is formatted as: YYYY-MM-DD
    function getColorByDayDifference(diffDays) {
      const colorScale = [
          'grey',        // 0-1 days (default color) 
          'green',     // 2-3 days
          'light blue',     // 4-5 days
          'blue',      // 6-7 days
          'violet',       // 8-9 days
          'yellow',     // 10-11 days
          'orange',     // 12-13 days
          'red'        // Beyond 14 days (default)
      ];
  
      const index = Math.min(Math.floor(Math.abs(diffDays) / 2), colorScale.length - 1);
      return colorScale[index];
  }

  document.querySelector("#vrButton").addEventListener("click", function() {
    let scene = document.querySelector("a-scene");
    if (scene.enterVR) {
      scene.enterVR();
    } else {
      alert("VR mode not supported on this browser.");
    }
  });
  
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



  
  