# دليل المكونات القابلة لإعادة الاستخدام
## Reusable Components Guide

هذا الدليل يشرح كيفية استخدام المكونات القابلة لإعادة الاستخدام في التطبيق.

---

## 📐 Layout Components - مكونات التخطيط

### الهيدر (Header)
```html
<nav id="mainHeader" class="app-header" data-persistent="true">
  <!-- محتوى الهيدر -->
</nav>
```

### السايد بار (Sidebar)
```html
<aside id="mainSidebar" class="app-sidebar" data-persistent="true">
  <!-- محتوى السايد بار -->
</aside>
```

### المحتوى الرئيسي (Main Content)
```html
<main id="mainContent" class="app-main-content" data-spa-content="true">
  <!-- محتوى الصفحة -->
</main>
```

---

## 📊 Table Components - مكونات الجداول

### جدول عصري
```html
<div class="table-responsive">
  <table class="modern-table">
    <thead>
      <tr>
        <th>الاسم</th>
        <th>التخصص</th>
        <th>الإجراءات</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>أحمد محمد</td>
        <td>الرياضيات</td>
        <td>
          <div class="actions-group">
            <button class="btn-edit" title="تعديل">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-delete" title="حذف">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

### استخدام JavaScript Component
```javascript
const table = new TableComponent('tableContainer', {
  searchable: true,
  sortable: true
});

