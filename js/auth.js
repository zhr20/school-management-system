// نظام المصادقة والجلسات

// الحصول على التوكن من localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// الحصول على معلومات المستخدم من localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

// حفظ معلومات المستخدم
function setCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// التحقق من صحة الجلسة
async function verifySession() {
    const token = getAuthToken();
    if (!token) {
        return false;
    }
    
    try {
        let response;
        
        // استخدام authAPI إذا كان متاحاً، وإلا استخدم apiRequest مباشرة
        if (typeof authAPI !== 'undefined' && authAPI.verify) {
            response = await authAPI.verify(token);
        } else if (typeof apiRequest !== 'undefined' && typeof API_BASE_URL !== 'undefined') {
            response = await apiRequest(`${API_BASE_URL}/auth.php`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
        } else {
            console.error('api.js لم يتم تحميله بعد');
            return false;
        }
            
        if (response && response.success && response.data && response.data.user) {
            setCurrentUser(response.data.user);
            return true;
        }
    } catch (error) {
        console.error('خطأ في التحقق من الجلسة:', error);
    }
    
    // إذا فشل التحقق، حذف الجلسة
    clearAuth();
    return false;
}

// تسجيل الخروج
async function logout() {
    const token = getAuthToken();
    
    if (token) {
        try {
            // استخدام authAPI إذا كان متاحاً، وإلا استخدم apiRequest مباشرة
            if (typeof authAPI !== 'undefined' && authAPI.logout) {
                await authAPI.logout(token);
            } else if (typeof apiRequest !== 'undefined' && typeof API_BASE_URL !== 'undefined') {
                await apiRequest(`${API_BASE_URL}/auth.php`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
            }
        } catch (error) {
            console.error('خطأ في تسجيل الخروج:', error);
        }
    }
    
    clearAuth();
    window.location.href = 'login.html';
}

// مسح بيانات المصادقة
function clearAuth() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
}

// التحقق من الجلسة عند تحميل الصفحة
async function checkAuth() {
    // إذا كنا في صفحة تسجيل الدخول، لا نتحقق
    if (window.location.pathname.includes('login.html')) {
        return;
    }
    
    const isValid = await verifySession();
    if (!isValid) {
        window.location.href = 'login.html';
        return false;
    }
    
    // تحديث معلومات المستخدم في الصفحة
    updateUserInfoInPage();
    return true;
}

// تحديث معلومات المستخدم في الصفحة
function updateUserInfoInPage() {
    const user = getCurrentUser();
    if (!user) return;
    
    // تحديث اسم المستخدم
    const userNameEl = document.getElementById('userName');
    if (userNameEl) {
        userNameEl.textContent = user.name;
    }
    
    // تحديث المنصب
    const userPositionEl = document.getElementById('userPosition');
    if (userPositionEl) {
        userPositionEl.textContent = user.position;
    }
    
    // تحديث الصورة
    const userAvatarImg = document.getElementById('userAvatarImg');
    if (userAvatarImg) {
        const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=9333ea&color=fff&size=128`;
        userAvatarImg.src = avatarUrl;
        userAvatarImg.alt = user.name;
        
        userAvatarImg.onerror = function() {
            this.style.display = 'none';
            const userAvatar = document.getElementById('userAvatar');
            if (userAvatar) {
                const firstLetter = user.name ? user.name.charAt(0) : 'ع';
                userAvatar.innerHTML = '<span style="font-size: 0.75rem;">' + firstLetter + '</span>';
            }
        };
    }
    
    // تحديث currentUser في الكود القديم (للتوافق)
    if (typeof currentUser !== 'undefined') {
        currentUser = {
            name: user.name,
            position: user.position,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=9333ea&color=fff&size=128`
        };
    }
}

// ملاحظة: يجب تحميل auth.js بعد api.js

// التحقق من الجلسة عند تحميل الصفحة
// ننتظر حتى يتم تحميل api.js أولاً
function initAuth() {
    // التحقق من وجود apiRequest و API_BASE_URL
    if (typeof apiRequest === 'undefined' || typeof API_BASE_URL === 'undefined') {
        // إعادة المحاولة بعد 100ms
        setTimeout(initAuth, 100);
        return;
    }
    
    // الآن يمكننا التحقق من الجلسة
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkAuth);
    } else {
        checkAuth();
    }
}

// بدء التهيئة
initAuth();
