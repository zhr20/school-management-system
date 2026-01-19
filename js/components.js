/* ============================================
   مكونات JavaScript قابلة لإعادة الاستخدام
   Reusable JavaScript Components
   ============================================ */

// ============================================
// Table Component - مكون الجدول
// ============================================
class TableComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            searchable: options.searchable || false,
            sortable: options.sortable || false,
            pagination: options.pagination || false,
            ...options
        };
    }
    
    render(data, columns) {
        if (!this.container) return;
        
        let html = '<div class="table-responsive"><table class="modern-table">';
        
        // Header
        html += '<thead><tr>';
        columns.forEach(col => {
            html += `<th>${col.label}</th>`;
        });
        html += '</tr></thead>';
        
        // Body
        html += '<tbody>';
        if (data.length === 0) {
            html += `<tr><td colspan="${columns.length}" class="px-6 py-4 text-center text-sm text-gray-500">لا توجد بيانات</td></tr>`;
        } else {
            data.forEach(row => {
                html += '<tr>';
                columns.forEach(col => {
                    const value = col.render ? col.render(row[col.key], row) : row[col.key] || '';
                    html += `<td>${value}</td>`;
                });
                html += '</tr>';
            });
        }
        html += '</tbody></table></div>';
        
        this.container.innerHTML = html;
    }
}

// ============================================
// Button Component - مكون الأزرار
// ============================================
class ButtonComponent {
    static create(type, text, icon = null, onClick = null, options = {}) {
        const button = document.createElement('button');
        const typeClasses = {
            'primary': 'btn-primary',
            'add': 'btn-add',
            'edit': 'btn-edit',
            'delete': 'btn-delete',
            'secondary': 'btn-secondary'
        };
        
        button.className = typeClasses[type] || 'btn-primary';
        button.type = options.type || 'button';
        
        if (icon) {
            button.innerHTML = `<i class="${icon}"></i> ${text}`;
        } else {
            button.textContent = text;
        }
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }
        
        if (options.title) {
            button.title = options.title;
        }
        
        if (options.disabled) {
            button.disabled = true;
            button.classList.add('opacity-50', 'cursor-not-allowed');
        }
        
        return button;
    }
    
    static createIconButton(type, icon, onClick, title = '') {
        return this.create(type, '', icon, onClick, { title });
    }
}

// ============================================
// Search Input Component - مكون البحث
// ============================================
class SearchInputComponent {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        this.options = {
            placeholder: options.placeholder || 'بحث...',
            onSearch: options.onSearch || null,
            debounce: options.debounce || 300
        };
        this.timeout = null;
    }
    
    render() {
        if (!this.container) return;
        
        const html = `
            <div class="search-input-wrapper">
                <i class="fas fa-search search-icon"></i>
                <input
                    type="text"
                    placeholder="${this.options.placeholder}"
                    class="input-field"
                    style="height: 40px;"
                />
            </div>
        `;
        
        this.container.innerHTML = html;
        
        const input = this.container.querySelector('input');
        if (input && this.options.onSearch) {
            input.addEventListener('input', (e) => {
                clearTimeout(this.timeout);
                this.timeout = setTimeout(() => {
                    this.options.onSearch(e.target.value);
                }, this.options.debounce);
            });
        }
        
        return input;
    }
}

// ============================================
// Modal Component - مكون النافذة المنبثقة
// ============================================
class ModalComponent {
    constructor(modalId, options = {}) {
        this.modal = document.getElementById(modalId);
        this.options = {
            closeOnBackdrop: options.closeOnBackdrop !== false,
            closeOnEscape: options.closeOnEscape !== false,
            ...options
        };
        this.init();
    }
    
    init() {
        if (!this.modal) return;
        
        // زر الإغلاق
        const closeBtn = this.modal.querySelector('[data-modal-close]');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        // إغلاق عند النقر على الخلفية
        if (this.options.closeOnBackdrop) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.close();
                }
            });
        }
        
        // إغلاق عند الضغط على Escape
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
                    this.close();
                }
            });
        }
    }
    
    open() {
        if (this.modal) {
            this.modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        }
    }
    
    close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }
    
    toggle() {
        if (this.modal) {
            if (this.modal.classList.contains('hidden')) {
                this.open();
            } else {
                this.close();
            }
        }
    }
}

// ============================================
// Card Component - مكون البطاقة
// ============================================
class CardComponent {
    static create(title, content, options = {}) {
        const card = document.createElement('div');
        card.className = 'card';
        
        let html = '';
        if (title) {
            html += `<h2 class="section-title">${title}</h2>`;
        }
        html += `<div class="card-content">${content}</div>`;
        
        card.innerHTML = html;
        return card;
    }
}

// ============================================
// Sidebar Navigation Helper - مساعد تنقل السايد بار
// ============================================
class SidebarNavigation {
    static updateActiveState(activeRoute) {
        const allLinks = document.querySelectorAll('.sidebar-link');
        allLinks.forEach(link => {
            link.classList.remove('active');
            const route = link.getAttribute('data-route') || 
                         link.getAttribute('href')?.replace('.html', '');
            if (route === activeRoute) {
                link.classList.add('active');
            }
        });
    }
    
    static init() {
        const links = document.querySelectorAll('.sidebar-link');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                // إزالة active من جميع الروابط
                links.forEach(l => l.classList.remove('active'));
                // إضافة active للرابط المحدد
                link.classList.add('active');
            });
        });
    }
}

// ============================================
// Export Components - تصدير المكونات
// ============================================
window.TableComponent = TableComponent;
window.ButtonComponent = ButtonComponent;
window.SearchInputComponent = SearchInputComponent;
window.ModalComponent = ModalComponent;
window.CardComponent = CardComponent;
window.SidebarNavigation = SidebarNavigation;

// تهيئة السايد بار عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    SidebarNavigation.init();
});
