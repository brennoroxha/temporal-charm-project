(function() {
  // 1. Bloqueio de atalhos comuns de inspeção
  document.addEventListener('keydown', function(e) {
    if (
      e.keyCode === 123 || // F12
      (e.ctrlKey && e.shiftKey && e.keyCode === 73) || // Ctrl+Shift+I
      (e.ctrlKey && e.shiftKey && e.keyCode === 74) || // Ctrl+Shift+J
      (e.ctrlKey && e.keyCode === 85) // Ctrl+U
    ) {
      e.preventDefault();
      return false;
    }
  });

  // 2. Bloqueio de clique direito
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
  });

  // 3. Detecção de Clone
  var originalDomain = "escolher-rec.lovable.app";
  var currentHost = window.location.hostname;
  if (currentHost !== originalDomain && 
      currentHost !== 'localhost' && 
      !currentHost.includes('lovable.app')) {
    // Clone detectado
  }
})();
