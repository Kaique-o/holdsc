/* Hold Contábil · comportamento compartilhado do site */
(function(){
  "use strict";
  var ROOT = window.HOLD_ROOT || "";
  var PAGE = window.HOLD_PAGE || document.title;
  var WA = "554830524321";
  var reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
  function $(s,c){return (c||document).querySelector(s)}
  function $$(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s))}
  function store(k,v){try{if(v===undefined)return sessionStorage.getItem(k);sessionStorage.setItem(k,v)}catch(e){return null}}
  function keep(k,v){try{if(v===undefined)return localStorage.getItem(k);localStorage.setItem(k,v)}catch(e){return null}}

  /* ============ rastreamento + consentimento (LGPD) ============ */
  window.dataLayer = window.dataLayer || [];
  var consent = keep("hold_consent"), pending = [], count = 0, list, counter;
  function ui(){
    var b=document.createElement("button");b.className="trk-btn";b.type="button";b.setAttribute("aria-expanded","false");
    b.innerHTML='Rastreamento <span class="n">0</span>';
    var p=document.createElement("aside");p.className="trk";p.hidden=true;p.setAttribute("aria-label","Eventos de rastreamento");
    p.innerHTML='<div class="trk-h"><b>Eventos para GA4 e Meta Pixel</b><span>Painel só do protótipo.</span></div><div class="trk-list"><p class="trk-empty">Nenhum evento ainda nesta página.</p></div>';
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
    if(consent)return;
    var c=document.createElement("div");c.className="cookie";c.setAttribute("role","dialog");c.setAttribute("aria-label","Cookies");
    c.innerHTML='<p>Usamos cookies para entender como você chegou até aqui e melhorar o site. Nada é medido antes da sua escolha. <a href="'+ROOT+'politica-de-privacidade.html">Política de privacidade</a></p><div class="row"><button class="btn btn--outline btn--sm" type="button" data-c="essential">Só os essenciais</button><button class="btn btn--primary btn--sm" type="button" data-c="all">Aceitar todos</button></div>';
    c.addEventListener("click",function(e){var b=e.target.closest("[data-c]");if(!b)return;
      consent=b.dataset.c;keep("hold_consent",consent);c.remove();
      track("consent_update",{analytics:consent==="all"?"granted":"denied"});
      pending.forEach(function(p){if(!p.el)return;p.el.classList.remove("wait");
        if(consent==="all")dataLayer.push(Object.assign({event:p.ev},p.params));else $("b",p.el).textContent=p.ev+" (não enviado)"});
      pending=[];
    });
    document.body.appendChild(c);
  }
  document.addEventListener("click",function(e){
    var r=e.target.closest("[data-cookie-reset]");if(r){e.preventDefault();try{localStorage.removeItem("hold_consent")}catch(x){}consent=null;cookieBanner();}
  });

  /* ============ WhatsApp com contexto ============ */
  function waLink(origem){
    var txt="Olá! Vim pelo site da Hold ("+PAGE+") e quero falar com um especialista.";
    return "https://wa.me/"+WA+"?text="+encodeURIComponent(txt);
  }
  function fab(){
    var a=document.createElement("a");a.className="fab";a.href=waLink("botao_flutuante");a.target="_blank";a.rel="noopener";
    a.setAttribute("aria-label","Falar no WhatsApp");a.dataset.trk="click_whatsapp";a.dataset.origem="botao_flutuante";
    a.innerHTML='<span class="bubble">Fale com um especialista</span><span class="circle">'+WA_SVG+'</span>';
    document.body.appendChild(a);
  }
  var WA_SVG='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.3 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .1-3.3-.8-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9 0-1.4.7-2 1-2.3.3-.3.6-.3.8-.3h.6c.2 0 .4 0 .6.5l.9 2.1c.1.2.1.4 0 .5l-.4.6-.4.4c-.1.2-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.7-.1l2 1c.3.1.5.2.5.3.1.2.1.7-.1 1.3z"/></svg>';

  /* ============ cliques rastreados ============ */
  document.addEventListener("click",function(e){
    var a=e.target.closest("[data-trk]");if(!a)return;
    var p={};["origem","setor","servico","destino","material"].forEach(function(k){if(a.dataset[k])p[k]=a.dataset[k]});
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
    var bu=$(".burger"),dr=$("#drawer");
    if(bu&&dr)bu.addEventListener("click",function(){dr.hidden=!dr.hidden;bu.setAttribute("aria-expanded",String(!dr.hidden))});
    var dl=$(".deadline button");if(dl)dl.addEventListener("click",function(){$(".deadline").hidden=true});
    $$("[data-wa]").forEach(function(a){a.href=waLink(a.dataset.origem||"link");a.target="_blank";a.rel="noopener";a.dataset.trk="click_whatsapp"});
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

  /* ============ formulário de proposta (3 etapas) ============ */
  var INTENTS=["abrir_empresa","trocar_contador","terceirizar_financeiro","mei","imposto_renda","outro"];
  function leadForms(){
    $$(".js-lead").forEach(function(f){
      var step=1,intent=f.dataset.intent||null,opts=$$(".opt",f),next=$(".js-next",f),back=$(".js-back",f);
      var hashI=(location.hash||"").slice(1);if(INTENTS.indexOf(hashI)>-1)intent=hashI;
      function pick(v){intent=v;opts.forEach(function(o){o.setAttribute("aria-pressed",String(o.dataset.v===v))});var er=$(".js-e1",f);if(er)er.hidden=true}
      opts.forEach(function(o){o.addEventListener("click",function(){pick(o.dataset.v)})});
      function show(){
        $(".js-f1",f).hidden=step!==1;$(".js-f2",f).hidden=step!==2;
        $$(".fsteps i",f).forEach(function(x,i){x.className=i<step?"on":""});
        back.hidden=step!==2;next.textContent=step===2?"Quero falar com um especialista":"Continuar";
      }
      if(intent){pick(intent);if(f.dataset.skip==="1"){step=2}}
      show();
      f.goTo=function(v,origem){pick(v);step=2;show();track("select_intent",{intencao:v,origem:origem||"card"});track("form_start",{intencao:v})};
      f.addEventListener("submit",function(e){
        e.preventDefault();
        if(step===1){if(!intent){$(".js-e1",f).hidden=false;return}track("form_start",{intencao:intent});step=2;show();$("input",$(".js-f2",f)).focus();return}
        var wa=$(".js-wa",f),fl=wa.closest(".field"),hint=$(".hint",fl);
        if(wa.value.replace(/\D/g,"").length<10){fl.classList.add("err");hint.textContent="Faltou o DDD. Ex.: (48) 99999-0000";wa.focus();return}
        fl.classList.remove("err");hint.textContent="A gente chama você por aqui, sem spam.";
        var lg=$(".js-lgpd",f);if(lg&&!lg.checked){$(".js-e2",f).hidden=false;return}
        var nome=($(".js-nome",f)||{}).value||"";
        store("hold_lead",JSON.stringify({nome:nome.trim(),intencao:intent,servico:f.dataset.service||""}));
        next.disabled=true;next.innerHTML='<span class="spin"></span>Enviando';
        track("form_submit",{intencao:intent,servico:f.dataset.service||"",cidade:($(".js-cidade",f)||{}).value||""});
        setTimeout(function(){location.href=ROOT+"obrigado.html"},700);
      });
      back.addEventListener("click",function(){step=1;show()});
    });
    $$("[data-intent]").forEach(function(a){
      if(a.closest(".js-lead"))return;
      a.addEventListener("click",function(e){
        var f=$(".js-lead");var v=a.dataset.intent;
        if(f){e.preventDefault();f.goTo(v,a.dataset.origem||"card");document.getElementById(f.closest("section").id||"proposta").scrollIntoView({behavior:reduce?"auto":"smooth"})}
        else{a.href=ROOT+"pedir-proposta.html#"+v}
      });
    });
  }

  /* ============ inscrição e materiais ============ */
  function signups(){
    $$(".js-signup").forEach(function(f){
      f.addEventListener("submit",function(e){
        e.preventDefault();var ok=true;
        $$("[data-req]",f).forEach(function(i){var d=i.closest(".dfield,.field");var v=i.value.trim();var bad=!v||(i.type==="email"&&!/^\S+@\S+\.\S+$/.test(v))||(i.dataset.req==="tel"&&v.replace(/\D/g,"").length<10);if(d)d.classList.toggle("err",bad);if(bad&&ok){ok=false;i.focus()}});
        if(!ok)return;
        var kind=f.dataset.kind||"newsletter";
        if(kind==="material"){store("hold_lead",JSON.stringify({nome:(($(".js-nome",f)||{}).value||"").trim(),material:f.dataset.material}));track("download_material",{material:f.dataset.material});setTimeout(function(){location.href=ROOT+"obrigado.html"},400);return}
        track("sign_up",{canal:kind});
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

  /* ============ filtro de conteúdos ============ */
  function topics(){
    $$(".topics").forEach(function(t){
      var bs=$$("button",t),posts=$$(".posts .post");
      bs.forEach(function(b){b.addEventListener("click",function(){bs.forEach(function(x){x.setAttribute("aria-pressed",String(x===b))});var v=b.dataset.t;posts.forEach(function(p){p.hidden=v!=="todos"&&p.dataset.t!==v})})});
    });
  }

  /* ============ página de obrigado ============ */
  function thanks(){
    var el=$(".js-thanks");if(!el)return;
    var d={};try{d=JSON.parse(store("hold_lead")||"{}")}catch(e){}
    if(d.nome)$(".js-thanks-name").textContent=", "+d.nome;
    if(d.material){$(".js-thanks-msg").textContent="A planilha chega no seu WhatsApp em alguns minutos. Enquanto isso, veja os guias da Hold.";}
    track("generate_lead",{intencao:d.intencao||"",servico:d.servico||"",material:d.material||""});
  }

  document.addEventListener("DOMContentLoaded",function(){
    ui();nav();svcList();carousels();carDots();contadores();leadForms();signups();selfcheck();topics();fab();cookieBanner();thanks();
    track("page_view",{});
  });
})();
