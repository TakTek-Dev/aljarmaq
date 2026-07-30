/**
 * gallery.js — عارض ألبوم الصور (album.html)
 * ---------------------------------------------------------------------------
 * التنقّل بالأزرار، بالشرائط المصغّرة، بالموزاييك، وبأسهم الكيبورد.
 * في RTL: السهم الأيسر يتقدّم والأيمن يرجع — كاتجاه القراءة.
 *
 * عناصر HTML المطلوبة:
 *   [data-gallery]           الغلاف
 *   [data-gallery-image]     الصورة الكبيرة
 *   [data-gallery-caption]   نصّ الشرح
 *   [data-gallery-index]     رقم الصورة الحالية
 *   [data-gallery-prev/next] أزرار التنقّل
 *   [data-gallery-full]      زرّ ملء الشاشة
 *   [data-gallery-thumb]     شريحة مصغّرة، تحمل data-src و data-caption
 *   [data-gallery-jump]      خانة في الموزاييك، تحمل data-index
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  Aljarmaq.gallery = {

    init: function () {
      var root = document.querySelector('[data-gallery]');
      if (!root) { return; }

      var image   = root.querySelector('[data-gallery-image]');
      var caption = document.querySelector('[data-gallery-caption]');
      var counter = document.querySelector('[data-gallery-index]');
      var thumbs  = document.querySelectorAll('[data-gallery-thumb]');
      var jumps   = document.querySelectorAll('[data-gallery-jump]');
      var index   = 0;

      function show(i) {
        if (!thumbs.length) { return; }
        index = (i + thumbs.length) % thumbs.length;

        var thumb = thumbs[index];
        if (image)   { image.src = thumb.getAttribute('data-src'); }
        if (caption) { caption.textContent = thumb.getAttribute('data-caption') || ''; }
        if (counter) { counter.textContent = String(index + 1); }

        Array.prototype.forEach.call(thumbs, function (other, k) {
          other.classList.toggle('is-active', k === index);
        });
      }

      // أزرار التنقّل (قد تتكرّر: فوق الصورة وفي شريط الأدوات)
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-gallery-prev]'),
        function (btn) { btn.addEventListener('click', function () { show(index - 1); }); }
      );
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-gallery-next]'),
        function (btn) { btn.addEventListener('click', function () { show(index + 1); }); }
      );

      // الشرائط المصغّرة
      Array.prototype.forEach.call(thumbs, function (thumb, k) {
        thumb.addEventListener('click', function () { show(k); });
      });

      // الموزاييك — يفتح الصورة ويرجع بالصفحة إلى الأعلى
      Array.prototype.forEach.call(jumps, function (cell) {
        cell.addEventListener('click', function () {
          show(parseInt(cell.getAttribute('data-index'), 10) || 0);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      });

      // ملء الشاشة
      var full = document.querySelector('[data-gallery-full]');
      if (full && image) {
        full.addEventListener('click', function () {
          if (image.requestFullscreen) { image.requestFullscreen(); }
        });
      }

      // أسهم الكيبورد
      document.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowLeft')  { show(index + 1); }
        if (e.key === 'ArrowRight') { show(index - 1); }
      });

      show(0);
    }
  };

}(window, document));
