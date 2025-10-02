// LocalStorage anahtarları
const FORMS_STORAGE_KEY = 'departmentForms';
const RESPONSES_STORAGE_KEY = 'formResponses';

let currentForm = null;

console.log('Form JS yüklendi');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Form');
    initializeStorage();
    loadForm();
    setupFormSubmission();
});

// Storage'ı başlat
function initializeStorage() {
    console.log('Form Storage başlatılıyor...');
    if (!localStorage.getItem(FORMS_STORAGE_KEY)) {
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(RESPONSES_STORAGE_KEY)) {
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify([]));
    }
}

// Formu yükle
function loadForm() {
    const urlParams = new URLSearchParams(window.location.search);
    const formId = urlParams.get('id');
    
    console.log('URL Param formId:', formId);
    
    if (!formId) {
        showError('Form bulunamadı!');
        return;
    }

    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    console.log('Tüm formlar:', forms);
    
    currentForm = forms.find(form => form.id === formId);
    
    console.log('Bulunan form:', currentForm);
    
    if (!currentForm) {
        showError('Form bulunamadı!');
        return;
    }

    if (currentForm.status !== 'open') {
        showError('Bu form şu anda kapalı!');
        return;
    }

    // Kullanıcının daha önce bu formu doldurup doldurmadığını kontrol et
    if (hasUserAlreadySubmitted()) {
        showAlreadySubmittedWarning();
        return;
    }

    renderForm();
}

// Kullanıcının daha önce bu formu doldurup doldurmadığını kontrol et
function hasUserAlreadySubmitted() {
    const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
    const formResponses = responses.filter(response => response.formId === currentForm.id);
    
    // Burada basit bir kontrol - gerçek uygulamada IP veya kullanıcı ID kullanılabilir
    // Şimdilik sadece form ID'sine göre kontrol ediyoruz
    const userIdentifier = getUserId();
    
    return formResponses.some(response => response.userIdentifier === userIdentifier);
}

// Basit bir kullanıcı kimliği oluştur (gerçek uygulamada daha güvenli yöntemler kullan)
function getUserId() {
    let userId = localStorage.getItem('userIdentifier');
    if (!userId) {
        userId = 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('userIdentifier', userId);
    }
    return userId;
}

function showAlreadySubmittedWarning() {
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = `
        <div class="already-submitted">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Zaten Başvurdunuz!</h3>
            <p>Bu forma daha önce başvuru yaptınız. Her kullanıcı bir formu sadece bir kez doldurabilir.</p>
            <div class="submission-actions">
                <a href="index.html" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Form Listesine Dön
                </a>
                <button onclick="resetUserSubmission()" class="reset-btn">
                    <i class="fas fa-redo"></i> Farklı Bir İsimle Başvur
                </button>
            </div>
        </div>
    `;
}

// Kullanıcı kimliğini sıfırla (farklı isimle başvurmak için)
function resetUserSubmission() {
    localStorage.removeItem('userIdentifier');
    location.reload();
}

// Global yap
window.resetUserSubmission = resetUserSubmission;

function renderForm() {
    const formHeader = document.getElementById('formHeader');
    const formContainer = document.getElementById('formContainer');
    
    console.log('Form render ediliyor:', currentForm.title);
    
    // Header'ı güncelle
    formHeader.innerHTML = `
        <h2 style="color: ${currentForm.color}">${currentForm.title}</h2>
        <p>${currentForm.description}</p>
        <div style="margin-top: 15px; color: #7f8c8d; font-size: 0.9rem;">
            <i class="fas fa-info-circle"></i> ${currentForm.questions.length} soru
            <br>
            <i class="fas fa-user-check"></i> Her kullanıcı sadece bir kez başvurabilir
        </div>
    `;

    // Form içeriğini oluştur
    formContainer.innerHTML = `
        <form id="applicationForm" class="application-form">
            ${currentForm.questions.map((question, index) => createQuestionHTML(question, index)).join('')}
            <div class="form-footer">
                <p class="form-notice">
                    <i class="fas fa-info-circle"></i>
                    Her kullanıcı bu formu sadece bir kez doldurabilir.
                </p>
                <button type="submit" class="submit-btn">
                    <i class="fas fa-paper-plane"></i> Başvuruyu Gönder
                </button>
            </div>
        </form>
    `;
}

