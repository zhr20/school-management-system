// نظام إدارة البيانات المركزي - جلب البيانات لكل قسم
class DataManager {
    constructor() {
        this.loadingStates = new Map(); // تتبع حالات التحميل
        this.dataCache = new Map(); // تخزين مؤقت للبيانات
        this.activeRequests = new Map(); // تتبع الطلبات النشطة
    }

    // دالة مساعدة للتحقق من أن العنصر هو DOM element
    isValidDOMElement(element) {
        return element && 
               (element instanceof HTMLElement || 
                element instanceof Element || 
                (typeof element === 'object' && element.nodeType === 1));
    }

    // دالة مساعدة للحصول على container بأمان
    getContainer(containerId) {
        if (!containerId) {
            console.error('[DataManager] containerId is required');
            return null;
        }

        // إذا كان containerId هو عنصر DOM بالفعل
        if (this.isValidDOMElement(containerId)) {
            return containerId;
        }

        // إذا كان string، البحث عن العنصر
        if (typeof containerId === 'string') {
            const container = document.getElementById(containerId);
            if (!container) {
                console.error(`[DataManager] Container not found: ${containerId}`);
                return null;
            }
            return container;
        }

        console.error('[DataManager] Invalid containerId type:', typeof containerId);
        return null;
    }

    // دالة رئيسية لجلب البيانات حسب القسم
    async fetchSectionData(section, options = {}) {
        const {
            apiEndpoint,
            containerId,
            renderFunction,
            loadingMessage = 'جاري التحميل...',
            errorMessage = 'حدث خطأ أثناء تحميل البيانات',
            cacheKey = null,
            forceRefresh = false
        } = options;

        // التحقق من المعاملات المطلوبة
        if (!containerId) {
            console.error('[DataManager] containerId is required');
            return null;
        }

        // منع الطلبات المكررة
        if (this.activeRequests.has(section)) {
            console.log(`[DataManager] Request already in progress for: ${section}`);
            return this.activeRequests.get(section);
        }

        // الحصول على container
        const container = this.getContainer(containerId);
        if (!container) {
            console.error(`[DataManager] Cannot get container for: ${containerId}`);
            return null;
        }

        // التحقق من الـ cache
        const cacheKeyToUse = cacheKey || section;
        if (!forceRefresh && this.dataCache.has(cacheKeyToUse)) {
            console.log(`[DataManager] Using cached data for: ${section}`);
            const cachedData = this.dataCache.get(cacheKeyToUse);
            if (renderFunction) {
                // استخدام container الفعلي وليس containerId
                this.renderData(container, cachedData, renderFunction);
            }
            return cachedData;
        }

        // التأكد من أن الحاوية ظاهرة
        this.ensureContainerVisible(container);

        // عرض رسالة التحميل
        this.showLoading(container, loadingMessage);

        // إنشاء promise للطلب
        const requestPromise = this.executeRequest(section, apiEndpoint, container, renderFunction, errorMessage, cacheKeyToUse);
        
        // حفظ الطلب النشط
        this.activeRequests.set(section, requestPromise);

        try {
            const data = await requestPromise;
            return data;
        } finally {
            // إزالة الطلب من الطلبات النشطة
            this.activeRequests.delete(section);
        }
    }

    // تنفيذ الطلب الفعلي
    async executeRequest(section, apiEndpoint, container, renderFunction, errorMessage, cacheKey) {
        try {
            console.log(`[DataManager] Fetching data for ${section} from: ${apiEndpoint}`);
            
            const response = await fetch(apiEndpoint, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('application/json')) {
                const text = await response.text();
                throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
            }

            const data = await response.json();
            
            // التحقق من صحة البيانات
            if (!data) {
                throw new Error('No data returned from API');
            }

            // التحقق من بنية البيانات المتوقعة
            if (data.success === false) {
                throw new Error(data.message || 'API returned error');
            }

            // حفظ في الـ cache
            this.dataCache.set(cacheKey, data);

            // عرض البيانات
            if (renderFunction) {
                this.renderData(container, data, renderFunction);
            } else {
                console.warn(`[DataManager] No render function provided for ${section}`);
            }

            console.log(`[DataManager] Data loaded successfully for ${section}`);
            return data;

        } catch (error) {
            console.error(`[DataManager] Error fetching data for ${section}:`, error);
            if (this.isValidDOMElement(container)) {
                this.showError(container, errorMessage, error.message);
            }
            throw error;
        }
    }

