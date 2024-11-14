const graphData = {
  nodes: [
    { id: 'node1', link: 'https://google.com' },
    { id: 'node2', link: 'https://google.com' },
    { id: 'node3', link: 'https://google.com' }
  ],
  links: [
    { source: 'node1', target: 'node2' },
    { source: 'node2', target: 'node3' }
  ]
};
const labelDistanceThreshold = 100;

// Initialize the 3D force graph
const myGraph = ForceGraph3D()
  .jsonUrl('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/b420146e48b0a39aaf8643b951fa39ab210b878e/medical_data.json')
  .nodeAutoColorBy('id') // Color nodes based on their ID
  .nodeLabel(node => node.id)
  .nodeRelSize(5) //defualt is 4

  // Use a custom 3D object for the node label
  .nodeThreeObject(node => {
    const textSprite = new SpriteText(node.id);  // Create text label
    textSprite.color = 'white';  // Set label color
    textSprite.textHeight = 6;  // Set label size (adjust as needed)
    textSprite.position.y = 13; //offset above the node
    return textSprite;
  })

  .nodeThreeObjectExtend(true)


  // Open link on left-click
  .onNodeClick(node => {
    if (node.link) {
      window.open(node.link, '_blank');  // Open link in a new tab
    }
  })

  // Open link on right-click (suppress the default context menu)
  .onNodeRightClick((node, event) => {
    event.preventDefault();  // Prevent the default right-click menu
    if (node.link) {
      window.open(node.link, '_blank');  // Open link in a new tab
    }
  })

  // Style the links (edges)
  .linkColor(() => 'blue')  // Set the color of links to blue (change as desired)
  .linkWidth(2)

  //node color and size
  .nodeColor(() => 'white')
  .nodeOpacity(0.5)

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