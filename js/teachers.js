// ============================================
// ملف teachers.js - محدث بتاريخ 2024
// ============================================
// استخدام window.teachers لتجنب خطأ redeclaration عند تحميل الملف أكثر من مرة
// استخدام طريقة آمنة تمنع إعادة التعريف حتى لو تم تحميل الملف أكثر من مرة
// IMPORTANT: لا تستخدم let teachers = [] هنا - استخدم window.teachers فقط
// ============================================

// حماية من إعادة التعريف - التحقق من وجود المتغير أولاً
if (typeof window.teachers === 'undefined') {
    window.teachers = [];
}

// استخدام namespace لتجنب إعادة التعريف في SPA
if (typeof window.teachersModule === 'undefined') {
    window.teachersModule = {
        currentEditId: null
    };
}
// إنشاء مرجع محلي للوصول السريع
const getCurrentEditId = () => window.teachersModule.currentEditId;
const setCurrentEditId = (value) => { window.teachersModule.currentEditId = value; };

// جعل الدوال متاحة عالمياً مباشرة (قبل تحميل الصفحة)
window.openAddModal = function(event) {
    try {
        // منع السلوك الافتراضي وإعادة التحميل
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log('[Teachers] openAddModal called');
        setCurrentEditId(null);
        
        // دالة مساعدة لإعادة المحاولة
        const tryOpenModal = (attempt = 0, maxAttempts = 5) => {
            const modalTitle = document.getElementById('modalTitle');
            const teacherForm = document.getElementById('teacherForm');
            const teacherModal = document.getElementById('teacherModal');
            
            if (modalTitle && teacherForm && teacherModal) {
                // تم العثور على جميع العناصر
                console.log('[Teachers] All modal elements found, opening modal');
                openModalWithElements(modalTitle, teacherForm, teacherModal);
                return;
            }
            
            // إذا لم يتم العثور على العناصر ولم نتجاوز عدد المحاولات
            if (attempt < maxAttempts) {
                console.warn(`[Teachers] Modal elements not found, retrying... (attempt ${attempt + 1}/${maxAttempts})`);
                setTimeout(() => {
                    tryOpenModal(attempt + 1, maxAttempts);
                }, 200 * (attempt + 1)); // زيادة وقت الانتظار مع كل محاولة
            } else {
                // فشلت جميع المحاولات
                console.error('[Teachers] Modal elements not found after all retries:', {
                    modalTitle: !!document.getElementById('modalTitle'),
                    teacherForm: !!document.getElementById('teacherForm'),
                    teacherModal: !!document.getElementById('teacherModal'),
                    documentReady: document.readyState
                });
                
                // محاولة أخيرة - البحث في جميع أنحاء المستند
                const allModals = document.querySelectorAll('[id*="Modal"], [id*="modal"]');
                console.log('[Teachers] Found modals in document:', Array.from(allModals).map(m => m.id));
                
                alert('خطأ: لم يتم العثور على عناصر النافذة المنبثقة. الرجاء التأكد من تحميل الصفحة بالكامل ثم المحاولة مرة أخرى.');
            }
        };
        
        // بدء المحاولة
        tryOpenModal();
        
        return false;
    } catch (error) {
        console.error('[Teachers] Error opening add modal:', error);
        alert('حدث خطأ أثناء فتح نافذة الإضافة: ' + (error.message || 'خطأ غير معروف'));
        return false;
    }
};

// دالة مساعدة لفتح النافذة مع العناصر
function openModalWithElements(modalTitle, teacherForm, teacherModal) {
    try {
        // إعادة تعيين النموذج
        teacherForm.reset();
        
        // تحديث العنوان
        modalTitle.textContent = 'إضافة معلم جديد';
        
        // مسح جميع الحقول
        const nameField = document.getElementById('teacherName');
        const specializationField = document.getElementById('teacherSpecialization');
        const emailField = document.getElementById('teacherEmail');
        const phoneField = document.getElementById('teacherPhone');
        const salaryField = document.getElementById('teacherSalary');
        const statusField = document.getElementById('teacherStatus');
        
        if (nameField) nameField.value = '';
        if (specializationField) specializationField.value = '';
        if (emailField) emailField.value = '';
        if (phoneField) phoneField.value = '';
        if (salaryField) salaryField.value = '';
        if (statusField) statusField.value = '';
        
        // إظهار النافذة المنبثقة
        teacherModal.classList.remove('hidden');
        teacherModal.style.display = 'flex';
        
        // التأكد من أن المحتوى مرئي
        const modalContent = teacherModal.querySelector('div.bg-white');
        if (modalContent) {
            modalContent.style.display = 'block';
            modalContent.style.visibility = 'visible';
        }
        
        console.log('[Teachers] Modal opened successfully');
    } catch (error) {
        console.error('[Teachers] Error in openModalWithElements:', error);
        alert('حدث خطأ أثناء فتح نافذة الإضافة: ' + (error.message || 'خطأ غير معروف'));
    }
}

