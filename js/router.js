// نظام State Management بسيط
class AppState {
    constructor() {
        this.currentPage = 'index';
        this.previousPage = null;
        this.history = [];
        this.listeners = new Map();
    }
    
    setCurrentPage(page) {
        if (this.currentPage !== page) {
            this.previousPage = this.currentPage;
            this.currentPage = page;
            this.history.push(page);
            this.notifyListeners('pageChanged', { current: page, previous: this.previousPage });
        }
    }
    
    getCurrentPage() {
        return this.currentPage;
    }
    
    getPreviousPage() {
        return this.previousPage;
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    notifyListeners(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('[AppState] Error in listener:', error);
                }
            });
        }
    }
}

// نظام التوجيه (Routing) للتطبيق - Single Page Application
class Router {
    constructor() {
        this.routes = {
            'index.html': 'index',
            'teachers.html': 'teachers',
            'students.html': 'students',
            'staff.html': 'staff',
            'subjects.html': 'subjects',
            'accounts.html': 'accounts'
        };
        this.currentPage = 'index';
        this.contentContainer = null;
        this.appState = new AppState();
        this.init();
    }

    init() {
        // التحقق من نوع التحميل (reload أم لا)
        let isReload = false;
        try {
            // طريقة حديثة (Performance Navigation Timing API)
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                isReload = navigation.type === 'reload';
            }
        } catch (e) {
            // طريقة قديمة للتوافق
            try {
                if (performance.navigation) {
                    isReload = performance.navigation.type === 1; // TYPE_RELOAD
                }
            } catch (e2) {
                // إذا فشلت الطريقتان، نتحقق من URL
                const path = window.location.pathname.split('/').pop() || '';
                // إذا كان URL ليس index.html، قد يكون reload من صفحة أخرى
                isReload = path && path !== 'index.html' && path !== '' && path !== '/';
            }
        }
        
        // عند reload، نوجه دائماً إلى index
        if (isReload) {
            console.log('[Router] Page reload detected, redirecting to index');
            // تحديث URL إلى index.html
            window.history.replaceState({ page: 'index' }, '', 'index.html');
        }
        
        // التأكد من أن الصفحة الافتراضية هي index عند التحميل الأول
        const defaultPage = this.ensureDefaultPageOnLoad();
        
        // الحصول على حاوية المحتوى
        this.contentContainer = document.getElementById('mainContent') || document.querySelector('main[data-spa-content]') || document.querySelector('main');
        if (!this.contentContainer) {
            console.error('[Router] Content container not found');
            return;
        }
        
        // إضافة علامة SPA للمحتوى
        this.contentContainer.setAttribute('data-spa-content', 'true');
        
        console.log('[Router] Router initialized');

        // التأكد من أن العناصر الثابتة تبقى ثابتة من البداية
        this.ensurePersistentElements();
        
        // إضافة مراقب للتأكد من أن Header يبقى ظاهراً
        this.setupHeaderObserver();

        // التأكد من أن الصفحة الافتراضية هي index
        const defaultRedirect = this.ensureDefaultPage();
        
        // ربط جميع روابط السايد بار
        this.bindSidebarLinks();
        
        // عند reload، نحمل دائماً index
        // عند التنقل العادي، نحمل الصفحة الحالية
        let targetPage = 'index';
        if (!isReload) {
            targetPage = defaultPage || defaultRedirect || this.getCurrentPage();
        }
        
        console.log('[Router] Target page:', targetPage, 'isReload:', isReload);
        
        // إذا كانت الصفحة الحالية هي index وكانت الصفحة الحالية في index.html، لا نحملها مرة أخرى
        // لأن المحتوى موجود بالفعل
        if (targetPage === 'index' && (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '')) {
            console.log('[Router] Already on index page, skipping load');
            // تحديث حالة active للروابط
            this.updateActiveState('index.html');
            // التأكد مرة أخرى من أن العناصر الثابتة تبقى ثابتة
            this.ensurePersistentElements();
            // تهيئة الصفحة الرئيسية
            this.initializePage('index');
            return;
        }
        
