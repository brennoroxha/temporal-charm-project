// Registra visita (funil home -> checkout) no painel admin.
(function () {
  try {
    var KEY = '_lv_sid';
    var sid = null;
    try { sid = localStorage.getItem(KEY); } catch (e) {}
    if (!sid) {
      sid = (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).slice(2));
      try { localStorage.setItem(KEY, sid); } catch (e) {}
    }

    var qs = new URLSearchParams(location.search);
    var stored = (typeof window.getStoredUtms === 'function') ? window.getStoredUtms() : {};
    function utm(k) { return qs.get(k) || stored[k] || ''; }

    // Captura o ID da campanha do Google Ads que vem como gad_campaignid ou campaignid
    var rawGoogleCampaignId = utm('gad_campaignid');
    var campaignId = /^2\d{10}$/.test(rawGoogleCampaignId) ? rawGoogleCampaignId : '';

    var body = {
      path: location.pathname + location.search,
      referrer: document.referrer || '',
      session_id: sid,
      utm_source: utm('utm_source'),
      utm_medium: utm('utm_medium'),
      utm_campaign: utm('utm_campaign') || campaignId,
      utm_content: utm('utm_content') || utm('ad_id'),
      utm_term: utm('utm_term') || utm('adgroup_id')
    };

    var url = (typeof window.apiUrl === 'function') ? window.apiUrl('/api/public/log-visit') : '/api/public/log-visit';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true
    }).catch(function () {});
  } catch (e) {}
})();
