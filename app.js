/* 一建机电刷题系统 —— 核心逻辑（纯前端，无依赖） */

// ===== 题库注册表 =====
const BANK = { "S1_1": window.S1_1, "S1_2": window.S1_2 };
const STARS = window.STARS || {}; // 星级映射(star/hot/zyears)，由 stars.js 提供
const MASTER_STREAK = 3; // 连续答对多少次判定为"烂熟"

// 取某题的星级信息；sid=节id(1.1/1.2)，qid=题目id(含案例小问 case1-s1)
function starInfo(sid, qid){
  const s = (STARS[sid]||{})[qid];
  if (!s) return null;
  return s;
}
// 星级徽章 HTML：★★★★★ 实心/空心 + 高频标签 + 真题年份
function starBadge(sid, qid){
  const s = starInfo(sid, qid);
  if (!s || !s.star) return "";
  const full = "★".repeat(s.star), empty = "☆".repeat(5 - s.star);
  const cls = s.star>=5?"st5":(s.star===4?"st4":(s.star===3?"st3":"stLow"));
  const hot = s.hot ? `<span class="tag-hot" title="历年真题高频/核心命题点">🔥高频</span>` : "";
  const zy = s.zyears ? `<span class="tag-zhenti" title="该考点历年真题考过的年份">真题 ${esc(s.zyears)}</span>` : "";
  return `<span class="q-star ${cls}" title="可考性星级（越高越可能考）">${full}<span class="star-empty">${empty}</span></span>${hot}${zy}`;
}
const STORE_KEY = "jidian_quiz_progress_v1";

// ===== 题目扁平化：把实务案例的背景+小问展开成独立刷题条目 =====
// 案例题对齐真题形式（一段背景材料 + 若干选择小问），小问按单选/多选各自判分计掌握度。
const _flatCache = {};
function flatQuestions(bank){
  if (_flatCache[bank.id]) return _flatCache[bank.id];
  const out = [];
  (bank.questions||[]).forEach(q=>{
    if (q.kind==="case"){
      (q.subs||[]).forEach(s=>{
        out.push(Object.assign({}, s, {
          id: q.id+"-"+s.id,          // 全局唯一：case1-s1
          caseId: q.id,
          caseTitle: q.title,
          caseNo: q.no,
          background: q.background,
          caseSource: q.source
        }));
      });
    } else {
      out.push(q);
    }
  });
  _flatCache[bank.id] = out;
  return out;
}

// ===== 进度存储（localStorage 降级到内存） =====
let memoryStore = {};
function loadProgress() {
  try {
    const s = localStorage.getItem(STORE_KEY);
    return s ? JSON.parse(s) : { q: {}, p: {}, days: [], lastDay: "" };
  } catch (e) {
    return memoryStore.q ? memoryStore : { q: {}, p: {}, days: [], lastDay: "" };
  }
}
function saveProgress() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(PROGRESS)); }
  catch (e) { memoryStore = PROGRESS; }
}
let PROGRESS = loadProgress();

function touchDay() {
  const d = new Date();
  const key = d.getFullYear() + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + String(d.getDate()).padStart(2,"0");
  if (PROGRESS.lastDay !== key) {
    const yesterday = new Date(d.getTime() - 86400000);
    const ykey = yesterday.getFullYear() + "-" + String(yesterday.getMonth()+1).padStart(2,"0") + "-" + String(yesterday.getDate()).padStart(2,"0");
    let streak = 1;
    if (PROGRESS.lastDay === ykey) streak = (PROGRESS.days && PROGRESS.days.streak ? PROGRESS.days.streak : 1) + 1;
    PROGRESS.days = { streak: streak, last: key };
    PROGRESS.lastDay = key;
    saveProgress();
  }
}
function studyDays() { return (PROGRESS.days && PROGRESS.days.streak) || 0; }

