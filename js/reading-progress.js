/**
 * reading-progress.js — شريط تقدّم القراءة أعلى صفحة الخبر (article.html)
 * ---------------------------------------------------------------------------
 * يحدّث العرض داخل requestAnimationFrame حتى لا يثقل حدث التمرير.
 *
 * عنصر HTML المطلوب:
 *   [data-read-progress]  الشريط الداخلي الذي يتمدّد
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  Aljarmaq.readingProgress = {

    init: function () {
      var bar = document.querySelector('[data-read-progress]');
      if (!bar) { return; }

      var ticking = false;

      function update() {
        var doc = document.documentElement;
        var max = doc.scrollHeight - window.innerHeight;
        var percent = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
        bar.style.width = percent + '%';
        ticking = false;
      }

      window.addEventListener('scroll', function () {
        if (ticking) { return; }
        ticking = true;
        window.requestAnimationFrame(update);
      }, { passive: true });

      window.addEventListener('resize', update);
      update();
    }
  };

}(window, document));
