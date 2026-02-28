// ===== ALOEFLEX 3D VIEWER - Detailed Knee Brace =====

let scene, camera, renderer, brace, autoRotate = true, wireframeMode = false;
const explodeParts = [];

function initViewer() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    scene = new THREE.Scene();
    scene.background = null;

    camera = new THREE.PerspectiveCamera(45, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0.5, 5.5);

    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    // Lighting
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xeef6ff, 1.4);
    keyLight.position.set(4, 6, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x88ccaa, 0.5);
    fillLight.position.set(-4, 2, -3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00c8d4, 0.6);
    rimLight.position.set(0, -2, -4);
    scene.add(rimLight);

    const topLight = new THREE.DirectionalLight(0xffffff, 0.3);
    topLight.position.set(0, 8, 0);
    scene.add(topLight);

    // Build model
    buildKneeBrace();
    addParticles();
    initMouseControls(canvas);
    window.addEventListener('resize', onResize);

    setTimeout(() => {
        const loading = document.getElementById('canvas-loading');
        if (loading) loading.classList.add('hidden');
    }, 600);

    animate();
}

function buildKneeBrace() {
    brace = new THREE.Group();

    // --- MATERIALS ---
    const neopreneMain = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a, roughness: 0.85, metalness: 0.05,
        bumpScale: 0.002
    });
    const neopreneInner = new THREE.MeshStandardMaterial({
        color: 0x222222, roughness: 0.9, metalness: 0.02
    });
    const silverMetal = new THREE.MeshStandardMaterial({
        color: 0x9ca3af, roughness: 0.25, metalness: 0.85
    });
    const strapMat = new THREE.MeshStandardMaterial({
        color: 0x111111, roughness: 0.75, metalness: 0.05
    });
    const logoGreen = new THREE.MeshStandardMaterial({
        color: 0x2ebd52, roughness: 0.4, metalness: 0.1,
        emissive: 0x1a8c3a, emissiveIntensity: 0.3
    });
    const padMat = new THREE.MeshStandardMaterial({
        color: 0x151515, roughness: 0.95, metalness: 0.0
    });
    const hingePlastic = new THREE.MeshStandardMaterial({
        color: 0x888888, roughness: 0.35, metalness: 0.7
    });
    const aloeFabric = new THREE.MeshStandardMaterial({
        color: 0x0a3020, roughness: 0.8, metalness: 0.0,
        emissive: 0x00c8d4, emissiveIntensity: 0.02
    });
    const velcroMat = new THREE.MeshStandardMaterial({
        color: 0x0d0d0d, roughness: 0.95, metalness: 0.0
    });

    // --- MAIN BODY: Cylindrical wrap (open back) ---
    // Upper section
    const upperShell = new THREE.CylinderGeometry(1.05, 1.0, 1.2, 48, 4, true, 0.4, Math.PI * 1.2);
    const upperMesh = new THREE.Mesh(upperShell, neopreneMain);
    upperMesh.position.y = 0.7;
    upperMesh.castShadow = true;
    brace.add(upperMesh);
    explodeParts.push({ mesh: upperMesh, origY: 0.7, explodeY: 1.6 });

    // Lower section
    const lowerShell = new THREE.CylinderGeometry(1.0, 0.92, 1.2, 48, 4, true, 0.4, Math.PI * 1.2);
    const lowerMesh = new THREE.Mesh(lowerShell, neopreneMain);
    lowerMesh.position.y = -0.5;
    lowerMesh.castShadow = true;
    brace.add(lowerMesh);
    explodeParts.push({ mesh: lowerMesh, origY: -0.5, explodeY: -1.4 });

    // Inner lining (slightly smaller, visible at edges)
    const innerUpper = new THREE.CylinderGeometry(1.0, 0.95, 1.18, 48, 2, true, 0.42, Math.PI * 1.16);
    const innerUpperMesh = new THREE.Mesh(innerUpper, aloeFabric);
    innerUpperMesh.position.y = 0.7;
    brace.add(innerUpperMesh);
    explodeParts.push({ mesh: innerUpperMesh, origY: 0.7, explodeY: 1.8 });

    const innerLower = new THREE.CylinderGeometry(0.95, 0.87, 1.18, 48, 2, true, 0.42, Math.PI * 1.16);
    const innerLowerMesh = new THREE.Mesh(innerLower, aloeFabric);
    innerLowerMesh.position.y = -0.5;
    brace.add(innerLowerMesh);
    explodeParts.push({ mesh: innerLowerMesh, origY: -0.5, explodeY: -1.6 });

    // --- KNEECAP AREA ---
    // Oval pad in front center
    const kneecapPad = new THREE.CylinderGeometry(0.42, 0.42, 0.06, 32);
    const kneecapMesh = new THREE.Mesh(kneecapPad, padMat);
    kneecapMesh.position.set(0, 0.35, 1.0);
    kneecapMesh.rotation.x = Math.PI / 2;
    kneecapMesh.scale.set(1, 1, 1.3);
    brace.add(kneecapMesh);
    explodeParts.push({ mesh: kneecapMesh, origY: 0.35, explodeY: 0.35, explodeZ: 1.5 });

    // Kneecap ring (raised border around pad)
    const kneecapRing = new THREE.TorusGeometry(0.44, 0.04, 12, 48);
    const kneecapRingMesh = new THREE.Mesh(kneecapRing, neopreneMain);
    kneecapRingMesh.position.set(0, 0.35, 0.98);
    kneecapRingMesh.rotation.x = Math.PI / 2;
    kneecapRingMesh.scale.set(1, 1, 1.3);
    brace.add(kneecapRingMesh);

    // --- SIDE HINGES (Silver stabilizers) ---
    [-1, 1].forEach(side => {
        // Main hinge plate (tall, narrow)
        const hingeGeo = new THREE.BoxGeometry(0.12, 2.0, 0.22);
        const hingeMesh = new THREE.Mesh(hingeGeo, silverMetal);
        hingeMesh.position.set(side * 1.02, 0.1, 0.15);
        hingeMesh.rotation.y = side * 0.15;
        hingeMesh.castShadow = true;
        brace.add(hingeMesh);
        explodeParts.push({ mesh: hingeMesh, origX: side * 1.02, explodeX: side * 1.7 });

        // Hinge pivot circle (center joint)
        const pivotGeo = new THREE.CylinderGeometry(0.1, 0.1, 0.14, 16);
        const pivotMesh = new THREE.Mesh(pivotGeo, hingePlastic);
        pivotMesh.position.set(side * 1.05, 0.1, 0.15);
        pivotMesh.rotation.x = Math.PI / 2;
        brace.add(pivotMesh);
        explodeParts.push({ mesh: pivotMesh, origX: side * 1.05, explodeX: side * 1.75 });

        // Top hinge cap
        const capGeoT = new THREE.BoxGeometry(0.16, 0.15, 0.26);
        const capMeshT = new THREE.Mesh(capGeoT, silverMetal);
        capMeshT.position.set(side * 1.02, 1.05, 0.15);
        capMeshT.rotation.y = side * 0.15;
        brace.add(capMeshT);

        // Bottom hinge cap
        const capGeoB = new THREE.BoxGeometry(0.16, 0.15, 0.26);
        const capMeshB = new THREE.Mesh(capGeoB, silverMetal);
        capMeshB.position.set(side * 1.0, -0.85, 0.15);
        capMeshB.rotation.y = side * 0.15;
        brace.add(capMeshB);

        // Edge trim along hinge
        const trimGeo = new THREE.BoxGeometry(0.04, 1.8, 0.15);
        const trimMesh = new THREE.Mesh(trimGeo, new THREE.MeshStandardMaterial({
            color: 0x555555, roughness: 0.4, metalness: 0.6
        }));
        trimMesh.position.set(side * 0.94, 0.1, 0.22);
        trimMesh.rotation.y = side * 0.15;
        brace.add(trimMesh);
    });

    // --- STRAPS (3 horizontal bands) ---
    const strapPositions = [
        { y: 1.15, r: 1.07, label: 'top' },
        { y: -0.15, r: 1.02, label: 'mid' },
        { y: -0.95, r: 0.94, label: 'bottom' }
    ];

    strapPositions.forEach((sp, idx) => {
        // Strap band (wraps around)
        const bandGeo = new THREE.CylinderGeometry(sp.r + 0.02, sp.r + 0.02, 0.14, 48, 1, true, 0.2, Math.PI * 1.6);
        const bandMesh = new THREE.Mesh(bandGeo, strapMat);
        bandMesh.position.y = sp.y;
        brace.add(bandMesh);
        explodeParts.push({ mesh: bandMesh, origY: sp.y, explodeY: sp.y + (idx === 0 ? 0.5 : idx === 2 ? -0.5 : 0) });

        // Velcro patch (on strap end at back)
        const velcroGeo = new THREE.BoxGeometry(0.3, 0.12, 0.02);
        const velcroMesh = new THREE.Mesh(velcroGeo, velcroMat);
        velcroMesh.position.set(0, sp.y, -(sp.r + 0.01));
        brace.add(velcroMesh);

        // Buckle (small silver rectangle)
        const buckleGeo = new THREE.BoxGeometry(0.2, 0.16, 0.06);
        const buckleMesh = new THREE.Mesh(buckleGeo, silverMetal);
        const angle = -0.3;
        buckleMesh.position.set(
            Math.sin(angle) * (sp.r + 0.04),
            sp.y,
            -Math.cos(angle) * (sp.r + 0.04)
        );
        brace.add(buckleMesh);
    });

    // --- LOGO (AloeFlex text area - green rectangle on front-upper) ---
    const logoBase = new THREE.PlaneGeometry(0.5, 0.15);
    const logoMesh = new THREE.Mesh(logoBase, logoGreen);
    logoMesh.position.set(0, 0.85, 1.03);
    brace.add(logoMesh);

    // Aloe leaf shape (simple triangle above logo)
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0);
    leafShape.quadraticCurveTo(0.06, 0.12, 0, 0.2);
    leafShape.quadraticCurveTo(-0.06, 0.12, 0, 0);
    const leafGeo = new THREE.ShapeGeometry(leafShape);
    const leafMesh = new THREE.Mesh(leafGeo, logoGreen);
    leafMesh.position.set(0, 0.92, 1.04);
    brace.add(leafMesh);

    // Second leaf angled
    const leaf2 = new THREE.Mesh(leafGeo, logoGreen);
    leaf2.position.set(0.06, 0.92, 1.04);
    leaf2.rotation.z = -0.3;
    brace.add(leaf2);

    const leaf3 = new THREE.Mesh(leafGeo, logoGreen);
    leaf3.position.set(-0.06, 0.92, 1.04);
    leaf3.rotation.z = 0.3;
    brace.add(leaf3);

    // --- TOP AND BOTTOM EDGE TRIM ---
    const topEdge = new THREE.TorusGeometry(1.05, 0.025, 8, 48, Math.PI * 1.2);
    const topEdgeMesh = new THREE.Mesh(topEdge, neopreneInner);
    topEdgeMesh.position.y = 1.3;
    topEdgeMesh.rotation.set(Math.PI / 2, 0, 0.4 + Math.PI * 0.6);
    brace.add(topEdgeMesh);

    const botEdge = new THREE.TorusGeometry(0.92, 0.025, 8, 48, Math.PI * 1.2);
    const botEdgeMesh = new THREE.Mesh(botEdge, neopreneInner);
    botEdgeMesh.position.y = -1.1;
    botEdgeMesh.rotation.set(Math.PI / 2, 0, 0.4 + Math.PI * 0.6);
    brace.add(botEdgeMesh);

    // --- STITCHING LINES (subtle raised lines on surface) ---
    const stitchMat = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a, roughness: 0.9, metalness: 0.0
    });

    // Vertical stitch lines on front
    [-0.3, 0.3].forEach(x => {
        const stitchGeo = new THREE.BoxGeometry(0.01, 2.2, 0.01);
        const stitch = new THREE.Mesh(stitchGeo, stitchMat);
        stitch.position.set(x, 0.1, 1.02);
        brace.add(stitch);
    });

    // Horizontal stitch at knee gap
    const hStitch = new THREE.CylinderGeometry(1.03, 1.01, 0.01, 48, 1, true, 0.5, Math.PI * 1.0);
    const hStitchMesh = new THREE.Mesh(hStitch, stitchMat);
    hStitchMesh.position.y = 0.1;
    brace.add(hStitchMesh);

    // Position and initial rotation
    brace.rotation.y = -0.3;
    brace.position.y = -0.1;
    scene.add(brace);
}

