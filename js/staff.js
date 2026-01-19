let staff = [];
// استخدام namespace لتجنب إعادة التعريف في SPA
if (typeof window.staffModule === 'undefined') {
    window.staffModule = {
        currentEditId: null
    };
}
// إنشاء مرجع محلي للوصول السريع
const getCurrentEditId = () => window.staffModule.currentEditId;
const setCurrentEditId = (value) => { window.staffModule.currentEditId = value; };

// تحميل الموظفين
async function loadStaff() {
    try {
        const response = await staffAPI.getAll();
        if (response && response.success) {
            staff = response.data || [];
            renderStaff();
        } else {
            console.error('Invalid response:', response);
            const tbody = document.getElementById('staffTableBody');
            if (tbody) {
                tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-red-500">حدث خطأ أثناء تحميل الموظفين</td></tr>';
            }
        }
    } catch (error) {
        console.error('Error loading staff:', error);
        const tbody = document.getElementById('staffTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-red-500">حدث خطأ أثناء تحميل الموظفين: ' + (error.message || 'خطأ غير معروف') + '</td></tr>';
        }
    }
}

// عرض الموظفين
function renderStaff() {
    if (!staff || !Array.isArray(staff)) {
        const tbody = document.getElementById('staffTableBody');
        if (tbody) {
            tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد بيانات</td></tr>';
        }
        return;
    }
    
    const searchInput = document.getElementById('searchQuery');
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    const filtered = searchQuery 
        ? staff.filter(s => 
            (s.name && s.name.toLowerCase().includes(searchQuery)) ||
            (s.position && s.position.toLowerCase().includes(searchQuery)) ||
            (s.email && s.email.toLowerCase().includes(searchQuery))
          )
        : staff;
    
    const tbody = document.getElementById('staffTableBody');
    if (!tbody) {
        console.error('staffTableBody element not found');
        return;
    }
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا يوجد موظفين</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(member => {
        if (!member) return '';
        
        // التأكد من أن permissions هو كائن
        // ملاحظة: API يحول permissions من JSON string إلى object في PHP
        let permissions = {};
        if (member.permissions) {
            if (typeof member.permissions === 'string') {
                try {
                    // تنظيف النص من أي مسافات بيضاء أو أحرف غير مرئية
                    const cleanPermissions = member.permissions.trim();
                    if (cleanPermissions && (cleanPermissions.startsWith('{') || cleanPermissions.startsWith('['))) {
                        permissions = JSON.parse(cleanPermissions);
                    } else if (cleanPermissions === '' || cleanPermissions === 'null') {
                        permissions = {};
                    } else {
                        console.warn('[Staff] Invalid permissions format:', cleanPermissions);
                        permissions = {};
                    }
                } catch (e) {
                    console.error('[Staff] Error parsing permissions:', e, 'Raw value:', member.permissions);
                    permissions = {};
                }
            } else if (typeof member.permissions === 'object' && member.permissions !== null) {
                // permissions هو بالفعل object (تم تحويله في PHP)
                permissions = member.permissions;
            } else {
                permissions = {};
            }
        }
        
        const permissionsList = [];
        if (permissions.manage_students) permissionsList.push('إدارة الطلاب');
        if (permissions.manage_teachers) permissionsList.push('إدارة المعلمين');
        if (permissions.manage_subjects) permissionsList.push('إدارة المواد');
        if (permissions.manage_staff) permissionsList.push('إدارة الموظفين');
        if (permissions.view_reports) permissionsList.push('عرض التقارير');
        if (permissions.manage_finances) permissionsList.push('إدارة المالية');
        
        const name = member.name || 'غير محدد';
        const position = member.position || 'غير محدد';
        const email = member.email || '';
        const phone = member.phone || '';
        const id = member.id || 0;
        
        return `
        <tr class="hover:bg-gray-50">
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${name}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                    position === 'مدير' ? 'bg-purple-100 text-purple-800' :
                    position === 'محاسب' ? 'bg-green-100 text-green-800' :
                    'bg-blue-100 text-blue-800'
                }">${position}</span>
            </td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${email}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${phone}</td>
            <td class="px-4 py-3 text-sm text-gray-500">
                <div class="flex flex-wrap gap-1 max-w-xs">
                    ${permissionsList.length > 0 
                        ? permissionsList.map(p => `<span class="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">${p}</span>`).join('')
                        : '<span class="text-gray-400">لا توجد صلاحيات</span>'
                    }
                </div>
            </td>
            <td class="px-4 py-3 text-sm font-medium whitespace-nowrap">
                <div class="actions-group">
                    <button onclick="editStaff(${id})" class="btn-edit" type="button" title="تعديل الموظف">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button onclick="deleteStaff(${id})" class="btn-delete" type="button" title="حذف الموظف">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                </div>
            </td>
        </tr>
    `;
    }).filter(html => html !== '').join('');
}

