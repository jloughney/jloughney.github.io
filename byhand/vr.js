// Store Dark Mode State
let isDarkMode = true;
let textSprites = {}; // Store text labels for updating later

// Store Separate Text Sprites
let textSpritesLeft = {};
let textSpritesRight = {};

// Move the function to the top to prevent reference errors
function createTextCanvas(text, textColor = 'white') {
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

// Function to invert colors
function toggleColors() {
    isDarkMode = !isDarkMode; // Toggle mode

    // Set new colors
    const bgColor = isDarkMode ? '#09092e' : 'white';
    const nodeColor = isDarkMode ? 'white' : '#20208a';
    const textColor = isDarkMode ? 'white' : 'black';

    //  Force Safari to repaint the background
    document.body.style.backgroundColor = bgColor;
    document.body.offsetHeight; // **Force Reflow to Fix Safari Background Issue**

    graph1.backgroundColor(bgColor);
    graph2.backgroundColor(bgColor);

    //  Force graph colors to refresh
    graph1.nodeColor(() => nodeColor);
    graph2.nodeColor(() => nodeColor);

    //  Reapply date-based link colors (Fixes Old Cyan Links in Safari)
    graph1.linkColor(link => getLinkColor(link)).refresh();
    graph2.linkColor(link => getLinkColor(link)).refresh();

    //  FULLY RECREATE TEXT MATERIALS to FORCE Safari to Refresh
    Object.keys(textSpritesLeft).forEach(nodeId => {
        const sprite = textSpritesLeft[nodeId];
        if (sprite) {
            // **Force Safari to refresh texture**
            sprite.material.map.dispose();
            sprite.material = new THREE.SpriteMaterial({ // **Recreate Material**
                map: new THREE.CanvasTexture(createTextCanvas(nodeId, textColor)),
                transparent: true
            });
            sprite.material.needsUpdate = true;
            console.log(` Updated LEFT graph text color for node: ${nodeId}`);
        }
    });

    Object.keys(textSpritesRight).forEach(nodeId => {
        const sprite = textSpritesRight[nodeId];
        if (sprite) {
            // **Force Safari to refresh texture**
            sprite.material.map.dispose();
            sprite.material = new THREE.SpriteMaterial({ // **Recreate Material**
                map: new THREE.CanvasTexture(createTextCanvas(nodeId, textColor)),
                transparent: true
            });
            sprite.material.needsUpdate = true;
            console.log(` Updated RIGHT graph text color for node: ${nodeId}`);
        }
    });

    console.log(`Switched to ${isDarkMode ? 'Dark' : 'Light'} Mode`);
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
