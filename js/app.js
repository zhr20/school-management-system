// إدارة الوضع الليلي واللغة
class AppSettings {
    constructor() {
        this.init();
    }

    init() {
        // تحميل الإعدادات من localStorage
        this.darkMode = localStorage.getItem('darkMode') === 'true';
        this.language = localStorage.getItem('language') || 'ar';
        
        // تطبيق الإعدادات
        this.applyDarkMode();
        this.applyLanguage();
    }

    toggleDarkMode() {
        this.darkMode = !this.darkMode;
        localStorage.setItem('darkMode', this.darkMode);
        this.applyDarkMode();
    }

    applyDarkMode() {
        const html = document.documentElement;
        if (this.darkMode) {
            html.classList.add('dark');
        } else {
            html.classList.remove('dark');
        }
        
        // تحديث أيقونة الوضع الليلي
        const darkModeIcon = document.getElementById('darkModeIcon');
        const darkModeText = document.getElementById('darkModeText');
        if (darkModeIcon && darkModeText) {
            if (this.darkMode) {
                darkModeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />';
                darkModeText.textContent = this.language === 'ar' ? 'الوضع النهاري' : 'Light Mode';
            } else {
                darkModeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />';
                darkModeText.textContent = this.language === 'ar' ? 'الوضع الليلي' : 'Dark Mode';
            }
        }
    }

    setLanguage(lang) {
        this.language = lang;
        localStorage.setItem('language', lang);
        this.applyLanguage();
        location.reload(); // إعادة تحميل الصفحة لتطبيق التغييرات
    }

    applyLanguage() {
        const html = document.documentElement;
        html.lang = this.language;
        html.dir = this.language === 'ar' ? 'rtl' : 'ltr';
    }

    getTranslation(key) {
        const translations = {
            ar: {
                'app_name': 'نظام إدارة المدرسة',
                'dashboard': 'الرئيسية',
                'teachers': 'المعلمين',
                'students': 'الطلاب',
                'staff': 'الموظفين',
                'subjects': 'المواد',
                'settings': 'الإعدادات',
                'user_name': 'المدير',
                'dark_mode': 'الوضع الليلي',
                'light_mode': 'الوضع النهاري',
                'language': 'اللغة',
                'arabic': 'العربية',
                'english': 'English',
                'logout': 'تسجيل الخروج'
            },
            en: {
                'app_name': 'School Management System',
                'dashboard': 'Dashboard',
                'teachers': 'Teachers',
                'students': 'Students',
                'staff': 'Staff',
                'subjects': 'Subjects',
                'settings': 'Settings',
                'user_name': 'Admin',
                'dark_mode': 'Dark Mode',
                'light_mode': 'Light Mode',
                'language': 'Language',
                'arabic': 'العربية',
                'english': 'English',
                'logout': 'Logout'
            }
        };
        return translations[this.language]?.[key] || key;
    }
}

// تهيئة التطبيق
const app = new AppSettings();

// دالة لإنشاء صورة افتراضية للطالب
function getStudentAvatar(name) {
    const initials = name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-yellow-500'];
    const color = colors[name.length % colors.length];
    return `<div class="w-10 h-10 rounded-full ${color} flex items-center justify-center text-white font-semibold text-sm">${initials}</div>`;
}
