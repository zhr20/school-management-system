let fees = [];
let studentsAccounts = [];
let studentAccounts = [];
let students = [];
let currentEditFeeId = null;
let currentPaymentStudentId = null;
let currentPaymentAccountId = null; // للسجلات المخصصة

// تحميل الأقساط
async function loadFees() {
    try {
        const response = await accountsAPI.getFees();
        if (response.success) {
            fees = response.data || [];
            renderFees();
        } else {
            console.error('Error response:', response);
            const errorMsg = response.message || 'حدث خطأ أثناء تحميل الأقساط';
            alert(errorMsg);
            if (errorMsg.includes('غير موجود')) {
                alert('يرجى تشغيل ملف accounts_tables.sql في قاعدة البيانات أولاً');
            }
        }
    } catch (error) {
        console.error('Error loading fees:', error);
        const errorMsg = error.message || 'حدث خطأ أثناء تحميل الأقساط';
        alert(errorMsg);
        if (errorMsg.includes('Table') || errorMsg.includes('جدول')) {
            alert('يرجى تشغيل ملف accounts_tables.sql في قاعدة البيانات أولاً');
        }
    }
}

// تحميل حسابات الطلاب (من جدول students)
async function loadStudentsAccounts() {
    try {
        const response = await accountsAPI.getStudentsAccounts();
        if (response.success) {
            studentsAccounts = response.data || [];
        }
    } catch (error) {
        console.error('Error loading students accounts:', error);
    }
}

// تحميل سجلات حسابات الطلاب (من جدول student_accounts)
async function loadStudentAccounts() {
    try {
        const response = await accountsAPI.getStudentAccounts();
        if (response.success) {
            studentAccounts = response.data || [];
            renderStudentsAccounts();
        }
    } catch (error) {
        console.error('Error loading student accounts:', error);
        alert('حدث خطأ أثناء تحميل سجلات حسابات الطلاب');
    }
}