    // التأكد من أن الحاوية ظاهرة
    ensureContainerVisible(container) {
        if (!this.isValidDOMElement(container)) {
            console.warn('[DataManager] ensureContainerVisible: Invalid container');
            return;
        }
        
        try {
            container.style.display = 'block';
            container.style.visibility = 'visible';
            container.style.opacity = '1';
            container.classList.remove('hidden', 'opacity-0', 'invisible');
            
            // التأكد من أن العناصر الداخلية ظاهرة
            if (container.querySelectorAll) {
                const children = container.querySelectorAll('[style*="display: none"], .hidden');
                if (children && children.length > 0) {
                    children.forEach(child => {
                        if (this.isValidDOMElement(child)) {
                            child.style.display = '';
                            child.classList.remove('hidden');
                        }
                    });
                }
            }
        } catch (error) {
            console.error('[DataManager] Error in ensureContainerVisible:', error);
        }
    }

    // عرض رسالة التحميل
    showLoading(container, message) {
        if (!this.isValidDOMElement(container)) {
            console.warn('[DataManager] showLoading: Invalid container');
            return;
        }

        try {
            const loadingHTML = `
                <div class="flex items-center justify-center py-12" id="loading-indicator">
                    <div class="text-center">
                        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                        <p class="text-gray-600 font-medium">${message}</p>
                    </div>
                </div>
            `;

            // حفظ المحتوى الأصلي إذا لم يكن موجوداً
            if (container.hasAttribute && !container.hasAttribute('data-original-content')) {
                container.setAttribute('data-original-content', container.innerHTML);
            }

            container.innerHTML = loadingHTML;
        } catch (error) {
            console.error('[DataManager] Error in showLoading:', error);
        }
    }

    // عرض رسالة الخطأ
    showError(container, message, details = '') {
        if (!this.isValidDOMElement(container)) {
            console.warn('[DataManager] showError: Invalid container');
            return;
        }

        try {
            const errorHTML = `
                <div class="flex items-center justify-center py-12" id="error-indicator">
                    <div class="text-center max-w-md">
                        <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                            <i class="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
                        </div>
                        <p class="text-red-600 font-semibold text-lg mb-2">${message}</p>
                        ${details ? `<p class="text-gray-500 text-sm mb-4">${details}</p>` : ''}
                        <button onclick="window.location.reload()" class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                            إعادة المحاولة
                        </button>
                    </div>
                </div>
            `;

            container.innerHTML = errorHTML;
        } catch (error) {
            console.error('[DataManager] Error in showError:', error);
        }
    }

    // عرض البيانات
    renderData(container, data, renderFunction) {
        // التحقق من container
        if (!this.isValidDOMElement(container)) {
            console.error('[DataManager] renderData: Invalid container', container);
            return;
        }

        // التحقق من renderFunction
        if (!renderFunction || typeof renderFunction !== 'function') {
            console.error('[DataManager] renderData: Invalid render function');
            return;
        }

        try {
            // التأكد من أن الحاوية ظاهرة قبل العرض
            this.ensureContainerVisible(container);

            // تنظيف المحتوى قبل العرض
            this.clearContainer(container);

            // استدعاء دالة العرض
            const renderedContent = renderFunction(data);
            
            if (renderedContent) {
                if (typeof renderedContent === 'string') {
                    container.innerHTML = renderedContent;
                } else if (this.isValidDOMElement(renderedContent)) {
                    container.innerHTML = '';
                    container.appendChild(renderedContent);
                } else if (renderedContent instanceof NodeList || Array.isArray(renderedContent)) {
                    container.innerHTML = '';
                    renderedContent.forEach(node => {
                        if (this.isValidDOMElement(node)) {
                            container.appendChild(node);
                        }
                    });
                } else {
                    console.warn('[DataManager] Render function returned unexpected type:', typeof renderedContent);
                }
            } else {
                this.showEmpty(container);
            }

            // التأكد مرة أخرى من أن المحتوى ظاهر
            this.ensureContainerVisible(container);

        } catch (error) {
            console.error('[DataManager] Error rendering data:', error);
            this.showError(container, 'حدث خطأ أثناء عرض البيانات', error.message);
        }
    }

