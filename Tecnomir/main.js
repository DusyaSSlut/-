// main.js - все скрипты для главной страницы

// ===== КАРУСЕЛЬ =====
let currentIndex = 0;
let autoPlayInterval;

function initCarousel() {
    const track = document.getElementById('carouselTrack');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.querySelector('.carousel-arrow.prev');
    const nextBtn = document.querySelector('.carousel-arrow.next');
    const dots = document.querySelectorAll('.dot');
    
    if (!track || !slides.length) return;
    
    function updateCarousel() {
        if (!track) return;
        track.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === currentIndex);
        });
    }
    
    function nextSlide() {
        currentIndex = (currentIndex + 1) % slides.length;
        updateCarousel();
    }
    
    function prevSlide() {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length;
        updateCarousel();
    }
    
    if (prevBtn) prevBtn.onclick = prevSlide;
    if (nextBtn) nextBtn.onclick = nextSlide;
    
    dots.forEach((dot, i) => {
        dot.onclick = () => {
            currentIndex = i;
            updateCarousel();
        };
    });
    
    autoPlayInterval = setInterval(nextSlide, 5000);
    
    const wrapper = document.querySelector('.carousel-wrapper');
    if (wrapper) {
        wrapper.onmouseenter = () => clearInterval(autoPlayInterval);
        wrapper.onmouseleave = () => {
            autoPlayInterval = setInterval(nextSlide, 5000);
        };
    }
    
    updateCarousel();
}

// ===== АВТОРИЗАЦИЯ =====
async function checkAuth() {
    await initSupabase();
    const saved = localStorage.getItem('technomir_user');
    const currentUser = saved ? JSON.parse(saved) : null;
    
    if (currentUser) {
        const loginBtn = document.getElementById('loginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'block';
        
        if (currentUser.role === 'admin') {
            document.body.insertAdjacentHTML('beforeend', 
                '<div style="position:fixed;top:20px;right:20px;background:#3AAFA9;color:#fff;padding:5px 15px;border-radius:20px;font-size:12px;z-index:9999;">Админ</div>'
            );
        }
    }
}

window.logout = function() {
    localStorage.removeItem('technomir_user');
    location.reload();
};

// ===== ЗАГРУЗКА НАСТРОЕК САЙТА =====
async function loadMainPage() {
    await initSupabase();
    
    // Загружаем настройки
    const { data: settings } = await supabaseClient.from('site_settings').select('*');
    if (settings) {
        settings.forEach(s => {
            if (s.key === 'color_dark') document.documentElement.style.setProperty('--dark-blue', s.value);
            if (s.key === 'color_deep') document.documentElement.style.setProperty('--deep-teal', s.value);
            if (s.key === 'color_medium') document.documentElement.style.setProperty('--medium-teal', s.value);
            if (s.key === 'color_light') document.documentElement.style.setProperty('--light-teal', s.value);
            if (s.key === 'color_white') document.documentElement.style.setProperty('--white', s.value);
            
            if (s.key === 'carousel_title') {
                const el = document.querySelector('.categories-carousel .section-title');
                if (el) el.innerText = s.value;
            }
            if (s.key === 'phone1') {
                const phones = document.querySelectorAll('.contact-phone');
                if (phones[0]) phones[0].innerText = s.value;
            }
            if (s.key === 'phone2') {
                const phones = document.querySelectorAll('.contact-phone');
                if (phones[1]) phones[1].innerText = s.value;
            }
            if (s.key === 'contact_email') {
                const emailEl = document.querySelector('.contact-email');
                if (emailEl) emailEl.innerText = s.value;
            }
            if (s.key === 'copyright') {
                const el = document.querySelector('.footer-bottom p');
                if (el) el.innerText = s.value;
            }
        });
    }
    
    // Загружаем карусель
    const { data: carousel } = await supabaseClient.from('carousel').select('*').order('sort_order');
    const slideElements = document.querySelectorAll('.carousel-slide');
    if (carousel) {
        carousel.forEach((slide, i) => {
            if (slideElements[i]) {
                const title = slideElements[i].querySelector('.slide-content h3');
                const text = slideElements[i].querySelector('.slide-content p');
                const img = slideElements[i].querySelector('img');
                if (title) title.innerText = slide.title;
                if (text) text.innerText = slide.text;
                if (img) img.src = slide.img;
            }
        });
    }
}

// ===== ДОБАВЛЕНИЕ В КОРЗИНУ =====
async function handleAddToCart(productId) {
    await initSupabase();
    const saved = localStorage.getItem('technomir_user');
    if (!saved) {
        window.location.href = 'login.html';
        return;
    }
    
    const success = await addToCart(productId);
    if (success) {
        showAddToCartNotification();
    }
}

function showAddToCartNotification() {
    const oldNotif = document.getElementById('cartNotification');
    if (oldNotif) oldNotif.remove();
    
    const notif = document.createElement('div');
    notif.id = 'cartNotification';
    notif.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 24px;">✅</span>
            <span>Товар добавлен в корзину!</span>
        </div>
    `;
    notif.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        background: #17252A;
        color: white;
        padding: 14px 24px;
        border-radius: 12px;
        font-family: system-ui, sans-serif;
        font-size: 14px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        animation: slideInRight 0.3s ease;
        border-left: 4px solid #3AAFA9;
    `;
    
    if (!document.getElementById('notifStyles')) {
        const style = document.createElement('style');
        style.id = 'notifStyles';
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes fadeOut {
                from { opacity: 1; }
                to { opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notif);
    
    setTimeout(() => {
        notif.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => {
            if (notif && notif.remove) notif.remove();
        }, 300);
    }, 2000);
}

// ===== ЗАГРУЗКА СКИДОК =====
async function loadDiscounts() {
    await initSupabase();
    const { data: products } = await supabaseClient.from('products').select('*');
    const discounted = (products || []).filter(p => p.discount > 0).slice(0, 4);
    const grid = document.getElementById('discountGrid');
    
    if (grid) {
        if (discounted.length === 0) {
            grid.innerHTML = '<div style="text-align:center;padding:40px">Нет товаров со скидкой</div>';
            return;
        }
        
        grid.innerHTML = discounted.map(p => {
            const discountPrice = Math.round(p.price * (100 - p.discount) / 100);
            return `
                <div class="product-card">
                    <img src="${p.img}" style="width:100%;height:180px;object-fit:cover" onerror="this.src='https://placehold.co/400x200/e0e0e0/999?text=Фото'">
                    <div class="product-info">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
                            <h3 style="font-size:1rem">${escapeHtml(p.name)}</h3>
                            <span style="background:#ff4757;color:#fff;padding:4px 10px;border-radius:20px;font-size:0.7rem">-${p.discount}%</span>
                        </div>
                        <div>
                            <span style="text-decoration:line-through;color:#999;font-size:0.9rem">${p.price.toLocaleString()} KGS</span>
                            <span style="font-size:1.3rem;font-weight:700;color:#e67e22;margin-left:8px">${discountPrice.toLocaleString()} KGS</span>
                        </div>
                        <button onclick="handleAddToCart(${p.id})" style="width:100%;margin-top:12px;padding:10px;background:#3AAFA9;color:#fff;border:none;border-radius:8px;cursor:pointer">В корзину</button>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadMainPage();
    setTimeout(loadDiscounts, 500);
    initCarousel();
});