/**
 * breaking.js — نافذة الأخبار العاجلة
 * ---------------------------------------------------------------------------
 * بلوك «عاجل» يعرض أحدث ثلاثة عناوين، وزرّ يفتح نافذة منبثقة بالقائمة كاملة.
 * النافذة عنصر <dialog> أصلي مع بديل يدوي للمتصفّحات القديمة، وتغلق بـEsc أو
 * بالنقر على الخلفية، وتعيد التركيز إلى الزرّ الذي فتحها.
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
    }
  };

}(window, document));
