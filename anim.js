// Сайтовые анимации (reveal по скроллу), как на NoName Drop
// ВАЖНО: на телефонах контент НЕ скрываем (надёжность важнее анимации)
(function () {
  if (!('IntersectionObserver' in window)) return;

  // на узких экранах не скрываем контент вообще
  if (window.innerWidth < 700) return;

  function init() {
    var targets = document.querySelectorAll(
      '.project-card, .mod-card, #landing h1, #landing p, .btn-primary, section > h2, main > h1, .reveal'
    );
    if (!targets.length) return;

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add('nn-reveal-in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '200px 0px' });

    targets.forEach(function (el) {
      el.classList.add('nn-reveal');
      io.observe(el);
    });

    // страховка: через 2с показываем всё, даже если observer не сработал
    setTimeout(function () {
      document.querySelectorAll('.nn-reveal:not(.nn-reveal-in)').forEach(function (el) {
        el.classList.add('nn-reveal-in');
      });
      io.disconnect();
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
