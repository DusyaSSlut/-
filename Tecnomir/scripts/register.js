const registerBtn = document.getElementById('registerBtn');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmInput = document.getElementById('confirmPassword');
const errorMsg = document.getElementById('errorMsg');
const successMsg = document.getElementById('successMsg');

const usernameHint = document.getElementById('usernameHint');
const emailHint = document.getElementById('emailHint');
const passwordHint = document.getElementById('passwordHint');
const confirmHint = document.getElementById('confirmHint');

const strengthBar = document.createElement('div');
strengthBar.className = 'password-strength';
strengthBar.innerHTML = '<div class="bar" id="strengthBarInner"></div>';
passwordInput.parentNode.insertBefore(strengthBar, passwordInput.nextSibling);
const strengthBarInner = document.getElementById('strengthBarInner');

usernameInput.addEventListener('input', function() {
    const value = this.value.trim();
    const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(value);
    if (value.length === 0) {
        this.className = '';
        usernameHint.textContent = 'Только буквы, цифры и _ (3-20 символов)';
        usernameHint.className = 'hint';
        return;
    }
    if (isValid) {
        this.className = 'valid';
        usernameHint.textContent = 'Отличный логин!';
        usernameHint.className = 'hint success';
    } else {
        this.className = 'invalid';
        if (value.length < 3) {
            usernameHint.textContent = 'Минимум 3 символа';
        } else if (value.length > 20) {
            usernameHint.textContent = 'Максимум 20 символов';
        } else {
            usernameHint.textContent = 'Только буквы, цифры и _';
        }
        usernameHint.className = 'hint error';
    }
});

emailInput.addEventListener('input', function() {
    const value = this.value.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    if (value.length === 0) {
        this.className = '';
        emailHint.textContent = 'Введите корректный email';
        emailHint.className = 'hint';
        return;
    }
    if (isValid) {
        this.className = 'valid';
        emailHint.textContent = 'Email корректный';
        emailHint.className = 'hint success';
    } else {
        this.className = 'invalid';
        emailHint.textContent = 'Введите корректный email (example@mail.com)';
        emailHint.className = 'hint error';
    }
});

function checkPasswordStrength(password) {
    let score = 0;
    if (password.length >= 6) score++;
    if (password.length >= 10) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;
    return score;
}

passwordInput.addEventListener('input', function() {
    const value = this.value;
    const strength = checkPasswordStrength(value);
    if (value.length === 0) {
        strengthBarInner.style.width = '0%';
        strengthBarInner.className = 'bar';
        passwordHint.textContent = 'Минимум 6 символов, буквы и цифры';
        passwordHint.className = 'hint';
        this.className = '';
        return;
    }
    if (value.length < 6) {
        this.className = 'invalid';
        passwordHint.textContent = 'Минимум 6 символов';
        passwordHint.className = 'hint error';
        strengthBarInner.style.width = '20%';
        strengthBarInner.className = 'bar weak';
        return;
    }
    const commonPasswords = ['123456', 'password', 'qwerty', 'admin', 'letmein', 'welcome'];
    if (commonPasswords.includes(value.toLowerCase())) {
        this.className = 'invalid';
        passwordHint.textContent = 'Слишком простой пароль';
        passwordHint.className = 'hint error';
        strengthBarInner.style.width = '30%';
        strengthBarInner.className = 'bar weak';
        return;
    }
    this.className = 'valid';
    if (strength <= 2) {
        strengthBarInner.style.width = '40%';
        strengthBarInner.className = 'bar weak';
        passwordHint.textContent = 'Слабый пароль';
        passwordHint.className = 'hint';
    } else if (strength <= 3) {
        strengthBarInner.style.width = '66%';
        strengthBarInner.className = 'bar medium';
        passwordHint.textContent = 'Средний пароль';
        passwordHint.className = 'hint success';
    } else {
        strengthBarInner.style.width = '100%';
        strengthBarInner.className = 'bar strong';
        passwordHint.textContent = 'Сильный пароль!';
        passwordHint.className = 'hint success';
    }
});

confirmInput.addEventListener('input', function() {
    const password = passwordInput.value;
    const value = this.value;
    if (value.length === 0) {
        this.className = '';
        confirmHint.textContent = 'Пароли должны совпадать';
        confirmHint.className = 'hint';
        return;
    }
    if (value === password && password.length > 0) {
        this.className = 'valid';
        confirmHint.textContent = 'Пароли совпадают';
        confirmHint.className = 'hint success';
    } else {
        this.className = 'invalid';
        confirmHint.textContent = 'Пароли не совпадают';
        confirmHint.className = 'hint error';
    }
});

function getIP() {
    return new Promise((resolve) => {
        fetch('https://api.ipify.org?format=json')
            .then(response => response.json())
            .then(data => resolve(data.ip))
            .catch(() => resolve('unknown'));
    });
}

async function checkRegistrationLimit(ip) {
    try {
        const { data: settings } = await supabaseClient
            .from('site_settings')
            .select('value')
            .eq('key', 'max_accounts_per_ip');
        const maxAccounts = parseInt(settings?.[0]?.value || '3');
        const { data: users, error } = await supabaseClient
            .from('users')
            .select('id')
            .eq('ip_address', ip)
            .eq('is_active', true)
            .is('deleted_at', null);
        if (error) {
            console.error('Ошибка проверки лимита:', error);
            return { allowed: true };
        }
        const count = users?.length || 0;
        if (count >= maxAccounts) {
            return {
                allowed: false,
                message: 'С этого IP адреса уже зарегистрировано максимальное количество аккаунтов (' + maxAccounts + '). Вы не можете создать больше.',
                maxAccounts: maxAccounts
            };
        }
        return { allowed: true, current: count, max: maxAccounts };
    } catch (err) {
        console.error('Ошибка проверки лимита:', err);
        return { allowed: true };
    }
}

