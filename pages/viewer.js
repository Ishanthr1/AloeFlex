// ===== ALOEFLEX 3D VIEWER =====

let scene, camera, renderer, brace, autoRotate = true;

function initViewer() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas) return;

    // Scene
    scene = new THREE.Scene();
    scene.background = null;

    // Camera
    camera = new THREE.PerspectiveCamera(50, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5);

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0x00c8d4, 1.2);
    keyLight.position.set(5, 5, 5);
    keyLight.castShadow = true;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x2ebd52, 0.6);
    fillLight.position.set(-4, 2, -2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.4);
    rimLight.position.set(0, -3, -3);
    scene.add(rimLight);

    // Build knee brace model from primitives
    buildKneeBrace();

    // Particle field
    addParticles();

    // Controls (simple mouse drag)
    initMouseControls(canvas);

    // Resize handler
    window.addEventListener('resize', onResize);

    // Hide loading
    setTimeout(() => {
        const loading = document.querySelector('.canvas-loading');
        if (loading) loading.classList.add('hidden');
    }, 800);

    animate();
}

function buildKneeBrace() {
    brace = new THREE.Group();

    // Materials
    const neoprene = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 0.8,
        metalness: 0.1,
    });

    const ldpe = new THREE.MeshStandardMaterial({
        color: 0x2a2a2a,
        roughness: 0.5,
        metalness: 0.3,
    });

    const strapMat = new THREE.MeshStandardMaterial({
        color: 0x1a8c3a,
        roughness: 0.7,
        metalness: 0.05,
    });

    const aloeGlow = new THREE.MeshStandardMaterial({
        color: 0x00c8d4,
        roughness: 0.3,
        metalness: 0.2,
        emissive: 0x00c8d4,
        emissiveIntensity: 0.08,
    });

    // Main shell - large cylinder for the brace body
    const shellGeom = new THREE.CylinderGeometry(1.0, 0.9, 2.4, 32, 1, true, 0.3, Math.PI * 1.4);
    const shell = new THREE.Mesh(shellGeom, neoprene);
    shell.castShadow = true;
    brace.add(shell);

    // Inner aloe layer (slightly smaller)
    const innerGeom = new THREE.CylinderGeometry(0.95, 0.85, 2.35, 32, 1, true, 0.3, Math.PI * 1.4);
    const inner = new THREE.Mesh(innerGeom, aloeGlow);
    brace.add(inner);

    // Side LDPE panels
    [-1, 1].forEach(side => {
        const panelGeom = new THREE.BoxGeometry(0.15, 2.0, 0.3);
        const panel = new THREE.Mesh(panelGeom, ldpe);
        panel.position.set(side * 1.0, 0, 0.1);
        panel.rotation.y = side * 0.2;
        panel.castShadow = true;
        brace.add(panel);

        // Hinge circle
        const hingeGeom = new THREE.TorusGeometry(0.18, 0.05, 8, 16);
        const hinge = new THREE.Mesh(hingeGeom, new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 }));
        hinge.position.set(side * 1.05, 0, 0.12);
        hinge.rotation.y = Math.PI / 2;
        brace.add(hinge);
    });

    // Top strap
    createStrap(brace, strapMat, 0.85, 'top');
    // Middle strap
    createStrap(brace, strapMat, 0, 'mid');
    // Bottom strap
    createStrap(brace, strapMat, -0.85, 'bottom');

    // Kneecap cutout ring
    const kneecapRing = new THREE.TorusGeometry(0.38, 0.06, 8, 24, Math.PI * 1.6);
    const kneecap = new THREE.Mesh(kneecapRing, new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 }));
    kneecap.position.set(0, 0.2, 0.92);
    kneecap.rotation.x = Math.PI / 2;
    brace.add(kneecap);

    // Logo area
    const logoGeom = new THREE.PlaneGeometry(0.5, 0.12);
    const logoMat = new THREE.MeshStandardMaterial({ color: 0x00c8d4, roughness: 0.3, emissive: 0x00c8d4, emissiveIntensity: 0.3 });
    const logo = new THREE.Mesh(logoGeom, logoMat);
    logo.position.set(0, 0.9, 0.92);
    brace.add(logo);

    brace.rotation.y = -0.3;
    scene.add(brace);
}

function createStrap(parent, mat, y, type) {
    // Horizontal band across the brace
    const bandGeom = new THREE.CylinderGeometry(1.02, 1.02, 0.12, 32, 1, true, 0.25, Math.PI * 1.5);
    const band = new THREE.Mesh(bandGeom, mat);
    band.position.y = y;
    parent.add(band);

    // Buckle
    const buckleGeom = new THREE.BoxGeometry(0.2, 0.18, 0.08);
    const buckleMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8, roughness: 0.2 });
    const buckle = new THREE.Mesh(buckleGeom, buckleMat);
    buckle.position.set(0, y, -0.98);
    parent.add(buckle);
}

