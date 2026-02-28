// ===== ALOEFLEX MAIN JS =====

let cart = JSON.parse(localStorage.getItem('aloeflex_cart') || '[]');

const products = [
    { id: 1, name: 'AloeFlex Knee Brace', img: 'images/knee.png', price: 59.99, category: 'knee', badge: 'Bestseller', rating: 4.9, reviews: 284, desc: 'Maximum knee protection' },
    { id: 2, name: 'AloeFlex Ankle Brace', img: 'images/ankle.png', price: 44.99, category: 'ankle', badge: 'New', rating: 4.8, reviews: 156, desc: 'Lightweight ankle support' },
    { id: 3, name: 'AloeFlex Wrist Brace', img: 'images/wrist.png', price: 34.99, category: 'wrist', badge: '', rating: 4.7, reviews: 98, desc: 'Flexible wrist protection' },
    { id: 4, name: 'AloeFlex Elbow Brace', img: 'images/elbow.png', price: 44.99, category: 'elbow', badge: '', rating: 4.8, reviews: 112, desc: 'Durable elbow support' },
];

// Resolve image path based on current page depth
function imgPath(src) {
    if (window.location.pathname.includes('/pages/')) return '../' + src;
    return src;
}

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

// Cart icon SVG
const cartSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';

function initNavbar() {
    const navbar = $('.navbar');
    if (!navbar) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 60) navbar.style.padding = '0.75rem 0';
        else navbar.style.padding = '1rem 0';
    });
}

function saveCart() { localStorage.setItem('aloeflex_cart', JSON.stringify(cart)); }

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
    saveCart(); updateCartCount(); renderCartItems();
    showNotification(product.name + ' added to cart');
}

function removeFromCart(id) {
    cart = cart.filter(c => c.id !== id);
    saveCart(); updateCartCount(); renderCartItems();
}

function changeQty(id, delta) {
    const item = cart.find(c => c.id === id);
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) removeFromCart(id);
    else { saveCart(); updateCartCount(); renderCartItems(); }
}

function renderCartItems() {
    const container = $('.cart-items');
    if (!container) return;
    if (cart.length === 0) {
        container.innerHTML = '<div class="cart-empty"><p style="font-size:1.1rem;font-weight:600;margin-bottom:0.5rem">Your cart is empty</p><p style="font-size:0.85rem">Add some products to get started</p></div>';
        updateCartTotal(); return;
    }
    container.innerHTML = cart.map(item => `
    <div class="cart-item" data-id="${item.id}">
      <div class="cart-item-img"><img src="${imgPath(item.img)}" alt="${item.name}"></div>
      <div class="cart-item-info">
        <div class="cart-item-name">${item.name}</div>
        <div class="cart-item-price">$${(item.price * item.qty).toFixed(2)}</div>
        <div class="cart-item-qty">
          <button class="qty-btn" onclick="changeQty(${item.id}, -1)">-</button>
          <span class="qty-num">${item.qty}</span>
          <button class="qty-btn" onclick="changeQty(${item.id}, 1)">+</button>
        </div>
      </div>
      <button class="cart-item-remove" onclick="removeFromCart(${item.id})">X</button>
    </div>`).join('');
    updateCartTotal();
}

function updateCartTotal() {
    const total = cart.reduce((acc, item) => acc + item.price * item.qty, 0);
    const el = $('.cart-total-amount');
    if (el) el.textContent = '$' + total.toFixed(2);
}

function openCart() {
    const o = $('.cart-overlay'); const s = $('.cart-sidebar');
    if (o) o.classList.add('open');
    if (s) s.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    const o = $('.cart-overlay'); const s = $('.cart-sidebar');
    if (o) o.classList.remove('open');
    if (s) s.classList.remove('open');
    document.body.style.overflow = '';
}

function initCart() {
    renderCartItems(); updateCartCount();
    $$('.cart-btn').forEach(btn => btn.addEventListener('click', openCart));
    const overlay = $('.cart-overlay');
    const closeBtn = $('.cart-close');
    if (overlay) overlay.addEventListener('click', closeCart);
    if (closeBtn) closeBtn.addEventListener('click', closeCart);
    const checkoutBtn = $('.checkout-btn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) { showNotification('Your cart is empty'); return; }
        showNotification('Checkout coming soon! Thank you.');
    });
}

function showNotification(msg) {
    let notif = $('.notification');
    if (!notif) {
        notif = document.createElement('div');
        notif.className = 'notification';
        document.body.appendChild(notif);
    }
    notif.textContent = msg;
    notif.classList.add('show');
    setTimeout(() => notif.classList.remove('show'), 3500);
}

function renderProducts(filter = 'all') {
    const grid = $('.products-grid');
    if (!grid) return;
    const filtered = filter === 'all' ? products : products.filter(p => p.category === filter);
    grid.innerHTML = filtered.map(p => `
    <div class="product-card" data-aos>
      <div class="product-img">
        <div class="product-img-bg"></div>
        ${p.badge ? '<span class="product-badge-new">' + p.badge + '</span>' : ''}
        <button class="product-wishlist" onclick="toggleWishlist(this)"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></button>
        <img src="${imgPath(p.img)}" alt="${p.name}">
      </div>
      <div class="product-info">
        <h4>${p.name}</h4>
        <div class="product-meta">${p.desc}</div>
        <div class="product-stars">${'&#9733;'.repeat(Math.floor(p.rating))}${'&#9734;'.repeat(5 - Math.floor(p.rating))} <span class="rc">${p.rating} (${p.reviews} reviews)</span></div>
        <div class="product-footer">
          <div class="product-price">$${p.price}</div>
          <button class="product-add" onclick="addToCart(${p.id})" title="Add to Cart">+</button>
        </div>
      </div>
    </div>`).join('');
    setTimeout(() => {
        $$('.product-card[data-aos]').forEach((card, i) => {
            card.style.opacity = '0'; card.style.transform = 'translateY(20px)';
            card.style.transition = 'opacity 0.4s ease ' + (i * 0.07) + 's, transform 0.4s ease ' + (i * 0.07) + 's';
            setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 50);
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
    el.classList.toggle('liked');
}

function initMobileNav() {
    const hamburger = $('.hamburger');
    const mobileNav = $('.mobile-nav');
    const mobileClose = $('.mobile-nav-close');
    if (!hamburger || !mobileNav) return;
    hamburger.addEventListener('click', () => mobileNav.classList.add('open'));
    if (mobileClose) mobileClose.addEventListener('click', () => mobileNav.classList.remove('open'));
    $$('.mobile-nav a').forEach(a => a.addEventListener('click', () => mobileNav.classList.remove('open')));
}

function initScrollTop() {
    const btn = $('.scroll-top');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) btn.classList.add('visible');
        else btn.classList.remove('visible');
    });
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.style.opacity = '1'; entry.target.style.transform = 'translateY(0)'; }
        });
    }, { threshold: 0.1 });
    $$('.feature-card, .how-step, .testimonial-card, .detail-list-item, .about-stat-card, .swot-card').forEach(el => {
        el.style.opacity = '0'; el.style.transform = 'translateY(24px)';
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}

function initTrustTicker() {
    const track = $('.trust-scroll');
    if (!track) return;
    track.innerHTML += track.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
    initNavbar(); initCart(); renderProducts(); initFilters();
    initMobileNav(); initScrollTop(); initScrollAnimations(); initTrustTicker();
});

window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.changeQty = changeQty;
window.openCart = openCart;
window.closeCart = closeCart;
window.toggleWishlist = toggleWishlist;