// فتح نافذة الإضافة
function openAddModal() {
    console.log('[Staff] openAddModal called');
    try {
        const modal = document.getElementById('staffModal');
        if (!modal) {
            console.error('[Staff] staffModal element not found');
            alert('خطأ: لم يتم العثور على النافذة المنبثقة');
            return;
        }
        
        setCurrentEditId(null);
        
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.textContent = 'إضافة موظف جديد';
        }
        
        const staffForm = document.getElementById('staffForm');
        if (staffForm) {
            staffForm.reset();
        }
        
        const passwordHint = document.getElementById('passwordHint');
        if (passwordHint) {
            passwordHint.textContent = '(اتركه فارغاً للاستخدام الافتراضي: 123456)';
        }
        
        resetPermissions();
        
        // إزالة class hidden وإظهار النافذة
        modal.classList.remove('hidden');
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        
        console.log('[Staff] Modal opened successfully');
    } catch (error) {
        console.error('[Staff] Error opening modal:', error);
        alert('حدث خطأ أثناء فتح النافذة: ' + error.message);
    }
}

// تعديل موظف
function editStaff(id) {
    try {
        console.log('editStaff called with id:', id);
        const member = staff.find(s => s.id == id || s.id === id);
        
        if (!member) {
            console.error('Member not found with id:', id);
            alert('الموظف غير موجود');
            return;
        }
        
        console.log('Found member:', member);
        
        setCurrentEditId(id);
        document.getElementById('modalTitle').textContent = 'تعديل موظف';
        document.getElementById('staffName').value = member.name || '';
        document.getElementById('staffPosition').value = member.position || '';
        document.getElementById('staffEmail').value = member.email || '';
        document.getElementById('staffPhone').value = member.phone || '';
        document.getElementById('staffPassword').value = '';
        document.getElementById('passwordHint').textContent = '(اتركه فارغاً للاحتفاظ بالكلمة الحالية)';
        
        // تعيين الصلاحيات
        // ملاحظة: API يحول permissions من JSON string إلى object في PHP
        let permissions = {};
        if (member.permissions) {
            if (typeof member.permissions === 'string') {
                try {
                    // تنظيف النص من أي مسافات بيضاء أو أحرف غير مرئية
                    const cleanPermissions = member.permissions.trim();
                    if (cleanPermissions && (cleanPermissions.startsWith('{') || cleanPermissions.startsWith('['))) {
                        permissions = JSON.parse(cleanPermissions);
                    } else if (cleanPermissions === '' || cleanPermissions === 'null') {
                        permissions = {};
                    } else {
                        console.warn('[Staff] Invalid permissions format:', cleanPermissions);
                        permissions = {};
                    }
                } catch (e) {
                    console.error('[Staff] Error parsing permissions:', e, 'Raw value:', member.permissions);
                    permissions = {};
                }
            } else if (typeof member.permissions === 'object' && member.permissions !== null) {
                // permissions هو بالفعل object (تم تحويله في PHP)
                permissions = member.permissions;
            } else {
                permissions = {};
            }
        }
        
        document.getElementById('perm_manage_students').checked = permissions.manage_students || false;
        document.getElementById('perm_manage_teachers').checked = permissions.manage_teachers || false;
        document.getElementById('perm_manage_subjects').checked = permissions.manage_subjects || false;
        document.getElementById('perm_manage_staff').checked = permissions.manage_staff || false;
        document.getElementById('perm_view_reports').checked = permissions.view_reports || false;
        document.getElementById('perm_manage_finances').checked = permissions.manage_finances || false;
        
        // فتح النافذة المنبثقة
        const modal = document.getElementById('staffModal');
        if (modal) {
            modal.classList.remove('hidden');
            console.log('Modal opened');
        } else {
            console.error('Modal element not found');
        }
    } catch (error) {
        console.error('Error in editStaff:', error);
        alert('حدث خطأ أثناء فتح نافذة التعديل: ' + error.message);
    }
}

// تحديث الصلاحيات الافتراضية حسب المنصب
function updateDefaultPermissions() {
    if (getCurrentEditId()) return; // لا تحدث إذا كان في وضع التعديل
    
    const position = document.getElementById('staffPosition').value;
    resetPermissions();
    
    switch (position) {
        case 'مدير':
            document.getElementById('perm_manage_students').checked = true;
            document.getElementById('perm_manage_teachers').checked = true;
            document.getElementById('perm_manage_subjects').checked = true;
            document.getElementById('perm_manage_staff').checked = true;
            document.getElementById('perm_view_reports').checked = true;
            document.getElementById('perm_manage_finances').checked = true;
            break;
        case 'محاسب':
            document.getElementById('perm_view_reports').checked = true;
            document.getElementById('perm_manage_finances').checked = true;
            break;
        case 'سكرتير':
            document.getElementById('perm_manage_students').checked = true;
            document.getElementById('perm_view_reports').checked = true;
            break;
    }
}

// إعادة تعيين الصلاحيات
function resetPermissions() {
    document.getElementById('perm_manage_students').checked = false;
    document.getElementById('perm_manage_teachers').checked = false;
    document.getElementById('perm_manage_subjects').checked = false;
    document.getElementById('perm_manage_staff').checked = false;
    document.getElementById('perm_view_reports').checked = false;
    document.getElementById('perm_manage_finances').checked = false;
}