function createQuestionHTML(question, index) {
    let questionHTML = `
        <div class="question-group" data-question-id="${question.id}">
            <div class="question-header">
                <label class="question-label">${index + 1}. ${question.text}</label>
                ${question.required ? '<span class="required-star">*</span>' : ''}
            </div>
    `;

    if (question.type === 'text') {
        questionHTML += `
            <input type="text" 
                   name="${question.id}" 
                   ${question.required ? 'required' : ''}
                   placeholder="Cevabınızı yazın..."
                   class="form-input">
        `;
    } else if (question.type === 'choice') {
        questionHTML += `
            <div class="choice-options">
                ${question.options.map(option => `
                    <label class="choice-option">
                        <input type="radio" 
                               name="${question.id}" 
                               value="${option}" 
                               ${question.required ? 'required' : ''}>
                        <span>${option}</span>
                    </label>
                `).join('')}
            </div>
        `;
    }

    questionHTML += `</div>`;
    return questionHTML;
}

function setupFormSubmission() {
    document.addEventListener('submit', function(e) {
        if (e.target.id === 'applicationForm') {
            e.preventDefault();
            console.log('Form gönderildi');
            submitForm();
        }
    });
}

function submitForm() {
    const form = document.getElementById('applicationForm');
    const formData = new FormData(form);
    
    console.log('Form verileri toplanıyor...');
    
    // Form doğrulama
    if (!validateForm(formData)) {
        return;
    }

    // Yanıtları topla
    const responses = {};
    currentForm.questions.forEach(question => {
        const answer = formData.get(question.id);
        if (answer) {
            responses[question.id] = answer;
        }
    });

    console.log('Toplanan yanıtlar:', responses);

    // Kullanıcı bilgilerini al
    const dcName = responses['auto-dc-name'];
    const rolboxName = responses['auto-rolbox-name'];
    
    if (!dcName || !rolboxName) {
        alert('Lütfen DC ve Rolbox isimlerinizi girin!');
        return;
    }

    // Yanıtı kaydet
    const responseData = {
        id: 'response-' + Date.now(),
        formId: currentForm.id,
        formTitle: currentForm.title,
        userIdentifier: getUserId(), // Kullanıcı kimliği
        userInfo: {
            dcName: dcName,
            rolboxName: rolboxName
        },
        responses: responses,
        submittedAt: new Date().toISOString(),
        status: 'pending'
    };

    const existingResponses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
    existingResponses.push(responseData);
    localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(existingResponses));

    console.log('Yanıt kaydedildi:', responseData);

    showSuccess();
    
    // 3 saniye sonra ana sayfaya yönlendir
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 3000);
}

function validateForm(formData) {
    let isValid = true;
    const errorMessages = [];
    
    currentForm.questions.forEach(question => {
        if (question.required) {
            const answer = formData.get(question.id);
            if (!answer || answer.trim() === '') {
                isValid = false;
                errorMessages.push(`"${question.text}" sorusu zorunludur`);
                
                // Görsel hata gösterimi
                const questionElement = document.querySelector(`[data-question-id="${question.id}"]`);
                if (questionElement) {
                    questionElement.style.borderLeft = '4px solid #e74c3c';
                    questionElement.style.background = '#fee';
                }
            }
        }
    });

    if (!isValid) {
        alert('Lütfen tüm zorunlu alanları doldurun:\n' + errorMessages.join('\n'));
    }

    return isValid;
}

function showSuccess() {
    const notification = document.getElementById('successNotification');
    notification.classList.add('show');
    
    // Formu devre dışı bırak
    const submitBtn = document.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-check"></i> Gönderildi';
    submitBtn.style.background = '#27ae60';
    
    // Form alanlarını devre dışı bırak
    document.querySelectorAll('.form-input, input[type="radio"]').forEach(input => {
        input.disabled = true;
    });
    
    console.log('Başarı bildirimi gösterildi');
}

