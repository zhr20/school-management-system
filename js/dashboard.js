// تحميل بيانات لوحة التحكم
async function loadDashboard() {
    try {
        const response = await dashboardAPI.getStats();
        
        if (response && response.success && response.data) {
            const { stats, recentStudents, accountsStats } = response.data;
            
            // تحديث الإحصائيات مع التحقق من وجود العناصر
            const updateElement = (id, value) => {
                const element = document.getElementById(id);
                if (element) {
                    element.textContent = value;
                }
            };
            
            updateElement('totalStudents', stats?.totalStudents || 0);
            updateElement('totalTeachers', stats?.totalTeachers || 0);
            updateElement('totalStaff', stats?.totalStaff || 0);
            updateElement('todayAttendance', (stats?.todayAttendance || 0) + '%');
            
            // تحديث إحصائيات الحسابات
            if (accountsStats) {
                updateElement('totalFees', formatCurrency(accountsStats.totalFees || 0));
            }
            
            // عرض الطلاب الجدد
            const recentStudentsContainer = document.getElementById('recentStudents');
            if (recentStudentsContainer) {
                if (recentStudents && recentStudents.length > 0) {
                    recentStudentsContainer.innerHTML = recentStudents.map(student => `
                        <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <p class="font-medium text-gray-900">${student.name || 'غير محدد'}</p>
                                <p class="text-sm text-gray-600">${student.class || ''}</p>
                            </div>
                            <span class="text-sm text-gray-500">${formatDate(student.created_at)}</span>
                        </div>
                    `).join('');
                } else {
                    recentStudentsContainer.innerHTML = '<p class="text-gray-500">لا يوجد طلاب جدد</p>';
                }
            }
            
            // تحميل الأنشطة الأخيرة
            loadRecentActivities();
        } else {
            console.error('Invalid response format:', response);
            throw new Error('استجابة غير صحيحة من الخادم');
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
        const errorMsg = error.message || 'حدث خطأ أثناء تحميل البيانات';
        
        // عرض رسالة خطأ في الصفحة بدلاً من alert
        const recentStudentsContainer = document.getElementById('recentStudents');
        if (recentStudentsContainer) {
            recentStudentsContainer.innerHTML = `<p class="text-red-500">${errorMsg}</p>`;
        }
        
        // تعيين القيم الافتراضية في حالة الخطأ
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        };
        
        updateElement('totalStudents', 0);
        updateElement('totalTeachers', 0);
        updateElement('totalStaff', 0);
        updateElement('todayAttendance', '0%');
        updateElement('totalFees', '0 د.ع');
    }
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA');
}

// تنسيق العملة
function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-IQ', {
        style: 'currency',
        currency: 'IQD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// تحميل الأنشطة الأخيرة
async function loadRecentActivities() {
    try {
        const response = await activitiesAPI.getRecent();
        console.log('[Activities] Response:', response);
        
        // التحقق من بنية الاستجابة (قد تكون في response.data أو response مباشرة)
        const activities = (response && response.data && response.data.activities) 
            ? response.data.activities 
            : (response && response.activities) 
                ? response.activities 
                : [];
        
        console.log('[Activities] Extracted activities:', activities);
        
        if (response && response.success) {
            const activitiesContainer = document.getElementById('recentActivities');
            if (activitiesContainer) {
                if (activities && activities.length > 0) {
                    activitiesContainer.innerHTML = activities.map(activity => {
                        // عرض جميع الأنشطة بنفس الشكل البسيط
                        return `
                            <div class="flex items-start gap-3">
                                <div class="w-2 h-2 rounded-full bg-white mt-2 flex-shrink-0"></div>
                                <div class="flex-1 min-w-0">
                                    <p class="text-sm text-white mb-1">${activity.description || 'نشاط غير محدد'}</p>
                                    <p class="text-xs text-white flex items-center gap-1">
                                        <i class="far fa-clock"></i>
                                        <span>${activity.time_ago || '--'}</span>
                                    </p>
                                </div>
                            </div>
                        `;
                    }).join('');
                } else {
                    activitiesContainer.innerHTML = '<p class="text-sm text-white">لا توجد أنشطة حديثة</p>';
                }
            }
        } else {
            console.error('[Activities] Invalid response:', response);
            const activitiesContainer = document.getElementById('recentActivities');
            if (activitiesContainer) {
                activitiesContainer.innerHTML = '<p class="text-sm text-white">لا توجد أنشطة متاحة</p>';
            }
        }
    } catch (error) {
        console.error('Error loading recent activities:', error);
        const activitiesContainer = document.getElementById('recentActivities');
        if (activitiesContainer) {
            activitiesContainer.innerHTML = '<p class="text-sm text-white">حدث خطأ أثناء تحميل الأنشطة</p>';
        }
    }
}

