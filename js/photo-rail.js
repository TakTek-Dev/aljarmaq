/**
 * photo-rail.js — شريط الصور الممتدّ خارج الشاشة
 * ---------------------------------------------------------------------------
 * الشريط يبدأ محاذيًا لحافة المحتوى ويستمرّ خارج الشاشة، فيُقرأ كأنّ الصور
 * موضوعة على طاولة تمتدّ إلى ما بعد إطار الصفحة.
 *
 * ما تضيفه هذه الوحدة فوق التمرير الأصلي:
 *   · السحب بالماوس (grab/grabbing) كما في تصفّح الصور على الطاولة
 *   · عجلة الماوس الرأسية تُحرّك الشريط أفقيًا
 *   · شريط تقدّم عنبري يوضّح موضعك من المجموعة
 *   · زرّان للتنقّل بخطوة بطاقة واحدة
 *
 * التمرير باللمس والكيبورد يعمل أصلًا (overflow + tabindex)، فلا نعطّله.
 *
 * عناصر HTML المطلوبة:
 *   [data-rail]            الغلاف القابل للتمرير
 *   [data-rail-track]      الحاوية الأفقية للبطاقات
 *   [data-rail-progress]   الجزء الممتلئ من شريط التقدّم (اختياري)
 *   [data-rail-prev] · [data-rail-next]   زرّا التنقّل (اختياريان)
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  Aljarmaq.photoRail = {

    init: function () {
      var self = this;
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-rail]'),
        function (rail) { self.create(rail); }
      );
    },

    create: function (rail) {
      var track = rail.querySelector('[data-rail-track]');
      if (!track) { return; }

      var scope = rail.closest('section') || document;
      var progress = scope.querySelector('[data-rail-progress]');
      var prev = scope.querySelector('[data-rail-prev]');
      var next = scope.querySelector('[data-rail-next]');
      var cards = track.children;

      /* في RTL تكون scrollLeft صفرًا عند البداية (اليمين) وتصير سالبة
         كلّما تقدّمنا يسارًا. القيمة المطلقة توحّد الاتجاهين. */
      function max() { return rail.scrollWidth - rail.clientWidth; }

      /* هامش بالبكسل لا بالنسبة: الالتقاط قد يترك الشريط على بُعد بضعة
         بكسلات من الطرف، فتبقى الأزرار مفعّلة بلا داعٍ. */
      var EDGE = 12;

      function paint() {
        var limit = max();
        var at = Math.abs(rail.scrollLeft);
        var ratio = limit > 0 ? Math.min(1, at / limit) : 0;
        if (progress) {
          progress.style.width = (at <= EDGE ? 0 : ratio * 100).toFixed(2) + '%';
        }
        if (prev) { prev.disabled = at <= EDGE; }
        if (next) { next.disabled = limit <= 0 || at >= limit - EDGE; }
      }

      /** عرض بطاقة واحدة مع الفجوة — خطوة التنقّل بالأزرار */
      function step() {
        if (!cards.length) { return rail.clientWidth * 0.8; }
        var box = cards[0].getBoundingClientRect();
        var gap = parseFloat(getComputedStyle(track).columnGap) || 0;
        return box.width + gap;
      }

      function scrollByStep(dir) {
        // في RTL يتحرّك المحور المنطقي عكس إشارة scrollLeft
        var rtl = getComputedStyle(rail).direction === 'rtl';
        rail.scrollBy({ left: step() * dir * (rtl ? -1 : 1), behavior: 'smooth' });
      }

      if (prev) { prev.addEventListener('click', function () { scrollByStep(-1); }); }
      if (next) { next.addEventListener('click', function () { scrollByStep(1); }); }

      rail.addEventListener('scroll', paint, { passive: true });
      window.addEventListener('resize', paint);

      /* --- السحب بالماوس ------------------------------------------------ */
      var dragging = false;
      var startX = 0;
      var startScroll = 0;
      var moved = 0;

      rail.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'touch') { return; }   // اللمس يتكفّل به المتصفّح
        dragging = true;
        moved = 0;
        startX = e.clientX;
        startScroll = rail.scrollLeft;
        rail.classList.add('is-dragging');
        rail.setPointerCapture(e.pointerId);
      });

      rail.addEventListener('pointermove', function (e) {
        if (!dragging) { return; }
        var delta = e.clientX - startX;
        moved = Math.abs(delta);
        rail.scrollLeft = startScroll - delta;
      });

      function endDrag(e) {
        if (!dragging) { return; }
        dragging = false;
        rail.classList.remove('is-dragging');
        if (e && e.pointerId !== undefined && rail.hasPointerCapture(e.pointerId)) {
          rail.releasePointerCapture(e.pointerId);
        }
      }
      rail.addEventListener('pointerup', endDrag);
      rail.addEventListener('pointercancel', endDrag);

      /* سحبة طويلة يجب ألّا تُفتح الألبوم عند رفع الإصبع */
      rail.addEventListener('click', function (e) {
        if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
      }, true);

      /* --- العجلة الرأسية تُحرّك الشريط أفقيًا ---------------------------- */
      rail.addEventListener('wheel', function (e) {
        if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) { return; }
        var limit = max();
        if (limit <= 0) { return; }
        var atStart = Math.abs(rail.scrollLeft) <= 0;
        var atEnd = Math.abs(rail.scrollLeft) >= limit - 1;
        // نترك الصفحة تُمرَّر عادةً عند طرفَي الشريط بدل حبس التمرير
        if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) { return; }
        e.preventDefault();
        var rtl = getComputedStyle(rail).direction === 'rtl';
        rail.scrollLeft += e.deltaY * (rtl ? -1 : 1);
      }, { passive: false });

      paint();
    }
  };

}(window, document));
