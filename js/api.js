// إعدادات API
const API_BASE_URL = 'http://localhost/schoolMange/api';

// دالة عامة للاتصال بالـ API
async function apiRequest(url, options = {}) {
    try {
        const defaultHeaders = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };
        
        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: {
                ...defaultHeaders,
                ...options.headers
            },
            body: options.body || undefined,
            ...options
        });
        
        // التحقق من نوع المحتوى
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const text = await response.text();
        let data;
        
        // تنظيف النص من أي مسافات بيضاء أو BOM في البداية
        let cleanText = text.trim();
        
        // إزالة أي BOM أو أحرف غير مرئية في البداية
        cleanText = cleanText.replace(/^\uFEFF/, '').replace(/^[\u200B-\u200D\uFEFF]/, '');
        
        // إزالة أي نص قبل أول { أو [
        const firstBrace = cleanText.indexOf('{');
        const firstBracket = cleanText.indexOf('[');
        
        if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
            cleanText = cleanText.substring(firstBrace);
        } else if (firstBracket !== -1) {
            cleanText = cleanText.substring(firstBracket);
        }
        
        // إزالة أي نص بعد آخر } أو ]
        const lastBrace = cleanText.lastIndexOf('}');
        const lastBracket = cleanText.lastIndexOf(']');
        
        if (lastBrace !== -1 && (lastBracket === -1 || lastBrace > lastBracket)) {
            cleanText = cleanText.substring(0, lastBrace + 1);
        } else if (lastBracket !== -1) {
            cleanText = cleanText.substring(0, lastBracket + 1);
        }
        
        try {
            data = JSON.parse(cleanText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            console.error('Response status:', response.status);
            console.error('Response headers:', response.headers);
            console.error('Response text (first 500 chars):', cleanText.substring(0, 500));
            console.error('Response text (full):', cleanText);
            
            // محاولة العثور على JSON في النص إذا كان هناك نص إضافي
            const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    data = JSON.parse(jsonMatch[0]);
                    console.warn('تم العثور على JSON داخل النص');
                } catch (e) {
                    throw new Error('Invalid JSON response from server. Response: ' + cleanText.substring(0, 200));
                }
            } else {
                throw new Error('Invalid JSON response from server. Response: ' + cleanText.substring(0, 200));
            }
        }
        
        if (!response.ok) {
            throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
        
        return data;
    } catch (error) {
        console.error('API Error:', error);
        console.error('URL:', url);
        console.error('Options:', options);
        throw error;
    }
}

// دوال API للطلاب
const studentsAPI = {
    getAll: () => apiRequest(`${API_BASE_URL}/students.php`),
    getById: (id) => apiRequest(`${API_BASE_URL}/students.php?id=${id}`),
    create: (data) => apiRequest(`${API_BASE_URL}/students.php`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`${API_BASE_URL}/students.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`${API_BASE_URL}/students.php?id=${id}`, {
        method: 'DELETE'
    })
};

// دوال API للمعلمين
const teachersAPI = {
    getAll: () => apiRequest(`${API_BASE_URL}/teachers.php`),
    getById: (id) => apiRequest(`${API_BASE_URL}/teachers.php?id=${id}`),
    create: (data) => apiRequest(`${API_BASE_URL}/teachers.php`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`${API_BASE_URL}/teachers.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`${API_BASE_URL}/teachers.php?id=${id}`, {
        method: 'DELETE'
    })
};

// دوال API للمواد
const subjectsAPI = {
    getAll: () => apiRequest(`${API_BASE_URL}/subjects.php`),
    getById: (id) => apiRequest(`${API_BASE_URL}/subjects.php?id=${id}`),
    create: (data) => apiRequest(`${API_BASE_URL}/subjects.php`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`${API_BASE_URL}/subjects.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`${API_BASE_URL}/subjects.php?id=${id}`, {
        method: 'DELETE'
    })
};

// دوال API للموظفين
const staffAPI = {
    getAll: () => apiRequest(`${API_BASE_URL}/staff.php`),
    getById: (id) => apiRequest(`${API_BASE_URL}/staff.php?id=${id}`),
    create: (data) => apiRequest(`${API_BASE_URL}/staff.php`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    update: (id, data) => apiRequest(`${API_BASE_URL}/staff.php?id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    delete: (id) => apiRequest(`${API_BASE_URL}/staff.php?id=${id}`, {
        method: 'DELETE'
    })
};

// دالة API للوحة التحكم
const dashboardAPI = {
    getStats: () => apiRequest(`${API_BASE_URL}/dashboard.php`)
};

// دالة API للأنشطة الأخيرة
const activitiesAPI = {
    getRecent: () => apiRequest(`${API_BASE_URL}/recent_activities.php`)
};

// دوال API للحسابات
const accountsAPI = {
    getFees: () => apiRequest(`${API_BASE_URL}/accounts.php?type=fees`),
    getFeeById: (id) => apiRequest(`${API_BASE_URL}/accounts.php?type=fees&id=${id}`),
    saveFee: (data) => apiRequest(`${API_BASE_URL}/accounts.php?type=fees`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateFee: (id, data) => apiRequest(`${API_BASE_URL}/accounts.php?type=fees&id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    getStudentsAccounts: () => apiRequest(`${API_BASE_URL}/accounts.php?type=students`),
    getStudentAccount: (id) => apiRequest(`${API_BASE_URL}/accounts.php?type=students&id=${id}`),
    getStudentPayments: (id) => apiRequest(`${API_BASE_URL}/accounts.php?type=payments&student_id=${id}`),
    savePayment: (data) => apiRequest(`${API_BASE_URL}/accounts.php?type=payments`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    deletePayment: (id) => apiRequest(`${API_BASE_URL}/accounts.php?type=payments&id=${id}`, {
        method: 'DELETE'
    }),
    getStudentAccounts: () => apiRequest(`${API_BASE_URL}/accounts.php?type=student_accounts`),
    saveStudentAccount: (data) => apiRequest(`${API_BASE_URL}/accounts.php?type=student_accounts`, {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateStudentAccount: (id, data) => apiRequest(`${API_BASE_URL}/accounts.php?type=student_accounts&id=${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
    }),
    deleteStudentAccount: (id) => apiRequest(`${API_BASE_URL}/accounts.php?type=student_accounts&id=${id}`, {
        method: 'DELETE'
    })
};

// دوال API للمصادقة
const authAPI = {
    login: (email, password) => apiRequest(`${API_BASE_URL}/auth.php`, {
        method: 'POST',
        body: JSON.stringify({ email, password })
    }),
    verify: (token) => apiRequest(`${API_BASE_URL}/auth.php`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    }),
    logout: (token) => apiRequest(`${API_BASE_URL}/auth.php`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
};
