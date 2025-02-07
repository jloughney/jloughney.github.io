let isDarkMode = true; // Track the current color mode
let textColor = "white"

const textSprites = {}; // Store references to text sprites

const myGraph = ForceGraphVR()
    .jsonUrl('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/2b99aa7abcf5646ee9244ce39bf4eb2ecf7536ec/medical_data.json')
    .nodeAutoColorBy('id')
    .nodeLabel(node => node.id)

    // Define a 3D text object for each node
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

      // Store reference in our dictionary
      textSprites[node.id] = sprite;

      return sprite;
      })
    .nodeThreeObjectExtend(true)

    // Style the links (edges)
    .linkWidth(2)
    .linkCurvature(link => link.source === link.target ? 1 : 0.1)

    // Node color and size
    .nodeColor(() => 'white')
    .nodeOpacity(0.7)
    .linkOpacity(0.6) //how much we want them to pop

    // Open link on left-click
    .onNodeClick(node => {
        if (node.link) {
            window.open(node.link, '_blank');
        }
    })

    // Add directional arrows to indicate edge direction
    .linkDirectionalArrowLength(5)
    .linkDirectionalArrowColor(() => 'white')
    .linkDirectionalArrowRelPos(0.99)
    .linkDirectionalArrowResolution(8)

    // Optional: Add particles to visualize the direction along the links
    .linkDirectionalParticles(2)
    .linkDirectionalParticleSpeed(0.01)
    .linkDirectionalParticleColor(() => 'orange')

    // Restore Date-Based Link Coloring
    .linkColor(link => {
        if (!link.time) {
            console.warn('Missing time for link:', link);
            return isDarkMode ? 'gray' : 'black'; // Adjust based on mode
        }
    
        // Parse the link time (assumes format "YYYY-MM-DD")
        const dateParts = link.time.split('-');
        const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
    
        // Calculate the difference in days
        const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
    
        return getColorByDayDifference(diffDays);
    });

myGraph(document.getElementById('3d-graph'));


// Force Initial Text Rendering After Graph Loads
setTimeout(() => {
  console.log("Forcing initial text render...");
  Object.keys(textSprites).forEach(nodeId => {
      const sprite = textSprites[nodeId];
      if (sprite) {
          sprite.material.map = new THREE.CanvasTexture(createTextCanvas(nodeId, isDarkMode ? 'white' : 'black'));
          sprite.material.needsUpdate = true;
      }
  });
}, 300);  // Small delay to ensure graph is ready

// Function to invert colors
function toggleColors() {
    isDarkMode = !isDarkMode; // Toggle mode

    // Set new colors
    const bgColor = isDarkMode ? '#09092e' : 'white';
    const nodeColor = isDarkMode ? 'white' : '#20208a';
    const textColor = isDarkMode ? 'white' : 'black';

    // Update background
    myGraph.backgroundColor(bgColor);

    // Update graph colors
    myGraph.nodeColor(() => nodeColor);

    // Reapply date-based link colors
    myGraph.linkColor(link => {
        if (!link.time) {
            return isDarkMode ? 'gray' : 'black';
        }
        const dateParts = link.time.split('-');
        const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));
        return getColorByDayDifference(diffDays);
    });

    // Update text labels dynamically using stored references
    Object.keys(textSprites).forEach(nodeId => {
      const sprite = textSprites[nodeId];
      if (sprite) {
          sprite.material.map = new THREE.CanvasTexture(createTextCanvas(nodeId, textColor));
          sprite.material.needsUpdate = true;
          console.log(`Updated text color for node: ${nodeId}`);
      }
    });
  

    console.log(`Switched to ${isDarkMode ? 'Dark' : 'Light'} Mode`);
}

// Update text function to accept color
function createTextCanvas(text, textColor) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    //checks for color
    console.log(textColor);

    context.fillStyle = textColor;
    const maxFontSize = 54;
    const minFontSize = 32;
    const fontSize = Math.max(
        minFontSize,
        maxFontSize - Math.floor((text.length - 10) * 1.5)
    );

    context.font = `${fontSize}px "Arial"`; // Change font
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    return canvas;
}

// Restore function for date-based color mapping
function getColorByDayDifference(diffDays) {
    const colorScale = [
        'grey',  // 0-1 days
        'green', // 2-3 days
        'lightblue', // 4-5 days
        'blue', // 6-7 days
        'red', // 8-9 days
        'yellow', // 10-11 days
        'orange', // 12-13 days
        'violet' // Beyond 14 days
    ];

    const index = Math.min(Math.floor(Math.abs(diffDays) / 2), colorScale.length - 1);
    return colorScale[index];
}

// Event Listener for Key Press ('I' to invert colors)
document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === "i") {
        toggleColors();
    }
});

// Event Listener for Mobile Button Click
document.querySelector("#toggleColorButton").addEventListener("click", function() {
    toggleColors();
});

// VR Button Event Listener
document.querySelector("#vrButton").addEventListener("click", function() {
    let scene = document.querySelector("a-scene");
    if (scene.enterVR) {
        scene.enterVR();
    } else {
        alert("VR mode not supported on this browser.");
    }
});
