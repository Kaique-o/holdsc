/* Hold Contábil · camada de medição (card UX P1 Medição)
   GA4 e Meta Pixel ficam DENTRO do Google Tag Manager; este arquivo só:
     1. garante o dataLayer e carimba cada evento com event_id (deduplicação Pixel × API de Conversões) e area_site (site | campanha | blog);
     2. segura o consentimento num ponto só: evento de negócio só entra no dataLayer com escolha "all";
     3. carrega o GTM só depois de "Aceitar" (modo básico do Consent Mode v2), só com ID e só nos domínios da Hold;
     4. avisa o Pixel (fbq consent) quando a escolha muda;
     5. manda as conversões para a API de Conversões (Edge Function eventos-meta), se data-capi tiver endereço.

   Original: compartilhado/medicao/medicao.js. CÓPIA IDÊNTICA em site-real/assets/, site-cine/assets/ e site-blog/public/
   (mudou um, copie para os outros). Uso, no <head>, DEPOIS do consentimento.js e antes dos outros scripts:
     <script src="assets/medicao.js" data-secao="site" data-gtm="" data-capi=""></script>
   data-gtm vazio = GTM não carrega. data-capi vazio = nada vai para o servidor.
   Fora de holdcontabil.com.br nada carrega; em localhost, ?medir=1 libera (fica na aba; ?medir=0 desliga).

   API (window.holdMedicao):
     evento(nome, params) → empurra { event: nome, ...params } (com fila até a escolha); devolve o event_id
     novoId()             → um event_id novo
     escolha()            → "all" | "essential" | null
     config               → { gtm, capi, secao }
   window.holdTrack (se ainda não existir) = evento, para quem já chama holdTrack (formulário da campanha).
   Quem já usa dataLayer.push direto (site.js, blog) não precisa mudar nada: o carimbo e o filtro valem para todo push. */
