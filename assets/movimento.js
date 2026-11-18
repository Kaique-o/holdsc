/* Movimento · motor de animação do site oficial e da campanha.
   CÓPIA IDÊNTICA em site-real/assets/movimento.js e site-cine/assets/movimento.js (os dois sites são servidos
   separados): mudou um, copie para o outro. Cada site diz o que animar chamando:
     Movimento({ revelar, cascata, paralaxe, inclinar })   // todos são seletores CSS
   - revelar:  blocos que sobem e aparecem quando entram na tela (uma vez só)
   - cascata:  grades cujos filhos entram um depois do outro (90 ms entre eles, no máximo 5 passos)
   - paralaxe: imagens (ou fundos) dentro de uma moldura com overflow:hidden; andam mais devagar que a página
   - inclinar: cartões clicáveis que sobem e inclinam seguindo o ponteiro
   Respeita "reduzir movimento" do sistema; paralaxe só em tela larga; inclinação só com mouse. */
(function () {
  var reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var mouse = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var largo = matchMedia("(min-width: 860px)");
  var todos = function (s) { return s ? Array.prototype.slice.call(document.querySelectorAll(s)) : []; };

  function revelar(cfg) {
    if (reduz || !("IntersectionObserver" in window)) return;
    var grades = todos(cfg.cascata), alvos = [], atraso = new Map();
    grades.forEach(function (g) {
      Array.prototype.forEach.call(g.children, function (f, i) { atraso.set(f, Math.min(i, 5) * 90); alvos.push(f); });
    });
    todos(cfg.revelar).forEach(function (e) { if (grades.indexOf(e) < 0 && alvos.indexOf(e) < 0) alvos.push(e); });
    // não anima filho e pai ao mesmo tempo: fica só o mais de fora
    alvos = alvos.filter(function (e) { for (var p = e.parentElement; p; p = p.parentElement) if (alvos.indexOf(p) >= 0) return false; return true; });
    var pendentes = [];
    var mostrar = function (el) {
      var i = pendentes.indexOf(el);
      if (i < 0) return;
      pendentes.splice(i, 1);
      io.unobserve(el);
      var d = atraso.get(el) || 0;
      el.style.transitionDelay = d + "ms";
      el.setAttribute("data-rv", "on");
      // terminou: tira o estado de revelação para não atrasar os hovers do elemento
      setTimeout(function () { el.removeAttribute("data-rv"); el.style.transitionDelay = ""; }, d + 1300);
    };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) mostrar(e.target); });
    }, { rootMargin: "0px 0px -8% 0px" });
    var dobra = innerHeight * 0.92;
    alvos.forEach(function (el) {
      if (el.getBoundingClientRect().top < dobra) return; // já está na tela ao abrir: não esconde (sem piscar)
      el.setAttribute("data-rv", "");
      pendentes.push(el);
      io.observe(el);
    });
    // garantia: se o observador não disparar (aba em segundo plano, navegador antigo), confere na rolagem;
    // e nada fica escondido ao imprimir
    var espera = 0;
    addEventListener("scroll", function () {
      if (espera || !pendentes.length) return;
      espera = setTimeout(function () {
        espera = 0;
        pendentes.slice().forEach(function (el) { if (el.getBoundingClientRect().top < innerHeight * 0.92) mostrar(el); });
      }, 150);
    }, { passive: true });
    addEventListener("beforeprint", function () { pendentes.slice().forEach(mostrar); });
  }

  function paralaxe(cfg) {
    if (reduz) return;
    var itens = todos(cfg.paralaxe);
    if (!itens.length) return;
    var ativos = new Set(), pedido = false;
    var quadro = function () {
      pedido = false;
      if (!largo.matches) { itens.forEach(function (el) { el.style.transform = ""; }); return; }
      var vh = innerHeight;
      ativos.forEach(function (el) {
        var r = el.parentElement.getBoundingClientRect();
        var p = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / (vh / 2 + r.height / 2)));
        el.style.transform = "translate3d(0," + (-p * r.height * 0.04).toFixed(1) + "px,0) scale(1.1)";
      });
    };
    var pedir = function () { if (!pedido) { pedido = true; requestAnimationFrame(quadro); } };
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) ativos.add(e.target); else ativos.delete(e.target); });
      pedir();
    }, { rootMargin: "160px 0px" });
    itens.forEach(function (el) { el.classList.add("mv-plx"); io.observe(el); });
    addEventListener("scroll", pedir, { passive: true });
    addEventListener("resize", pedir);
  }

  function inclinar(cfg) {
    if (reduz || !mouse) return;
    todos(cfg.inclinar).forEach(function (el) {
      el.classList.add("mv-incl");
      var quadro = 0, ultimo;
      el.addEventListener("pointermove", function (ev) {
        ultimo = ev;
        if (quadro) return;
        quadro = requestAnimationFrame(function () {
          quadro = 0;
          var r = el.getBoundingClientRect();
          var x = (ultimo.clientX - r.left) / r.width - 0.5, y = (ultimo.clientY - r.top) / r.height - 0.5;
          var k = Math.min(1, 420 / r.width); // cartão largo inclina menos (senão a ponta "foge")
          el.style.transform = "perspective(1100px) translateY(-4px) rotateX(" + (-y * 3 * k).toFixed(2) + "deg) rotateY(" + (x * 4 * k).toFixed(2) + "deg)";
        });
      });
      el.addEventListener("pointerleave", function () { cancelAnimationFrame(quadro); quadro = 0; el.style.transform = ""; });
    });
  }

  window.Movimento = function (cfg) {
    document.documentElement.classList.add("mv");
    revelar(cfg); paralaxe(cfg); inclinar(cfg);
  };
})();
