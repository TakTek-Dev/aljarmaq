/**
 * video-player.js — مشغّل المرئيات وقائمة التشغيل + المشغّل المصغّر العائم
 * ---------------------------------------------------------------------------
 * يُستخدم في: index.html (قسم المرئيات) · video-archive.html
 *
 * يشغّل ملفّ فيديو حقيقيًا عبر <video data-player-video>. وإن لم يوجد وسم
 * <video> في الصفحة يعود المشغّل إلى العرض التوضيحي القديم (مؤقّت فوق صورة
 * الغلاف)، فلا تنكسر أي صفحة لم تُربط بملفّات فيديو بعد.
 *
 * المشغّل المصغّر: إن خرج المشغّل من الشاشة أثناء التشغيل ينتقل إلى زاوية
 * ثابتة ويستمرّ الفيديو، ويعود مكانه عند العودة إليه بالتمرير. الإطار
 * [data-player-frame] يحتفظ بارتفاعه فلا تقفز الصفحة عند الانتقال.
 * ملاحظة: الاستمرار يقتصر على الصفحة الواحدة — موقع بصفحات ثابتة يعيد
 * تحميل المستند عند الانتقال، فلا يمكن لعنصر <video> أن يعبر بين الصفحات.
 *
 * عناصر HTML المطلوبة:
 *   [data-player]                الغلاف
 *   [data-player-frame]          إطار يحفظ المساحة أثناء التصغير (اختياري)
 *   [data-player-video]          وسم <video> الحقيقي (اختياري)
 *   [data-player-poster]         صورة الغلاف (تُستعمل في العرض التوضيحي)
 *   [data-player-title]          العنوان المعروض فوق المشغّل
 *   [data-player-kicker]         شارة النوع
 *   [data-player-elapsed]        الوقت المنقضي
 *   [data-player-duration]       المدّة الكاملة
 *   [data-player-toggle]         أي زرّ تشغيل/إيقاف
 *   [data-player-mute]           زرّ كتم الصوت
 *   [data-player-full]           زرّ ملء الشاشة (اختياري)
 *   [data-player-dock-close]     إغلاق المشغّل المصغّر (اختياري)
 *   [data-player-dock-back]      العودة إلى مكان المشغّل (اختياري)
 *   [data-player-bar]            شريط التقدّم القابل للنقر والسحب
 *   [data-player-fill]           الجزء الممتلئ
 *   [data-player-buffer]         الجزء المحمَّل مسبقًا (اختياري)
 *   [data-player-knob]           المقبض (اختياري)
 *   [data-video]                 عنصر في قائمة التشغيل، يحمل:
 *        data-video-src (ملفّ الفيديو) · data-src (صورة الغلاف) ·
 *        data-title · data-kicker · data-duration · data-seconds
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  /** ثوانٍ → mm:ss (أو h:mm:ss للمواد الطويلة) */
  function format(seconds) {
    if (!isFinite(seconds) || seconds < 0) { seconds = 0; }
    var h = Math.floor(seconds / 3600);
    var m = Math.floor((seconds % 3600) / 60);
    var s = Math.floor(seconds % 60);
    var mm = String(m).padStart(2, '0');
    var ss = String(s).padStart(2, '0');
    return h ? (h + ':' + mm + ':' + ss) : (mm + ':' + ss);
  }

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
      var frame    = root.closest('[data-player-frame]');
      var video    = root.querySelector('[data-player-video]');
      var poster   = root.querySelector('[data-player-poster]');
      var title    = root.querySelector('[data-player-title]');
      var kicker   = root.querySelector('[data-player-kicker]');
      var elapsed  = root.querySelector('[data-player-elapsed]');
      var duration = root.querySelector('[data-player-duration]');
      var bar      = root.querySelector('[data-player-bar]');
      var fill     = root.querySelector('[data-player-fill]');
      var buffer   = root.querySelector('[data-player-buffer]');
      var knob     = root.querySelector('[data-player-knob]');
      var items    = scope.querySelectorAll('[data-video]');

      var timer = null;                                    // العرض التوضيحي
      var time  = 0;
      var total = parseInt(root.getAttribute('data-seconds'), 10) || 600;

      function current() { return video ? video.currentTime : time; }
      function length()  { return video && isFinite(video.duration) ? video.duration : total; }

      function paint() {
        var len = length();
        var percent = len ? (current() / len * 100) : 0;
        if (fill) { fill.style.width = percent.toFixed(2) + '%'; }
        if (knob) { knob.style.right = percent.toFixed(2) + '%'; }
        if (elapsed) { elapsed.textContent = format(current()); }
        if (duration && video && isFinite(video.duration)) {
          duration.textContent = format(video.duration);
        }
        if (buffer && video && video.buffered.length) {
          var end = video.buffered.end(video.buffered.length - 1);
          buffer.style.width = (len ? (end / len * 100) : 0).toFixed(2) + '%';
        }
      }

      /* ---------------------------------------------------------------
         التشغيل: فيديو حقيقي إن وُجد، وإلا مؤقّت فوق صورة الغلاف
         --------------------------------------------------------------- */

      function play() {
        if (video) {
          var p = video.play();
          // المتصفّح قد يرفض التشغيل بصوت قبل تفاعل المستخدم — نكتم ونعيد
          if (p && p.catch) {
            p.catch(function () {
              video.muted = true;
              root.classList.add('is-muted');
              video.play().catch(function () { root.classList.remove('is-playing'); });
            });
          }
          return;
        }
        if (timer) { return; }
        timer = window.setInterval(function () {
          time = (time + 1 >= total) ? 0 : time + 1;
          paint();
        }, 1000);
        root.classList.add('is-playing');
      }

      function pause() {
        if (video) { video.pause(); return; }
        window.clearInterval(timer);
        timer = null;
        root.classList.remove('is-playing');
      }

      function toggle() {
        var playing = video ? !video.paused : !!timer;
        if (playing) { pause(); } else { play(); }
      }

      if (video) {
        video.addEventListener('play',  function () { root.classList.add('is-playing'); });
        video.addEventListener('pause', function () { root.classList.remove('is-playing'); undock(); });
        video.addEventListener('ended', function () { root.classList.remove('is-playing'); undock(); });
        video.addEventListener('timeupdate', paint);
        video.addEventListener('progress', paint);
        video.addEventListener('loadedmetadata', paint);
        video.addEventListener('volumechange', function () {
          root.classList.toggle('is-muted', video.muted || video.volume === 0);
        });
      }

      /* --- أزرار التحكّم ------------------------------------------------ */

      Array.prototype.forEach.call(
        root.querySelectorAll('[data-player-toggle]'),
        function (btn) { btn.addEventListener('click', toggle); }
      );

      Array.prototype.forEach.call(
        root.querySelectorAll('[data-player-mute]'),
        function (btn) {
          btn.addEventListener('click', function () {
            if (video) { video.muted = !video.muted; return; }
            root.classList.toggle('is-muted');
          });
        }
      );

      Array.prototype.forEach.call(
        root.querySelectorAll('[data-player-full]'),
        function (btn) {
          btn.addEventListener('click', function () {
            var target = video || root;
            if (document.fullscreenElement) { document.exitFullscreen(); }
            else if (target.requestFullscreen) { target.requestFullscreen(); }
          });
        }
      );

      /* --- شريط التقدّم — RTL: البداية من الحافة اليمنى ------------------ */

      function seekFrom(clientX) {
        var box = bar.getBoundingClientRect();
        var ratio = Math.min(1, Math.max(0, (box.right - clientX) / box.width));
        if (video && isFinite(video.duration)) { video.currentTime = ratio * video.duration; }
        else { time = Math.round(ratio * total); }
        paint();
      }

      if (bar) {
        bar.addEventListener('pointerdown', function (e) {
          bar.setPointerCapture(e.pointerId);
          seekFrom(e.clientX);
          var move = function (ev) { seekFrom(ev.clientX); };
          var up = function () {
            bar.removeEventListener('pointermove', move);
            bar.removeEventListener('pointerup', up);
          };
          bar.addEventListener('pointermove', move);
          bar.addEventListener('pointerup', up);
        });
      }

      /* --- قائمة التشغيل ------------------------------------------------ */

      function load(item, autoplay) {
        var d = item.dataset;

        if (poster && d.src) { poster.src = d.src; }
        if (video) {
          if (d.src) { video.poster = d.src; }
          if (d.videoSrc) { video.src = d.videoSrc; video.load(); }
        }
        if (title  && d.title)  { title.textContent = d.title; }
        if (kicker && d.kicker) { kicker.textContent = d.kicker; }
        if (duration && d.duration) { duration.textContent = d.duration; }

        total = parseInt(d.seconds, 10) || total;
        time = 0;
        paint();

        // نطابق بالمصدر لا بالعنصر: نفس المادة قد تظهر في قائمة التشغيل
        // وفي الشبكة السفلية معًا، فتُبرَز في الاثنين.
        Array.prototype.forEach.call(items, function (other) {
          other.classList.toggle('is-active', other === item || other.dataset.src === d.src);
        });

        if (autoplay) { play(); }
      }

      Array.prototype.forEach.call(items, function (item) {
        item.addEventListener('click', function () {
          load(item, true);
          if (item.hasAttribute('data-video-scroll')) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        });
      });

      /* --- المشغّل المصغّر العائم ---------------------------------------- */

      var docked = false;
      var dockDisabled = false;   // يُغلقه المستخدم فلا يعود حتى يعيد التشغيل

      function dock() {
        if (docked || dockDisabled || !frame) { return; }
        docked = true;
        frame.classList.add('is-docked');
      }

      function undock() {
        if (!docked) { return; }
        docked = false;
        if (frame) { frame.classList.remove('is-docked'); }
      }

      if (frame && 'IntersectionObserver' in window) {
        var observer = new window.IntersectionObserver(function (entries) {
          var entry = entries[0];
          var playing = video ? !video.paused : !!timer;
          if (!entry.isIntersecting && playing) { dock(); }
          else if (entry.isIntersecting) { undock(); dockDisabled = false; }
        }, { threshold: 0.35 });
        observer.observe(frame);
      }

      Array.prototype.forEach.call(
        root.querySelectorAll('[data-player-dock-close]'),
        function (btn) {
          btn.addEventListener('click', function () {
            pause();
            dockDisabled = true;
            undock();
          });
        }
      );

      Array.prototype.forEach.call(
        root.querySelectorAll('[data-player-dock-back]'),
        function (btn) {
          btn.addEventListener('click', function () {
            if (frame) { frame.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          });
        }
      );

      paint();
    }
  };

}(window, document));
