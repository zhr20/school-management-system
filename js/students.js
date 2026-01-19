let students = [];
// استخدام namespace لتجنب إعادة التعريف في SPA
if (typeof window.studentsModule === 'undefined') {
    window.studentsModule = {
        currentEditId: null
    };
}
// إنشاء مرجع محلي للوصول السريع
const getCurrentEditId = () => window.studentsModule.currentEditId;
const setCurrentEditId = (value) => { window.studentsModule.currentEditId = value; };

// تحميل الطلاب
async function loadStudents() {
    try {
        // التأكد من أن الجدول ظاهر قبل التحميل
        const studentsTable = document.getElementById('studentsTable');
        if (studentsTable) {
            studentsTable.style.display = 'table';
            studentsTable.style.visibility = 'visible';
            studentsTable.classList.remove('hidden');
        }
        
        const tableContainer = document.querySelector('.w-full.overflow-x-auto, .overflow-x-auto');
        if (tableContainer) {
            tableContainer.style.display = 'block';
            tableContainer.style.visibility = 'visible';
            tableContainer.classList.remove('hidden');
        }
        
        const response = await studentsAPI.getAll();
        if (response.success) {
            students = response.data;
            renderStudents();
            
            // التأكد مرة أخرى من أن الجدول ظاهر بعد التحميل
            if (studentsTable) {
                studentsTable.style.display = 'table';
                studentsTable.style.visibility = 'visible';
                studentsTable.classList.remove('hidden');
            }
            
            if (tableContainer) {
                tableContainer.style.display = 'block';
                tableContainer.style.visibility = 'visible';
                tableContainer.classList.remove('hidden');
            }
        }
    } catch (error) {
        console.error('Error loading students:', error);
        alert('حدث خطأ أثناء تحميل الطلاب');
    }
}

