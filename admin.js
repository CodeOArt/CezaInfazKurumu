// LocalStorage anahtarları
const FORMS_STORAGE_KEY = 'departmentForms';
const RESPONSES_STORAGE_KEY = 'formResponses';

let currentTab = 'forms';
let deleteCallback = null;
let currentResponseId = null;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    initializeStorage();
    setupEventListeners();
    loadFormsTab();
});

// Storage'ı başlat
function initializeStorage() {
    if (!localStorage.getItem(FORMS_STORAGE_KEY)) {
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify([]));
    }
    if (!localStorage.getItem(RESPONSES_STORAGE_KEY)) {
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify([]));
    }
}

function setupEventListeners() {
    // Tab değiştirme
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Form oluşturma
    document.getElementById('addTextQuestion').addEventListener('click', () => addQuestion('text'));
    document.getElementById('addChoiceQuestion').addEventListener('click', () => addQuestion('choice'));
    document.getElementById('createForm').addEventListener('click', createForm);

    // Modal kapatma
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });

    // Onay modalı
    document.getElementById('confirmCancel').addEventListener('click', closeConfirmModal);
    document.getElementById('confirmDelete').addEventListener('click', executeDelete);

    // Yanıt işlemleri
    document.getElementById('updateResponseStatus').addEventListener('click', updateResponseStatus);
    document.getElementById('deleteResponse').addEventListener('click', deleteCurrentResponse);

    // Filtreleme
    document.getElementById('responseStatusFilter').addEventListener('change', loadResponsesTab);

    // Örnek form ekleme
    document.getElementById('addMockForms').addEventListener('click', addMockForms);

    // Geri dön butonu
    document.getElementById('backToForms').addEventListener('click', function() {
        document.getElementById('formsGrid').style.display = 'grid';
        document.getElementById('responsesContainer').style.display = 'none';
    });
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Tab butonlarını güncelle
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Tab içeriklerini güncelle
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // İlgili tabı yükle
    if (tabName === 'forms') {
        loadFormsTab();
    } else if (tabName === 'responses') {
        loadResponsesTab();
    }
}

// FORM YÖNETİMİ
function loadFormsTab() {
    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    const formsList = document.getElementById('formsList');
    
    formsList.innerHTML = '';

    if (forms.length === 0) {
        formsList.innerHTML = `
            <div class="no-forms">
                <i class="fas fa-inbox"></i>
                <h3>Henüz form bulunmuyor</h3>
                <p>Yeni form oluşturmak için "Yeni Form Oluştur" tab'ına geçin</p>
            </div>
        `;
        return;
    }

    forms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(form => {
        const formCard = createAdminFormCard(form);
        formsList.appendChild(formCard);
    });
}

function createAdminFormCard(form) {
    const card = document.createElement('div');
    card.className = `admin-form-card ${form.status}`;
    card.innerHTML = `
        <h3 style="color: ${form.color}">${form.title}</h3>
        <p>${form.description}</p>
        <div class="form-meta">
            <span><i class="fas fa-question-circle"></i> ${form.questions.length} Soru</span>
            <span><i class="fas fa-calendar"></i> ${new Date(form.createdAt).toLocaleDateString('tr-TR')}</span>
            <span class="status-badge ${form.status === 'open' ? 'status-open' : form.status === 'paused' ? 'status-paused' : 'status-closed'}">
                ${form.status === 'open' ? 'Açık' : form.status === 'paused' ? 'Duraklatıldı' : 'Kapalı'}
            </span>
        </div>
        <div class="form-actions">
            <button class="action-btn toggle-btn" onclick="toggleFormStatus('${form.id}')">
                <i class="fas fa-power-off"></i>
                ${form.status === 'open' ? 'Duraklat' : form.status === 'paused' ? 'Aç' : 'Aç'}
            </button>
            <button class="action-btn responses-btn" onclick="viewFormResponses('${form.id}')">
                <i class="fas fa-eye"></i> Yanıtları Gör
            </button>
            <button class="action-btn delete-btn" onclick="deleteForm('${form.id}')">
                <i class="fas fa-trash"></i> Sil
            </button>
        </div>
    `;
    
    return card;
}

