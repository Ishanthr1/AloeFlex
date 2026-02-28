// ===== ALOEFLEX INTERACTIVE PRODUCT VIEWER =====
// Canvas 2D approach — draws a realistic knee brace illustration
// with smooth rotation, zoom, and labeled explode diagram

(function () {

    // ─── State ────────────────────────────────────────────────────────────────
    let autoRotating = true;
    let isDragging = false;
    let dragStartX = 0;
    let zoomLevel = 1;
    let rotY = 0;       // radians, controls rotation
    let explodedView = false;
    let wireMode = false;
    let animFrame = null;
    let braceCanvas = null;
    let braceCtx = null;

    // ─── Init ─────────────────────────────────────────────────────────────────
    function init() {
        const threeCanvas = document.getElementById('three-canvas');
        if (!threeCanvas) return;

        const wrap = threeCanvas.parentElement;
        threeCanvas.style.display = 'none';

        // Inject styles
        injectStyles();

        // Build UI
        buildUI(wrap);

        // Hide loader
        setTimeout(() => {
            const loading = document.querySelector('.canvas-loading');
            if (loading) loading.classList.add('hidden');
        }, 400);

        // Wire buttons
        wireButtons();

        // Start render loop
        startLoop();
    }

    // ─── Inject CSS ───────────────────────────────────────────────────────────
    function injectStyles() {
        const s = document.createElement('style');
        s.textContent = `
      #af-wrap {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: transparent;
        overflow: hidden;
      }
      #af-scene {
        position: relative;
        width: 100%; height: 100%;
        display: flex; align-items: center; justify-content: center;
        cursor: grab;
      }
      #af-scene:active { cursor: grabbing; }
      #af-canvas {
        border-radius: 16px;
        display: block;
        transition: transform 0.2s ease;
        filter: drop-shadow(0 24px 64px rgba(0,0,0,0.8));
      }
      #af-angle-label {
        position: absolute;
        top: 14px; left: 50%;
        transform: translateX(-50%);
        font-family: 'Syne', sans-serif;
        font-size: 11px; font-weight: 700;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(0,200,212,0.85);
        background: rgba(10,22,40,0.75);
        padding: 5px 16px;
        border-radius: 100px;
        border: 1px solid rgba(0,200,212,0.25);
        pointer-events: none;
        white-space: nowrap;
      }
      #af-hint {
        position: absolute;
        bottom: 14px; left: 50%;
        transform: translateX(-50%);
        font-family: 'Syne', sans-serif;
        font-size: 9.5px; font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(255,255,255,0.2);
        pointer-events: none;
        white-space: nowrap;
      }
    `;
        document.head.appendChild(s);
    }

    // ─── Build UI ─────────────────────────────────────────────────────────────
    function buildUI(wrap) {
        wrap.style.position = 'relative';

        const afWrap = document.createElement('div');
        afWrap.id = 'af-wrap';

        const scene = document.createElement('div');
        scene.id = 'af-scene';

        // Main canvas
        braceCanvas = document.createElement('canvas');
        braceCanvas.id = 'af-canvas';
        braceCanvas.width = 520;
        braceCanvas.height = 480;
        braceCanvas.style.width = 'min(520px, 95%)';
        braceCanvas.style.height = 'auto';
        braceCtx = braceCanvas.getContext('2d');

        // Angle label
        const label = document.createElement('div');
        label.id = 'af-angle-label';
        label.textContent = 'Front View';

        // Hint
        const hint = document.createElement('div');
        hint.id = 'af-hint';
        hint.textContent = 'Drag to rotate · Scroll to zoom · Double-click to reset';

        scene.append(braceCanvas, label, hint);
        afWrap.appendChild(scene);
        wrap.appendChild(afWrap);

        // Drag events
        scene.addEventListener('mousedown', e => { isDragging = true; dragStartX = e.clientX; stopAutoRotate(); });
        window.addEventListener('mouseup', () => { isDragging = false; });
        window.addEventListener('mousemove', e => {
            if (!isDragging) return;
            rotY += (e.clientX - dragStartX) * 0.013;
            dragStartX = e.clientX;
        });
        scene.addEventListener('touchstart', e => {
            isDragging = true; dragStartX = e.touches[0].clientX; stopAutoRotate();
        }, { passive: true });
        window.addEventListener('touchend', () => { isDragging = false; }, { passive: true });
        window.addEventListener('touchmove', e => {
            if (!isDragging) return;
            rotY += (e.touches[0].clientX - dragStartX) * 0.013;
            dragStartX = e.touches[0].clientX;
        }, { passive: true });

        // Zoom
        scene.addEventListener('wheel', e => {
            e.preventDefault();
            zoomLevel = Math.max(0.6, Math.min(2.5, zoomLevel - e.deltaY * 0.0008));
            braceCanvas.style.transform = `scale(${zoomLevel})`;
        }, { passive: false });

        // Double-click reset
        scene.addEventListener('dblclick', resetView);
    }

    // ─── Render loop ──────────────────────────────────────────────────────────
    function startLoop() {
        function loop() {
            if (autoRotating && !isDragging && !explodedView) {
                rotY += 0.008;
            }
            render();
            animFrame = requestAnimationFrame(loop);
        }
        loop();
    }

    function render() {
        const ctx = braceCtx;
        const W = braceCanvas.width;
        const H = braceCanvas.height;
        ctx.clearRect(0, 0, W, H);

        const cx = W / 2;
        const cy = H / 2 + 5;

        // Normalize rotation
        const r = ((rotY % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);
        const isFront = cosR > 0;
        const sideAmt = Math.abs(sinR); // 0=front/back, 1=pure side

        // Update angle label
        updateLabel(r);

        if (explodedView) {
            drawExplodeView(ctx, W, H, cx, cy);
        } else {
            drawBrace(ctx, W, H, cx, cy, cosR, sinR, isFront, sideAmt);
        }
    }

    // ─── Label updater ────────────────────────────────────────────────────────
    function updateLabel(r) {
        const lbl = document.getElementById('af-angle-label');
        if (!lbl) return;
        const deg = r * 180 / Math.PI;
        if (deg < 35 || deg > 325) lbl.textContent = 'Front View';
        else if (deg < 90) lbl.textContent = 'Side View →';
        else if (deg < 145) lbl.textContent = 'Side View →';
        else if (deg < 215) lbl.textContent = 'Rear View';
        else if (deg < 325) lbl.textContent = '← Side View';
    }

    // ─── Main brace drawing ────────────────────────────────────────────────────
    function drawBrace(ctx, W, H, cx, cy, cosR, sinR, isFront, sideAmt) {
        // Brace geometry — responds to rotation
        const bodyW = 210 + Math.abs(cosR) * 20;      // widens when front-facing
        const bodyH = 340;
        const topW = bodyW * 0.52;                     // ellipse width at top
        const botW = bodyW * 0.48;
        const skew = sinR * 22;                        // horizontal skew for depth
        const bL = cx - bodyW / 2 + skew;
        const bR = cx + bodyW / 2 + skew;
        const bTop = cy - bodyH / 2;
        const bBot = cy + bodyH / 2;
        const bMid = cx + skew;

        // ── Background body shadow ────────────────────────────────────────────
        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.7)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 12;
        drawBodyPath(ctx, bL, bR, bTop, bBot, bMid, topW, botW, 16);
        ctx.fillStyle = '#111';
        ctx.fill();
        ctx.restore();

        // ── Main body gradient ────────────────────────────────────────────────
        const bodyGrad = ctx.createLinearGradient(bL, cy, bR + 40, cy);
        if (isFront) {
            bodyGrad.addColorStop(0,    '#141414');
            bodyGrad.addColorStop(0.25, '#282828');
            bodyGrad.addColorStop(0.6,  '#222');
            bodyGrad.addColorStop(0.85, '#1a1a1a');
            bodyGrad.addColorStop(1,    '#0e0e0e');
        } else {
            bodyGrad.addColorStop(0,   '#0c0c0c');
            bodyGrad.addColorStop(0.5, '#1e1e1e');
            bodyGrad.addColorStop(1,   '#111');
        }
        ctx.save();
        drawBodyPath(ctx, bL, bR, bTop, bBot, bMid, topW, botW, 16);
        ctx.fillStyle = bodyGrad;
        ctx.fill();
        ctx.restore();

        // ── Edge highlight (gives 3D roundness) ───────────────────────────────
        const highlightW = isFront ? 28 : 18;
        const hlGrad = ctx.createLinearGradient(bL, 0, bL + highlightW * 2, 0);
        hlGrad.addColorStop(0, `rgba(255,255,255,${isFront ? 0.09 : 0.03})`);
        hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save();
        drawBodyPath(ctx, bL, bR, bTop, bBot, bMid, topW, botW, 16);
        ctx.clip();
        roundRect(ctx, bL, bTop, highlightW * 2, bodyH, 16);
        ctx.fillStyle = hlGrad;
        ctx.fill();
        ctx.restore();

        // ── Subtle ribbing texture ────────────────────────────────────────────
        ctx.save();
        drawBodyPath(ctx, bL, bR, bTop, bBot, bMid, topW, botW, 16);
        ctx.clip();
        ctx.globalAlpha = 0.045;
        for (let y = bTop + 12; y < bBot - 12; y += 14) {
            ctx.beginPath();
            ctx.moveTo(bL + 6, y);
            ctx.lineTo(bR - 6, y);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();

        // ── Aloe vera inner glow (visible from back/inside) ───────────────────
        if (!isFront) {
            const aloeGrad = ctx.createRadialGradient(bMid, cy, 20, bMid, cy, bodyW * 0.52);
            aloeGrad.addColorStop(0, 'rgba(0,200,212,0.11)');
            aloeGrad.addColorStop(0.6, 'rgba(0,200,212,0.04)');
            aloeGrad.addColorStop(1, 'rgba(0,200,212,0)');
            ctx.save();
            drawBodyPath(ctx, bL, bR, bTop, bBot, bMid, topW, botW, 16);
            ctx.fillStyle = aloeGrad;
            ctx.fill();
            ctx.restore();
        }

        // ── Top ellipse cap ───────────────────────────────────────────────────
        drawEllipseCap(ctx, bMid, bTop, topW * Math.abs(cosR) + 28, 13, '#252525', '#1a1a1a');
        // ── Bottom ellipse cap ────────────────────────────────────────────────
        drawEllipseCap(ctx, bMid, bBot, botW * Math.abs(cosR) + 24, 11, '#1e1e1e', '#111');

        // ── Straps ─────────────────────────────────────────────────────────────
        const strapY1 = bTop + 68;
        const strapY2 = bBot - 68;
        drawStrap(ctx, bL, bR, bMid, strapY1, bodyW, cosR, sinR);
        drawStrap(ctx, bL, bR, bMid, strapY2, bodyW, cosR, sinR);

        // ── Lateral stabilizer bars ────────────────────────────────────────────
        // Left stabilizer (visible when front or right-side showing)
        const showL = sinR > -0.85;
        const showR = sinR < 0.85;
        if (showL) drawStabilizer(ctx, bL + 10, bTop + 40, bBot - 40, cosR, sinR, 1);
        if (showR) drawStabilizer(ctx, bR - 10, bTop + 40, bBot - 40, cosR, sinR, -1);

        // ── Kneecap opening (front only) ──────────────────────────────────────
        if (isFront) {
            const alpha = Math.max(0, cosR);
            const kR = 44 * alpha;
            const kX = bMid;
            const kY = cy - 5;

            if (kR > 4) {
                // Outer raised ring
                ctx.save();
                ctx.beginPath();
                ctx.ellipse(kX, kY, kR + 14, kR * 1.1 + 10, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(50,50,50,${alpha})`;
                ctx.lineWidth = 12;
                ctx.stroke();

                // Inner dark opening
                ctx.beginPath();
                ctx.ellipse(kX, kY, kR, kR * 1.1, 0, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(5,5,5,${alpha})`;
                ctx.fill();

                // Rim highlight
                ctx.beginPath();
                ctx.ellipse(kX, kY, kR + 14, kR * 1.1 + 10, 0, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255,255,255,${alpha * 0.06})`;
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();
            }
        }

        // ── EBI sensor bump (front lower) ─────────────────────────────────────
        if (isFront && cosR > 0.4) {
            const alpha = (cosR - 0.4) / 0.6;
            ctx.save();
            ctx.globalAlpha = alpha;
            // Small rectangular sensor housing
            [-40, 40].forEach(ox => {
                roundRect(ctx, bMid + ox - 9, bBot - 50, 18, 10, 3);
                ctx.fillStyle = '#1a1a1a';
                ctx.fill();
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.stroke();
                // LED dot
                ctx.beginPath();
                ctx.arc(bMid + ox, bBot - 45, 2.5, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,200,212,0.5)';
                ctx.fill();
            });
            ctx.restore();
        }

        // ── Wireframe overlay ─────────────────────────────────────────────────
        if (wireMode) {
            ctx.save();
            ctx.globalAlpha = 0.85;
            drawBodyPath(ctx, bL, bR, bTop, bBot, bMid, topW, botW, 16);
            ctx.strokeStyle = '#00c8d4';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            // Grid lines
            ctx.globalAlpha = 0.2;
            drawBodyPath(ctx, bL, bR, bTop, bBot, bMid, topW, botW, 16);
            ctx.clip();
            for (let y = bTop; y < bBot; y += 22) {
                ctx.beginPath(); ctx.moveTo(bL, y); ctx.lineTo(bR, y);
                ctx.strokeStyle = '#00c8d4'; ctx.lineWidth = 0.5; ctx.stroke();
            }
            for (let x = bL; x < bR; x += 22) {
                ctx.beginPath(); ctx.moveTo(x, bTop); ctx.lineTo(x, bBot);
                ctx.stroke();
            }
            ctx.restore();
        }
    }

    // ─── Brace body path ──────────────────────────────────────────────────────
    function drawBodyPath(ctx, bL, bR, bTop, bBot, bMid, topW, botW, r) {
        // Slightly tapered rectangle with rounded corners
        // Tapers inward slightly in the middle (like a knee brace)
        const midInset = 12;
        ctx.beginPath();
        // Top-left arc
        ctx.moveTo(bL + r, bTop);
        ctx.lineTo(bR - r, bTop);
        ctx.arcTo(bR, bTop, bR, bTop + r, r);
        // Right side — slight taper inward at mid
        ctx.bezierCurveTo(bR, bTop + (bBot - bTop) * 0.3, bR - midInset, bTop + (bBot - bTop) * 0.5, bR, bBot - r - 0);
        ctx.arcTo(bR, bBot, bR - r, bBot, r);
        ctx.lineTo(bL + r, bBot);
        ctx.arcTo(bL, bBot, bL, bBot - r, r);
        ctx.bezierCurveTo(bL, bBot - (bBot - bTop) * 0.3, bL + midInset, bTop + (bBot - bTop) * 0.5, bL, bTop + r);
        ctx.arcTo(bL, bTop, bL + r, bTop, r);
        ctx.closePath();
    }

    // ─── Strap ────────────────────────────────────────────────────────────────
    function drawStrap(ctx, bL, bR, bMid, sy, bodyW, cosR, sinR) {
        const sh = 30;
        ctx.save();

        // Strap body
        const sg = ctx.createLinearGradient(bL, sy, bR, sy + sh);
        sg.addColorStop(0,   '#181818');
        sg.addColorStop(0.3, '#2b2b2b');
        sg.addColorStop(0.7, '#222');
        sg.addColorStop(1,   '#161616');
        roundRect(ctx, bL + 3, sy - sh / 2, bR - bL - 6, sh, 5);
        ctx.fillStyle = sg;
        ctx.fill();

        // Top edge highlight
        ctx.beginPath();
        ctx.moveTo(bL + 8, sy - sh / 2 + 1);
        ctx.lineTo(bR - 8, sy - sh / 2 + 1);
        ctx.strokeStyle = 'rgba(255,255,255,0.07)';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Horizontal stitch lines
        ctx.globalAlpha = 0.12;
        [sy - 7, sy + 7].forEach(ly => {
            ctx.beginPath();
            ctx.setLineDash([4, 5]);
            ctx.moveTo(bL + 12, ly);
            ctx.lineTo(bR - 35, ly);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);
        });
        ctx.globalAlpha = 1;

        // Buckle (right side)
        const buckX = bR - 24;
        const buckY = sy - 8;
        const buckW = 20, buckH = 16;
        roundRect(ctx, buckX, buckY, buckW, buckH, 3);
        ctx.fillStyle = '#555';
        ctx.fill();
        roundRect(ctx, buckX + 3, buckY + 3, buckW - 6, buckH - 6, 2);
        ctx.fillStyle = '#777';
        ctx.fill();
        // Buckle bar
        ctx.beginPath();
        ctx.moveTo(buckX + buckW / 2, buckY + 2);
        ctx.lineTo(buckX + buckW / 2, buckY + buckH - 2);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.restore();
    }

    // ─── Lateral stabilizer ───────────────────────────────────────────────────
    function drawStabilizer(ctx, x, y1, y2, cosR, sinR, side) {
        const h = y2 - y1;
        const w = 12;
        ctx.save();

        const sg = ctx.createLinearGradient(x - w, 0, x + w * 1.5, 0);
        sg.addColorStop(0, '#3a3a3a');
        sg.addColorStop(0.4, '#8a8a8a');
        sg.addColorStop(0.7, '#666');
        sg.addColorStop(1, '#2a2a2a');

        roundRect(ctx, x - w / 2, y1, w, h, 5);
        ctx.fillStyle = sg;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.4)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Center highlight line
        ctx.beginPath();
        ctx.moveTo(x - 1, y1 + 10);
        ctx.lineTo(x - 1, y2 - 10);
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Top hinge cap
        drawHingeCap(ctx, x, y1 + 7, 9);
        // Bottom hinge cap
        drawHingeCap(ctx, x, y2 - 7, 9);

        ctx.restore();
    }

    function drawHingeCap(ctx, x, y, r) {
        const g = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, r);
        g.addColorStop(0, '#aaa');
        g.addColorStop(0.5, '#777');
        g.addColorStop(1, '#444');
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();
    }

    // ─── Ellipse cap ─────────────────────────────────────────────────────────
    function drawEllipseCap(ctx, cx, cy, rx, ry, c1, c2) {
        if (rx < 3) return;
        const g = ctx.createLinearGradient(cx - rx, cy, cx + rx, cy);
        g.addColorStop(0, c2);
        g.addColorStop(0.5, c1);
        g.addColorStop(1, c2);
        ctx.save();
        ctx.beginPath();
        ctx.ellipse(cx, cy, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    // ─── Explode diagram ──────────────────────────────────────────────────────
    const EXPLODE_PARTS = [
        { name: 'LDPE Protective Shell', detail: '7,830 PSI tensile strength',   cx: 260, cy: 50,  dotX: 260, dotY: 100, side: 'right' },
        { name: 'Neoprene + Memory Foam', detail: 'Medical-grade comfort',        cx: 80,  cy: 130, dotX: 180, dotY: 180, side: 'left' },
        { name: 'Aloe Vera Liner',        detail: 'Microencapsulated cooling',    cx: 380, cy: 150, dotX: 290, dotY: 200, side: 'right' },
        { name: 'Upper Strap',            detail: 'Hook-and-loop, adjustable',    cx: 65,  cy: 195, dotX: 185, dotY: 148, side: 'left' },
        { name: 'Lateral Stabilizers',   detail: 'Dual-hinge system',            cx: 390, cy: 240, dotX: 300, dotY: 240, side: 'right' },
        { name: 'Kneecap Pad',           detail: 'Open-patella design',          cx: 65,  cy: 275, dotX: 195, dotY: 250, side: 'left' },
        { name: 'Lower Strap',           detail: 'Customizable compression',     cx: 390, cy: 340, dotX: 300, dotY: 328, side: 'right' },
        { name: 'EBI Sensors',           detail: 'Inflammation tracking',        cx: 65,  cy: 395, dotX: 218, dotY: 370, side: 'left' },
    ];

    function drawExplodeView(ctx, W, H, cx, cy) {
        // Draw brace silhouette in center (faded)
        ctx.save();
        ctx.globalAlpha = 0.35;
        drawBrace(ctx, W, H, cx, cy, 1, 0, true, 0);
        ctx.restore();

        // Draw each part label
        EXPLODE_PARTS.forEach((p, i) => {
            // Animate in with stagger
            const alpha = Math.min(1, (Date.now() % 99999) / 500 - i * 0.08);
            if (alpha <= 0) return;

            ctx.save();
            ctx.globalAlpha = Math.min(1, alpha);

            // Dashed line
            ctx.beginPath();
            ctx.moveTo(p.dotX, p.dotY);
            ctx.lineTo(p.cx + (p.side === 'right' ? -5 : 90), p.cy + 10);
            ctx.setLineDash([3, 4]);
            ctx.strokeStyle = 'rgba(0,200,212,0.5)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.setLineDash([]);

            // Dot on brace
            ctx.beginPath();
            ctx.arc(p.dotX, p.dotY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#00c8d4';
            ctx.shadowColor = '#00c8d4';
            ctx.shadowBlur = 10;
            ctx.fill();
            ctx.shadowBlur = 0;

            // Label box
            const boxX = p.side === 'right' ? p.cx - 5 : p.cx;
            const boxY = p.cy;
            const boxW = 155, boxH = 34;
            roundRect(ctx, boxX, boxY - boxH / 2, boxW, boxH, 6);
            ctx.fillStyle = 'rgba(8,16,36,0.9)';
            ctx.strokeStyle = 'rgba(0,200,212,0.45)';
            ctx.lineWidth = 1;
            ctx.fill();
            ctx.stroke();

            // Label text
            ctx.font = '700 10.5px Syne, sans-serif';
            ctx.fillStyle = '#fff';
            ctx.textAlign = 'left';
            ctx.fillText(p.name, boxX + 10, boxY - 3);
            ctx.font = '400 9px DM Sans, sans-serif';
            ctx.fillStyle = 'rgba(0,200,212,0.8)';
            ctx.fillText(p.detail, boxX + 10, boxY + 11);

            ctx.restore();
        });

        // Title
        ctx.save();
        ctx.font = '700 12px Syne, sans-serif';
        ctx.fillStyle = 'rgba(0,200,212,0.6)';
        ctx.textAlign = 'center';
        ctx.letterSpacing = '0.15em';
        ctx.fillText('EXPLODED COMPONENT VIEW', W / 2, H - 14);
        ctx.restore();
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────
    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
    }

    function stopAutoRotate() {
        autoRotating = false;
        clearTimeout(window._resumeRotate);
        window._resumeRotate = setTimeout(() => { autoRotating = true; }, 2500);
    }

    function resetView() {
        rotY = 0; zoomLevel = 1;
        autoRotating = true;
        if (braceCanvas) braceCanvas.style.transform = 'scale(1)';
    }

    // ─── Wire buttons ─────────────────────────────────────────────────────────
    function wireButtons() {
        const btnReset = document.getElementById('btn-reset');
        const btnAutorotate = document.getElementById('btn-autorotate');
        const btnExplode = document.getElementById('btn-explode');
        const btnWireframe = document.getElementById('btn-wireframe');

        if (btnReset) {
            btnReset.addEventListener('click', () => {
                resetView();
                explodedView = false;
                wireMode = false;
                if (btnExplode) { btnExplode.classList.remove('active'); updateBtnText(btnExplode, 'Explode View'); }
                if (btnWireframe) { btnWireframe.classList.remove('active'); updateBtnText(btnWireframe, 'Wireframe'); }
                const lbl = document.getElementById('af-angle-label');
                if (lbl) lbl.textContent = 'Front View';
            });
        }

        if (btnAutorotate) {
            btnAutorotate.addEventListener('click', () => {
                autoRotating = !autoRotating;
                btnAutorotate.classList.toggle('active', autoRotating);
                updateBtnText(btnAutorotate, autoRotating ? 'Pause Rotation' : 'Auto Rotate');
            });
        }

        if (btnExplode) {
            btnExplode.addEventListener('click', () => {
                explodedView = !explodedView;
                btnExplode.classList.toggle('active', explodedView);
                updateBtnText(btnExplode, explodedView ? 'Assemble' : 'Explode View');
                if (explodedView) { autoRotating = false; rotY = 0; }
                else { autoRotating = true; }
                const lbl = document.getElementById('af-angle-label');
                if (lbl) lbl.textContent = explodedView ? 'Explode View' : 'Front View';
            });
        }

        if (btnWireframe) {
            btnWireframe.addEventListener('click', () => {
                wireMode = !wireMode;
                btnWireframe.classList.toggle('active', wireMode);
                updateBtnText(btnWireframe, wireMode ? 'Solid View' : 'Wireframe');
            });
        }
    }

    function updateBtnText(btn, text) {
        const svg = btn.querySelector('svg');
        btn.innerHTML = (svg ? svg.outerHTML : '') + ' ' + text;
    }

    // ─── Boot ─────────────────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();