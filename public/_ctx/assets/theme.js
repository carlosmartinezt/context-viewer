/* Runs before paint, so a chosen theme does not flash the default first.
   Classic script on purpose: a module would be deferred and too late.
   This is the copy the document frame loads; the workbench has the same
   two lines inline in its root layout. */
(function () {
  try {
    var ui = localStorage.getItem('cvUiTheme')
    if (ui) document.documentElement.setAttribute('data-ui-theme', ui)
  } catch (e) {}
})()