(function () {
  "use strict";
  var w = window, d = document;
  if (w.holdMedicao) return;

  // next/script (blog) pode injetar sem currentScript: procura a própria tag pelo id ou pelo src.
  var tag = d.currentScript || d.getElementById("medicao") || d.querySelector('script[src*="medicao.js"]') || {}, ds = tag.dataset || {};
  var CFG = { gtm: (ds.gtm || "").trim(), capi: (ds.capi || "").trim(), secao: ds.secao || "site" };
  var dl = w.dataLayer = w.dataLayer || [];
  if (!w.gtag) w.gtag = function () { dl.push(arguments); };

  /* ---------- utilidades ---------- */
  function novoId() {
    try { if (w.crypto && crypto.randomUUID) return crypto.randomUUID(); } catch (e) {}
    return Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
  }
  function lerCookie(n) { var m = d.cookie.match(new RegExp("(?:^|; )" + n + "=([^;]*)")); return m ? decodeURIComponent(m[1]) : ""; }
  function sessao(k, v) { try { if (v === undefined) return sessionStorage.getItem(k); if (v === null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, v); } catch (e) {} return null; }

  /* ---------- consentimento (fonte: window.holdConsent do consentimento.js; plano B: localStorage) ---------- */
  function lerEscolha() {
    try { if (w.holdConsent && w.holdConsent.escolha) return w.holdConsent.escolha() || null; } catch (e) {}
    var v = null;
    try { v = localStorage.getItem("hold_consent"); } catch (e) {}
    if (v === "all" || v === "essential") return v;
    try { var j = JSON.parse(v); if (j && (j.escolha === "all" || j.escolha === "essential")) return j.escolha; } catch (e) {}
    return null;
  }
  var escolha = lerEscolha(), fila = [], interno = false;

  function mudou(nova) {
    if (nova !== "all" && nova !== "essential") nova = null;
    if (nova === escolha) return;
    escolha = nova;
    if (typeof w.fbq === "function") { try { w.fbq("consent", nova === "all" ? "grant" : "revoke"); } catch (e) {} }
    if (nova === "all") {
      // Depois que o consentimento.js terminar (gtag update + consent_update): a fila nunca chega antes do aceite.
      setTimeout(function () {
        if (escolha !== "all") return;
        var f = fila; fila = [];
        f.forEach(function (o) { empurrar(o); });
        carregarGtm();
      }, 0);
    } else if (nova === "essential") fila = [];
  }

  /* ---------- carimbo e filtro em todo dataLayer.push ---------- */
  var CAPI = { click_whatsapp: "Contact", generate_lead: "Lead", download_material: "Lead", sign_up: "Subscribe" };
  function eventoDeNegocio(o) {
    return o && typeof o === "object" && typeof o.event === "string" && typeof o.length !== "number" &&
      !/^gtm\./.test(o.event) && o.event !== "consent_update";
  }
  // Devolve false quando o evento não pode entrar (sem consentimento).
  function preparar(o) {
    if (o && typeof o === "object" && o.event === "consent_update") {
      var st = o.analytics_storage || o.analytics;
      mudou(st === "granted" ? "all" : st === "denied" ? "essential" : lerEscolha());
      return true;
    }
    if (!eventoDeNegocio(o)) return true;
    if (escolha !== "all") mudou(lerEscolha()); // a escolha pode ter sido gravada por quem não avisa
    if (escolha !== "all" && !interno) return false;
    if (!o.event_id) o.event_id = novoId();
    if (!o.area_site) o.area_site = CFG.secao;
    if (escolha === "all") capi(o);
    return true;
  }
  var pushOriginal = dl.push;
  dl.push = function () {
    var aceitos = [];
    for (var i = 0; i < arguments.length; i++) if (preparar(arguments[i])) aceitos.push(arguments[i]);
    return aceitos.length ? pushOriginal.apply(dl, aceitos) : dl.length;
  };
  // O que já estava no dataLayer antes deste arquivo: carimba e tira o que não tinha consentimento.
  for (var i = dl.length - 1; i >= 0; i--) if (!preparar(dl[i])) dl.splice(i, 1);

  function empurrar(o) { interno = true; try { dl.push(o); } finally { interno = false; } }

  function evento(nome, params) {
    var o = { event: nome };
    for (var k in params || {}) if (Object.prototype.hasOwnProperty.call(params, k) && params[k] !== undefined) o[k] = params[k];
    o.event_id = o.event_id || novoId();
    o.area_site = o.area_site || CFG.secao;
    if (escolha !== "all") mudou(lerEscolha());
    if (escolha === "all") empurrar(o);
    else if (escolha === null) fila.push(o);
    return o.event_id;
  }

  /* ---------- Google Tag Manager ---------- */
  (function () {
    var q = null; try { q = new URLSearchParams(location.search).get("medir"); } catch (e) {}
    if (q === "1") sessao("hold_medir", "1"); else if (q === "0") sessao("hold_medir", null);
  })();
  function dominioPermitido() {
    var h = location.hostname;
    if (/(^|\.)holdcontabil\.com\.br$/.test(h)) return true;
    return /^(localhost|127\.0\.0\.1|\[::1\])$/.test(h) && sessao("hold_medir") === "1";
  }
  var padraoProprio = false;
  function carregarGtm() {
    if (escolha !== "all" || !CFG.gtm || !dominioPermitido() || d.getElementById("gtm")) return;
    if (d.readyState === "loading") { d.addEventListener("DOMContentLoaded", carregarGtm, { once: true }); return; }
    // O consentimento.js já emite consent default/update. Sem ele (plano B), emitimos aqui, antes do gtm.js.
    if (!w.holdConsent && !padraoProprio) {
      padraoProprio = true;
      var neg = { analytics_storage: "denied", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", wait_for_update: 500 };
      w.gtag("consent", "default", neg);
      w.gtag("consent", "update", { analytics_storage: "granted", ad_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
    }
    dl.push({ "gtm.start": Date.now(), event: "gtm.js" });
    var s = d.createElement("script");
    s.id = "gtm"; s.async = true;
    s.src = "https://www.googletagmanager.com/gtm.js?id=" + encodeURIComponent(CFG.gtm);
    (d.head || d.documentElement).appendChild(s);
  }

  /* ---------- API de Conversões (Meta) ---------- */
  var PARAMS_CAPI = ["origem", "assunto", "intencao", "servico", "setor", "material", "canal", "area_site", "numero", "cidade", "porte", "pagina"];
  function fbc() {
    var c = lerCookie("_fbc"); if (c) return c;
    var id = null; try { id = new URLSearchParams(location.search).get("fbclid"); } catch (e) {}
    return id ? "fb.1." + Date.now() + "." + id : "";
  }
  function capi(o) {
    var nome = CAPI[o.event];
    if (!CFG.capi || !nome || !dominioPermitido() || !w.fetch) return;
    var extra = {};
    PARAMS_CAPI.forEach(function (k) { if (o[k] !== undefined && o[k] !== "") extra[k] = String(o[k]).slice(0, 120); });
    var corpo = { event_name: nome, event_id: o.event_id, evento_ga4: o.event, event_source_url: location.href,
      fbp: lerCookie("_fbp"), fbc: fbc(), consentimento: escolha, custom_data: extra };
    try {
      w.fetch(CFG.capi, { method: "POST", keepalive: true, headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo) })
        .catch(function () {});
    } catch (e) {}
  }

  /* ---------- ouvir o consentimento ---------- */
  w.addEventListener("hold:consentimento", function (e) {
    var x = e && e.detail; mudou(x && typeof x === "object" ? x.escolha : typeof x === "string" ? x : lerEscolha());
  });
  function ligarConsentimento() { try { if (w.holdConsent && w.holdConsent.aoMudar) w.holdConsent.aoMudar(mudou); } catch (e) {} mudou(lerEscolha()); }
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", ligarConsentimento, { once: true }); else ligarConsentimento();
  carregarGtm();

  w.holdMedicao = { evento: evento, novoId: novoId, escolha: function () { return escolha; }, config: CFG };
  // Páginas sem o site.js (campanha) chamam window.holdTrack; o site.js define o dele depois e substitui este.
  if (!w.holdTrack) w.holdTrack = evento;
})();
