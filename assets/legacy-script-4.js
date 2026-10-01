const KN={ok:["badge bok","符合"],fail:["badge bfail","未施放"],soft:["badge bsoft","末回合截斷"],cond:["badge bcond","條件觸發"]};
const COLORS=["#3987e5","#199e70","#c98500","#9085e9","#e66767","#008300","#7aa5d8","#5ec9a5"];
const ROLECOLOR={"輔":"#9085e9","治":"#199e70","守":"#3987e5","攻":"#e66767","妨":"#c98500"};
const $=q=>document.querySelector(q);
const CUR=DATA.currentMd5;
function teamColor(nm){const i=DATA.teamOrder.indexOf(nm);return COLORS[(i<0?DATA.teamOrder.length:i)%COLORS.length]}
function isOk(r){return (r.status||"ok")==="ok"}
/* 分組鍵=(隊,變體,表版,模式,覆蓋)；代表=組內最新 ok */
function gkey(r){return [r.teamName,r.variant,r.tsvMd5,r.mode,JSON.stringify(r.overrides||{})].join("|")}
const GROUPS={};
DATA.runs.forEach((r,i)=>{const k=gkey(r);(GROUPS[k]=GROUPS[k]||[]).push(i)});
const REP={};   // gkey -> run idx（最新 ok；全非 ok 則最新一筆）
for(const k in GROUPS){
  const g=GROUPS[k];
  const oks=g.filter(i=>isOk(DATA.runs[i]));
  REP[k]=(oks.length?oks:g).reduce((a,b)=>DATA.runs[a].date+DATA.runs[a].id>=DATA.runs[b].date+DATA.runs[b].id?a:b);
}
function isRep(i){return REP[gkey(DATA.runs[i])]===i}
/* 預設疊圖：現行表版本下，每隊最新 ok run（必為其組代表）；預設詳情：全域最新 ok 代表 */
let shown=new Set(), sel=0;
{
  const byTeam={};
  DATA.runs.forEach((r,i)=>{
    if(!isOk(r)||r.tsvMd5!==CUR)return;
    const cur=byTeam[r.teamName];
    if(cur==null||r.date+r.id>=DATA.runs[cur].date+DATA.runs[cur].id)byTeam[r.teamName]=i;
  });
  Object.values(byTeam).forEach(i=>shown.add(DATA.runs[i].id));
  const okIdx=DATA.runs.map((r,i)=>i).filter(i=>isOk(DATA.runs[i])&&isRep(i));
  sel=okIdx.length?okIdx[okIdx.length-1]:DATA.runs.length-1;
}
let selection=new Set(), lastSelIdx=null;
let sortKey=null, sortDir=1, anchor=null;
let flt={enemy:false,hideTrig:false,quotes:false,q:""};

function fmt(x){return x==null?"—":x.toLocaleString("en-US")}
function esc(s){const d=document.createElement("div");d.textContent=s==null?"":String(s);return d.innerHTML}
function bandColor(r){const[lo,hi]=DATA.band;
  if(!r.victory)return"#e66767";if(r.rounds<lo)return"#3987e5";if(r.rounds>hi)return"#e0a83c";return"#5ec98a"}
function verdict(r){
  const [lo,hi]=DATA.band;
  if(!r.victory)return `<span class="lose">未通關（${r.rounds}回）</span>`;
  if(r.rounds<lo)return `<span class="warn">太快 ${r.rounds}回</span>`;
  if(r.rounds>hi)return `<span class="warn">偏慢 ${r.rounds}回</span>`;
  return `<span class="win">帶內 ✅ ${r.rounds}回</span>`;
}
function chip(nm,role){
  if(!role)return `<span class="chip">${esc(nm)}</span>`;
  const c=ROLECOLOR[role]||"#8a897f";
  return `<span class="chip"><span class="dot" style="background:${c}"></span>${esc(nm)}<span class="chiprole">${role}</span></span>`;
}
function chips(names,roles){return names.map((nm,i)=>chip(nm,(roles||[])[i])).join("")}
function avatars(r){
  const html=(r.team||[]).map((cid,i)=>{
    const src=DATA.icons[cid];
    return src?`<img class="avatar" src="${src}" title="${esc(r.teamNames[i]||cid)}" alt="">`:"";
  }).join("");
  return html?`<span class="avatars">${html}</span>`:"";
}
function skColor(nm){let h=0;for(const ch of nm)h=(h*31+ch.charCodeAt(0))>>>0;return COLORS[h%COLORS.length]}