// تنسيق العملة
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    // تنسيق الرقم مع فواصل
    const formatted = new Intl.NumberFormat('ar-IQ').format(num);
    // إضافة العملة
    return `${formatted} د.ع`;
}

// التحقق من صحة البريد الإلكتروني
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// التحقق من صحة رقم الهاتف
function isValidPhone(phone) {
    // قبول أرقام تبدأ بـ 0 أو +964 أو بدون
    const phoneRegex = /^(\+?964|0)?[1-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
}

// إظهار إشعار
function showNotification(message, type = 'info') {
    // إزالة الإشعارات السابقة
    const existingNotification = document.getElementById('notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // إنشاء إشعار جديد
    const notification = document.createElement('div');
    notification.id = 'notification';
    notification.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-50 px-6 py-4 rounded-lg shadow-lg max-w-md ${
        type === 'success' ? 'bg-green-500 text-white' :
        type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
    }`;
    notification.innerHTML = `
        <div class="flex items-center gap-3">
            <i class="fas ${
                type === 'success' ? 'fa-check-circle' :
                type === 'error' ? 'fa-exclamation-circle' :
                'fa-info-circle'
            }"></i>
            <div>${message}</div>
            <button onclick="this.parentElement.parentElement.remove()" class="mr-auto text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // إزالة الإشعار تلقائياً بعد 5 ثوان
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// تحميل المعلمين
async function loadTeachers() {
    try {
        const response = await teachersAPI.getAll();
        if (response.success) {
            window.teachers = response.data;
            populateFilterOptions();
            renderTeachers();
        }
    } catch (error) {
        console.error('Error loading teachers:', error);
        alert('حدث خطأ أثناء تحميل المعلمين');
    }
}

// متغير لتخزين التصفية الحالية
let currentFilter = 'all';

// ملء قائمة التصفية بالمواد (التخصصات)
function populateFilterOptions() {
    if (!window.teachers || window.teachers.length === 0) {
        return;
    }
    
    // الحصول على التخصصات الفريدة
    const specializations = [...new Set(window.teachers.map(t => t.specialization).filter(s => s && s.trim() !== ''))].sort();
    
    const filterOptions = document.getElementById('filterOptions');
    if (!filterOptions) return;
    
    filterOptions.innerHTML = specializations.map(spec => `
        <button onclick="applyFilter('${spec}')" class="filter-option w-full text-right px-4 py-2.5 transition-all duration-200 text-sm font-medium" data-specialization="${spec}">
            <span class="filter-option-text">${spec}</span>
            <i class="fas fa-check filter-check-icon ml-2" style="display: none;"></i>
        </button>
    `).join('');
}

// تطبيق التصفية
function applyFilter(specialization) {
    currentFilter = specialization;
    
    // تحديث حالة الأزرار
    document.querySelectorAll('.filter-option').forEach(btn => {
        btn.classList.remove('active');
        const icon = btn.querySelector('.filter-check-icon');
        if (icon) {
            icon.style.display = 'none';
            icon.style.opacity = '0';
            icon.style.transform = 'scale(0)';
        }
    });
    
    // تفعيل الزر المختار
    let selectedBtn = null;
    if (specialization === 'all') {
        selectedBtn = document.querySelector('.filter-option:first-child');
    } else {
        selectedBtn = document.querySelector(`.filter-option[data-specialization="${specialization}"]`);
    }
    
    if (selectedBtn) {
        selectedBtn.classList.add('active');
        const icon = selectedBtn.querySelector('.filter-check-icon');
        if (icon) {
            icon.style.display = 'inline-block';
            // استخدام setTimeout لإضافة تأثير سلس
            setTimeout(() => {
                icon.style.opacity = '1';
                icon.style.transform = 'scale(1)';
            }, 50);
        }
    }
    
    // إغلاق القائمة المنسدلة بعد تأخير بسيط
    const dropdown = document.getElementById('filterDropdown');
    if (dropdown) {
        setTimeout(() => {
            dropdown.classList.add('hidden');
            dropdown.style.display = 'none';
        }, 150);
    }
    
    // إعادة عرض الجدول
    renderTeachers();
}

// عرض المعلمين
function renderTeachers() {
    const searchQuery = document.getElementById('searchQuery').value.toLowerCase();
    
    // تطبيق التصفية حسب التخصص
    let filtered = window.teachers;
    if (currentFilter !== 'all') {
        filtered = filtered.filter(t => t.specialization === currentFilter);
    }
    
    // تطبيق البحث
    if (searchQuery) {
        filtered = filtered.filter(t => 
            t.name.toLowerCase().includes(searchQuery) ||
            t.specialization.toLowerCase().includes(searchQuery) ||
            t.email.toLowerCase().includes(searchQuery)
        );
    }
    
    const tbody = document.getElementById('teachersTableBody');
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا يوجد معلمين</td></tr>';
        return;
    }
    
    // دالة للحصول على الحرف الأول من الاسم
    const getFirstLetter = (name) => {
        if (!name || name.trim() === '') return 'ع';
        return name.trim().charAt(0);
    };
    
    tbody.innerHTML = filtered.map(teacher => {
        const id = teacher.id || 0;
        const name = teacher.name || 'غير محدد';
        const specialization = teacher.specialization || 'غير محدد';
        const email = teacher.email || '';
        const phone = teacher.phone || '';
        const salary = teacher.salary || 0;
        const status = teacher.status || 'نشط';
        const firstLetter = getFirstLetter(name);
        
        return `
        <tr>
            <td>
                <div class="teacher-name-cell">
                    <div class="teacher-avatar">${firstLetter}</div>
                    <div class="teacher-info">
                        <div class="teacher-name">${name}</div>
                        <div class="teacher-badge">
                            <i class="fas fa-star"></i>
                            <span>معلم متميز</span>
                        </div>
                    </div>
                </div>
            </td>
            <td>
                <div class="specialization-cell">
                    <div class="specialization-name">${specialization}</div>
                </div>
            </td>
            <td>${email}</td>
            <td>
                <div class="contact-cell">
                    <div class="contact-phone">
                        <i class="fas fa-phone"></i>
                        <span>${phone}</span>
                    </div>
                </div>
            </td>
            <td>${formatCurrency(salary)}</td>
            <td>
                <div class="actions-group">
                    <button onclick="editTeacher(${id})" class="btn-edit-icon" type="button" title="تعديل المعلم">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTeacher(${id})" class="btn-delete-icon" type="button" title="حذف المعلم">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button onclick="viewTeacher(${id})" class="btn-view-icon" type="button" title="الملف الشخصي">
                        <i class="fas fa-user"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
}

// فتح نافذة الإضافة (تم تعريفها أعلاه في window.openAddModal)
// هذه الدالة موجودة فقط للتوافق مع الكود القديم
const openAddModal = window.openAddModal;

// تعديل معلم
function editTeacher(id) {
    try {
        console.log('editTeacher called with id:', id, 'Type:', typeof id);
        console.log('Available teachers:', window.teachers);
        
        // البحث عن المعلم - محاولة مطابقة مختلفة
        let teacher = window.teachers.find(t => t.id == id);
        if (!teacher) {
            teacher = window.teachers.find(t => t.id === id);
        }
        if (!teacher) {
            teacher = window.teachers.find(t => String(t.id) === String(id));
        }
        
        if (!teacher) {
            console.error('Teacher not found with id:', id);
            console.error('Available IDs:', window.teachers.map(t => ({ id: t.id, type: typeof t.id })));
            alert('المعلم غير موجود. الرجاء تحديث الصفحة والمحاولة مرة أخرى.');
            return;
        }
        
        console.log('Found teacher:', teacher);
        
        setCurrentEditId(id);
        
        // تحديث العنوان
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'تعديل معلم';
        }
        
        // ملء الحقول
        const nameField = document.getElementById('teacherName');
        const specializationField = document.getElementById('teacherSpecialization');
        const emailField = document.getElementById('teacherEmail');
        const phoneField = document.getElementById('teacherPhone');
        const salaryField = document.getElementById('teacherSalary');
        
        if (nameField) nameField.value = teacher.name || '';
        if (specializationField) specializationField.value = teacher.specialization || '';
        if (emailField) emailField.value = teacher.email || '';
        if (phoneField) phoneField.value = teacher.phone || '';
        if (salaryField) salaryField.value = teacher.salary || '';
        
        // ملء حقل الحالة
        const statusField = document.getElementById('teacherStatus');
        if (statusField) {
            statusField.value = teacher.status || 'نشط';
        }
        
        // فتح النافذة المنبثقة
        const modal = document.getElementById('teacherModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            
            // التأكد من أن المحتوى ظاهر
            const modalContent = modal.querySelector('div.bg-white');
            if (modalContent) {
                modalContent.style.display = 'block';
                modalContent.style.visibility = 'visible';
            }
            
            console.log('Modal opened successfully');
        } else {
            console.error('Modal element not found');
            alert('خطأ: لم يتم العثور على نافذة التعديل');
        }
    } catch (error) {
        console.error('Error in editTeacher:', error);
        alert('حدث خطأ أثناء فتح نافذة التعديل: ' + (error.message || 'خطأ غير معروف'));
    }
}

// متغير لتخزين بيانات المعلم الحالي للعرض
let currentViewTeacher = null;

// عرض تفاصيل المعلم
function viewTeacher(id) {
    try {
        const teacher = window.teachers.find(t => t.id == id || t.id === id);
        if (!teacher) {
            alert('المعلم غير موجود');
            return;
        }
        
        // حفظ بيانات المعلم للطباعة
        currentViewTeacher = teacher;
        
        // الحصول على الحرف الأول من الاسم
        const getFirstLetter = (name) => {
            if (!name || name.trim() === '') return 'ع';
            return name.trim().charAt(0);
        };
        
        const firstLetter = getFirstLetter(teacher.name);
        
        // ملء النافذة المنبثقة بالبيانات
        const modal = document.getElementById('viewTeacherModal');
        if (modal) {
            // تحديث البيانات
            document.getElementById('viewTeacherName').textContent = teacher.name || 'غير محدد';
            document.getElementById('viewTeacherSpecialization').textContent = teacher.specialization || 'غير محدد';
            document.getElementById('viewTeacherId').textContent = teacher.id || 'غير محدد';
            document.getElementById('viewTeacherEmail').textContent = teacher.email || 'غير محدد';
            document.getElementById('viewTeacherPhone').textContent = teacher.phone || 'غير محدد';
            document.getElementById('viewTeacherSalary').textContent = formatCurrency(teacher.salary || 0);
            document.getElementById('viewTeacherStatus').textContent = teacher.status || 'نشط';
            document.getElementById('viewTeacherInitial').textContent = firstLetter;
            
            // تنسيق تاريخ التسجيل إن كان موجوداً
            const createdAtEl = document.getElementById('viewTeacherCreatedAt');
            if (createdAtEl) {
                if (teacher.created_at) {
                    const date = new Date(teacher.created_at);
                    const formattedDate = date.toLocaleDateString('ar-IQ', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    });
                    createdAtEl.textContent = formattedDate;
                } else {
                    createdAtEl.textContent = 'غير محدد';
                }
            }
            
            // إظهار النافذة
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            
            // التأكد من أن محتوى النافذة ظاهر
            const modalContent = modal.querySelector('div.bg-white');
            if (modalContent) {
                modalContent.style.display = 'block';
                modalContent.style.visibility = 'visible';
            }
            
            console.log('[Teachers] View teacher modal opened');
        } else {
            // Fallback إلى alert إذا لم تكن النافذة موجودة
            const message = `
الاسم: ${teacher.name || 'غير محدد'}
التخصص: ${teacher.specialization || 'غير محدد'}
البريد الإلكتروني: ${teacher.email || 'غير محدد'}
الهاتف: ${teacher.phone || 'غير محدد'}
الراتب: ${formatCurrency(teacher.salary || 0)}
الحالة: ${teacher.status || 'نشط'}
            `.trim();
            alert(message);
        }
    } catch (error) {
        console.error('Error in viewTeacher:', error);
        alert('حدث خطأ أثناء عرض تفاصيل المعلم');
    }
}

// إغلاق نافذة عرض الملف الشخصي
function closeViewModal() {
    const modal = document.getElementById('viewTeacherModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    currentViewTeacher = null;
}

// طباعة معلومات المعلم
function printTeacherProfile() {
    if (!currentViewTeacher) {
        alert('لا توجد معلومات للطباعة');
        return;
    }
    
    const teacher = currentViewTeacher;
    const getFirstLetter = (name) => {
        if (!name || name.trim() === '') return 'ع';
        return name.trim().charAt(0);
    };
    const firstLetter = getFirstLetter(teacher.name);
    
    // إنشاء نافذة طباعة
    const printWindow = window.open('', '_blank');
    const printContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ملف المعلم - ${teacher.name}</title>
    <style>
        @media print {
            @page {
                margin: 2cm;
            }
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            direction: rtl;
            padding: 40px;
            background: white;
            color: #333;
        }
        .header {
            background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 10px 0 0 0;
            opacity: 0.9;
        }
        .info-section {
            margin: 25px 0;
            padding: 20px;
            background: #f9fafb;
            border-radius: 8px;
            border-right: 4px solid #9333ea;
        }
        .info-label {
            font-size: 14px;
            color: #6b7280;
            margin-bottom: 8px;
        }
        .info-value {
            font-size: 18px;
            font-weight: 600;
            color: #111827;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #e5e7eb;
            text-align: center;
            color: #6b7280;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>ملف المعلم الشخصي</h1>
        <p>نظام إدارة المدرسة</p>
    </div>
    
    <div class="info-section">
        <div class="info-label">رقم المعلم</div>
        <div class="info-value">${teacher.id || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">الاسم الكامل</div>
        <div class="info-value">${teacher.name || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">التخصص</div>
        <div class="info-value">${teacher.specialization || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">البريد الإلكتروني</div>
        <div class="info-value">${teacher.email || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">رقم الهاتف</div>
        <div class="info-value">${teacher.phone || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">الراتب</div>
        <div class="info-value">${formatCurrency(teacher.salary || 0)}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">الحالة</div>
        <div class="info-value">${teacher.status || 'نشط'}</div>
    </div>
    
    ${teacher.created_at ? `
    <div class="info-section">
        <div class="info-label">تاريخ التسجيل</div>
        <div class="info-value">${new Date(teacher.created_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </div>
    ` : ''}
    
    <div class="footer">
        <p>تم الطباعة في: ${new Date().toLocaleString('ar-IQ')}</p>
        <p>© 2024 نظام إدارة المدرسة - جميع الحقوق محفوظة</p>
    </div>
    
    <script>
        window.onload = function() {
            window.print();
        };
    </script>
</body>
</html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
}

// دالة حفظ بيانات المعلم (موحدة)
async function saveTeacherData() {
    try {
        // استخراج البيانات من الحقول
        const name = document.getElementById('teacherName').value.trim();
        const specialization = document.getElementById('teacherSpecialization').value.trim();
        const email = document.getElementById('teacherEmail').value.trim();
        const phone = document.getElementById('teacherPhone').value.trim();
        const salary = document.getElementById('teacherSalary').value.trim();
        const status = document.getElementById('teacherStatus').value;
        
        // التحقق من الحقول المطلوبة (التي بجانبها *)
        const errors = [];
        const requiredFields = [
            { id: 'teacherName', name: 'الاسم', value: name },
            { id: 'teacherSpecialization', name: 'التخصص', value: specialization },
            { id: 'teacherEmail', name: 'البريد الإلكتروني', value: email },
            { id: 'teacherPhone', name: 'الهاتف', value: phone },
            { id: 'teacherSalary', name: 'الراتب', value: salary },
            { id: 'teacherStatus', name: 'الحالة', value: status }
        ];
        
        // التحقق من الحقول المطلوبة
        requiredFields.forEach(field => {
            const element = document.getElementById(field.id);
            if (!field.value) {
                errors.push(`${field.name} مطلوب`);
                if (element) {
                    element.classList.add('border-red-500');
                }
            } else {
                if (element) {
                    element.classList.remove('border-red-500');
                }
            }
        });
        
        // التحقق من صحة البريد الإلكتروني
        if (email && !isValidEmail(email)) {
            errors.push('البريد الإلكتروني غير صحيح');
            document.getElementById('teacherEmail').classList.add('border-red-500');
        }
        
        // التحقق من صحة رقم الهاتف
        if (phone && !isValidPhone(phone)) {
            errors.push('رقم الهاتف غير صحيح');
            document.getElementById('teacherPhone').classList.add('border-red-500');
        }
        
        // التحقق من صحة الراتب
        if (salary && (isNaN(parseFloat(salary)) || parseFloat(salary) < 0)) {
            errors.push('الراتب يجب أن يكون رقماً صحيحاً');
            document.getElementById('teacherSalary').classList.add('border-red-500');
        }
        
        // إظهار التنبيه في حال وجود أخطاء
        if (errors.length > 0) {
            showNotification(errors.join('<br>'), 'error');
            return;
        }
        
        // تجهيز البيانات
        const formData = {
            name,
            specialization,
            email,
            phone,
            salary: parseFloat(salary),
            status
        };
        
        // تعطيل زر الحفظ أثناء الإرسال
        const submitBtn = document.querySelector('#teacherForm button[type="submit"]');
        const submitText = document.getElementById('submitButtonText');
        const originalText = submitText ? submitText.textContent : 'حفظ';
        
        if (submitBtn) {
            submitBtn.disabled = true;
        }
        if (submitText) {
            submitText.textContent = 'جاري الحفظ...';
        }
        
        // تحديد العملية: إضافة أو تعديل
        const editId = getCurrentEditId();
        let response;
        
        try {
            if (editId) {
                // عملية التعديل
                console.log('[Teachers] Updating teacher with ID:', editId);
                response = await teachersAPI.update(editId, formData);
            } else {
                // عملية الإضافة
                console.log('[Teachers] Creating new teacher');
                response = await teachersAPI.create(formData);
            }
            
            console.log('[Teachers] API Response:', response);
            
            if (response && response.success) {
                // إغلاق النافذة المنبثقة
                closeModal();
                
                // تحديث الجدول فوراً دون إعادة تحميل الصفحة
                await loadTeachers();
                
                // إظهار رسالة النجاح
                showNotification(response.message || 'تم الحفظ بنجاح', 'success');
            } else {
                showNotification(response?.message || 'حدث خطأ أثناء الحفظ', 'error');
            }
        } catch (apiError) {
            console.error('[Teachers] API Error:', apiError);
            showNotification('حدث خطأ في الاتصال بالخادم: ' + (apiError.message || 'خطأ غير معروف'), 'error');
        } finally {
            // إعادة تفعيل زر الحفظ
            if (submitBtn) {
                submitBtn.disabled = false;
            }
            if (submitText) {
                submitText.textContent = originalText;
            }
        }
        
    } catch (error) {
        console.error('[Teachers] Error in saveTeacherData:', error);
        showNotification('حدث خطأ غير متوقع: ' + (error.message || 'خطأ غير معروف'), 'error');
    }
}

// حفظ معلم (الدالة القديمة للتوافق)
async function saveTeacher(event) {
    if (event) {
        event.preventDefault();
    }
    await saveTeacherData();
}

// متغير لتخزين ID المعلم المراد حذفه
let teacherToDeleteId = null;

// حذف معلم
async function deleteTeacher(id) {
    try {
        // البحث عن المعلم للحصول على اسمه
        const teacher = window.teachers.find(t => t.id == id || t.id === id);
        const teacherName = teacher ? teacher.name : 'هذا السجل';
        
        // حفظ ID المعلم المراد حذفه
        teacherToDeleteId = id;
        
        // إظهار نافذة التأكيد
        const modal = document.getElementById('deleteConfirmModal');
        if (modal) {
            // تحديث رسالة التأكيد
            const messageEl = document.getElementById('deleteConfirmMessage');
            if (messageEl) {
                messageEl.textContent = `هل تريد حذف المعلم "${teacherName}"؟ هذا الإجراء لا يمكن التراجع عنه.`;
            }
            
            // إظهار النافذة
            modal.classList.remove('hidden');
            modal.style.display = 'flex';
            
            // التأكد من أن محتوى النافذة ظاهر
            const modalContent = modal.querySelector('div.bg-white');
            if (modalContent) {
                modalContent.style.display = 'block';
                modalContent.style.visibility = 'visible';
            }
            
            console.log('[Teachers] Delete confirmation modal opened');
        } else {
            // Fallback إلى confirm إذا لم تكن النافذة موجودة
            if (confirm(`هل تريد حذف المعلم "${teacherName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
                await performDelete(id);
            }
        }
    } catch (error) {
        console.error('Error in deleteTeacher:', error);
        alert('حدث خطأ أثناء محاولة الحذف');
    }
}

// تأكيد الحذف
async function confirmDelete() {
    if (teacherToDeleteId !== null) {
        await performDelete(teacherToDeleteId);
        closeDeleteModal();
    }
}

// تنفيذ الحذف
async function performDelete(id) {
    try {
        console.log('Deleting teacher with id:', id);
        const response = await teachersAPI.delete(id);
        console.log('Delete response:', response);
        
        if (response && response.success) {
            // حذف من المصفوفة المحلية
            window.teachers = window.teachers.filter(t => t.id != id && t.id !== id);
            
            // تحديث الجدول فوراً دون إعادة تحميل الصفحة
            renderTeachers();
            
            // إظهار رسالة نجاح
            showNotification('تم حذف السجل بنجاح', 'success');
        } else {
            showNotification(response?.message || 'حدث خطأ أثناء الحذف', 'error');
        }
    } catch (error) {
        console.error('Error deleting teacher:', error);
        showNotification('حدث خطأ أثناء الحذف: ' + (error.message || 'خطأ غير معروف'), 'error');
    }
}

// إغلاق نافذة التأكيد
function closeDeleteModal() {
    const modal = document.getElementById('deleteConfirmModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    teacherToDeleteId = null;
}

// إغلاق النافذة
function closeModal() {
    const modal = document.getElementById('teacherModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    setCurrentEditId(null);
    const form = document.getElementById('teacherForm');
    if (form) {
        form.reset();
    }
}

// إغلاق النافذة عند النقر خارجها
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('teacherModal');
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
});

// دالة تهيئة الصفحة
function initTeachersPage() {
    console.log('[Teachers] Initializing teachers page');
    try {
        // التأكد من أن الجدول ظاهر
        const teachersTable = document.getElementById('teachersTable');
        if (teachersTable) {
            teachersTable.style.display = 'table';
            teachersTable.style.visibility = 'visible';
            teachersTable.classList.remove('hidden');
        }
        
        const tableContainer = document.querySelector('.overflow-x-auto, .w-full.overflow-x-auto');
        if (tableContainer) {
            tableContainer.style.display = 'block';
            tableContainer.style.visibility = 'visible';
            tableContainer.classList.remove('hidden');
        }
        
        // استخدام DataManager لجلب البيانات
        if (window.sectionDataLoaders && window.sectionDataLoaders.loadTeachers) {
            window.sectionDataLoaders.loadTeachers();
        } else {
            // Fallback للطريقة القديمة
            loadTeachers();
        }
        
        const searchInput = document.getElementById('searchQuery');
        if (searchInput) {
            searchInput.addEventListener('input', renderTeachers);
        }
        
        // ربط زر الإضافة ب event listener لمنع إعادة التحميل
        const addButton = document.querySelector('button.btn-add[onclick*="openAddModal"], button[onclick*="openAddModal"]');
        if (addButton) {
            // إزالة onclick القديم
            addButton.removeAttribute('onclick');
            // إضافة event listener جديد
            addButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openAddModal(e);
                return false;
            });
        }
        
        // إعداد زر التصفية والقائمة المنسدلة
        const filterButton = document.getElementById('filterButton');
        const filterDropdown = document.getElementById('filterDropdown');
        
        if (filterButton && filterDropdown) {
            // التأكد من أن القائمة مخفية في البداية
            filterDropdown.classList.add('hidden');
            filterDropdown.style.display = 'none';
            
            filterButton.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                const isHidden = filterDropdown.classList.contains('hidden') || filterDropdown.style.display === 'none';
                if (isHidden) {
                    filterDropdown.classList.remove('hidden');
                    filterDropdown.style.display = 'block';
                } else {
                    filterDropdown.classList.add('hidden');
                    filterDropdown.style.display = 'none';
                }
            });
            
            // إغلاق القائمة عند النقر خارجها
            document.addEventListener('click', function(e) {
                if (filterButton && filterDropdown && 
                    !filterButton.contains(e.target) && 
                    !filterDropdown.contains(e.target)) {
                    filterDropdown.classList.add('hidden');
                    filterDropdown.style.display = 'none';
                }
            });
            
            // تفعيل خيار "جميع المواد" افتراضياً
            const allOption = document.querySelector('.filter-option:first-child');
            if (allOption) {
                allOption.classList.add('active');
                const icon = allOption.querySelector('.filter-check-icon');
                if (icon) {
                    icon.style.display = 'inline-block';
                    icon.style.opacity = '1';
                    icon.style.transform = 'scale(1)';
                }
            }
        }
        
        // التأكد من أن الدوال متاحة عالمياً
        // التأكد من أن الدوال متاحة عالمياً (قبل initTeachersPage أيضاً)
        window.editTeacher = editTeacher;
        window.deleteTeacher = deleteTeacher;
        window.viewTeacher = viewTeacher;
        window.applyFilter = applyFilter;
        window.openAddModal = openAddModal;
        window.closeModal = closeModal;
        window.saveTeacher = saveTeacher;
        window.saveTeacherData = saveTeacherData;
        window.confirmDelete = confirmDelete;
        window.closeDeleteModal = closeDeleteModal;
        
        console.log('[Teachers] Functions exposed globally:', {
            openAddModal: typeof window.openAddModal,
            closeModal: typeof window.closeModal,
            saveTeacher: typeof window.saveTeacher,
            saveTeacherData: typeof window.saveTeacherData
        });
        
        console.log('[Teachers] Teachers page initialized');
    } catch (error) {
        console.error('[Teachers] Error initializing page:', error);
    }
}

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initTeachersPage);

