let subjects = [];
// استخدام window.teachers لتجنب خطأ redeclaration عند تحميل الملف أكثر من مرة
// استخدام طريقة آمنة تمنع إعادة التعريف حتى لو تم تحميل الملف أكثر من مرة
if (typeof window.teachers === 'undefined') {
    window.teachers = [];
}
// استخدام namespace لتجنب إعادة التعريف في SPA
if (typeof window.subjectsModule === 'undefined') {
    window.subjectsModule = {
        currentEditId: null
    };
}
// إنشاء مرجع محلي للوصول السريع
const getCurrentEditId = () => window.subjectsModule.currentEditId;
const setCurrentEditId = (value) => { window.subjectsModule.currentEditId = value; };

// تحميل المواد
async function loadSubjects() {
    try {
        const response = await subjectsAPI.getAll();
        if (response.success) {
            subjects = response.data;
            renderSubjects();
        }
    } catch (error) {
        console.error('Error loading subjects:', error);
        alert('حدث خطأ أثناء تحميل المواد');
    }
}

// تحميل المعلمين
async function loadTeachers() {
    try {
        const response = await teachersAPI.getAll();
        if (response.success) {
            window.teachers = response.data;
            renderTeacherOptions();
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
    }
}

// عرض خيارات المعلمين
function renderTeacherOptions() {
    const select = document.getElementById('subjectTeacher');
    if (select) {
        select.innerHTML = '<option value="">اختر المعلم</option>' + 
            window.teachers.map(teacher => 
                `<option value="${teacher.id}">${teacher.name}</option>`
            ).join('');
    }
}

// عرض المواد
function renderSubjects() {
    const searchQuery = document.getElementById('searchQuery')?.value.toLowerCase() || '';
    const filtered = searchQuery 
        ? subjects.filter(s => 
            s.name.toLowerCase().includes(searchQuery) ||
            s.class.toLowerCase().includes(searchQuery)
          )
        : subjects;
    
    const tbody = document.getElementById('subjectsTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد مواد</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(subject => {
        const id = subject.id || 0;
        const name = subject.name || 'غير محدد';
        const className = subject.class || 'غير محدد';
        const teacherName = subject.teacher_name || 'غير محدد';
        const hours = subject.hours || 0;
        
        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${name}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${className}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${teacherName}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${hours}</td>
            <td class="px-4 py-3 text-sm font-medium whitespace-nowrap">
                <div class="actions-group">
                    <button onclick="editSubject(${id})" class="btn-edit" type="button" title="تعديل المادة">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button onclick="deleteSubject(${id})" class="btn-delete" type="button" title="حذف المادة">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}


// فتح نافذة الإضافة
function openAddModal() {
    setCurrentEditId(null);
    const modalTitle = document.getElementById('modalTitle');
    const form = document.getElementById('subjectForm');
    const modal = document.getElementById('subjectModal');
    
    if (modalTitle) modalTitle.textContent = 'إضافة مادة جديدة';
    if (form) form.reset();
    if (modal) modal.classList.remove('hidden');
}

// تعديل مادة
function editSubject(id) {
    try {
        console.log('editSubject called with id:', id);
        
        if (!id || id === 0) {
            alert('خطأ: معرف المادة غير صحيح');
            return;
        }
        
        // البحث عن المادة
        const subject = subjects.find(s => s.id == id || s.id === id);
        
        if (!subject) {
            console.error('Subject not found with id:', id);
            console.error('Available subjects:', subjects);
            alert('المادة غير موجودة');
            return;
        }
        
        console.log('Found subject:', subject);
        
        setCurrentEditId(id);
        
        // تحديث العنوان
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'تعديل مادة';
        }
        
        // ملء الحقول
        const nameField = document.getElementById('subjectName');
        const classField = document.getElementById('subjectClass');
        const teacherField = document.getElementById('subjectTeacher');
        const hoursField = document.getElementById('subjectHours');
        
        if (nameField) nameField.value = subject.name || '';
        if (classField) classField.value = subject.class || '';
        if (hoursField) hoursField.value = subject.hours || '';
        
        // التأكد من تحميل المعلمين أولاً
        const setTeacherValue = () => {
            if (teacherField) {
                teacherField.value = subject.teacher_id || '';
            }
        };
        
        if (window.teachers.length === 0) {
            loadTeachers().then(() => {
                setTeacherValue();
            });
        } else {
            setTeacherValue();
        }
        
        // فتح النافذة المنبثقة
        const modal = document.getElementById('subjectModal');
        if (modal) {
            modal.classList.remove('hidden');
        } else {
            alert('خطأ: لم يتم العثور على نافذة التعديل');
        }
    } catch (error) {
        console.error('Error in editSubject:', error);
        alert('حدث خطأ أثناء فتح نافذة التعديل: ' + (error.message || 'خطأ غير معروف'));
    }
}

// حفظ مادة
async function saveSubject(event) {
    event.preventDefault();
    
    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'جاري الحفظ...';
        }
        
        const teacherId = document.getElementById('subjectTeacher')?.value;
        const formData = {
            name: document.getElementById('subjectName')?.value.trim() || '',
            class: document.getElementById('subjectClass')?.value || '',
            teacher_id: teacherId ? parseInt(teacherId) : null,
            hours: parseInt(document.getElementById('subjectHours')?.value || 0),
        };
        
        if (!formData.name || !formData.class || !formData.hours) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'حفظ';
            }
            return;
        }
        
        const editId = getCurrentEditId();
        let response;
        if (editId) {
            response = await subjectsAPI.update(editId, formData);
        } else {
            response = await subjectsAPI.create(formData);
        }
        
        if (response && response.success) {
            closeModal();
            await loadSubjects();
            alert(response.message || 'تم الحفظ بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحفظ');
        }
    } catch (error) {
        console.error('Error saving subject:', error);
        alert('حدث خطأ أثناء الحفظ: ' + (error.message || 'خطأ غير معروف'));
    } finally {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'حفظ';
        }
    }
}