/* ── 結論儀表板 ── */
function colKey(r){return (r.batch||r.variant+"/"+r.mode)+"|"+r.tsvMd5+"|"+r.mode}
function renderDash(){
  const[lo,hi]=DATA.band;
  // 欄=出現過的配置（batch 優先），按組內最早 date 排序（左→右=實驗演進）
  const cols={};
  DATA.runs.forEach((r,i)=>{
    const k=colKey(r);
    cols[k]=cols[k]||{key:k,label:r.batch||((r.variant||"?")+"·"+r.mode),md5:r.tsvMd5,
                      mode:r.mode,first:r.date+r.id,anyOk:false};
    if(r.date+r.id<cols[k].first)cols[k].first=r.date+r.id;
    if(isOk(r))cols[k].anyOk=true;
  });
  const colList=Object.values(cols).sort((a,b)=>a.first<b.first?-1:1);
  // 列=出現過的隊伍（teamOrder 序）
  const teams=DATA.teamOrder.filter(tn=>DATA.runs.some(r=>r.teamName===tn));
  // 格=該(隊,配置)代表
  const cell={};
  DATA.runs.forEach((r,i)=>{
    const ck=r.teamName+"|"+colKey(r);
    const k=gkey(r), rep=REP[k];
    if(rep===i||cell[ck]==null)cell[ck]=rep;
  });
  const head=colList.map(c=>`<th class="ctr" title="${esc(c.md5)}">${esc(c.label)}
    ${c.md5!==CUR?`<div class="small warn">表${esc(c.md5.slice(0,6))}</div>`:`<div class="small">${esc(c.mode==='script'?'照腳本':'亂打')}</div>`}</th>`).join("");
  const body=teams.map(tn=>{
    const tds=colList.map(c=>{
      const i=cell[tn+"|"+c.key];
      if(i==null)return`<td class="ctr small">—</td>`;
      const r=DATA.runs[i];
      const hist=GROUPS[gkey(r)].length-1;
      const histTag=hist?`<span class="histn">×${hist+1}</span>`:"";
      if(!isOk(r))return`<td class="ctr mxbad" onclick="pickRun(${i})" title="${esc(r.statusReason||r.status)}">
        <span class="small">${r.victory?r.rounds+'回':'✕'+r.rounds}</span>${histTag}</td>`;
      const on=shown.has(r.id)?" mxon":"";
      return`<td class="ctr mxcell${on}${i===sel?' mxsel':''}" onclick="pickRun(${i})"
        title="${esc(r.id)}｜${esc(r.teamNames.join('、'))}${r.note?'｜'+esc(r.note):''}">
        <span class="mxbadge" style="background:${bandColor(r)}22;color:${bandColor(r)}">${r.victory?r.rounds+"回":"✕"+r.rounds}</span>${histTag}</td>`;
    }).join("");
    return`<tr><td><span class="dot" style="background:${teamColor(tn)}"></span>${esc(tn)}</td>${tds}</tr>`;
  }).join("");
  // 結論句：現行表最新配置（欄）統計 + 預設隊
  const curCols=colList.filter(c=>c.md5===CUR&&c.anyOk);
  const lastCol=curCols[curCols.length-1];
  let concl="（尚無現行表有效 run）", top="";
  if(lastCol){
    const reps=teams.map(tn=>cell[tn+"|"+lastCol.key]).filter(i=>i!=null&&isOk(DATA.runs[i])).map(i=>DATA.runs[i]);
    const wins=reps.filter(r=>r.victory), inband=wins.filter(r=>r.rounds>=lo&&r.rounds<=hi);
    const rr=wins.map(r=>r.rounds);
    concl=`最新配置「<b>${esc(lastCol.label)}</b>」：<b>${wins.length}/${reps.length}</b> 隊通關`+
      (rr.length?`（${Math.min(...rr)}–${Math.max(...rr)} 回）`:"")+`，帶內 <b>${inband.length}</b> 隊`;
    const dft=DATA.runs.filter(r=>isOk(r)&&r.teamName==="關卡預設隊"&&r.tsvMd5===CUR&&r.victory);
    if(dft.length){const d=dft[dft.length-1];concl+=`；關卡預設隊照攻略 <b>${d.rounds}</b> 回`}
    const cls=inband.length&&wins.length===reps.length?"win":wins.length?"warn":"lose";
    top=`<span class="${cls}">最新：${wins.length}/${reps.length} 隊通關、帶內 ${inband.length}</span>`;
  }
  $("#topVerdict").innerHTML=top;
  $("#dash").innerHTML=`<p>${concl}</p>
   <div class="scroll"><table class="matrix"><tr><th>隊伍 \ 配置</th>${head}</tr>${body}</table></div>
   <p class="small">格＝該（隊伍×配置）最新有效 run 的結論（點格看詳情＋加入疊圖）；欄由左而右＝實驗時間序；×N＝含歷史 N 筆；灰格＝無效批（缺守護滅團等）</p>`;
}
function pickRun(i){
  sel=i;
  shown.add(DATA.runs[i].id);
  renderAll();
  renderDetail();
}
function renderAll(){renderDash();renderOverview();renderLegend();renderChart();}

/* ── 總覽表 ── */
const SORTS={id:r=>r.id,date:r=>r.date,mode:r=>r.mode,
  result:r=>(r.victory?0:1)*1000+r.rounds,boss:r=>r.bossMaxHp,team:r=>(r.teamName||"")+r.teamNames.join(),note:r=>r.note||""};
function orderIdx(){
  const idx=DATA.runs.map((_,i)=>i);
  if(!sortKey)return idx;
  const f=SORTS[sortKey];
  idx.sort((a,b)=>{const va=f(DATA.runs[a]),vb=f(DATA.runs[b]);return (va<vb?-1:va>vb?1:0)*sortDir});
  return idx;
}
function setSort(k){if(sortKey===k)sortDir*=-1;else{sortKey=k;sortDir=1}renderOverview();}
function setAnchor(i,ev){ev.stopPropagation();anchor=(anchor===i)?null:i;renderOverview();}

function renderOverview(){
  const arrow=k=>sortKey===k?(sortDir>0?" ▲":" ▼"):"";
  const maxR=Math.max(...DATA.runs.map(r=>r.rounds),1);
  const aRun=anchor!=null?DATA.runs[anchor]:null;
  const bad=orderIdx().filter(i=>!isOk(DATA.runs[i]));
  const good=orderIdx().filter(i=>isOk(DATA.runs[i]));
  $("#badCount").textContent=bad.length;
  const mkRows=idxs=>idxs.map(i=>{const r=DATA.runs[i];
    const barw=Math.round(r.rounds/maxR*100);
    let diff="";
    if(aRun&&i!==anchor){
      if(r.victory&&aRun.victory){const d=r.rounds-aRun.rounds;
        diff=`<span class="${d<0?'win':d>0?'warn':'small'}">${d>0?'+':''}${d}回</span>`;}
      else if(r.victory!==aRun.victory)diff=`<span class="${r.victory?'win':'lose'}">${r.victory?'轉勝':'轉敗'}</span>`;
    }else if(i===anchor)diff=`<span class="small">基準</span>`;
    return `
   <tr class="${i===sel?'selrow':''} ${selection.has(i)?'selmulti':''}" onclick="rowClick(event,${i})">
    <td><input type="checkbox" ${shown.has(r.id)?'checked':''} onclick="event.stopPropagation();boxClick(${i},this.checked)"
         title="套用到所有已選取列"><span class="dot" style="background:${COLORS[i%COLORS.length]}"></span>${r.id}
        <span class="anchorbtn ${i===anchor?'on':''}" onclick="setAnchor(${i},event)" title="設為比較基準">⚓</span></td>
    <td>${r.date}</td><td>${r.mode==='script'?'腳本':'亂打'}</td>
    <td class="rcell"><div class="rbar" style="width:${barw}%;background:${bandColor(r)}2e"></div>
        <span>${verdict(r)}</span></td>
    <td class="num">${fmt(r.bossMaxHp)}</td>
    <td>${diff}</td>
    <td><span class="dot" style="background:${teamColor(r.teamName)}"></span>${esc(r.teamName||"?")}
      <span class="small">${esc(r.variant||"")}</span>${isRep(i)?"":'<span class="small">（歷史）</span>'}</td>
    <td class="small" title="${esc(r.statusReason||"")}">${esc(r.status==="ok"?"":r.status)}</td>
    <td class="small">${esc(r.note||(r.subs||[]).join("；"))}</td></tr>`}).join("");
  const header=`<tr>
   <th onclick="setSort('id')" class="sortable">run（☑=疊圖 ⚓=基準）${arrow('id')}</th>
   <th onclick="setSort('date')" class="sortable">日期${arrow('date')}</th>
   <th onclick="setSort('mode')" class="sortable">打法${arrow('mode')}</th>
   <th onclick="setSort('result')" class="sortable">結果${arrow('result')}</th>
   <th onclick="setSort('boss')" class="sortable">boss HP${arrow('boss')}</th>
   <th>vs 基準</th>
   <th onclick="setSort('team')" class="sortable">隊伍${arrow('team')}</th>
   <th>狀態</th><th onclick="setSort('note')" class="sortable">note${arrow('note')}</th></tr>`;
  $("#overview").innerHTML=`<table>${header}${mkRows(good)}</table>
   <p class="small">點欄位標題排序｜點列選取：click 單選、shift 範圍、ctrl 加減——選好後點任一 ☑ 批次套用｜⚓ 設基準看回合差</p>`;
  $("#overviewBad").innerHTML=bad.length?`<table>${header}${mkRows(bad)}</table>`:"<p class='small'>（無）</p>";
}
function rowClick(ev,i){
  const order=orderIdx(), pos=order.indexOf(i);
  if(ev.ctrlKey||ev.metaKey){selection.has(i)?selection.delete(i):selection.add(i);}
  else if(ev.shiftKey&&lastSelIdx!=null){
    const lastPos=order.indexOf(lastSelIdx);
    const [a,b]=[Math.min(pos,lastPos),Math.max(pos,lastPos)];
    selection.clear();for(let k=a;k<=b;k++)selection.add(order[k]);
  }else{selection.clear();selection.add(i);sel=i;renderDetail();}
  lastSelIdx=i;renderAll();
}
function boxClick(i,checked){
  const targets=selection.has(i)&&selection.size>1?[...selection]:[i];
  targets.forEach(k=>{const id=DATA.runs[k].id;checked?shown.add(id):shown.delete(id)});
  renderAll();
}