// عرض الطلاب
function renderStudents() {
    try {
        // التأكد من أن الجدول ظاهر قبل العرض
        const studentsTable = document.getElementById('studentsTable');
        if (studentsTable) {
            studentsTable.style.display = 'table';
            studentsTable.style.visibility = 'visible';
            studentsTable.classList.remove('hidden');
        }
        
        const tableContainer = document.querySelector('.w-full.overflow-x-auto, .overflow-x-auto');
        if (tableContainer) {
            tableContainer.style.display = 'block';
            tableContainer.style.visibility = 'visible';
            tableContainer.classList.remove('hidden');
        }
        
        // الحصول على قيمة البحث
        const searchInput = document.getElementById('searchQuery');
        const searchQuery = searchInput ? searchInput.value.toLowerCase().trim() : '';
        
        console.log('[Students] Rendering students, search query:', searchQuery, 'Total students:', students.length);
        
        // فلترة الطلاب بناءً على البحث
        const filtered = searchQuery 
            ? students.filter(s => {
                const name = s.name ? s.name.toLowerCase() : '';
                const studentNumber = s.student_number ? s.student_number.toLowerCase() : '';
                const studentClass = s.class ? s.class.toLowerCase() : '';
                const email = s.email ? s.email.toLowerCase() : '';
                const phone = s.phone ? s.phone.toLowerCase() : '';
                
                return name.includes(searchQuery) ||
                       studentNumber.includes(searchQuery) ||
                       studentClass.includes(searchQuery) ||
                       email.includes(searchQuery) ||
                       phone.includes(searchQuery);
              })
            : students;
        
        console.log('[Students] Filtered students count:', filtered.length);
    
        const tbody = document.getElementById('studentsTableBody');
        if (!tbody) {
            console.error('[Students] Table body not found');
            return;
        }
        
        // التأكد من أن tbody ظاهر
        tbody.style.display = 'table-row-group';
        tbody.style.visibility = 'visible';
        tbody.classList.remove('hidden');
        
        if (filtered.length === 0) {
            if (searchQuery) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 3rem 1.5rem;"><span class="text-sm text-gray-500">لا توجد نتائج للبحث</span></td></tr>';
            } else {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 3rem 1.5rem;"><span class="text-sm text-gray-500">لا توجد طلاب</span></td></tr>';
            }
            return;
        }
    
    // دالة للحصول على الحرف الأول من الاسم
    const getFirstLetter = (name) => {
        if (!name || name.trim() === '') return 'ط';
        return name.trim().charAt(0);
    };
    
    tbody.innerHTML = filtered.map(student => {
        const id = student.id || 0;
        const name = student.name || 'غير محدد';
        const studentNumber = student.student_number || 'غير محدد';
        const studentClass = student.class || 'غير محدد';
        const age = student.age || '';
        const email = student.email || '';
        const phone = student.phone || '';
        const firstLetter = getFirstLetter(name);
        
        return `
        <tr>
            <td>
                <div class="student-name-cell">
                    <div class="student-avatar">${firstLetter}</div>
                    <div class="student-info">
                        <div class="student-name">${name}</div>
                        <div class="student-badge">
                            <i class="fas fa-graduation-cap"></i>
                            <span>طالب</span>
                        </div>
                    </div>
                </div>
            </td>
            <td>${studentNumber}</td>
            <td>${studentClass}</td>
            <td>${age}</td>
            <td>${email}</td>
            <td>
                <div class="contact-cell">
                    <div class="contact-phone">
                        <i class="fas fa-phone"></i>
                        <span>${phone}</span>
                    </div>
                </div>
            </td>
            <td>
                <div class="actions-group">
                    <button onclick="viewStudent(${id})" class="btn-view-icon" type="button" title="الملف الشخصي">
                        <i class="fas fa-user"></i>
                    </button>
                    <button onclick="editStudent(${id})" class="btn-edit-icon" type="button" title="تعديل الطالب">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteStudent(${id})" class="btn-delete-icon" type="button" title="حذف الطالب">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).join('');
    } catch (error) {
        console.error('[Students] Error rendering students:', error);
        const tbody = document.getElementById('studentsTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center" style="padding: 3rem 1.5rem;"><span class="text-sm text-red-500">حدث خطأ أثناء عرض الطلاب</span></td></tr>';
        }
    }
}

// فتح نافذة الإضافة
function openAddModal(event) {
    try {
        // منع السلوك الافتراضي وإعادة التحميل
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }
        
        console.log('[Students] openAddModal called');
        setCurrentEditId(null);
        
        const modalTitle = document.getElementById('modalTitle');
        const studentForm = document.getElementById('studentForm');
        const studentModal = document.getElementById('studentModal');
        
        if (!modalTitle || !studentForm || !studentModal) {
            console.error('[Students] Modal elements not found:', {
                modalTitle: !!modalTitle,
                studentForm: !!studentForm,
                studentModal: !!studentModal
            });
            alert('خطأ: لم يتم العثور على عناصر النافذة المنبثقة. الرجاء تحديث الصفحة.');
            return;
        }
        
        // إعادة تعيين النموذج
        studentForm.reset();
        
        // تحديث العنوان
        modalTitle.textContent = 'إضافة طالب جديد';
        
        // مسح جميع الحقول
        const nameField = document.getElementById('studentName');
        const classField = document.getElementById('studentClass');
        const ageField = document.getElementById('studentAge');
        const emailField = document.getElementById('studentEmail');
        const phoneField = document.getElementById('studentPhone');
        const numberField = document.getElementById('studentNumber');
        const passwordField = document.getElementById('studentPassword');
        
        if (nameField) nameField.value = '';
        if (classField) classField.value = '';
        if (ageField) ageField.value = '';
        if (emailField) emailField.value = '';
        if (phoneField) phoneField.value = '';
        if (numberField) numberField.value = '';
        if (passwordField) passwordField.value = '';
        
        // تحديث نص تلميح كلمة المرور
        const passwordHint = document.getElementById('passwordHint');
        if (passwordHint) {
            passwordHint.textContent = '(اتركه فارغاً للاحتفاظ بالكلمة الحالية)';
        }
        
        // إظهار النافذة المنبثقة
        studentModal.classList.remove('hidden');
        studentModal.style.display = 'flex';
        studentModal.style.visibility = 'visible';
        studentModal.style.opacity = '1';
        
        // التأكد من أن المحتوى مرئي
        const modalContent = studentModal.querySelector('div.bg-white');
        if (modalContent) {
            modalContent.style.display = 'block';
            modalContent.style.visibility = 'visible';
            modalContent.style.opacity = '1';
        }
        
        // التأكد من أن جميع العناصر الداخلية مرئية
        const allElements = studentModal.querySelectorAll('*');
        allElements.forEach(el => {
            el.style.visibility = 'visible';
            el.style.opacity = '1';
        });
        
        console.log('[Students] Modal opened successfully');
        
        // منع إعادة التحميل
        return false;
    } catch (error) {
        console.error('[Students] Error opening add modal:', error);
        alert('حدث خطأ أثناء فتح نافذة الإضافة: ' + (error.message || 'خطأ غير معروف'));
        return false;
    }
}

// تعديل طالب
function editStudent(id) {
    try {
        console.log('editStudent called with id:', id);
        const student = students.find(s => s.id == id || s.id === id);
        
        if (!student) {
            console.error('Student not found with id:', id);
            alert('الطالب غير موجود');
            return;
        }
        
        console.log('Found student:', student);
        
        setCurrentEditId(id);
        document.getElementById('modalTitle').textContent = 'تعديل طالب';
        document.getElementById('studentName').value = student.name || '';
        document.getElementById('studentClass').value = student.class || '';
        document.getElementById('studentAge').value = student.age || '';
        document.getElementById('studentEmail').value = student.email || '';
        document.getElementById('studentPhone').value = student.phone || '';
        document.getElementById('studentNumber').value = student.student_number || '';
        document.getElementById('studentPassword').value = '';
        document.getElementById('passwordHint').textContent = '(اتركه فارغاً للاحتفاظ بالكلمة الحالية)';
        
        const modal = document.getElementById('studentModal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('Modal opened');
        } else {
            console.error('Modal element not found');
        }
    } catch (error) {
        console.error('Error in editStudent:', error);
        alert('حدث خطأ أثناء فتح نافذة التعديل: ' + error.message);
    }
}

// حفظ طالب
async function saveStudent(event) {
    event.preventDefault();
    
    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'جاري الحفظ...';
        }
        
        const formData = {
            name: document.getElementById('studentName').value.trim(),
            class: document.getElementById('studentClass').value,
            age: parseInt(document.getElementById('studentAge').value),
            email: document.getElementById('studentEmail').value.trim(),
            phone: document.getElementById('studentPhone').value.trim(),
            student_number: document.getElementById('studentNumber').value.trim() || null,
        };
        
        if (!formData.name || !formData.class || !formData.age || !formData.email || !formData.phone) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'حفظ';
            }
            return;
        }
        
        const password = document.getElementById('studentPassword').value;
        const editId = getCurrentEditId();
        if (password) {
            formData.password = password;
        } else if (!editId) {
            formData.password = '123456';
        }
        
        let response;
        if (editId) {
            response = await studentsAPI.update(editId, formData);
        } else {
            response = await studentsAPI.create(formData);
        }
        
        if (response && response.success) {
            closeModal();
            await loadStudents();
            
            // التأكد من أن الجدول يبقى ظاهراً بعد التعديل
            const studentsTable = document.getElementById('studentsTable');
            if (studentsTable) {
                studentsTable.style.display = 'table';
                studentsTable.style.visibility = 'visible';
                studentsTable.classList.remove('hidden');
            }
            
            const tableContainer = document.querySelector('.w-full.overflow-x-auto, .overflow-x-auto');
            if (tableContainer) {
                tableContainer.style.display = 'block';
                tableContainer.style.visibility = 'visible';
                tableContainer.classList.remove('hidden');
            }
            
            const tableBody = document.getElementById('studentsTableBody');
            if (tableBody) {
                tableBody.style.display = 'table-row-group';
                tableBody.style.visibility = 'visible';
                tableBody.classList.remove('hidden');
            }
            
            alert(response.message || 'تم الحفظ بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحفظ');
        }
    } catch (error) {
        console.error('Error saving student:', error);
        alert('حدث خطأ أثناء الحفظ: ' + (error.message || 'خطأ غير معروف'));
    } finally {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'حفظ';
        }
    }
}

// حذف طالب
async function deleteStudent(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب؟')) return;
    
    try {
        console.log('Deleting student with id:', id);
        const response = await studentsAPI.delete(id);
        console.log('Delete response:', response);
        
        if (response && response.success) {
            await loadStudents();
            
            // التأكد من أن الجدول يبقى ظاهراً بعد الحذف
            const studentsTable = document.getElementById('studentsTable');
            if (studentsTable) {
                studentsTable.style.display = 'table';
                studentsTable.style.visibility = 'visible';
                studentsTable.classList.remove('hidden');
            }
            
            const tableContainer = document.querySelector('.w-full.overflow-x-auto, .overflow-x-auto');
            if (tableContainer) {
                tableContainer.style.display = 'block';
                tableContainer.style.visibility = 'visible';
                tableContainer.classList.remove('hidden');
            }
            
            const tableBody = document.getElementById('studentsTableBody');
            if (tableBody) {
                tableBody.style.display = 'table-row-group';
                tableBody.style.visibility = 'visible';
                tableBody.classList.remove('hidden');
            }
            
            alert('تم حذف الطالب بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحذف');
        }
    } catch (error) {
        console.error('Error deleting student:', error);
        alert('حدث خطأ أثناء الحذف: ' + (error.message || 'خطأ غير معروف'));
    }
}

// متغير لتخزين بيانات الطالب الحالي للعرض
let currentViewStudent = null;

// عرض تفاصيل الطالب
function viewStudent(id) {
    try {
        const student = students.find(s => s.id == id || s.id === id);
        if (!student) {
            alert('الطالب غير موجود');
            return;
        }
        
        // حفظ بيانات الطالب للطباعة
        currentViewStudent = student;
        
        // الحصول على الحرف الأول من الاسم
        const getFirstLetter = (name) => {
            if (!name || name.trim() === '') return 'ط';
            return name.trim().charAt(0);
        };
        
        const firstLetter = getFirstLetter(student.name);
        
        // ملء النافذة المنبثقة بالبيانات
        const modal = document.getElementById('viewStudentModal');
        if (modal) {
            // تحديث البيانات
            document.getElementById('viewStudentName').textContent = student.name || 'غير محدد';
            document.getElementById('viewStudentClass').textContent = student.class || 'غير محدد';
            document.getElementById('viewStudentClassInfo').textContent = student.class || 'غير محدد';
            document.getElementById('viewStudentId').textContent = student.student_number || student.id || 'غير محدد';
            document.getElementById('viewStudentAge').textContent = student.age ? student.age + ' سنة' : 'غير محدد';
            document.getElementById('viewStudentEmail').textContent = student.email || 'غير محدد';
            document.getElementById('viewStudentPhone').textContent = student.phone || 'غير محدد';
            document.getElementById('viewStudentInitial').textContent = firstLetter;
            
            // تنسيق تاريخ التسجيل إن كان موجوداً
            const createdAtEl = document.getElementById('viewStudentCreatedAt');
            if (createdAtEl) {
                if (student.created_at) {
                    const date = new Date(student.created_at);
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
            
            console.log('[Students] View student modal opened');
        } else {
            // Fallback إلى alert إذا لم تكن النافذة موجودة
            const message = `
الاسم: ${student.name || 'غير محدد'}
الصف: ${student.class || 'غير محدد'}
رقم الطالب: ${student.student_number || student.id || 'غير محدد'}
العمر: ${student.age || 'غير محدد'}
البريد الإلكتروني: ${student.email || 'غير محدد'}
الهاتف: ${student.phone || 'غير محدد'}
            `.trim();
            alert(message);
        }
    } catch (error) {
        console.error('Error in viewStudent:', error);
        alert('حدث خطأ أثناء عرض تفاصيل الطالب');
    }
}

// إغلاق نافذة عرض الملف الشخصي
function closeViewModal() {
    const modal = document.getElementById('viewStudentModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    currentViewStudent = null;
}

// طباعة معلومات الطالب
function printStudentProfile() {
    if (!currentViewStudent) {
        alert('لا توجد معلومات للطباعة');
        return;
    }
    
    const student = currentViewStudent;
    const getFirstLetter = (name) => {
        if (!name || name.trim() === '') return 'ط';
        return name.trim().charAt(0);
    };
    const firstLetter = getFirstLetter(student.name);
    
    // إنشاء نافذة طباعة
    const printWindow = window.open('', '_blank');
    const printContent = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ملف الطالب - ${student.name}</title>
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
        <h1>ملف الطالب الشخصي</h1>
        <p>نظام إدارة المدرسة</p>
    </div>
    
    <div class="info-section">
        <div class="info-label">رقم الطالب</div>
        <div class="info-value">${student.student_number || student.id || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">الاسم الكامل</div>
        <div class="info-value">${student.name || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">الصف</div>
        <div class="info-value">${student.class || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">العمر</div>
        <div class="info-value">${student.age ? student.age + ' سنة' : 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">البريد الإلكتروني</div>
        <div class="info-value">${student.email || 'غير محدد'}</div>
    </div>
    
    <div class="info-section">
        <div class="info-label">رقم الهاتف</div>
        <div class="info-value">${student.phone || 'غير محدد'}</div>
    </div>
    
    ${student.created_at ? `
    <div class="info-section">
        <div class="info-label">تاريخ التسجيل</div>
        <div class="info-value">${new Date(student.created_at).toLocaleDateString('ar-IQ', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
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

// إغلاق النافذة
function closeModal() {
    const modal = document.getElementById('studentModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
    }
    setCurrentEditId(null);
    const form = document.getElementById('studentForm');
    if (form) {
        form.reset();
    }
}

// إغلاق النافذة عند النقر خارجها
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('studentModal');
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
function initStudentsPage() {
    console.log('[Students] Initializing students page');
    try {
        // التأكد من أن الجدول ظاهر
        const studentsTable = document.getElementById('studentsTable');
        if (studentsTable) {
            studentsTable.style.display = 'table';
            studentsTable.style.visibility = 'visible';
            studentsTable.classList.remove('hidden');
        }
        
        const tableContainer = document.querySelector('.w-full.overflow-x-auto, .overflow-x-auto');
        if (tableContainer) {
            tableContainer.style.display = 'block';
            tableContainer.style.visibility = 'visible';
            tableContainer.classList.remove('hidden');
        }
        
        const tableBody = document.getElementById('studentsTableBody');
        if (tableBody) {
            tableBody.style.display = 'table-row-group';
            tableBody.style.visibility = 'visible';
            tableBody.classList.remove('hidden');
        }
        
        // ربط زر الإضافة ب event listener لمنع إعادة التحميل
        const addButton = document.querySelector('button.btn-add[onclick*="openAddModal"]');
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
        
        // التأكد من أن الدوال متاحة عالمياً
        window.openAddModal = openAddModal;
        window.editStudent = editStudent;
        window.deleteStudent = deleteStudent;
        window.viewStudent = viewStudent;
        window.closeModal = closeModal;
        window.closeViewModal = closeViewModal;
        window.printStudentProfile = printStudentProfile;
        window.saveStudent = saveStudent;
        window.renderStudents = renderStudents;
        
        // استخدام DataManager لجلب البيانات
        if (window.sectionDataLoaders && window.sectionDataLoaders.loadStudents) {
            window.sectionDataLoaders.loadStudents();
        } else {
            // Fallback للطريقة القديمة
            loadStudents();
        }
        
        // ربط صندوق البحث
        const searchInput = document.getElementById('searchQuery');
        if (searchInput) {
            // إزالة event listeners السابقة لتجنب التكرار
            const newSearchInput = searchInput.cloneNode(true);
            searchInput.parentNode.replaceChild(newSearchInput, searchInput);
            
            // إضافة event listener جديد
            newSearchInput.addEventListener('input', function(e) {
                e.preventDefault();
                e.stopPropagation();
                renderStudents();
            });
            
            // أيضاً عند الضغط على Enter
            newSearchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    renderStudents();
                }
            });
            
            console.log('[Students] Search input event listener attached');
        } else {
            console.warn('[Students] Search input not found');
        }
        console.log('[Students] Students page initialized');
    } catch (error) {
        console.error('[Students] Error initializing page:', error);
    }
}

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initStudentsPage);

// أيضاً استماع لحدث تحميل الصفحة من Router
document.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'students') {
        console.log('[Students] Page loaded event received, initializing');
        setTimeout(() => {
            // التأكد من أن الجدول ظاهر
            const studentsTable = document.getElementById('studentsTable');
            if (studentsTable) {
                studentsTable.style.display = 'table';
                studentsTable.style.visibility = 'visible';
                studentsTable.classList.remove('hidden');
            }
            
            const tableContainer = document.querySelector('.w-full.overflow-x-auto, .overflow-x-auto');
            if (tableContainer) {
                tableContainer.style.display = 'block';
                tableContainer.style.visibility = 'visible';
                tableContainer.classList.remove('hidden');
            }
            
            const tableBody = document.getElementById('studentsTableBody');
            if (tableBody) {
                tableBody.style.display = 'table-row-group';
                tableBody.style.visibility = 'visible';
                tableBody.classList.remove('hidden');
            }
            
            initStudentsPage();
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
    if (event.data && event.data.type === 'studentAdded') {
        console.log('[Students] Student added from external window, refreshing list...');
        // تحديث قائمة الطلاب
        loadStudents();
    }
});
