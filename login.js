// Şifre bilgisi
const ADMIN_PASSWORD = 'CTE-1881';
const LOGIN_STORAGE_KEY = 'adminLoggedIn';

console.log('Login JS yüklendi');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    console.log('Login sayfası yüklendi');
    
    // Eğer zaten giriş yapılmışsa admin panele yönlendir
    if (isLoggedIn()) {
        window.location.href = 'admin.html';
        return;
    }
    
    setupLoginForm();
});

// Giriş formunu kur
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    const passwordInput = document.getElementById('password');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        attemptLogin();
    });
    
    // Enter tuşu ile gönderim
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            attemptLogin();
        }
    });
    
    // Input focus
    passwordInput.focus();
}

// Giriş denemesi
function attemptLogin() {
    const password = document.getElementById('password').value;
    const loginBtn = document.querySelector('.login-btn');
    
    console.log('Giriş denemesi:', password);
    
    // Loading state
    loginBtn.classList.add('loading');
    
    // Simüle edilmiş gecikme (gerçekçilik için)
    setTimeout(() => {
        if (password === ADMIN_PASSWORD) {
            // Başarılı giriş
            successfulLogin();
        } else {
            // Başarısız giriş
            failedLogin();
        }
        
        loginBtn.classList.remove('loading');
    }, 1000);
}

// Başarılı giriş
function successfulLogin() {
    console.log('Giriş başarılı!');
    
    // Giriş durumunu kaydet
    localStorage.setItem(LOGIN_STORAGE_KEY, 'true');
    localStorage.setItem('loginTime', new Date().toISOString());
    
    // Admin paneline yönlendir
    window.location.href = 'admin.html';
}

// Başarısız giriş
function failedLogin() {
    console.log('Giriş başarısız!');
    
    // Hata bildirimi göster
    showError();
    
    // Input'u temizle ve focus'la
    const passwordInput = document.getElementById('password');
    passwordInput.value = '';
    passwordInput.focus();
    
    // Input'a hata stili ekle
    passwordInput.style.borderColor = '#e74c3c';
    passwordInput.style.background = '#fee';
    
    // 3 saniye sonra hata stilini kaldır
    setTimeout(() => {
        passwordInput.style.borderColor = '';
        passwordInput.style.background = '';
    }, 3000);
}

// Hata bildirimi göster
function showError() {
    const errorNotification = document.getElementById('errorNotification');
    errorNotification.classList.add('show');
    
    setTimeout(() => {
        errorNotification.classList.remove('show');
    }, 4000);
}

// Giriş yapılıp yapılmadığını kontrol et
function isLoggedIn() {
    const loggedIn = localStorage.getItem(LOGIN_STORAGE_KEY);
    if (!loggedIn) return false;
    
    // 24 saat sonra otomatik çıkış (opsiyonel)
    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursDiff = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursDiff > 24) {
            localStorage.removeItem(LOGIN_STORAGE_KEY);
            localStorage.removeItem('loginTime');
            return false;
        }
    }
    
    return true;
}

// Stil ekle
const loginStyle = document.createElement('style');
loginStyle.textContent = `
    .login-body {
        background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 20px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }
    
    .login-container {
        width: 100%;
        max-width: 400px;
    }
    
    .login-card {
        background: rgba(255, 255, 255, 0.95);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
    }
    
    .login-header {
        text-align: center;
        margin-bottom: 30px;
    }
    
    .login-header i {
        font-size: 3rem;
        color: #667eea;
        margin-bottom: 15px;
    }
    
    .login-header h1 {
        color: #2c3e50;
        margin-bottom: 10px;
        font-size: 1.8rem;
    }
    
    .login-header p {
        color: #7f8c8d;
        font-size: 1rem;
    }
    
    .login-form {
        margin-bottom: 25px;
    }
    
    .input-group {
        position: relative;
        margin-bottom: 25px;
    }
    
    .input-group i {
        position: absolute;
        left: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: #667eea;
        font-size: 1.2rem;
    }
    
    .input-group input {
        width: 100%;
        padding: 15px 15px 15px 50px;
        border: 2px solid #e1e1e1;
        border-radius: 10px;
        font-size: 1rem;
        transition: all 0.3s ease;
        background: white;
    }
    
    .input-group input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .login-btn {
        width: 100%;
        padding: 15px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        color: white;
        border: none;
        border-radius: 10px;
        font-size: 1.1rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.3s ease;
        position: relative;
        overflow: hidden;
    }
    
    .login-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
    
    .btn-loader {
        display: none;
        width: 20px;
        height: 20px;
        border: 2px solid transparent;
        border-top: 2px solid white;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
    }
    
    .login-btn.loading .btn-text {
        opacity: 0;
    }
    
    .login-btn.loading .btn-loader {
        display: block;
    }
    
    @keyframes spin {
        0% { transform: translate(-50%, -50%) rotate(0deg); }
        100% { transform: translate(-50%, -50%) rotate(360deg); }
    }
    
    .login-footer {
        text-align: center;
        border-top: 1px solid #ecf0f1;
        padding-top: 20px;
    }
    
    .back-to-home {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
    }
    
    .back-to-home:hover {
        color: #764ba2;
        transform: translateX(-5px);
    }
    
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 10px;
        color: white;
        display: flex;
        align-items: center;
        gap: 10px;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        z-index: 1000;
    }
    
    .notification.show {
        transform: translateX(0);
    }
    
    .notification.error {
        background: #e74c3c;
    }
    
    /* Shake animation for error */
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
    
    .shake {
        animation: shake 0.5s ease-in-out;
    }
`;
document.head.appendChild(loginStyle);
