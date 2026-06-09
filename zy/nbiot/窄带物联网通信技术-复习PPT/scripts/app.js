// ===== GSAP INIT =====
gsap.registerPlugin(ScrollTrigger);
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== THEME =====
function setTheme(t) {
  document.documentElement.classList.add('theme-transitioning');
  document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
  document.querySelector(`.theme-btn[onclick="setTheme('${t}')"]`).classList.add('active');
  setTimeout(() => document.documentElement.classList.remove('theme-transitioning'), 350);
}
if (window.matchMedia('(prefers-color-scheme: light)').matches) setTheme('light');

// ===== RENDER =====
let currentChapter = 0;

function renderChapterNav() {
  document.getElementById('chapter-nav').innerHTML = chapters.map((ch,i) =>
    `<button class="ch-btn ${i===currentChapter?'active':''}" onclick="selectChapter(${i})">${ch.title}</button>`
  ).join('');
  if (!prefersReducedMotion) {
    gsap.fromTo('#chapter-nav .ch-btn',
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.25, stagger: 0.03, ease: 'power2.out' }
    );
  }
}

function renderKnowledge() {
  const ch = chapters[currentChapter];
  document.getElementById('knowledge-content').innerHTML = ch.sections.map(sec =>
    `<div class="k-card">
      <div class="section-label mono">${ch.title.split(' ')[0]}</div>
      <h3>${sec.title}</h3>
      ${sec.points.map(p => {
        if(p.t==='p') return `<p>${p.c}</p>`;
        if(p.t==='h4') return `<h4>${p.c}</h4>`;
        if(p.t==='hl') return `<div class="hl">${p.c}</div>`;
        if(p.t==='ul') return `<ul>${p.c.map(x=>`<li>${x}</li>`).join('')}</ul>`;
        if(p.t==='table') return `<table class="k-table"><thead><tr>${p.h.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${p.r.map(row=>`<tr>${row.map(c=>`<td>${c.replace(/\n/g,'<br>')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
        if(p.t==='svg' && svgs[p.id]) return `<div class="diagram-wrap">${svgs[p.id]}</div>`;
        if(p.t==='img') return `<div class="img-wrap"><img src="${p.src}" alt="${p.alt||''}" loading="lazy" onclick="openLightbox(this)"></div>`;
        if(p.t==='calc') return `<div class="calc-box">
          <div class="calc-title">▸ ${p.title}</div>
          ${p.steps.map((s,i)=>`<div class="calc-step"><span class="step-num">${i+1}</span><div><strong>${s.label}：</strong>${s.text}</div></div>`).join('')}
          ${p.formula?`<div class="calc-formula">${p.formula}</div>`:''}
          ${p.note?`<div class="calc-note">${p.note}</div>`:''}
        </div>`;
        return '';
      }).join('')}
    </div>`
  ).join('');
  if (!prefersReducedMotion) {
    gsap.fromTo('.k-card',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease: 'power2.out', clearProps: 'all' }
    );
  }
}

function selectChapter(i) {
  if (i === currentChapter) return;
  currentChapter = i;
  renderChapterNav();
  renderKnowledge();
  window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
}

// ===== QUIZ =====
let quiz=[], qIdx=0, ans=[], answered=false, selTags=new Set(), selType='all';

function renderTagFilter(){
  const tags=[...new Set(allQuestions.map(q=>q.ch))];
  const types=[{k:'all',l:'全部'},{k:'choice',l:'选择题'},{k:'blank',l:'填空题'},{k:'short',l:'简答题'}];
  document.getElementById('tag-filter').innerHTML=
    types.map(t=>`<button class="tag-chip ${selType===t.k?'active':''}" onclick="setType('${t.k}')">${t.l}</button>`).join('')+
    tags.map(t=>`<button class="tag-chip ${selTags.has(t)?'active':''}" onclick="toggleTag('${t}')">${t}</button>`).join('');
}
function setType(t){selType=t;renderTagFilter();updateInfo();}
function toggleTag(t){selTags.has(t)?selTags.delete(t):selTags.add(t);renderTagFilter();updateInfo();}
function getPool(){
  let pool=allQuestions;
  if(selType!=='all')pool=pool.filter(q=>(q.type||'choice')===selType);
  if(selTags.size)pool=pool.filter(q=>selTags.has(q.ch));
  return pool;
}
function updateInfo(){
  const p=getPool();
  const choice=allQuestions.filter(q=>!q.type||q.type==='choice').length;
  const blank=allQuestions.filter(q=>q.type==='blank').length;
  const short=allQuestions.filter(q=>q.type==='short').length;
  document.getElementById('quiz-info').innerHTML=`
    <div class="stat-item"><div class="stat-num">${allQuestions.length}</div><div class="stat-label mono">总题数</div></div>
    <div class="stat-item"><div class="stat-num">${p.length}</div><div class="stat-label mono">可选</div></div>
    <div class="stat-item"><div class="stat-num">${choice}/${blank}/${short}</div><div class="stat-label mono">选/填/简</div></div>`;
}
function startQuiz(n){
  let p=[...getPool()].sort(()=>Math.random()-.5);
  if(n>0&&n<p.length)p=p.slice(0,n);
  quiz=p;qIdx=0;ans=p.map(q=>{if(q.type==='blank')return Array(q.a.length).fill('');if(q.type==='short')return '';return -1;});
  answered=false;
  document.getElementById('quiz-controls').classList.add('hidden');
  document.getElementById('quiz-area').classList.remove('hidden');
  document.getElementById('quiz-result').classList.add('hidden');
  renderQ();
}
function renderQ(animate=true){
  const q=quiz[qIdx], pct=((qIdx+1)/quiz.length*100).toFixed(1);
  const area=document.getElementById('quiz-area');
  const isChoice = !q.type || q.type==='choice';
  const isBlank = q.type==='blank';
  const isShort = q.type==='short';
  const typeLabel = isBlank?'填空题':isShort?'简答题':'选择题';
  let body='';
  if(isChoice){
    body=`<div class="opts">${q.o.map((o,i)=>{const L=['A','B','C','D'];let cls='option opt';
      if(ans[qIdx]===i)cls+=' selected';
      if(answered){if(i===q.a)cls+=' correct';else if(ans[qIdx]===i)cls+=' wrong';}
      return`<div class="${cls}" onclick="selOpt(${i})"><span class="opt-label mono">${L[i]}</span><span>${o}</span></div>`;}).join('')}</div>`;
  } else if(isBlank){
    const blanks = q.a.length;
    const userInput = ans[qIdx] || Array(blanks).fill('');
    body=`<div class="blank-area">${q.a.map((_,i)=>`<div class="blank-field"><label class="blank-label mono">空${i+1}</label><input class="blank-input" type="text" value="${userInput[i]||''}" onchange="updateBlank(${i},this.value)" ${answered?'disabled':''} placeholder="输入答案"></div>`).join('')}</div>`;
    if(answered){
      body+=`<div class="blank-answer"><div class="blank-answer-title mono">正确答案</div>${q.a.map((a,i)=>`<div class="blank-answer-item"><span class="mono">空${i+1}：</span>${a}</div>`).join('')}</div>`;
    }
  } else if(isShort){
    const userInput = ans[qIdx]||'';
    body=`<div class="short-area"><textarea class="short-input" rows="4" onchange="updateShort(this.value)" ${answered?'disabled':''} placeholder="输入你的答案...">${userInput}</textarea></div>`;
    if(answered){
      body+=`<div class="blank-answer"><div class="blank-answer-title mono">参考答案</div><div class="short-answer-text">${q.a}</div></div>`;
    }
  }
  area.innerHTML=`<div class="q-card">
    <div class="q-meta"><span class="section-label mono">${q.ch}</span><span class="q-type-badge mono">${typeLabel}</span><span class="q-num mono">Q${qIdx+1}/${quiz.length}</span><div class="q-progress"><div class="q-progress-fill" style="width:${pct}%"></div></div></div>
    ${q.img?`<div class="q-img-wrap"><img src="${q.img}" alt="题目配图" loading="lazy" onclick="openLightbox(this)"></div>`:''}
    <div class="q-text">${q.q}</div>
    ${body}
    <div class="explain-box ${answered?'':'hidden'}"><div class="exp-title mono">解析</div><p>${q.e}</p></div>
  </div>
  <div class="q-nav">
    <button class="btn-bracket" onclick="prevQ()" ${qIdx===0?'disabled':''}>[ ← 上一题 ]</button>
    <div>${!answered&&(isChoice?ans[qIdx]>=0:(isBlank?(ans[qIdx]||[]).some(v=>v):ans[qIdx]))?`<button class="btn-bracket primary" onclick="confirmQ()">[ 确认 ]</button>`:''}
    ${qIdx<quiz.length-1?`<button class="btn-bracket primary" onclick="nextQ()">[ 下一题 → ]</button>`:(answered?`<button class="btn-bracket primary" onclick="showResult()">[ 查看成绩 ]</button>`:'')}</div>
  </div>`;
  if (animate && !prefersReducedMotion) {
    const tl = gsap.timeline();
    tl.fromTo('.q-card', { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out', clearProps: 'all' })
      .fromTo('.opt', { opacity: 0, x: -12 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.05, ease: 'power2.out', clearProps: 'all' }, '-=0.15')
      .fromTo('.q-nav', { opacity: 0 }, { opacity: 1, duration: 0.2, clearProps: 'all' }, '-=0.1');
  }
  if (animate && !prefersReducedMotion) {
    gsap.fromTo('.q-progress-fill', { width: '0%' }, { width: `${pct}%`, duration: 0.5, ease: 'power2.out' });
  }
}
function selOpt(i){
  if(answered)return;
  ans[qIdx]=i;answered=false;renderQ(false);
}
function updateBlank(i,val){
  if(answered)return;
  if(!ans[qIdx])ans[qIdx]=Array(quiz[qIdx].a.length).fill('');
  ans[qIdx][i]=val;renderQ(false);
}
function updateShort(val){
  if(answered)return;
  ans[qIdx]=val;renderQ(false);
}
function confirmQ(){
  answered=true;
  renderQ(false);
}
function nextQ(){if(qIdx<quiz.length-1){qIdx++;answered=false;renderQ();}}
function prevQ(){if(qIdx>0){qIdx--;answered=false;renderQ();}}
function showResult(){
  let c=0,w=0,s=0;ans.forEach((a,i)=>{
    const q=quiz[i],isChoice=!q.type||q.type==='choice',isBlank=q.type==='blank';
    if(isChoice){if(a===-1)s++;else if(a===q.a)c++;else w++;}
    else if(isBlank){const ua=a||[];const ca=q.a;if(ua.every(v=>!v))s++;else if(ca.every((ans,idx)=>ua[idx]&&ua[idx].trim().toLowerCase()===ans.trim().toLowerCase()))c++;else w++;}
    else{if(!a||!a.trim())s++;else c++;}
  });
  const sc=Math.round(c/quiz.length*100);
  document.getElementById('quiz-area').classList.add('hidden');
  const r=document.getElementById('quiz-result');r.classList.remove('hidden');
  r.innerHTML=`<div class="result-card">
    <div class="result-score">${sc}分</div><div class="result-label mono">正确率 ${c}/${quiz.length}</div>
    <div class="result-breakdown"><div class="bd-item bd-correct"><div class="bd-num">${c}</div><div class="bd-label mono">正确</div></div><div class="bd-item bd-wrong"><div class="bd-num">${w}</div><div class="bd-label mono">错误</div></div><div class="bd-item bd-skip"><div class="bd-num">${s}</div><div class="bd-label mono">未答</div></div></div>
    <div style="margin-top:1.5rem;display:flex;gap:0.5rem;justify-content:center;flex-wrap:wrap"><button class="btn-bracket primary" onclick="reviewWrong()">[ 错题回顾 ]</button><button class="btn-bracket" onclick="restart()">[ 重新开始 ]</button></div>
  </div>`;
  if (!prefersReducedMotion) {
    const tl = gsap.timeline();
    tl.fromTo('.result-card', { opacity: 0, scale: 0.92, y: 20 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: 'back.out(1.2)', clearProps: 'all' })
      .fromTo('.result-score', { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'elastic.out(1, 0.6)', clearProps: 'all' }, '-=0.2')
      .fromTo('.bd-item', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, stagger: 0.1, ease: 'power2.out', clearProps: 'all' }, '-=0.15');
  }
}
function reviewWrong(){
  const wr=[];ans.forEach((a,i)=>{
    const q=quiz[i],isChoice=!q.type||q.type==='choice',isBlank=q.type==='blank';
    if(isChoice){if(a!==-1&&a!==q.a)wr.push(i);}
    else if(isBlank){const ua=a||[];const ca=q.a;if(ua.some(v=>v)&&!ca.every((ans,idx)=>ua[idx]&&ua[idx].trim().toLowerCase()===ans.trim().toLowerCase()))wr.push(i);}
    else{if(a&&a.trim())wr.push(i);}
  });
  if(!wr.length){alert('没有错题！');return;}
  qIdx=wr[0];answered=true;
  document.getElementById('quiz-area').classList.remove('hidden');
  document.getElementById('quiz-result').classList.add('hidden');
  renderQ();
}
function restart(){
  document.getElementById('quiz-controls').classList.remove('hidden');
  document.getElementById('quiz-area').classList.add('hidden');
  document.getElementById('quiz-result').classList.add('hidden');
  updateInfo();
}

// TAB
function switchTab(t){
  document.querySelectorAll('.nav-tab').forEach(b=>b.classList.remove('active'));
  if(t==='knowledge'){
    document.getElementById('knowledge-section').classList.remove('hidden');
    document.getElementById('quiz-section').classList.add('hidden');
    document.querySelectorAll('.nav-tab')[0].classList.add('active');
    if (!prefersReducedMotion) {
      gsap.fromTo('#knowledge-section', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    }
  } else {
    document.getElementById('knowledge-section').classList.add('hidden');
    document.getElementById('quiz-section').classList.remove('hidden');
    document.querySelectorAll('.nav-tab')[1].classList.add('active');
    renderTagFilter();updateInfo();
    if (!prefersReducedMotion) {
      gsap.fromTo('#quiz-section', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out', clearProps: 'all' });
      gsap.fromTo('.quiz-stats', { opacity: 0, y: 12 }, { opacity: 1, y: 0, duration: 0.35, delay: 0.1, ease: 'power2.out', clearProps: 'all' });
    }
  }
}

// ===== KEYBOARD =====
document.addEventListener('keydown', e => {
  if (document.getElementById('quiz-section').classList.contains('hidden')) return;
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    if (!answered && ans[qIdx] >= 0) confirmQ();
    else if (answered && qIdx < quiz.length - 1) nextQ();
    else if (answered && qIdx === quiz.length - 1) showResult();
  }
  // 数字键 1-4 选择选项
  if (!answered && e.key >= '1' && e.key <= '4') {
    selOpt(parseInt(e.key) - 1);
  }
});

// ===== LIGHTBOX =====
function openLightbox(img) {
  const overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = `<div class="lightbox-inner"><img src="${img.src}" alt="${img.alt}"><button class="lightbox-close" onclick="this.closest('.lightbox-overlay').remove()">✕</button></div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  if (!prefersReducedMotion) gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.25 });
}

// INIT
renderChapterNav();
renderKnowledge();
if (!prefersReducedMotion) {
  gsap.fromTo('.sticky-nav', { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
}
