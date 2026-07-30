/**
 * slider.js — العرض المتحرّك بالأسهم (النمط الرابع في الصفحة الرئيسية)
 * ---------------------------------------------------------------------------
 * يحسب عدد البطاقات الظاهرة تلقائيًا من عرض الحاوية، فتتوقّف الأسهم عند
 * آخر بطاقة بدل أن تنزلق إلى فراغ. يعمل في اتجاه RTL (الإزاحة موجبة).
 *
 * عناصر HTML المطلوبة:
 *   [data-slider]        الغلاف
 *   [data-slider-track]  الشريط المتحرّك، أبناؤه هي البطاقات
 *   [data-slider-prev]   زرّ السابق
 *   [data-slider-next]   زرّ التالي
 *   [data-slider-dots]   حاوية النقاط (تُبنى بالجافاسكربت)
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  Aljarmaq.slider = {

    init: function () {
      var self = this;
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-slider]'),
        function (root) { self.create(root); }
      );
    },

    create: function (root) {
      var track = root.querySelector('[data-slider-track]');
      if (!track || !track.children.length) { return; }

      var prev = root.querySelector('[data-slider-prev]');
      var next = root.querySelector('[data-slider-next]');
      var dots = root.querySelector('[data-slider-dots]');
      var index = 0;
      var max = 0;

      /** خطوة واحدة = عرض البطاقة + المسافة بينها وبين التالية */
      function metrics() {
        var cards = track.children;
        var width = cards[0].getBoundingClientRect().width;
        var gap = parseFloat(getComputedStyle(track).columnGap) || 24;
        var step = width + gap;
        var viewport = track.parentElement.getBoundingClientRect().width;
        var visible = Math.max(1, Math.floor((viewport + gap + 2) / step));
        return { step: step, max: Math.max(0, cards.length - visible) };
      }

      function renderDots() {
        if (!dots) { return; }
        dots.innerHTML = '';
        for (var i = 0; i <= max; i++) {
          dots.appendChild(makeDot(i));
        }
      }

      function makeDot(i) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'slider__dot' + (i === index ? ' is-active' : '');
        dot.setAttribute('aria-label', 'انتقال إلى المجموعة ' + (i + 1));
        dot.addEventListener('click', function () { go(i); });
        return dot;
      }

      function apply() {
        var m = metrics();
        var changed = m.max !== max;
        max = m.max;
        if (index > max) { index = max; }

        track.style.transform = 'translateX(' + (index * m.step) + 'px)';

        if (changed) { renderDots(); }
        if (dots) {
          Array.prototype.forEach.call(dots.children, function (dot, i) {
            dot.classList.toggle('is-active', i === index);
          });
        }
        if (prev) { prev.disabled = index === 0; }
        if (next) { next.disabled = index >= max; }
      }

      function go(i) {
        index = Math.min(Math.max(0, i), max);
        apply();
      }

      if (prev) { prev.addEventListener('click', function () { go(index - 1); }); }
      if (next) { next.addEventListener('click', function () { go(index + 1); }); }
      window.addEventListener('resize', apply);

      apply();
      renderDots();
      // إعادة حساب بعد تحميل الصور والخطوط
      window.setTimeout(apply, 400);
    }
  };

}(window, document));