    // تنظيف الحاوية
    clearContainer(container) {
        if (!this.isValidDOMElement(container)) {
            console.warn('[DataManager] clearContainer: Invalid container');
            return;
        }
        
        try {
            // إزالة رسائل التحميل والخطأ
            if (container.querySelector) {
                const loadingIndicator = container.querySelector('#loading-indicator');
                const errorIndicator = container.querySelector('#error-indicator');
                
                if (loadingIndicator && this.isValidDOMElement(loadingIndicator)) {
                    loadingIndicator.remove();
                }
                if (errorIndicator && this.isValidDOMElement(errorIndicator)) {
                    errorIndicator.remove();
                }
            }
        } catch (error) {
            console.error('[DataManager] Error in clearContainer:', error);
        }
    }

    // عرض رسالة فارغة
    showEmpty(container, message = 'لا توجد بيانات') {
        if (!this.isValidDOMElement(container)) {
            console.warn('[DataManager] showEmpty: Invalid container');
            return;
        }

        try {
            const emptyHTML = `
                <div class="flex items-center justify-center py-12">
                    <div class="text-center">
                        <i class="fas fa-inbox text-gray-400 text-4xl mb-4"></i>
                        <p class="text-gray-500 font-medium">${message}</p>
                    </div>
                </div>
            `;

            container.innerHTML = emptyHTML;
        } catch (error) {
            console.error('[DataManager] Error in showEmpty:', error);
        }
    }

    // مسح الـ cache
    clearCache(section = null) {
        if (section) {
            this.dataCache.delete(section);
            console.log(`[DataManager] Cache cleared for: ${section}`);
        } else {
            this.dataCache.clear();
            console.log('[DataManager] All cache cleared');
        }
    }

    // إلغاء الطلبات النشطة
    cancelActiveRequests(section = null) {
        if (section) {
            const request = this.activeRequests.get(section);
            if (request) {
                this.activeRequests.delete(section);
                console.log(`[DataManager] Request cancelled for: ${section}`);
            }
        } else {
            this.activeRequests.clear();
            console.log('[DataManager] All active requests cancelled');
        }
    }
}

// إنشاء instance واحد من DataManager
window.dataManager = new DataManager();

