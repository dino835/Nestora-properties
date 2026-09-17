(function () {
  var selector = [
    '.filter-bar',
    '.main-content',
    '.section',
    '.nh-section',
    '.mortgage-wrap',
    '.page-hero > *',
    '.page-body > *',
    'footer .footer-grid'
  ].join(',');

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal once and stop watching — scrolling back up must never re-hide
  // content that has already been shown. Toggling the class off on scroll-up
  // was the source of the "upward scroll glitch" where sections flickered
  // and re-animated as the user scrolled back through them.
  var observer = !reduceMotion && 'IntersectionObserver' in window
    ? new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '-8% 0px -8% 0px',
        threshold: 0.08
      })
    : null;

  function observePage(root) {
    (root || document).querySelectorAll(selector).forEach(function (element) {
      if (element.dataset.revealReady) return;
      element.dataset.revealReady = 'true';

      if (reduceMotion || !observer) {
        // No motion, no flicker: show immediately, skip the animation entirely.
        element.classList.add('is-visible');
        return;
      }

      element.classList.add('reveal-on-scroll');
      observer.observe(element);
    });
  }

  observePage(document);

  new MutationObserver(function () {
    observePage(document);
  }).observe(document.body, { childList: true, subtree: true });

  window.addEventListener('pageshow', function () {
    observePage(document);
  });
}());