// حذف مادة
async function deleteSubject(id) {
    if (!confirm('هل أنت متأكد من حذف هذه المادة؟')) return;
    
    try {
        console.log('Deleting subject with id:', id);
        const response = await subjectsAPI.delete(id);
        console.log('Delete response:', response);
        
        if (response && response.success) {
            await loadSubjects();
            alert('تم حذف المادة بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحذف');
        }
    } catch (error) {
        console.error('Error deleting subject:', error);
        alert('حدث خطأ أثناء الحذف: ' + (error.message || 'خطأ غير معروف'));
    }
}

// إغلاق النافذة
function closeModal() {
    const modal = document.getElementById('subjectModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    setCurrentEditId(null);
    const form = document.getElementById('subjectForm');
    if (form) {
        form.reset();
    }
}

// التأكد من أن الدوال متاحة عالمياً
window.editSubject = editSubject;
window.deleteSubject = deleteSubject;
window.openAddModal = openAddModal;
window.closeModal = closeModal;
window.saveSubject = saveSubject;

// دالة تهيئة الصفحة
function initSubjectsPage() {
    console.log('[Subjects] Initializing subjects page');
    try {
        const modal = document.getElementById('subjectModal');
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModal();
                }
            });
            
            document.addEventListener('keydown', function(e) {
                if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                    closeModal();
                }
            });
        }
        
        // استخدام DataManager لجلب البيانات
        if (window.sectionDataLoaders && window.sectionDataLoaders.loadSubjects) {
            window.sectionDataLoaders.loadSubjects();
        } else {
            // Fallback للطريقة القديمة
            loadSubjects();
        }
        
        // تحميل المعلمين للقائمة المنسدلة
        if (typeof loadTeachers === 'function') {
            loadTeachers();
        }
        
        const searchInput = document.getElementById('searchQuery');
        if (searchInput) {
            searchInput.addEventListener('input', renderSubjects);
        }
        
        console.log('[Subjects] Subjects page initialized');
    } catch (error) {
        console.error('[Subjects] Error initializing page:', error);
    }
}

// إغلاق النافذة عند النقر خارجها
document.addEventListener('DOMContentLoaded', initSubjectsPage);

// أيضاً استماع لحدث تحميل الصفحة من Router
document.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'subjects') {
        console.log('[Subjects] Page loaded event received, initializing');
        setTimeout(() => {
            initSubjectsPage();
        }, 100);
    }
});

// فتح نافذة الإضافة تلقائياً إذا كان معامل action=add موجود في URL
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
        // انتظار تحميل الصفحة بالكامل ثم فتح النافذة
        setTimeout(() => {
            if (typeof openAddModal === 'function') {
                openAddModal();
            }
        }, 500);
    }
});

// الاستماع لرسائل من النوافذ الخارجية لتحديث القائمة
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'subjectAdded') {
        console.log('[Subjects] Subject added from external window, refreshing list...');
        // تحديث قائمة المواد
        loadSubjects();
    }
});