function addParticles() {
    const count = 100;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 12;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00c8d4, size: 0.025, transparent: true, opacity: 0.4 });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    const orig = positions.slice();
    window._animateParticles = function() {
        const t = Date.now() * 0.0003;
        for (let i = 0; i < count; i++) {
            particles.geometry.attributes.position.array[i * 3 + 1] =
                orig[i * 3 + 1] + Math.sin(t + i * 0.3) * 0.08;
        }
        particles.geometry.attributes.position.needsUpdate = true;
    };
}

// --- MOUSE / TOUCH CONTROLS ---
let isDragging = false, prevMouse = { x: 0, y: 0 };

function initMouseControls(canvas) {
    canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', e => {
        if (!isDragging || !brace) return;
        brace.rotation.y += (e.clientX - prevMouse.x) * 0.008;
        brace.rotation.x += (e.clientY - prevMouse.y) * 0.006;
        brace.rotation.x = Math.max(-0.8, Math.min(0.8, brace.rotation.x));
        prevMouse = { x: e.clientX, y: e.clientY };
        autoRotate = false;
        clearTimeout(window._rotateTimeout);
        window._rotateTimeout = setTimeout(() => {
            if (document.getElementById('btn-autorotate').classList.contains('active')) autoRotate = true;
        }, 2500);
    });

    canvas.addEventListener('touchstart', e => {
        isDragging = true;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('touchmove', e => {
        if (!isDragging || !brace) return;
        brace.rotation.y += (e.touches[0].clientX - prevMouse.x) * 0.008;
        brace.rotation.x += (e.touches[0].clientY - prevMouse.y) * 0.005;
        brace.rotation.x = Math.max(-0.8, Math.min(0.8, brace.rotation.x));
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    canvas.addEventListener('wheel', e => {
        camera.position.z = Math.max(3, Math.min(9, camera.position.z + e.deltaY * 0.005));
    }, { passive: true });

    canvas.addEventListener('dblclick', () => {
        animateTo(brace.rotation, { x: 0, y: -0.3, z: 0 }, 500);
        animateToVal(camera.position, 'z', 5.5, 500);
        autoRotate = true;
    });
}

// --- CONTROLS ---
document.addEventListener('DOMContentLoaded', () => {
    const btnReset = document.getElementById('btn-reset');
    const btnToggle = document.getElementById('btn-autorotate');
    const btnExplode = document.getElementById('btn-explode');
    const btnWire = document.getElementById('btn-wireframe');

    if (btnReset) btnReset.addEventListener('click', () => {
        animateTo(brace.rotation, { x: 0, y: -0.3, z: 0 }, 500);
        animateToVal(camera.position, 'z', 5.5, 500);
        autoRotate = true;
        btnToggle.classList.add('active');
        btnToggle.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Rotation';
    });

    if (btnToggle) btnToggle.addEventListener('click', () => {
        autoRotate = !autoRotate;
        btnToggle.classList.toggle('active', autoRotate);
        btnToggle.innerHTML = autoRotate
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg> Pause Rotation'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg> Auto Rotate';
    });

    let exploded = false;
    if (btnExplode) btnExplode.addEventListener('click', () => {
        exploded = !exploded;
        btnExplode.classList.toggle('active', exploded);
        btnExplode.innerHTML = exploded
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/><line x1="14" y1="10" x2="21" y2="3"/><line x1="3" y1="21" x2="10" y2="14"/></svg> Assemble'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg> Explode View';

        explodeParts.forEach(p => {
            if (p.explodeY !== undefined) animateToVal(p.mesh.position, 'y', exploded ? p.explodeY : p.origY, 600);
            if (p.explodeX !== undefined) animateToVal(p.mesh.position, 'x', exploded ? p.explodeX : p.origX, 600);
            if (p.explodeZ !== undefined) animateToVal(p.mesh.position, 'z', exploded ? p.explodeZ : (p.origZ || p.mesh.position.z), 600);
        });
    });

    if (btnWire) btnWire.addEventListener('click', () => {
        wireframeMode = !wireframeMode;
        btnWire.classList.toggle('active', wireframeMode);
        if (brace) {
            brace.traverse(child => {
                if (child.isMesh && child.material) {
                    child.material.wireframe = wireframeMode;
                }
            });
        }
    });
});

// --- ANIMATION HELPERS ---
function animateToVal(obj, prop, target, duration) {
    const start = obj[prop];
    const startTime = Date.now();
    function tick() {
        const t = Math.min((Date.now() - startTime) / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        obj[prop] = start + (target - start) * ease;
        if (t < 1) requestAnimationFrame(tick);
    }
    tick();
}

function animateTo(obj, targets, duration) {
    Object.keys(targets).forEach(key => animateToVal(obj, key, targets[key], duration));
}

// --- RENDER LOOP ---
function animate() {
    requestAnimationFrame(animate);
    if (brace && autoRotate) {
        brace.rotation.y += 0.004;
        brace.position.y = -0.1 + Math.sin(Date.now() * 0.001) * 0.06;
    }
    if (window._animateParticles) window._animateParticles();
    renderer.render(scene, camera);
}

function onResize() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !renderer) return;
    const w = canvas.parentElement.clientWidth;
    const h = window.innerWidth < 768 ? 350 : 500;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

window.addEventListener('DOMContentLoaded', initViewer);