// تحميل جميع الأنشطة
// استخدام المتغير المركزي من data-manager.js
async function loadAllActivities() {
    try {
        // استخدام المتغير المركزي (يتم تعريفه في data-manager.js)
        if (!window.allActivitiesCache) {
            const response = await activitiesAPI.getRecent();
            // التحقق من بنية الاستجابة (قد تكون في response.data أو response مباشرة)
            const activities = (response && response.data && response.data.activities) 
                ? response.data.activities 
                : (response && response.activities) 
                    ? response.activities 
                    : [];
            if (response && response.success && activities) {
                window.allActivitiesCache = activities;
            }
        }
        return window.allActivitiesCache || [];
    } catch (error) {
        console.error('Error loading all activities:', error);
        return [];
    }
}

// دالة عرض جميع الأنشطة
async function viewAllActivities() {
    const activities = await loadAllActivities();
    
    // إنشاء modal
    const modal = document.createElement('div');
    modal.id = 'allActivitiesModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 class="text-xl font-bold text-gray-900">جميع الأنشطة</h2>
                <button onclick="closeAllActivitiesModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                    <i class="fas fa-times text-xl"></i>
                </button>
            </div>
            <div class="px-6 py-4 overflow-y-auto flex-1" id="allActivitiesList">
                ${activities.length > 0 ? activities.map(activity => `
                    <div class="flex items-start gap-3 py-3 border-b border-gray-100 last:border-b-0">
                        <div class="w-2 h-2 rounded-full bg-purple-600 mt-2 flex-shrink-0"></div>
                        <div class="flex-1 min-w-0">
                            <p class="text-sm text-gray-700 mb-1">${activity.description || 'نشاط غير محدد'}</p>
                            <p class="text-xs text-gray-500 flex items-center gap-1">
                                <i class="far fa-clock"></i>
                                <span>${activity.time_ago || '--'}</span>
                            </p>
                        </div>
                    </div>
                `).join('') : '<p class="text-gray-500 text-center py-8">لا توجد أنشطة</p>'}
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // إغلاق عند النقر خارج Modal
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeAllActivitiesModal();
        }
    });
    
    // إغلاق عند الضغط على Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeAllActivitiesModal();
        }
    });
}

// دالة إغلاق Modal
function closeAllActivitiesModal() {
    const modal = document.getElementById('allActivitiesModal');
    if (modal) {
        modal.remove();
    }
}

// جعل الدالة متاحة عالمياً
window.viewAllActivities = viewAllActivities;
window.closeAllActivitiesModal = closeAllActivitiesModal;

