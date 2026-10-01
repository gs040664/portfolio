(function(){
  var C1=[{s:1,v2:100.0,v3:80.8,v4:80.8,v5:80.8,x:71.2},{s:50,v2:89.2,v3:74.3,v4:74.3,v5:74.2,x:131.2},
    {s:100,v2:84.6,v3:56.3,v4:56.3,v5:56.2,x:192.4},{s:150,v2:79.6,v3:52.9,v4:52.9,v5:52.4,x:253.6},
    {s:200,v2:77.4,v3:46.1,v4:38.7,v5:38.7,x:314.8},{s:300,v2:69.0,v3:39.9,v4:26.4,v5:26.4,x:437.2},
    {s:400,v2:65.7,v3:38.0,v4:21.4,v5:21.4,x:559.7},{s:500,v2:62.5,v3:36.2,v4:17.6,v5:17.6,x:682.1},
    {s:580,v2:100.4,v3:29.4,v4:19.5,v5:19.5,x:780}];

  var C3=[{d:'D1',x:90,a:134,b:120,c:127,e:45,f:63},{d:'D2',x:198.3,a:166,b:138,c:146,e:80,f:128},
    {d:'D3',x:306.7,a:189,b:177,c:166,e:127,f:136},{d:'D4',x:415,a:214,b:189,c:176,e:140,f:140},
    {d:'D5',x:523.3,a:237,b:218,c:178,e:143,f:142},{d:'D6',x:631.7,a:253,b:219,c:178,e:147,f:146},
    {d:'D7',x:740,a:259,b:236,c:189,e:163,f:146}];

  function ns(n){return document.createElementNS('http://www.w3.org/2000/svg',n);}

  function wire(hostId,wrapId,tipId,items,build){
    var host=document.getElementById(hostId),
        wrap=document.getElementById(wrapId),
        tip=document.getElementById(tipId);
    if(!host||!wrap||!tip)return;
    var svg=host.ownerSVGElement;
    items.forEach(function(it){
      var r=ns('rect');
      r.setAttribute('x',it.x-it.w/2);r.setAttribute('y',it.y);
      r.setAttribute('width',it.w);r.setAttribute('height',it.h);
      r.setAttribute('fill','transparent');r.setAttribute('class','hit');
      r.setAttribute('tabindex','0');
      r.setAttribute('role','img');
      r.setAttribute('aria-label',it.plain);
      function show(){
        tip.innerHTML=build(it);
        var box=svg.getBoundingClientRect(),wb=wrap.getBoundingClientRect(),
            vb=svg.viewBox.baseVal,k=box.width/vb.width;
        tip.style.left=(box.left-wb.left+it.x*k)+'px';
        tip.style.top=(box.top-wb.top+(it.ty||40)*k)+'px';
        tip.style.opacity='1';
      }
      function hide(){tip.style.opacity='0';}
      r.addEventListener('mouseenter',show);
      r.addEventListener('mousemove',show);
      r.addEventListener('mouseleave',hide);
      r.addEventListener('focus',show);
      r.addEventListener('blur',hide);
      host.appendChild(r);
    });
  }

  wire('h1','w1','t1',C1.map(function(p,i){
    var prev=i?C1[i-1].x:p.x-30, next=i<C1.length-1?C1[i+1].x:p.x+30;
    return {x:p.x,y:30,w:Math.max(28,(next-prev)/2),h:320,d:p,ty:34,
      plain:'第'+p.s+'關，V2 '+p.v2+'%，V3 '+p.v3+'%，V4 '+p.v4+'%，V5 '+p.v5+'%'};
  }),function(it){var p=it.d;
    return '<b>第 '+p.s+' 關</b><br>V2 '+p.v2.toFixed(1)+'%　V3 '+p.v3.toFixed(1)+'%<br>V4 '+p.v4.toFixed(1)+'%　V5 '+p.v5.toFixed(1)+'%';});

  var R2=[{s:1,a:100,b:100,y:45},{s:10,a:83.4,b:91.4,y:85},{s:50,a:75,b:88,y:125},
          {s:100,a:48,b:65,y:165},{s:200,a:12,b:28,y:205},{s:300,a:1.3,b:4.8,y:245}];
  wire('h2','w2','t2',R2.map(function(r){
    return {x:465,y:r.y-18,w:710,h:36,d:r,ty:r.y-20,
      plain:'第'+r.s+'關，V1 '+r.a+'%，V5 '+r.b+'%'};
  }),function(it){var r=it.d;
    return '<b>第 '+r.s+' 關</b><br>V1 '+r.a.toFixed(1)+'% → V5 '+r.b.toFixed(1)+'%<br>'+
      (r.a===r.b?'無變化':'+'+(r.b-r.a).toFixed(1)+' 個百分點（'+(r.b/r.a).toFixed(2)+'×）');});

  wire('h3','w3','t3',C3.map(function(p,i){
    return {x:p.x,y:40,w:i===0||i===C3.length-1?60:108,h:300,d:p,ty:44,
      plain:p.d+'：鯨魚 '+p.a+'，大R '+p.b+'，中R '+p.c+'，小R '+p.e+'，無課 '+p.f};
  }),function(it){var p=it.d;
    return '<b>'+p.d+'　到達關卡</b><br>鯨魚 '+p.a+'　大R '+p.b+'<br>中R '+p.c+'　小R '+p.e+'<br>無課 '+p.f;});
})();
