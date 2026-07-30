/**
 * navigation.js — القائمة الجانبية للموبايل (drawer)
 * ---------------------------------------------------------------------------
 * يعمل على أي صفحة تحتوي partials/header.html.
 * الحالة تُخزَّن كصنف `is-menu-open` على <body>، والأنماط في css/header.css.
 *
 * عناصر HTML المطلوبة:
 *   [data-menu-open]   زرّ البرغر
 *   [data-menu-close]  أي عنصر يغلق القائمة (زرّ الإغلاق، الطبقة المعتمة، الروابط)
 *   .drawer            القائمة نفسها
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  Aljarmaq.navigation = {

    init: function () {
      this.markActiveLink();

      var drawer = document.querySelector('.drawer');
      if (!drawer) { return; }

      this.drawer = drawer;
      this.opener = document.querySelector('[data-menu-open]');

      var self = this;

      // فتح القائمة
      if (this.opener) {
        this.opener.addEventListener('click', function () { self.open(); });
      }

      // كل ما يحمل data-menu-close يغلق القائمة (زرّ الإغلاق، الطبقة، الروابط)
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-menu-close]'),
        function (el) {
          el.addEventListener('click', function () { self.close(); });
        }
      );

      // Escape يغلق القائمة
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') { self.close(); }
      });
    },

    /**
     * تمييز الصفحة الحالية في القائمة.
     * المصدر: <body data-nav="local"> — والمقارنة مع data-nav-key في الروابط.
     * بهذه الطريقة يبقى ملف partials/navigation.html نسخة واحدة لكل الصفحات.
     */
    markActiveLink: function () {
      var key = document.body.getAttribute('data-nav');
      if (!key) { return; }

      var link = document.querySelector('.main-nav__link[data-nav-key="' + key + '"]');
      if (!link) { return; }

      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    },

    open: function () {
      document.body.classList.add('is-menu-open');
      if (this.opener) { this.opener.setAttribute('aria-expanded', 'true'); }
      this.drawer.removeAttribute('aria-hidden');

      // ننقل التركيز إلى أول عنصر داخل القائمة لسهولة التنقّل بالكيبورد
      var first = this.drawer.querySelector('button, a');
      if (first) { first.focus(); }
    },

    close: function () {
      if (!document.body.classList.contains('is-menu-open')) { return; }
      document.body.classList.remove('is-menu-open');
      if (this.opener) {
        this.opener.setAttribute('aria-expanded', 'false');
        this.opener.focus();
      }
      this.drawer.setAttribute('aria-hidden', 'true');
    }
  };

}(window, document));