/* ── legend 條（隊伍為單位） ── */
function renderLegend(){
  const teams=DATA.teamOrder.filter(tn=>DATA.runs.some(r=>r.teamName===tn));
  $("#legend").innerHTML=teams.map(tn=>{
    const runs=DATA.runs.filter(r=>r.teamName===tn&&shown.has(r.id));
    const on=runs.length>0;
    const tag=runs.length?runs.map(r=>r.victory?r.rounds+"回":"敗").join("/"):"";
    return`<span class="lchip ${on?'':'off'}" onclick="toggleTeam('${esc(tn)}')">
     <svg width="16" height="8"><line x1="0" y1="4" x2="16" y2="4" stroke="${teamColor(tn)}" stroke-width="2.5"/></svg>
     ${esc(tn)}${tag?`<span class="small" style="margin-left:.3em">${tag}</span>`:""}</span>`;
  }).join("")+`<span class="small" style="align-self:center;margin-left:.5em">（點隊伍開關其疊圖線；點圖中曲線＝選中該場看詳情；矩陣點格可加單場）</span>`;
}
function toggleTeam(tn){
  const has=DATA.runs.some(r=>r.teamName===tn&&shown.has(r.id));
  if(has){DATA.runs.forEach(r=>{if(r.teamName===tn)shown.delete(r.id)})}
  else{
    let best=null;
    DATA.runs.forEach((r,i)=>{
      if(r.teamName!==tn||!isOk(r)||!isRep(i))return;
      if(r.tsvMd5===CUR&&(best==null||r.date+r.id>=DATA.runs[best].date+DATA.runs[best].id))best=i;
    });
    if(best==null)DATA.runs.forEach((r,i)=>{if(r.teamName===tn&&isRep(i))best=i});
    if(best!=null)shown.add(DATA.runs[best].id);
  }
  renderAll();
}

/* ── 疊圖 ── */
function renderChart(){
  const W=980,H=300,pl=48,pr=16,pt=14,pb=42,w=W-pl-pr,h=H-pt-pb;
  const runs=DATA.runs.filter(r=>shown.has(r.id)&&r.track.length);
  if(!runs.length){$("#chart").innerHTML="<p class='small'>（勾選 run 以顯示疊圖）</p>";return}
  const rmax=Math.max(...runs.map(r=>r.track[r.track.length-1][0]));
  const x=r=>pl+(r-1)/Math.max(rmax-1,1)*w, y=p=>pt+(100-p)/100*h;
  let g="";
  for(const p of[0,25,50,75,100])g+=`<line x1="${pl}" y1="${y(p)}" x2="${W-pr}" y2="${y(p)}" stroke="#2c2c2a"/>
    <text x="${pl-6}" y="${y(p)+4}" text-anchor="end" font-size="11" fill="#8a897f">${p}%</text>`;
  const selRun=DATA.runs[sel];
  const seen=new Set();
  if(shown.has(selRun.id))for(const[r,lb]of selRun.marks){
    if(r<1||r>rmax)continue;const xr=Math.round(x(r));
    g+=`<line x1="${xr}" y1="${pt}" x2="${xr}" y2="${pt+h}" stroke="#3d3d38" stroke-dasharray="3,3"/>`;
    if(!seen.has(xr)){g+=`<text x="${xr}" y="${H-6}" text-anchor="middle" font-size="10" fill="#8a897f">${esc(lb)}</text>`;seen.add(xr)}}
  let lines="";
  runs.forEach(run=>{
    const i=DATA.runs.indexOf(run),c=teamColor(run.teamName);
    const pts=run.track.map(([r,hp,mx])=>`${x(r).toFixed(1)},${y(hp*100/Math.max(mx,1)).toFixed(1)}`).join(" ");
    const wgt=i===sel?3:1.6, op=i===sel?1:0.55;
    lines+=`<polyline points="${pts}" fill="none" stroke="${c}" stroke-width="${wgt}" opacity="${op}"/>`;
    run.track.forEach(([r,hp,mx])=>{lines+=`<circle cx="${x(r).toFixed(1)}" cy="${y(hp*100/Math.max(mx,1)).toFixed(1)}"
      r="${i===sel?3.5:2.5}" fill="${c}" opacity="${op}"/>`});
  });
  let ticks="";const st=Math.max(1,Math.floor(rmax/16));
  for(let r=1;r<=rmax;r+=st)ticks+=`<text x="${x(r).toFixed(0)}" y="${pt+h+14}" text-anchor="middle" font-size="10" fill="#8a897f">R${r}</text>`;
  $("#chart").innerHTML=`<div class="chartwrap"><svg id="hpsvg" viewBox="0 0 ${W} ${H}">${g}${lines}
    <line id="xline" y1="${pt}" y2="${pt+h}" stroke="#7aa5d8" stroke-width="1" visibility="hidden"/>${ticks}
    <rect id="hover" x="${pl}" y="${pt}" width="${w}" height="${h}" fill="transparent" style="cursor:pointer"/></svg>
    <div id="tip" class="tip" hidden></div></div>`;
  const svg=$("#hpsvg"),tip=$("#tip"),xl=$("#xline");
  $("#hover").addEventListener("mousemove",ev=>{
    const box=svg.getBoundingClientRect();
    const sx=(ev.clientX-box.left)*W/box.width;
    const r=Math.max(1,Math.min(rmax,Math.round((sx-pl)/Math.max(w,1)*(rmax-1)+1)));
    xl.setAttribute("x1",x(r));xl.setAttribute("x2",x(r));xl.removeAttribute("visibility");
    let rows=`<b>R${r}</b>`;
    runs.forEach(run=>{
      const i=DATA.runs.indexOf(run);
      const pt2=run.track.find(t=>t[0]===r);
      if(pt2)rows+=`<div><svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="${teamColor(run.teamName)}" stroke-width="2.5"/></svg>
        <b>${Math.floor(pt2[1]*100/Math.max(pt2[2],1))}%</b> <span class="small">${fmt(pt2[1])}｜${esc(run.teamName)} ${run.id.slice(-6)}</span></div>`;
    });
    tip.innerHTML=rows;tip.hidden=false;
    const wrap=$(".chartwrap").getBoundingClientRect();
    let tx=ev.clientX-wrap.left+14, ty=ev.clientY-wrap.top+10;
    if(tx+tip.offsetWidth>wrap.width)tx-=tip.offsetWidth+28;
    tip.style.left=tx+"px";tip.style.top=ty+"px";
  });
  $("#hover").addEventListener("mouseleave",()=>{tip.hidden=true;xl.setAttribute("visibility","hidden")});
  $("#hover").addEventListener("click",ev=>{
    const box=svg.getBoundingClientRect();
    const sx=(ev.clientX-box.left)*W/box.width, sy=(ev.clientY-box.top)*H/box.height;
    const r=Math.max(1,Math.min(rmax,Math.round((sx-pl)/Math.max(w,1)*(rmax-1)+1)));
    let best=null,bestD=30;   // 30px（viewBox）容差內取最近曲線
    runs.forEach(run=>{
      const pt2=run.track.find(t=>t[0]===r);
      if(!pt2)return;
      const d=Math.abs(y(pt2[1]*100/Math.max(pt2[2],1))-sy);
      if(d<bestD){bestD=d;best=run}
    });
    if(best)pickRun(DATA.runs.indexOf(best));
  });
}


