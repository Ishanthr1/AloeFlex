// ===== ALOEFLEX MAIN JS =====

// === State ===
let cart = JSON.parse(localStorage.getItem('aloeflex_cart') || '[]');

// === Products Data ===
const products = [
    { id: 1, name: 'AloeFlex Knee Brace', emoji: '🦵', price: 59.99, category: 'knee', badge: 'Bestseller', rating: 4.9, reviews: 284, desc: 'Maximum knee protection' },
    { id: 2, name: 'AloeFlex Ankle Brace', emoji: '🦶', price: 44.99, category: 'ankle', badge: 'New', rating: 4.8, reviews: 156, desc: 'Lightweight ankle support' },
    { id: 3, name: 'AloeFlex Wrist Brace', emoji: '🤝', price: 34.99, category: 'wrist', badge: '', rating: 4.7, reviews: 98, desc: 'Flexible wrist protection' },
    { id: 4, name: 'AloeFlex Elbow Brace', emoji: '💪', price: 44.99, category: 'elbow', badge: '', rating: 4.8, reviews: 112, desc: 'Durable elbow support' },
];

// === DOM Helpers ===
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// === Navbar Scroll Effect ===
function initNavbar() {
    const navbar = $('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) navbar.classList.add('scrolled');
        else navbar.classList.remove('scrolled');
    });
}

// === Cart ===
function saveCart() {
    localStorage.setItem('aloeflex_cart', JSON.stringify(cart));
}

function updateCartCount() {
    const count = cart.reduce((acc, item) => acc + item.qty, 0);
    $$('.cart-count').forEach(el => {
        el.textContent = count;
        el.style.display = count > 0 ? 'flex' : 'none';
    });
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const existing = cart.find(c => c.id === id);
    if (existing) existing.qty++;
    else cart.push({ ...product, qty: 1 });
    saveCart();
    updateCartCount();
    renderCartItems();
    showNotification(`🛒 ${product.name} added to cart!`);
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    saveCart();
    updateCartCount();
    renderCartItems();
}

function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else {
        saveCart();
        updateCartCount();
        renderCartItems();
    }
}

function renderCartItems() {
    const container = $('.cart-items');
    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Your cart is empty</p>
        <p style="font-size:0.85rem;margin-top:0.5rem">Add some products to get started!</p>
      </div>`;
        updateCartTotal();
        return;
    }

    container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img">${item.emoji}</div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
        <div class="cart-item-qty">
          <div class="qty-btn" onclick="changeQty(${item.id}, -1)">−</div>
          <span class="qty-num">${item.qty}</span>
          <div class="qty-btn" onclick="changeQty(${item.id}, 1)">+</div>
        </div>
      </div>
      <span class="cart-item-remove" onclick="removeFromCart(${item.id})">✕</span>
    </div>
  `).join('');
    updateCartTotal();
}

function updateCartTotal() {
    const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const el = $('.cart-total-amount');
    if (el) el.textContent = `$${total.toFixed(2)}`;
}

function openCart() {
    $('.cart-overlay').classList.add('open');
    $('.cart-sidebar').classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    $('.cart-overlay').classList.remove('open');
    $('.cart-sidebar').classList.remove('open');
    document.body.style.overflow = '';
}

function initCart() {
    renderCartItems();
    updateCartCount();

    $$('.cart-btn').forEach(btn => btn.addEventListener('click', openCart));
    const overlay = $('.cart-overlay');
    const closeBtn = $('.cart-close');
    if (overlay) overlay.addEventListener('click', closeCart);
    if (closeBtn) closeBtn.addEventListener('click', closeCart);

    const checkoutBtn = $('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showNotification('⚠️ Your cart is empty!');
                return;
            }
            showNotification('🎉 Checkout coming soon! Thank you for your interest.');
        });
    }
}

// === Notification ===
function showNotification(msg) {
    let notif = $('.notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.className = 'notification';
        notif.innerHTML = `<span class="notification-icon"></span><span class="notification-msg"></span>`;
        document.body.appendChild(notif);
    }
    const parts = msg.match(/^(\S+\s?)(.+)$/);
    if (parts) {
        notif.querySelector('.notification-icon').textContent = parts[1];
        notif.querySelector('.notification-msg').textContent = parts[2];
    } else {
        notif.querySelector('.notification-msg').textContent = msg;
    }
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 3500);
}

