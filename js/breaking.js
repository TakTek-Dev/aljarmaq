/**
 * breaking.js — نافذة الأخبار العاجلة
 * ---------------------------------------------------------------------------
 * بلوك «عاجل» يعرض أحدث ثلاثة عناوين، وزرّ يفتح نافذة منبثقة بالقائمة كاملة.
 * النافذة عنصر <dialog> أصلي مع بديل يدوي للمتصفّحات القديمة، وتغلق بـEsc أو
 * بالنقر على الخلفية، وتعيد التركيز إلى الزرّ الذي فتحها.
 *
 * على الجوال يضيق الشريط فتُعرض العناوين واحدًا واحدًا بتبديل تلقائي بدل
 * ثلاثة تحت بعضها. التبديل هنا ليس زخرفة: هو وسيلة الوصول إلى بقية
 * العناوين، لذا يستمرّ حتى مع تفضيل تقليل الحركة — الذي يُلغي الانتقال
 * البصري فقط (في responsive.css). التوقّف عند المرور أو التركيز يحقّق
 * WCAG 2.2.2 بلا حجب محتوى.
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  Aljarmaq.breaking = {
    init: function () {
      var modal = document.getElementById('breaking-modal');
      if (!modal) { return; }

      var openers = document.querySelectorAll('[data-breaking-open]');
      var closers = modal.querySelectorAll('[data-breaking-close]');
      var native = typeof modal.showModal === 'function';
      var lastFocused = null;

      function open() {
        lastFocused = document.activeElement;
        if (native) { modal.showModal(); }
        else { modal.setAttribute('open', ''); }
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';

        var first = modal.querySelector('[data-breaking-close]');
        if (first) { first.focus(); }
      }

      function close() {
        if (native && modal.open) { modal.close(); }
        else { modal.removeAttribute('open'); }
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lastFocused && lastFocused.focus) { lastFocused.focus(); }
      }

      Array.prototype.forEach.call(openers, function (button) {
        button.addEventListener('click', open);
      });
      Array.prototype.forEach.call(closers, function (button) {
        button.addEventListener('click', close);
      });

      // النقر على الخلفية خارج اللوحة يغلق النافذة
      modal.addEventListener('click', function (event) {
        if (event.target === modal) { close(); }
      });

      // Esc: <dialog> يغلق نفسه ويطلق cancel، والبديل يحتاج التقاطًا يدويًا
      modal.addEventListener('cancel', function () {
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
      });
      if (!native) {
        document.addEventListener('keydown', function (event) {
          if (event.key === 'Escape' && modal.classList.contains('is-open')) { close(); }
        });
      }

      this.rotate();
    },

    /** تبديل العناوين واحدًا واحدًا — يعمل في نطاق الجوال فقط */
    rotate: function () {
      var list = document.querySelector('[data-breaking-rotate]');
      if (!list) { return; }

      var items = Array.prototype.slice.call(list.children);
      if (items.length < 2) { return; }

      var query = window.matchMedia('(max-width: 680px)');
      var index = 0;
      var timer = null;
      var paused = false;
      var DELAY = 5000;

      function show(i) {
        items.forEach(function (li, n) { li.classList.toggle('is-current', n === i); });
        index = i;
      }

      function step() {
        if (paused) { return; }
        show((index + 1) % items.length);
      }

      function start() {
        list.classList.add('is-rotating');
        show(0);
        window.clearInterval(timer);
        timer = window.setInterval(step, DELAY);
      }

      function stop() {
        window.clearInterval(timer);
        timer = null;
        list.classList.remove('is-rotating');
        items.forEach(function (li) { li.classList.remove('is-current'); });
      }

      function sync() {
        if (query.matches) { start(); } else { stop(); }
      }

      // WCAG 2.2.2 — للمستخدم أن يوقف الحركة بالمرور أو بالتركيز بالكيبورد
      list.addEventListener('pointerenter', function () { paused = true; });
      list.addEventListener('pointerleave', function () { paused = false; });
      list.addEventListener('focusin',  function () { paused = true; });
      list.addEventListener('focusout', function () { paused = false; });

      if (query.addEventListener) { query.addEventListener('change', sync); }
      else if (query.addListener) { query.addListener(sync); }
      // احتياط: إطار تُغيَّر أبعاده بعد التحميل قد يفوّت حدث change
      window.addEventListener('resize', sync);

      sync();
    }
  };

}(window, document));
