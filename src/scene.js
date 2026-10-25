import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const C = { glass: 0xd8eeeb, edge: 0x719b99, water: 0x35a8b4, vapor: 0xe8a54f, coolant: 0x2c9cba, metal: 0x546866, dark: 0x264a45 };
const V = (x, y, z = 0) => new THREE.Vector3(x, y, z);
const up = V(0, 1, 0);
const round = n => Math.round(n * 1e7) / 1e7;
const pos = o => o.position.toArray().map(round);

export function createLabScene(canvas, onSelect) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.setClearColor(0xf3f5ef, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.22;
  renderer.localClippingEnabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = .09;
  controls.minDistance = 3.0;
  controls.maxDistance = 15;
  controls.minPolarAngle = .18;
  controls.maxPolarAngle = Math.PI / 2 - .035;
  controls.maxTargetRadius = 3;
  scene.add(new THREE.HemisphereLight(0xffffff, 0xc2d0bd, 2.5));
  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(-3, 7, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xc7e5f6, 2);
  rim.position.set(3, 4, -4); scene.add(rim);

  const groups = {};
  const picks = [];
  const centers = {
    heater: V(-2.5,.38), flask: V(-2.5,1.35), head: V(-2.5,2.55), thermometer: V(-2.5,3.25),
    condenser: V(.05,2.05), cooling: V(1.45,1.45,.5), receiver: V(2.55,.65),
  };
  for (const id of Object.keys(centers)) { const g = new THREE.Group(); g.name = id; scene.add(g); groups[id] = g; }
  const glass = new THREE.MeshPhysicalMaterial({ color: C.glass, transparent: true, opacity: .23, roughness: .22, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
  const edgeMat = new THREE.MeshStandardMaterial({ color: C.edge, roughness: .4, transparent: true, opacity: .55 });
  const metal = new THREE.MeshStandardMaterial({ color: C.metal, roughness: .35, metalness: .55 });
  const dark = new THREE.MeshStandardMaterial({ color: C.dark, roughness: .7 });
  const porcelain = new THREE.MeshStandardMaterial({ color: 0xe3e9dc, roughness: .6 });
  const white = new THREE.MeshStandardMaterial({ color: 0xfcfcf5, roughness: .65 });

  function add(geo, material, location, id, name = '') {
    const m = new THREE.Mesh(geo, material);
    if (location) m.position.copy(location);
    m.name = name || id || 'apparatus';
    if (id) { m.userData.component = id; groups[id].add(m); picks.push(m); } else scene.add(m);
    return m;
  }
  function cyl(a, b, radius, material, id, open = false, name = '') {
    const delta = b.clone().sub(a);
    const m = add(new THREE.CylinderGeometry(radius, radius, delta.length(), 32, 1, open), material, a.clone().add(b).multiplyScalar(.5), id, name);
    m.quaternion.setFromUnitVectors(up, delta.normalize());
    return m;
  }
  function ring(center, radius, material = edgeMat, id, normal = up, thickness = .012) {
    const m = add(new THREE.TorusGeometry(radius, thickness, 7, 48), material, center, id);
    m.quaternion.setFromUnitVectors(V(0,0,1), normal.clone().normalize());
    return m;
  }
  function tube(points, radius, material, id, name = '', tension = .25) {
    const curve = new THREE.CatmullRomCurve3(points, false, 'catmullrom', tension);
    const m = add(new THREE.TubeGeometry(curve, 80, radius, 12, false), material, null, id, name);
    if(material===glass) for(const side of [-1,1]) {
      const border=new THREE.CatmullRomCurve3(points.map(p=>p.clone().add(V(0,radius*side,0))),false,'catmullrom',tension);
      add(new THREE.TubeGeometry(border,64,.006,5,false),edgeMat,null,id);
    }
    return { mesh: m, curve };
  }

  // A quiet platform grounds the apparatus without adding a decorative room.
  add(new THREE.CylinderGeometry(4.2,4.25,.10,96), new THREE.MeshStandardMaterial({color:0xe6eae0,roughness:.95}), V(0,-.04), null,'platform');
  const base = add(new THREE.BoxGeometry(1.48,.20,1.25),dark,V(-2.5,.15), 'heater');
  cyl(V(-2.5,.24),V(-2.5,.53),.72,porcelain,'heater');
  const heaterCoil = ring(V(-2.5,.55),.53,new THREE.MeshStandardMaterial({color:0x9b8063,emissive:0xf59e42,emissiveIntensity:0}), 'heater', up,.045);
  const switchMesh = cyl(V(-2.72,.19,.63),V(-2.72,.19,.68),.055,dark,'heater');
  const heaterLight = add(new THREE.SphereGeometry(.035,12,8),new THREE.MeshBasicMaterial({color:0x8a9690}),V(-2.23,.20,.64),'heater');

  // Round-bottom flask with a continuous open neck, made from a revolved profile.
  const flaskCenter = V(-2.5,1.23);
  const R = .68;
  const profile = [];
  for(let i=0;i<=28;i++) {
    const angle = Math.PI - i / 28 * (Math.PI - .25);
    profile.push(new THREE.Vector2(Math.sin(angle)*R,Math.cos(angle)*R));
  }
  profile.push(new THREE.Vector2(.168,1.10));
  add(new THREE.LatheGeometry(profile,64),glass,flaskCenter,'flask','flask-glass');
  ring(V(-2.5,2.33),.17,edgeMat,'flask');
  ring(V(-2.5,1.23),.681,new THREE.MeshStandardMaterial({color:C.edge,transparent:true,opacity:.18}),'flask');
  const fluidPlane = new THREE.Plane(V(0,-1),1.2);
  const fluidMat = new THREE.MeshStandardMaterial({color:C.water,transparent:true,opacity:.78,roughness:.3,metalness:.04,clippingPlanes:[fluidPlane],side:THREE.DoubleSide});
  const flaskFluid = add(new THREE.SphereGeometry(.646,48,32),fluidMat,flaskCenter,'flask','flask-liquid');
  const surfaceMat = new THREE.MeshStandardMaterial({color:0x57bfca,transparent:true,opacity:.83,roughness:.22,side:THREE.DoubleSide});
  const surface = add(new THREE.CircleGeometry(1,64),surfaceMat,V(-2.5,1.2),'flask','flask-surface');
  surface.rotation.x = -Math.PI/2;
  const meniscus = ring(surface.position.clone(),1,new THREE.MeshBasicMaterial({color:0x78d8db,transparent:true,opacity:.65}),'flask',up,.008);

  cyl(V(-2.5,2.3),V(-2.5,2.91),.155,glass,'head',true);
  ring(V(-2.5,2.90),.156,edgeMat,'head');
  ring(V(-2.5,2.35),.156,edgeMat,'head');
  tube([V(-2.5,2.62),V(-2.27,2.65),V(-1.72,2.54)],.115,glass,'head');
  cyl(V(-2.5,2.94),V(-2.5,3.05),.17,dark,'thermometer');
  cyl(V(-2.5,2.44),V(-2.5,3.55),.044,glass,'thermometer');
  cyl(V(-2.5,2.47),V(-2.5,3.45),.012,new THREE.MeshStandardMaterial({color:0xb86448}),'thermometer');
  add(new THREE.SphereGeometry(.04,16,10),new THREE.MeshStandardMaterial({color:0xb86448}),V(-2.5,2.47),'thermometer');
  for(let i=0;i<10;i++) {
    const mark = add(new THREE.BoxGeometry(i%2 ? .04:.065,.009,.005),dark,V(-2.46,3.10+i*.033,.033),'thermometer');
  }

  const a = V(-1.64,2.52), b = V(1.62,1.38);
  const axis = b.clone().sub(a).normalize();
  const jacket = cyl(a,b,.245,glass,'condenser',true,'condenser-jacket');
  const inner = cyl(a.clone().addScaledVector(axis,-.15),b.clone().addScaledVector(axis,.16),.087,glass,'condenser',true,'condenser-inner');
  for(const point of [a,b]) {
    ring(point,.245,edgeMat,'condenser',axis);
    ring(point,.088,edgeMat,'condenser',axis);
    cyl(point.clone().addScaledVector(axis,-.035),point.clone().addScaledVector(axis,.035),.27,new THREE.MeshStandardMaterial({color:0x8ab4ac,roughness:.6,transparent:true,opacity:.68}),'condenser',true);
    const cap=add(new THREE.RingGeometry(.092,.245,48),glass,point,'condenser','jacket-annular-seal');
    cap.quaternion.setFromUnitVectors(V(0,0,1),axis);
  }
  const crossAxis=V(-axis.y,axis.x,0);
  for(const radius of [.245,.087]) for(const sign of [-1,1]) cyl(a.clone().addScaledVector(crossAxis,radius*sign),b.clone().addScaledVector(crossAxis,radius*sign),.005,edgeMat,'condenser');
  // Two separate paths: inner vapor/distillate; outer cooling jacket.
  const coolantMat = new THREE.MeshStandardMaterial({color:C.coolant,transparent:true,opacity:.60,roughness:.5});
  const inlet = b.clone().addScaledVector(axis,-.22).add(V(0,.02,.16));
  const outlet = a.clone().addScaledVector(axis,.22).add(V(0,.02,.16));
  cyl(inlet,inlet.clone().add(V(0,.05,.35)),.065,glass,'cooling',true);
  cyl(outlet,outlet.clone().add(V(0,.14,.35)),.065,glass,'cooling',true);
  const inletPath = tube([V(3.75,.16,1.15),V(2.1,.18,1.22),V(1.55,.55,.95),inlet.clone().add(V(0,.05,.38))],.047,coolantMat,'cooling','cooling-in');
  const outletPath = tube([outlet.clone().add(V(0,.14,.38)),V(-1.2,2.87,.8),V(-.1,2.6,1.18),V(.75,.22,1.6),V(3.75,.16,1.6)],.047,new THREE.MeshStandardMaterial({color:0x6ebfb9,transparent:true,opacity:.55,roughness:.45}),'cooling','cooling-out');
  for(const end of [V(3.75,.16,1.15),V(3.75,.16,1.6)]) ring(end,.063,metal,'cooling',V(1,0,0));
  const drain = tube([b.clone().addScaledVector(axis,.1),V(2.14,1.2),V(2.52,1.18),V(2.55,1.11)],.082,glass,'condenser','distillate-out');
  ring(V(2.55,1.11),.083,edgeMat,'condenser');

  // Open receiver, never sealed around the delivery tube.
  const receiverBase=.10, receiverTop=1.01, receiverR=.46;
  const receiverProfile=[new THREE.Vector2(0,0),new THREE.Vector2(receiverR,0),new THREE.Vector2(receiverR,.86),new THREE.Vector2(receiverR+.018,.91)];
  add(new THREE.LatheGeometry(receiverProfile,64),glass,V(2.55,receiverBase),'receiver','receiver-glass');
  ring(V(2.55,receiverTop),receiverR+.018,edgeMat,'receiver');
  ring(V(2.55,receiverBase),receiverR,edgeMat,'receiver');
  const receiverFluid = add(new THREE.CylinderGeometry(.435,.435,1,48),surfaceMat.clone(),V(2.55,.15),'receiver','receiver-liquid');
  for(let i=1;i<=4;i++) add(new THREE.BoxGeometry(.14,.008,.008),edgeMat,V(2.74,.20+i*.13,.419),'receiver');

  // Retort stands and clamps are functional supports, kept behind the glass.
  for(const x of [-2.85,.85]) {
    add(new THREE.BoxGeometry(.85,.08,.58),metal,V(x,.075,-.57));
    cyl(V(x,.12,-.57),V(x,3.05,-.57),.035,metal);
    cyl(V(x,2.28,-.57),V(x+.22,2.28,-.14),.027,metal);
  }
  ring(V(-2.5,2.18),.195,metal,null,up,.025);
  const clampMid = a.clone().lerp(b,.72);
  ring(clampMid,.285,metal,null,axis,.024);
  cyl(V(.85,2.28,-.57),clampMid.clone().add(V(0,0,-.26)),.024,metal);

  const effects = new THREE.Group(); effects.name='symbolic-effects'; scene.add(effects);
  const vaporCurve = new THREE.CatmullRomCurve3([V(-2.5,1.72),V(-2.5,2.48),V(-2.37,2.62),a,V(-.15,2.0)],false,'catmullrom',.15);
  const condensateCurve = new THREE.CurvePath();
  condensateCurve.add(new THREE.LineCurve3(V(-.18,2.01),b.clone().addScaledVector(axis,.1)));
  condensateCurve.add(drain.curve);
  const coolantCurve = new THREE.CatmullRomCurve3([inlet.clone().add(V(0,.03,.0)),b.clone().addScaledVector(axis,-.35).add(V(0,.12,.12)),a.clone().addScaledVector(axis,.35).add(V(0,.12,.12)),outlet],false,'catmullrom',.08);
  const vaporGeo=new THREE.SphereGeometry(.040,12,8), dropGeo=new THREE.SphereGeometry(.035,10,8);
  const vaporMat=new THREE.MeshBasicMaterial({color:C.vapor});
  const dropMat=new THREE.MeshStandardMaterial({color:0x168a9b,roughness:.25});
  const coolingGeo=new THREE.ConeGeometry(.040,.11,8);
  function particles(count,geo,mat,name) {
    return Array.from({length:count},(_,i)=>{const m=new THREE.Mesh(geo,mat); m.name=`${name}-${i}`; effects.add(m); return m;});
  }
  const vaporParticles=particles(30,vaporGeo,vaporMat,'vapor');
  const condensateParticles=particles(16,dropGeo,dropMat,'condensate');
  const fallingDrops=particles(3,dropGeo,dropMat,'drop');
  const coolantParticles=particles(20,coolingGeo,new THREE.MeshBasicMaterial({color:0x2393ae}),'coolant');
  const bubbles=particles(18,new THREE.SphereGeometry(.025,10,8),new THREE.MeshBasicMaterial({color:0xc9eef0,transparent:true,opacity:.8}),'bubble');

  function moving(parts,curve,seconds,active,period,startProgress,endProgress,progress,arrow=false) {
    parts.forEach((m,i)=>{
      const cycle=(seconds/period+i/parts.length)%1;
      const onset= Math.max(0,Math.min(1,(progress-startProgress)*90/period));
      const cutoff=Math.max(0,Math.min(1,(progress-endProgress)*90/period));
      m.visible=active>.005 && cycle<=onset && (progress<=endProgress || cycle>=cutoff);
      m.position.copy(curve.getPoint(cycle));
      if(arrow) m.quaternion.setFromUnitVectors(up,curve.getTangent(cycle).normalize());
    });
  }
  let lastState=null, selected=null, currentSurface=1.2;
  function update(state,symbols=true) {
    lastState=state;
    // Graphical fractions map to a conserved geometric volume, not measured mL.
    const fraction=state.flaskFraction*.78;
    let low=-.646, high=.646;
    for(let i=0;i<28;i++) {
      const y=(low+high)/2,h=y+.646;
      const f=(h*h*(3*.646-h))/(4*.646**3);
      if(f<fraction) low=y; else high=y;
    }
    const y=(low+high)/2;
    currentSurface=flaskCenter.y+y;
    vaporCurve.points[0].y=currentSurface+.045;
    fluidPlane.constant=currentSurface;
    const radius=Math.sqrt(Math.max(0,.646**2-y*y));
    surface.position.y=currentSurface; surface.scale.setScalar(radius);
    meniscus.position.y=currentSurface+.003; meniscus.scale.setScalar(radius);
    const volumeUnit=4/3*Math.PI*.646**3*.78;
    const receiverHeight=state.receiverFraction*volumeUnit/(Math.PI*.435**2);
    receiverFluid.visible=receiverHeight>.0001;
    receiverFluid.scale.y=Math.max(.0001,receiverHeight);
    receiverFluid.position.y=receiverBase+.01+receiverHeight/2;
    heaterCoil.material.emissiveIntensity=state.heat*1.2;
    heaterLight.material.color.setHex(state.heat>0?0xefad52:0x8a9690);
    effects.visible=symbols;
    moving(vaporParticles,vaporCurve,state.seconds,state.vapor,3.2,.22,.88,state.progress);
    moving(condensateParticles,condensateCurve,state.seconds,state.condensing,3.0,.28,.92,state.progress);
    moving(coolantParticles,coolantCurve,state.seconds,state.coolant,2.7,.04,.97,state.progress,true);
    fallingDrops.forEach((m,i)=>{
      const f=(state.seconds*1.5+i/3)%1;
      m.visible=state.collecting>.01;
      m.position.set(2.55,1.11-f*(1.11-(receiverBase+.01+receiverHeight)),0);
      m.scale.set(.75,1.3,.75);
    });
    bubbles.forEach((m,i)=>{
      const phase=(state.seconds*.7+i*.381966)%1;
      const theta=i*2.399963;
      const rr=.27*Math.sqrt((i+.5)/bubbles.length);
      const floor=flaskCenter.y-Math.sqrt(.62**2-rr**2);
      m.visible=state.boiling>.01;
      m.position.set(-2.5+Math.cos(theta)*rr,floor+phase*Math.max(.01,currentSurface-floor-.025),Math.sin(theta)*rr);
      m.scale.setScalar(.6+phase*.6);
    });
  }
  const views={
    overview:{position:V(3.3,3.9,8.3),target:V(.15,1.62,0)},
    flask:{position:V(-.2,2.65,5.1),target:V(-2.5,1.72,0)},
    condenser:{position:V(1.6,3.05,5.2),target:V(.05,2.02,0)},
    receiver:{position:V(4.8,2.05,4.1),target:V(2.52,.8,0)},
    back:{position:V(-4.7,4.0,-9.6),target:V(.05,1.62,0)},
  };
  function focus(name='overview') {
    const view=views[name]||views.overview;
    // A preset must not inherit the remaining rotation or pan from a drag.
    // One undamped update consumes OrbitControls' motion before placing it.
    const damping=controls.enableDamping;
    controls.enableDamping=false;
    controls.reset(); camera.position.copy(view.position);controls.target.copy(view.target);controls.update();
    controls.enableDamping=damping;
  }
  focus();
  const raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  let down=null;
  function hit(event) {
    const r=canvas.getBoundingClientRect();
    pointer.set((event.clientX-r.left)/r.width*2-1,-(event.clientY-r.top)/r.height*2+1);
    raycaster.setFromCamera(pointer,camera);
    const hits=raycaster.intersectObjects(picks,false);
    return hits.find(h=>h.object.visible && h.object.material.opacity!==0)?.object.userData.component || null;
  }
  canvas.addEventListener('pointerdown',e=>{
    if(e.button!==0 || e.isPrimary===false) return;
    down={x:e.clientX,y:e.clientY,pointerId:e.pointerId,moved:false};
  });
  canvas.addEventListener('pointerup',e=>{
    if(!down || e.pointerId!==down.pointerId) return;
    if(e.button===0&&!down.moved&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5) {const id=hit(e); if(id) onSelect(id);}
    down=null;
  });
  canvas.addEventListener('pointermove',e=>{
    if(down&&e.pointerId===down.pointerId&&Math.hypot(e.clientX-down.x,e.clientY-down.y)>=5) down.moved=true;
    if(!down) canvas.style.cursor=hit(e)?'pointer':'grab';
  });
  canvas.addEventListener('pointercancel',e=>{if(down?.pointerId===e.pointerId) down=null;});
  const selectionRing=ring(V(0,.04),.62,new THREE.MeshBasicMaterial({color:0xe3ab56,transparent:true,opacity:.7}),null,up,.014);
  selectionRing.visible=false;
  function select(id) {
    selected=id;
    selectionRing.visible=Boolean(centers[id]);
    if(centers[id]) selectionRing.position.set(centers[id].x,.03,centers[id].z);
  }
  function resize() {
    const {width,height}=canvas.getBoundingClientRect();
    renderer.setSize(width,height,false);camera.aspect=width/Math.max(height,1);camera.updateProjectionMatrix();
  }
  function render() {
    controls.target.x=THREE.MathUtils.clamp(controls.target.x,-3,3);
    controls.target.y=THREE.MathUtils.clamp(controls.target.y,.35,3.3);
    controls.target.z=THREE.MathUtils.clamp(controls.target.z,-1.5,1.5);
    controls.update(); renderer.render(scene,camera);
  }
  function orbit(direction) {
    const offset=camera.position.clone().sub(controls.target);
    offset.applyAxisAngle(up,direction*Math.PI/6);camera.position.copy(controls.target).add(offset);controls.update();
  }
  function zoom(factor) {camera.position.sub(controls.target).multiplyScalar(factor).clampLength(controls.minDistance,controls.maxDistance).add(controls.target);controls.update();}
  function snapshot() {
    return {
      flaskPlane:round(fluidPlane.constant),flaskSurface:pos(surface),flaskRadius:round(surface.scale.x),
      receiver:{position:pos(receiverFluid),height:round(receiverFluid.scale.y),visible:receiverFluid.visible},
      heat:round(heaterCoil.material.emissiveIntensity),indicator:heaterLight.material.color.getHex(),
      symbols:effects.visible,
      particles:effects.children.map(m=>({name:m.name,visible:m.visible,position:pos(m),quaternion:m.quaternion.toArray().map(round)})),
    };
  }
  function cameraSnapshot(){return {position:pos(camera),target:controls.target.toArray().map(round)};}
  function componentScreens(){
    const rect=canvas.getBoundingClientRect();
    return Object.fromEntries(Object.entries(centers).map(([id,v])=>{const p=v.clone().project(camera);return[id,{x:round(rect.left+(p.x+1)*rect.width/2),y:round(rect.top+(1-p.y)*rect.height/2)}];}));
  }
  resize();
  return {update,render,resize,focus,select,orbit,zoom,snapshot,cameraSnapshot,componentScreens,
    diagnostics:()=>({webgl2:true,renderer:renderer.getContext().getParameter(renderer.getContext().RENDERER),calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,geometries:renderer.info.memory.geometries,pixelRatio:renderer.getPixelRatio()}),
    dispose:()=>{controls.dispose();renderer.dispose();},
  };
}