// عرض الأقساط
function renderFees() {
    const tbody = document.getElementById('feesTableBody');
    if (!tbody) return;
    
    if (fees.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد أقساط</td></tr>';
        return;
    }
    
    tbody.innerHTML = fees.map(fee => {
        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${fee.class_name || 'غير محدد'}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatCurrency(fee.fee_amount || 0)}</td>
            <td class="px-4 py-3 text-sm text-gray-500">${fee.description || '-'}</td>
            <td class="px-4 py-3 text-sm font-medium">
                <button onclick="editFee(${fee.id})" class="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 whitespace-nowrap flex items-center justify-center" type="button" title="تعديل القسط">
                    <i class="fas fa-edit ml-1"></i> تعديل
                </button>
            </td>
        </tr>
    `;
    }).join('');
}

// عرض حسابات الطلاب (من جدول student_accounts)
function renderStudentsAccounts() {
    const searchQuery = document.getElementById('searchStudent')?.value.toLowerCase() || '';
    
    // دمج البيانات من كلا الجدولين
    const allAccounts = [];
    
    // إضافة سجلات من student_accounts
    if (studentAccounts && studentAccounts.length > 0) {
        studentAccounts.forEach(account => {
            allAccounts.push({
                id: account.id,
                name: account.student_name || 'غير محدد',
                class: account.class || 'غير محدد',
                fee_amount: parseFloat(account.fee_amount || 0),
                total_paid: parseFloat(account.paid_amount || 0),
                remaining: parseFloat(account.remaining_amount || 0),
                student_id: account.student_id,
                notes: account.notes || '',
                is_custom: true // علامة للتمييز بين السجلات المخصصة والطلاب
            });
        });
    }
    
    // إضافة حسابات من students (للطلاب المسجلين)
    if (studentsAccounts && studentsAccounts.length > 0) {
        studentsAccounts.forEach(account => {
            // تجنب التكرار إذا كان الطالب موجود في student_accounts
            const exists = allAccounts.find(a => a.student_id === account.id);
            if (!exists) {
                const totalPaid = parseFloat(account.total_paid || 0);
                const feeAmount = parseFloat(account.fee_amount || 0);
                const remaining = feeAmount - totalPaid;
                allAccounts.push({
                    id: account.id,
                    name: account.name || 'غير محدد',
                    class: account.class || 'غير محدد',
                    fee_amount: feeAmount,
                    total_paid: totalPaid,
                    remaining: remaining,
                    student_id: account.id,
                    is_custom: false
                });
            }
        });
    }
    
    // تصفية حسب البحث
    const filtered = searchQuery 
        ? allAccounts.filter(s => 
            s.name.toLowerCase().includes(searchQuery) ||
            s.class.toLowerCase().includes(searchQuery)
          )
        : allAccounts;
    
    const tbody = document.getElementById('studentsAccountsTableBody');
    if (!tbody) return;
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد حسابات</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(account => {
        const feeAmount = account.fee_amount || 0;
        const totalPaid = account.total_paid || 0;
        const remaining = account.remaining || (feeAmount - totalPaid);
        const paidPercent = feeAmount > 0 ? ((totalPaid / feeAmount) * 100).toFixed(1) : 0;
        const accountId = account.is_custom ? account.id : account.student_id;
        
        return `
        <tr class="hover:bg-gray-50 transition-colors">
            <td class="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">${account.name || 'غير محدد'}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${account.class || 'غير محدد'}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm text-gray-500">${formatCurrency(feeAmount)}</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm ${totalPaid > 0 ? 'text-green-600 font-semibold' : 'text-gray-500'}">${formatCurrency(totalPaid)} (${paidPercent}%)</td>
            <td class="px-4 py-3 whitespace-nowrap text-sm ${remaining > 0 ? 'text-red-600 font-semibold' : 'text-green-600 font-semibold'}">${formatCurrency(remaining)}</td>
            <td class="px-4 py-3 text-sm font-medium sticky right-0 bg-white z-10">
                <div class="flex items-center justify-end gap-2 flex-nowrap">
                    ${account.student_id ? `
                    <button onclick="addPayment(${account.student_id}, '${escapeHtml(account.name)}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-all duration-200 text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 whitespace-nowrap flex items-center justify-center gap-1.5" type="button" title="إضافة دفعة">
                        <i class="fas fa-plus"></i>
                        <span>دفعة</span>
                    </button>
                    ` : account.is_custom ? `
                    <button onclick="addPaymentByAccount(${account.id}, '${escapeHtml(account.name)}')" class="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 active:bg-green-800 transition-all duration-200 text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 whitespace-nowrap flex items-center justify-center gap-1.5" type="button" title="إضافة دفعة">
                        <i class="fas fa-plus"></i>
                        <span>دفعة</span>
                    </button>
                    ` : ''}
                    ${account.is_custom ? `
                    <button onclick="editStudentAccount(${account.id})" class="btn-edit" type="button" title="تعديل القسط">
                        <i class="fas fa-edit text-xs"></i>
                    </button>
                    <button onclick="deleteStudentAccount(${account.id})" class="btn-delete" type="button" title="حذف القسط">
                        <i class="fas fa-trash text-xs"></i>
                    </button>
                    ` : ''}
                    ${account.student_id ? `
                    <button onclick="viewReport(${account.student_id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap flex items-center justify-center gap-1.5" type="button" title="عرض التقرير">
                        <i class="fas fa-file-alt"></i>
                        <span>تقرير</span>
                    </button>
                    ` : account.is_custom ? `
                    <button onclick="viewReportByAccount(${account.id})" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 transition-all duration-200 text-sm font-semibold cursor-pointer shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 whitespace-nowrap flex items-center justify-center gap-1.5" type="button" title="عرض التقرير">
                        <i class="fas fa-file-alt"></i>
                        <span>تقرير</span>
                    </button>
                    ` : ''}
                </div>
            </td>
        </tr>
    `;
    }).join('');
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

// فتح نافذة إضافة قسط
function openAddFeeModal() {
    try {
        console.log('openAddFeeModal called');
        currentEditFeeId = null;
        const modalTitle = document.getElementById('feeModalTitle');
        const form = document.getElementById('feeForm');
        const modal = document.getElementById('feeModal');
        
        console.log('Elements found:', { modalTitle: !!modalTitle, form: !!form, modal: !!modal });
        
        if (!modal) {
            alert('خطأ: لم يتم العثور على نافذة الإضافة');
            console.error('Modal element not found');
            return;
        }
        
        if (modalTitle) modalTitle.textContent = 'إضافة قسط جديد';
        if (form) form.reset();
        modal.classList.remove('hidden');
        console.log('Modal opened successfully');
    } catch (error) {
        console.error('Error in openAddFeeModal:', error);
        alert('حدث خطأ أثناء فتح النافذة: ' + error.message);
    }
}

// تعديل قسط
function editFee(id) {
    try {
        console.log('editFee called with id:', id);
        const fee = fees.find(f => f.id == id || f.id == parseInt(id));
        if (!fee) {
            console.error('Fee not found:', id);
            alert('القسط غير موجود');
            return;
        }
        
        console.log('Found fee:', fee);
        currentEditFeeId = id;
        
        const modalTitle = document.getElementById('feeModalTitle');
        const classField = document.getElementById('feeClass');
        const amountField = document.getElementById('feeAmount');
        const descriptionField = document.getElementById('feeDescription');
        const modal = document.getElementById('feeModal');
        
        if (modalTitle) modalTitle.textContent = 'تعديل قسط';
        if (classField) classField.value = fee.class_name || '';
        if (amountField) amountField.value = fee.fee_amount || '';
        if (descriptionField) descriptionField.value = fee.description || '';
        
        if (modal) {
            modal.classList.remove('hidden');
            console.log('Edit modal opened');
        } else {
            alert('خطأ: لم يتم العثور على نافذة التعديل');
        }
    } catch (error) {
        console.error('Error in editFee:', error);
        alert('حدث خطأ أثناء فتح نافذة التعديل: ' + error.message);
    }
}

// حفظ قسط
async function saveFee(event) {
    event.preventDefault();
    
    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'جاري الحفظ...';
        }
        
        const formData = {
            class_name: document.getElementById('feeClass').value,
            fee_amount: parseFloat(document.getElementById('feeAmount').value),
            description: document.getElementById('feeDescription').value || ''
        };
        
        if (!formData.class_name || !formData.fee_amount) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'حفظ';
            }
            return;
        }
        
        let response;
        if (currentEditFeeId) {
            response = await accountsAPI.updateFee(currentEditFeeId, formData);
        } else {
            response = await accountsAPI.saveFee(formData);
        }
        
        if (response && response.success) {
            closeFeeModal();
            await loadFees();
            await loadStudentsAccounts(); // تحديث حسابات الطلاب
            alert(response.message || 'تم الحفظ بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحفظ');
        }
    } catch (error) {
        console.error('Error saving fee:', error);
        alert('حدث خطأ أثناء الحفظ: ' + (error.message || 'خطأ غير معروف'));
    } finally {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'حفظ';
        }
    }
}

// إغلاق نافذة القسط
function closeFeeModal() {
    document.getElementById('feeModal').classList.add('hidden');
    currentEditFeeId = null;
    document.getElementById('feeForm').reset();
}

// إضافة دفعة (للطلاب المسجلين)
function addPayment(studentId, studentName) {
    currentPaymentStudentId = studentId;
    currentPaymentAccountId = null; // إعادة تعيين
    document.getElementById('paymentModalTitle').textContent = `إضافة دفعة - ${studentName}`;
    document.getElementById('paymentStudentName').value = studentName;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentStudentName').value = studentName;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentModal').classList.remove('hidden');
}

// إضافة دفعة (للسجلات المخصصة)
function addPaymentByAccount(accountId, studentName) {
    currentPaymentAccountId = accountId;
    currentPaymentStudentId = null; // إعادة تعيين
    document.getElementById('paymentModalTitle').textContent = `إضافة دفعة - ${studentName}`;
    document.getElementById('paymentStudentName').value = studentName;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentForm').reset();
    document.getElementById('paymentStudentName').value = studentName;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('paymentModal').classList.remove('hidden');
}

// حفظ دفعة
async function savePayment(event) {
    event.preventDefault();
    
    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'جاري الحفظ...';
        }
        
        const amount = parseFloat(document.getElementById('paymentAmount').value);
        const paymentDate = document.getElementById('paymentDate').value;
        
        if (!amount || !paymentDate) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'حفظ';
            }
            return;
        }
        
        let response;
        
        // إذا كان سجل مخصص (بدون student_id)
        if (currentPaymentAccountId) {
            const account = studentAccounts.find(a => a.id == currentPaymentAccountId);
            if (!account) {
                alert('السجل غير موجود');
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'حفظ';
                }
                return;
            }
            
            // تحديث المبلغ المدفوع والمتبقي في السجل
            const newPaidAmount = parseFloat(account.paid_amount || 0) + amount;
            const newRemainingAmount = Math.max(0, parseFloat(account.fee_amount || 0) - newPaidAmount);
            
            const paymentMethod = document.getElementById('paymentMethod').value || 'نقد';
            const paymentNotes = document.getElementById('paymentNotes').value || '';
            const paymentNote = `دفعة: ${amount} د.ع. بتاريخ ${paymentDate} - ${paymentMethod}${paymentNotes ? ' - ' + paymentNotes : ''}`;
            
            const updateData = {
                student_name: account.student_name || '',
                student_id: account.student_id || null,
                class: account.class || account.class_name || '',
                fee_id: account.fee_id || null,
                fee_amount: parseFloat(account.fee_amount || 0),
                paid_amount: newPaidAmount,
                remaining_amount: newRemainingAmount,
                notes: (account.notes || '') + (account.notes ? '\n' : '') + paymentNote
            };
            
            response = await accountsAPI.updateStudentAccount(currentPaymentAccountId, updateData);
        } else if (currentPaymentStudentId) {
            // للطلاب المسجلين - حفظ في جدول payments
            const formData = {
                student_id: currentPaymentStudentId,
                amount: amount,
                payment_date: paymentDate,
                payment_method: document.getElementById('paymentMethod').value || 'نقد',
                notes: document.getElementById('paymentNotes').value || ''
            };
            
            response = await accountsAPI.savePayment(formData);
        } else {
            alert('خطأ: لم يتم تحديد الطالب أو السجل');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'حفظ';
            }
            return;
        }
        
        if (response && response.success) {
            closePaymentModal();
            await loadStudentAccounts(); // تحديث السجلات المخصصة
            await loadStudentsAccounts(); // تحديث حسابات الطلاب
            alert(response.message || 'تم الحفظ بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحفظ');
        }
    } catch (error) {
        console.error('Error saving payment:', error);
        alert('حدث خطأ أثناء الحفظ: ' + (error.message || 'خطأ غير معروف'));
    } finally {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'حفظ';
        }
    }
}

// إغلاق نافذة الدفعة
function closePaymentModal() {
    document.getElementById('paymentModal').classList.add('hidden');
    currentPaymentStudentId = null;
    currentPaymentAccountId = null;
    document.getElementById('paymentForm').reset();
}

// عرض التقرير
async function viewReport(studentId) {
    try {
        const [accountResponse, paymentsResponse] = await Promise.all([
            accountsAPI.getStudentAccount(studentId),
            accountsAPI.getStudentPayments(studentId)
        ]);
        
        if (!accountResponse.success || !paymentsResponse.success) {
            alert('حدث خطأ أثناء تحميل بيانات التقرير');
            return;
        }
        
        const account = accountResponse.data;
        const payments = paymentsResponse.data || [];
        const totalPaid = parseFloat(account.total_paid || 0);
        const feeAmount = parseFloat(account.fee_amount || 0);
        const remaining = feeAmount - totalPaid;
        
        const reportContent = `
            <div class="print-section">
                <div class="text-center mb-6">
                    <h1 class="text-3xl font-bold text-gray-900 mb-2">تقرير حساب الطالب</h1>
                    <p class="text-gray-600">${new Date().toLocaleDateString('ar-SA')}</p>
                </div>
                
                <div class="mb-6 space-y-2">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">معلومات الطالب</h2>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">اسم الطالب:</p>
                            <p class="text-lg font-semibold text-gray-900">${account.name || 'غير محدد'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">الصف:</p>
                            <p class="text-lg font-semibold text-gray-900">${account.class || 'غير محدد'}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">رقم الطالب:</p>
                            <p class="text-lg font-semibold text-gray-900">${account.student_number || 'غير محدد'}</p>
                        </div>
                    </div>
                </div>
                
                <div class="mb-6 space-y-2">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">ملخص الحساب</h2>
                    <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-600">مبلغ القسط:</span>
                            <span class="font-semibold text-gray-900">${formatCurrency(feeAmount)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">المبلغ المدفوع:</span>
                            <span class="font-semibold text-green-600">${formatCurrency(totalPaid)}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">المبلغ المتبقي:</span>
                            <span class="font-semibold ${remaining > 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(remaining)}</span>
                        </div>
                        <div class="flex justify-between pt-2 border-t">
                            <span class="text-gray-600">نسبة الدفع:</span>
                            <span class="font-semibold text-gray-900">${feeAmount > 0 ? ((totalPaid / feeAmount) * 100).toFixed(1) : 0}%</span>
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">سجل المدفوعات</h2>
                    ${payments.length > 0 ? `
                        <table class="min-w-full divide-y divide-gray-200">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">المبلغ</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">طريقة الدفع</th>
                                    <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">ملاحظات</th>
                                </tr>
                            </thead>
                            <tbody class="bg-white divide-y divide-gray-200">
                                ${payments.map(payment => `
                                    <tr>
                                        <td class="px-4 py-3 text-sm text-gray-900">${new Date(payment.payment_date).toLocaleDateString('ar-SA')}</td>
                                        <td class="px-4 py-3 text-sm font-semibold text-green-600">${formatCurrency(payment.amount)}</td>
                                        <td class="px-4 py-3 text-sm text-gray-500">${payment.payment_method || 'نقد'}</td>
                                        <td class="px-4 py-3 text-sm text-gray-500">${payment.notes || '-'}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    ` : '<p class="text-gray-500 text-center py-4">لا توجد مدفوعات مسجلة</p>'}
                </div>
            </div>
        `;
        
        document.getElementById('reportContent').innerHTML = reportContent;
        const reportModal = document.getElementById('reportModal');
        if (reportModal) {
            reportModal.classList.remove('hidden');
            // التأكد من أن زر الطباعة مرئي
            setTimeout(() => {
                const printBtn = reportModal.querySelector('button[onclick*="printReport"]');
                if (printBtn) {
                    printBtn.style.display = 'inline-flex';
                    printBtn.style.visibility = 'visible';
                    printBtn.style.opacity = '1';
                    console.log('Print button found and made visible');
                } else {
                    console.error('Print button not found in modal');
                }
            }, 100);
        }
    } catch (error) {
        console.error('Error loading report:', error);
        alert('حدث خطأ أثناء تحميل التقرير: ' + (error.message || 'خطأ غير معروف'));
    }
}

// طباعة التقرير
function printReport() {
    try {
        console.log('printReport called');
        window.print();
    } catch (error) {
        console.error('Error printing report:', error);
        alert('حدث خطأ أثناء محاولة الطباعة: ' + error.message);
    }
}

// إغلاق نافذة التقرير
function closeReportModal() {
    document.getElementById('reportModal').classList.add('hidden');
}

// تحميل الطلاب
async function loadStudents() {
    try {
        const response = await studentsAPI.getAll();
        if (response.success) {
            students = response.data || [];
            renderStudentOptions();
        }
    } catch (error) {
        console.error('Error loading students:', error);
    }
}

// عرض خيارات الطلاب حسب الصف
function renderStudentOptions(selectedClass = null) {
    const datalist = document.getElementById('studentAccountNameList');
    if (!datalist) return;
    
    let filteredStudents = students;
    if (selectedClass) {
        filteredStudents = students.filter(s => s.class === selectedClass);
    }
    
    datalist.innerHTML = filteredStudents.map(student => 
        `<option value="${student.name}" data-id="${student.id}" data-class="${student.class}">${student.name} - ${student.class}</option>`
    ).join('');
}

// العثور على معرف الطالب من الاسم
function findStudentIdByName(name, classFilter = null) {
    if (!name) return null;
    
    let filteredStudents = students;
    if (classFilter) {
        filteredStudents = students.filter(s => s.class === classFilter);
    }
    
    const student = filteredStudents.find(s => s.name === name || s.name.trim() === name.trim());
    return student ? student.id : null;
}

// تحديث قائمة الأقساط عند تغيير الصف
function updateFeesByClass() {
    const classSelect = document.getElementById('studentAccountClass');
    const feeSelect = document.getElementById('studentAccountFee');
    
    if (!classSelect || !feeSelect) return;
    
    const selectedClass = classSelect.value;
    
    // تحديث قائمة الطلاب حسب الصف المختار
    renderStudentOptions(selectedClass);
    
    // تحديث قائمة الأقساط
    const filteredFees = fees.filter(f => f.class_name === selectedClass);
    
    feeSelect.innerHTML = '<option value="">اختر القسط</option>';
    filteredFees.forEach(fee => {
        feeSelect.innerHTML += `<option value="${fee.id}" data-amount="${fee.fee_amount}">${fee.class_name} - ${formatCurrency(fee.fee_amount)}</option>`;
    });
    
    // مسح حقل اسم الطالب عند تغيير الصف
    const nameInput = document.getElementById('studentAccountName');
    if (nameInput) {
        nameInput.value = '';
    }
}

// تحديث المتبقي عند تغيير المدفوع
function updateRemainingAmount() {
    const paidInput = document.getElementById('studentAccountPaid');
    const feeSelect = document.getElementById('studentAccountFee');
    const remainingInput = document.getElementById('studentAccountRemaining');
    
    if (!paidInput || !feeSelect || !remainingInput) return;
    
    paidInput.addEventListener('input', function() {
        const selectedOption = feeSelect.options[feeSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.amount) {
            const feeAmount = parseFloat(selectedOption.dataset.amount);
            const paid = parseFloat(this.value) || 0;
            remainingInput.value = Math.max(0, (feeAmount - paid)).toFixed(2);
        }
    });
}

// فتح نافذة إضافة قسط طالب
function openAddStudentAccountModal() {
    try {
        console.log('openAddStudentAccountModal called');
        const modal = document.getElementById('studentAccountModal');
        const form = document.getElementById('studentAccountForm');
        const modalTitle = document.getElementById('studentAccountModalTitle');
        
        if (!modal) {
            alert('خطأ: لم يتم العثور على نافذة الإضافة');
            return;
        }
        
        if (modalTitle) modalTitle.textContent = 'إضافة قسط طالب';
        if (form) form.reset();
        
        // تحميل الطلاب والأقساط إذا لم تكن محملة
        if (students.length === 0) {
            loadStudents();
        } else {
            renderStudentOptions();
        }
        
        if (fees.length === 0) {
            loadFees();
        }
        
        modal.classList.remove('hidden');
        
        // إضافة event listeners
        const classSelect = document.getElementById('studentAccountClass');
        if (classSelect) {
            // إزالة event listeners السابقة لتجنب التكرار
            classSelect.removeEventListener('change', updateFeesByClass);
            classSelect.addEventListener('change', updateFeesByClass);
        }
        updateRemainingAmount();
        
        // تحديث قائمة الطلاب عند تغيير الصف
        if (classSelect) {
            classSelect.addEventListener('change', function() {
                renderStudentOptions(this.value);
            });
        }
        
        console.log('Student account modal opened');
    } catch (error) {
        console.error('Error in openAddStudentAccountModal:', error);
        alert('حدث خطأ أثناء فتح النافذة: ' + error.message);
    }
}

// حفظ قسط طالب
async function saveStudentAccount(event) {
    event.preventDefault();
    
    try {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'جاري الحفظ...';
        }
        
        const studentNameInput = document.getElementById('studentAccountName');
        const classSelect = document.getElementById('studentAccountClass');
        const selectedClass = classSelect.value;
        const studentName = studentNameInput.value.trim();
        
        if (!studentName) {
            alert('يرجى إدخال اسم الطالب');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'حفظ';
            }
            return;
        }
        
        // البحث عن معرف الطالب من الاسم والصف
        const studentId = findStudentIdByName(studentName, selectedClass);
        
        // التحقق من أن الطالب موجود في الصف المختار
        if (studentId) {
            const student = students.find(s => s.id === studentId);
            if (student && student.class !== selectedClass) {
                alert(`الطالب ${studentName} موجود في ${student.class} وليس في ${selectedClass}`);
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'حفظ';
                }
                return;
            }
        }
        
        const feeSelect = document.getElementById('studentAccountFee');
        const feeOption = feeSelect.options[feeSelect.selectedIndex];
        const feeId = parseInt(feeSelect.value);
        const feeAmount = parseFloat(feeOption.dataset.amount);
        
        const formData = {
            student_name: studentName,
            student_id: studentId,
            class: selectedClass,
            fee_id: feeId,
            fee_amount: feeAmount,
            paid_amount: parseFloat(document.getElementById('studentAccountPaid').value),
            remaining_amount: parseFloat(document.getElementById('studentAccountRemaining').value),
            notes: document.getElementById('studentAccountNotes').value || ''
        };
        
        if (!formData.class || !formData.student_name || !formData.fee_id || formData.paid_amount === undefined || formData.remaining_amount === undefined) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'حفظ';
            }
            return;
        }
        
        let response;
        if (currentEditStudentAccountId) {
            response = await accountsAPI.updateStudentAccount(currentEditStudentAccountId, formData);
        } else {
            response = await accountsAPI.saveStudentAccount(formData);
        }
        
        if (response && response.success) {
            closeStudentAccountModal();
            await loadStudentAccounts(); // تحميل السجلات الجديدة
            await loadStudentsAccounts(); // تحديث حسابات الطلاب
            alert(response.message || (currentEditStudentAccountId ? 'تم التعديل بنجاح' : 'تم الحفظ بنجاح'));
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحفظ');
        }
    } catch (error) {
        console.error('Error saving student account:', error);
        alert('حدث خطأ أثناء الحفظ: ' + (error.message || 'خطأ غير معروف'));
    } finally {
        const submitButton = event.target.querySelector('button[type="submit"]');
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = 'حفظ';
        }
    }
}

