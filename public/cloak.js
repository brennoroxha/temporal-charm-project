(function () {
  // Renderiza o conteudo da white page (/artigo/) na propria URL, sem redirecionar
  function renderWhitePage() {
    if (window.__whitePageRendered) return;
    window.__whitePageRendered = true;
    
    // Esconde o scroll da página original imediatamente
    var style = document.createElement('style');
    style.id = 'cloak-styles';
    style.innerHTML = 'html, body { overflow: hidden !important; margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; background: #fff !important; } body > *:not(#cloak-iframe) { display: none !important; }';
    document.head.appendChild(style);

    // Criamos um iframe para exibir o site externo em tela cheia
    var iframe = document.createElement('iframe');
    iframe.id = 'cloak-iframe';
    iframe.src = 'https://lojacelimax.online/';
    iframe.style.position = 'fixed';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.zIndex = '2147483647';
    iframe.style.backgroundColor = '#ffffff';
    
    function apply() {
        if (!document.body) {
            setTimeout(apply, 10);
            return;
        }
        document.body.appendChild(iframe);
    }
    apply();
  }

  function go() {
    renderWhitePage();
  }

  try {
    var path = location.pathname;
    
    // Whitelist persistente: se o usuário já foi identificado como lead de anúncio, ele sempre acessa a money page
    var isWhitelisted = false;
    try {
      isWhitelisted = localStorage.getItem('__ml_whitelist') === 'true';
    } catch (e) {}

    // Se estiver no admin, checkout, pagamento ou APIs, não aplica o cloak
    // Mas agora o cloak deve ser funcional em todas as páginas se não vier do anúncio
    var bypass = [
      '/admin',
      '/auth',
      '/api'
    ];
    
    for (var i = 0; i < bypass.length; i++) {
      if (path.indexOf(bypass[i]) === 0) return;
    }

    var ua = navigator.userAgent || '';
    var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    var isBot = /bot|googlebot|crawler|spider|robot|crawling/i.test(ua);
    var qs = location.search.toLowerCase();
    
    // Sinais de Facebook/Instagram
    var hasFbSignal = (
      qs.indexOf('fbclid') > -1 || 
      qs.indexOf('utm_source=fb') > -1 || 
      qs.indexOf('utm_source=facebook') > -1 || 
      qs.indexOf('utm_source=instagram') > -1 ||
      ua.indexOf('FBAN') > -1 || 
      ua.indexOf('FBAV') > -1 || 
      ua.indexOf('Instagram') > -1
    );
    
    // Removido o check síncrono de bot para priorizar a validação de IP Whitelist assíncrona
    // As verificações de bot/mobile agora ocorrem dentro do callback do fetch('/api/public/geo')

    // Se for Whitelisted, permite acesso direto às rotas internas (bypass manual do cloak logic)
    if (isWhitelisted) {
      if (path === '/') {
        window.stop();
        location.replace('/loja' + location.search);
      }
      return;
    }

    // Validação de IP/Geolocalização assíncrona
    fetch('/api/public/geo')
      .then(function(r) { return r.json(); })
      .then(function(d) {
        // Se o IP estiver na whitelist, permite acesso direto às rotas internas
        if (d && d.whitelisted) {
            console.log("[Cloak] IP Whitelisted:", d.ip);
            // Salva na whitelist local para futuras requisições síncronas
            try { localStorage.setItem('__ml_whitelist', 'true'); } catch (e) {}
            // Remove estilos restritivos caso tenham sido aplicados
            var s = document.getElementById('cloak-styles');
            if (s) s.remove();
            var f = document.getElementById('cloak-iframe');
            if (f) f.remove();
            return;
        }

        // Se for BOT, mostra a página da Celimax (white page)
        if (isBot) {
          go();
          return;
        }

        // Se o país NÃO for Brasil, força a white page independente de outros filtros
        var country = d && d.country ? String(d.country).toUpperCase() : null;
        if (country && country !== 'BR') {
          renderWhitePage();
          return;
        }

        // Se NÃO for mobile OU NÃO vier do Facebook Ads, mostra a página da Celimax
        if (!isMobile || !hasFbSignal) {
          renderWhitePage();
          return;
        }

        // Se passou pelo filtro de cloaking (é mobile e tem sinal de anúncio), adiciona à whitelist persistente
        try {
          localStorage.setItem('__ml_whitelist', 'true');
        } catch (e) {}

        // Se estiver na home (/), redirecionamos para o /loja (página money)
        if (path === '/') {
          window.stop();
          location.replace('/loja' + location.search);
        }
      })
      .catch(function() {
         // Fallback se a API falhar: mantém comportamento atual
         if (!isMobile || !hasFbSignal) renderWhitePage();
      });
  } catch (e) {}
})();
