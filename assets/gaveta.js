/* Gaveta do menu do celular (card UX P2, 17/11/2026).
   CÓPIA IDÊNTICA em site-real/assets/ e site-cine/assets/: mudou um, copie para o outro.
   O blog (site-blog/src/componentes/Cabecalho.tsx) segue a mesma lista em React.

   Gaveta({ botao, gaveta, fundo, desde, aoMudar })
   - abre/fecha pelo botão; fecha com Esc, toque no fundo, link escolhido, tela >= `desde` px e volta pelo "voltar" (bfcache);
   - <html class="menu-aberto"> trava a rolagem da página por trás (a gaveta rola sozinha);
   - foco vai para o primeiro link, fica preso entre o botão e a gaveta e volta ao botão (Esc e fundo);
   - altura medida até o fim da área visível (faixa de aviso acima, barra do Safari); o CSS desconta a safe-area. */
(function () {
  "use strict";
  var FOCAVEIS = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])';

  function Gaveta(o) {
    var bu = o.botao, dr = o.gaveta, fu = o.fundo, raiz = document.documentElement;
    if (!bu || !dr) return null;
    var mq = window.matchMedia("(min-width:" + (o.desde || 961) + "px)");

    function aberta() { return !dr.hidden; }
    function altura() {
      if (!aberta()) return;
      var vh = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      var topo = dr.getBoundingClientRect().top;
      dr.style.setProperty("--gaveta-max", Math.max(200, Math.round(vh - topo - 12)) + "px");
    }
    function mudar(abrir, devolverFoco) {
      if (abrir === aberta()) return;
      dr.hidden = !abrir;
      if (fu) fu.hidden = !abrir;
      bu.setAttribute("aria-expanded", String(abrir));
      bu.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
      raiz.classList.toggle("menu-aberto", abrir);
      if (abrir) {
        altura();
        dr.scrollTop = 0;
        var l = dr.querySelector("a[href]");
        if (l) l.focus({ preventScroll: true });
      } else if (devolverFoco) {
        bu.focus({ preventScroll: true });
      }
      if (o.aoMudar) o.aoMudar(abrir);
    }

    bu.addEventListener("click", function () { mudar(!aberta(), false); });
    if (fu) fu.addEventListener("click", function () { mudar(false, true); });
    dr.addEventListener("click", function (e) { if (e.target.closest("a")) mudar(false, false); });
    document.addEventListener("keydown", function (e) {
      if (!aberta()) return;
      if (e.key === "Escape") { e.preventDefault(); mudar(false, true); return; }
      if (e.key !== "Tab") return;
      var f = [bu].concat([].slice.call(dr.querySelectorAll(FOCAVEIS)));
      var p = f[0], u = f[f.length - 1], at = document.activeElement;
      if (f.indexOf(at) < 0) { e.preventDefault(); (e.shiftKey ? u : p).focus(); }
      else if (e.shiftKey && at === p) { e.preventDefault(); u.focus(); }
      else if (!e.shiftKey && at === u) { e.preventDefault(); p.focus(); }
    });
    var noDesktop = function (e) { if (e.matches) mudar(false, false); };
    if (mq.addEventListener) mq.addEventListener("change", noDesktop); else mq.addListener(noDesktop);
    window.addEventListener("pageshow", function (e) { if (e.persisted) mudar(false, false); });
    // resize também confere o desktop: alguns navegadores atrasam o "change" do matchMedia (aba em segundo plano)
    var aoRedimensionar = function () { if (mq.matches) mudar(false, false); else altura(); };
    window.addEventListener("resize", aoRedimensionar);
    if (window.visualViewport) window.visualViewport.addEventListener("resize", aoRedimensionar);

    return { abrir: function () { mudar(true, false); }, fechar: function () { mudar(false, false); }, aberta: aberta };
  }
  window.Gaveta = Gaveta;
})();