// دوال مساعدة لكل قسم
window.sectionDataLoaders = {
    // جلب بيانات لوحة التحكم
    async loadDashboard() {
        console.log('[SectionLoader] Loading dashboard data');
        try {
            // استخدام API مباشرة لتحديث العناصر الموجودة
            // لأن لوحة التحكم تحتاج لتحديث عناصر موجودة وليس استبدال المحتوى
            if (typeof dashboardAPI !== 'undefined' && dashboardAPI.getStats) {
                // استخدام API مباشرة
                const response = await dashboardAPI.getStats();
                
                if (response && response.success && response.data) {
                    const { stats, recentStudents, accountsStats } = response.data;
                    
                    // تحديث الإحصائيات
                    const updateElement = (id, value) => {
                        try {
                            const el = document.getElementById(id);
                            if (el && (el instanceof HTMLElement || el instanceof Element)) {
                                el.textContent = value;
                            }
                        } catch (error) {
                            console.error(`[SectionLoader] Error updating element ${id}:`, error);
                        }
                    };
                    
                    if (stats) {
                        updateElement('totalStudents', stats.totalStudents || 0);
                        updateElement('totalTeachers', stats.totalTeachers || 0);
                        updateElement('totalSubjects', stats.totalSubjects || 0);
                        updateElement('totalStaff', stats.totalStaff || 0);
                        updateElement('todayAttendance', (stats.todayAttendance || 0) + '%');
                        updateElement('class1Students', stats.class1Students || 0);
                        updateElement('class2Students', stats.class2Students || 0);
                        updateElement('class3Students', stats.class3Students || 0);
                    }
                    
                    if (accountsStats) {
                        const formatCurrency = (amount) => {
                            return new Intl.NumberFormat('ar-IQ', {
                                style: 'currency',
                                currency: 'IQD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(amount || 0);
                        };
                        
                        updateElement('totalFees', formatCurrency(accountsStats.totalFees || 0));
                        updateElement('totalPaid', formatCurrency(accountsStats.totalPaid || 0));
                        updateElement('totalRemaining', formatCurrency(accountsStats.totalRemaining || 0));
                        updateElement('fullyPaidStudents', accountsStats.fullyPaidStudents || 0);
                    }
                    
                    // عرض الطلاب الجدد
                    const recentContainer = document.getElementById('recentStudents');
                    if (recentContainer && (recentContainer instanceof HTMLElement || recentContainer instanceof Element)) {
                        if (recentStudents && Array.isArray(recentStudents) && recentStudents.length > 0) {
                            recentContainer.innerHTML = recentStudents.map(student => `
                                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div>
                                        <p class="font-medium text-gray-900">${student.name || 'غير محدد'}</p>
                                        <p class="text-sm text-gray-600">${student.class || ''}</p>
                                    </div>
                                    <span class="text-sm text-gray-500">${formatDate(student.created_at || '')}</span>
                                </div>
                            `).join('');
                        } else {
                            recentContainer.innerHTML = '<p class="text-gray-500">لا يوجد طلاب جدد</p>';
                        }
                    }
                } else {
                    console.error('[SectionLoader] Invalid dashboard response:', response);
                }
            } else if (typeof loadDashboard === 'function') {
                // Fallback: استخدام دالة loadDashboard من dashboard.js
                console.log('[SectionLoader] Using loadDashboard function from dashboard.js');
                await loadDashboard();
            } else {
                console.error('[SectionLoader] dashboardAPI and loadDashboard function not available');
            }
        } catch (error) {
            console.error('[SectionLoader] Error loading dashboard:', error);
        }
    },

    // جلب بيانات المعلمين
    async loadTeachers() {
        console.log('[SectionLoader] Loading teachers data');
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
            
            const container = document.getElementById('teachersTableBody');
            if (!container) {
                console.error('[SectionLoader] teachersTableBody container not found');
                return;
            }
            
            // التأكد من أن الحاوية ظاهرة
            container.style.display = 'table-row-group';
            container.style.visibility = 'visible';
            container.classList.remove('hidden');

            await window.dataManager.fetchSectionData('teachers', {
                apiEndpoint: 'api/teachers.php',
                containerId: 'teachersTableBody',
                renderFunction: (data) => {
                    if (!data || !data.success || !data.data || !Array.isArray(data.data)) {
                        return '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد بيانات</td></tr>';
                    }
                    
                    const teachers = data.data;
                    
                    // حفظ البيانات في window.teachers للمعالجة
                    window.teachers = teachers;
                    
                    // ملء قائمة التصفية بعد تحميل البيانات
                    if (typeof populateFilterOptions === 'function') {
                        populateFilterOptions();
                    }
                    
                    if (teachers.length === 0) {
                        return '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا يوجد معلمين</td></tr>';
                    }
                    
                    const formatCurrency = (amount) => {
                        return new Intl.NumberFormat('ar-IQ', {
                            style: 'currency',
                            currency: 'IQD',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(amount || 0);
                    };
                    
                    // دالة للحصول على الحرف الأول من الاسم
                    const getFirstLetter = (name) => {
                        if (!name || name.trim() === '') return 'ع';
                        return name.trim().charAt(0);
                    };
                    
                    return teachers.map(teacher => {
                        const name = teacher.name || 'غير محدد';
                        const specialization = teacher.specialization || 'غير محدد';
                        const email = teacher.email || '';
                        const phone = teacher.phone || '';
                        const salary = teacher.salary || 0;
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
                                    <button onclick="editTeacher(${teacher.id})" class="btn-edit-icon" type="button" title="تعديل المعلم">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button onclick="deleteTeacher(${teacher.id})" class="btn-delete-icon" type="button" title="حذف المعلم">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                    <button onclick="viewTeacher(${teacher.id})" class="btn-view-icon" type="button" title="الملف الشخصي">
                                        <i class="fas fa-user"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `;
                    }).join('');
                },
                loadingMessage: 'جاري تحميل بيانات المعلمين...',
                errorMessage: 'حدث خطأ أثناء تحميل بيانات المعلمين'
            }).then((data) => {
                // ملء قائمة التصفية بعد تحميل البيانات
                if (data && data.data && window.teachers && typeof populateFilterOptions === 'function') {
                    setTimeout(() => {
                        populateFilterOptions();
                    }, 100);
                }
                return data;
            });
        } catch (error) {
            console.error('[SectionLoader] Error loading teachers:', error);
        }
    },

    // جلب بيانات الطلاب
    async loadStudents() {
        console.log('[SectionLoader] Loading students data');
        try {
            const container = document.getElementById('studentsTableBody');
            if (!container) {
                console.error('[SectionLoader] studentsTableBody container not found');
                return;
            }

            await window.dataManager.fetchSectionData('students', {
                apiEndpoint: 'api/students.php',
                containerId: 'studentsTableBody',
                renderFunction: (data) => {
                    if (!data || !data.success || !data.data || !Array.isArray(data.data)) {
                        return '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد بيانات</td></tr>';
                    }
                    
                    const students = data.data;
                    if (students.length === 0) {
                        return '<tr><td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">لا يوجد طلاب</td></tr>';
                    }
                    
                    return students.map(student => `
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${student.name || 'غير محدد'}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${student.student_number || 'غير محدد'}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${student.class || 'غير محدد'}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${student.age || 'غير محدد'}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${student.email || ''}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${student.phone || ''}</td>
                            <td class="px-4 py-3 text-sm font-medium min-w-[180px]">
                                <div class="flex items-center justify-end gap-2 flex-nowrap">
                                    <button onclick="editStudent(${student.id})" class="btn-edit">
                                        <i class="fas fa-edit ml-1.5"></i> تعديل
                                    </button>
                                    <button onclick="deleteStudent(${student.id})" class="btn-delete">
                                        <i class="fas fa-trash ml-1.5"></i> حذف
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('');
                },
                loadingMessage: 'جاري تحميل بيانات الطلاب...',
                errorMessage: 'حدث خطأ أثناء تحميل بيانات الطلاب'
            });
        } catch (error) {
            console.error('[SectionLoader] Error loading students:', error);
        }
    },

    // جلب بيانات الموظفين
    async loadStaff() {
        console.log('[SectionLoader] Loading staff data');
        try {
            const container = document.getElementById('staffTableBody');
            if (!container) {
                console.error('[SectionLoader] staffTableBody container not found');
                return;
            }

            await window.dataManager.fetchSectionData('staff', {
                apiEndpoint: 'api/staff.php',
                containerId: 'staffTableBody',
                renderFunction: (data) => {
                    if (!data || !data.success || !data.data || !Array.isArray(data.data)) {
                        return '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد بيانات</td></tr>';
                    }
                    
                    const staff = data.data;
                    if (staff.length === 0) {
                        return '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا يوجد موظفين</td></tr>';
                    }
                    
                    return staff.map(employee => {
                        const permissions = employee.permissions ? JSON.parse(employee.permissions) : {};
                        const permissionsList = Object.keys(permissions).filter(key => permissions[key]).join(', ') || 'لا توجد صلاحيات';
                        
                        return `
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${employee.name || 'غير محدد'}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${employee.position || 'غير محدد'}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${employee.email || ''}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${employee.phone || ''}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${permissionsList}</td>
                                <td class="px-4 py-3 text-sm font-medium min-w-[180px]">
                                    <div class="flex items-center justify-end gap-2 flex-nowrap">
                                        <button onclick="editStaff(${employee.id})" class="btn-edit">
                                            <i class="fas fa-edit ml-1.5"></i> تعديل
                                        </button>
                                        <button onclick="deleteStaff(${employee.id})" class="btn-delete">
                                            <i class="fas fa-trash ml-1.5"></i> حذف
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('');
                },
                loadingMessage: 'جاري تحميل بيانات الموظفين...',
                errorMessage: 'حدث خطأ أثناء تحميل بيانات الموظفين'
            });
        } catch (error) {
            console.error('[SectionLoader] Error loading staff:', error);
        }
    },

    // جلب بيانات المواد
    async loadSubjects() {
        console.log('[SectionLoader] Loading subjects data');
        try {
            const container = document.getElementById('subjectsTableBody');
            if (!container) {
                console.error('[SectionLoader] subjectsTableBody container not found');
                return;
            }

            await window.dataManager.fetchSectionData('subjects', {
                apiEndpoint: 'api/subjects.php',
                containerId: 'subjectsTableBody',
                renderFunction: (data) => {
                    if (!data || !data.success || !data.data || !Array.isArray(data.data)) {
                        return '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد بيانات</td></tr>';
                    }
                    
                    const subjects = data.data;
                    if (subjects.length === 0) {
                        return '<tr><td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد مواد</td></tr>';
                    }
                    
                    return subjects.map(subject => `
                        <tr class="hover:bg-gray-50 transition-colors">
                            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${subject.name || 'غير محدد'}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${subject.class || 'غير محدد'}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${subject.teacher_name || 'غير محدد'}</td>
                            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${subject.hours || 0} ساعة</td>
                            <td class="px-4 py-3 text-sm font-medium min-w-[180px]">
                                <div class="flex items-center justify-end gap-2 flex-nowrap">
                                    <button onclick="editSubject(${subject.id})" class="btn-edit">
                                        <i class="fas fa-edit ml-1.5"></i> تعديل
                                    </button>
                                    <button onclick="deleteSubject(${subject.id})" class="btn-delete">
                                        <i class="fas fa-trash ml-1.5"></i> حذف
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('');
                },
                loadingMessage: 'جاري تحميل بيانات المواد...',
                errorMessage: 'حدث خطأ أثناء تحميل بيانات المواد'
            });
        } catch (error) {
            console.error('[SectionLoader] Error loading subjects:', error);
        }
    },

    // جلب بيانات الحسابات
    async loadAccounts() {
        console.log('[SectionLoader] Loading accounts data');
        try {
            // جلب أقساط المراحل
            const feesContainer = document.getElementById('feesTableBody');
            if (feesContainer) {
                await window.dataManager.fetchSectionData('accounts-fees', {
                    apiEndpoint: 'api/accounts.php?action=get_fees',
                    containerId: 'feesTableBody',
                    renderFunction: (data) => {
                        if (!data || !data.success || !data.data || !Array.isArray(data.data)) {
                            return '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد بيانات</td></tr>';
                        }
                        
                        const fees = data.data;
                        if (fees.length === 0) {
                            return '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد أقساط</td></tr>';
                        }
                        
                        const formatCurrency = (amount) => {
                            return new Intl.NumberFormat('ar-IQ', {
                                style: 'currency',
                                currency: 'IQD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(amount || 0);
                        };
                        
                        return fees.map(fee => `
                            <tr class="hover:bg-gray-50 transition-colors">
                                <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${fee.class || 'غير محدد'}</td>
                                <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatCurrency(fee.amount)}</td>
                                <td class="px-4 py-3 text-sm text-gray-500">${fee.description || 'لا يوجد وصف'}</td>
                                <td class="px-4 py-3 text-sm font-medium">
                                    <div class="flex items-center justify-end gap-2 flex-nowrap">
                                        <button onclick="editFee(${fee.id})" class="btn-edit">
                                            <i class="fas fa-edit ml-1.5"></i> تعديل
                                        </button>
                                        <button onclick="deleteFee(${fee.id})" class="btn-delete">
                                            <i class="fas fa-trash ml-1.5"></i> حذف
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('');
                    },
                    loadingMessage: 'جاري تحميل الأقساط...',
                    errorMessage: 'حدث خطأ أثناء تحميل الأقساط'
                });
            }

            // جلب حسابات الطلاب
            const studentsAccountsContainer = document.getElementById('studentsAccountsTableBody');
            if (studentsAccountsContainer) {
                await window.dataManager.fetchSectionData('accounts-students', {
                    apiEndpoint: 'api/accounts.php?action=get_students_accounts',
                    containerId: 'studentsAccountsTableBody',
                    renderFunction: (data) => {
                        if (!data || !data.success || !data.data || !Array.isArray(data.data)) {
                            return '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد بيانات</td></tr>';
                        }
                        
                        const accounts = data.data;
                        if (accounts.length === 0) {
                            return '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد حسابات</td></tr>';
                        }
                        
                        const formatCurrency = (amount) => {
                            return new Intl.NumberFormat('ar-IQ', {
                                style: 'currency',
                                currency: 'IQD',
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 0
                            }).format(amount || 0);
                        };
                        
                        return accounts.map(account => {
                            const feeAmount = account.fee_amount || 0;
                            const totalPaid = account.total_paid || 0;
                            const remaining = account.remaining || (feeAmount - totalPaid);
                            const paidPercent = feeAmount > 0 ? ((totalPaid / feeAmount) * 100).toFixed(1) : 0;
                            
                            return `
                                <tr class="hover:bg-gray-50 transition-colors">
                                    <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${account.name || 'غير محدد'}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${account.class || 'غير محدد'}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatCurrency(feeAmount)}</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm ${totalPaid > 0 ? 'text-green-600 font-semibold' : 'text-gray-500'}">${formatCurrency(totalPaid)} (${paidPercent}%)</td>
                                    <td class="px-4 py-3 whitespace-nowrap text-sm ${remaining > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}">${formatCurrency(remaining)}</td>
                                    <td class="px-4 py-3 text-sm font-medium">
                                        <div class="flex items-center justify-end gap-2 flex-nowrap">
                                            ${account.student_id ? `
                                            <button onclick="addPayment(${account.student_id})" class="btn-primary text-sm px-3 py-1">
                                                <i class="fas fa-plus ml-1"></i> دفعة
                                            </button>
                                            <button onclick="viewReport(${account.student_id})" class="btn-secondary text-sm px-3 py-1">
                                                <i class="fas fa-file-alt ml-1"></i> تقرير
                                            </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('');
                    },
                    loadingMessage: 'جاري تحميل حسابات الطلاب...',
                    errorMessage: 'حدث خطأ أثناء تحميل حسابات الطلاب'
                });
            }
        } catch (error) {
            console.error('[SectionLoader] Error loading accounts:', error);
        }
    }
};

// دالة مساعدة لتنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('ar-IQ');
    } catch (error) {
        console.error('[formatDate] Error:', error);
        return dateString;
    }
}

// تخزين مؤقت لجميع الأنشطة (مركزي - يتم تعريفه مرة واحدة فقط)
// استخدام assignment مباشر على window (لن يسبب خطأ redeclaration)
// لأن assignment على window object آمن حتى لو تم تنفيذه أكثر من مرة
window.allActivitiesCache = window.allActivitiesCache || null;