table.render(data, [
  { key: 'name', label: 'الاسم' },
  { key: 'specialization', label: 'التخصص' },
  { 
    key: 'actions', 
    label: 'الإجراءات',
    render: (value, row) => {
      return `
        <div class="actions-group">
          <button class="btn-edit" onclick="edit(${row.id})">
            <i class="fas fa-edit"></i>
          </button>
          <button class="btn-delete" onclick="delete(${row.id})">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;
    }
  }
]);
```

---

## 🔘 Button Components - مكونات الأزرار

### أزرار HTML
```html
<!-- زر أساسي (أزرق) -->
<button class="btn-primary">حفظ</button>

<!-- زر إضافة (أخضر) -->
<button class="btn-add">
  <i class="fas fa-plus ml-2"></i>
  إضافة جديد
</button>

<!-- زر تعديل (بنفسجي) -->
<button class="btn-edit" title="تعديل">
  <i class="fas fa-edit"></i>
</button>

<!-- زر حذف (أحمر) -->
<button class="btn-delete" title="حذف">
  <i class="fas fa-trash"></i>
</button>

<!-- زر ثانوي (رمادي) -->
<button class="btn-secondary">إلغاء</button>
```

### استخدام JavaScript Component
```javascript
// إنشاء زر بسيط
const button = ButtonComponent.create('primary', 'حفظ', null, () => {
  console.log('تم الحفظ');
});

// إنشاء زر مع أيقونة
const addButton = ButtonComponent.create('add', 'إضافة', 'fas fa-plus', () => {
  console.log('إضافة جديد');
});

// إنشاء زر أيقونة فقط
const editButton = ButtonComponent.createIconButton('edit', 'fas fa-edit', () => {
  console.log('تعديل');
}, 'تعديل');
```

---

## 🔍 Search Input Component - مكون البحث

### HTML
```html
<div class="search-input-wrapper">
  <i class="fas fa-search search-icon"></i>
  <input
    type="text"
    placeholder="بحث..."
    class="input-field"
    style="height: 40px;"
  />
</div>
```

### JavaScript
```javascript
const searchInput = new SearchInputComponent('searchContainer', {
  placeholder: 'بحث عن معلم...',
  onSearch: (query) => {
    console.log('البحث عن:', query);
    // تنفيذ البحث
  },
  debounce: 300
});

searchInput.render();
```

---

## 🎨 Card Component - مكون البطاقة

### HTML
```html
<div class="card">
  <h2 class="section-title">العنوان</h2>
  <div class="card-content">
    <!-- محتوى البطاقة -->
  </div>
</div>
```

### JavaScript
```javascript
const card = CardComponent.create('العنوان', '<p>محتوى البطاقة</p>');
document.body.appendChild(card);
```

---

## 🪟 Modal Component - مكون النافذة المنبثقة

### HTML
```html
<div id="myModal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div class="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
    <div class="flex justify-between items-center mb-4">
      <h2>العنوان</h2>
      <button data-modal-close class="text-gray-400 hover:text-gray-600">
        &times;
      </button>
    </div>
    <div>
      <!-- محتوى النافذة -->
    </div>
  </div>
</div>
```

### JavaScript
```javascript
const modal = new ModalComponent('myModal', {
  closeOnBackdrop: true,
  closeOnEscape: true
});

// فتح النافذة
modal.open();

// إغلاق النافذة
modal.close();

// تبديل الحالة
modal.toggle();
```

---

## 🧭 Sidebar Navigation - تنقل السايد بار

### HTML
```html
<nav class="sidebar-nav">
  <a href="index.html" class="sidebar-link active" data-route="index">
    <i class="fas fa-home"></i>
    <span>الصفحة الرئيسية</span>
  </a>
  <a href="teachers.html" class="sidebar-link" data-route="teachers">
    <i class="fas fa-chalkboard-teacher"></i>
    <span>المعلمين</span>
  </a>
</nav>
```

### JavaScript
```javascript
// تحديث الحالة النشطة
SidebarNavigation.updateActiveState('teachers');

// تهيئة السايد بار (يتم تلقائياً عند تحميل الصفحة)
SidebarNavigation.init();
```

---

## 🎯 CSS Classes - فئات CSS

### Layout
- `.app-header` - الهيدر الثابت
- `.app-sidebar` - السايد بار الثابت
- `.app-main-content` - منطقة المحتوى الرئيسية

### Tables
- `.modern-table` - جدول عصري
- `.table-responsive` - جدول متجاوب

### Buttons
- `.btn-primary` - زر أساسي (أزرق)
- `.btn-add` / `.btn-success` - زر إضافة (أخضر)
- `.btn-edit` - زر تعديل (بنفسجي)
- `.btn-delete` - زر حذف (أحمر)
- `.btn-secondary` - زر ثانوي (رمادي)
- `.btn-icon` - زر أيقونة

### Forms
- `.input-field` - حقل إدخال
- `.search-input-wrapper` - حاوية البحث

### Cards
- `.card` - بطاقة
- `.page-title` - عنوان الصفحة
- `.section-title` - عنوان القسم

### Utilities
- `.actions-group` - مجموعة الأزرار
- `.fade-in` - تأثير الظهور

---

## 📱 Responsive Design - التصميم المتجاوب

جميع المكونات متجاوبة تلقائياً:
- على الشاشات الكبيرة (> 1024px): السايد بار ظاهر
- على الشاشات الصغيرة (≤ 1024px): السايد بار مخفي

---

## 🎨 Colors - الألوان

- **أزرق (Primary)**: `bg-blue-600` - للإجراءات الأساسية
- **أخضر (Success/Add)**: `bg-green-600` - للإضافة
- **أحمر (Delete)**: `bg-red-600` - للحذف
- **بنفسجي (Edit)**: `bg-purple-600` - للتعديل
- **رمادي (Secondary)**: `bg-gray-100` - للإجراءات الثانوية

---

## 📝 Notes - ملاحظات

1. جميع المكونات تستخدم Tailwind CSS
2. المكونات متوافقة مع RTL (من اليمين لليسار)
3. جميع المكونات تدعم الوصول (Accessibility)
4. المكونات متجاوبة تلقائياً

---

## 🔄 Updates - التحديثات

لإضافة مكونات جديدة أو تحسين الموجود:
1. أضف CSS في `css/components.css`
2. أضف JavaScript في `js/components.js`
3. حدّث هذا الدليل