// ===== 题目状态 =====
function qState(sectionId, qid) {
  const k = sectionId + "::" + qid;
  if (!PROGRESS.q[k]) PROGRESS.q[k] = { right:0, wrong:0, streak:0 };
  return PROGRESS.q[k];
}
function levelOf(st) {
  if (st.streak >= MASTER_STREAK) return "mastered";
  if (st.streak > 0 || st.right > 0) return "learning";
  return "new";
}
function sectionStats(sectionId) {
  // 兼容两种标识：data key（S1_1）与节 id（1.1）
  let bank = BANK[sectionId];
  if (!bank){
    const info = sectionById(sectionId);
    if (info && info.sec.data) bank = BANK[info.sec.data];
  }
  if (!bank) return { total:0, mastered:0, learning:0, pct:0 };
  let mastered=0, learning=0;
  flatQuestions(bank).forEach(q => {
    const lv = levelOf(qState(sectionId, q.id));
    if (lv==="mastered") mastered++;
    else if (lv==="learning") learning++;
  });
  const total = flatQuestions(bank).length;
  return { total, mastered, learning, pct: total ? Math.round(mastered/total*100) : 0 };
}
function globalStats() {
  let total=0, mastered=0;
  Object.keys(BANK).forEach(sid => {
    const s = sectionStats(sid);
    total += s.total; mastered += s.mastered;
  });
  return { total, mastered, pct: total ? Math.round(mastered/total*100) : 0 };
}
function sectionById(id) {
  for (const part of window.CATALOG.parts)
    for (const ch of part.chapters)
      for (const sec of ch.sections)
        if (sec.id === id) return { part, ch, sec };
  return null;
}

// ===== 视图切换 =====
let CUR = { view:"home", sectionId:null, mode:"order", filtered:false };
let QUIZ = { list:[], idx:0, answered:false, selected:null };

