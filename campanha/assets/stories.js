/* Modo story · campanha no celular (TESTE, 17/10/2026). Ver assets/stories.css para o que faz e como desligar.
   Carregado no <head> (sem defer) para ligar a classe antes de a página aparecer e não "pular". */
(function () {
  var html = document.documentElement;
  var desligado = false;
  try {
    var q = new URLSearchParams(location.search).get("stories");
    if (q === "0" || q === "1") localStorage.setItem("hold-stories", q); // ?stories=0 desliga e fica lembrado
    desligado = localStorage.getItem("hold-stories") === "0";
  } catch (e) {
    desligado = /[?&]stories=0/.test(location.search);
  }
  if (desligado) return;
  var celular = matchMedia("(max-width: 640px)");
  var aplicar = function () { html.classList.toggle("stories", celular.matches); };
  aplicar();
  celular.addEventListener("change", aplicar);

  document.addEventListener("DOMContentLoaded", function () {
    var telas = Array.prototype.slice.call(document.querySelectorAll("main > section, footer.ftr"));
    if (telas.length < 2) return;

    var barra = document.createElement("div");
    barra.className = "st-barra";
    barra.setAttribute("aria-hidden", "true");
    var partes = telas.map(function () { var i = document.createElement("i"), b = document.createElement("b"); i.appendChild(b); barra.appendChild(i); return b; });
    document.body.appendChild(barra);

    var dica = document.createElement("div");
    dica.className = "st-dica";
    dica.setAttribute("aria-hidden", "true");
    dica.textContent = "Toque para avançar ›";
    document.body.appendChild(dica);
    var esconderDica = function () { dica.classList.add("st-some"); };
    setTimeout(esconderDica, 4500);

    var atual = 0;
    var marcar = function () {
      var meio = innerHeight * 0.5, idx = 0;
      telas.forEach(function (t, i) { if (t.getBoundingClientRect().top <= meio) idx = i; });
      if (idx > 0) esconderDica();
      atual = idx;
      partes.forEach(function (b, i) { b.style.transform = "scaleX(" + (i <= idx ? 1 : 0) + ")"; });
    };
    var pedido = false;
    addEventListener("scroll", function () { if (!pedido) { pedido = true; requestAnimationFrame(function () { pedido = false; marcar(); }); } }, { passive: true });
    marcar();

    var irPara = function (i) {
      i = Math.max(0, Math.min(telas.length - 1, i));
      telas[i].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    };

    // toque como nos stories: lado direito avança, esquerdo volta. Não mexe em nada clicável nem nos carrosséis.
    var interativo = "a,button,input,select,textarea,label,summary,video,[role=button],[tabindex],.nav,.drawer,.modal,.paths,.people,.reel,.rail,.rail-wrap,.track,.screen,form";
    document.addEventListener("click", function (ev) {
      if (!html.classList.contains("stories") || ev.defaultPrevented) return;
      if (ev.target.closest && ev.target.closest(interativo)) return;
      if (getSelection && String(getSelection()).length) return;
      marcar(); // posição pode ter mudado sem evento de scroll (ex.: o navegador restaurou a rolagem)
      var x = ev.clientX / innerWidth;
      var suave = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
      if (x >= 0.62) {
        esconderDica();
        // tela mais alta que o celular (ex.: formulário): primeiro mostra o resto dela
        var r = telas[atual].getBoundingClientRect();
        if (r.bottom > innerHeight + 24) scrollBy({ top: Math.min(r.bottom - innerHeight, innerHeight * 0.8), behavior: suave });
        else irPara(atual + 1);
      } else if (x <= 0.28) irPara(atual - 1);
    });
  });
})();
