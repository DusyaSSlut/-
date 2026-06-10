let products = [];
let currentCategory = 'all';

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = '<div class="loading">Загрузка...</div>';
    
    try {
        await initSupabase();
        products = await getProducts();
        console.log('Товаров получено:', products.length);
        
        if (!products || products.length === 0) {
            grid.innerHTML = '<div class="empty-message">Товары не найдены. Добавьте их через админ-панель.</div>';
            return;
        }
        
        applyFilters();
    } catch (error) {
        console.error('Ошибка:', error);
        grid.innerHTML = '<div class="empty-message">Ошибка подключения к базе данных. Проверьте настройки Supabase.</div>';
    }
}

function applyFilters() {
    let filtered = products;
    if (currentCategory !== 'all') {
        filtered = products.filter(p => p.category === currentCategory);
    }
    
    const grid = document.getElementById('productsGrid');
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-message">Товары не найдены</div>';
        return;
    }
    
    grid.innerHTML = filtered.map(p => {
        const discountPrice = p.discount ? Math.round(p.price * (100 - p.discount) / 100) : p.price;
        return `
            <div class="product-card">
                <img src="${p.img}" class="product-img" onerror="this.src='https://placehold.co/400x200/e0e0e0/999?text=Фото'">
                <div class="product-info">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                        <h3 class="product-title">${escapeHtml(p.name)}</h3>
                        ${p.discount ? `<span style="background:#ff4757;color:#fff;padding:4px 10px;border-radius:20px;font-size:0.7rem;font-weight:bold;">-${p.discount}%</span>` : ''}
                    </div>
                    <div class="product-price">
                        ${p.discount ? `<span style="text-decoration:line-through;color:#999;font-size:1rem;">${p.price.toLocaleString()} ₽</span>` : ''}
                        <span style="font-size:1.3rem;font-weight:700;color:${p.discount ? '#e67e22' : 'var(--medium-teal)'};margin-left:8px;">${discountPrice.toLocaleString()}KGS</span>
                    </div>
                    <button class="product-btn" onclick="handleAddToCart(${p.id})">В корзину</button>
                </div>
            </div>
        `;
    }).join('');
}


function searchProducts() {
    const searchInput = document.querySelector('.search-input');
    if (!searchInput) return;
    
    const query = searchInput.value.toLowerCase();
    const filtered = products.filter(p => p.name.toLowerCase().includes(query));
    const grid = document.getElementById('productsGrid');
    
    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-message">Ничего не найдено</div>';
        return;
    }
    
    grid.innerHTML = filtered.map(p => `
        <div class="product-card">
            <img src="${p.img}" class="product-img" onerror="this.src='https://placehold.co/400x200/e0e0e0/999?text=Фото'">
            <div class="product-info">
                <h3 class="product-title">${escapeHtml(p.name)}</h3>
                <div class="product-price">${p.price.toLocaleString()} ₽</div>
                <button class="product-btn" onclick="handleAddToCart(${p.id})">В корзину</button>
            </div>
        </div>
    `).join('');
}


function clearSearch() {
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.value = '';
    }
    applyFilters();
}

async function handleAddToCart(productId) {
    await initSupabase();
    const saved = localStorage.getItem('technomir_user');
    if (!saved) {
        window.location.href = 'login.html';
        return;
    }
    
    const success = await addToCart(productId);
    if (success) {
        showAddToCartToast();
    }
}


function showAddToCartToast() {
    let toast = document.getElementById('cartToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'cartToast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #3AAFA9;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            display: none;
            animation: slideIn 0.3s ease;
        `;
        document.body.appendChild(toast);
        
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    toast.textContent = 'Товар добавлен в корзину!';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function setupFilters() {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.cat;
            applyFilters();
            
            const newUrl = currentCategory === 'all' ? 'catalog.html' : `catalog.html?category=${currentCategory}`;
            window.history.pushState({}, '', newUrl);
        });
    });
}

function setupSearch() {
    const searchBtn = document.querySelector('.search-btn');
    const searchInput = document.querySelector('.search-input');
    const clearBtn = document.querySelector('.clear-btn');
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchProducts);
    }
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                searchProducts();
            }
        });
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', clearSearch);
    }
}

function initCatalog() {
    loadProducts();
    setupFilters();
    setupSearch();
    
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    if (categoryFromUrl) {
        currentCategory = categoryFromUrl;
        const activeBtn = document.querySelector(`.filter-btn[data-cat="${categoryFromUrl}"]`);
        if (activeBtn) activeBtn.classList.add('active');
    }
}

document.addEventListener('DOMContentLoaded', initCatalog);