// حفظ موظف
async function saveStaff(event) {
    event.preventDefault();
    
    try {
        // تعطيل زر الحفظ أثناء المعالجة
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'جاري الحفظ...';
        }
        
        const permissions = {
            manage_students: document.getElementById('perm_manage_students').checked,
            manage_teachers: document.getElementById('perm_manage_teachers').checked,
            manage_subjects: document.getElementById('perm_manage_subjects').checked,
            manage_staff: document.getElementById('perm_manage_staff').checked,
            view_reports: document.getElementById('perm_view_reports').checked,
            manage_finances: document.getElementById('perm_manage_finances').checked
        };
        
        const formData = {
            name: document.getElementById('staffName').value.trim(),
            position: document.getElementById('staffPosition').value,
            email: document.getElementById('staffEmail').value.trim(),
            phone: document.getElementById('staffPhone').value.trim(),
            permissions: permissions
        };
        
        // التحقق من الحقول المطلوبة
        if (!formData.name || !formData.position || !formData.email || !formData.phone) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'حفظ';
            }
            return;
        }
        
        const password = document.getElementById('staffPassword').value;
        const editId = getCurrentEditId();
        if (password) {
            formData.password = password;
        } else if (!editId) {
            formData.password = '123456';
        }
        
        console.log('Saving staff:', formData);
        console.log('Current edit ID:', editId);
        
        let response;
        if (editId) {
            console.log('Updating staff with ID:', editId);
            response = await staffAPI.update(editId, formData);
        } else {
            console.log('Creating new staff');
            response = await staffAPI.create(formData);
        }
        
        console.log('Response:', response);
        
        if (response && response.success) {
            closeModal();
            await loadStaff();
            alert(response.message || 'تم الحفظ بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحفظ');
        }
    } catch (error) {
        console.error('Error saving staff:', error);
        alert('حدث خطأ أثناء الحفظ: ' + (error.message || 'خطأ غير معروف'));
    } finally {
        // إعادة تفعيل زر الحفظ
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'حفظ';
        }
    }
}

// حذف موظف
async function deleteStaff(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return;
    
    try {
        console.log('Deleting staff with id:', id);
        const response = await staffAPI.delete(id);
        console.log('Delete response:', response);
        
        if (response && response.success) {
            await loadStaff();
            alert('تم حذف الموظف بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحذف');
        }
    } catch (error) {
        console.error('Error deleting staff:', error);
        alert('حدث خطأ أثناء الحذف: ' + (error.message || 'خطأ غير معروف'));
    }
}

// إغلاق النافذة
function closeModal() {
    const modal = document.getElementById('staffModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    setCurrentEditId(null);
    const form = document.getElementById('staffForm');
    if (form) {
        form.reset();
    }
}

// إغلاق النافذة عند النقر خارجها
document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('staffModal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // إغلاق عند الضغط على ESC
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }
});

// دالة تهيئة الصفحة
function initStaffPage() {
    console.log('[Staff] Initializing staff page');
    try {
        // التأكد من وجود الجدول
        const tbody = document.getElementById('staffTableBody');
        if (!tbody) {
            console.warn('[Staff] staffTableBody not found, retrying...');
            setTimeout(initStaffPage, 200);
            return;
        }
        
        // استخدام DataManager لجلب البيانات
        if (window.sectionDataLoaders && window.sectionDataLoaders.loadStaff) {
            window.sectionDataLoaders.loadStaff();
        } else {
            // Fallback للطريقة القديمة - تحميل مباشر
            console.log('[Staff] Loading staff directly...');
            loadStaff();
        }
        
        const searchInput = document.getElementById('searchQuery');
        if (searchInput) {
            searchInput.addEventListener('input', renderStaff);
        }
        console.log('[Staff] Staff page initialized');
    } catch (error) {
        console.error('[Staff] Error initializing page:', error);
    }
}

// تحميل البيانات عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // تأخير بسيط للتأكد من تحميل جميع العناصر
        setTimeout(initStaffPage, 100);
    });
} else {
    // الصفحة محملة بالفعل
    setTimeout(initStaffPage, 100);
}

// أيضاً استماع لحدث تحميل الصفحة من Router
document.addEventListener('pageLoaded', (e) => {
    if (e.detail && e.detail.page === 'staff') {
        console.log('[Staff] Page loaded event received, initializing');
        setTimeout(() => {
            initStaffPage();
        }, 100);
    }
});

// استدعاء مباشر عند تحميل الملف (للتأكد من التحميل)
if (window.location.pathname.includes('staff.html') || 
    window.location.pathname.includes('staff') ||
    document.getElementById('staffTableBody')) {
    console.log('[Staff] Staff page detected, initializing...');
    setTimeout(initStaffPage, 200);
}

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
    if (event.data && event.data.type === 'staffAdded') {
        console.log('[Staff] Staff added from external window, refreshing list...');
        // تحديث قائمة الموظفين
        loadStaff();
    }
});