function $(sel){ return document.querySelector(sel); }
function esc(s){ return String(s).replace(/[&<>]/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;"}[c])); }
function md(s){ return esc(s).replace(/\*\*(.+?)\*\*/g, '<em>$1</em>'); }
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(t._t); t._t=setTimeout(()=>t.classList.remove("show"),1800); }

function showView(v){
  CUR.view = v;
  ["home","points","quiz","stats"].forEach(x => $("#view"+x[0].toUpperCase()+x.slice(1)).classList.toggle("hidden", x!==v));
  renderCrumbs();
}

// ===== 侧栏 =====
function renderSidebar(){
  const sb = $("#sidebar");
  let html = `<div class="side-home ${CUR.view==="home"?"active":""}" onclick="goHome()"><span class="nav-home-icon">◈</span> 总览</div>`;
  window.CATALOG.parts.forEach(part=>{
    html += `<div class="part-label">${esc(part.name)}</div>`;
    part.chapters.forEach(ch=>{
      html += `<div class="chap-label">${esc(ch.name)}</div>`;
      ch.sections.forEach(sec=>{
        const hasData = !!sec.data && !!BANK[sec.data];
        const st = hasData ? sectionStats(sec.id) : null;
        const dotCls = !hasData ? "" : (st.pct===100 ? "done" : (st.mastered>0 ? "doing" : ""));
        const pctTxt = hasData ? `<span class="pct">${st.pct}%</span>` : `<span class="pct">—</span>`;
        const active = CUR.sectionId===sec.id && CUR.view!=="home" ? "active":"";
        const lock = hasData ? "" : "locked";
        const onclick = hasData ? `openSection('${sec.id}')` : `toast('该节题库尚未录入')`;
        html += `<div class="side-item ${active} ${lock}" onclick="${onclick}"><span class="dot ${dotCls}"></span>${esc(sec.id+" "+sec.name)}${pctTxt}</div>`;
      });
    });
  });
  sb.innerHTML = html;
}

function renderCrumbs(){
  let html = `<span onclick="goHome()" style="cursor:pointer">总览</span>`;
  if (CUR.sectionId){
    const info = sectionById(CUR.sectionId);
    const vn = {home:"总览",points:"知识点",quiz:"刷题",stats:"统计"}[CUR.view];
    html += ` / <b>${esc(info.part.name)}</b> / <b>${esc(info.ch.name)}</b> / <b>${CUR.sectionId} ${esc(info.sec.name)}</b> / ${vn}`;
  } else if (CUR.view!=="home"){
    html += ` / <b>${{points:"知识点",quiz:"刷题",stats:"统计"}[CUR.view]}</b>`;
  }
  $("#crumbs").innerHTML = html;
}

// ===== 总览 =====
function renderHome(){
  const g = globalStats();
  $("#homePct").textContent = g.pct+"%";
  $("#homeRing").style.background = `conic-gradient(var(--acc) ${g.pct*3.6}deg, var(--bg4) ${g.pct*3.6}deg)`;
  $("#homeDetail").textContent = `${g.mastered} / ${g.total} 题已烂熟`;
  $("#studyDays").textContent = studyDays();

  let html = "";
  window.CATALOG.parts.forEach(part=>{
    part.chapters.forEach(ch=>{
      ch.sections.forEach(sec=>{
        const hasData = !!sec.data && !!BANK[sec.data];
        const st = hasData ? sectionStats(sec.id) : null;
        const pct = st ? st.pct : 0;
        const lock = hasData ? "" : "locked";
        const onclick = hasData ? `openSection('${sec.id}')` : `toast('该节题库尚未录入')`;
        const badge = hasData ? `${st.mastered}/${st.total} 烂熟` : "待录入";
        html += `<div class="sec-card ${lock}" onclick="${onclick}">
          <div class="sc-top"><span class="sc-id">${sec.id}</span><span class="muted">${esc(sec.page)}</span></div>
          <div class="sc-name">${esc(sec.name)}</div>
          <div class="mini-bar"><i style="width:${pct}%"></i></div>
          <div class="sc-foot"><span>${badge}</span><span>${pct}%</span></div>
        </div>`;
      });
    });
  });
  $("#sectionGrid").innerHTML = html;
}

// ===== 打开某节：默认进刷题 =====
function openSection(id){
  const info = sectionById(id);
  if (!info.sec.data || !BANK[info.sec.data]) { toast("该节题库尚未录入"); return; }
  CUR.sectionId = id;
  CUR.view = "quiz";
  buildModeBar();
  startQuiz("order");
  showView("quiz");
  renderSidebar();
}
function goHome(){
  CUR.sectionId=null; CUR.view="home";
  renderHome(); showView("home"); renderSidebar();
}
function goPoints(){
  CUR.view="points"; CUR.filtered=false;
  renderPoints(); showView("points"); renderSidebar();
}
function goStats(){
  CUR.view="stats"; renderStats(); showView("stats"); renderSidebar();
}

// ===== 知识点卡片 =====
let POINT_CAT = "全部";
function renderPoints(){
  const bank = BANK[CUR.sectionId ? sectionById(CUR.sectionId).sec.data : null];
  if (!bank) return;
  $("#pointsTitle").textContent = CUR.sectionId+" "+bank.name+" · 知识点卡片";
  const cats = ["全部", ...new Set(bank.points.map(p=>p.cat))];
  $("#pointCats").innerHTML = cats.map(c=>`<span class="cat-chip ${c===POINT_CAT?"active":""}" onclick="POINT_CAT='${esc(c)}';renderPoints()">${esc(c)}</span>`).join("");

  const pk = "P::"+CUR.sectionId+"::";
  let pts = bank.points.map((p,i)=>({p,i}));
  if (CUR.filtered) pts = pts.filter(({p,i})=>!PROGRESS.p[pk+i]);
  if (POINT_CAT!=="全部") pts = pts.filter(({p})=>p.cat===POINT_CAT);

  const remembered = bank.points.filter((p,i)=>PROGRESS.p[pk+i]).length;
  $("#pointsProgress").textContent = `已记住 ${remembered}/${bank.points.length}`;

  $("#pointList").innerHTML = pts.map(({p,i})=>{
    const on = !!PROGRESS.p[pk+i];
    return `<div class="pt-card ${on?"remembered":""}">
      <div class="pt-check ${on?"on":""}" onclick="togglePoint(${i})">✓</div>
      <div class="pt-body"><div class="pt-cat">${esc(p.cat)}</div>
      <div class="pt-text">${md(p.text)}</div>
      <div class="pt-page">出处：${esc(p.page)}</div></div>
    </div>`;
  }).join("") || `<div class="muted" style="padding:20px">当前筛选下没有卡片。</div>`;
}
function togglePoint(i){
  const pk = "P::"+CUR.sectionId+"::"+i;
  if (PROGRESS.p[pk]) delete PROGRESS.p[pk]; else PROGRESS.p[pk]=1;
  saveProgress(); renderPoints();
}

// ===== 刷题模式栏 =====
function buildModeBar(){
  const modes = [
    ["order","顺序练"], ["hot","高频优先"], ["star45","只看4-5星"], ["weak","弱项优先"], ["wrong","只刷错题"], ["random","随机"], ["new","只刷未掌握"]
  ];
  $("#modeBar").innerHTML = modes.map(([k,n])=>`<span class="mode-btn ${k===CUR.mode?"active":""}" onclick="startQuiz('${k}')">${n}</span>`).join("");
}

function startQuiz(mode){
  CUR.mode = mode;
  buildModeBar();
  const sid = sectionById(CUR.sectionId).sec.data;
  const bank = BANK[sid];
  let qs = flatQuestions(bank).slice();
  const lv = q => levelOf(qState(CUR.sectionId, q.id));
  const starOf = q => (starInfo(CUR.sectionId, q.id)||{}).star || 0;
  const rank = {new:0,learning:1,mastered:2};
  if (mode==="hot") qs.sort((a,b)=>{
    const sa=starOf(a), sb=starOf(b);
    if (sa!==sb) return sb-sa; // 星级高的排前
    return rank[lv(a)]-rank[lv(b)]; // 同级未掌握优先
  });
  else if (mode==="star45") qs = qs.filter(q=>starOf(q)>=4);
  else if (mode==="weak") qs.sort((a,b)=>{
    const ra = rank[lv(a)]*1000 + (qState(CUR.sectionId,a.id).wrong*-10);
    const rb = rank[lv(b)]*1000 + (qState(CUR.sectionId,b.id).wrong*-10);
    return ra-rb;
  });
  else if (mode==="wrong") qs = qs.filter(q=>qState(CUR.sectionId,q.id).wrong>0);
  else if (mode==="new") qs = qs.filter(q=>lv(q)!=="mastered");
  else if (mode==="random") qs.sort(()=>Math.random()-0.5);

  QUIZ = { list:qs, idx:0, answered:false, selected:null, sectionId:CUR.sectionId };
  if (!qs.length){ toast("该模式下没有题目"); }
  renderQuestion();
}

function renderQuestion(){
  const total = QUIZ.list.length;
  const card = $("#quizCard");
  if (!total){
    card.innerHTML = `<div class="done-panel"><div class="big">该模式下暂无题目</div><div class="sub">换一个模式试试，或先去做知识点卡片</div></div>`;
    $("#qbarFill").style.width="0%"; $("#qCounter").textContent="";
    $("#quizFooter").innerHTML=""; return;
  }
  if (QUIZ.idx >= total){
    const st = sectionStats(CUR.sectionId);
    card.innerHTML = `<div class="done-panel">
      <div class="big">本节已全部过完 ✓</div>
      <div class="sub">本节烂熟 ${st.mastered}/${st.total} 题（${st.pct}%）· 建议用「弱项优先」再刷一轮巩固</div>
      <button class="btn" onclick="startQuiz('weak')">弱项优先再刷</button>
      <button class="btn btn-ghost" onclick="goPoints()">看知识点卡片</button>
    </div>`;
    $("#qbarFill").style.width="100%";
    $("#qCounter").textContent=`${total}/${total}`;
    $("#quizFooter").innerHTML=""; return;
  }

  const q = QUIZ.list[QUIZ.idx];
  const st = qState(CUR.sectionId, q.id);
  const lv = levelOf(st);
  const lvTxt = {new:"新题",learning:"巩固中",mastered:"已烂熟"}[lv];
  const lvCls = {new:"m-new",learning:"m-learning",mastered:"m-mastered"}[lv];
  const typeTxt = q.caseId
    ? (q.type==="single" ? "案例·单选" : "案例·多选")
    : {single:"单选题",multi:"多选题",judge:"判断题",blank:"填空自评"}[q.type];

  $("#qbarFill").style.width = (QUIZ.idx/total*100)+"%";
  $("#qCounter").textContent = `${QUIZ.idx+1} / ${total}`;
  $("#quizTitle").textContent = CUR.sectionId+" "+BANK[sectionById(CUR.sectionId).sec.data].name+" · 刷题";

  let body = "";
  if (q.type==="single" || q.type==="multi"){
    body = `<div class="q-options">` + q.options.map((o,i)=>
      `<div class="opt" id="opt${i}" onclick="pick(${i})"><span class="key">${String.fromCharCode(65+i)}</span><span>${esc(o)}</span></div>`
    ).join("") + `</div>`;
  } else if (q.type==="judge"){
    body = `<div class="judge-btns">
      <div class="opt" id="opt0" onclick="pick(0)"><span class="key">√</span><span>正确</span></div>
      <div class="opt" id="opt1" onclick="pick(1)"><span class="key">×</span><span>错误</span></div>
    </div>`;
  } else {
    body = `<textarea class="blank-input" id="blankInput" placeholder="在心中作答或写出要点，然后点下方『查看答案』自行核对"></textarea>`;
  }

  // 实务案例题：展示背景资料 + 第几小问
  let caseHtml = "";
  if (q.caseId){
    const subNo = (q.id.split("-")[1]||"").replace("s","")*1;
    caseHtml = `<div class="case-block">
      <div class="case-head"><span class="case-tag">${esc(q.caseNo||"实务案例")}</span> ${esc(q.caseTitle||"")} <span class="case-subno">第 ${subNo} 问</span></div>
      <div class="case-bg"><span class="case-bg-label">背景资料</span>${esc(q.background||"")}</div>
    </div>`;
  }
  // 多选题真题规则提示
  const ruleTip = q.type==="multi" ? `<div class="rule-tip">真题规则：每题5个备选项，正确答案2~4个；<b>多选或错选不得分，少选每个正确选项得0.5分</b>。本题按"全部选对"计入烂熟。</div>` : "";

  const starHtml = starBadge(QUIZ.sectionId, q.id);
  card.innerHTML = `<div class="q-meta">
      <span class="q-type">${typeTxt}</span>
      ${starHtml}
      <span class="q-mastery ${lvCls}">${lvTxt}</span>
      <span class="muted">出处 ${esc(q.source)} · 累计 对${st.right}/错${st.wrong}</span>
    </div>
    ${caseHtml}
    <div class="q-stem">${esc(q.stem)}</div>
    ${ruleTip}
    <div id="qBody">${body}</div>
    <div id="fbSlot"></div>`;

  QUIZ.answered=false; QUIZ.selected=null; QUIZ.awaitSelf=false;
  renderFooter();
}

function pick(i){
  if (QUIZ.answered) return;
  const q = QUIZ.list[QUIZ.idx];
  if (q.type==="multi"){
    QUIZ.selected = QUIZ.selected || [];
    const pos = QUIZ.selected.indexOf(i);
    if (pos>=0) QUIZ.selected.splice(pos,1); else QUIZ.selected.push(i);
    document.getElementById("opt"+i).classList.toggle("sel");
  } else if (q.type==="judge"){
    // 判断题用固定两个按钮（正确=0 / 错误=1），没有 options 字段
    QUIZ.selected = i;
    const a=document.getElementById("opt0"), b=document.getElementById("opt1");
    if(a) a.classList.toggle("sel", i===0);
    if(b) b.classList.toggle("sel", i===1);
  } else {
    QUIZ.selected = i;
    (q.options||[]).forEach((_,k)=>{ const el=document.getElementById("opt"+k); if(el) el.classList.toggle("sel", k===i); });
  }
  renderFooter();
}

function renderFooter(){
  const f = $("#quizFooter");
  const q = QUIZ.list[QUIZ.idx];
  if (!q) { f.innerHTML=""; return; }
  if (QUIZ.answered){
    f.innerHTML = `<span class="muted">${q.type==="blank"?"按自评结果计入掌握度":"系统已自动判分"}</span>
      <button class="btn" onclick="nextQuestion()">下一题 →</button>`;
  } else {
    const needSel = q.type!=="blank" && (QUIZ.selected==null || (Array.isArray(QUIZ.selected)&&!QUIZ.selected.length));
    if (q.type==="blank"){
      f.innerHTML = `<button class="btn btn-ghost" onclick="revealAnswer()">查看答案并自评</button>`;
    } else {
      f.innerHTML = `<button class="btn" id="btnSubmit" onclick="submitAnswer()" ${needSel?"disabled":""}>提交答案</button>`;
    }
  }
}

function submitAnswer(){
  if (QUIZ.answered) return;
  const q = QUIZ.list[QUIZ.idx];
  let correct=false, partial=false;
  if (q.type==="single"){
    correct = (QUIZ.selected === q.answer);
  } else if (q.type==="judge"){
    // 判断题选项索引：正确=0，错误=1；答案为布尔值
    correct = (QUIZ.selected === (q.answer ? 0 : 1));
  } else if (q.type==="multi"){
    const a=QUIZ.selected.slice().sort((x,y)=>x-y), b=q.answer.slice().sort((x,y)=>x-y);
    const full = a.length===b.length && a.every((v,i)=>v===b[i]);
    // 真题规则：少选（所选全是正确项的子集）得部分分，但只有全对才算掌握
    partial = !full && a.length>0 && a.every(v=>b.includes(v));
    correct = full;
  }
  // 少选在真题中得部分分，但未达"吃透"，仍按一次未完全答对计入，打断连对
  applyResult(q, correct);
  showFeedback(q, correct, partial);
}

function revealAnswer(){
  if (QUIZ.answered || QUIZ.awaitSelf) return;
  const q = QUIZ.list[QUIZ.idx];
  $("#fbSlot").innerHTML = `<div class="feedback fb-ok">
    <div class="fb-title">参考答案</div>
    <div class="fb-answer">${q.answer.map(a=>esc(a)).join("　")}</div>
    <div class="fb-label">教材依据</div><div>${esc(q.explain)}</div>
    <div class="fb-source">出处：${esc(q.source)}</div>
    <div style="margin-top:14px" class="self-judge">
      <button class="btn btn-ok" onclick="selfJudge(true)">我答对了 ✓</button>
      <button class="btn btn-no" onclick="selfJudge(false)">我答错了 ✗</button>
    </div>
  </div>`;
  QUIZ.awaitSelf = true; // 等待自评，防重复点击
  $("#quizFooter").innerHTML=`<span class="muted">请诚实自评，以保证掌握度准确</span>`;
}

function selfJudge(correct){
  if (!QUIZ.awaitSelf) return; // 已评过，忽略重复点击
  QUIZ.awaitSelf = false;
  const q = QUIZ.list[QUIZ.idx];
  applyResult(q, correct);
  // 用最终态整体替换反馈区，移除自评按钮，避免重复计分
  $("#fbSlot").innerHTML = `<div class="feedback ${correct?"fb-ok":"fb-no"}">
    <div class="fb-title">${correct?"自评：答对 ✓":"自评：答错 ✗，已记入错题"}</div>
    <div class="fb-label">参考答案</div>
    <div class="fb-answer">${q.answer.map(a=>esc(a)).join("　")}</div>
    <div class="fb-label">教材依据与解析</div><div>${esc(q.explain)}</div>
    <div class="fb-source">出处：${esc(q.source)}</div>
  </div>`;
  QUIZ.answered=true; renderFooter();
}

function applyResult(q, correct){
  const st = qState(CUR.sectionId, q.id);
  if (correct){ st.right++; st.streak++; }
  else { st.wrong++; st.streak=0; }
  saveProgress();
}

function showFeedback(q, correct, partial){
  // 标注选项对错
  if (q.type==="single" || q.type==="multi"){
    const ans = Array.isArray(q.answer)?q.answer:[q.answer];
    ans.forEach(i=>{ const el=document.getElementById("opt"+i); if(el) el.classList.add("right"); });
    const sel = Array.isArray(QUIZ.selected)?QUIZ.selected:[QUIZ.selected];
    sel.forEach(i=>{ if(!ans.includes(i)){ const el=document.getElementById("opt"+i); if(el) el.classList.add("wrong"); } });
  } else if (q.type==="judge"){
    const ai = q.answer?0:1;
    const el=document.getElementById("opt"+ai); if(el) el.classList.add("right");
    if (QUIZ.selected!==ai){ const w=document.getElementById("opt"+QUIZ.selected); if(w) w.classList.add("wrong"); }
  }
  const answerTxt = q.type==="judge" ? (q.answer?"正确":"错误")
    : q.type==="blank" ? q.answer.join("　")
    : (Array.isArray(q.answer)?q.answer:[q.answer]).map(i=>q.options[i]).join("；");

  const titleTxt = correct ? "回答正确 ✓" : (partial ? "少选 · 真题得部分分，但需全部选对才算吃透" : "回答错误 ✗");
  const showCase = q.caseId ? `<div class="fb-source">${esc(q.caseNo)} · ${esc(q.caseTitle)} · 案例出处：${esc(q.caseSource)}</div>` : "";
  $("#fbSlot").innerHTML = `<div class="feedback ${correct?"fb-ok":(partial?"fb-partial":"fb-no")}">
    <div class="fb-title">${titleTxt}</div>
    <div class="fb-label">正确答案</div><div class="fb-answer">${esc(answerTxt)}</div>
    <div class="fb-label">教材依据与解析</div><div>${esc(q.explain)}</div>
    <div class="fb-source">出处：${esc(q.source)}</div>
    ${showCase}
  </div>`;
  QUIZ.answered=true; renderFooter();
}

function nextQuestion(){
  QUIZ.idx++;
  renderQuestion();
  if (QUIZ.idx % 10 === 0) renderSidebar();
}

// ===== 统计 =====
function renderStats(){
  const g = globalStats();
  let html = `<div class="stat-cards">
    <div class="stat-card"><div class="stat-num">${g.pct}%</div><div class="stat-lbl">全书烂熟度</div></div>
    <div class="stat-card"><div class="stat-num">${g.mastered}/${g.total}</div><div class="stat-lbl">烂熟题数</div></div>
    <div class="stat-card"><div class="stat-num">${studyDays()}</div><div class="stat-lbl">连续学习天数</div></div>
    <div class="stat-card"><div class="stat-num">${Object.keys(PROGRESS.q).length}</div><div class="stat-lbl">累计练习记录</div></div>
  </div>
  <table class="stat-table"><thead><tr><th>节</th><th>名称</th><th>烂熟进度</th><th>对/错题次</th><th>状态</th></tr></thead><tbody>`;

  window.CATALOG.parts.forEach(part=>part.chapters.forEach(ch=>ch.sections.forEach(sec=>{
    if (!sec.data || !BANK[sec.data]) return;
    const st = sectionStats(sec.id);
    const bank = BANK[sec.data];
    let right=0, wrong=0;
    flatQuestions(bank).forEach(q=>{ const s=qState(sec.id,q.id); right+=s.right; wrong+=s.wrong; });
    const status = st.pct===100 ? '<span style="color:var(--ok)">已吃透</span>' : '<span style="color:var(--warn)">复习中</span>';
    html += `<tr><td>${sec.id}</td><td>${esc(sec.name)}</td>
      <td class="bar-cell"><div class="mini-bar"><i style="width:${st.pct}%"></i></div><span class="muted">${st.mastered}/${st.total}</span></td>
      <td><span style="color:var(--ok)">${right}</span> / <span style="color:var(--no)">${wrong}</span></td><td>${status}</td></tr>`;
  })));
  html += `</tbody></table>`;
  $("#statsBody").innerHTML = html;
}

// ===== 重置 =====
function resetProgress(){
  if (!confirm("确定清除全部刷题进度和掌握度吗？此操作不可恢复。")) return;
  PROGRESS = { q:{}, p:{}, days:[], lastDay:"" };
  saveProgress();
  toast("进度已清空");
  goHome();
}

// ===== 强制刷新：绕过缓存拉取最新版本 =====
function hardRefresh(){
  const base = location.href.split("?")[0].split("#")[0];
  const sep = base.includes("?") ? "&" : "?";
  // 用时间戳+随机数作参数，确保 URL 唯一，浏览器/CDN 不会命中旧缓存
  const bust = Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  // sharecode 必须保留，否则在线访问会被拒绝
  const sc = (location.href.match(/[?&]sharecode=([^&#]+)/)||[])[1];
  const target = base + sep + "_cb=" + bust + (sc ? "&sharecode=" + encodeURIComponent(sc) : "");
  location.replace(target);
}

// ===== 扫码在 iPad 打开 =====
// 固定正式域名：无论从 pages.dev、备用域名还是本地预览打开，扫码都指向这里
const QZ_OFFICIAL_URL = "https://jd.yiyoo.ccwu.cc";
function openQR(){
  $("#qrModal").classList.remove("hidden");
  let url = QZ_OFFICIAL_URL;
  // 若当前地址带 sharecode，则保留（兼容旧链接鉴权）
  const sc = (location.href.match(/[?&]sharecode=([^&#]+)/)||[])[1];
  if (sc) url += "?sharecode=" + encodeURIComponent(sc);
  const box = $("#qrcode");
  box.innerHTML = "";
  try {
    new QRCode(box, { text:url, width:230, height:230, colorDark:"#0f1115", colorLight:"#ffffff", correctLevel:QRCode.CorrectLevel.M });
  } catch(e){
    box.innerHTML = `<div class="qr-local">二维码生成失败，请直接复制网址：<br>${QZ_OFFICIAL_URL}</div>`;
  }
}
function closeQR(){ $("#qrModal").classList.add("hidden"); }

// ===== 进度备份：导出 / 导入 =====
const BACKUP_PREFIX = "JIDIAN-MECH-QUIZ::v1::";
function openBackup(mode){
  const ta = $("#backupText");
  if (mode === "export"){
    $("#backupTitle").textContent = "导出进度备份";
    $("#backupTip").innerHTML = "复制下面整段文字，保存到一个安全的地方（如备忘录、微信收藏）。当换了设备或清理了浏览器数据后，用「导入进度」粘贴回来即可恢复全部刷题记录。";
    ta.value = BACKUP_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(PROGRESS))));
    ta.readOnly = true;
    $("#backupFoot").innerHTML = `<button class="btn" onclick="copyBackup()">一键复制</button><button class="btn btn-ghost" onclick="closeBackup()">关闭</button>`;
    setTimeout(()=>{ ta.focus(); ta.select(); }, 50);
  } else {
    $("#backupTitle").textContent = "导入进度备份";
    $("#backupTip").innerHTML = "粘贴之前导出的备份文字，点「确认导入」恢复进度。<b style='color:var(--warn)'>注意：导入会覆盖当前设备上的全部记录。</b>";
    ta.value = "";
    ta.readOnly = false;
    $("#backupFoot").innerHTML = `<button class="btn" onclick="doImport()">确认导入</button><button class="btn btn-ghost" onclick="closeBackup()">取消</button>`;
    setTimeout(()=>ta.focus(), 50);
  }
  $("#backupModal").classList.remove("hidden");
}
function closeBackup(){ $("#backupModal").classList.add("hidden"); }
function copyBackup(){
  const ta = $("#backupText");
  ta.focus(); ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch(e){}
  if (!ok && navigator.clipboard){
    navigator.clipboard.writeText(ta.value).then(()=>toast("已复制，请粘贴保存")).catch(()=>toast("请长按文本框手动复制"));
  } else {
    toast(ok ? "已复制，请粘贴保存" : "请长按文本框手动复制");
  }
}
function doImport(){
  const raw = $("#backupText").value.trim();
  if (!raw){ toast("请先粘贴备份文字"); return; }
  try {
    if (!raw.startsWith(BACKUP_PREFIX)) throw new Error("格式不符");
    const json = decodeURIComponent(escape(atob(raw.slice(BACKUP_PREFIX.length))));
    const data = JSON.parse(json);
    if (!data || typeof data.q !== "object" || typeof data.p !== "object") throw new Error("数据结构不符");
    if (!confirm("确认用备份覆盖当前进度？当前设备上的记录将被替换，此操作不可撤销。")) return;
    PROGRESS = data;
    if (!PROGRESS.days) PROGRESS.days = [];
    if (!PROGRESS.lastDay) PROGRESS.lastDay = "";
    saveProgress();
    closeBackup();
    goHome();
    renderSidebar();
    toast("进度已恢复");
  } catch(e){
    toast("备份文字无效，请检查是否完整复制");
  }
}

// ===== 全局事件绑定 =====
$("#btnReset").addEventListener("click", resetProgress);
$("#btnRefresh").addEventListener("click", hardRefresh);
$("#btnQR").addEventListener("click", openQR);
$("#btnExport").addEventListener("click", ()=>openBackup("export"));
$("#btnImport").addEventListener("click", ()=>openBackup("import"));
$("#btnToggleRemembered").addEventListener("click", function(){
  CUR.filtered = !CUR.filtered;
  this.textContent = CUR.filtered ? "显示全部" : "只看未记住";
  renderPoints();
});

// ===== 一次性迁移（历史，填空转选择题）=====
const MIGRATED_Q_IDS = ["q2","q3","q10","q13","q14","q15","q16","q21","q22","q36","q37","q40","q44","q46","q48","q50"];
(function migrateBlankToChoice(){
  const flag = "jidian_quiz_migrated_choice_v1";
  try {
    if (localStorage.getItem(flag)) return;
    MIGRATED_Q_IDS.forEach(id => { delete PROGRESS.q["1.1::"+id]; });
    saveProgress();
    localStorage.setItem(flag, "1");
  } catch(e){}
})();

// ===== 一次性迁移：判断题转单选（对齐真题，取消判断题）=====
// 这13题题号未变但题型/选项已改，旧掌握度不清会让新题显得已掌握，故重置。
const MIGRATED_JUDGE_IDS = ["q1","q4","q7","q11","q17","q19","q24","q27","q33","q38","q41","q43","q45"];
(function migrateJudgeToChoice(){
  const flag = "jidian_quiz_migrated_realexam_v1";
  try {
    if (localStorage.getItem(flag)) return;
    MIGRATED_JUDGE_IDS.forEach(id => { delete PROGRESS.q["1.1::"+id]; });
    saveProgress();
    localStorage.setItem(flag, "1");
  } catch(e){}
})();

// ===== 一次性迁移：1.1 全面重建为“逐句覆盖版”=====
// 条目由 60 增至 324、知识点卡片由 54 增至 165，题目 ID 与卡片索引全部重新编排，
// 旧记录已无法对应（会造成错标），故清空 1.1 的答题记录与卡片标记；其他章节数据不受影响。
(function migrateDenseRebuild(){
  const flag = "jidian_quiz_migrated_dense_v1";
  try {
    if (localStorage.getItem(flag)) return;
    Object.keys(PROGRESS.q||{}).forEach(k => { if (k.indexOf("1.1::")===0) delete PROGRESS.q[k]; });
    Object.keys(PROGRESS.p||{}).forEach(k => { if (k.indexOf("P::1.1::")===0) delete PROGRESS.p[k]; });
    saveProgress();
    localStorage.setItem(flag, "1");
  } catch(e){}
})();

// ===== 初始化 =====
touchDay();
renderSidebar();
renderHome();
showView("home");
