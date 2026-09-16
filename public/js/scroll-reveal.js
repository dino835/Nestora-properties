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

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    });
  }, {
    root: null,
    rootMargin: '-8% 0px -8% 0px',
    threshold: 0.08
  });

  function observePage(root) {
    (root || document).querySelectorAll(selector).forEach(function (element) {
      if (element.dataset.revealReady) return;
      element.dataset.revealReady = 'true';
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