        // تحميل الصفحة المستهدفة
        this.loadPage(targetPage);
    }
    
    // تهيئة الصفحة بعد التأكد من وجودها
    initializePage(page) {
        // إطلاق حدث pageLoaded
        const event = new CustomEvent('pageLoaded', { detail: { page } });
        document.dispatchEvent(event);
        
        // استدعاء initPage إذا كان متاحاً
        setTimeout(() => {
            if (typeof window.initPage === 'function') {
                try {
                    window.initPage(page);
                } catch (error) {
                    console.error(`[Router] Error initializing page ${page}:`, error);
                }
            }
        }, 100);
    }
    
    // إعداد مراقب للتأكد من أن Header يبقى ظاهراً
    setupHeaderObserver() {
        // التأكد من Header كل 500ms (fallback)
        setInterval(() => {
            const header = document.getElementById('mainHeader');
            if (header && (header.style.display === 'none' || header.classList.contains('hidden'))) {
                console.log('[Router] Header was hidden, restoring it');
                this.ensureHeaderVisible();
            }
        }, 500);
        
        // مراقبة تغييرات DOM
        if (typeof MutationObserver !== 'undefined') {
            const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const header = document.getElementById('mainHeader');
                        if (header && mutation.target === header) {
                            // إذا تم تغيير style للـ Header، نتأكد من أنه ظاهر
                            if (header.style.display === 'none' || header.style.visibility === 'hidden') {
                                console.log('[Router] Header style changed, ensuring visibility');
                                this.ensureHeaderVisible();
                            }
                        }
                    }
                });
            });
            
            const header = document.getElementById('mainHeader');
            if (header) {
                observer.observe(header, {
                    attributes: true,
                    attributeFilter: ['style', 'class']
                });
            }
        }
    }

    // الحصول على الصفحة الحالية من URL
    getCurrentPage() {
        const path = window.location.pathname.split('/').pop() || '';
        const hash = window.location.hash.replace('#', '') || '';
        
        // إذا كان المسار فارغاً أو '/' أو 'index.html' أو hash فارغ، نعود إلى index
        if (!path || path === '' || path === '/' || path === 'index.html' || (!hash && !path)) {
            return 'index';
        }
        
        // البحث في routes
        const page = this.routes[path] || this.routes[hash] || 'index';
        return page;
    }
    
    // التأكد من أن الصفحة الافتراضية هي index عند التحميل الأول
    ensureDefaultPageOnLoad() {
        const path = window.location.pathname.split('/').pop() || '';
        const hash = window.location.hash.replace('#', '') || '';
        
        // التحقق من نوع التحميل
        let isReload = false;
        try {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                isReload = navigation.type === 'reload';
            }
        } catch (e) {
            try {
                if (performance.navigation) {
                    isReload = performance.navigation.type === 1;
                }
            } catch (e2) {
                // إذا فشلت الطريقتان، نعتبر reload إذا كان URL ليس index.html
                isReload = path && path !== 'index.html' && path !== '' && path !== '/';
            }
        }
        
        // إذا كان reload أو المسار فارغاً أو '/'، نوجه إلى index.html
        if (isReload || !path || path === '' || path === '/') {
            console.log('[Router] Redirecting to index.html (default page on load/reload)');
            window.history.replaceState({ page: 'index' }, '', 'index.html');
            return 'index';
        }
        
        return null;
    }

    // ربط روابط السايد بار
    bindSidebarLinks() {
        const sidebarLinks = document.querySelectorAll('.sidebar-link');
        console.log(`[Router] Binding ${sidebarLinks.length} sidebar links`);
        
        sidebarLinks.forEach(link => {
            // إزالة event listeners القديمة
            const newLink = link.cloneNode(true);
            link.parentNode.replaceChild(newLink, link);
            
            newLink.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // إغلاق جميع النوافذ المنبثقة قبل التنقل
                this.closeAllModals();
                
                // الحصول على route من data-route أو href
                const route = newLink.getAttribute('data-route');
                const href = newLink.getAttribute('href');
                const page = route || this.routes[href] || 'index';
                
                console.log(`[Router] Navigation clicked: ${href} -> ${page}`);
                
                // التأكد من أن Header و Sidebar ثابتان
                this.ensurePersistentElements();
                
                this.navigate(page, href);
            });
        });
    }
    
    // إغلاق جميع النوافذ المنبثقة والعناصر المتراكبة
    closeAllModals() {
        console.log('[Router] Closing all modals and overlays');
        
        // قائمة بجميع معرفات النوافذ المنبثقة المعروفة
        const modalIds = [
            'settingsModal',
            'feeModal',
            'paymentModal',
            'reportModal',
            'studentAccountModal',
            'staffModal',
            'studentModal',
            'teacherModal',
            'subjectModal',
            'allActivitiesModal'
        ];
        
        // إغلاق جميع النوافذ المنبثقة المعروفة
        modalIds.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                console.log(`[Router] Closed modal: ${modalId}`);
            }
        });
        
        // البحث عن جميع النوافذ المنبثقة الأخرى (بالفئة أو السمة)
        const allModals = document.querySelectorAll('[class*="modal"][class*="fixed"], [id*="Modal"], [id*="modal"]');
        allModals.forEach(modal => {
            if (modal && !modal.classList.contains('hidden')) {
                modal.classList.add('hidden');
                modal.style.display = 'none';
                console.log(`[Router] Closed additional modal: ${modal.id || 'unnamed'}`);
            }
        });
        
        // البحث عن جميع عناصر overlay
        const overlays = document.querySelectorAll('.overlay, [class*="overlay"], [class*="backdrop"]');
        overlays.forEach(overlay => {
            if (overlay && overlay.parentNode) {
                overlay.remove();
                console.log(`[Router] Removed overlay element`);
            }
        });
        
        // إزالة class modal-open من body
        document.body.classList.remove('modal-open', 'overflow-hidden');
        document.body.style.overflow = '';
        
        // إزالة أي event listeners مرتبطة بالنوافذ المنبثقة
        // (هذا اختياري، لكنه يساعد في تنظيف الذاكرة)
        
        // استدعاء دوال الإغلاق العامة إن وجدت
        if (typeof window.closeAllActivitiesModal === 'function') {
            try {
                window.closeAllActivitiesModal();
            } catch (e) {
                console.warn('[Router] Error calling closeAllActivitiesModal:', e);
            }
        }
        
        if (typeof window.closeSettings === 'function') {
            try {
                window.closeSettings();
            } catch (e) {
                console.warn('[Router] Error calling closeSettings:', e);
            }
        }
        
        if (typeof window.closeModal === 'function') {
            try {
                window.closeModal();
            } catch (e) {
                console.warn('[Router] Error calling closeModal:', e);
            }
        }
        
        // إغلاق النوافذ المنبثقة الخاصة بصفحة الحسابات
        const accountsCloseFunctions = [
            'closeFeeModal',
            'closePaymentModal',
            'closeReportModal',
            'closeStudentAccountModal'
        ];
        
        accountsCloseFunctions.forEach(funcName => {
            if (typeof window[funcName] === 'function') {
                try {
                    window[funcName]();
                } catch (e) {
                    console.warn(`[Router] Error calling ${funcName}:`, e);
                }
            }
        });
        
        console.log('[Router] All modals and overlays closed');
    }

    // التنقل إلى صفحة جديدة
    navigate(page, href) {
        console.log(`[Router] Navigating to: ${page} (${href})`);
        
        // إغلاق جميع النوافذ المنبثقة قبل التنقل
        this.closeAllModals();
        
        // تحديث حالة active
        this.updateActiveState(href);
        
        // تحديث URL بدون إعادة تحميل
        window.history.pushState({ page }, '', href);
        
        // تحميل المحتوى
        this.loadPage(page).catch(error => {
            console.error('[Router] Navigation error:', error);
        });
    }
    
    // التأكد من أن الصفحة الافتراضية هي index (للتنقل)
    ensureDefaultPage() {
        const path = window.location.pathname.split('/').pop() || '';
        const hash = window.location.hash.replace('#', '') || '';
        
        // إذا كان المسار فارغاً أو '/'، نوجه إلى index.html
        if (!path || path === '' || path === '/') {
            console.log('[Router] Redirecting to index.html (default page)');
            window.history.replaceState({ page: 'index' }, '', 'index.html');
            return 'index';
        }
        
        return null;
    }
    
    // التأكد من أن الهيدر ظاهر دائماً
    ensureHeaderVisible() {
        // البحث عن Header بطرق متعددة
        let header = document.getElementById('mainHeader');
        if (!header) {
            header = document.querySelector('nav[id="mainHeader"]');
        }
        if (!header) {
            header = document.querySelector('nav[data-persistent="true"]');
        }
        if (!header) {
            header = document.querySelector('body > nav:first-of-type');
        }
        
        if (header) {
            // إجبار Header على الظهور
            header.style.display = 'block';
            header.style.visibility = 'visible';
            header.style.opacity = '1';
            header.style.position = 'fixed';
            header.style.top = '0';
            header.style.left = '0';
            header.style.right = '0';
            header.style.zIndex = '9999';
            header.style.width = '100%';
            header.style.height = 'auto';
            header.style.minHeight = '64px';
            header.classList.remove('hidden');
            header.classList.remove('opacity-0');
            header.classList.remove('invisible');
            // إضافة علامة للعناصر الثابتة
            header.setAttribute('data-persistent', 'true');
            // إضافة ID إذا لم يكن موجوداً
            if (!header.id) {
                header.id = 'mainHeader';
            }
            console.log('[Router] Header ensured visible');
        } else {
            // إذا لم يتم العثور على Header في DOM، نحاول إنشاؤه من index.html
            console.warn('[Router] Header not found in DOM, checking if we need to preserve it from index.html');
            
            // محاولة العثور على Header في index.html الأصلي
            // (هذا لن يعمل إذا تم تحميل الصفحة مباشرة، لكنه سيعمل في SPA)
            const body = document.body;
            if (body && !body.querySelector('#mainHeader')) {
                // إذا لم يكن Header موجوداً، نحتاج إلى التأكد من أنه موجود في index.html
                console.warn('[Router] Header should be in index.html - make sure it exists there');
            }
        }
    }
    
    // التأكد من أن العناصر الثابتة (Header و Sidebar) تبقى ثابتة
    ensurePersistentElements() {
        // التأكد من Header أولاً
        this.ensureHeaderVisible();
        
        // إذا لم يكن Header موجوداً، نحاول إنشاؤه من الصفحة الحالية
        let header = document.getElementById('mainHeader');
        if (!header) {
            // البحث في body مباشرة
            header = document.querySelector('body > nav:first-of-type');
            if (header) {
                header.id = 'mainHeader';
                header.setAttribute('data-persistent', 'true');
                this.ensureHeaderVisible();
            } else {
                // إذا لم يكن Header موجوداً، نحتاج إلى نسخه من index.html
                console.warn('[Router] Header not found, it should be in index.html');
            }
        }
        
        // التأكد من Sidebar
        const sidebar = document.getElementById('mainSidebar');
        if (sidebar) {
            sidebar.setAttribute('data-persistent', 'true');
            sidebar.style.position = 'fixed';
            sidebar.style.display = '';
            sidebar.style.visibility = 'visible';
            sidebar.style.opacity = '1';
            sidebar.classList.remove('hidden');
            console.log('[Router] Sidebar ensured persistent');
        } else {
            console.warn('[Router] Sidebar not found, it should be in index.html');
        }
        
        // التأكد من Mobile Sidebar
        const mobileSidebar = document.getElementById('mobileSidebar');
        if (mobileSidebar) {
            mobileSidebar.setAttribute('data-persistent', 'true');
        }
        
        // التأكد من أن Main Content موجود
        const mainContent = document.getElementById('mainContent') || document.querySelector('main[data-spa-content]') || document.querySelector('main');
        if (mainContent) {
            mainContent.setAttribute('data-spa-content', 'true');
            console.log('[Router] Main content ensured');
        }
    }

    // تحديث حالة active للروابط
    updateActiveState(activeHref) {
        const allLinks = document.querySelectorAll('.sidebar-link');
        console.log(`[Router] Updating active state for: ${activeHref}`);
        
        // الحصول على route من activeHref
        const activeRoute = this.routes[activeHref] || 'index';
        
        allLinks.forEach(link => {
            link.classList.remove('active');
            const linkHref = link.getAttribute('href');
            const linkRoute = link.getAttribute('data-route') || this.routes[linkHref] || 'index';
            
            // المقارنة باستخدام route أو href
            if (linkHref === activeHref || linkRoute === activeRoute) {
                link.classList.add('active');
                console.log(`[Router] Set active: ${linkHref} (route: ${linkRoute})`);
            }
        });
        
        // إضافة تأثير بصري للحالة النشطة
        const activeLink = document.querySelector('.sidebar-link.active');
        if (activeLink) {
            // إضافة تأثير انتقالي
            activeLink.style.transition = 'all 0.3s ease';
        }
    }

    // تحميل محتوى الصفحة
    async loadPage(page) {
        try {
            console.log(`[Router] Loading page: ${page}`);
            
            // التأكد من أن العناصر الثابتة تبقى ثابتة
            this.ensurePersistentElements();
            
            // إغلاق جميع النوافذ المنبثقة قبل تحميل الصفحة
            this.closeAllModals();
            
            // التأكد من أن contentContainer موجود
            if (!this.contentContainer) {
                this.contentContainer = document.getElementById('mainContent') || document.querySelector('main[data-spa-content]') || document.querySelector('main');
                if (!this.contentContainer) {
                    throw new Error('Main content container not found');
                }
            }
            
            // إضافة تأثير fade out
            this.contentContainer.style.opacity = '0';
            this.contentContainer.style.transform = 'translateY(10px)';
            
            // انتظار قليل للانتقال
            await this.sleep(150);
            
            // جلب محتوى الصفحة
            const pageUrl = this.getPageUrl(page);
            console.log(`[Router] Fetching: ${pageUrl}`);
            
            const response = await fetch(pageUrl);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.status} ${response.statusText}`);
            }
            
            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            
            // استخراج المحتوى الرئيسي
            const mainContent = doc.querySelector('main');
            if (!mainContent) {
                throw new Error('Main content not found in page');
            }
            
            // استخراج المحتوى الداخلي
            // نأخذ كل المحتوى داخل main مباشرة
            // لأن بعض الصفحات مثل accounts.html تحتوي على عدة divs
            let contentHTML = mainContent.innerHTML;
            
            // تنظيف المحتوى من أي scripts أو styles غير مرغوب فيها
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = contentHTML;
            
            // إزالة أي scripts من المحتوى
            const scripts = tempDiv.querySelectorAll('script');
            scripts.forEach(script => script.remove());
            
            // إزالة Header و Sidebar من المحتوى إذا كانا موجودين (لضمان عدم تكرارهما)
            const headerInContent = tempDiv.querySelector('nav[id="mainHeader"], #mainHeader, nav[data-persistent="true"]');
            const sidebarInContent = tempDiv.querySelector('aside[id="mainSidebar"], #mainSidebar, aside[data-persistent="true"]');
            const mobileSidebarInContent = tempDiv.querySelector('aside[id="mobileSidebar"], #mobileSidebar');
            const settingsModalInContent = tempDiv.querySelector('#settingsModal');
            
            if (headerInContent) {
                console.log('[Router] Removing header from loaded content');
                headerInContent.remove();
            }
            if (sidebarInContent) {
                console.log('[Router] Removing sidebar from loaded content');
                sidebarInContent.remove();
            }
            if (mobileSidebarInContent) {
                console.log('[Router] Removing mobile sidebar from loaded content');
                mobileSidebarInContent.remove();
            }
            if (settingsModalInContent) {
                console.log('[Router] Removing settings modal from loaded content');
                settingsModalInContent.remove();
            }
            
            // الحصول على المحتوى النظيف
            contentHTML = tempDiv.innerHTML;
            
            // التأكد من أن Header موجود في DOM قبل استبدال المحتوى
            this.ensureHeaderVisible();
            
            // استبدال المحتوى داخل Main Content فقط (Inline Rendering)
            this.contentContainer.innerHTML = contentHTML;
            
            // التأكد من أن المحتوى ظاهر
            this.contentContainer.style.display = 'block';
            this.contentContainer.style.visibility = 'visible';
            this.contentContainer.style.opacity = '1';
            this.contentContainer.classList.remove('hidden');
            
            // إزالة أي classes مخفية
            this.contentContainer.classList.remove('opacity-0', 'invisible');
            
            // التأكد من أن Header ظاهر بعد استبدال المحتوى مباشرة
            this.ensureHeaderVisible();
            
            // التأكد من أن جميع العناصر داخل المحتوى ظاهرة (ما عدا mobile sidebar والنوافذ المنبثقة)
            const allHiddenElements = this.contentContainer.querySelectorAll('.hidden, [style*="display: none"]');
            allHiddenElements.forEach(el => {
                // تجاهل mobile sidebar والنوافذ المنبثقة
                const isMobileSidebar = el.id === 'mobileSidebar' || el.closest('#mobileSidebar');
                const isModal = el.id && (
                    el.id.includes('Modal') || 
                    el.id.includes('modal') ||
                    el.classList.contains('modal') ||
                    el.closest('[id*="Modal"], [id*="modal"], .modal')
                );
                
                if (!isMobileSidebar && !isModal) {
                    el.classList.remove('hidden');
                    if (el.style) {
                        el.style.display = '';
                    }
                } else {
                    // التأكد من أن النوافذ المنبثقة مخفية
                    if (isModal) {
                        el.classList.add('hidden');
                        if (el.style) {
                            el.style.display = 'none';
                        }
                    }
                }
            });
            
            console.log(`[Router] Content replaced, length: ${contentHTML.length}`);
            
            // تحميل سكريبتات الصفحة المطلوبة
            await this.loadPageScripts(page);
            
            // انتظار إضافي لضمان تحميل البيانات
            await this.sleep(300);
            
            // جلب بيانات القسم بعد تحميل المحتوى
            await this.loadSectionData(page);
            
            // للتأكد من أن الجدول ظاهر في صفحة المعلمين
            if (page === 'teachers') {
                setTimeout(() => {
                    const teachersTable = document.getElementById('teachersTable');
                    if (teachersTable) {
                        teachersTable.style.display = 'table';
                        teachersTable.style.visibility = 'visible';
                        teachersTable.classList.remove('hidden');
                    }
                    
                    const tableContainer = this.contentContainer.querySelector('.overflow-x-auto, .w-full.overflow-x-auto');
                    if (tableContainer) {
                        tableContainer.style.display = 'block';
                        tableContainer.style.visibility = 'visible';
                        tableContainer.classList.remove('hidden');
                    }
                    
                    const tableBody = document.getElementById('teachersTableBody');
                    if (tableBody) {
                        tableBody.style.display = 'table-row-group';
                        tableBody.style.visibility = 'visible';
                        tableBody.classList.remove('hidden');
                    }
                }, 100);
            }
            
            // للتأكد من أن الجدول ظاهر في صفحة الطلاب
            if (page === 'students') {
                setTimeout(() => {
                    const studentsTable = document.getElementById('studentsTable');
                    if (studentsTable) {
                        studentsTable.style.display = 'table';
                        studentsTable.style.visibility = 'visible';
                        studentsTable.classList.remove('hidden');
                    }
                    
                    const tableContainer = this.contentContainer.querySelector('.overflow-x-auto, .w-full.overflow-x-auto');
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
                }, 100);
            }
            
            // إضافة تأثير fade in
            this.contentContainer.style.opacity = '1';
            this.contentContainer.style.transform = 'translateY(0)';
            
            // التأكد مرة أخرى من أن المحتوى ظاهر
            this.contentContainer.style.display = 'block';
            this.contentContainer.style.visibility = 'visible';
            
            // التأكد مرة أخرى من أن العناصر الثابتة تبقى ثابتة
            this.ensurePersistentElements();
            
            // التأكد من أن Header ظاهر بعد تحميل المحتوى
            setTimeout(() => {
                this.ensureHeaderVisible();
                this.ensurePersistentElements();
            }, 100);
            
            this.currentPage = page;
            this.appState.setCurrentPage(page);
            console.log(`[Router] Page loaded successfully: ${page}`);
        } catch (error) {
            console.error('[Router] Error loading page:', error);
            console.error('[Router] Error details:', {
                page: page,
                url: this.getPageUrl(page),
                message: error.message,
                stack: error.stack
            });
            
            this.contentContainer.innerHTML = `
                <div class="flex items-center justify-center h-64">
                    <div class="text-center">
                        <p class="text-red-500 text-lg mb-2">حدث خطأ أثناء تحميل الصفحة</p>
                        <p class="text-gray-500 text-sm">${error.message}</p>
                        <button onclick="location.reload()" class="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                            إعادة تحميل الصفحة
                        </button>
                    </div>
                </div>
            `;
            this.contentContainer.style.opacity = '1';
            this.contentContainer.style.display = 'block';
        }
    }

    // الحصول على URL الصفحة
    getPageUrl(page) {
        const pageMap = {
            'index': 'index.html',
            'teachers': 'teachers.html',
            'students': 'students.html',
            'staff': 'staff.html',
            'subjects': 'subjects.html',
            'accounts': 'accounts.html'
        };
        return pageMap[page] || 'index.html';
    }

    // تحميل سكريبتات الصفحة
    async loadPageScripts(page) {
        const scriptMap = {
            'index': ['js/dashboard.js'],
            'teachers': ['js/teachers.js'],
            'students': ['js/students.js'],
            'staff': ['js/staff.js'],
            'subjects': ['js/subjects.js'],
            'accounts': ['js/accounts.js']
        };

        const scripts = scriptMap[page] || [];
        
        console.log(`[Router] Loading scripts for page: ${page}`, scripts);
        
        // إزالة السكريبتات القديمة
        document.querySelectorAll('script[data-page-script]').forEach(script => {
            console.log(`[Router] Removing old script: ${script.src}`);
            script.remove();
        });

        // تحميل السكريبتات الجديدة بشكل متسلسل
        for (const src of scripts) {
            try {
                await this.loadScript(src);
                console.log(`[Router] Script loaded: ${src}`);
            } catch (error) {
                console.error(`[Router] Error loading script ${src}:`, error);
            }
        }
        
        // إطلاق حدث مخصص لإعلام الصفحة بأنها جاهزة
        const event = new CustomEvent('pageLoaded', { detail: { page } });
        document.dispatchEvent(event);
        
        // تهيئة الصفحة بعد تحميل السكريبتات
        setTimeout(() => {
            if (typeof window.initPage === 'function') {
                try {
                    window.initPage(page);
                } catch (error) {
                    console.error(`[Router] Error initializing page ${page}:`, error);
                }
            }
        }, 200);
        
        console.log(`[Router] All scripts loaded for page: ${page}`);
    }
    
    // تحميل سكريبت واحد
    loadScript(src) {
        return new Promise((resolve, reject) => {
            // إزالة جميع السكريبتات التي لها نفس src (بغض النظر عن الـ attribute)
            // لتجنب تحميل السكريبت أكثر من مرة
            const existingScripts = document.querySelectorAll(`script[src="${src}"], script[src*="${src.split('/').pop()}"]`);
            existingScripts.forEach(script => {
                console.log(`[Router] Removing existing script: ${src}`);
                script.remove();
            });
            
            const script = document.createElement('script');
            script.src = src;
            script.setAttribute('data-page-script', 'true');
            script.async = false; // تحميل متسلسل لضمان الترتيب
            
            let resolved = false;
            
            script.onload = () => {
                if (!resolved) {
                    resolved = true;
                    console.log(`[Router] Script loaded successfully: ${src}`);
                    // انتظار قليل لضمان تنفيذ السكريبت
                    setTimeout(() => resolve(), 150);
                }
            };
            
            script.onerror = (error) => {
                if (!resolved) {
                    resolved = true;
                    console.error(`[Router] Failed to load script: ${src}`, error);
                    reject(new Error(`Failed to load script: ${src}`));
                }
            };
            
            // timeout للسلامة
            setTimeout(() => {
                if (!resolved) {
                    resolved = true;
                    console.warn(`[Router] Script load timeout: ${src}`);
                    resolve(); // نستمر حتى لو فشل تحميل السكريبت
                }
            }, 5000);
            
            document.body.appendChild(script);
        });
    }

    // جلب بيانات القسم
    async loadSectionData(page) {
        console.log(`[Router] Loading section data for: ${page}`);
        
        if (!window.sectionDataLoaders) {
            console.warn('[Router] sectionDataLoaders not available');
            return;
        }

        const loaderMap = {
            'index': 'loadDashboard',
            'teachers': 'loadTeachers',
            'students': 'loadStudents',
            'staff': 'loadStaff',
            'subjects': 'loadSubjects',
            'accounts': 'loadAccounts'
        };

        const loaderName = loaderMap[page];
        if (loaderName && typeof window.sectionDataLoaders[loaderName] === 'function') {
            try {
                await window.sectionDataLoaders[loaderName]();
                console.log(`[Router] Section data loaded for: ${page}`);
            } catch (error) {
                console.error(`[Router] Error loading section data for ${page}:`, error);
            }
        } else {
            console.warn(`[Router] No loader found for page: ${page}`);
        }
    }

    // دالة مساعدة للانتظار
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// تهيئة الراوتر عند تحميل الصفحة
let appRouter;

// دالة تهيئة
function initRouter() {
    if (!appRouter) {
        appRouter = new Router();
        window.appRouter = appRouter;
        window.appState = appRouter.appState; // جعل AppState متاحاً عالمياً
        console.log('[Router] Router initialized');
    }
}

// تهيئة عند تحميل DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRouter);
} else {
    // DOM محمل بالفعل
    initRouter();
}

// ملاحظة: index.html هو نقطة الدخول الوحيدة للتطبيق
// جميع الصفحات الأخرى يتم تحميلها ديناميكياً عبر SPA Router
// عند عمل reload، يتم تحميل index دائماً

// التعامل مع زر الرجوع/الأمام في المتصفح
window.addEventListener('popstate', (e) => {
    if (appRouter) {
        if (e.state && e.state.page) {
            appRouter.loadPage(e.state.page);
        } else {
            // إذا لم يكن هناك state، نعود إلى index كصفحة افتراضية
            appRouter.loadPage('index');
        }
    }
});

// التأكد من تحميل index عند Refresh أو التحميل الأول
window.addEventListener('load', () => {
    // عند تحميل الصفحة، نتحقق من نوع التحميل
    const navigation = performance.getEntriesByType('navigation')[0];
    const isReload = navigation && navigation.type === 'reload';
    
    if (isReload && appRouter) {
        console.log('[Router] Page reload detected on load event, ensuring index page');
        // تحديث URL إلى index.html إذا لم يكن كذلك
        const path = window.location.pathname.split('/').pop() || '';
        if (path && path !== 'index.html' && path !== '' && path !== '/') {
            window.history.replaceState({ page: 'index' }, '', 'index.html');
        }
        // تحميل index
        appRouter.loadPage('index');
    }
});

// استماع لحدث تحميل الصفحة
document.addEventListener('pageLoaded', (e) => {
    const page = e.detail.page;
    console.log(`[Router] Page loaded event received for: ${page}`);
    
    // إعادة تهيئة الصفحة إذا لزم الأمر
    setTimeout(() => {
        if (typeof window.initPage === 'function') {
            try {
                window.initPage(page);
            } catch (error) {
                console.error(`[Router] Error initializing page ${page}:`, error);
            }
        }
    }, 100);
});

// جعل الراوتر متاحاً عالمياً
window.Router = Router;

// جعل دالة إغلاق جميع النوافذ متاحة عالمياً
window.closeAllModals = function() {
    if (appRouter && typeof appRouter.closeAllModals === 'function') {
        appRouter.closeAllModals();
    }
};
