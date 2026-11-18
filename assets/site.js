/* Hold Contábil · comportamento compartilhado do site */
(function(){
  "use strict";
  var ROOT = window.HOLD_ROOT || "";
  var PAGE = window.HOLD_PAGE || document.title;
  var WA = "554830524321";
  var WA_TERCEIRIZOU = "5548998640303"; // 48 99864-0303 (a confirmar com a Hold, ver mapa-placeholders)
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  function store(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}
  function keep(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

  /* ============ telefone (BR): 10 ou 11 dígitos, DDD válido, celular começa com 9 ============
     Mesma regra em site-cine/prototipo-cinema-hold.html (a campanha não carrega este arquivo). */
  function foneDigitos(v){var d=String(v||"").replace(/\D/g,"");if(d.length>11&&d.slice(0,2)==="55")d=d.slice(2);return d.slice(0,11)}
  function foneValido(v){return /^[1-9][1-9](?:9\d{8}|[2-5]\d{7})$/.test(foneDigitos(v))}
  function foneMascara(v){var d=foneDigitos(v);if(!d)return "";if(d.length<3)return "("+d;
    var n=d.length===11?5:4;return "("+d.slice(0,2)+") "+d.slice(2,2+n)+(d.length>2+n?"-"+d.slice(2+n):"")}
  window.holdFone={digitos:foneDigitos,valido:foneValido,mascara:foneMascara};
  document.addEventListener("input",function(e){var i=e.target;if(!i.matches||!i.matches("input[type=tel]"))return;var m=foneMascara(i.value);if(m!==i.value)i.value=m});

  /* ============ modo depuração ============
     O painel "Rastreamento" (eventos do dataLayer) só aparece com ?debug=1 na URL;
     fica ligado nesta aba (sessionStorage) até ?debug=0 ou até fechar a aba. */
  var DEBUG = (function(){
    var q=null;try{q=new URLSearchParams(location.search).get("debug")}catch(e){}
    if(q==="1")store("hold_debug","1");
    if(q==="0"){try{sessionStorage.removeItem("hold_debug")}catch(e){}}
    return store("hold_debug")==="1";
  })();

  /* ============ rastreamento + consentimento (LGPD) ============ */
  window.dataLayer = window.dataLayer || [];
  // A escolha e a barra são do consentimento.js (window.holdConsent); aqui só a fila de eventos.
  var HC = window.holdConsent, consent = HC ? HC.escolha() : keep("hold_consent"), pending = [], count = 0, list, counter;
  function ui(){
    var b=document.createElement("button");b.className="trk-btn";b.type="button";b.setAttribute("aria-expanded","false");
    b.innerHTML='Rastreamento <span class="n">0</span>';
    var p=document.createElement("aside");p.className="trk";p.hidden=true;p.setAttribute("aria-label","Eventos de rastreamento");
    p.innerHTML='<div class="trk-h"><b>Eventos para GA4 e Meta Pixel</b><span>Modo depuração · some com ?debug=0</span></div><div class="trk-list"><p class="trk-empty">Nenhum evento ainda nesta página.</p></div>';
    b.addEventListener("click",function(){p.hidden=!p.hidden;b.setAttribute("aria-expanded",String(!p.hidden))});
    document.body.appendChild(p);document.body.appendChild(b);
    list=$(".trk-list",p);counter=$(".n",b);
  }
  function render(ev,params,wait){
    if(!list)return null;
    var e=$(".trk-empty",list);if(e)e.remove();
    var d=document.createElement("div");d.className="trk-item"+(wait?" wait":"");
    var b=document.createElement("b");b.textContent=ev;var s=document.createElement("span");s.textContent=JSON.stringify(params);
    d.appendChild(b);d.appendChild(s);list.prepend(d);counter.textContent=++count;return d;
  }
  function track(ev,params){
    params=Object.assign({pagina:PAGE},params||{});
    if(consent==="all"){dataLayer.push(Object.assign({event:ev},params));render(ev,params)}
    else if(consent==="essential"){render(ev+" (não enviado)",params)}
    else pending.push({ev:ev,params:params,el:render(ev,params,true)});
  }
  window.holdTrack = track;
  function cookieBanner(){
    // A barra, o "Preferências de cookies" ([data-cookie-reset]), o consent_update no dataLayer e o Consent Mode
    // ficam no consentimento.js. Aqui só reage à escolha: solta (ou descarta) a fila de eventos da página.
    if(!HC||cookieBanner.ligado)return;cookieBanner.ligado=true;
    HC.aoMudar(function(e){
      consent=e;
      render("consent_update",{analytics:e==="all"?"granted":"denied"});
      // O envio não depende do painel de depuração: sem ele, p.el é null.
      pending.forEach(function(p){
        if(consent==="all")dataLayer.push(Object.assign({event:p.ev},p.params));
        if(!p.el)return;p.el.classList.remove("wait");
        if(consent!=="all")$("b",p.el).textContent=p.ev+" (não enviado)"});
      pending=[];
    });
  }

  /* ============ WhatsApp com contexto ============ */
  function waLink(origem,texto,terceirizou,direto){
    var txt=texto||"Olá! Vim pelo site da Hold ("+PAGE+") e quero falar com um especialista.";
    // A terceirização financeira (Terceirizou) tem WhatsApp próprio.
    // `direto` = WhatsApp corporativo de uma pessoa do time (campo `whatsapp` em data.js → time); sem ele, o geral.
    var numero=direto||(terceirizou||/terceirizacao-financeira/.test(location.pathname)?WA_TERCEIRIZOU:WA);
    return "https://wa.me/"+numero+"?text="+encodeURIComponent(txt);
  }
  function fab(){
    // Mesmo assunto da página: o primeiro botão de WhatsApp com data-wa-texto (herói/bloco), fora os de uma pessoa.
    var ref=$("[data-wa][data-wa-texto]:not([data-wa-numero])");
    var a=document.createElement("a");a.className="fab";a.href=waLink("botao_flutuante",ref?"Olá! Vim pelo site da Hold ("+PAGE+"). "+ref.dataset.waTexto:"");a.target="_blank";a.rel="noopener";
    a.setAttribute("aria-label","Falar no WhatsApp");a.dataset.trk="click_whatsapp";a.dataset.origem="botao_flutuante";
    a.innerHTML='<span class="bubble">Falar no WhatsApp</span><span class="circle">'+WA_SVG+'</span>';
    document.body.appendChild(a);
  }
  var WA_SVG='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9 0-1.4.7-2 1-2.3.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>';

  /* ============ cliques rastreados ============ */
  document.addEventListener("click",function(e){
    var a=e.target.closest("[data-trk]");if(!a)return;
    var p={};["origem","setor","servico","destino","material","pessoa","canal"].forEach(function(k){if(a.dataset[k])p[k]=a.dataset[k]});
    track(a.dataset.trk,p);
  });

  /* ============ nav: dropdowns e menu mobile ============ */
  function nav(){
    $$(".dd>button").forEach(function(b){
      var panel=document.getElementById(b.getAttribute("aria-controls"));
      b.addEventListener("click",function(e){e.stopPropagation();var open=b.getAttribute("aria-expanded")==="true";closeAll();if(!open){b.setAttribute("aria-expanded","true");panel.hidden=false}});
    });
    function closeAll(){$$(".dd>button").forEach(function(x){x.setAttribute("aria-expanded","false");var p=document.getElementById(x.getAttribute("aria-controls"));if(p)p.hidden=true})}
    document.addEventListener("click",function(e){if(!e.target.closest(".dd"))closeAll()});
    document.addEventListener("keydown",function(e){if(e.key==="Escape")closeAll()});
    // Menu do celular: assets/gaveta.js (Esc, toque no fundo, link, desktop, foco preso, rolagem travada, altura medida).
    if(window.Gaveta)Gaveta({botao:$(".burger"),gaveta:$("#drawer"),fundo:$(".gaveta-fundo"),desde:961});
    var dl=$(".deadline button");if(dl)dl.addEventListener("click",function(){$(".deadline").hidden=true});
    // data-wa-texto: assunto da mensagem (ex.: "Quero falar com Ana, de revendas."); data-wa-numero: contato direto da pessoa
    $$("[data-wa]").forEach(function(a){a.href=waLink(a.dataset.origem||"link",a.dataset.waTexto?"Olá! Vim pelo site da Hold ("+PAGE+"). "+a.dataset.waTexto:"",false,a.dataset.waNumero||"");a.target="_blank";a.rel="noopener";a.dataset.trk="click_whatsapp"});
  }

  /* ============ serviços: lista que troca a imagem ============ */
  function svcList(){
    $$(".svc-list").forEach(function(w){
      var items=$$(".svc-item",w),imgs=$$(".svc-media .ph",w);
      function on(i){items.forEach(function(x,j){x.classList.toggle("on",j===i);x.setAttribute("aria-expanded",String(j===i))});imgs.forEach(function(x,j){x.classList.toggle("on",j===i)})}
      items.forEach(function(it,i){it.addEventListener("click",function(){on(i)});it.addEventListener("mouseenter",function(){if(matchMedia("(hover:hover)").matches)on(i)});it.addEventListener("focus",function(){on(i)})});
      on(0);
    });
  }

  /* ============ carrosséis e letreiros ============ */
  function carousels(){
    $$("[data-carousel]").forEach(function(w){
      var sc=$(".news",w);if(!sc)return;
      $$("[data-dir]",w).forEach(function(b){b.addEventListener("click",function(){var card=$(".story",sc);var dx=(card?card.getBoundingClientRect().width+16:600)*(+b.dataset.dir);sc.scrollBy({left:dx,behavior:reduce?"auto":"smooth"})})});
      var bordas=function(){var fim=sc.scrollWidth-sc.clientWidth;sc.classList.toggle("tem-antes",sc.scrollLeft>4);sc.classList.toggle("tem-depois",sc.scrollLeft<fim-4)};
      sc.addEventListener("scroll",bordas,{passive:true});addEventListener("resize",bordas);bordas();
    });
    $$(".clients .rowx").forEach(function(r){r.innerHTML+=r.innerHTML;$$(".client,.logo-cli",r).forEach(function(c,i,a){if(i>=a.length/2)c.setAttribute("aria-hidden","true")})});
  }

  /* ============ celular: indicador de posição dos carrosséis de arrastar ============ */
  function carDots(){
    $$(".sectors,.people,.prows,.tall,.intents,.pains,.related,.posts").forEach(function(t){
      var n=t.children.length;if(n<2)return;
      var d=document.createElement("div");d.className="car-dots";d.setAttribute("aria-hidden","true");
      for(var i=0;i<n;i++)d.appendChild(document.createElement("i"));
      t.insertAdjacentElement("afterend",d);
      var tique=false;
      function marcar(){tique=false;var passo=t.children[1].offsetLeft-t.children[0].offsetLeft||1;
        var at=t.scrollLeft>=t.scrollWidth-t.clientWidth-4?n-1:Math.round(t.scrollLeft/passo);
        for(var k=0;k<n;k++)d.children[k].classList.toggle("on",k===at)}
      t.addEventListener("scroll",function(){if(!tique){tique=true;requestAnimationFrame(marcar)}},{passive:true});
      marcar();
    });
  }

  /* ============ números que sobem ao aparecer na tela ============ */
  function contadores(){
    var alvos=$$(".stat b").map(function(b){
      var no=Array.prototype.slice.call(b.childNodes).filter(function(n){return n.nodeType===3&&/\d/.test(n.textContent)})[0];
      return no?{no:no,fim:parseInt(no.textContent.replace(/\D/g,""),10)}:null;
    }).filter(Boolean);
    if(!alvos.length||reduce||!("IntersectionObserver" in window))return; // sem animação: o número final já está no HTML
    var fmt=function(n){return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,".")};
    var io=new IntersectionObserver(function(es){es.forEach(function(e){
      if(!e.isIntersecting)return;io.unobserve(e.target);
      var a=alvos.filter(function(x){return x.no.parentNode===e.target})[0];if(!a)return;
      var t0=performance.now(),dur=1600;
      (function passo(t){var p=Math.min(1,(t-t0)/dur),v=Math.round(a.fim*(1-Math.pow(1-p,3)));a.no.textContent=fmt(v);if(p<1)requestAnimationFrame(passo)})(t0);
    })},{threshold:.6});
    alvos.forEach(function(a){io.observe(a.no.parentNode)});
  }

  /* ============ formulário de proposta (só em pedir-proposta.html, uma tela) ============
     Card UX P1: nas outras páginas há só "Falar no WhatsApp" + "Pedir proposta" (pedir-proposta.html#<assunto>).
     O assunto da âncora pré-marca interesse, porte e cidade (mapa window.HOLD_ASSUNTOS, gerado pelo build.js).
     Sem telefone: o envio abre o WhatsApp da Hold com o pedido pronto, e o número chega com a mensagem. */
  var INTENTS=["abrir_empresa","trocar_contador","terceirizar_financeiro","mei","imposto_renda","outro"];
  function leadForms(){
    // Origem do clique em "Pedir proposta" (qualquer página) vai junto com o lead.
    document.addEventListener("click",function(e){
      var a=e.target.closest('a[href*="pedir-proposta.html"]');if(!a)return;
      store("hold_origem_proposta",JSON.stringify({origem:a.dataset.origem||"link",pagina:PAGE}));
    });
    // Cartões de intenção (ex.: home) levam ao formulário já marcado.
    $$("[data-intent]").forEach(function(a){
      if(a.closest(".js-lead"))return;
      if(a.tagName==="A")a.href=ROOT+"pedir-proposta.html#"+a.dataset.intent;
      a.addEventListener("click",function(){track("select_intent",{intencao:a.dataset.intent,origem:a.dataset.origem||"card"})});
    });
    var f=$(".js-lead");if(!f)return;
    var MAPA=window.HOLD_ASSUNTOS||{},intent=null,ctx={},iniciou=false,opts=$$(".opt",f),next=$(".js-next",f);
    var selC=$(".js-cidade",f),selP=$(".js-porte",f),nomeI=$(".js-nome",f);
    function pick(v){intent=v;opts.forEach(function(o){o.setAttribute("aria-pressed",String(o.dataset.v===v))});var er=$(".js-e1",f);if(er)er.hidden=true}
    // `auto` guarda o que o assunto marcou: trocar de âncora desfaz só isso, não o que a pessoa escolheu.
    var auto={};
    function marcar(sel,k,v){if(!sel)return;if(v){$$("option",sel).forEach(function(o){if(o.value===v)sel.value=v});auto[k]=sel.value}else if(auto[k]&&sel.value===auto[k]){sel.selectedIndex=0;auto[k]=""}}
    function lerAssunto(){
      var h="";try{h=decodeURIComponent((location.hash||"").slice(1))}catch(x){}
      var m=MAPA[h]||(INTENTS.indexOf(h)>-1?{intencao:h}:null);if(!m)return false;
      ctx={assunto:h,servico:m.servico||"",setor:m.setor||""};
      if(m.intencao)pick(m.intencao);marcar(selP,"porte",m.porte);marcar(selC,"cidade",m.cidade);
      return true;
    }
    function comecar(){if(iniciou)return;iniciou=true;track("form_start",{intencao:intent||"",assunto:ctx.assunto||"",pre_selecionado:ctx.assunto?"sim":"nao"})}
    opts.forEach(function(o){o.addEventListener("click",function(){pick(o.dataset.v);comecar();track("select_intent",{intencao:o.dataset.v,origem:"formulario"})})});
    [selC,selP,nomeI].forEach(function(el){if(el)el.addEventListener("change",comecar)});
    if(lerAssunto()){
      // Veio com o assunto marcado: o foco vai para o primeiro campo ainda não decidido, sem rolar a página.
      try{(intent?(selC||nomeI):opts[0]).focus({preventScroll:true})}catch(x){}
    }
    addEventListener("hashchange",lerAssunto);
    f.addEventListener("submit",function(e){
      e.preventDefault();
      if(!intent){$(".js-e1",f).hidden=false;opts[0].focus();return}
      comecar();
      var nome=((nomeI||{}).value||"").trim(),cidade=(selC||{}).value||"",porte=(selP||{}).value||"";
      var rot=$('.opt[data-v="'+intent+'"]',f),assunto=rot?rot.firstChild.textContent.trim():intent;
      var det=ctx.servico&&ctx.servico!=="terceirizacao"?" ("+ctx.servico.replace(/-/g," ")+")":ctx.setor?" (setor: "+ctx.setor.replace(/-/g," ")+")":"";
      // "Pedido de proposta pelo site" fica fixo no começo: a Hold conta os pedidos no WhatsApp e confere com o GA4.
      var msg="Olá! Pedido de proposta pelo site da Hold.\nAssunto: "+assunto+det+"\nCidade: "+cidade+"\nEmpresa: "+porte+(nome?"\nMeu nome é "+nome+".":"");
      var link=waLink("formulario",msg,intent==="terceirizar_financeiro");
      var jan=null;try{jan=window.open(link,"_blank");if(jan)jan.opener=null}catch(x){}
      var org={};try{org=JSON.parse(store("hold_origem_proposta")||"{}")}catch(x){}
      // generate_lead sai uma vez, no obrigado.html (flag `novo`), com estes dados.
      store("hold_lead",JSON.stringify({nome:nome,intencao:intent,servico:ctx.servico||"",setor:ctx.setor||"",cidade:cidade,porte:porte,origem:org.origem||"direto",wa:link,novo:1}));
      next.disabled=true;next.innerHTML='<span class="spin"></span>Abrindo o WhatsApp';
      // Bloqueador de janela: sem a nova aba, o obrigado.html mostra o botão com a mensagem pronta.
      setTimeout(function(){location.href=ROOT+"obrigado.html"},jan?400:0);
    });
  }

  /* ============ inscrição e materiais ============ */
  function signups(){
    $$(".js-signup").forEach(function(f){
      f.addEventListener("submit",function(e){
        e.preventDefault();var ok=true;
        $$("[data-req]",f).forEach(function(i){var d=i.closest(".dfield,.field");var v=i.value.trim();var bad=!v||(i.type==="email"&&!/^\S+@\S+\.\S+$/.test(v))||(i.dataset.req==="tel"&&!foneValido(v));if(d)d.classList.toggle("err",bad);if(bad&&ok){ok=false;i.focus()}});
        if(!ok)return;
        var kind=f.dataset.kind||"newsletter";
        if(kind==="material"){
          // Sem envio automático ainda: o pedido da planilha segue pelo WhatsApp oficial, com a mensagem pronta.
          var nm=(($(".js-nome",f)||{}).value||"").trim(),tel=$("[data-req=tel]",f);
          var lk=waLink("material","Olá! Vim pelo site da Hold e quero receber a planilha de fluxo de caixa grátis."+(nm?"\nNome: "+nm:"")+(tel?"\nMeu WhatsApp: "+foneMascara(tel.value):""));
          var jn=null;try{jn=window.open(lk,"_blank");if(jn)jn.opener=null}catch(x){}
          store("hold_lead",JSON.stringify({nome:nm,material:f.dataset.material,wa:lk,novo:1}));track("download_material",{material:f.dataset.material,metodo:"whatsapp"});setTimeout(function(){location.href=ROOT+"obrigado.html"},jn?400:0);return}
        // Newsletter: ainda não há lista de e-mails. Nada é guardado nem medido como inscrição; a mensagem diz isso.
        f.hidden=true;var ok2=f.parentNode.querySelector(".js-ok");if(ok2)ok2.hidden=false;
      });
    });
  }

  /* ============ autodiagnóstico da terceirização ============ */
  function selfcheck(){
    $$(".selfcheck").forEach(function(w){
      var boxes=$$("input[type=checkbox]",w),n=$(".js-n",w),msg=$(".js-msg",w);
      function upd(){var c=boxes.filter(function(b){return b.checked}).length;n.textContent=c+" de "+boxes.length;
        msg.textContent=c>=3?"Está na hora de terceirizar. A Hold assume o financeiro e você recupera o seu tempo.":c>=1?"Alguns sinais já aparecem. Vale uma conversa com um especialista.":"Marque os sinais que você reconhece na sua empresa."}
      boxes.forEach(function(b){b.addEventListener("change",function(){upd();track("self_check",{marcados:boxes.filter(function(x){return x.checked}).length})})});upd();
    });
  }

  /* ============ página de obrigado ============ */
  function thanks(){
    var el=$(".js-thanks");if(!el)return;
    var d={};try{d=JSON.parse(store("hold_lead")||"{}")}catch(e){}
    if(d.nome)$(".js-thanks-name").textContent=", "+d.nome;
    if(d.material){$(".js-thanks-msg").textContent="Abrimos o WhatsApp da Hold com o pedido da planilha já escrito. Só falta tocar em enviar.";}
    var bt=$(".js-thanks-wa");if(bt&&d.wa)bt.href=d.wa;
    if(!d.wa)$(".js-thanks-msg").textContent="Quer falar com a Hold? Um especialista atende você no WhatsApp.";
    // generate_lead conta uma vez por envio: entrar direto, recarregar ou voltar para esta página não conta de novo.
    if(d.novo){
      track("generate_lead",{intencao:d.intencao||"",servico:d.servico||"",setor:d.setor||"",cidade:d.cidade||"",origem:d.origem||"",material:d.material||"",metodo:"whatsapp"});
      delete d.novo;store("hold_lead",JSON.stringify(d));
    }
  }

  document.addEventListener("DOMContentLoaded",function(){
    if(DEBUG)ui();nav();svcList();carousels();carDots();contadores();leadForms();signups();selfcheck();fab();cookieBanner();thanks();
    // animações de scroll, paralaxe e cartões que seguem o ponteiro (assets/movimento.js)
    if(window.Movimento)Movimento({
      revelar:"main section:not(.hero):not(.phero) .c>*, main .phero .phero-card, .ftr .c>*",
      cascata:".grid2,.grid3,.intents,.pains,.people,.posts,.prows,.sectors,.tall,.stats,.faq,.steps3,.related,.units,.tline",
      paralaxe:".hero-photo>img,.svc-media .ph>img,main .c>.ph--img>img,.row>.ph--img>img,.split .ph>img,.unit .ph>img,.quote .ph>img",
      inclinar:"a.card,a.post,a.story,.tall>a,a.intent,a.client,a.strip,.related a"
    });
    track("page_view",{});
  });
})();
