/**
 * reels.js — الريلز: تشغيل في مكانه + مشغّل رأسي بملء الشاشة
 * ---------------------------------------------------------------------------
 * سلوكان:
 *   1) في الشريط: كل ريل يشتغل تلقائيًا وهو مكتوم حين يدخل الشاشة، ويتوقّف
 *      حين يخرج منها — كما في فيسبوك وإنستغرام. الملفّ لا يُحمَّل قبل ذلك
 *      (preload=none + إسناد src عند أول ظهور) فلا تُحمَّل ستة فيديوهات معًا.
 *   2) بالنقر: تفتح نافذة رأسية بملء الشاشة تعرض ريلًا واحدًا في كلّ مرّة،
 *      يُتنقّل بينها بالتمرير أو بالأسهم، مع صوت وشريط تقدّم وعدّاد.
 *
 * الشرائح تُبنى من نفس بطاقات الشريط، فلا يُكرَّر المحتوى في HTML.
 *
 * عناصر HTML المطلوبة:
 *   [data-reels]                 غلاف الشريط
 *   [data-reel]                  بطاقة واحدة، تحمل:
 *        data-video-src · data-poster · data-title · data-kicker
 *   [data-reel-open]             الزرّ الذي يفتح المشغّل داخل البطاقة
 *   #reels-viewer                نافذة <dialog> الفارغة (تُملأ من هنا)
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  var ICON_PLAY  = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><path d="m7 3 14 9-14 9V3z"></path></svg>';
  var ICON_PAUSE = '<svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';

  Aljarmaq.reels = {

    init: function () {
      var strip = document.querySelector('[data-reels]');
      if (!strip) { return; }

      var cards = Array.prototype.slice.call(strip.querySelectorAll('[data-reel]'));
      if (!cards.length) { return; }

      this.inline(cards);
      this.viewer(cards);
    },

    /* =====================================================================
       1) التشغيل داخل الشريط
       ===================================================================== */
    inline: function (cards) {
      if (!('IntersectionObserver' in window)) { return; }

      var observer = new window.IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target.querySelector('video');
          if (!video) { return; }

          if (entry.isIntersecting) {
            // أوّل ظهور: نسند المصدر الآن لا عند بناء الصفحة
            if (!video.getAttribute('src')) {
              var src = entry.target.getAttribute('data-video-src');
              if (!src) { return; }
              video.setAttribute('src', src);
            }
            var p = video.play();
            if (p && p.catch) { p.catch(function () { /* المتصفّح منع التشغيل — تبقى صورة الغلاف */ }); }
          } else if (!video.paused) {
            video.pause();
          }
          entry.target.classList.toggle('is-playing', entry.isIntersecting && !video.paused);
        });
      }, { threshold: 0.6 });

      cards.forEach(function (card) {
        observer.observe(card);
        var video = card.querySelector('video');
        if (!video) { return; }
        video.addEventListener('play',  function () { card.classList.add('is-playing'); });
        video.addEventListener('pause', function () { card.classList.remove('is-playing'); });
      });
    },

    /* =====================================================================
       2) المشغّل بملء الشاشة
       ===================================================================== */
    viewer: function (cards) {
      var modal = document.getElementById('reels-viewer');
      if (!modal) { return; }

      var track   = modal.querySelector('[data-reels-track]');
      var counter = modal.querySelector('[data-reels-counter]');
      var muteBtn = modal.querySelector('[data-reels-mute]');
      var prevBtn = modal.querySelector('[data-reels-prev]');
      var nextBtn = modal.querySelector('[data-reels-next]');
      var native  = typeof modal.showModal === 'function';

      var slides = [];
      var index = 0;
      var muted = true;
      var lastFocused = null;

      /* --- بناء الشرائح من بطاقات الشريط ------------------------------- */
      cards.forEach(function (card, i) {
        var d = card.dataset;

        var slide = document.createElement('article');
        slide.className = 'reels-slide';
        slide.setAttribute('data-index', String(i));

        var video = document.createElement('video');
        video.className = 'reels-slide__video';
        video.playsInline = true;
        video.loop = true;
        video.muted = true;
        video.preload = 'none';
        if (d.poster) { video.poster = d.poster; }
        video.setAttribute('data-src', d.videoSrc || '');

        var scrim = document.createElement('div');
        scrim.className = 'reels-slide__scrim';

        var tapper = document.createElement('button');
        tapper.type = 'button';
        tapper.className = 'reels-slide__tap';
        tapper.setAttribute('aria-label', 'تشغيل أو إيقاف');

        var badge = document.createElement('span');
        badge.className = 'reels-slide__state';
        badge.innerHTML = ICON_PLAY;

        var body = document.createElement('div');
        body.className = 'reels-slide__body';
        body.innerHTML =
          '<span class="badge badge--sm">' + (d.kicker || 'ريلز') + '</span>' +
          '<h3 class="reels-slide__title">' + (d.title || '') + '</h3>';

        var progress = document.createElement('div');
        progress.className = 'reels-slide__progress';
        progress.innerHTML = '<span class="reels-slide__progress-fill"></span>';

        slide.appendChild(video);
        slide.appendChild(scrim);
        slide.appendChild(tapper);
        slide.appendChild(badge);
        slide.appendChild(body);
        slide.appendChild(progress);
        track.appendChild(slide);

        var fillEl = progress.firstChild;

        video.addEventListener('timeupdate', function () {
          if (!isFinite(video.duration) || !video.duration) { return; }
          fillEl.style.width = (video.currentTime / video.duration * 100).toFixed(2) + '%';
        });
        video.addEventListener('play',  function () { slide.classList.add('is-playing'); badge.innerHTML = ICON_PAUSE; });
        video.addEventListener('pause', function () { slide.classList.remove('is-playing'); badge.innerHTML = ICON_PLAY; });

        tapper.addEventListener('click', function () {
          if (video.paused) { video.play(); } else { video.pause(); }
        });

        slides.push({ el: slide, video: video });
      });

      /* --- التشغيل والتنقّل ---------------------------------------------- */

      function activate(i) {
        if (i < 0 || i >= slides.length) { return; }
        index = i;

        slides.forEach(function (s, n) {
          s.el.classList.toggle('is-active', n === i);
          if (n === i) {
            if (!s.video.getAttribute('src')) {
              var src = s.video.getAttribute('data-src');
              if (src) { s.video.setAttribute('src', src); }
            }
            s.video.muted = muted;
            var p = s.video.play();
            if (p && p.catch) {
              p.catch(function () {
                // الصوت ممنوع قبل تفاعل المستخدم: نكتم ونعيد المحاولة
                s.video.muted = true;
                muted = true;
                syncMute();
                s.video.play().catch(function () {});
              });
            }
          } else {
            s.video.pause();
            s.video.currentTime = 0;
          }
        });

        if (counter) { counter.textContent = (i + 1) + ' / ' + slides.length; }
        if (prevBtn) { prevBtn.disabled = i === 0; }
        if (nextBtn) { nextBtn.disabled = i === slides.length - 1; }
      }

      function goTo(i, smooth) {
        if (i < 0 || i >= slides.length) { return; }
        slides[i].el.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
        activate(i);
      }

      function syncMute() {
        if (!muteBtn) { return; }
        muteBtn.classList.toggle('is-muted', muted);
        muteBtn.setAttribute('aria-pressed', muted ? 'true' : 'false');
        muteBtn.setAttribute('aria-label', muted ? 'تشغيل الصوت' : 'كتم الصوت');
      }

      if (muteBtn) {
        muteBtn.addEventListener('click', function () {
          muted = !muted;
          slides.forEach(function (s) { s.video.muted = muted; });
          syncMute();
        });
        syncMute();
      }
      if (prevBtn) { prevBtn.addEventListener('click', function () { goTo(index - 1, true); }); }
      if (nextBtn) { nextBtn.addEventListener('click', function () { goTo(index + 1, true); }); }

      // التمرير داخل المسار هو ما يحدّد الشريحة الفعّالة
      if ('IntersectionObserver' in window) {
        var inner = new window.IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
              activate(parseInt(entry.target.getAttribute('data-index'), 10));
            }
          });
        }, { root: track, threshold: [0.6] });
        slides.forEach(function (s) { inner.observe(s.el); });
      }

      /* --- الفتح والإغلاق ------------------------------------------------ */

      function open(i) {
        lastFocused = document.activeElement;
        if (native) { modal.showModal(); } else { modal.setAttribute('open', ''); }
        modal.classList.add('is-open');
        document.body.style.overflow = 'hidden';
        // الفتح يتمّ بنقرة المستخدم، فالصوت مسموح: نبدأ بصوت مفتوح
        muted = false;
        syncMute();
        goTo(i, false);
        var close = modal.querySelector('[data-reels-close]');
        if (close) { close.focus(); }
      }

      function close() {
        slides.forEach(function (s) { s.video.pause(); });
        if (native && modal.open) { modal.close(); } else { modal.removeAttribute('open'); }
        modal.classList.remove('is-open');
        document.body.style.overflow = '';
        if (lastFocused && lastFocused.focus) { lastFocused.focus(); }
      }

      cards.forEach(function (card, i) {
        var opener = card.querySelector('[data-reel-open]') || card;
        opener.addEventListener('click', function (e) {
          e.preventDefault();
          open(i);
        });
      });

      Array.prototype.forEach.call(
        modal.querySelectorAll('[data-reels-close]'),
        function (btn) { btn.addEventListener('click', close); }
      );

      modal.addEventListener('cancel', function (e) {
        e.preventDefault();
        close();
      });

      document.addEventListener('keydown', function (e) {
        if (!modal.classList.contains('is-open')) { return; }
        if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); goTo(index + 1, true); }
        else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); goTo(index - 1, true); }
        else if (e.key === ' ') { e.preventDefault(); var v = slides[index].video; if (v.paused) { v.play(); } else { v.pause(); } }
        else if (e.key === 'm' || e.key === 'M') { if (muteBtn) { muteBtn.click(); } }
        else if (e.key === 'Escape' && !native) { close(); }
      });
    }
  };

}(window, document));
