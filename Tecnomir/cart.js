let cartItems = [];
function showToast(message, isError = false) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #17252A;
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            z-index: 9999;
            display: none;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.style.backgroundColor = isError ? '#ff4757' : '#17252A';
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2000);
}

async function loadCart() {
    const container = document.getElementById('cartContent');
    if (!container) return;
    
    container.innerHTML = '<div style="text-align:center;padding:40px;">⏳ Загрузка корзины...</div>';
    
    try {
        await initSupabase();
        
        if (!currentUser) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px;background:white;border-radius:16px;">
                    <h2>Войдите в аккаунт</h2>
                    <p>Чтобы увидеть корзину, авторизуйтесь</p>
                    <a href="login.html" style="display:inline-block;margin-top:15px;padding:12px 25px;background:#17252A;color:white;text-decoration:none;border-radius:8px;">Войти</a>
                </div>
            `;
            return;
        }
        
        cartItems = await getCart();
        console.log('Товаров в корзине:', cartItems.length);
        
        if (!cartItems || cartItems.length === 0) {
            container.innerHTML = `
                <div style="text-align:center;padding:60px;background:white;border-radius:16px;">
                    <h2>Корзина пуста</h2>
                    <p>Добавьте товары из каталога</p>
                    <a href="catalog.html" style="display:inline-block;margin-top:15px;padding:12px 25px;background:#17252A;color:white;text-decoration:none;border-radius:8px;">Перейти в каталог</a>
                </div>
            `;
            return;
        }
        
        renderCart();
        
    } catch (error) {
        console.error('Ошибка:', error);
        container.innerHTML = `
            <div style="text-align:center;padding:60px;background:white;border-radius:16px;">
                <h2>Ошибка загрузки</h2>
                <p>Не удалось загрузить корзину</p>
                <button onclick="location.reload()" style="margin-top:15px;padding:12px 25px;background:#17252A;color:white;border:none;border-radius:8px;cursor:pointer;">Обновить</button>
            </div>
        `;
    }
}

function renderCart() {
    const container = document.getElementById('cartContent');
    let total = 0;
    
    const itemsHtml = cartItems.map(item => {
        const product = item.products;
        if (!product) return '';
        
        const discountPrice = product.discount && product.discount > 0 
            ? Math.round(product.price * (100 - product.discount) / 100)
            : product.price;
        const itemTotal = discountPrice * item.quantity;
        total += itemTotal;
        
        return `
            <tr>
                <td style="width:80px;"><img src="${product.img || 'https://placehold.co/60x60'}" style="width:60px;height:60px;object-fit:cover;border-radius:8px;" onerror="this.src='https://placehold.co/60x60'"></td>
                <td><strong>${escapeHtml(product.name)}</strong>${product.discount ? `<span style="margin-left:10px;background:#ff4757;color:#fff;padding:2px 8px;border-radius:12px;font-size:0.7rem;">-${product.discount}%</span>` : ''}</td>
                <td>${discountPrice.toLocaleString()} KGS</td>
                <td><input type="number" value="${item.quantity}" min="1" style="width:70px;padding:8px;border:1px solid #ddd;border-radius:8px;text-align:center;" onchange="updateQty(${item.id}, this.value)"></td>
                <td><strong>${itemTotal.toLocaleString()} KGS</strong></td>
                <td><button onclick="removeItem(${item.id})" style="background:none;border:none;color:#ff4757;cursor:pointer;font-size:1.2rem;">🗑️</button></td>
            </tr>
        `;
    }).join('');
    
    container.innerHTML = `
        <table style="width:100%;background:white;border-radius:16px;border-collapse:collapse;overflow:hidden;">
            <thead>
                <tr style="background:#f9f9f9;">
                    <th style="padding:15px;text-align:left;">Товар</th>
                    <th style="padding:15px;text-align:left;">Название</th>
                    <th style="padding:15px;text-align:left;">Цена</th>
                    <th style="padding:15px;text-align:left;">Кол-во</th>
                    <th style="padding:15px;text-align:left;">Сумма</th>
                    <th style="padding:15px;text-align:left;"></th>
                </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
        </table>
        <div style="text-align:right;margin-top:30px;padding:20px;background:white;border-radius:16px;">
            <h3>Итого: <span style="font-size:2rem;color:#e67e22;">${total.toLocaleString()} KGS</span></h3>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:20px;gap:10px;flex-wrap:wrap;">
            <a href="catalog.html" style="background:#17252A;color:white;padding:12px 25px;border-radius:8px;text-decoration:none;">📦 Продолжить покупки</a>
            <div>
                <button onclick="clearAllCart()" style="background:#ff4757;color:white;padding:12px 25px;border:none;border-radius:8px;cursor:pointer;">🗑️ Очистить</button>
                <button onclick="checkout()" style="background:#3AAFA9;color:white;padding:12px 25px;border:none;border-radius:8px;cursor:pointer;margin-left:10px;">✅ Оформить заказ</button>
            </div>
        </div>
    `;
}

async function updateQty(cartId, quantity) {
    const newQty = parseInt(quantity);
    if (newQty < 1) {
        showToast('Количество не может быть меньше 1', true);
        return;
    }
    
    const success = await updateCartItem(cartId, newQty);
    if (success) {
        showToast('Количество обновлено');
        await loadCart();
    } else {
        showToast('Ошибка обновления', true);
    }
}

async function removeItem(cartId) {
    const success = await removeFromCart(cartId);
    if (success) {
        showToast('Товар удалён');
        await loadCart();
    } else {
        showToast('Ошибка удаления', true);
    }
}

async function clearAllCart() {
    if (cartItems.length === 0) {
        showToast('🛍️ Корзина уже пуста', true);
        return;
    }
    
    const success = await clearCart();
    if (success) {
        showToast('Корзина очищена');
        await loadCart();
    } else {
        showToast('Ошибка очистки', true);
    }
}

async function checkout() {
    if (!cartItems.length) {
        showToast('Корзина пуста', true);
        return;
    }
    
    let total = 0;
    const items = [];
    
    cartItems.forEach(item => {
        const product = item.products;
        const discountPrice = product.discount && product.discount > 0 
            ? Math.round(product.price * (100 - product.discount) / 100)
            : product.price;
        total += discountPrice * item.quantity;
        
        items.push({
            product_id: product.id,
            name: product.name,
            price: discountPrice,
            quantity: item.quantity,
            img: product.img || 'https://placehold.co/280x160?text=Нет+фото'
        });
    });
    
    const orderNumber = 'ORD-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    const { error: orderError } = await supabaseClient
        .from('orders')
        .insert([{
            user_id: currentUser.id,
            order_number: orderNumber,
            total_amount: total,
            status: 'новый',
            items: items
        }]);
    
    if (orderError) {
        console.error('Ошибка сохранения заказа:', orderError);
        showToast('Ошибка оформления заказа', true);
        return;
    }

    await supabaseClient.from('cart').delete().eq('user_id', currentUser.id);
    
    showToast(` Заказ оформлен! Номер: ${orderNumber}`);
  
    showOrderSuccessModal(total, orderNumber);
    setTimeout(() => {
        loadCart();
    }, 1500);
}

function showOrderSuccessModal(total, orderNumber) {
    const modal = document.createElement('div');
    modal.id = 'orderSuccessModal';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 10002;
    `;
    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 20px;
            padding: 35px;
            max-width: 380px;
            width: 90%;
            text-align: center;
            animation: modalFadeIn 0.3s ease;
        ">
            <div style="font-size: 64px; margin-bottom: 15px;"></div>
            <h2 style="color: #17252A; margin-bottom: 10px;">Заказ оформлен!</h2>
            <p style="color: #666; margin-bottom: 5px;">Номер заказа:</p>
            <p style="font-size: 16px; font-weight: bold; color: #3AAFA9; margin-bottom: 15px;">${orderNumber}</p>
            <p style="font-size: 28px; font-weight: bold; color: #e67e22; margin-bottom: 20px;">${total.toLocaleString()} KGS</p>
            <p style="color: #666; margin-bottom: 25px;">Спасибо за покупку!</p>
            <div style="display: flex; gap: 15px; justify-content: center;">
                <button onclick="window.location.href='orders.html'" style="
                    background: #3AAFA9;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: bold;
                ">Мои заказы</button>
                <button onclick="closeOrderModal()" style="
                    background: #17252A;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 30px;
                    cursor: pointer;
                    font-weight: bold;
                ">Закрыть</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
        closeOrderModal();
    }, 5000);
}

function closeOrderModal() {
    const modal = document.getElementById('orderSuccessModal');
    if (modal) modal.remove();
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
}

document.addEventListener('DOMContentLoaded', loadCart);