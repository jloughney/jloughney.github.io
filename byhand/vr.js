// Store Dark Mode State
let isDarkMode = true;
let textSprites = {}; // Store text labels for updating later

// Store Separate Text Sprites
let textSpritesLeft = {};
let textSpritesRight = {};



// Move the function to the top to prevent reference errors
function createTextCanvas(text, textColor = isDarkMode ? 'white' : 'black') {
    console.log(`🖌️ Creating text for: "${text}" with color: ${textColor}`);
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 512;
    canvas.height = 256;

    context.fillStyle = textColor;
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

function updateTextLabels(textSprites, textColor) {
    console.log(` Updating text labels with color: ${textColor}`);

    Object.keys(textSprites).forEach(nodeId => {
        const sprite = textSprites[nodeId];
        if (sprite) {
            //  Debug: Log node update attempt
            console.log(`🎯 Updating text for node: ${nodeId} to ${textColor}`);

            //  Remove old texture
            if (sprite.material.map) sprite.material.map.dispose();

            //  Debug: Log before creating new text
            console.log(`🖌 Calling createTextCanvas(${nodeId}, ${textColor})`);

            //  Apply new texture
            const newTexture = new THREE.CanvasTexture(createTextCanvas(nodeId, textColor));

            sprite.material.map = newTexture;
            sprite.material.needsUpdate = true;

            //  Debug: Confirm texture update applied
            console.log(` Successfully updated text label for node: ${nodeId}`);
        }
    });
}



// Function to invert colors
function toggleColors() {
    isDarkMode = !isDarkMode; // Toggle mode

    // Debug: Check if dark mode is toggled correctly
    console.log(` Switching to ${isDarkMode ? 'Dark' : 'Light'} Mode`);
    
    const textColor = isDarkMode ? 'white' : 'black';
    console.log(` Text color should be: ${textColor}`);

    // Force background update
    document.body.style.backgroundColor = isDarkMode ? '#09092e' : 'white';
    document.body.offsetHeight; // Force reflow

    graph1.backgroundColor(isDarkMode ? '#09092e' : 'white');
    graph2.backgroundColor(isDarkMode ? '#09092e' : 'white');

    //  Force node color updates
    graph1.nodeColor(() => isDarkMode ? 'white' : '#20208a');
    graph2.nodeColor(() => isDarkMode ? 'white' : '#20208a');

    // Debug: Check if function is actually passing correct color
    console.log(" Calling updateTextLabels() with textColor:", textColor);

    //  Apply fix to both left and right graphs
    updateTextLabels(textSpritesLeft, textColor);
    updateTextLabels(textSpritesRight, textColor);
}







// Function to determine link color based on date
function getLinkColor(link) {
    if (!link.time) {
        return isDarkMode ? 'gray' : 'black';
    }

    const dateParts = link.time.split('-');
    const date = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((date - today) / (1000 * 60 * 60 * 24));

    return getColorByDayDifference(diffDays);
}

// Date-based color mapping function
function getColorByDayDifference(diffDays) {
    const colorScale = [
        'grey', 'green', 'lightblue', 'blue', 'red', 'yellow', 'orange', 'violet'
    ];
    const index = Math.min(Math.floor(Math.abs(diffDays) / 2), colorScale.length - 1);
    return colorScale[index];
}

// Event Listener for 'I' Key Press to Toggle Colors
document.addEventListener("keydown", function(event) {
    if (event.key.toLowerCase() === "i") {
        toggleColors();
    }
});

// Event Listener for Button Click to Toggle Colors
document.querySelector("#toggleColorButton").addEventListener("click", toggleColors);

// Initialize Graphs
document.addEventListener("DOMContentLoaded", async () => {
    const leftContainer = document.getElementById('graph-left');
    const rightContainer = document.getElementById('graph-right');

    if (!leftContainer || !rightContainer) {
        console.error("Graph containers not found.");
        return;
    }

    let storedGraphData = { nodes: [], links: [] };

    try {
        console.log("Fetching graph data...");
        const response = await fetch('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/2b99aa7abcf5646ee9244ce39bf4eb2ecf7536ec/medical_data.json');
        storedGraphData = await response.json();

        if (!storedGraphData.nodes || storedGraphData.nodes.length === 0) {
            throw new Error("Fetched graph data is empty.");
        }

        console.log("Graph data successfully fetched and stored:", storedGraphData);

        const graphWidth = leftContainer.clientWidth;
        const graphHeight = leftContainer.clientHeight;

        // Initialize Graph 1 (Left Eye)
        window.graph1 = ForceGraphVR()
            .graphData(storedGraphData)
            .nodeAutoColorBy('id')
            .nodeLabel(node => node.id)
            .width(graphWidth)
            .height(graphHeight)
            .nodeThreeObject(node => {
                const group = new THREE.Group();
                const spriteMaterial = new THREE.SpriteMaterial({
                    map: new THREE.CanvasTexture(createTextCanvas(node.id, 'white')),
                    transparent: true
                });
        
                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.scale.set(50, 25, 1);
                sprite.position.set(0, 15, 0);
                sprite.raycast = () => {};
                group.add(sprite);
        
                textSpritesLeft[node.id] = sprite; // Store in Left Graph Storage
                return group;
            })
            .nodeThreeObjectExtend(true)
            .linkColor(link => getLinkColor(link))
            .linkOpacity(0.7)
            .linkWidth(2)
            .nodeColor(() => 'white')
            .nodeOpacity(0.7)
            .onNodeClick(node => {
                if (node.link) window.open(node.link, '_blank');
            });

        graph1(leftContainer);


        // Lock Left Graph Nodes Before Creating Right Graph
        setTimeout(() => {
            storedGraphData.nodes.forEach(node => {
                node.fx = node.x;
                node.fy = node.y;
                node.fz = node.z;
            });

            console.log("Node positions locked for left graph:", storedGraphData);

            // Create Mirrored Graph (Right Eye)
            const mirroredNodes = storedGraphData.nodes.map(node => ({
                ...node,
                x: node.x,
                y: node.y,
                z: node.z,
                fx: node.x,
                fy: node.y,
                fz: node.z
            }));

            const mirroredGraphData = {
                nodes: mirroredNodes,
                links: storedGraphData.links.map(link => ({ ...link }))
            };

            console.log("Mirrored Graph Data Prepared:", mirroredGraphData);

            window.graph2 = ForceGraphVR()
                .graphData(mirroredGraphData)
                .nodeAutoColorBy('id')
                .nodeLabel(node => node.id)
                .width(graphWidth)
                .height(graphHeight)
                .nodeThreeObject(node => {
                    const group = new THREE.Group();
                    const spriteMaterial = new THREE.SpriteMaterial({
                        map: new THREE.CanvasTexture(createTextCanvas(node.id, 'white')),
                        transparent: true
                    });
            
                    const sprite = new THREE.Sprite(spriteMaterial);
                    sprite.scale.set(50, 25, 1);
                    sprite.position.set(0, 15, 0);
                    sprite.raycast = () => {};
                    group.add(sprite);
            
                    textSpritesRight[node.id] = sprite; // Store in Right Graph Storage
                    return group;
                })
                .nodeThreeObjectExtend(true)
                .linkColor(link => getLinkColor(link))
                .linkOpacity(0.7)
                .linkWidth(2)
                .nodeColor(() => 'white')
                .nodeOpacity(0.7)
                .onNodeClick(node => {
                    if (node.link) window.open(node.link, '_blank');
                });

            graph2(rightContainer);

            console.log("Mirrored graph successfully created.");
        }, 3000);

    } catch (error) {
        console.error(error.message);
    }
});