function addParticles() {
    const count = 80;
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * 10;
    }
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({ color: 0x00c8d4, size: 0.03, transparent: true, opacity: 0.5 });
    const particles = new THREE.Points(geo, mat);
    scene.add(particles);

    // Animate particles
    const originalPositions = positions.slice();
    function animateParticles() {
        const t = Date.now() * 0.0003;
        for (let i = 0; i < count; i++) {
            particles.geometry.attributes.position.array[i * 3 + 1] =
                originalPositions[i * 3 + 1] + Math.sin(t + i * 0.3) * 0.1;
        }
        particles.geometry.attributes.position.needsUpdate = true;
    }
    // Store reference for animate loop
    window._animateParticles = animateParticles;
}

// === Mouse Controls ===
let isDragging = false, prevMouse = { x: 0, y: 0 };

function initMouseControls(canvas) {
    canvas.addEventListener('mousedown', e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; });
    window.addEventListener('mouseup', () => isDragging = false);
    window.addEventListener('mousemove', e => {
        if (!isDragging || !brace) return;
        const dx = e.clientX - prevMouse.x;
        const dy = e.clientY - prevMouse.y;
        brace.rotation.y += dx * 0.008;
        brace.rotation.x += dy * 0.008;
        prevMouse = { x: e.clientX, y: e.clientY };
        autoRotate = false;
        clearTimeout(window._rotateTimeout);
        window._rotateTimeout = setTimeout(() => autoRotate = true, 2000);
    });

    // Touch support
    canvas.addEventListener('touchstart', e => {
        isDragging = true;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });
    window.addEventListener('touchend', () => isDragging = false);
    window.addEventListener('touchmove', e => {
        if (!isDragging || !brace) return;
        const dx = e.touches[0].clientX - prevMouse.x;
        const dy = e.touches[0].clientY - prevMouse.y;
        brace.rotation.y += dx * 0.008;
        brace.rotation.x += dy * 0.005;
        prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    });

    // Scroll-zoom
    canvas.addEventListener('wheel', e => {
        camera.position.z = Math.max(2.5, Math.min(8, camera.position.z + e.deltaY * 0.005));
    });
}

// === Controls buttons ===
document.addEventListener('DOMContentLoaded', () => {
    const btnReset = document.getElementById('btn-reset');
    const btnToggleRotate = document.getElementById('btn-autorotate');
    const btnExplode = document.getElementById('btn-explode');

    if (btnReset) {
        btnReset.addEventListener('click', () => {
            if (!brace) return;
            brace.rotation.set(0, -0.3, 0);
            camera.position.z = 5;
            autoRotate = true;
        });
    }

    if (btnToggleRotate) {
        btnToggleRotate.addEventListener('click', () => {
            autoRotate = !autoRotate;
            btnToggleRotate.classList.toggle('active', autoRotate);
            btnToggleRotate.innerHTML = autoRotate ? '⏸ Pause Rotation' : '▶ Auto Rotate';
        });
    }

    if (btnExplode) {
        let exploded = false;
        btnExplode.addEventListener('click', () => {
            if (!brace) return;
            exploded = !exploded;
            btnExplode.classList.toggle('active', exploded);
            btnExplode.textContent = exploded ? '🔗 Assemble' : '💥 Explode View';
            // Animate children apart
            brace.children.forEach((child, i) => {
                const dir = exploded ? 1 : 0;
                const offset = (i % 2 === 0 ? 1 : -1) * 0.4 * dir;
                gsapLike(child.position, 'y', child.position.y + (exploded ? (i * 0.1 - 0.5) : 0), 600);
                gsapLike(child.position, 'x', exploded ? (i % 3 - 1) * 0.3 : 0, 600);
            });
        });
    }
});

function gsapLike(obj, prop, target, duration) {
    const start = obj[prop];
    const startTime = Date.now();
    function tick() {
        const elapsed = Date.now() - startTime;
        const t = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        obj[prop] = start + (target - start) * ease;
        if (t < 1) requestAnimationFrame(tick);
    }
    tick();
}

// === Animate Loop ===
function animate() {
    requestAnimationFrame(animate);
    if (brace && autoRotate) {
        brace.rotation.y += 0.005;
        brace.position.y = Math.sin(Date.now() * 0.001) * 0.08;
    }
    if (window._animateParticles) window._animateParticles();
    renderer.render(scene, camera);
}

function onResize() {
    const canvas = document.getElementById('three-canvas');
    if (!canvas || !renderer) return;
    const w = canvas.parentElement.clientWidth;
    const h = 500;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
}

// Init
window.addEventListener('DOMContentLoaded', () => {
    // Load Three.js from CDN then init
    initViewer();
});