import './style.css';
import { createLabScene } from './scene.js';
import { DURATION, STAGES, stateAt } from './scenario.js';
import { COMPONENTS, SOURCES, SIMPLIFICATIONS, describeComponent } from './content.js';

const icons={
  play:'<path d="m8 5 11 7-11 7z"/>',pause:'<path d="M8 5v14M16 5v14"/>',
  reset:'<path d="M3 10a9 9 0 1 1 2 9M3 4v6h6"/>',
  focus:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  arrows:'<path d="m7 8-4 4 4 4m10-8 4 4-4 4M3 12h18"/>',
  arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
  drop:'<path d="M12 3s-6 7-6 11a6 6 0 0 0 12 0c0-4-6-11-6-11Z"/>',
  flask:'<path d="M9 3h6M10 3v7L5 19q-1 2 2 2h10q3 0 2-2l-5-9V3M8 15h8"/>',
};
const icon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name]||icons.focus}</svg>`;
const shortNames={heater:'Chauffage',flask:'Ballon',head:'Tête',thermometer:'Thermomètre',condenser:'Réfrigérant',cooling:'Refroidissement',receiver:'Collecteur'};

document.querySelector('#app').innerHTML=`
  <header class="site-header">
    <a class="brand" href="./" aria-label="Le labo des transformations, accueil"><span class="brand-icon">${icon('flask')}</span><span>le labo<span class="brand-sub">des transformations</span></span></a>
    <div class="header-right"><span class="edition">EXPÉRIENCE 01</span><button class="text-button" id="about-button">Comprendre le modèle <span aria-hidden="true">↗</span></button></div>
  </header>
  <main>
    <section class="intro" aria-labelledby="page-title">
      <div><div class="eyebrow"><span></span> EXPLORER LA MATIÈRE</div><h1 id="page-title">L’eau change d’état.<br><em>Le sel reste.</em></h1></div>
      <div class="intro-copy"><p>Une solution, deux changements d’état.<br>Explorez la distillation et suivez le voyage de l’eau.</p><div class="intro-meta"><span>Manipulation 3D</span><i></i><span>À votre rythme</span></div></div>
    </section>
    <section class="experiment" aria-label="Expérience interactive de distillation">
      <div class="lab-column">
        <div class="scene-wrap" id="scene-wrap">
          <div class="scene-heading"><div><span class="scene-index">01 /</span><span> DISTILLATION SIMPLE</span></div><span class="scene-badge"><span></span> Eau salée</span></div>
          <canvas id="lab-canvas" aria-label="Montage de distillation en 3D. Glisser pour tourner, molette pour zoomer, cliquer un composant. Au clavier, flèches gauche et droite pour tourner, plus et moins pour zoomer." tabindex="0"></canvas>
          <div id="webgl-error" class="webgl-error" hidden><h2>La scène 3D ne peut pas démarrer.</h2><p>Cette expérience nécessite WebGL2. Essayez un navigateur récent avec l’accélération graphique activée. Les étapes et les explications restent accessibles ci-dessous.</p></div>
          <div class="view-controls" aria-label="Vues du montage"><button data-view="overview" class="active">Ensemble</button><button data-view="flask">Ballon</button><button data-view="condenser">Réfrigérant</button><button data-view="receiver">Collecteur</button></div>
          <div class="camera-tools"><button id="rotate-left" class="icon-button" aria-label="Pivoter à gauche">↶</button><button id="rotate-right" class="icon-button" aria-label="Pivoter à droite">↷</button><button id="zoom-in" class="icon-button" aria-label="Zoomer">+</button><button id="zoom-out" class="icon-button" aria-label="Dézoomer">−</button><button id="reset-camera" class="icon-button" aria-label="Recentrer le montage">${icon('focus')}</button></div>
          <div class="scene-bottom"><span class="gesture-hint">${icon('arrows')} Glissez pour tourner · Molette : zoom · Cliquez pour explorer</span><button id="symbols-button" class="toggle" aria-pressed="true"><span class="toggle-track"></span>Voir les phénomènes</button></div>
        </div>
        <div class="legend" aria-label="Légende des représentations"><span><i class="vapor-dot"></i>Vapeur <small>traceurs symboliques</small></span><span><i class="water-dot"></i>Eau liquide</span><span><i class="cooling-arrow">→</i>Refroidissement <small>circuit séparé</small></span></div>
        <div class="timeline-panel">
          <div class="play-row"><button id="play-button" class="play-button" aria-label="Lancer la démonstration">${icon('play')}</button><div class="phase-title"><span class="eyebrow small" id="phase-index">ÉTAPE 01 / 06</span><h2 id="phase-label" aria-live="polite">Départ</h2></div><div class="time-value"><strong id="time-label">00:00</strong><span>/ 01:30</span></div><label class="speed-label">Vitesse<select id="speed" aria-label="Vitesse de lecture"><option value="0.5">×0,5</option><option value="1" selected>×1</option><option value="2">×2</option></select></label><button id="restart-button" class="icon-button" aria-label="Revenir au début">${icon('reset')}</button></div>
          <label class="timeline-label" for="timeline"><span>Parcourir le scénario</span><output id="progress-label">0 %</output></label>
          <input id="timeline" type="range" min="0" max="1000" value="0" step="1" aria-label="Avancement du scénario" aria-valuetext="0 %, départ" />
          <nav class="stage-list" aria-label="Étapes de la distillation">${STAGES.map((s,i)=>`<button data-stage="${s.progress}" data-stage-id="${s.id}" class="${i===0?'active':''}"><span>${String(i+1).padStart(2,'0')}</span>${s.label}</button>`).join('')}</nav>
          <p id="stage-summary" class="stage-summary"></p>
        </div>
      </div>
      <aside class="inspector" aria-label="Explorer les composants">
        <div class="inspector-header"><span class="eyebrow small">LE MONTAGE À LA LOUPE</span><span class="component-count">7 composants</span></div>
        <div class="component-list" role="group" aria-label="Choisir un composant">${COMPONENTS.map(c=>`<button data-component="${c.id}" aria-label="${c.title}" aria-pressed="${c.id==='flask'}"><span>${c.number}</span>${shortNames[c.id]}<i aria-hidden="true">↗</i></button>`).join('')}</div>
        <div class="component-card"><div class="component-kicker" id="component-kicker"></div><h2 id="component-title"></h2><p class="component-role" id="component-role"></p><p id="component-detail"></p><button class="focus-button" id="focus-component">${icon('focus')} Examiner de plus près</button></div>
        <div class="instant-card"><div class="instant-heading"><span class="pulse-dot"></span><span>À CET INSTANT</span><span id="instant-time">00:00</span></div><p id="instant-description"></p></div>
        <div class="inspector-foot">Un clic sur le montage révèle son rôle.<br>Le temps change, l’explication suit.</div>
      </aside>
    </section>
    <section class="takeaway"><span class="takeaway-icon">${icon('drop')}</span><p><strong>Séparer, sans transformer la nature de l’eau.</strong><br>Liquide → vapeur → liquide : l’eau voyage. Le sel reste dissous dans le ballon.</p><button id="sources-button" class="text-button">Sources & simplifications <span aria-hidden="true">↗</span></button></section>
  </main>
  <footer><span>Le labo des transformations</span><span>Une démonstration pédagogique, pas une simulation physique.</span><span>01 — Distillation</span></footer>
  <dialog id="model-dialog" aria-labelledby="dialog-title"><div class="dialog-top"><span class="eyebrow small">POUR ALLER PLUS LOIN</span><button id="close-dialog" class="icon-button" aria-label="Fermer les sources">×</button></div><h2 id="dialog-title">Ce que montre le modèle.</h2><p class="dialog-intro">Un scénario pour comprendre le principe de la distillation simple d’eau salée, sans prédire une expérience réelle.</p><h3>Nos simplifications</h3><ul class="simplifications">${SIMPLIFICATIONS.map(s=>`<li>${s}</li>`).join('')}</ul><h3>Les références scientifiques</h3><div class="source-list">${SOURCES.map(s=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer"><strong>${s.title}<span>↗</span></strong><span>${s.claim}</span></a>`).join('')}</div><p class="dialog-note">Les couleurs distinguent les circuits ; elles ne correspondent pas à l’aspect réel des fluides. Le montage s’arrête avec du liquide restant dans le ballon.</p></dialog>
`;

const $=s=>document.querySelector(s);
let progress=0, playing=false, speed=1, symbols=true, selected='flask', lab=null;
let current=stateAt(0), lastFrame=performance.now(), lastUiFrame=0;
const errors=[];
window.addEventListener('error',e=>errors.push({message:e.message,source:e.filename}));
window.addEventListener('unhandledrejection',e=>errors.push({message:String(e.reason)}));
const timestamp=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;

function selectComponent(id) {
  const c=COMPONENTS.find(x=>x.id===id); if(!c) return;
  selected=id; lab?.select(id);
  document.querySelectorAll('[data-component]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.component===id)));
  $('#component-kicker').textContent=c.kicker;
  $('#component-title').textContent=c.title;
  $('#component-role').textContent=c.role;
  $('#component-detail').textContent=c.detail;
  $('#instant-description').textContent=describeComponent(selected,current);
}
function updateUI() {
  const index=STAGES.findIndex(s=>s.id===current.stageId);
  $('#phase-index').textContent=`ÉTAPE ${String(index+1).padStart(2,'0')} / 06`;
  if($('#phase-label').textContent!==current.stageLabel) $('#phase-label').textContent=current.stageLabel;
  $('#stage-summary').textContent=current.status;
  $('#time-label').textContent=timestamp(current.seconds);
  $('#instant-time').textContent=timestamp(current.seconds);
  $('#progress-label').textContent=`${Math.round(progress*100)} %`;
  $('#timeline').value=progress*1000;
  $('#timeline').style.setProperty('--progress',`${progress*100}%`);
  $('#timeline').setAttribute('aria-valuetext',`${Math.round(progress*100)} %, ${current.stageLabel}`);
  $('#instant-description').textContent=describeComponent(selected,current);
  document.querySelectorAll('[data-stage-id]').forEach(b=>{const active=b.dataset.stageId===current.stageId;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');});
}
function setPlaying(value) {
  playing=value; lastFrame=performance.now();
  $('#play-button').innerHTML=icon(playing?'pause':'play');
  $('#play-button').setAttribute('aria-label',playing?'Mettre en pause':'Lancer la démonstration');
  document.body.classList.toggle('is-playing',playing);
  // Pausing must freeze the same instant in the scene and in the DOM, even
  // between the throttled UI updates performed during playback.
  if (!playing) updateUI();
}
function seek(value) {
  setPlaying(false);progress=Math.min(1,Math.max(0,value));current=stateAt(progress);lab?.update(current,symbols);updateUI();
}
try {
  if(new URLSearchParams(location.search).get('webgl')==='off') throw new Error('WebGL2 désactivé pour le contrôle du message de repli.');
  lab=createLabScene($('#lab-canvas'),selectComponent);lab.update(current,symbols);
  new ResizeObserver(()=>lab.resize()).observe($('#scene-wrap'));
  document.body.dataset.renderer='ready';
} catch(error) {
  errors.push({message:String(error)});$('#webgl-error').hidden=false;$('#lab-canvas').hidden=true;document.body.dataset.renderer='unavailable';
}
selectComponent('flask');updateUI();
$('#play-button').addEventListener('click',()=>{if(progress>=1)seek(0);setPlaying(!playing);});
$('#restart-button').addEventListener('click',()=>seek(0));
$('#timeline').addEventListener('input',e=>seek(Number(e.target.value)/1000));
$('#speed').addEventListener('change',e=>{speed=Number(e.target.value);});
document.querySelectorAll('[data-stage]').forEach(b=>b.addEventListener('click',()=>seek(Number(b.dataset.stage))));
document.querySelectorAll('[data-component]').forEach(b=>b.addEventListener('click',()=>selectComponent(b.dataset.component)));
function setView(view){lab?.focus(view);document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
$('#focus-component').addEventListener('click',()=>setView(COMPONENTS.find(c=>c.id===selected).focus));
$('#reset-camera').addEventListener('click',()=>setView('overview'));
$('#rotate-left').addEventListener('click',()=>lab?.orbit(-1));
$('#rotate-right').addEventListener('click',()=>lab?.orbit(1));
$('#zoom-in').addEventListener('click',()=>lab?.zoom(.85));
$('#zoom-out').addEventListener('click',()=>lab?.zoom(1.15));
$('#symbols-button').addEventListener('click',()=>{symbols=!symbols;$('#symbols-button').setAttribute('aria-pressed',String(symbols));lab?.update(current,symbols);});
$('#lab-canvas').addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'){lab?.orbit(-1);e.preventDefault();}
  if(e.key==='ArrowRight'){lab?.orbit(1);e.preventDefault();}
  if(e.key==='+'){lab?.zoom(.85);e.preventDefault();}
  if(e.key==='-'){lab?.zoom(1.15);e.preventDefault();}
});
const dialog=$('#model-dialog');
for(const id of ['#about-button','#sources-button']) $(id).addEventListener('click',()=>dialog.showModal());
$('#close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',e=>{if(e.target===dialog) {const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)setPlaying(false);lastFrame=performance.now();});

// QA controls are only served by the development build, never the public page.
let perfStart=null, perfSamples=[], perfResult=null;
if(import.meta.env.DEV&&new URLSearchParams(location.search).has('qa')) {
  const panel=document.createElement('details');panel.id='qa-panel';panel.innerHTML='<summary>Contrôles de développement</summary><button id="qa-snapshot">Capturer l’état appliqué</button><button id="qa-performance">Mesurer 30 secondes</button><output id="qa-status">Prêt</output><pre id="qa-result"></pre>';
  document.body.append(panel);
  $('#qa-snapshot').addEventListener('click',()=>{
    lab?.render();
    const snapshot={model:current,applied:lab?.snapshot(),camera:lab?.cameraSnapshot(),componentScreens:lab?.componentScreens(),dom:{phase:$('#phase-label').textContent,time:$('#time-label').textContent,progress:$('#progress-label').textContent,selected,title:$('#component-title').textContent,description:$('#instant-description').textContent,playing,speed,symbols},renderer:lab?.diagnostics(),viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio,scrollY},browser:navigator.userAgent,performance:perfResult,errors};
    $('#qa-result').textContent=JSON.stringify(snapshot);$('#qa-status').textContent='État capturé';
  });
  $('#qa-performance').addEventListener('click',()=>{perfStart=performance.now();perfSamples=[];perfResult=null;$('#qa-status').textContent='Mesure en cours (30 secondes)…';});
}
function animate(now) {
  const dt=now-lastFrame; lastFrame=now;
  if(playing) {
    progress=Math.min(1,progress+Math.min(dt,100)/1000*speed/DURATION);
    current=stateAt(progress);lab?.update(current,symbols);
    if(now-lastUiFrame>80){updateUI();lastUiFrame=now;}
    if(progress>=1){setPlaying(false);updateUI();}
  }
  lab?.render();
  if(perfStart!==null&&dt>0) {
    perfSamples.push(dt);
    if(now-perfStart>=30000) {
      const values=[...perfSamples].sort((a,b)=>a-b);
      const median=values[Math.floor(values.length/2)];
      perfResult={durationMs:Math.round(now-perfStart),samples:values.length,medianFrameMs:median,medianFps:1000/median,p95FrameMs:values[Math.floor(values.length*.95)],pass:1000/median>=30};
      perfStart=null;$('#qa-status').textContent=`Mesure terminée : ${Math.round(perfResult.medianFps)} images/s médianes`;
    }
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
