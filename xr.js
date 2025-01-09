let xrSession = null;
let xrReferenceSpace = null;

// Start WebXR session
async function startXRSession() {
    if (!navigator.xr) {
        console.error("WebXR not supported");
        return;
    }

    try {
        xrSession = await navigator.xr.requestSession('immersive-vr');
        console.log("WebXR Session started");

        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl2', { xrCompatible: true });

        document.body.appendChild(canvas);

        // Make WebGL context XR compatible
        await gl.makeXRCompatible();
        xrSession.updateRenderState({ baseLayer: new XRWebGLLayer(xrSession, gl) });

        xrReferenceSpace = await xrSession.requestReferenceSpace('local');

        xrSession.requestAnimationFrame(onXRFrame);
    } catch (err) {
        console.error("Failed to start XR session:", err);
    }
}

// Render loop for WebXR
function onXRFrame(time, frame) {
    const session = frame.session;
    const pose = frame.getViewerPose(xrReferenceSpace);

    if (pose) {
        const glLayer = session.renderState.baseLayer;
        gl.bindFramebuffer(gl.FRAMEBUFFER, glLayer.framebuffer);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        for (const view of pose.views) {
            const viewport = glLayer.getViewport(view);
            gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

            drawScene(view.transform);
        }
    }
    xrSession.requestAnimationFrame(onXRFrame);
}

// Scene rendering (graph logic)
function drawScene(transform) {
    const camera = myGraph.__threeObj.camera;

    // Sync camera with XR view
    camera.position.set(
        transform.position.x,
        transform.position.y,
        transform.position.z
    );
    camera.quaternion.set(
        transform.orientation.x,
        transform.orientation.y,
        transform.orientation.z,
        transform.orientation.w
    );

    // Render the scene
    myGraph.__threeObj.renderer.render(myGraph.__threeObj.scene, camera);
}

// Start button to enter VR
const startButton = document.createElement('button');
startButton.textContent = "Enter VR";
startButton.style.position = 'absolute';
startButton.style.top = '10px';
startButton.style.left = '10px';
startButton.onclick = startXRSession;
document.body.appendChild(startButton);

// Initialize the 3D force graph
const myGraph = ForceGraphVR()
    .jsonUrl('https://gist.githubusercontent.com/jloughney/e7ab155e467471b0054f3b094671b448/raw/2b99aa7abcf5646ee9244ce39bf4eb2ecf7536ec/medical_data.json')
    .nodeAutoColorBy('id')
    .linkColor(() => 'white')
    .linkWidth(2);

myGraph(document.getElementById('3d-graph'));

// Attach Three.js objects to access them later
myGraph.__threeObj = {
    scene: myGraph._threeObj,
    renderer: new THREE.WebGLRenderer({ antialias: true }),
    camera: new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
};