// === Products Render ===
function renderProducts(filter = 'all') {
    const grid = $('.products-grid');
    if (!grid) return;

    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);

    grid.innerHTML = filtered.map(p => `
    <div class="product-card" data-aos>
      <div class="product-img">
        <div class="product-img-bg"></div>
        ${p.badge ? `<span class="product-badge-new">${p.badge}</span>` : ''}
        <div class="product-wishlist" onclick="toggleWishlist(this)">🤍</div>
        <div class="product-emoji">${p.emoji}</div>
      </div>
      <div class="product-info">
        <h4>${p.name}</h4>
        <div class="product-meta">${p.desc}</div>
        <div class="product-stars">
          ${'★'.repeat(Math.floor(p.rating))}${'☆'.repeat(5 - Math.floor(p.rating))}
          <span>${p.rating} (${p.reviews} reviews)</span>
        </div>
        <div class="product-footer">
          <div class="product-price">$${p.price}</div>
          <button class="product-add" onclick="addToCart(${p.id})" title="Add to Cart">+</button>
        </div>
      </div>
    </div>
  `).join('');

    // Animate cards in
    setTimeout(() => {
        $$('.product-card[data-aos]').forEach((card, i) => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = `opacity 0.4s ease ${i * 0.07}s, transform 0.4s ease ${i * 0.07}s`;
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        });
    }, 10);
}

function initFilters() {
    $$('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            $$('.filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderProducts(btn.dataset.filter);
        });
    });
}

function toggleWishlist(el) {
    el.textContent = el.textContent === '🤍' ? '❤️' : '🤍';
}

// === Mobile Nav ===
function initMobileNav() {
    const hamburger = $('.hamburger');
    const mobileNav = $('.mobile-nav');
    const mobileClose = $('.mobile-nav-close');
    if (!hamburger || !mobileNav) return;
    hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
    if (mobileClose) mobileClose.addEventListener('click', () => mobileNav.classList.remove('open'));
    $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));
}

// === Scroll Top ===
function initScrollTop() {
    const btn = $('.scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) btn.classList.add('visible');
        else btn.classList.remove('visible');
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// === Scroll Animations ===
function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });

    $$('.feature-card, .how-step, .testimonial-card, .spec-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

// === Smooth active nav link ===
function initActiveNav() {
    const sections = $$('section[id]');
    const navLinks = $$('.nav-links a');
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(sec => {
            if (window.scrollY >= sec.offsetTop - 100) current = sec.id;
        });
        navLinks.forEach(a => {
            a.classList.remove('active');
            if (a.getAttribute('href') === `#${current}`) a.classList.add('active');
        });
    });
}

// === Counter animation ===
function animateCounters() {
    const counters = $$('.stat-number');
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            const text = el.dataset.target || el.textContent;
            const num = parseFloat(text.replace(/[^0-9.]/g, ''));
            const suffix = text.replace(/[0-9.]/g, '');
            const duration = 1500;
            const start = Date.now();
            const tick = () => {
                const elapsed = Date.now() - start;
                const progress = Math.min(elapsed / duration, 1);
                const ease = 1 - Math.pow(1 - progress, 3);
                el.textContent = (num * ease).toFixed(num % 1 !== 0 ? 1 : 0) + suffix;
                if (progress < 1) requestAnimationFrame(tick);
            };
            tick();
            observer.unobserve(el);
        });
    }, { threshold: 0.5 });
    counters.forEach(el => {
        el.dataset.target = el.textContent;
        observer.observe(el);
    });
}

// === Hero product selector ===
function initHeroSelector() {
    const selector = $('.hero-product-selector');
    if (!selector) return;
    $$('.hero-product-option').forEach(opt => {
        opt.addEventListener('click', () => {
            $$('.hero-product-option').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            const id = parseInt(opt.dataset.id);
            const product = products.find(p => p.id === id);
            if (!product) return;
            const emoji = $('.hero-product-emoji');
            const name = $('.hero-product-name');
            const price = $('.hero-product-price');
            const addBtn = $('.hero-add-btn');
            if (emoji) { emoji.style.opacity = '0'; setTimeout(() => { emoji.textContent = product.emoji; emoji.style.opacity = '1'; }, 200); }
            if (name) name.textContent = product.name;
            if (price) price.textContent = `$${product.price}`;
            if (addBtn) addBtn.onclick = () => addToCart(product.id);
        });
    });
}

// === Trust ticker ===
function initTrustTicker() {
    const track = $('.trust-scroll');
    if (!track) return;
    // Clone for seamless loop
    track.innerHTML += track.innerHTML;
}

// === INIT ===
document.addEventListener('DOMContentLoaded', () => {
    initNavbar();
    initCart();
    renderProducts();
    initFilters();
    initMobileNav();
    initScrollTop();
    initScrollAnimations();
    initActiveNav();
    animateCounters();
    initHeroSelector();
    initTrustTicker();
});

// Expose globals for inline onclick
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty = changeQty;
window.openCart = openCart;
window.closeCart = closeCart;
window.toggleWishlist = toggleWishlist;