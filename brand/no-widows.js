/* No one-word last lines (Emily, 2026-10-08): glue the last two words of every
   heading, paragraph and list item with a non-breaking space. Pairs with the
   text-wrap rule in brand/nav.css, and works in browsers that ignore it. */
(function () {
  var NBSP = ' '
  function glue(el) {
    var w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT), last = null, prev = null
    while (w.nextNode()) if (/\S/.test(w.currentNode.data)) { prev = last; last = w.currentNode }
    if (!last) return
    var t = last.data.replace(/\s+$/, ''), tail = last.data.slice(t.length)
    var i = t.search(/\s+\S+$/)
    // "…two words": join them.
    if (i > 0) { last.data = t.slice(0, i) + NBSP + t.slice(i).replace(/^\s+/, '') + tail; return }
    // " word" after an inline element: bind it to that element.
    if (i === 0) { last.data = NBSP + t.replace(/^\s+/, '') + tail; return }
    // A lone word in its own element (<strong>CODE</strong>, a link): glue the space before it.
    if (prev && /\S\s+$/.test(prev.data)) prev.data = prev.data.replace(/\s+$/, NBSP)
  }
  function run() {
    var els = document.querySelectorAll('h1, h2, h3, h4, p, li, blockquote')
    for (var k = 0; k < els.length; k++) {
      var el = els[k]
      if (el.closest('nav, .cleo-nav, footer') || el.isContentEditable) continue
      if ((el.textContent || '').trim().split(/\s+/).length < 4) continue
      glue(el)
    }
  }
  function start() {
    run()
    // Some pages draw text after load (Book Care packages): run again when they do.
    var timer = null
    new MutationObserver(function () { clearTimeout(timer); timer = setTimeout(run, 60) })
      .observe(document.body, { childList: true, subtree: true })
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start()
})()
