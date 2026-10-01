(function(){
  var tabs=[].slice.call(document.querySelectorAll('.tabs button'));
  function go(id){
    tabs.forEach(function(t){
      var on=t.id===id;
      t.setAttribute('aria-selected',on?'true':'false');
      document.getElementById(t.getAttribute('aria-controls')).hidden=!on;
    });
    if(id==='tab2'&&window.ensureSimReport)window.ensureSimReport();
  }
  document.addEventListener('subview',function(e){
    if(e.detail.id==='pf2') go(e.detail.sub==='sim'?'tab2':'tab1');
  });
  /* 開頭工作卡的「詳細」：切到對應分頁並捲到分頁列 */
  [].forEach.call(document.querySelectorAll('#pf2 [data-tab]'),function(b){
    b.addEventListener('click',function(){
      go(b.getAttribute('data-tab'));
      var t=document.querySelector('#pf2 .tabs');
      if(t) t.scrollIntoView({behavior:'smooth',block:'start'});
    });
  });
  tabs.forEach(function(t){
    t.addEventListener('click',function(){go(t.id);});
    t.addEventListener('keydown',function(e){
      var i=tabs.indexOf(t),n=null;
      if(e.key==='ArrowRight')n=tabs[(i+1)%tabs.length];
      if(e.key==='ArrowLeft')n=tabs[(i-1+tabs.length)%tabs.length];
      if(n){e.preventDefault();n.focus();go(n.id);}
    });
  });
})();