// دالة فتح نافذة الإجراء السريع
function openQuickActionModal() {
    const modal = document.getElementById('quickActionModal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

// دالة إغلاق نافذة الإجراء السريع
function closeQuickActionModal() {
    const modal = document.getElementById('quickActionModal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

// التنقل إلى صفحة معينة من الإجراء السريع
function navigateToQuickAction(page) {
    closeQuickActionModal();
    // الانتقال إلى الصفحة المطلوبة في تبويب جديد
    const routes = {
        'students': 'add-student.html',  // صفحة منفصلة لإضافة طالب
        'teachers': 'add-teacher.html',  // صفحة منفصلة لإضافة معلم
        'staff': 'add-staff.html',  // صفحة منفصلة لإضافة موظف
        'subjects': 'add-subject.html',  // صفحة منفصلة لإضافة مادة
        'accounts': 'add-account.html'  // صفحة منفصلة لإضافة حساب
    };
    
    if (routes[page]) {
        // فتح الصفحة في تبويب جديد (بدون معاملات الحجم لفتحها كـ tab وليس popup)
        window.open(routes[page], '_blank');
    }
}

// جعل الدوال متاحة عالمياً
window.openQuickActionModal = openQuickActionModal;
window.closeQuickActionModal = closeQuickActionModal;
window.navigateToQuickAction = navigateToQuickAction;

// دالة فتح نافذة تصدير التقرير
async function openExportReportModal() {
    console.log('[Export] Opening export modal...');
    try {
        // قائمة الجداول المتاحة
        const tables = [
            { name: 'students', label: 'الطلاب', count: 0 },
            { name: 'teachers', label: 'المعلمين', count: 0 },
            { name: 'staff', label: 'الموظفين', count: 0 },
            { name: 'subjects', label: 'المواد', count: 0 }
        ];
        
        console.log('[Export] Fetching table counts...');
        
        // محاولة جلب عدد السجلات لكل جدول
        try {
            const studentsRes = await studentsAPI.getAll();
            if (studentsRes && studentsRes.success) {
                const data = Array.isArray(studentsRes.data) ? studentsRes.data : [];
                tables[0].count = data.length;
            }
        } catch (e) { console.error('Error fetching students:', e); }
        
        try {
            const teachersRes = await teachersAPI.getAll();
            if (teachersRes && teachersRes.success) {
                const data = Array.isArray(teachersRes.data) ? teachersRes.data : [];
                tables[1].count = data.length;
            }
        } catch (e) { console.error('Error fetching teachers:', e); }
        
        try {
            const staffRes = await staffAPI.getAll();
            if (staffRes && staffRes.success) {
                const data = Array.isArray(staffRes.data) ? staffRes.data : [];
                tables[2].count = data.length;
            }
        } catch (e) { console.error('Error fetching staff:', e); }
        
        try {
            const subjectsRes = await subjectsAPI.getAll();
            if (subjectsRes && subjectsRes.success) {
                const data = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
                tables[3].count = data.length;
            }
        } catch (e) { console.error('Error fetching subjects:', e); }
        
        console.log('[Export] Tables data:', tables);
        
        // إنشاء HTML للمحتوى
        const tablesHTML = tables.map(table => `
            <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 transition-colors hover:bg-gray-100 hover:shadow-sm">
                <div class="flex-1 min-w-0">
                    <h3 class="text-base font-semibold text-gray-900">${table.label}</h3>
                    <p class="text-sm text-gray-500 mt-1">${table.count} سجل</p>
                </div>
                <button 
                    onclick="printTable('${table.name}', '${table.label}')" 
                    class="print-table-btn ml-3 flex-shrink-0"
                    title="طباعة ${table.label}">
                    <i class="fas fa-print"></i>
                </button>
            </div>
        `).join('');
        
        console.log('[Export] Generated HTML length:', tablesHTML.length);
        
        const modal = document.createElement('div');
        modal.id = 'exportReportModal';
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
        modal.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden flex flex-col">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
                    <h2 class="text-xl font-bold text-gray-900">تصدير تقرير</h2>
                    <button onclick="closeExportReportModal()" class="text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="px-6 py-4 overflow-y-auto flex-1 bg-white" style="max-height: 60vh;">
                    <div class="space-y-3">
                        ${tablesHTML || '<p class="text-gray-500 text-center py-4">لا توجد جداول متاحة</p>'}
                    </div>
                </div>
                <div class="px-6 py-4 border-t border-gray-200 flex justify-end bg-white">
                    <button onclick="closeExportReportModal()" class="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                        إغلاق
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        console.log('[Export] Modal added to DOM');
        
        const style = document.createElement('style');
        style.textContent = `
            .print-table-btn {
                width: 40px;
                height: 40px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background-color: rgba(147, 51, 234, 0.15) !important;
                color: rgb(147, 51, 234) !important;
                border: none !important;
                border-radius: 6px !important;
                font-size: 1rem !important;
                transition: all 0.2s ease !important;
            }
            .print-table-btn:hover {
                background-color: rgba(147, 51, 234, 0.25) !important;
                box-shadow: 0 2px 5px rgba(147, 51, 234, 0.2);
            }
            .print-table-btn:active {
                background-color: rgba(147, 51, 234, 0.35) !important;
            }
        `;
        document.head.appendChild(style);
        
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeExportReportModal();
            }
        });
        
        const escapeHandler = function(e) {
            if (e.key === 'Escape') {
                closeExportReportModal();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
        
    } catch (error) {
        console.error('Error opening export modal:', error);
        alert('حدث خطأ أثناء فتح نافذة التصدير');
    }
}

// دالة إغلاق نافذة التصدير
function closeExportReportModal() {
    const modal = document.getElementById('exportReportModal');
    if (modal) {
        modal.remove();
    }
}

// دالة طباعة الجدول
async function printTable(tableName, tableLabel) {
    try {
        let data = [];
        
        switch(tableName) {
            case 'students':
                const studentsRes = await studentsAPI.getAll();
                if (studentsRes && studentsRes.success) {
                    data = Array.isArray(studentsRes.data) ? studentsRes.data : [];
                }
                break;
            case 'teachers':
                const teachersRes = await teachersAPI.getAll();
                if (teachersRes && teachersRes.success) {
                    data = Array.isArray(teachersRes.data) ? teachersRes.data : [];
                }
                break;
            case 'staff':
                const staffRes = await staffAPI.getAll();
                if (staffRes && staffRes.success) {
                    data = Array.isArray(staffRes.data) ? staffRes.data : [];
                }
                break;
            case 'subjects':
                const subjectsRes = await subjectsAPI.getAll();
                if (subjectsRes && subjectsRes.success) {
                    data = Array.isArray(subjectsRes.data) ? subjectsRes.data : [];
                }
                break;
        }
        
        if (data.length === 0) {
            alert('لا توجد بيانات للطباعة');
            return;
        }
        
        // إنشاء نافذة طباعة
        const printWindow = window.open('', '_blank');
        const columns = Object.keys(data[0]);
        
        let html = `
            <!DOCTYPE html>
            <html dir="rtl" lang="ar">
            <head>
                <meta charset="UTF-8">
                <title>${tableLabel} - تقرير</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        padding: 20px;
                        direction: rtl;
                    }
                    h1 {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 20px;
                    }
                    th, td {
                        border: 1px solid #ddd;
                        padding: 8px;
                        text-align: right;
                    }
                    th {
                        background-color: #9333ea;
                        color: white;
                        font-weight: bold;
                    }
                    tr:nth-child(even) {
                        background-color: #f2f2f2;
                    }
                </style>
            </head>
            <body>
                <h1>${tableLabel}</h1>
                <table>
                    <thead>
                        <tr>
                            ${columns.map(col => `<th>${col}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(row => `
                            <tr>
                                ${columns.map(col => `<td>${row[col] || ''}</td>`).join('')}
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;
        
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
        
    } catch (error) {
        console.error('Error printing table:', error);
        alert('حدث خطأ أثناء الطباعة');
    }
}

// جعل الدوال متاحة عالمياً
window.openExportReportModal = openExportReportModal;
window.closeExportReportModal = closeExportReportModal;
window.printTable = printTable;

// دالة تهيئة لوحة التحكم
function initDashboard() {
    console.log('[Dashboard] Initializing dashboard');
    try {
        // استخدام DataManager لجلب البيانات
        if (window.sectionDataLoaders && window.sectionDataLoaders.loadDashboard) {
            window.sectionDataLoaders.loadDashboard();
        } else {
            // Fallback للطريقة القديمة
            loadDashboard();
        }
    } catch (error) {
        console.error('[Dashboard] Error initializing dashboard:', error);
    }
}

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initDashboard);

// أيضاً استماع لحدث تحميل الصفحة من Router
document.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'index') {
        console.log('[Dashboard] Page loaded event received, loading dashboard');
        setTimeout(() => {
            initDashboard();
        }, 100);
    }
});
