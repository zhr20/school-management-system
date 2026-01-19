// نظام تهيئة الصفحات بعد تحميلها ديناميكياً
window.pageInitializers = {
    index: function() {
        console.log('[PageInit] Initializing index page');
        try {
            if (typeof loadDashboard === 'function') {
                loadDashboard();
            } else {
                console.warn('[PageInit] loadDashboard function not found');
            }
        } catch (error) {
            console.error('[PageInit] Error initializing index page:', error);
        }
    },
    
    teachers: function() {
        console.log('[PageInit] Initializing teachers page');
        try {
            if (typeof loadTeachers === 'function') {
                loadTeachers();
            } else {
                console.warn('[PageInit] loadTeachers function not found');
            }
            
            const searchInput = document.getElementById('searchQuery');
            if (searchInput && typeof renderTeachers === 'function') {
                searchInput.addEventListener('input', renderTeachers);
            }
            
            // التأكد من أن الدوال متاحة عالمياً
            if (typeof editTeacher !== 'undefined') window.editTeacher = editTeacher;
            if (typeof deleteTeacher !== 'undefined') window.deleteTeacher = deleteTeacher;
            if (typeof openAddModal !== 'undefined') window.openAddModal = openAddModal;
            if (typeof closeModal !== 'undefined') window.closeModal = closeModal;
            if (typeof saveTeacher !== 'undefined') window.saveTeacher = saveTeacher;
        } catch (error) {
            console.error('[PageInit] Error initializing teachers page:', error);
        }
    },
    
    students: function() {
        console.log('[PageInit] Initializing students page');
        try {
            if (typeof loadStudents === 'function') {
                loadStudents();
            } else {
                console.warn('[PageInit] loadStudents function not found');
            }
            
            const searchInput = document.getElementById('searchQuery');
            if (searchInput && typeof renderStudents === 'function') {
                searchInput.addEventListener('input', renderStudents);
            }
            
            // التأكد من أن الدوال متاحة عالمياً
            if (typeof editStudent !== 'undefined') window.editStudent = editStudent;
            if (typeof deleteStudent !== 'undefined') window.deleteStudent = deleteStudent;
            if (typeof openAddModal !== 'undefined') window.openAddModal = openAddModal;
            if (typeof closeModal !== 'undefined') window.closeModal = closeModal;
            if (typeof saveStudent !== 'undefined') window.saveStudent = saveStudent;
        } catch (error) {
            console.error('[PageInit] Error initializing students page:', error);
        }
    },
    
    staff: function() {
        console.log('[PageInit] Initializing staff page');
        try {
            if (typeof loadStaff === 'function') {
                loadStaff();
            } else {
                console.warn('[PageInit] loadStaff function not found');
            }
            
            const searchInput = document.getElementById('searchQuery');
            if (searchInput && typeof renderStaff === 'function') {
                searchInput.addEventListener('input', renderStaff);
            }
            
            // التأكد من أن الدوال متاحة عالمياً
            if (typeof editStaff !== 'undefined') window.editStaff = editStaff;
            if (typeof deleteStaff !== 'undefined') window.deleteStaff = deleteStaff;
            if (typeof openAddModal !== 'undefined') window.openAddModal = openAddModal;
            if (typeof closeModal !== 'undefined') window.closeModal = closeModal;
            if (typeof saveStaff !== 'undefined') window.saveStaff = saveStaff;
        } catch (error) {
            console.error('[PageInit] Error initializing staff page:', error);
        }
    },
    
    subjects: function() {
        console.log('[PageInit] Initializing subjects page');
        try {
            if (typeof loadSubjects === 'function') {
                loadSubjects();
            } else {
                console.warn('[PageInit] loadSubjects function not found');
            }
            
            if (typeof loadTeachers === 'function') {
                loadTeachers();
            }
            
            const searchInput = document.getElementById('searchQuery');
            if (searchInput && typeof renderSubjects === 'function') {
                searchInput.addEventListener('input', renderSubjects);
            }
            
            // التأكد من أن الدوال متاحة عالمياً
            if (typeof editSubject !== 'undefined') window.editSubject = editSubject;
            if (typeof deleteSubject !== 'undefined') window.deleteSubject = deleteSubject;
            if (typeof openAddModal !== 'undefined') window.openAddModal = openAddModal;
            if (typeof closeModal !== 'undefined') window.closeModal = closeModal;
            if (typeof saveSubject !== 'undefined') window.saveSubject = saveSubject;
        } catch (error) {
            console.error('[PageInit] Error initializing subjects page:', error);
        }
    },
    
    accounts: function() {
        console.log('[PageInit] Initializing accounts page');
        try {
            if (typeof loadFees === 'function') {
                loadFees();
            } else {
                console.warn('[PageInit] loadFees function not found');
            }
            
            if (typeof loadStudents === 'function') {
                loadStudents();
            }
            
            if (typeof loadStudentsAccounts === 'function') {
                loadStudentsAccounts();
            }
            
            if (typeof loadStudentAccounts === 'function') {
                loadStudentAccounts();
            }
            
            const searchInput = document.getElementById('searchStudent');
            if (searchInput && typeof renderStudentsAccounts === 'function') {
                searchInput.addEventListener('input', renderStudentsAccounts);
            }
            
            // التأكد من أن الدوال متاحة عالمياً
            if (typeof openAddFeeModal !== 'undefined') window.openAddFeeModal = openAddFeeModal;
            if (typeof openAddStudentAccountModal !== 'undefined') window.openAddStudentAccountModal = openAddStudentAccountModal;
            if (typeof addPayment !== 'undefined') window.addPayment = addPayment;
            if (typeof viewReport !== 'undefined') window.viewReport = viewReport;
        } catch (error) {
            console.error('[PageInit] Error initializing accounts page:', error);
        }
    }
};

// دالة عامة لتهيئة الصفحة
window.initPage = function(page) {
    console.log(`[PageInit] Initializing page: ${page}`);
    
    if (window.pageInitializers && window.pageInitializers[page]) {
        try {
            window.pageInitializers[page]();
        } catch (error) {
            console.error(`[PageInit] Error in page initializer for ${page}:`, error);
        }
    } else {
        console.warn(`[PageInit] No initializer found for page: ${page}`);
    }
};
