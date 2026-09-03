/**
 * read-aloud.js — القراءة الصوتية للخبر
 * ---------------------------------------------------------------------------
 * مصدران بالترتيب:
 *   1) تسجيل بشري: ضع مساره في data-audio على .read-aloud — يُشغَّل كما هو.
 *   2) وإلا: قراءة آلية بـWeb Speech API من نصّ العنصر المشار إليه في
 *      data-read-target (الافتراضي .article__body).
 *
 * إن لم يتوفّر أيّ منهما — لا تسجيل ولا دعم للقراءة الآلية — يُخفى الزرّ
 * تمامًا بدل أن يبقى زرًّا لا يفعل شيئًا.
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  /** نصّ المقال بلا العناصر غير المقروءة (صور، تعليقات، أزرار المشاركة) */
  function extract(target) {
    var clone = target.cloneNode(true);
    var drop = clone.querySelectorAll('figure, figcaption, script, style, .share-rail, .ad-slot, [aria-hidden="true"]');
    Array.prototype.forEach.call(drop, function (node) { node.remove(); });
    return clone.textContent.replace(/\s+/g, ' ').trim();
  }

  Aljarmaq.readAloud = {
    init: function () {
      var widgets = document.querySelectorAll('.read-aloud');
      if (!widgets.length) { return; }

      Array.prototype.forEach.call(widgets, function (widget) {
        var button = widget.querySelector('[data-read-toggle]');
        var status = widget.querySelector('[data-read-status]');
        var src = widget.getAttribute('data-audio');
        var selector = widget.getAttribute('data-read-target') || '.article__body';
        var target = document.querySelector(selector);
        var speech = window.speechSynthesis;
        var playing = false;
        var stopping = false;   // إيقاف مقصود: cancel يطلق onerror فلا نعدّه خطأ
        var audio = null;
        var utterance = null;

        if (!button) { return; }

        // لا تسجيل ولا قراءة آلية: الزرّ بلا فائدة فيُخفى
        if (!src && (!speech || !target)) { widget.hidden = true; return; }

        function setState(on, text) {
          playing = on;
          widget.classList.toggle('is-playing', on);
          button.setAttribute('aria-pressed', on ? 'true' : 'false');
          if (status) { status.textContent = text; }
        }

        function stop() {
          stopping = true;
          if (audio) { audio.pause(); audio.currentTime = 0; }
          if (speech) { speech.cancel(); }
          setState(false, 'استمع للخبر');
          // نافذة قصيرة تكفي لابتلاع حدث الخطأ الناتج عن cancel نفسه
          window.setTimeout(function () { stopping = false; }, 300);
        }

        function playFile() {
          if (!audio) {
            audio = new window.Audio(src);
            audio.addEventListener('ended', function () { setState(false, 'استمع للخبر'); });
            audio.addEventListener('error', function () { setState(false, 'تعذّر تشغيل الصوت'); });
          }
          audio.play();
          setState(true, 'جارٍ التشغيل — اضغط للإيقاف');
        }

        function speak() {
          var text = extract(target);
          if (!text) { setState(false, 'لا يوجد نصّ للقراءة'); return; }

          // إلغاء أي قراءة سابقة عالقة قبل بدء واحدة جديدة
          speech.cancel();
          utterance = new window.SpeechSynthesisUtterance(text);
          utterance.lang = document.documentElement.lang || 'ar';
          utterance.rate = 0.95;
          utterance.onend = function () { setState(false, 'استمع للخبر'); };
          utterance.onerror = function (event) {
            // interrupted/canceled يأتيان من إيقافنا نحن، لا من عطل
            if (stopping || (event && (event.error === 'interrupted' || event.error === 'canceled'))) { return; }
            setState(false, 'تعذّرت القراءة الصوتية');
          };
          speech.speak(utterance);
          setState(true, 'جارٍ القراءة — اضغط للإيقاف');
        }

        button.addEventListener('click', function () {
          if (playing) { stop(); return; }
          if (src) { playFile(); } else { speak(); }
        });

        // مغادرة الصفحة أثناء القراءة تترك الصوت شغّالًا في بعض المتصفّحات
        window.addEventListener('pagehide', stop);
      });
    }
  };

}(window, document));
