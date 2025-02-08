let scene, camera, renderer;
let vertices = [], lines = [], polygons = [], copiedPolygons = [];
let movingPolygon = null, isCopying = false;

init();

function init() {
    scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-5, 5, 5, -5, 0.1, 10);
    camera.position.set(0, 0, 5);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    createBaseScene();

    window.addEventListener('click', onMouseClick);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('contextmenu', onRightClick);
    
    document.getElementById('complete').addEventListener('click', completePolygon);
    document.getElementById('copy').addEventListener('click', copyPolygon);
    document.getElementById('reset').addEventListener('click', resetScene);

    animate();
}

// Creates the white plane and grid
function createBaseScene() {
    scene.children = []; // Clears all objects

    const plane = new THREE.Mesh(
        new THREE.PlaneGeometry(10, 10),
        new THREE.MeshBasicMaterial({ color: 0xffffff })
    );
    scene.add(plane);

    const grid = new THREE.GridHelper(10, 20, 0x000000, 0xaaaaaa);
    grid.rotation.x = Math.PI / 2;
    scene.add(grid);
}

// Handles clicks to add vertices
function onMouseClick(event) {
    if (isCopying || movingPolygon || event.target.tagName === 'BUTTON') return; // Prevent clicks on UI

    let mouse = getMousePosition(event);
    vertices.push(mouse);

    if (vertices.length > 1) drawLine(vertices[vertices.length - 2], vertices[vertices.length - 1]);
}

// Draws a line between two points
function drawLine(start, end) {
    const line = new THREE.Line(
        new THREE.BufferGeometry().setFromPoints([start, end]),
        new THREE.LineBasicMaterial({ color: 0x00ff00 })
    );
    scene.add(line);
    lines.push(line);
}

// Completes the polygon and fills with color
function completePolygon() {
    if (vertices.length < 3) return;

    const shape = new THREE.Shape();
    vertices.forEach((v, i) => i === 0 ? shape.moveTo(v.x, v.y) : shape.lineTo(v.x, v.y));
    shape.lineTo(vertices[0].x, vertices[0].y);

    const polygon = new THREE.Mesh(
        new THREE.ShapeGeometry(shape),
        new THREE.MeshBasicMaterial({ color: Math.random() * 0xffffff, side: THREE.DoubleSide })
    );
    scene.add(polygon);
    polygons.push(polygon);

    clearLines();
}

// Copies the last polygon and assigns a new random color
function copyPolygon() {
    if (polygons.length === 0 || movingPolygon) return;

    const lastPolygon = polygons[polygons.length - 1];
    movingPolygon = lastPolygon.clone();
    movingPolygon.material = movingPolygon.material.clone();
    movingPolygon.material.color.setHex(Math.random() * 0xffffff);
    
    scene.add(movingPolygon);
    copiedPolygons.push(movingPolygon);
    isCopying = true;
}

// Moves the copied polygon with the cursor
function onMouseMove(event) {
    if (!isCopying || !movingPolygon) return;
    let mouse = getMousePosition(event);
    movingPolygon.position.set(mouse.x, mouse.y, 0);
}

// Places copied polygon on right-click
function onRightClick(event) {
    event.preventDefault();
    if (movingPolygon) {
        movingPolygon = null;
        isCopying = false;
    }
}

// Clears the scene and resets everything
function resetScene() {
    [...polygons, ...copiedPolygons].forEach(disposeObject);
    polygons = [];
    copiedPolygons = [];
    
    clearLines();
    vertices = [];
    movingPolygon = null;
    isCopying = false;

    createBaseScene(); // Re-add the white plane and grid
}

// Disposes of objects properly
function disposeObject(obj) {
    scene.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
}

// Clears all drawn lines
function clearLines() {
    lines.forEach(disposeObject);
    lines = [];
}

// Converts mouse coordinates to Three.js world coordinates
function getMousePosition(event) {
    let mouse = new THREE.Vector2(
        (event.clientX / window.innerWidth) * 2 - 1,
        -(event.clientY / window.innerHeight) * 2 + 1
    );
    return new THREE.Vector3(mouse.x * 5, mouse.y * 5, 0);
}

// Continuously renders the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
