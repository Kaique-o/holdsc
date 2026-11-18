/* Hold Contábil · aviso de cookies e consentimento (LGPD + Consent Mode v2)
   ORIGINAL: compartilhado/consentimento/. Cópias idênticas em site-real/assets/ e site-blog/public/
   (mudou um, copie para os outros). Carregar SEM defer no <head>, antes do GTM e do site.js:
     <link rel="stylesheet" href="consentimento.css">
     <script src="consentimento.js" data-politica="politica-de-privacidade.html"></script>

   API (window.holdConsent):
     escolha()    → "all" | "essential" | null (null = ainda não escolheu)
     abrir()      → reabre a barra (os elementos [data-cookie-reset] já chamam); nunca abre duas
     aoMudar(fn)  → fn(escolha) a cada decisão; devolve uma função que cancela
   dataLayer:
     ao carregar: gtag("consent","default", tudo negado, wait_for_update 500) e, se já escolheu, gtag("consent","update")
     a cada escolha: gtag("consent","update") + { event:"consent_update", pagina, analytics, analytics_storage,
     ad_storage, ad_user_data, ad_personalization } (a recusa também vai, para contar no GTM)
   DOM: evento "hold:consentimento" no window (detail.escolha).
   CSS: a barra publica a própria altura em --aviso-h no <html> (0px sem barra), para FAB e afins subirem. */
(function () {
  "use strict";
  if (window.holdConsent) return;
  var w = window, d = document, CHAVE = "hold_consent";
  var script = d.currentScript || d.querySelector("script[data-politica]");
  var POLITICA = (script && script.getAttribute("data-politica")) || "politica-de-privacidade.html";
  var reduzir = w.matchMedia && w.matchMedia("(prefers-reduced-motion: reduce)").matches;

  w.dataLayer = w.dataLayer || [];
  if (!w.gtag) w.gtag = function () { w.dataLayer.push(arguments); };

  function ler() {
    try { var v = localStorage.getItem(CHAVE); return v === "all" || v === "essential" ? v : null; } catch (e) { return null; }
  }
  function estados(e) {
    var s = e === "all" ? "granted" : "denied";
    return { analytics_storage: s, ad_storage: s, ad_user_data: s, ad_personalization: s };
  }

  var escolha = ler(), ouvintes = [], barra = null, origem = null;
  w.gtag("consent", "default", Object.assign(estados(null), { wait_for_update: 500 }));
  if (escolha) w.gtag("consent", "update", estados(escolha));

  /* Revogar: apaga os cookies de medição já gravados (GA4, Google Ads, Meta) no domínio e no domínio-pai. */
  function apagarCookiesDeMedicao() {
    var nomes = d.cookie.split(";").map(function (c) { return c.split("=")[0].trim(); })
      .filter(function (n) { return /^(_ga|_ga_.+|_gid|_gcl_.+|_fbp|_fbc|_clck|_clsk)$/.test(n); });
    var partes = location.hostname.split("."), dominios = [""];
    for (var i = 0; i < partes.length - 1; i++) dominios.push("; domain=." + partes.slice(i).join("."));
    nomes.forEach(function (n) {
      dominios.forEach(function (dom) { d.cookie = n + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/" + dom; });
    });
  }

  function decidir(e) {
    var antes = escolha;
    escolha = e;
    try { localStorage.setItem(CHAVE, e); localStorage.setItem(CHAVE + "_em", new Date().toISOString()); } catch (x) {}
    var st = estados(e);
    w.gtag("consent", "update", st);
    w.dataLayer.push(Object.assign({ event: "consent_update", pagina: w.HOLD_PAGE || d.title, analytics: st.analytics_storage }, st));
    if (antes === "all" && e !== "all") apagarCookiesDeMedicao();
    ouvintes.slice().forEach(function (fn) { try { fn(e); } catch (x) { setTimeout(function () { throw x; }); } });
    try { w.dispatchEvent(new CustomEvent("hold:consentimento", { detail: { escolha: e } })); } catch (x) {}
    fechar();
  }

  function altura(px) { d.documentElement.style.setProperty("--aviso-h", px + "px"); }
  var observador = w.ResizeObserver ? new ResizeObserver(function () { if (barra) altura(barra.offsetHeight); }) : null;

  function montar(pelaPessoa) {
    if (barra) { if (pelaPessoa) { if (!origem) origem = d.activeElement; focar(); } return; }
    origem = pelaPessoa ? d.activeElement : null;
    barra = d.createElement("section");
    barra.className = "aviso-cookies";
    barra.setAttribute("aria-label", "Aviso de cookies");
    barra.innerHTML =
      '<div class="aviso-cookies-in">' +
      '<p>Cookies de análise só com o seu aceite. <a href="' + POLITICA + '">Saiba mais</a></p>' +
      '<div class="aviso-cookies-bts">' +
      '<button type="button" class="aviso-cookies-bt" data-escolha="essential">Só essenciais</button>' +
      '<button type="button" class="aviso-cookies-bt aviso-cookies-bt--sim" data-escolha="all">Aceitar</button>' +
      "</div></div>";
    [].forEach.call(barra.querySelectorAll("[data-escolha]"), function (b) {
      if (escolha) b.setAttribute("aria-pressed", String(b.getAttribute("data-escolha") === escolha));
      b.addEventListener("click", function () { decidir(b.getAttribute("data-escolha")); });
    });
    d.body.appendChild(barra);
    d.documentElement.classList.add("tem-aviso-cookies");
    altura(barra.offsetHeight);
    if (observador) observador.observe(barra);
    // Entrada: força o estilo inicial (fora da tela) e só então liga a classe; a transição fica no CSS.
    void barra.offsetWidth;
    barra.classList.add("on");
    if (pelaPessoa) focar();
  }
  function focar() {
    var b = barra.querySelector('[aria-pressed="true"]') || barra.querySelector("[data-escolha]");
    if (b) b.focus({ preventScroll: true });
  }
  function fechar() {
    if (!barra) return;
    var el = barra, voltar = origem;
    barra = null; origem = null;
    if (observador) observador.unobserve(el);
    altura(0);
    d.documentElement.classList.remove("tem-aviso-cookies");
    if (voltar && voltar.focus && d.contains(voltar)) voltar.focus({ preventScroll: true });
    if (reduzir) { el.remove(); return; }
    el.classList.remove("on");
    el.classList.add("saindo");
    setTimeout(function () { el.remove(); }, 180);
  }

  w.holdConsent = {
    escolha: function () { return escolha; },
    abrir: function () { if (d.body) montar(true); },
    aoMudar: function (fn) {
      ouvintes.push(fn);
      return function () { var i = ouvintes.indexOf(fn); if (i >= 0) ouvintes.splice(i, 1); };
    }
  };

  d.addEventListener("click", function (e) {
    var r = e.target.closest && e.target.closest("[data-cookie-reset]");
    if (r) { e.preventDefault(); montar(true); }
  });

  function iniciar() { if (!escolha) setTimeout(function () { if (!escolha) montar(false); }, reduzir ? 0 : 400); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", iniciar); else iniciar();
})();
