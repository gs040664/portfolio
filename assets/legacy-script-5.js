(function(){
  var WORKS=[
    {hash:'tooling',    id:'pf2', c:'Project B', t:'從一句話到可上線關卡'},
    {hash:'pipeline',   id:'pf3', c:'Project I', t:'角色資料的 AI 工作流'},
    {hash:'difficulty', id:'pf1', c:'Project S', t:'主線難度收斂分析'}
  ];
  var bar=document.getElementById('navbar'),
      ttl=document.getElementById('navt'),
      nxt=document.getElementById('navn');

  function show(){
    /* 換頁時先關掉開著的「詳細」視窗，不然隱藏的頁面會留下擋住操作的視窗 */
    var od=document.querySelector('dialog[open]');
    if(od) od.close();
    var parts=(location.hash||'').replace(/^#/,'').split('/'),
        h=parts[0],sub=parts[1]||'',
        w=null,i;
    for(i=0;i<WORKS.length;i++) if(WORKS[i].hash===h) w=WORKS[i];
    document.getElementById('hub').hidden=!!w;
    for(i=0;i<WORKS.length;i++)
      document.getElementById(WORKS[i].id).hidden=(!w||WORKS[i].id!==w.id);
    bar.hidden=!w;
    if(w){
      ttl.innerHTML='<i>'+w.c+'</i>'+w.t;
      var n=WORKS[(WORKS.indexOf(w)+1)%WORKS.length];
      nxt.href='#'+n.hash;
      nxt.innerHTML='下一件<span>　'+n.c+'　'+n.t+'　&rarr;</span>';
      document.title=w.t+'｜實作案例';
    }else{
      document.title='實作案例｜數值／系統企劃';
    }
    window.scrollTo({top:0,behavior:'instant'});
    if(!w&&h==='works') setTimeout(function(){document.getElementById('works').scrollIntoView({block:'start',behavior:'instant'});},0);
    /* 子畫面交給各頁自己的腳本：B 切分頁、I 開「詳細」視窗 */
    if(w) setTimeout(function(){
      document.dispatchEvent(new CustomEvent('subview',{detail:{id:w.id,sub:sub}}));
    },0);
  }
  window.addEventListener('hashchange',show);
  show();
})();

/* Project I：「詳細」視窗。總覽圖留在原處，細節在視窗裡看，可以一層一層點進去 */
(function(){
  var dlg=document.getElementById('xd');
  if(!dlg) return;
  var pf=document.getElementById('pf3'),
      bd=dlg.querySelector('.xd-bd'),
      back=dlg.querySelector('.xd-back'),
      path=dlg.querySelector('.xd-path'),
      stack=[];
  function page(v){return dlg.querySelector('.xd-pg[data-pg="'+v+'"]');}
  function name(v){return page(v).getAttribute('data-name');}
  function render(){
    var cur=stack[stack.length-1],pgs=dlg.querySelectorAll('.xd-pg');
    for(var i=0;i<pgs.length;i++) pgs[i].hidden=pgs[i].getAttribute('data-pg')!==cur;
    path.innerHTML=stack.map(function(v,k){
      return '<span class="sep">›</span>'+(k===stack.length-1?'<b>'+name(v)+'</b>':'<span>'+name(v)+'</span>');
    }).join('');
    back.hidden=stack.length<2;
    if(stack.length>1) back.querySelector('span').textContent=name(stack[stack.length-2]);
    dlg.setAttribute('aria-label','詳細流程：'+name(cur));
    bd.scrollTop=0;
  }
  function go(v,nested){
    if(!page(v)) return;
    if(!dlg.open){stack=[v];dlg.showModal();}
    else if(nested){if(stack[stack.length-1]!==v) stack.push(v);}
    else stack=[v];
    render();
  }
  dlg.addEventListener('close',function(){
    stack=[];
    if(location.hash.indexOf('#pipeline/')===0) history.replaceState(null,'','#pipeline');
    var more=dlg.querySelectorAll('.flow-more');
    for(var i=0;i<more.length;i++) more[i].open=false;
  });
  /* 點視窗外的遮罩也能關 */
  dlg.addEventListener('click',function(e){if(e.target===dlg) dlg.close();});
  dlg.querySelector('.xd-x').addEventListener('click',function(){dlg.close();});

  back.addEventListener('click',function(){stack.pop();render();});
  pf.addEventListener('click',function(e){
    var t=e.target.closest&&e.target.closest('[data-view]');
    if(t) go(t.getAttribute('data-view'),dlg.contains(t));
  });
  /* 圖上的卡片不是 button，Enter／空白鍵要自己接 */
  pf.addEventListener('keydown',function(e){
    if(e.key!=='Enter'&&e.key!==' ') return;
    var t=e.target.closest&&e.target.closest('g[data-view]');
    if(t){e.preventDefault();go(t.getAttribute('data-view'),dlg.contains(t));}
  });
  document.addEventListener('subview',function(e){
    if(e.detail.id!=='pf3'||!e.detail.sub) return;
    var t=pf.querySelector('.job .jlink[data-view="'+e.detail.sub+'"]');
    t=t?t.closest('.job'):pf.querySelector('.xbtns button[data-view="'+e.detail.sub+'"]');
    if(!t) return;
    var details=t.closest('details.case-details');
    if(details) details.open=true;
    requestAnimationFrame(function(){t.scrollIntoView({block:'center',behavior:'instant'});});
    t.classList.add('hl');
    setTimeout(function(){t.classList.remove('hl');},1800);
  });
})();