/* ── 詳情 ── */
function setFlt(k,v){flt[k]=v;renderRounds();}
function renderDetail(){
  const r=DATA.runs[sel];
  $("#dTitle").textContent=`${r.teamName||"?"}｜${r.id}（${r.mode==='script'?'照攻略腳本':'auto 亂打'}${r.variant&&r.variant!=="原始"?"、"+r.variant:""}）`;
  $("#dCard").innerHTML=`
   <div class="hero"><div class="heronum" style="color:${bandColor(r)}">${r.victory?r.rounds:"✕"}</div>
     <div class="herosub">${r.victory?"回合通關":"未通關（"+r.rounds+"回）"}<br>${verdict(r)}</div></div>
   <div><div class="k">boss HP</div><div class="v num">${fmt(r.bossMaxHp)}</div></div>
   <div><div class="k">表 md5</div><div class="v small">${r.tsvMd5}</div></div>
   <div style="min-width:22em"><div class="k">隊伍（站位序）</div><div class="v teamcell">${chips(r.teamNames,r.teamRoles)}${avatars(r)}</div></div>
   ${r.note?`<div style="min-width:100%"><div class="k">note</div><div class="v small">${esc(r.note)}</div></div>`:""}`;
  const ckCnt={};r.checks.forEach(([, , , ,st])=>ckCnt[st]=(ckCnt[st]||0)+1);
  const ckSum=["ok","fail","soft","cond"].filter(k=>ckCnt[k])
    .map(k=>`<span class="${KN[k][0]}">${KN[k][1]} ${ckCnt[k]}</span>`).join(" ");
  $("#dChecks").innerHTML=`<details class="checksd"${ckCnt.fail?" open":""}><summary><b>機制執行檢核</b>
    <span class="small">（AI 表自動推導）</span>　${ckSum}</summary>
   <div class="scroll"><table class="checktable"><tr><th>技能</th><th>條件</th><th>預期回合</th><th>實際施放</th><th>檢核</th></tr>`+
   r.checks.map(([nm,d,e,a,st])=>`<tr><td>《${esc(nm)}》</td><td>${esc(d)}</td><td>${esc(e)}</td><td>${esc(a)}</td>
    <td class="ctr"><span class="${KN[st][0]}">${KN[st][1]}</span></td></tr>`).join("")+`</table></div></details>`;
  renderRounds();
}
function survOf(r){const row=DATA.runs[sel].surv.find(s=>s.r===r+1);return row?row.hp:null}  /* trace r+1＝r 回合結束後 */
function miniSurv(r){
  const hp=survOf(r);if(!hp)return"";
  return `<span class="msurv">`+hp.map(([h,mx,sh,dead])=>{
    const pct=Math.max(0,Math.min(100,Math.floor(h*100/Math.max(mx,1))));
    const col=dead?"#e66767":pct>50?"#5ec98a":pct>25?"#e0a83c":"#e66767";
    return `<span class="msq" title="${pct}%">${dead?`<b>✕</b>`:`<i style="height:${Math.max(pct,6)}%;background:${col}"></i>`}</span>`;
  }).join("")+`</span>`;
}
function actLine(i,enemy){
  if(i.q)return `<div class="aline"><span class="quote">「${esc(i.q)}」</span></div>`;
  const AB={"普攻":"ab-atk","技":"ab-skill","防禦":"ab-def"};
  const tg=(i.tg||[]).map(([nm,d,h,sh])=>{
    const vals=[d?`<b class="vd">-${fmt(d)}</b>`:"",h?`<b class="vh">+${fmt(h)}</b>`:"",sh?`<b class="vs">⛨${fmt(sh)}</b>`:""].filter(Boolean).join(" ");
    return `<span class="tgt">${esc(nm)} ${vals}</span>`;
  }).join("");
  const fx=(i.fx||[]).length?`<span class="small">${i.fx.map(esc).join("、")}</span>`:"";
  const skHtml=i.sk?`<span class="skname" style="border-color:${skColor(i.sk)}">${esc(i.sk)}</span>`:"";
  return `<div class="aline"><span class="who">${esc(i.who)}</span>
    <span class="ab ${AB[i.act]||"ab-skill"}">${esc(i.act)}</span>${skHtml}
    ${tg?`<span class="arrow">→</span>${tg}`:""}${fx}
    ${i.n?`<span class="xn">×${i.n}</span>`:""}</div>`;
}
function bigSurv(r){
  const hp=survOf(r);if(!hp)return"";
  const names=DATA.runs[sel].teamNames;
  return `<div class="bsurv">`+hp.map(([h,mx,sh,dead],ci)=>{
    const pct=Math.max(0,Math.min(100,Math.floor(h*100/Math.max(mx,1))));
    const col=dead?"rgba(230,103,103,.18)":pct>50?"rgba(94,201,138,.30)":pct>25?"rgba(224,168,60,.32)":"rgba(230,103,103,.38)";
    const shb=sh?`<div class="shbar" style="width:${Math.min(100,Math.floor(sh*100/Math.max(mx,1)))}%"></div>`:"";
    return `<div class="bcell"><div class="hpbar" style="width:${dead?0:pct}%;background:${col}"></div>${shb}
      <span class="small">${chip(names[ci]||"",(DATA.runs[sel].teamRoles||[])[ci])}</span>
      <span class="${dead?'lose':''}">${dead?"✕":fmt(h)}${sh?`<span class="small">＋盾${fmt(sh)}</span>`:""}</span>
      <span class="hppct">${dead?"":pct+"%"}</span></div>`;
  }).join("")+`</div>`;
}
let lastRoundsSel=null;
function renderRounds(){
  const r=DATA.runs[sel];
  const q=flt.q.trim();
  const keep=lastRoundsSel===sel;
  const openSet=new Set();
  if(keep)document.querySelectorAll("#dRounds details.round[open]").forEach(d=>openSet.add(d.id));
  lastRoundsSel=sel;
  $("#dRounds").innerHTML=`
   <div class="fltbar">
    <label><input type="checkbox" ${flt.enemy?'checked':''} onchange="setFlt('enemy',this.checked)">只看敵方</label>
    <label><input type="checkbox" ${flt.quotes?'checked':''} onchange="setFlt('quotes',this.checked)">只看台詞</label>
    <label><input type="checkbox" ${flt.hideTrig?'checked':''} onchange="setFlt('hideTrig',this.checked)">隱藏觸發鏈</label>
    <input type="search" placeholder="搜尋角色／技能／台詞…" value="${esc(flt.q)}" oninput="setFlt('q',this.value)">
   </div>`+
   r.roundsDetail.map(rd=>{
    let pl=flt.enemy||flt.quotes?[]:rd.pl;
    let en=flt.quotes?rd.en.filter(i=>i.q):rd.en;
    let trig=flt.hideTrig?[]:rd.trig;
    const hayOf=i=>i.q||[i.who,i.sk,(i.tg||[]).map(x=>x[0]).join(" ")].join(" ");
    const hay=rd.pl.concat(rd.en).map(hayOf).join(" ")+" "+rd.trig.join(" ");
    const hit=q&&hay.includes(q);
    if(q&&!hit)return `<details class="round dim" id="rd${rd.r}"><summary><b class="rn">R${rd.r}</b><span class="small">（無符合）</span></summary></details>`;
    const pct=rd.bossHp!=null?Math.floor(rd.bossHp*100/Math.max(rd.bossMax,1)):null;
    const hpCol=p=>p>50?"#5ec98a":p>25?"#e0a83c":"#e66767";
    const bossBar=pct!=null?`<span class="bhp"><i style="width:${pct}%;background:${hpCol(pct)}"></i><b>${pct}%</b></span><span class="small">${fmt(rd.bossHp)}</span>`:"";
    const delta=rd.delta!=null&&rd.delta!==0?`<span class="${rd.delta<0?'lose':'win'}" style="font-size:.85em">${rd.delta>0?'+':''}${fmt(rd.delta)}</span>`:"";
    const sk=(rd.bossSk||[]).map(nm=>`<span class="tlsk" style="border-color:${skColor(nm)}">${esc(nm)}</span>`).join("");
    const isOpen=(q&&hit)||(keep&&openSet.has("rd"+rd.r));
    return `
   <details class="round" id="rd${rd.r}" ${isOpen?'open':''}><summary>
    <b class="rn">R${rd.r}</b>${miniSurv(rd.r)}${bossBar}${delta}${sk}</summary>
    <div class="rgrid">
     ${pl.length?`<div class="rcol"><div class="rhead">我方</div>${pl.map(i=>actLine(i,false)).join("")}</div>`:""}
     ${en.length?`<div class="rcol rcol-en"><div class="rhead">敵方</div>${en.map(i=>actLine(i,true)).join("")}</div>`:""}
    </div>
    ${bigSurv(rd.r)}
    ${trig.length?`<details class="trigd"><summary class="small">觸發鏈 ${trig.length} 筆</summary>
      <div class="small">${trig.map(esc).join("<br>")}</div></details>`:""}
   </details>`}).join("");
}

