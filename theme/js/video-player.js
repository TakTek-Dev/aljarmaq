/**
 * video-player.js — مشغّل المرئيات التوضيحي وقائمة التشغيل
 * ---------------------------------------------------------------------------
 * يُستخدم في: index.html (قسم المرئيات) · video-archive.html
 *
 * المشغّل هنا عرض تقديمي: يعرض صورة الغلاف ويحرّك شريط التقدّم بمؤقّت،
 * بلا ملفّ فيديو حقيقي. لربطه بفيديو فعلي استبدل <img data-player-poster>
 * بوسم <video> واستدعِ play()/pause() بدل المؤقّت في toggle().
 *
 * عناصر HTML المطلوبة:
 *   [data-player]                الغلاف
 *   [data-player-poster]         صورة الغلاف
 *   [data-player-title]          العنوان المعروض فوق المشغّل
 *   [data-player-kicker]         شارة النوع
 *   [data-player-elapsed]        الوقت المنقضي
 *   [data-player-duration]       المدّة الكاملة
 *   [data-player-views]          عدد المشاهدات (اختياري)
 *   [data-player-toggle]         أي زرّ تشغيل/إيقاف
 *   [data-player-mute]           زرّ كتم الصوت (اختياري)
 *   [data-player-bar]            شريط التقدّم القابل للنقر
 *   [data-player-fill]           الجزء الممتلئ
 *   [data-player-knob]           المقبض (اختياري)
 *   [data-video]                 عنصر في قائمة التشغيل، يحمل:
 *        data-src · data-title · data-kicker · data-duration ·
 *        data-seconds · data-views
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  Aljarmaq.videoPlayer = {

    init: function () {
      var self = this;
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-player]'),
        function (root) { self.create(root); }
      );
    },

    create: function (root) {
      var scope    = root.closest('[data-player-scope]') || document;
      var poster   = root.querySelector('[data-player-poster]');
      var title    = root.querySelector('[data-player-title]');
      var kicker   = root.querySelector('[data-player-kicker]');
      var elapsed  = root.querySelector('[data-player-elapsed]');
      var duration = root.querySelector('[data-player-duration]');
      var views    = root.querySelector('[data-player-views]');
      var bar      = root.querySelector('[data-player-bar]');
      var fill     = root.querySelector('[data-player-fill]');
      var knob     = root.querySelector('[data-player-knob]');
      var items    = scope.querySelectorAll('[data-video]');

      var timer = null;
      var time = 0;
      var total = parseInt(root.getAttribute('data-seconds'), 10) || 600;

      /** ثوانٍ → mm:ss */
      function format(seconds) {
        var m = Math.floor(seconds / 60);
        var s = Math.floor(seconds % 60);
        return String(m).padStart(2, '0') + ':' + String(s).padStart(2, '0');
      }

      function paint() {
        var percent = total ? (time / total * 100) : 0;
        if (fill)    { fill.style.width = percent.toFixed(2) + '%'; }
        if (knob)    { knob.style.right = percent.toFixed(2) + '%'; }
        if (elapsed) { elapsed.textContent = format(time); }
      }

      function tick() {
        time = (time + 1 >= total) ? 0 : time + 1;
        paint();
      }

      function play() {
        if (timer) { return; }
        timer = window.setInterval(tick, 1000);
        root.classList.add('is-playing');
      }

      function pause() {
        window.clearInterval(timer);
        timer = null;
        root.classList.remove('is-playing');
      }

      function toggle() {
        if (timer) { pause(); } else { play(); }
      }

      /** تحميل مادة من قائمة التشغيل داخل المشغّل */
      function load(item) {
        var d = item.dataset;

        if (poster && d.src)    { poster.src = d.src; }
        if (title  && d.title)  { title.textContent = d.title; }
        if (kicker && d.kicker) { kicker.textContent = d.kicker; }
        if (duration && d.duration) { duration.textContent = d.duration; }
        if (views && d.views)   { views.textContent = d.views + ' مشاهدة'; }

        total = parseInt(d.seconds, 10) || total;
        time = 0;
        paint();

        // نطابق بالمصدر لا بالعنصر: نفس المادة قد تظهر في قائمة التشغيل
        // وفي الشبكة السفلية معًا، فتُبرَز في الاثنين.
        Array.prototype.forEach.call(items, function (other) {
          other.classList.toggle('is-active', other === item || other.dataset.src === d.src);
        });
      }

      // أزرار التشغيل/الإيقاف
      Array.prototype.forEach.call(
        root.querySelectorAll('[data-player-toggle]'),
        function (btn) { btn.addEventListener('click', toggle); }
      );

      // كتم الصوت (بصري فقط في هذا العرض)
      Array.prototype.forEach.call(
        root.querySelectorAll('[data-player-mute]'),
        function (btn) {
          btn.addEventListener('click', function () { root.classList.toggle('is-muted'); });
        }
      );

      // النقر على شريط التقدّم — RTL: البداية من الحافة اليمنى
      if (bar) {
        bar.addEventListener('click', function (e) {
          var box = bar.getBoundingClientRect();
          var ratio = Math.min(1, Math.max(0, (box.right - e.clientX) / box.width));
          time = Math.round(ratio * total);
          paint();
        });
      }

      // قائمة التشغيل
      Array.prototype.forEach.call(items, function (item) {
        item.addEventListener('click', function () {
          load(item);
          if (item.hasAttribute('data-video-scroll')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });

      paint();
    }
  };

}(window, document));
