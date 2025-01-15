import * as THREE from 'three';
import { StereoEffect } from 'three/addons/effects/StereoEffect.js';

// Create container
const container = document.createElement('div');
document.body.appendChild(container);

// Ensure the container fills the screen
container.style.width = '100vw';
container.style.height = '100vh';
container.style.margin = '0';
container.style.padding = '0';
container.style.overflow = 'hidden';

// Create a camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create the scene
const scene = new THREE.Scene();

// Add lights
const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(1, 1, 1).normalize();
scene.add(light);

const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

// Add your 3D ForceGraphVR
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
    .linkDirectionalParticleColor(() => 'orange')
    .backgroundColor('#000');

// Add the graph to the scene
scene.add(myGraph.scene());

// Create renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
container.appendChild(renderer.domElement);

// Create StereoEffect
const effect = new StereoEffect(renderer);
effect.setSize(window.innerWidth, window.innerHeight);

// Full-Screen Functionality
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}
document.addEventListener('dblclick', toggleFullScreen);

// Handle resizing
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    effect.setSize(window.innerWidth, window.innerHeight);
});

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    effect.render(scene, camera);
}
animate();

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
