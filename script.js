// LocalStorage anahtarları
const FORMS_STORAGE_KEY = 'departmentForms';
const RESPONSES_STORAGE_KEY = 'formResponses';

console.log('Index Script JS yüklendi');

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM Content Loaded - Index');
    initializeStorage();
    loadForms();
    
    // Debug info göster
    showDebugInfo();
});

// Storage'ı başlat
function initializeStorage() {
    console.log('Storage başlatılıyor...');
    if (!localStorage.getItem(FORMS_STORAGE_KEY)) {
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify([]));
        console.log('Forms storage oluşturuldu');
    }
    if (!localStorage.getItem(RESPONSES_STORAGE_KEY)) {
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify([]));
        console.log('Responses storage oluşturuldu');
    }
}

// Debug bilgisi göster
function showDebugInfo() {
    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    const debugDiv = document.getElementById('debugInfo');
    const debugContent = document.getElementById('debugContent');
    
    debugContent.innerHTML = `
        <div>Toplam Form: ${forms.length}</div>
        <div>Açık Form: ${forms.filter(f => f.status === 'open').length}</div>
        <div>Duraklatılmış: ${forms.filter(f => f.status === 'paused').length}</div>
        <div>Kapalı Form: ${forms.filter(f => f.status === 'closed').length}</div>
        <div>Forms Container: ${document.getElementById('formsContainer') ? 'Var' : 'Yok'}</div>
    `;
    debugDiv.style.display = 'block';
}

// Formları yükle
function loadForms() {
    console.log('Formlar yükleniyor...');
    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    const formsContainer = document.getElementById('formsContainer');
    
    console.log('Bulunan form sayısı:', forms.length);
    console.log('Forms container:', formsContainer);
    
    if (!formsContainer) {
        console.error('Forms container bulunamadı!');
        return;
    }
    
    formsContainer.innerHTML = '';

    

    // Açık formları önce göster, kapalıları sonra
    const openForms = forms.filter(form => form.status === 'open');
    const pausedForms = forms.filter(form => form.status === 'paused');
    const closedForms = forms.filter(form => form.status === 'closed');
    
    const sortedForms = [...openForms, ...pausedForms, ...closedForms];

    console.log('Sıralanmış formlar:', sortedForms.length);

    sortedForms.forEach((form, index) => {
        console.log(`Form ${index + 1}:`, form.title, form.status);
        const formCard = createFormCard(form);
        formsContainer.appendChild(formCard);
    });
}

function createFormCard(form) {
    console.log('Form kartı oluşturuluyor:', form.title);
    
    const card = document.createElement('div');
    card.className = `form-card ${form.status}`;
    card.style.borderLeftColor = form.color;
    
    // Açık formlara özel arkaplan
    if (form.status === 'open') {
        card.style.background = 'linear-gradient(135deg, rgba(255,255,255,0.95), rgba(102, 126, 234, 0.05))';
    } else {
        card.style.background = 'rgba(255, 255, 255, 0.95)';
    }
    
    const statusText = {
        'open': 'Açık',
        'paused': 'Duraklatıldı',
        'closed': 'Kapalı'
    }[form.status];

    const statusClass = {
        'open': 'status-open',
        'paused': 'status-paused',
        'closed': 'status-closed'
    }[form.status];

    // Form yanıt sayısını al
    const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
    const responseCount = responses.filter(r => r.formId === form.id).length;

    card.innerHTML = `
        <span class="status-badge ${statusClass}">${statusText}</span>
        <h3>${form.title}</h3>
        <p>${form.description}</p>
        <div class="form-meta">
            <span><i class="fas fa-question-circle"></i> ${form.questions.length} Soru</span>
            <span><i class="fas fa-reply"></i> ${responseCount} Yanıt</span>
            <span><i class="fas fa-calendar"></i> ${new Date(form.createdAt).toLocaleDateString('tr-TR')}</span>
        </div>
    `;

    if (form.status === 'open') {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            console.log('Forma tıklandı:', form.id);
            window.location.href = `form.html?id=${form.id}`;
        });
        
        // Hover efekti
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px)';
            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.15)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0)';
            card.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.1)';
        });
    } else {
        card.style.cursor = 'not-allowed';
        card.style.opacity = '0.7';
        card.innerHTML += `
            <div class="form-overlay">
                <i class="fas fa-lock"></i> 
                <span>Bu form şu anda ${statusText.toLowerCase()}</span>
            </div>
        `;
    }

    return card;
}

// Yönetici paneline git
function goToAdmin() {
    window.location.href = 'admin.html';
}

// Test için global fonksiyon
window.testForms = function() {
    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    console.log('Mevcut formlar:', forms);
    
    if (forms.length === 0) {
        // Test formu ekle
        const testForm = {
            id: 'test-form-' + Date.now(),
            title: 'Test Yazılım Geliştirici Alımı',
            description: 'Backend geliştirici pozisyonu için başvuru formu',
            color: '#667eea',
            questions: [
                {
                    id: 'q1',
                    text: 'Adınız Soyadınız',
                    type: 'text',
                    required: true
                },
                {
                    id: 'q2',
                    text: 'E-posta Adresiniz', 
                    type: 'text',
                    required: true
                }
            ],
            status: 'open',
            createdAt: new Date().toISOString()
        };
        
        forms.push(testForm);
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
        console.log('Test formu eklendi!');
        loadForms();
    }
};

// Sayfa stilini dinamik olarak ekle
const style = document.createElement('style');
style.textContent = `
    .no-forms {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 15px;
        color: #7f8c8d;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    
    .no-forms i {
        font-size: 4rem;
        color: #bdc3c7;
        margin-bottom: 20px;
    }
    
    .no-forms h3 {
        color: #2c3e50;
        margin-bottom: 10px;
    }
    
    .form-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.1rem;
        font-weight: 600;
        border-radius: 20px;
        gap: 10px;
        flex-direction: column;
    }
    
    .loading {
        text-align: center;
        padding: 40px;
        color: #666;
        font-size: 1.1rem;
    }
    
    .forms-container {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
        gap: 25px;
        transition: all 0.3s ease;
    }
    
    .form-card {
        background: rgba(255, 255, 255, 0.95);
        padding: 30px;
        border-radius: 20px;
        box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        transition: all 0.3s ease;
        border-left: 6px solid;
        position: relative;
        overflow: hidden;
    }
    
    .form-card h3 {
        color: #2c3e50;
        margin-bottom: 10px;
        font-size: 1.3rem;
    }
    
    .form-card p {
        color: #7f8c8d;
        line-height: 1.5;
        margin-bottom: 15px;
    }
    
    .form-meta {
        display: flex;
        justify-content: space-between;
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #ecf0f1;
        font-size: 0.9rem;
        color: #95a5a6;
        flex-wrap: wrap;
        gap: 10px;
    }
    
    .form-meta span {
        display: flex;
        align-items: center;
        gap: 5px;
    }
    
    .status-badge {
        position: absolute;
        top: 15px;
        right: 15px;
        padding: 6px 12px;
        border-radius: 15px;
        font-size: 0.8rem;
        font-weight: 600;
        color: white;
    }
    
    .status-open {
        background: #27ae60;
    }
    
    .status-paused {
        background: #f39c12;
    }
    
    .status-closed {
        background: #e74c3c;
    }
`;
document.head.appendChild(style);
