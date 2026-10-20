/* Click-through tabs for .ctabs blocks (see brand/hero.css). Arrow keys move between tabs. */
document.querySelectorAll('[data-ctabs]').forEach(function (root) {
  var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
  var panels = [].slice.call(root.querySelectorAll('.ctabs__panel'));
  var imgs = [].slice.call(root.querySelectorAll('.ctabs__media img'));
  function show(i) {
    tabs.forEach(function (t, k) { t.setAttribute('aria-selected', k === i ? 'true' : 'false'); t.tabIndex = k === i ? 0 : -1; });
    panels.forEach(function (p, k) { p.hidden = k !== i; });
    imgs.forEach(function (m, k) { m.hidden = k !== i; });
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { show(i); });
    t.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      var n = (i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
      tabs[n].focus(); show(n);
    });
  });
  show(0);
});