// أيضاً استماع لحدث تحميل الصفحة من Router
document.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'teachers') {
        console.log('[Teachers] Page loaded event received, initializing');
        setTimeout(() => {
            // التأكد من أن الجدول ظاهر
            const teachersTable = document.getElementById('teachersTable');
            if (teachersTable) {
                teachersTable.style.display = 'table';
                teachersTable.style.visibility = 'visible';
                teachersTable.classList.remove('hidden');
            }
            
            const tableContainer = document.querySelector('.w-full.overflow-x-auto');
            if (tableContainer) {
                tableContainer.style.display = 'block';
                tableContainer.style.visibility = 'visible';
                tableContainer.classList.remove('hidden');
            }
            
            initTeachersPage();
        }, 100);
    }
});

// استماع لحدث تغيير الصفحة
document.addEventListener('DOMContentLoaded', function() {
    // التأكد من أن الجدول ظاهر عند تحميل الصفحة
    if (window.location.pathname.includes('teachers') || document.getElementById('teachersTable')) {
        setTimeout(() => {
            const teachersTable = document.getElementById('teachersTable');
            if (teachersTable) {
                teachersTable.style.display = 'table';
                teachersTable.style.visibility = 'visible';
                teachersTable.classList.remove('hidden');
            }
        }, 200);
    }
});

// فتح نافذة الإضافة تلقائياً إذا كان معامل action=add موجود في URL
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
        // انتظار تحميل الصفحة بالكامل ثم فتح النافذة
        setTimeout(() => {
            if (typeof window.openAddModal === 'function') {
                window.openAddModal();
            }
        }, 500);
    }
});

// الاستماع لرسائل من النوافذ الخارجية لتحديث القائمة
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'teacherAdded') {
        console.log('[Teachers] Teacher added from external window, refreshing list...');
        // تحديث قائمة المعلمين
        loadTeachers();
    }
});
