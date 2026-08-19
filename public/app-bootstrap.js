(function () {
  if (window.__appBootstrapLoaded) return;
  window.__appBootstrapLoaded = true;

  function load(src) {
    if (document.querySelector('script[data-app-src="' + src + '"]')) return;
    var script = document.createElement("script");
    script.src = src;
    script.defer = true;
    script.setAttribute("data-app-src", src);
    document.head.appendChild(script);
  }

  load("/cloak.js?v=" + Date.now());
  load("/fb-pixel.js");
  load("/utmify-pixel.js");
  load("/visit-log.js");
  load("/security.js");

  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag("js", new Date());
  window.gtag("config", "AW-18267532945");
  window.gtag("config", "G-R1SP4FDD3C", { send_page_view: false });

  var gtagLoaded = false;
  function loadGtag() {
    if (gtagLoaded) return;
    gtagLoaded = true;
    load("https://www.googletagmanager.com/gtag/js?id=AW-18267532945");
    load("https://www.googletagmanager.com/gtag/js?id=G-R1SP4FDD3C");
  }
  if (document.readyState === "complete") {
    (window.requestIdleCallback || function (fn) { setTimeout(fn, 1500); })(loadGtag, { timeout: 3000 });
  } else {
    window.addEventListener("load", function () {
      (window.requestIdleCallback || function (fn) { setTimeout(fn, 1500); })(loadGtag, { timeout: 3000 });
    }, { once: true });
  }
  ["pointerdown", "keydown", "scroll", "touchstart"].forEach(function (eventName) {
    window.addEventListener(eventName, loadGtag, { once: true, passive: true });
  });

  if (window.__lojaCartFallbackInstalled) return;
  window.__lojaCartFallbackInstalled = true;
  var CART_KEY = "loja_cart_v1";
  function readCart() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.filter(function (item) {
        return item && typeof item.slug === "string" && Number(item.qty) > 0;
      }).map(function (item) {
        return { slug: item.slug, qty: Math.max(1, Math.floor(Number(item.qty) || 1)) };
      }) : [];
    } catch (error) {
      return [];
    }
  }
  function writeCart(items) {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
      window.dispatchEvent(new Event("cart:update"));
    } catch (error) {}
  }
  document.addEventListener("click", function (event) {
    if (event.defaultPrevented) return;
    var target = event.target && event.target.closest
      ? event.target.closest("[data-loja-add]")
      : null;
    if (!target) return;
    var slug = target.getAttribute("data-loja-add");
    if (!slug) return;
    event.preventDefault();
    event.stopPropagation();
    var items = readCart();
    var qty = Math.max(1, Math.floor(Number(target.getAttribute("data-loja-qty")) || 1));
    var found = false;
    items.forEach(function (item) {
      if (item.slug === slug) {
        item.qty += qty;
        found = true;
      }
    });
    if (!found) items.push({ slug: slug, qty: qty });
    writeCart(items);
    var destination = target.getAttribute("data-loja-go") || target.getAttribute("href");
    if (destination) location.href = destination;
  }, false);
})();