// إغلاق نافذة قسط الطالب
function closeStudentAccountModal() {
    const modal = document.getElementById('studentAccountModal');
    if (modal) {
        modal.classList.add('hidden');
    }
    const form = document.getElementById('studentAccountForm');
    if (form) {
        form.reset();
    }
    currentEditStudentAccountId = null;
}

// دالة لتجنب مشاكل XSS
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// متغير لتخزين معرف السجل الحالي للتعديل
let currentEditStudentAccountId = null;

// تعديل قسط طالب
async function editStudentAccount(id) {
    try {
        console.log('editStudentAccount called with id:', id);
        const account = studentAccounts.find(a => a.id == id || a.id == parseInt(id));
        if (!account) {
            console.error('Account not found:', id);
            alert('السجل غير موجود');
            return;
        }
        
        console.log('Found account:', account);
        currentEditStudentAccountId = id;
        
        const modal = document.getElementById('studentAccountModal');
        const form = document.getElementById('studentAccountForm');
        const modalTitle = document.getElementById('studentAccountModalTitle');
        
        if (!modal) {
            alert('خطأ: لم يتم العثور على نافذة التعديل');
            return;
        }
        
        if (modalTitle) modalTitle.textContent = 'تعديل قسط طالب';
        
        // ملء الحقول
        const classSelect = document.getElementById('studentAccountClass');
        const nameInput = document.getElementById('studentAccountName');
        const feeSelect = document.getElementById('studentAccountFee');
        const paidInput = document.getElementById('studentAccountPaid');
        const remainingInput = document.getElementById('studentAccountRemaining');
        const notesInput = document.getElementById('studentAccountNotes');
        
        if (classSelect) classSelect.value = account.class || account.class_name || '';
        if (nameInput) nameInput.value = account.student_name || '';
        if (paidInput) paidInput.value = account.paid_amount || 0;
        if (remainingInput) remainingInput.value = account.remaining_amount || 0;
        if (notesInput) notesInput.value = account.notes || '';
        
        // تحديث قائمة الطلاب والأقساط
        if (classSelect) {
            renderStudentOptions(classSelect.value);
            updateFeesByClass();
            // تحديد القسط المختار
            setTimeout(() => {
                if (feeSelect && account.fee_id) {
                    feeSelect.value = account.fee_id;
                }
            }, 100);
        }
        
        modal.classList.remove('hidden');
        console.log('Edit modal opened');
    } catch (error) {
        console.error('Error in editStudentAccount:', error);
        alert('حدث خطأ أثناء فتح نافذة التعديل: ' + error.message);
    }
}

