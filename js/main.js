/**
 * main.js — نقطة الدخول للجافاسكربت
 * ---------------------------------------------------------------------------
 * كل صفحة تربط الملفات بهذا الترتيب في نهاية <head> مع defer:
 *
 *   <script src="js/navigation.js" defer></script>
 *   <script src="js/filters.js" defer></script>
 *   ... (الوحدات التي تحتاجها الصفحة فقط)
 *   <script src="js/main.js" defer></script>   ← دائمًا الأخير
 *
 * defer يضمن: التحميل بالتوازي، والتنفيذ بالترتيب بعد اكتمال بناء الصفحة.
 * كل وحدة تسجّل نفسها على window.Aljarmaq وتتجاهل الصفحة إن لم تجد عناصرها،
 * لذا لا يضرّ ربط وحدة زائدة ولا يسقط الموقع إن نقصت واحدة.
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  /** ترتيب التشغيل — الأسماء نفسها المسجّلة في ملفات الوحدات */
  var MODULES = [
    'theme',
    'navigation',
    'breaking',
    'filters',
    'slider',
    'videoPlayer',
    'reels',
    'photoRail',
    'gallery',
    'readingProgress',
    'readAloud'
  ];

  Aljarmaq.boot = function () {
    MODULES.forEach(function (name) {
      var module = Aljarmaq[name];
      if (!module || typeof module.init !== 'function') { return; }

      try {
        module.init();
      } catch (error) {
        // فشل وحدة واحدة يجب ألّا يوقف باقي الصفحة
        if (window.console) { console.error('[Aljarmaq] فشل تشغيل الوحدة: ' + name, error); }
      }
    });
  };

  // مع defer قد تكون الصفحة جاهزة فعلًا عند التنفيذ
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', Aljarmaq.boot);
  } else {
    Aljarmaq.boot();
  }

}(window, document));
