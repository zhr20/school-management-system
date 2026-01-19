// إدارة التصميم العام (Header و Sidebar)
let currentUser = {
    name: 'علي أحمد',
    position: 'مدير',
    avatar: 'https://ui-avatars.com/api/?name=علي+أحمد&background=0ea5e9&color=fff&size=128'
};

// تهيئة التصميم
function initLayout() {
    setupHeader();
    setupSidebar();
    setupSettings();
}

// إعداد Header
function setupHeader() {
    const header = document.getElementById('mainHeader');
    if (!header) return;
    
    // تحديث اسم المستخدم وصورته
    const userNameEl = document.getElementById('userName');
    const userPositionEl = document.getElementById('userPosition');
    const userAvatarEl = document.getElementById('userAvatar');
    
    if (userNameEl) userNameEl.textContent = currentUser.name;
    if (userPositionEl) userPositionEl.textContent = currentUser.position;
    if (userAvatarEl) {
        userAvatarEl.src = currentUser.avatar;
        userAvatarEl.alt = currentUser.name;
    }
}

// إعداد Sidebar
function setupSidebar() {
    // تحديد الصفحة النشطة
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const links = document.querySelectorAll('.sidebar-link');
    
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href === currentPage || (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // إضافة تأثير hover
    links.forEach(link => {
        link.addEventListener('click', function() {
            links.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

// إعداد الإعدادات
function setupSettings() {
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsMenu = document.getElementById('settingsMenu');
    
    if (settingsBtn && settingsMenu) {
        settingsBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            settingsMenu.classList.toggle('hidden');
        });
        
        // إغلاق القائمة عند النقر خارجها
        document.addEventListener('click', function() {
            settingsMenu.classList.add('hidden');
        });
        
        settingsMenu.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }
}

// تهيئة عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initLayout);
