(function () {
  let loading;
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  function loadStyle(src) {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = src;
      link.onload = resolve;
      link.onerror = reject;
      document.head.appendChild(link);
    });
  }
  window.ensureSimReport = function () {
    if (loading) return loading;
    const status = document.getElementById('sim-loading');
    status.hidden = false;
    loading = loadStyle('assets/legacy-style-9.css')
      .then(() => loadScript('assets/legacy-script-3.js'))
      .then(() => loadScript('assets/legacy-script-4.js'))
      .then(() => { status.hidden = true; })
      .catch(() => { status.textContent = '報告載入失敗，請重新整理頁面。'; });
    return loading;
  };
})();
