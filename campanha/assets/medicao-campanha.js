/* Hold Contábil · eventos da campanha fora do formulário (card UX P1 Medição)
   Escuta cliques e envios no document e chama window.holdMedicao.evento (assets/medicao.js), sem mexer no script da
   página. Os eventos do formulário de proposta (form_start, select_intent, generate_lead…) saem do próprio script da
   página por window.holdTrack, que o medicao.js fornece na campanha; aqui ficam só:
     click_whatsapp    {origem, numero}  → conversão principal (Meta: Contact). Links wa.me de verdade (o envio do
                                           formulário abre o WhatsApp por window.open e já conta como generate_lead)
     download_material {material}        → planilha pedida (Meta: Lead)
     play_testimonial  {origem}          → depoimento em vídeo
   origem = data-origem do elemento, "botao_flutuante", "topo" ou o id da seção. */
(function () {
  "use strict";
  var d = document;
  function medir(nome, p) { if (window.holdMedicao) window.holdMedicao.evento(nome, p); }
  function origem(el) {
    if (el.dataset && el.dataset.origem) return el.dataset.origem;
    if (el.classList.contains("fab")) return "botao_flutuante";
    if (el.closest(".nav,header")) return "topo";
    var s = el.closest("section[id],footer");
    return s ? (s.id || "rodape") : "pagina";
  }

  d.addEventListener("click", function (e) {
    if (!e.target.closest) return;
    var a = e.target.closest("a[href]");
    if (a && /(^|\/\/)(wa\.me|api\.whatsapp\.com)\//.test(a.getAttribute("href"))) {
      var o = a.id === "f3-link" ? "formulario" : a.id === "g-link" ? "planilha" : origem(a);
      medir("click_whatsapp", { origem: o, numero: /5548998640303/.test(a.href) ? "terceirizou" : "geral" });
      return;
    }
    if (e.target.closest("#q-play")) {
      var ativo = d.querySelector('.reel button[aria-pressed="true"]');
      medir("play_testimonial", { origem: (ativo && ativo.dataset.w || "").split(" · ")[0] || "depoimento" });
    }
  }, true);

  // Depois do script da página (borbulha no document): só conta se a planilha foi pedida de fato.
  d.addEventListener("submit", function (e) {
    var ok = d.getElementById("g-ok");
    if (e.target.id === "gift" && ok && !ok.hidden) medir("download_material", { material: "planilha-fluxo-de-caixa", origem: "campanha" });
  });
})();