function showError(message) {
    const formContainer = document.getElementById('formContainer');
    formContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>${message}</h3>
            <p>Lütfen ana sayfaya dönerek başka bir form seçin.</p>
            <a href="index.html" class="back-btn">
                <i class="fas fa-arrow-left"></i> Form Listesine Dön
            </a>
        </div>
    `;
    
    console.log('Hata gösterildi:', message);
}

// Stil ekle
const style = document.createElement('style');
style.textContent = `
    .application-form {
        background: rgba(255, 255, 255, 0.95);
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    }
    
    .question-group {
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 1px solid #ecf0f1;
        transition: all 0.3s ease;
    }
    
    .question-header {
        display: flex;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .question-label {
        font-weight: 600;
        color: #2c3e50;
        font-size: 1.1rem;
    }
    
    .required-star {
        color: #e74c3c;
        margin-left: 5px;
        font-size: 1.2rem;
    }
    
    .form-input {
        width: 100%;
        padding: 12px 15px;
        border: 2px solid #e1e1e1;
        border-radius: 10px;
        font-size: 1rem;
        transition: all 0.3s ease;
        background: white;
    }
    
    .form-input:focus {
        outline: none;
        border-color: #667eea;
        box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
    
    .choice-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }
    
    .choice-option {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 15px;
        background: #f8f9fa;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.3s ease;
        border: 2px solid transparent;
    }
    
    .choice-option:hover {
        background: #e9ecef;
        border-color: #667eea;
    }
    
    .choice-option input[type="radio"] {
        margin: 0;
        transform: scale(1.2);
    }
    
    .error-message {
        text-align: center;
        background: rgba(255, 255, 255, 0.95);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    }
    
    .error-message i {
        font-size: 3rem;
        color: #e74c3c;
        margin-bottom: 20px;
    }
    
    .error-message h3 {
        color: #2c3e50;
        margin-bottom: 10px;
    }
    
    .already-submitted {
        text-align: center;
        background: rgba(255, 255, 255, 0.95);
        padding: 40px;
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
    }
    
    .already-submitted i {
        font-size: 4rem;
        color: #f39c12;
        margin-bottom: 20px;
    }
    
    .already-submitted h3 {
        color: #2c3e50;
        margin-bottom: 15px;
    }
    
    .already-submitted p {
        color: #7f8c8d;
        margin-bottom: 25px;
        line-height: 1.5;
    }
    
    .submission-actions {
        display: flex;
        gap: 15px;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .back-btn {
        display: inline-block;
        padding: 12px 25px;
        background: #667eea;
        color: white;
        text-decoration: none;
        border-radius: 10px;
        transition: all 0.3s ease;
        font-weight: 500;
    }
    
    .back-btn:hover {
        background: #5a6fd8;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(102, 126, 234, 0.3);
    }
    
    .reset-btn {
        padding: 12px 25px;
        background: #e67e22;
        color: white;
        border: none;
        border-radius: 10px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .reset-btn:hover {
        background: #d35400;
        transform: translateY(-2px);
        box-shadow: 0 5px 15px rgba(230, 126, 34, 0.3);
    }
    
    .form-footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #ecf0f1;
    }
    
    .form-notice {
        background: #e8f4fd;
        padding: 15px;
        border-radius: 8px;
        color: #2c3e50;
        margin-bottom: 20px;
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 0.9rem;
    }
    
    .form-notice i {
        color: #3498db;
    }
    
    .loading {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 1.1rem;
    }
    
    .form-header {
        background: rgba(255, 255, 255, 0.95);
        padding: 30px;
        border-radius: 20px;
        margin-bottom: 25px;
        text-align: center;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .form-header h2 {
        color: #2c3e50;
        margin-bottom: 10px;
        font-size: 1.8rem;
    }
    
    .form-header p {
        color: #7f8c8d;
        font-size: 1.1rem;
        line-height: 1.5;
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
    
    .notification.success {
        background: #27ae60;
    }
    
    .back-link {
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(255, 255, 255, 0.9);
        padding: 10px 20px;
        border-radius: 25px;
        text-decoration: none;
        color: #667eea;
        font-weight: 500;
        transition: all 0.3s ease;
        box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .back-link:hover {
        background: #667eea;
        color: white;
        transform: translateX(-5px);
    }
`;
document.head.appendChild(style);
