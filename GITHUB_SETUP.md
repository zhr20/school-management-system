# تعليمات رفع المشروع على GitHub

## المتطلبات الأساسية

1. **تثبيت Git**: إذا لم يكن Git مثبتاً، قم بتحميله من [git-scm.com](https://git-scm.com/download/win)
2. **حساب GitHub**: تأكد من وجود حساب على [GitHub](https://github.com)

## الخطوات

### 1. تثبيت Git (إذا لم يكن مثبتاً)

- قم بتحميل Git من الموقع الرسمي
- قم بتثبيته مع الإعدادات الافتراضية
- أعد تشغيل PowerShell/Terminal بعد التثبيت

### 2. إنشاء Repository جديد على GitHub

1. اذهب إلى [GitHub](https://github.com)
2. اضغط على زر **"New"** أو **"+"** في الأعلى
3. اختر **"New repository"**
4. أدخل اسم المشروع (مثلاً: `school-management-system`)
5. اختر **Public** أو **Private** حسب رغبتك
6. **لا** تضع علامة على "Initialize this repository with a README"
7. اضغط **"Create repository"**

### 3. تهيئة Git في المشروع

افتح PowerShell أو Terminal في مجلد المشروع (`C:\wamp\www\schoolMange`) وقم بتنفيذ الأوامر التالية:

```bash
# تهيئة Git
git init

# إضافة جميع الملفات
git add .

# عمل commit أولي
git commit -m "Initial commit: School Management System"

# إضافة remote repository (استبدل YOUR_USERNAME و YOUR_REPO_NAME)
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git

# رفع الملفات إلى GitHub
git branch -M main
git push -u origin main
```

### 4. معلومات مهمة

⚠️ **تحذير**: ملف `api/config.php` يحتوي على معلومات قاعدة البيانات. تأكد من:
- عدم رفع معلومات حساسة (كلمات مرور قاعدة البيانات الحقيقية)
- استخدام متغيرات البيئة (environment variables) في الإنتاج
- أو إنشاء ملف `config.example.php` بدون معلومات حساسة

### 5. الملفات المستثناة (في .gitignore)

الملفات التالية لن يتم رفعها:
- `node_modules/` - مكتبات Node.js
- ملفات قاعدة البيانات
- ملفات مؤقتة
- ملفات النظام

## تحديث المشروع لاحقاً

عند إجراء تغييرات، استخدم:

```bash
# إضافة التغييرات
git add .

# عمل commit
git commit -m "وصف التغييرات"

# رفع التغييرات
git push
```

## ملاحظات إضافية

- تأكد من تحديث `api/config.php` لإزالة معلومات قاعدة البيانات الحقيقية قبل الرفع
- يمكنك إنشاء ملف `config.example.php` كقالب للمستخدمين الآخرين
- أضف ملف `README.md` يشرح كيفية إعداد المشروع