// حذف قسط طالب
async function deleteStudentAccount(id) {
    try {
        if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            return;
        }
        
        console.log('deleteStudentAccount called with id:', id);
        const response = await accountsAPI.deleteStudentAccount(id);
        
        if (response && response.success) {
            await loadStudentAccounts();
            await loadStudentsAccounts();
            alert(response.message || 'تم الحذف بنجاح');
        } else {
            alert(response?.message || 'حدث خطأ أثناء الحذف');
        }
    } catch (error) {
        console.error('Error deleting student account:', error);
        alert('حدث خطأ أثناء الحذف: ' + (error.message || 'خطأ غير معروف'));
    }
}

// عرض تقرير حسب معرف السجل المخصص
async function viewReportByAccount(accountId) {
    try {
        const account = studentAccounts.find(a => a.id == accountId);
        if (!account) {
            alert('السجل غير موجود');
            return;
        }
        
        // إذا كان لديه student_id، استخدم viewReport العادي
        if (account.student_id) {
            viewReport(account.student_id);
            return;
        }
        
        // إنشاء تقرير مخصص للسجلات بدون student_id
        const reportContent = `
            <div class="mb-6">
                <h1 class="text-2xl font-bold text-gray-900 mb-4">تقرير حساب الطالب</h1>
                <div class="bg-gray-50 p-4 rounded-lg mb-4">
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600">اسم الطالب:</p>
                            <p class="text-lg font-semibold text-gray-900">${escapeHtml(account.student_name || 'غير محدد')}</p>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600">الصف:</p>
                            <p class="text-lg font-semibold text-gray-900">${escapeHtml(account.class_name || account.class || 'غير محدد')}</p>
                        </div>
                    </div>
                </div>
                
                <div class="mb-6 space-y-2">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">ملخص الحساب</h2>
                    <div class="bg-gray-50 p-4 rounded-lg space-y-2">
                        <div class="flex justify-between">
                            <span class="text-gray-600">مبلغ القسط:</span>
                            <span class="font-semibold text-gray-900">${formatCurrency(parseFloat(account.fee_amount || 0))}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">المبلغ المدفوع:</span>
                            <span class="font-semibold text-green-600">${formatCurrency(parseFloat(account.paid_amount || 0))}</span>
                        </div>
                        <div class="flex justify-between">
                            <span class="text-gray-600">المبلغ المتبقي:</span>
                            <span class="font-semibold ${parseFloat(account.remaining_amount || 0) > 0 ? 'text-red-600' : 'text-green-600'}">${formatCurrency(parseFloat(account.remaining_amount || 0))}</span>
                        </div>
                    </div>
                </div>
                
                ${account.notes ? `
                <div class="mb-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-2">ملاحظات</h2>
                    <p class="text-gray-600">${escapeHtml(account.notes)}</p>
                </div>
                ` : ''}
            </div>
        `;
        
        document.getElementById('reportContent').innerHTML = reportContent;
        const reportModal = document.getElementById('reportModal');
        if (reportModal) {
            reportModal.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error viewing report by account:', error);
        alert('حدث خطأ أثناء عرض التقرير: ' + error.message);
    }
}

// التأكد من أن الدوال متاحة عالمياً (قبل DOMContentLoaded)
window.editFee = editFee;
window.openAddFeeModal = openAddFeeModal;
window.closeFeeModal = closeFeeModal;
window.saveFee = saveFee;
window.addPayment = addPayment;
window.addPaymentByAccount = addPaymentByAccount;
window.closePaymentModal = closePaymentModal;
window.savePayment = savePayment;
window.viewReport = viewReport;
window.printReport = printReport;
window.closeReportModal = closeReportModal;
window.openAddStudentAccountModal = openAddStudentAccountModal;
window.closeStudentAccountModal = closeStudentAccountModal;
window.saveStudentAccount = saveStudentAccount;
window.editStudentAccount = editStudentAccount;
window.deleteStudentAccount = deleteStudentAccount;
window.viewReportByAccount = viewReportByAccount;

// دالة تهيئة الصفحة
function initAccountsPage() {
    console.log('[Accounts] Initializing accounts page');
    try {
        // استخدام DataManager لجلب البيانات
        if (window.sectionDataLoaders && window.sectionDataLoaders.loadAccounts) {
            window.sectionDataLoaders.loadAccounts();
        } else {
            // Fallback للطريقة القديمة
            loadFees();
            loadStudents();
            loadStudentsAccounts();
            loadStudentAccounts();
        }
        
        const searchInput = document.getElementById('searchStudent');
        if (searchInput) {
            searchInput.addEventListener('input', renderStudentsAccounts);
        }
        
        // إضافة event listener لزر الإضافة
        const addButton = document.querySelector('button[onclick*="openAddFeeModal"]');
        if (addButton) {
            addButton.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                openAddFeeModal();
            });
        }
        
        // إغلاق النوافذ عند النقر خارجها
        const feeModal = document.getElementById('feeModal');
        if (feeModal) {
            feeModal.addEventListener('click', function(e) {
                if (e.target === feeModal) closeFeeModal();
            });
        }
        
        const paymentModal = document.getElementById('paymentModal');
        if (paymentModal) {
            paymentModal.addEventListener('click', function(e) {
                if (e.target === paymentModal) closePaymentModal();
            });
        }
        
        const reportModal = document.getElementById('reportModal');
        if (reportModal) {
            reportModal.addEventListener('click', function(e) {
                if (e.target === reportModal) closeReportModal();
            });
        }
        
        const studentAccountModal = document.getElementById('studentAccountModal');
        if (studentAccountModal) {
            studentAccountModal.addEventListener('click', function(e) {
                if (e.target === studentAccountModal) closeStudentAccountModal();
            });
        }
        
        // إغلاق عند الضغط على Escape
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                if (feeModal && !feeModal.classList.contains('hidden')) closeFeeModal();
                if (paymentModal && !paymentModal.classList.contains('hidden')) closePaymentModal();
                if (reportModal && !reportModal.classList.contains('hidden')) closeReportModal();
                if (studentAccountModal && !studentAccountModal.classList.contains('hidden')) closeStudentAccountModal();
            }
        });
        
        console.log('[Accounts] Accounts page initialized');
    } catch (error) {
        console.error('[Accounts] Error initializing page:', error);
    }
}

// تحميل البيانات عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', initAccountsPage);

// أيضاً استماع لحدث تحميل الصفحة من Router
document.addEventListener('pageLoaded', (e) => {
    if (e.detail.page === 'accounts') {
        console.log('[Accounts] Page loaded event received, initializing');
        setTimeout(() => {
            initAccountsPage();
        }, 100);
    }
});

// فتح نافذة الإضافة تلقائياً إذا كان معامل action=add موجود في URL
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'add') {
        // انتظار تحميل الصفحة بالكامل ثم فتح نافذة إضافة القسط
        setTimeout(() => {
            if (typeof window.openAddFeeModal === 'function') {
                window.openAddFeeModal();
            }
        }, 500);
    }
});

// الاستماع لرسائل من النوافذ الخارجية لتحديث القائمة
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'accountAdded') {
        console.log('[Accounts] Account added from external window, refreshing list...');
        // تحديث قائمة الحسابات
        loadFees();
        loadStudentsAccounts();
    }
});