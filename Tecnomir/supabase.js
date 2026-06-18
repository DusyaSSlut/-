const SUPABASE_URL = 'https://dtamewvkovpqpmtmcnhw.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0YW1ld3Zrb3ZwcXBtdG1jbmh3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwMTQxNTIsImV4cCI6MjA5MTU5MDE1Mn0.wruJ5hUvyBYBydE_A_xJ7ioK4-9JgNwbWHm_svUh4as';

let supabaseClient = null;
let currentUser = null;

window.currentUser = null;


async function initSupabase() {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    const saved = localStorage.getItem('technomir_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        window.currentUser = currentUser;  
        console.log('Пользователь загружен:', currentUser?.email);
    }
    return supabaseClient;
}


async function login(email, password) {
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('email', email)
        .eq('password', password)
        .single();
    if (error || !data) return false;
    currentUser = data;
    window.currentUser = data; 
    localStorage.setItem('technomir_user', JSON.stringify(data));
    return true;
}

function setCurrentUser(user) {
    currentUser = user;
    window.currentUser = user;  
}

async function getProducts() {
    const { data, error } = await supabaseClient.from('products').select('*').order('id');
    return error ? [] : data;
}

async function addProduct(p) {
    const { data, error } = await supabaseClient.from('products').insert([p]).select();
    return error ? null : data[0];
}

async function updateProduct(id, u) {
    const { error } = await supabaseClient.from('products').update(u).eq('id', id);
    return !error;
}

async function deleteProduct(id) {
    const { error } = await supabaseClient.from('products').delete().eq('id', id);
    return !error;
}

async function getSiteSettings() {
    const { data, error } = await supabaseClient.from('site_settings').select('*');
    return error ? [] : data;
}

async function updateSiteSetting(key, value) {
    const { error } = await supabaseClient.from('site_settings').update({ value }).eq('key', key);
    return !error;
}

async function getCarousel() {
    const { data, error } = await supabaseClient.from('carousel').select('*').order('sort_order');
    return error ? [] : data;
}

async function updateCarouselItem(id, u) {
    const { error } = await supabaseClient.from('carousel').update(u).eq('id', id);
    return !error;
}

async function addCarouselItem(item) {
    const { data, error } = await supabaseClient.from('carousel').insert([item]).select();
    return error ? null : data[0];
}

async function deleteCarouselItem(id) {
    const { error } = await supabaseClient.from('carousel').delete().eq('id', id);
    return !error;
}

async function updateProductDiscount(id, discount) {
    const { error } = await supabaseClient.from('products').update({ discount: discount }).eq('id', id);
    return !error;
}


async function getCart() {
    if (!currentUser) return [];
    const { data, error } = await supabaseClient
        .from('cart')
        .select('*, products(*)')
        .eq('user_id', currentUser.id);
    console.log('Корзина из БД:', data);
    return error ? [] : data;
}

async function addToCart(productId, quantity = 1) {
    if (!currentUser) {
        console.log('Нет пользователя');
        alert('Войдите в аккаунт');
        return false;
    }
    
    console.log('Добавляем товар:', productId, 'пользователь:', currentUser.id);
    
    const { data, error } = await supabaseClient
        .from('cart')
        .insert([{ user_id: currentUser.id, product_id: productId, quantity }])
        .select();
    
    if (error) {
        console.error('Ошибка добавления:', error);
        alert('Ошибка: ' + error.message);
        return false;
    }
    
    console.log('Товар добавлен:', data);
    return true;
}

async function updateCartItem(id, quantity) {
    const { error } = await supabaseClient
        .from('cart')
        .update({ quantity })
        .eq('id', id);
    return !error;
}

async function removeFromCart(id) {
    const { error } = await supabaseClient
        .from('cart')
        .delete()
        .eq('id', id);
    return !error;
}

async function clearCart() {
    if (!currentUser) return false;
    const { error } = await supabaseClient
        .from('cart')
        .delete()
        .eq('user_id', currentUser.id);
    return !error;
}

async function getCartCount() {
    if (!currentUser) return 0;
    const { data, error } = await supabaseClient
        .from('cart')
        .select('id')
        .eq('user_id', currentUser.id);
    return error ? 0 : data.length;
}

function setCurrentUser(user) {
    currentUser = user;
    window.currentUser = user;
}

async function login(loginValue, password) {
    console.log('Попытка входа:', loginValue);
    
    const { data, error } = await supabaseClient
        .from('users')
        .select('*')
        .or(`email.eq.${loginValue},username.eq.${loginValue}`)
        .eq('password', password);
    
    if (error || !data || data.length === 0) {
        return false;
    }
    
    const user = data[0];
    currentUser = user;
    window.currentUser = user;
    localStorage.setItem('technomir_user', JSON.stringify(user));
    return true;
}