function toggleFormStatus(formId) {
    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    const formIndex = forms.findIndex(form => form.id === formId);
    
    if (formIndex !== -1) {
        const form = forms[formIndex];
        
        if (form.status === 'open') {
            form.status = 'paused';
        } else if (form.status === 'paused') {
            form.status = 'open';
        } else if (form.status === 'closed') {
            form.status = 'open';
        }
        
        forms[formIndex] = form;
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
        loadFormsTab();
        showToast('Form durumu güncellendi!', 'success');
    }
}

function viewFormResponses(formId) {
    // Yanıtlar tab'ına geç
    switchTab('responses');
    
    // Forma ait yanıtları göster
    setTimeout(() => {
        showFormResponsesById(formId);
    }, 100);
}

function showFormResponsesById(formId) {
    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
    
    const form = forms.find(f => f.id === formId);
    if (form) {
        const formResponses = responses.filter(r => r.formId === formId);
        showFormResponses(form, formResponses);
    }
}

function deleteForm(formId) {
    showDeleteConfirm('Bu formu ve tüm yanıtlarını silmek istediğinizden emin misiniz?', () => {
        // Formu sil
        const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
        const updatedForms = forms.filter(form => form.id !== formId);
        localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(updatedForms));
        
        // Forma ait yanıtları sil
        const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
        const updatedResponses = responses.filter(response => response.formId !== formId);
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(updatedResponses));
        
        loadFormsTab();
        showToast('Form ve yanıtları silindi!', 'success');
    });
}

// FORM OLUŞTURMA
let questionCount = 0;

function addQuestion(type) {
    questionCount++;
    const questionId = 'question-' + Date.now() + '-' + questionCount;
    
    let questionHTML = '';
    
    if (type === 'text') {
        questionHTML = `
            <div class="question-item" data-question-id="${questionId}">
                <div class="question-header">
                    <input type="text" class="question-text" placeholder="Soru metnini yazın..." value="">
                    <span class="question-type">Metin</span>
                    <button type="button" class="remove-question" onclick="removeQuestion('${questionId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="question-settings">
                    <label class="setting-checkbox">
                        <input type="checkbox" class="required-checkbox" checked>
                        Zorunlu soru
                    </label>
                </div>
            </div>
        `;
    } else if (type === 'choice') {
        questionHTML = `
            <div class="question-item" data-question-id="${questionId}">
                <div class="question-header">
                    <input type="text" class="question-text" placeholder="Soru metnini yazın..." value="">
                    <span class="question-type">Seçenekli</span>
                    <button type="button" class="remove-question" onclick="removeQuestion('${questionId}')">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="question-settings">
                    <label class="setting-checkbox">
                        <input type="checkbox" class="required-checkbox" checked>
                        Zorunlu soru
                    </label>
                </div>
                <div class="choice-options-container">
                    <div class="choice-option">
                        <input type="text" class="option-input" placeholder="Seçenek 1" value="">
                        <button type="button" class="remove-option" onclick="removeOption(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="choice-option">
                        <input type="text" class="option-input" placeholder="Seçenek 2" value="">
                        <button type="button" class="remove-option" onclick="removeOption(this)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <button type="button" class="add-option" onclick="addOption('${questionId}')">
                    <i class="fas fa-plus"></i> Seçenek Ekle
                </button>
            </div>
        `;
    }
    
    document.getElementById('questionsList').insertAdjacentHTML('beforeend', questionHTML);
}

function removeQuestion(questionId) {
    const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
    if (questionElement) {
        questionElement.remove();
    }
}