/* ── sweeps ── */
function heatColor(win,r){
  const[lo,hi]=DATA.band;
  if(!win)return"rgba(230,103,103,.42)";
  if(r<lo)return"rgba(57,135,229,.40)";
  if(r>hi)return"rgba(224,168,60,.40)";
  return"rgba(94,201,138,.42)";
}
function renderHeatmap(sw){
  const rows=sw.rows;
  const xs=[...new Set(rows.map(r=>r[0]))].sort((a,b)=>a-b);
  const ys=[...new Set(rows.map(r=>r[1]))].sort((a,b)=>b-a);
  const cell={};rows.forEach(r=>{cell[r[0]+"_"+r[1]]=r});
  const[lo,hi]=DATA.band;
  const inBand=rows.filter(r=>r[3]&&r[4]>=lo&&r[4]<=hi);
  let concl=inBand.length?`帶內組合 ${inBand.length} 格（例：${fmt(inBand[0][0])} / ${fmt(inBand[0][1])}）`:"無帶內組合";
  const head=xs.map(x=>`<th class="num">${fmt(x)}</th>`).join("");
  const body=ys.map(y=>`<tr><td class="num"><b>${fmt(y)}</b></td>`+xs.map(x=>{
    const c=cell[x+"_"+y];
    if(!c)return"<td>—</td>";
    return `<td class="heatcell" style="background:${heatColor(c[3],c[4])}"
      title="參數1=${fmt(x)}｜參數2=${fmt(y)}｜boss HP ${fmt(c[2])}｜${c[3]?'勝 '+c[4]+' 回合':'敗（'+c[4]+'回）'}｜存活 ${c[5]}">${c[3]?c[4]:"✕"}</td>`;
  }).join("")+"</tr>").join("");
  return `<div class="sweepblock card2"><h3>${esc(sw.title)}<span class="small">　${sw.date}</span></h3>
   <p>${concl}　<span class="small">格值＝通關回合（✕＝敗）；藍=太快　綠=帶內　黃=偏慢　紅=敗；hover 看明細</span></p>
   <div class="scroll"><table class="heat"><tr><th>參2 \\ 參1</th>${head}</tr>${body}</table></div></div>`;
}
/* ── 參數實驗室（滑桿即時探索；快取驅動、背景掃描、離線可玩歷史點） ── */
 const SRV="http://127.0.0.1:8787";
 const CANCONNECT=/^(localhost|127\.0\.0\.1)$/.test(location.hostname);
