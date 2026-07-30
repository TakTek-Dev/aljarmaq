/**
 * filters.js — التبويبات وتبديل العرض (قائمة ↔ شبكة)
 * ---------------------------------------------------------------------------
 * يُستخدم في: index.html · category.html · tag.html · search.html ·
 *             author.html · video-archive.html
 *
 * 1) مجموعة تبويبات:
 *      <div data-tabs> <button class="tab is-active">…</button> … </div>
 *    النقر ينقل الصنف is-active إلى الزرّ المضغوط.
 *
 * 2) تبديل العرض قائمة ↔ شبكة:
 *      <div data-view-toggle> <button data-view="list">…</button> … </div>
 *      <div class="posts posts--list" data-posts> …بطاقات .post-card… </div>
 *    البطاقات نفسها لا تتغيّر — يتبدّل صنف الحاوية فقط (راجع components.css).
 */
(function (window, document) {
  'use strict';

  var Aljarmaq = window.Aljarmaq = window.Aljarmaq || {};

  Aljarmaq.filters = {

    init: function () {
      this.initTabs();
      this.initViewToggle();
    },

    /* --- 1. التبويبات ---------------------------------------------------- */
    initTabs: function () {
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-tabs]'),
        function (group) {
          var tabs = group.querySelectorAll('.tab');

          Array.prototype.forEach.call(tabs, function (tab) {
            tab.addEventListener('click', function () {
              Array.prototype.forEach.call(tabs, function (other) {
                other.classList.remove('is-active');
                other.setAttribute('aria-pressed', 'false');
              });
              tab.classList.add('is-active');
              tab.setAttribute('aria-pressed', 'true');
            });
          });
        }
      );
    },

    /* --- 2. تبديل العرض قائمة ↔ شبكة ------------------------------------- */
    initViewToggle: function () {
      Array.prototype.forEach.call(
        document.querySelectorAll('[data-view-toggle]'),
        function (group) {
          var buttons = group.querySelectorAll('[data-view]');
          var lists   = document.querySelectorAll('[data-posts]');

          Array.prototype.forEach.call(buttons, function (button) {
            button.addEventListener('click', function () {
              var wanted = button.getAttribute('data-view');

              Array.prototype.forEach.call(buttons, function (other) {
                var on = other === button;
                other.classList.toggle('is-active', on);
                other.setAttribute('aria-pressed', on ? 'true' : 'false');
              });

              Array.prototype.forEach.call(lists, function (list) {
                list.classList.toggle('posts--list', wanted === 'list');
                list.classList.toggle('posts--grid', wanted === 'grid');
              });
            });
          });
        }
      );
    }
  };

}(window, document));