function addOption(questionId) {
    const questionElement = document.querySelector(`[data-question-id="${questionId}"]`);
    const optionsContainer = questionElement.querySelector('.choice-options-container');
    
    const optionHTML = `
        <div class="choice-option">
            <input type="text" class="option-input" placeholder="Yeni seçenek" value="">
            <button type="button" class="remove-option" onclick="removeOption(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    optionsContainer.insertAdjacentHTML('beforeend', optionHTML);
}

function removeOption(button) {
    const optionElement = button.closest('.choice-option');
    if (optionElement) {
        optionElement.remove();
    }
}

function createForm() {
    const title = document.getElementById('formTitle').value.trim();
    const description = document.getElementById('formDescription').value.trim();
    const color = document.getElementById('formColor').value;
    
    if (!title) {
        alert('Lütfen form başlığı girin!');
        return;
    }
    
    // Soruları topla
    const questions = [];
    const questionElements = document.querySelectorAll('.question-item');
    
    questionElements.forEach((questionElement, index) => {
        const questionText = questionElement.querySelector('.question-text').value.trim();
        const required = questionElement.querySelector('.required-checkbox').checked;
        const type = questionElement.querySelector('.question-type').textContent === 'Metin' ? 'text' : 'choice';
        
        if (questionText) {
            const question = {
                id: questionElement.dataset.questionId,
                text: questionText,
                type: type,
                required: required
            };
            
            if (type === 'choice') {
                const options = [];
                questionElement.querySelectorAll('.option-input').forEach(optionInput => {
                    if (optionInput.value.trim()) {
                        options.push(optionInput.value.trim());
                    }
                });
                question.options = options;
            }
            
            questions.push(question);
        }
    });
    
    // OTOMATİK SORULARI EKLE - DC İsmi ve Rolbox İsmi
    const autoQuestions = [
        {
            id: 'auto-dc-name',
            text: 'DC İsminiz',
            type: 'text',
            required: true
        },
        {
            id: 'auto-rolbox-name', 
            text: 'Rolbox İsminiz',
            type: 'text',
            required: true
        }
    ];
    
    // Otomatik soruları başa ekle
    questions.unshift(...autoQuestions);
    
    // Formu kaydet
    const form = {
        id: 'form-' + Date.now(),
        title: title,
        description: description,
        color: color,
        questions: questions,
        status: 'open',
        createdAt: new Date().toISOString()
    };
    
    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    forms.push(form);
    localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
    
    // Formu temizle
    document.getElementById('formTitle').value = '';
    document.getElementById('formDescription').value = '';
    document.getElementById('questionsList').innerHTML = '';
    
    showToast('Form başarıyla oluşturuldu! DC ve Rolbox isim soruları otomatik eklendi.', 'success');
    switchTab('forms');
}

// YANIT YÖNETİMİ
function loadResponsesTab() {
    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
    
    const formsGrid = document.getElementById('formsGrid');
    const responsesContainer = document.getElementById('responsesContainer');
    
    // Önce form listesini göster
    formsGrid.style.display = 'grid';
    responsesContainer.style.display = 'none';
    
    formsGrid.innerHTML = '';

    if (forms.length === 0) {
        formsGrid.innerHTML = `
            <div class="no-forms">
                <i class="fas fa-inbox"></i>
                <h3>Henüz form bulunmuyor</h3>
                <p>Form oluşturduktan sonra yanıtlar burada görünecek</p>
            </div>
        `;
        return;
    }

    // Formları listele
    forms.forEach(form => {
        const formResponses = responses.filter(r => r.formId === form.id);
        const formItem = createFormResponseItem(form, formResponses);
        formsGrid.appendChild(formItem);
    });
}

function createFormResponseItem(form, formResponses) {
    const item = document.createElement('div');
    item.className = 'form-response-item';
    item.style.borderLeftColor = form.color;
    
    // Durum istatistikleri
    const passedCount = formResponses.filter(r => r.status === 'passed').length;
    const failedCount = formResponses.filter(r => r.status === 'failed').length;
    const pendingCount = formResponses.filter(r => r.status === 'pending').length;

    item.innerHTML = `
        <h4>${form.title}</h4>
        <p style="color: #7f8c8d; font-size: 0.9rem; margin-bottom: 10px;">${form.description}</p>
        
        <div class="form-response-stats">
            <div>
                <div style="font-size: 0.8rem; color: #95a5a6;">Durum Dağılımı</div>
                <div style="display: flex; gap: 5px; margin-top: 5px;">
                    <span style="color: #27ae60; font-weight: 600;">${passedCount}✓</span>
                    <span style="color: #e74c3c; font-weight: 600;">${failedCount}✗</span>
                    <span style="color: #f39c12; font-weight: 600;">${pendingCount}⧖</span>
                </div>
            </div>
            <span class="response-count-badge">${formResponses.length} yanıt</span>
        </div>
    `;

    item.addEventListener('click', () => {
        showFormResponses(form, formResponses);
    });

    return item;
}

function showFormResponses(form, formResponses) {
    const formsGrid = document.getElementById('formsGrid');
    const responsesContainer = document.getElementById('responsesContainer');
    const selectedFormTitle = document.getElementById('selectedFormTitle');
    const responseCount = document.getElementById('responseCount');
    const responsesListDetailed = document.getElementById('responsesListDetailed');

    // Başlık ve sayıyı güncelle
    selectedFormTitle.textContent = form.title;
    responseCount.textContent = `${formResponses.length} yanıt`;

    // Yanıt listesini oluştur
    responsesListDetailed.innerHTML = '';

    if (formResponses.length === 0) {
        responsesListDetailed.innerHTML = `
            <div class="no-responses" style="text-align: center; padding: 40px; color: #95a5a6;">
                <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px;"></i>
                <h3>Henüz yanıt bulunmuyor</h3>
                <p>Bu forma henüz başvuru yapılmamış</p>
            </div>
        `;
    } else {
        // Durum filtresini al
        const statusFilter = document.getElementById('responseStatusFilter').value;
        
        // Filtrele
        let filteredResponses = formResponses;
        if (statusFilter) {
            filteredResponses = formResponses.filter(response => response.status === statusFilter);
        }

        // Tarihe göre sırala (yeniden eskiye)
        filteredResponses.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

        filteredResponses.forEach(response => {
            const responseCard = createDetailedResponseCard(response, form);
            responsesListDetailed.appendChild(responseCard);
        });
    }

    // Görünümü değiştir
    formsGrid.style.display = 'none';
    responsesContainer.style.display = 'block';
}

function createDetailedResponseCard(response, form) {
    const card = document.createElement('div');
    card.className = `response-card ${response.status}`;
    
    card.innerHTML = `
        <div class="response-card-header">
            <div class="response-user-info">
                <div class="response-user-names">
                    ${response.userInfo?.dcName || 'İsimsiz'} - ${response.userInfo?.rolboxName || 'İsimsiz'}
                </div>
                <div class="response-meta">
                    <span>${new Date(response.submittedAt).toLocaleString('tr-TR')}</span>
                    <span>${Object.keys(response.responses).length - 2} soru yanıtlandı</span>
                </div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span class="response-status-large ${response.status === 'passed' ? 'status-passed' : response.status === 'failed' ? 'status-failed' : 'status-pending'}">
                    ${response.status === 'passed' ? 'Geçti' : response.status === 'failed' ? 'Geçmedi' : 'Bekliyor'}
                </span>
                <i class="fas fa-chevron-down expand-icon"></i>
            </div>
        </div>
        <div class="response-card-content">
            <div class="response-questions">
                ${createResponseQuestionsHTML(response, form)}
            </div>
            <div class="response-actions">
                <select class="status-select" onchange="updateResponseStatusInList('${response.id}', this.value)">
                    <option value="pending" ${response.status === 'pending' ? 'selected' : ''}>Bekliyor</option>
                    <option value="passed" ${response.status === 'passed' ? 'selected' : ''}>Geçti</option>
                    <option value="failed" ${response.status === 'failed' ? 'selected' : ''}>Geçmedi</option>
                </select>
                <button class="delete-btn" onclick="deleteResponseInList('${response.id}')">
                    <i class="fas fa-trash"></i> Sil
                </button>
            </div>
        </div>
    `;

    // Açılıp kapanma özelliği
    const header = card.querySelector('.response-card-header');
    header.addEventListener('click', function(e) {
        if (!e.target.classList.contains('status-select') && !e.target.closest('.delete-btn')) {
            card.classList.toggle('expanded');
            const icon = card.querySelector('.expand-icon');
            icon.classList.toggle('fa-chevron-down');
            icon.classList.toggle('fa-chevron-up');
        }
    });

    return card;
}

function createResponseQuestionsHTML(response, form) {
    let html = '';
    
    // Sadece özel soruları göster (otomatik soruları gizle)
    const customQuestions = form.questions.filter(q => !q.id.startsWith('auto-'));
    
    customQuestions.forEach(question => {
        const answer = response.responses[question.id];
        if (answer) {
            html += `
                <div class="response-question-item">
                    <strong>${question.text}</strong>
                    <p>${answer}</p>
                </div>
            `;
        }
    });
    
    return html;
}

// Yanıt durumunu listeden güncelle
function updateResponseStatusInList(responseId, newStatus) {
    const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
    const responseIndex = responses.findIndex(r => r.id === responseId);
    
    if (responseIndex !== -1) {
        responses[responseIndex].status = newStatus;
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(responses));
        showToast('Yanıt durumu güncellendi!', 'success');
        
        // Mevcut görünümü yenile
        const currentFormTitle = document.getElementById('selectedFormTitle').textContent;
        const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
        const currentForm = forms.find(f => f.title === currentFormTitle);
        
        if (currentForm) {
            const formResponses = responses.filter(r => r.formId === currentForm.id);
            showFormResponses(currentForm, formResponses);
        }
    }
}

// Listedeki yanıtı sil
function deleteResponseInList(responseId) {
    showDeleteConfirm('Bu yanıtı silmek istediğinizden emin misiniz?', () => {
        const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
        const updatedResponses = responses.filter(r => r.id !== responseId);
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(updatedResponses));
        
        showToast('Yanıt silindi!', 'success');
        
        // Mevcut görünümü yenile
        const currentFormTitle = document.getElementById('selectedFormTitle').textContent;
        const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
        const currentForm = forms.find(f => f.title === currentFormTitle);
        
        if (currentForm) {
            const formResponses = updatedResponses.filter(r => r.formId === currentForm.id);
            showFormResponses(currentForm, formResponses);
        }
    });
}

// MODAL İŞLEMLERİ
function closeModals() {
    document.getElementById('responseModal').style.display = 'none';
    document.getElementById('confirmModal').style.display = 'none';
    currentResponseId = null;
}

function closeConfirmModal() {
    document.getElementById('confirmModal').style.display = 'none';
    deleteCallback = null;
}

function showDeleteConfirm(message, callback) {
    document.getElementById('confirmMessage').textContent = message;
    deleteCallback = callback;
    document.getElementById('confirmModal').style.display = 'block';
}

function executeDelete() {
    if (deleteCallback) {
        deleteCallback();
    }
    closeConfirmModal();
}

// TOAST BİLDİRİMLERİ
function showToast(message, type = 'success') {
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toastContainer';
        toastContainer.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 10px;
        `;
        document.body.appendChild(toastContainer);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check' : 'exclamation'}-circle"></i>
        <span>${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// ÖRNEK FORMLAR EKLEME
function addMockForms() {
    const mockForms = [
        {
            id: 'mock-form-1',
            title: 'Yazılım Geliştirici Alımı',
            description: 'Yazılım departmanı için geliştirici alım formu',
            color: '#3498db',
            questions: [
                {
                    id: 'auto-dc-name',
                    text: 'DC İsminiz',
                    type: 'text',
                    required: true
                },
                {
                    id: 'auto-rolbox-name',
                    text: 'Rolbox İsminiz',
                    type: 'text',
                    required: true
                },
                {
                    id: 'q1',
                    text: 'Hangi programlama dillerinde deneyiminiz var?',
                    type: 'text',
                    required: true
                },
                {
                    id: 'q2',
                    text: 'Tecrübe seviyeniz nedir?',
                    type: 'choice',
                    required: true,
                    options: ['0-1 yıl', '1-3 yıl', '3-5 yıl', '5+ yıl']
                }
            ],
            status: 'open',
            createdAt: new Date().toISOString()
        },
        {
            id: 'mock-form-2',
            title: 'Grafik Tasarımcı Alımı',
            description: 'Tasarım departmanı için grafik tasarımcı alım formu',
            color: '#9b59b6',
            questions: [
                {
                    id: 'auto-dc-name',
                    text: 'DC İsminiz',
                    type: 'text',
                    required: true
                },
                {
                    id: 'auto-rolbox-name',
                    text: 'Rolbox İsminiz',
                    type: 'text',
                    required: true
                },
                {
                    id: 'q1',
                    text: 'Hangi tasarım programlarını kullanıyorsunuz?',
                    type: 'text',
                    required: true
                },
                {
                    id: 'q2',
                    text: 'Portfolyonuz var mı?',
                    type: 'choice',
                    required: true,
                    options: ['Evet', 'Hayır']
                }
            ],
            status: 'open',
            createdAt: new Date().toISOString()
        }
    ];

    const forms = JSON.parse(localStorage.getItem(FORMS_STORAGE_KEY) || '[]');
    mockForms.forEach(mockForm => {
        if (!forms.some(form => form.id === mockForm.id)) {
            forms.push(mockForm);
        }
    });
    
    localStorage.setItem(FORMS_STORAGE_KEY, JSON.stringify(forms));
    loadFormsTab();
    showToast('Örnek formlar eklendi!', 'success');
}

// Global fonksiyonları window'a ekle
window.toggleFormStatus = toggleFormStatus;
window.viewFormResponses = viewFormResponses;
window.deleteForm = deleteForm;
window.removeQuestion = removeQuestion;
window.removeOption = removeOption;
window.addOption = addOption;
window.updateResponseStatusInList = updateResponseStatusInList;
window.deleteResponseInList = deleteResponseInList;

// Eski modal fonksiyonları (backward compatibility)
window.updateResponseStatus = updateResponseStatus;
window.deleteResponse = deleteResponse;

function updateResponseStatus() {
    if (!currentResponseId) return;
    
    const newStatus = document.getElementById('responseStatus').value;
    const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
    const responseIndex = responses.findIndex(r => r.id === currentResponseId);
    
    if (responseIndex !== -1) {
        responses[responseIndex].status = newStatus;
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(responses));
        
        showToast('Yanıt durumu güncellendi!', 'success');
        closeModals();
        loadResponsesTab();
    }
}

function deleteResponse() {
    if (!currentResponseId) return;
    
    showDeleteConfirm('Bu yanıtı silmek istediğinizden emin misiniz?', () => {
        const responses = JSON.parse(localStorage.getItem(RESPONSES_STORAGE_KEY) || '[]');
        const updatedResponses = responses.filter(r => r.id !== currentResponseId);
        localStorage.setItem(RESPONSES_STORAGE_KEY, JSON.stringify(updatedResponses));
        
        showToast('Yanıt silindi!', 'success');
        closeModals();
        loadResponsesTab();
    });
}