let PARAMS=null, SRVON=false;
const CACHE=DATA.sweepCache||{};   // {"spec|spec2":{"v|v2":[bossHp,win,rounds,alive]}}
let lab={p1:null,s1:0,e1:0,v1:0,p2:null,s2:0,e2:0,v2:0,use2:false,queue:[],busy:false,seq:0};
const CATNAME={boss:"BOSS 數值",dmg:"特殊技傷害",heal:"特殊技治療",buff:"增減益幅度",misc:"其他數值"};

function cGet(v1,v2){const b=CACHE[(lab.p1?.spec||"")+"|"+(lab.use2?lab.p2?.spec||"":"")];
  return b?b[v1+"|"+(lab.use2?v2:"")]:null}
function cPut(v1,v2,res){const k=(lab.p1.spec)+"|"+(lab.use2?lab.p2.spec:"");
  (CACHE[k]=CACHE[k]||{})[v1+"|"+(lab.use2?v2:"")]=res}

 async function connectLab(){
   if(!CANCONNECT)return;
   try{
     const ctl=new AbortController();setTimeout(()=>ctl.abort(),1500);
     const r=await fetch(`${SRV}/params?stage=${encodeURIComponent(DATA.stage)}`,{signal:ctl.signal});
     PARAMS=(await r.json()).params;SRVON=true;
   }catch(e){SRVON=false;PARAMS=fallbackParams()}
   if(PARAMS&&PARAMS.length){setParam(1,0);setParam(2,Math.min(1,PARAMS.length-1))}
   renderLabShell();
 }
 function initLab(){
   PARAMS=fallbackParams();
   if(PARAMS.length){setParam(1,0);setParam(2,Math.min(1,PARAMS.length-1))}
   renderLabShell();
 }
function fallbackParams(){
  // 離線：從快取 key 還原可玩參數（歷史掃過的）
  const seen=new Map();
  for(const k in CACHE){
    const[s1,s2]=k.split("|");
    for(const s of[s1,s2])if(s&&!seen.has(s))seen.set(s,{spec:s,cat:"misc",label:s,cur:null});
  }
  return[...seen.values()];
}
function setParam(which,idx){
  const p=PARAMS[idx];if(!p)return;
  const cur=p.cur??(()=>{const b=CACHE[p.spec+"|"];const ks=b?Object.keys(b):[];
    return ks.length?+ks[Math.floor(ks.length/2)].split("|")[0]:100})();
  const st=Math.max(1,Math.round(cur*0.5)), en=Math.max(st+1,Math.round(cur*1.5));
  if(which===1){lab.p1=p;lab.s1=st;lab.e1=en;lab.v1=cur}
  else{lab.p2=p;lab.s2=st;lab.e2=en;lab.v2=cur}
}
function labStep(s,e){return Math.max(1,Math.round((e-s)/20))}
function labVals(s,e){const st=labStep(s,e),out=[];for(let v=s;v<=e;v+=st)out.push(v);return out}

