/**
 * theme.js — تبديل الوضع الليلي / النهاري
 * ---------------------------------------------------------------------------
 * ثلاث حالات: «فاتح» و«داكن» و«حسب النظام» (الافتراضي). الاختيار يُحفظ في
 * localStorage تحت المفتاح aljarmaq-theme ويُطبَّق كسمة data-theme على <html>.
 *
 * تنبيه: القيمة تُقرأ أيضًا في سكربت صغير داخل <head> قبل رسم الصفحة، وإلا
 * ظهرت ومضة بيضاء قبل تطبيق الوضع الداكن. لا تحذف ذلك السكربت.
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};
  var KEY = 'aljarmaq-theme';
  var root = document.documentElement;

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function write(value) {
    try {
      if (value) { window.localStorage.setItem(KEY, value); }
      else { window.localStorage.removeItem(KEY); }
    } catch (e) { /* وضع التصفّح الخاص قد يمنع الكتابة — لا يضرّ */ }
  }

  /** الوضع الفعلي المعروض الآن.
   *  المصدر هو السمة على <html> لا التخزين: التخزين يُكتب بعد التطبيق،
   *  فقراءته أثناء التحديث تعطي القيمة السابقة. */
  function effective() {
    var attr = root.getAttribute('data-theme');
    if (attr === 'dark' || attr === 'light') { return attr; }
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  }

  function apply(mode) {
    if (mode) { root.setAttribute('data-theme', mode); }
    else { root.removeAttribute('data-theme'); }
    sync();
  }

  /** يحدّث حالة كل أزرار التبديل في الصفحة (الهيدر والقائمة الجانبية) */
  function sync() {
    var mode = effective();
    var dark = mode === 'dark';
    var buttons = document.querySelectorAll('[data-theme-toggle]');

    Array.prototype.forEach.call(buttons, function (button) {
      // role="switch" يقرأ aria-checked؛ نُبقي aria-pressed للتوافق مع
      // أي ترميز قديم لا يحمل الدور.
      button.setAttribute('aria-checked', dark ? 'true' : 'false');
      button.setAttribute('aria-pressed', dark ? 'true' : 'false');
      button.setAttribute('aria-label', dark ? 'التبديل إلى الوضع النهاري'
                                            : 'التبديل إلى الوضع الليلي');
      var label = button.querySelector('[data-theme-label]');
      if (label) { label.textContent = dark ? 'الوضع النهاري' : 'الوضع الليلي'; }
    });
  }

  Aljarmaq.theme = {
    init: function () {
      var buttons = document.querySelectorAll('[data-theme-toggle]');
      if (!buttons.length) { return; }

      Array.prototype.forEach.call(buttons, function (button) {
        button.addEventListener('click', function () {
          apply(effective() === 'dark' ? 'light' : 'dark');
          write(root.getAttribute('data-theme'));
        });
      });

      // ما دام المستخدم لم يختر صراحةً، نتبع تغيّر تفضيل النظام مباشرةً
      if (window.matchMedia) {
        var query = window.matchMedia('(prefers-color-scheme: dark)');
        var onChange = function () { if (!read()) { sync(); } };
        if (query.addEventListener) { query.addEventListener('change', onChange); }
        else if (query.addListener) { query.addListener(onChange); }
      }

      sync();
    }
  };

}(window, document));