async function doRegister() {
    const username = usernameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    const confirm = confirmInput.value;
    errorMsg.classList.remove('show');
    successMsg.classList.remove('show');
    errorMsg.innerText = '';
    successMsg.innerText = '';
    if (!username) {
        showError('Введите логин');
        usernameInput.focus();
        return;
    }
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        showError('Логин: 3-20 символов, только буквы, цифры и _');
        usernameInput.focus();
        return;
    }
    if (!email) {
        showError('Введите email');
        emailInput.focus();
        return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError('Введите корректный email (example@mail.com)');
        emailInput.focus();
        return;
    }
    if (!password) {
        showError('Введите пароль');
        passwordInput.focus();
        return;
    }
    if (password.length < 6) {
        showError('Пароль должен быть не менее 6 символов');
        passwordInput.focus();
        return;
    }
    const commonPasswords = ['123456', 'password', 'qwerty', 'admin', 'letmein', 'welcome'];
    if (commonPasswords.includes(password.toLowerCase())) {
        showError('Слишком простой пароль!');
        passwordInput.focus();
        return;
    }
    if (password !== confirm) {
        showError('Пароли не совпадают');
        confirmInput.focus();
        return;
    }
    registerBtn.disabled = true;
    registerBtn.textContent = 'Проверка...';
    try {
        await initSupabase();
        if (!supabaseClient) {
            showError('Ошибка подключения к базе данных');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Зарегистрироваться';
            return;
        }
        const ip = await getIP();
        console.log('IP адрес:', ip);
        const limitCheck = await checkRegistrationLimit(ip);
        if (!limitCheck.allowed) {
            showError(limitCheck.message);
            registerBtn.disabled = false;
            registerBtn.textContent = 'Зарегистрироваться';
            return;
        }
        registerBtn.textContent = 'Регистрация...';
        const { data: existingUsername } = await supabaseClient
            .from('users')
            .select('username')
            .eq('username', username);
        if (existingUsername && existingUsername.length > 0) {
            showError('Этот логин уже занят');
            usernameInput.focus();
            usernameInput.className = 'invalid';
            registerBtn.disabled = false;
            registerBtn.textContent = 'Зарегистрироваться';
            return;
        }
        const { data: existingEmail } = await supabaseClient
            .from('users')
            .select('email')
            .eq('email', email);
        if (existingEmail && existingEmail.length > 0) {
            showError('Этот email уже зарегистрирован');
            emailInput.focus();
            emailInput.className = 'invalid';
            registerBtn.disabled = false;
            registerBtn.textContent = 'Зарегистрироваться';
            return;
        }
        const userAgent = navigator.userAgent || 'unknown';
        const { data, error } = await supabaseClient
            .from('users')
            .insert([{
                username: username,
                email: email,
                password: password,
                role: 'user',
                ip_address: ip,
                user_agent: userAgent,
                registered_at: new Date().toISOString(),
                is_active: true
            }])
            .select();
        if (error) {
            console.error('Ошибка регистрации:', error);
            showError('Ошибка: ' + error.message);
            registerBtn.disabled = false;
            registerBtn.textContent = 'Зарегистрироваться';
            return;
        }
        const { data: ipRecord } = await supabaseClient
            .from('ip_registrations')
            .select('id, count')
            .eq('ip_address', ip);
        if (ipRecord && ipRecord.length > 0) {
            await supabaseClient
                .from('ip_registrations')
                .update({ count: ipRecord[0].count + 1, updated_at: new Date().toISOString() })
                .eq('id', ipRecord[0].id);
        } else {
            await supabaseClient
                .from('ip_registrations')
                .insert([{ ip_address: ip, count: 1 }]);
        }
        const newUser = data[0];
        localStorage.setItem('technomir_user', JSON.stringify(newUser));
        successMsg.innerText = 'Регистрация успешна! Перенаправление...';
        successMsg.classList.add('show');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    } catch (err) {
        console.error('Ошибка:', err);
        showError('Произошла ошибка. Попробуйте позже.');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Зарегистрироваться';
    }
}

function showError(message) {
    errorMsg.innerText = message;
    errorMsg.classList.add('show');
    document.querySelector('.register-box').style.animation = 'shake 0.5s ease';
    setTimeout(() => {
        document.querySelector('.register-box').style.animation = '';
    }, 500);
}

if (!document.getElementById('shakeStyle')) {
    const styleShake = document.createElement('style');
    styleShake.id = 'shakeStyle';
    styleShake.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20% { transform: translateX(-10px); }
            40% { transform: translateX(10px); }
            60% { transform: translateX(-10px); }
            80% { transform: translateX(10px); }
        }
    `;
    document.head.appendChild(styleShake);
}

registerBtn.onclick = doRegister;

usernameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        emailInput.focus();
    }
});

emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        passwordInput.focus();
    }
});

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        confirmInput.focus();
    }
});

confirmInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        doRegister();
    }
});

document.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', () => {
        errorMsg.classList.remove('show');
    });
});

async function checkAlreadyLoggedIn() {
    await initSupabase();
    const saved = localStorage.getItem('technomir_user');
    if (saved) {
        const user = JSON.parse(saved);
        if (user.role === 'admin') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'index.html';
        }
    }
}

document.addEventListener('DOMContentLoaded', checkAlreadyLoggedIn);