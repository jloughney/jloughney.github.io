// Updated vr.js with manual StereoCamera implementation
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl2');  // Use WebGL2 for multiview support
console.log(gl.getSupportedExtensions());

if (navigator.xr) {
  console.log("WebXR supported!");
} else {
  console.log("WebXR not supported.");
}

if (!gl) {
    console.error('WebGL2 is not supported by your browser');
} else {
    // Try to get the OVR_multiview2 or WEBGL_multiview extension
    const multiview = gl.getExtension('OVR_multiview2') || gl.getExtension('WEBGL_multiview');
    if (multiview) {
        console.log('Multiview extension enabled:', multiview);

        // Set up the framebuffer for multiview rendering
        const framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

        const texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D_ARRAY, texture);
        gl.texStorage3D(gl.TEXTURE_2D_ARRAY, 1, gl.RGBA8, gl.canvas.width, gl.canvas.height, 2);
        gl.framebufferTextureLayer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, texture, 0, 0);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
        console.warn('OVR_multiview2 or WEBGL_multiview extension not available. Falling back to standard rendering.');
    }
}

// Create a WebGLRenderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a PerspectiveCamera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a StereoCamera
const stereoCamera = new THREE.StereoCamera();
stereoCamera.aspect = 0.5; // Each eye gets half the screen

// Create the Scene
const scene = new THREE.Scene();

// Add lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);
// Create a container for the ForceGraphVR
const container = document.getElementById('3d-graph');

// Initialize ForceGraphVR
const myGraph = ForceGraphVR()
    .jsonUrl('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/2b99aa7abcf5646ee9244ce39bf4eb2ecf7536ec/medical_data.json')
    .nodeAutoColorBy('id')
    .nodeLabel(node => node.id)
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
    .nodeThreeObjectExtend(true)
    .linkColor(() => 'white')
    .linkWidth(2)
    .linkDirectionalArrowLength(5)
    .linkDirectionalArrowColor(() => 'white')
    .linkDirectionalArrowRelPos(0.99)
    .linkDirectionalArrowResolution(8)
    .linkDirectionalParticles(2)
    .linkDirectionalParticleSpeed(0.01)
    .linkDirectionalParticleColor(() => 'orange');

// Attach the graph to the container
myGraph(container);

// Add Full-Screen Mode
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}
document.addEventListener('dblclick', toggleFullScreen);

// Animation Loop
function animate() {
    requestAnimationFrame(animate);

    // Update the stereo camera
    stereoCamera.update(camera);

    // Render left eye
    renderer.setViewport(0, 0, window.innerWidth / 2, window.innerHeight);
    renderer.render(scene, stereoCamera.cameraL);

    // Render right eye
    renderer.setViewport(window.innerWidth / 2, 0, window.innerWidth / 2, window.innerHeight);
    renderer.render(scene, stereoCamera.cameraR);
}
animate();

// Handle Window Resizing
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

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