function renderLabShell(){
  const sel=(id,cur)=>{
    const groups={};PARAMS.forEach((p,i)=>{(groups[p.cat]=groups[p.cat]||[]).push([i,p])});
    let h=`<select id="${id}" onchange="labParamChange('${id}',this.value)">`;
    for(const c of["boss","dmg","heal","buff","misc"]){
      if(!groups[c])continue;
      h+=`<optgroup label="${CATNAME[c]||c}">`+groups[c].map(([i,p])=>
        `<option value="${i}" ${p===cur?"selected":""}>${esc(p.label)}${p.cur!=null?"｜表定 "+fmt(p.cur):""}</option>`).join("")+`</optgroup>`;
    }
    return h+`</select>`;
  };
  $("#sweeplab").innerHTML=`<div class="card2">
   <div class="fltbar" style="margin:0 0 .5em"><b>參數實驗室</b>
     <span class="${SRVON?'win':'warn'}" style="font-size:.85em">●${SRVON?"引擎在線":"離線（僅可玩已掃過的點）"}</span>
     ${CANCONNECT&&!SRVON?'<button type="button" onclick="connectLab()">連接本機引擎</button>':''}
    <span id="labprog" class="small" style="margin-left:auto"></span></div>
   <div class="labrow">${sel("lps1",lab.p1)}
     範圍 <input id="lrs1" type="number" value="${lab.s1}" onchange="labRangeChange()">
     ~ <input id="lre1" type="number" value="${lab.e1}" onchange="labRangeChange()"></div>
   <div class="labrow labslider">
     <input id="lsl1" type="range" min="${lab.s1}" max="${lab.e1}" step="${labStep(lab.s1,lab.e1)}" value="${lab.v1}"
       oninput="lab.v1=+this.value;labUpdate()">
     <span id="lval1" class="labval"></span></div>
   <div class="labrow"><label><input type="checkbox" id="luse2" onchange="lab.use2=this.checked;labRebuild()">第二參數（拉它＝切換曲線切片）</label></div>
   <div class="labrow" id="lrow2" style="display:none">${sel("lps2",lab.p2)}
     範圍 <input id="lrs2" type="number" value="${lab.s2}" onchange="labRangeChange()">
     ~ <input id="lre2" type="number" value="${lab.e2}" onchange="labRangeChange()"></div>
   <div class="labrow labslider" id="lrow2s" style="display:none">
     <input id="lsl2" type="range" min="${lab.s2}" max="${lab.e2}" step="${labStep(lab.s2,lab.e2)}" value="${lab.v2}"
       oninput="lab.v2=+this.value;labUpdate()">
     <span id="lval2" class="labval"></span></div>
   <div class="labhero"><div class="heronum" id="labbig">—</div><div class="herosub" id="labsub"></div></div>
   <div id="labchart"></div>
  </div>`;
  labRebuild();
}
function labParamChange(id,idx){setParam(id==="lps1"?1:2,+idx);renderLabShell()}
function labRangeChange(){
  lab.s1=+$("#lrs1").value;lab.e1=+$("#lre1").value;
  if($("#lrs2")){lab.s2=+$("#lrs2").value;lab.e2=+$("#lre2").value}
  lab.v1=Math.min(Math.max(lab.v1,lab.s1),lab.e1);
  lab.v2=Math.min(Math.max(lab.v2,lab.s2),lab.e2);
  renderLabShell();
}
function labRebuild(){
  $("#lrow2").style.display=lab.use2?"":"none";
  $("#lrow2s").style.display=lab.use2?"":"none";
  lab.seq++;lab.queue=[];
  labQueueFill();
  labUpdate();
}
function labQueueFill(){
  if(!SRVON||!lab.p1)return;
  const vals=labVals(lab.s1,lab.e1).filter(v=>!cGet(v,lab.v2));
  // 由滑桿當前值向外排序（先掃使用者正在看的區域）
  vals.sort((a,b)=>Math.abs(a-lab.v1)-Math.abs(b-lab.v1));
  lab.queue=vals.map(v=>[v,lab.v2]);
  labPump();
}
async function labPump(){
  if(lab.busy)return;
  lab.busy=true;
  const myseq=lab.seq;
  while(lab.queue.length){
    if(myseq!==lab.seq)break;
    const[v1,v2]=lab.queue.shift();
    if(cGet(v1,v2)){labProgress();continue}
    try{
      const u=`${SRV}/point?stage=${encodeURIComponent(DATA.stage)}&spec=${encodeURIComponent(lab.p1.spec)}&value=${v1}`+
        (lab.use2?`&spec2=${encodeURIComponent(lab.p2.spec)}&value2=${v2}`:"");
      const r=await(await fetch(u)).json();
      if(r.error)throw new Error(r.error);
      cPut(v1,v2,r.result);
    }catch(e){$("#labprog").textContent="引擎錯誤："+e.message;break}
    if(myseq===lab.seq)labUpdate();
  }
  lab.busy=false;
  labProgress();
}
function labProgress(){
  const vals=labVals(lab.s1,lab.e1);
  const done=vals.filter(v=>cGet(v,lab.v2)).length;
  $("#labprog").textContent=done<vals.length?`背景掃描 ${done}/${vals.length}`:(SRVON?`${vals.length} 點就緒`:"");
}
function labUpdate(){
  if(!lab.p1)return;
  $("#lval1").textContent=fmt(lab.v1)+(lab.p1.cur!=null?`（表定 ${fmt(lab.p1.cur)}）`:"");
  if(lab.use2&&lab.p2)$("#lval2").textContent=fmt(lab.v2);
  // 拉 p2＝換切片：重排佇列
  const res=cGet(lab.v1,lab.v2);
  const[lo,hi]=DATA.band;
  if(res){
    const[bhp,win,rd,alive]=res;
    $("#labbig").textContent=win?rd:"✕";
    $("#labbig").style.color=!win?"#e66767":rd<lo?"#3987e5":rd>hi?"#e0a83c":"#5ec98a";
    $("#labsub").innerHTML=win?`回合通關<br>${rd<lo?"太快":rd>hi?"偏慢":"帶內 ✅"}｜存活 ${alive}｜boss HP ${fmt(bhp)}`
                             :`未通關（${rd} 回）<br>存活 ${alive}`;
  }else{
    $("#labbig").textContent="…";$("#labbig").style.color="#8a897f";
    $("#labsub").textContent=SRVON?"計算中（約 1 秒）":"此點未掃過（離線）";
    if(SRVON&&!lab.queue.some(q=>q[0]===lab.v1&&q[1]===lab.v2))
      {lab.queue.unshift([lab.v1,lab.v2]);labPump()}
    else if(SRVON)
      {lab.queue.sort((a,b)=>Math.abs(a[0]-lab.v1)-Math.abs(b[0]-lab.v1))}
  }
  labChart();
  labProgress();
}
function labChart(){
  const W=980,H=250,pl=50,pr=16,pt=12,pb=30,w=W-pl-pr,h=H-pt-pb;
  const vals=labVals(lab.s1,lab.e1);
  const pts=vals.map(v=>[v,cGet(v,lab.v2)]).filter(x=>x[1]);
  const[lo,hi]=DATA.band;
  const rmaxA=Math.max(...pts.map(x=>x[1][2]),hi)+2;
  const x=v=>pl+(v-lab.s1)/Math.max(lab.e1-lab.s1,1)*w, y=r=>pt+(1-r/rmaxA)*h;
  let s=`<rect x="${pl}" y="${y(hi)}" width="${w}" height="${y(lo)-y(hi)}" fill="rgba(0,131,0,.16)"/>
   <text x="${pl+4}" y="${y(hi)+12}" font-size="10" fill="#5ec98a">目標帶 ${lo}–${hi} 回</text>`;
  for(let r=0;r<=rmaxA;r+=Math.max(1,Math.floor(rmaxA/6)))
    s+=`<line x1="${pl}" y1="${y(r)}" x2="${W-pr}" y2="${y(r)}" stroke="#2c2c2a"/>
     <text x="${pl-6}" y="${y(r)+4}" text-anchor="end" font-size="11" fill="#8a897f">${r}</text>`;
  // 表定值標記
  if(lab.p1.cur!=null&&lab.p1.cur>=lab.s1&&lab.p1.cur<=lab.e1)
    s+=`<line x1="${x(lab.p1.cur)}" y1="${pt}" x2="${x(lab.p1.cur)}" y2="${pt+h}" stroke="#8a897f" stroke-dasharray="2,4"/>
     <text x="${x(lab.p1.cur)}" y="${pt+h+24}" text-anchor="middle" font-size="10" fill="#8a897f">表定</text>`;
  // 曲線（勝點）＋敗點✕
  const wins=pts.filter(x=>x[1][1]);
  if(wins.length>1)s+=`<polyline points="${wins.map(q=>`${x(q[0]).toFixed(1)},${y(q[1][2]).toFixed(1)}`).join(" ")}"
    fill="none" stroke="#3987e5" stroke-width="2"/>`;
  wins.forEach(q=>{s+=`<circle cx="${x(q[0]).toFixed(1)}" cy="${y(q[1][2]).toFixed(1)}" r="4" fill="#3987e5">
    <title>${fmt(q[0])} → 勝 ${q[1][2]} 回</title></circle>`});
  pts.filter(q=>!q[1][1]).forEach(q=>{const cx=x(q[0]),cy=y(Math.min(q[1][2],rmaxA));
    s+=`<g stroke="#e66767" stroke-width="2"><line x1="${cx-5}" y1="${cy-5}" x2="${cx+5}" y2="${cy+5}"/>
     <line x1="${cx-5}" y1="${cy+5}" x2="${cx+5}" y2="${cy-5}"/><title>${fmt(q[0])} → 敗</title></g>`});
  // 游標豎線＝滑桿位置
  s+=`<line x1="${x(lab.v1)}" y1="${pt}" x2="${x(lab.v1)}" y2="${pt+h}" stroke="#eceadf" stroke-width="1.5" opacity=".8"/>`;
  // X 刻度
  vals.filter((_,i)=>i%Math.max(1,Math.floor(vals.length/10))===0).forEach(v=>{
    s+=`<text x="${x(v).toFixed(0)}" y="${H-4}" text-anchor="middle" font-size="10" fill="#8a897f">${fmt(v)}</text>`});
  $("#labchart").innerHTML=`<svg viewBox="0 0 ${W} ${H}">${s}</svg>
   <p class="small">X＝${esc(lab.p1.label)}｜Y＝通關回合（✕＝敗）；白豎線＝滑桿位置、灰虛線＝表定值；${lab.use2?"拉第二參數滑桿＝切換切片；":""}掃過的點永久快取</p>`;
}
function renderSweepBlock(sw){
  if(sw.spec2)return renderHeatmap(sw);
  return renderCurve(sw);
}
function renderCurve(sw){
  const rows=sw.rows,[lo,hi]=DATA.band;
    const W=980,H=280,pl=50,pr=16,pt=14,pb=36,w=W-pl-pr,h=H-pt-pb;
    const ps=rows.map(r=>r[0]),pmin=Math.min(...ps),pmax=Math.max(...ps);
    const rmaxA=Math.max(...rows.map(r=>r[3]),hi)+2;
    const x=p=>pl+(p-pmin)/Math.max(pmax-pmin,1)*w, y=r=>pt+(1-r/rmaxA)*h;
    let s=`<rect x="${pl}" y="${y(hi)}" width="${w}" height="${y(lo)-y(hi)}" fill="rgba(0,131,0,.16)"/>
     <text x="${pl+4}" y="${y(hi)+12}" font-size="10" fill="#5ec98a">目標帶 ${lo}–${hi} 回合</text>`;
    for(let r=0;r<=rmaxA;r+=Math.max(1,Math.floor(rmaxA/6)))s+=`<line x1="${pl}" y1="${y(r)}" x2="${W-pr}" y2="${y(r)}" stroke="#2c2c2a"/>
     <text x="${pl-6}" y="${y(r)+4}" text-anchor="end" font-size="11" fill="#8a897f">${r}</text>`;
    const wins=rows.filter(r=>r[2]);
    if(wins.length>1)s+=`<polyline points="${wins.map(r=>`${x(r[0]).toFixed(1)},${y(r[3]).toFixed(1)}`).join(" ")}"
      fill="none" stroke="#3987e5" stroke-width="2"/>`;
    wins.forEach(r=>{s+=`<circle cx="${x(r[0]).toFixed(1)}" cy="${y(r[3]).toFixed(1)}" r="4" fill="#3987e5">
      <title>${fmt(r[0])} → 勝 ${r[3]} 回合</title></circle>`});
    rows.filter(r=>!r[2]).forEach(r=>{const cx=x(r[0]),cy=y(Math.min(r[3],rmaxA));
      s+=`<g stroke="#e66767" stroke-width="2"><line x1="${cx-5}" y1="${cy-5}" x2="${cx+5}" y2="${cy+5}"/>
       <line x1="${cx-5}" y1="${cy+5}" x2="${cx+5}" y2="${cy-5}"/><title>${fmt(r[0])} → 敗</title></g>`});
    let tk="";ps.filter((_,i)=>i%Math.max(1,Math.floor(ps.length/10))===0).forEach(p=>{
      tk+=`<text x="${x(p).toFixed(0)}" y="${H-4}" text-anchor="middle" font-size="10" fill="#8a897f">${fmt(p)}</text>`});
    const inBand=rows.filter(r=>r[2]&&r[3]>=lo&&r[3]<=hi).map(r=>r[0]);
    const lastWin=Math.max(...rows.filter(r=>r[2]).map(r=>r[0]),-Infinity);
    const firstLose=Math.min(...rows.filter(r=>!r[2]&&r[0]>lastWin).map(r=>r[0]),Infinity);
    let concl=[];
    if(inBand.length)concl.push(`帶內參數範圍 ≈ <b>${fmt(Math.min(...inBand))} ~ ${fmt(Math.max(...inBand))}</b>`);
    if(isFinite(firstLose)&&lastWin>-Infinity)concl.push(`懸崖：<b>${fmt(lastWin)} → ${fmt(firstLose)}</b> 之間`);
    const trs=rows.map(r=>`<tr><td class="num">${fmt(r[0])}</td><td class="num">${fmt(r[1])}</td>
     <td class="ctr"><span class="${r[2]?'win':'lose'}">${r[2]?'勝':'敗'}</span></td><td class="num">${r[3]}</td><td class="num">${r[4]}</td></tr>`).join("");
    return `<div class="sweepblock card2"><h3>${esc(sw.title)}<span class="small">　${sw.date}</span></h3>
     <p>${concl.join("　｜　")||"（無結論）"}</p>
     <svg viewBox="0 0 ${W} ${H}">${s}${tk}</svg>
     <details><summary class="small">明細表</summary><table><tr><th>參數值</th><th>boss HP</th><th>勝負</th><th>回合</th><th>存活</th></tr>${trs}</table></details></div>`;
}
function renderSweeps(){
  initLab();
  if(!DATA.sweeps.length){$("#sweeps").innerHTML="<p class='small'>（尚無掃描）</p>";return}
  $("#sweeps").innerHTML=DATA.sweeps.map(sw=>{
    if(sw.spec2)return renderHeatmap(sw);
    return renderCurve(sw);
  }).join("");
}

function expandAll(open){document.querySelectorAll("#dRounds details.round").forEach(d=>d.open=open)}
renderAll();renderDetail();renderSweeps();
