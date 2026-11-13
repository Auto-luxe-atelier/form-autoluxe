const FB_API='https://n8n-hetzner.duckdns.org/webhook/publier-partout';
const TT_API='https://n8n-hetzner.duckdns.org/webhook/tiktok-publier';
const TT_LOGIN='https://n8n-hetzner.duckdns.org/webhook/tiktok-connexion-autoluxe?ret=pp';
const $=id=>document.getElementById(id);
const SB='https://supabase.n8n-hetzner.duckdns.org/storage/v1/object/public/publications/statut/';
const LIEN_API='https://n8n-hetzner.duckdns.org/webhook/lien-upload';
// Depot direct dans le stockage : pas de limite de duree cote n8n, la qualite d'origine est conservee.
function putFichier(url,b,onp){return new Promise(ok=>{const x=new XMLHttpRequest();x.open('PUT',url);x.setRequestHeader('Content-Type',b.type||'application/octet-stream');if(onp)x.upload.onprogress=onp;reqs.push(x);x.onload=()=>ok(x.status>=200&&x.status<300);x.onerror=()=>ok(false);x.send(b)})}
async function deposer(b,nom,onp){
  try{
    const r=await fetch(LIEN_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:nom})});
    if(!r.ok)return null;
    const d=await r.json();
    if(!d||!d.envoi)return null;
    const fait=await putFichier(d.envoi,b,onp);
    return fait?d.lien:null;
  }catch(e){return null}
}
function suivre(job,plat,id,libelle,n){fetch(SB+job+'-'+plat+'.json?t='+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d&&typeof d.ok!=='undefined'){setRow(id,d.ok?('\u2705 '+libelle):('\u274c '+(d.error||'\u00c9chec')),d.ok?'ok':'err');return}if(n>80){setRow(id,'\u23f3 Toujours en cours','wait');return}setTimeout(()=>suivre(job,plat,id,libelle,n+1),3000)}).catch(()=>{if(n<=80)setTimeout(()=>suivre(job,plat,id,libelle,n+1),3000)})}
const TPL="Votre ciel de toit est encore blanc ou beige ? 🤍➡️🖤\nPassez au noir et ajoutez un ciel étoilé : votre habitacle change complètement d'ambiance.\n\n✨ Ciel étoilé fibre optique, jusqu'à 500 étoiles\n🖤 Changement de couleur du ciel de toit : blanc ➜ noir, en tissu ou en Alcantara\n✔️ Finition d'origine • Garantie 24 mois\n\n📍 Auto Luxe Atelier – Chéraga, Alger\n📩 Écrivez-nous en privé pour un devis\n\nسقف طوموبيلتك مازال أبيض؟ 🤍\nردّوه أكحل 🖤 وزيدولو سما النجوم ✨ الطوموبيل تولي حاجة أخرى!\n📍 الشراقة – الجزائر | راسلونا في الخاص\n\n#cieletoile #cieldetoit #alcantara #starlight #autoluxeatelier #alger #algerie #dz #سقف_السيارة #تعديل_السيارات";
const LBL={PUBLIC_TO_EVERYONE:'Tout le monde',MUTUAL_FOLLOW_FRIENDS:'Amis (abonnés mutuels)',FOLLOWER_OF_CREATOR:'Abonnés',SELF_ONLY:'Moi uniquement'};
let S='',C=null,blob=null,fname='',isVideo=false,vidDur=0,busy=false,pendingAuto=false;
try{const h=new URLSearchParams(location.hash.slice(1));if(h.get('s')){localStorage.setItem('tt_s',h.get('s'));history.replaceState(null,'',location.pathname)}S=localStorage.getItem('tt_s')||''}catch(e){}

let reqs=[],stoppe=false,tic=null;
function xhr(url,fd,onp){return new Promise(ok=>{const x=new XMLHttpRequest();x.open('POST',url);if(onp)x.upload.onprogress=onp;reqs.push(x);
  x.onload=()=>{let d=null;try{d=JSON.parse(x.responseText)}catch(e){};ok({status:x.status,data:d})};x.onerror=()=>ok({status:0,data:null});x.send(fd)})}
function tt(fields,file,onp){const fd=new FormData();fd.append('s',S);for(const k in fields)fd.append(k,fields[k]);if(file)fd.append('media',file,fname);return xhr(TT_API,fd,onp).then(r=>r.data||{ok:false,error:'Coupure réseau'})}

$('tplBtn').onclick=()=>{$('cap').value=TPL;refresh()};
$('ttLoginBtn').onclick=()=>location.href=TT_LOGIN;
$('ttOut').onclick=async()=>{await tt({action:'logout'});try{localStorage.removeItem('tt_s')}catch(e){};S='';C=null;showTT()};

async function initTT(){
  if(!S){showTT();return}
  const d=await tt({action:'creator'});
  if(!d.ok){if(d.need_login){try{localStorage.removeItem('tt_s')}catch(e){}S=''}else{$('ttBlocked').textContent='⚠️ Ce compte ne peut pas publier pour le moment : '+(d.error||'');$('ttBlocked').style.display='block'}showTT();return}
  C=d.creator;$('ttAv').src=C.creator_avatar_url||'';$('ttNick').textContent=C.creator_nickname||'';$('ttUser').textContent='@'+(C.creator_username||'');
  $('ttPriv').length=1;for(const p of (C.privacy_level_options||[])){const o=document.createElement('option');o.value=p;o.textContent=LBL[p]||p;$('ttPriv').appendChild(o)}
  [['comment_disabled','ttCom'],['duet_disabled','ttDuet'],['stitch_disabled','ttStitch']].forEach(([k,id])=>{if(C[k]){$(id).checked=false;$(id).disabled=true;$(id).closest('.dest').classList.add('off')}});
  showTT();
}
function showTT(){$('ttLogin').style.display=S?'none':'block';$('ttBody').style.display=S?'block':'none';refresh()}

function toJpeg(file){return new Promise((ok,ko)=>{const img=new Image();img.onload=()=>{let w=img.naturalWidth,h=img.naturalHeight;const k=Math.min(1,1920/Math.max(w,h),1080/Math.min(w,h));w=Math.round(w*k);h=Math.round(h*k);
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);c.toBlob(b=>b?ok(b):ko('conversion'),'image/jpeg',0.92)};img.onerror=()=>ko('image illisible');img.src=URL.createObjectURL(file)})}
function txtOverlay(){const e=$('ovl');return e?e.value.trim():''}
function txtPos(){const r=document.querySelector('input[name=ovlPos]:checked');return r?r.value:'bas'}
// Place le texte dans la bande noire quand il y en a une, sinon sur l'image.
function dessineTexte(x,W,H,txt,pos,media){
  if(!txt)return;
  const taille=Math.round(W*0.072);
  x.save();x.textAlign='center';x.textBaseline='middle';
  x.font='700 '+taille+'px system-ui,"Segoe UI",Roboto,Arial,sans-serif';
  const max=W*0.86,lignes=[];let cur='';
  for(const m of txt.split(/\s+/)){const t=cur?cur+' '+m:m;if(x.measureText(t).width>max&&cur){lignes.push(cur);cur=m}else cur=t}
  if(cur)lignes.push(cur);
  const lh=taille*1.3,hTot=lignes.length*lh,besoin=hTot+lh*0.9;
  const haut=pos==='haut';
  const bande=media?(haut?media.y:H-(media.y+media.h)):0;
  let yTop;
  if(media&&bande>=besoin){
    yTop=haut?(media.y-besoin)/2+lh*0.45:media.y+media.h+(bande-besoin)/2+lh*0.45;
  }else{
    yTop=haut?H*0.10:H*0.90-hTot;
    x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,yTop-lh*0.45,W,hTot+lh*0.9);
  }
  x.fillStyle='#fff';x.shadowColor='rgba(0,0,0,.85)';x.shadowBlur=taille*0.3;
  let y=yTop+lh/2;
  for(const l of lignes){x.fillText(l,W/2,y);y+=lh}
  x.restore();
}
// Reecrit une photo avec le texte incruste, a sa taille d'origine.
function ajouteTexte(src,txt,pos){return new Promise((ok,ko)=>{const img=new Image();img.onload=()=>{
  const W=img.naturalWidth,H=img.naturalHeight;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.drawImage(img,0,0,W,H);dessineTexte(x,W,H,txt,pos);
  c.toBlob(b=>b?ok(b):ko('texte'),'image/jpeg',0.92)};img.onerror=()=>ko('image');img.src=URL.createObjectURL(src)})}
function mimeVideo(){
  const l=['video/mp4;codecs=avc1.42E01E,mp4a.40.2','video/mp4'];
  for(const m of l){if(window.MediaRecorder&&MediaRecorder.isTypeSupported(m))return m}
  return null;
}
// Remet une video horizontale au format 9:16 pour les stories : image entiere au centre, fond floute.
function toStoryVideo(file,onprog,txt,pos){return new Promise(ok=>{
  const mime=mimeVideo();
  if(!mime)return ok(null);
  const v=document.createElement('video');v.src=URL.createObjectURL(file);v.playsInline=true;v.preload='auto';
  v.onerror=()=>ok(null);
  v.onloadedmetadata=()=>{
    const iw=v.videoWidth,ih=v.videoHeight;
    if(!iw||!ih)return ok(null);
    if(ih/iw>=1.6&&!txt)return ok(null);
    if(!v.duration||v.duration>180)return ok(null);
    const W=1080,H=1920;
    const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
    const k=Math.min(W/iw,H/ih),fw=iw*k,fh=ih*k,fy=(H-fh)/2;
    let ac=null,dest=null;
    try{ac=new (window.AudioContext||window.webkitAudioContext)();const s=ac.createMediaElementSource(v);dest=ac.createMediaStreamDestination();s.connect(dest)}catch(e){}
    const st=new MediaStream();
    c.captureStream(30).getVideoTracks().forEach(t=>st.addTrack(t));
    if(dest)dest.stream.getAudioTracks().forEach(t=>st.addTrack(t));
    let rec;try{rec=new MediaRecorder(st,{mimeType:mime,videoBitsPerSecond:6000000})}catch(e){return ok(null)}
    const parts=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
    let fini=false;
    rec.onstop=()=>{if(fini)return;fini=true;try{if(ac)ac.close()}catch(e){};ok(parts.length?new Blob(parts,{type:'video/mp4'}):null)};
    let raf=0;
    const draw=()=>{
      x.fillStyle='#000';x.fillRect(0,0,W,H);
      try{x.drawImage(v,(W-fw)/2,fy,fw,fh)}catch(e){}
      dessineTexte(x,W,H,txt,pos,{y:fy,h:fh});
      if(onprog&&v.duration)onprog(Math.min(1,v.currentTime/v.duration));
      raf=requestAnimationFrame(draw);
    };
    v.onended=()=>{cancelAnimationFrame(raf);setTimeout(()=>{try{rec.stop()}catch(e){ok(null)}},300)};
    v.play().then(()=>{try{rec.start(500)}catch(e){return ok(null)};draw()}).catch(()=>ok(null));
  };
})}
// Allege une video trop lourde : 1280 px maxi sur le grand cote, 2,5 Mbit/s.
function compresseVideo(file,onprog){return new Promise(ok=>{
  const mime=mimeVideo();
  if(!mime)return ok(null);
  const v=document.createElement('video');v.src=URL.createObjectURL(file);v.playsInline=true;v.preload='auto';
  v.onerror=()=>ok(null);
  v.onloadedmetadata=()=>{
    const iw=v.videoWidth,ih=v.videoHeight;
    if(!iw||!ih||!v.duration)return ok(null);
    const k=Math.min(1,1920/Math.max(iw,ih));
    const W=Math.round(iw*k/2)*2,H=Math.round(ih*k/2)*2;
    const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
    let ac=null,dest=null;
    try{ac=new (window.AudioContext||window.webkitAudioContext)();const s=ac.createMediaElementSource(v);dest=ac.createMediaStreamDestination();s.connect(dest)}catch(e){}
    const st=new MediaStream();
    c.captureStream(30).getVideoTracks().forEach(t=>st.addTrack(t));
    if(dest)dest.stream.getAudioTracks().forEach(t=>st.addTrack(t));
    let rec;try{rec=new MediaRecorder(st,{mimeType:mime,videoBitsPerSecond:3000000,audioBitsPerSecond:96000})}catch(e){return ok(null)}
    const parts=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)parts.push(e.data)};
    let fini=false;
    rec.onstop=()=>{if(fini)return;fini=true;try{if(ac)ac.close()}catch(e){};ok(parts.length?new Blob(parts,{type:'video/mp4'}):null)};
    let raf=0;
    const draw=()=>{try{x.drawImage(v,0,0,W,H)}catch(e){}if(onprog&&v.duration)onprog(Math.min(1,v.currentTime/v.duration));raf=requestAnimationFrame(draw)};
    v.onended=()=>{cancelAnimationFrame(raf);setTimeout(()=>{try{rec.stop()}catch(e){ok(null)}},400)};
    v.play().then(()=>{try{rec.start(1000)}catch(e){return ok(null)};draw()}).catch(()=>ok(null));
  };
})}
function toStory(src,txt,pos){return new Promise((ok,ko)=>{const img=new Image();img.onload=()=>{
  const W=1080,H=1920;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#000';x.fillRect(0,0,W,H);
  const iw=img.naturalWidth,ih=img.naturalHeight;
  const k=Math.min(W/iw,H/ih);const w=iw*k,h=ih*k;const my=(H-h)/2;x.drawImage(img,(W-w)/2,my,w,h);
  dessineTexte(x,W,H,txt,pos,{y:my,h:h});
  c.toBlob(b=>b?ok(b):ko('story'),'image/jpeg',0.92)};img.onerror=()=>ko('image');img.src=URL.createObjectURL(src)})}
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('prev').innerHTML='';vidDur=0;pendingAuto=true;$('res').innerHTML='';
  if(f.type.startsWith('image/')){isVideo=false;blob=await toJpeg(f);fname='photo.jpg';const i=document.createElement('img');i.src=URL.createObjectURL(blob);$('prev').appendChild(i)}
  else{isVideo=true;blob=f;fname=f.name||'video.mp4';const v=document.createElement('video');v.src=URL.createObjectURL(f);v.controls=true;v.playsInline=true;v.onloadedmetadata=()=>{vidDur=v.duration||0;refresh()};$('prev').appendChild(v)}
  $('vider').style.display='block';$('drop').classList.add('has');$('dl').textContent=f.name;$('ds').textContent=(f.size/1048576).toFixed(1)+' Mo · '+(isVideo?'vidéo':'photo');refresh()};

const ttDirect=()=>document.querySelector('input[name=ttMode]:checked').value==='direct';
function refresh(){
  const aFichier=!!blob;
  const ytOff=aFichier&&!isVideo;$('rowYt').classList.toggle('off',ytOff);if(ytOff)$('dYt').checked=false;$('dYt').disabled=ytOff;
  const tropLong=aFichier&&isVideo&&vidDur>60;
  [['rowStory','dStory'],['rowIgStory','dIgStory']].forEach(p=>{$(p[0]).classList.toggle('off',tropLong);if(tropLong)$(p[1]).checked=false;$(p[1]).disabled=tropLong});
  const sf=$('rowStory').querySelector('small'),si=$('rowIgStory').querySelector('small');
  if(sf)sf.textContent=tropLong?'Vidéo trop longue (60 s maxi)':'Photos et vidéos';
  if(si)si.textContent=tropLong?'Vidéo trop longue (60 s maxi)':'24 h · compte pro requis';
  const wantTT=$('dTt').checked;$('ttCard').classList.toggle('on',wantTT);
  const d=ttDirect();$('ttDirect').style.display=d?'block':'none';
  document.querySelectorAll('.ttv').forEach(r=>r.style.display=isVideo?'':'none');
  const disc=$('ttDisc').checked,own=$('ttOwn').checked,brand=$('ttBrand').checked;$('ttDiscBox').style.display=disc?'block':'none';
  const so=[...$('ttPriv').options].find(o=>o.value==='SELF_ONLY');if(so){so.disabled=disc&&brand;if(disc&&brand&&$('ttPriv').value==='SELF_ONLY')$('ttPriv').value=''}
  $('ttDiscNote').textContent=disc&&!own&&!brand?'Choisissez au moins une option.':disc&&brand?'Étiquette « Partenariat rémunéré ».':disc&&own?'Étiquette « Contenu promotionnel ».':'';
  $('ttLegal').innerHTML=d?('En publiant, vous acceptez '+(disc&&brand?'la <a href="https://www.tiktok.com/legal/page/global/bc-policy/en" target="_blank">Politique relative au contenu de marque</a> et ':'')+'la <a href="https://www.tiktok.com/legal/page/global/music-usage-confirmation/en" target="_blank">Confirmation d\'utilisation de la musique</a> de TikTok.<br>Aucune musique n\'est ajoutée.'):'TikTok : la publication arrive dans votre boîte de réception TikTok pour être finalisée.';
  const any=$('dFb').checked||$('dStory').checked||$('dIg').checked||$('dIgStory').checked||$('dYt').checked||wantTT;
  let ok=!!blob&&any&&!busy;
  if(wantTT){const max=(C&&C.max_video_post_duration_sec)||600;ok=ok&&!!S&&!!C&&!(isVideo&&vidDur>max);if(d)ok=ok&&!!$('ttPriv').value&&!(disc&&!own&&!brand)}
  $('go').disabled=!ok;
  let aide=$('aide');if(!aide){aide=document.createElement('div');aide.id='aide';aide.style.cssText='text-align:center;color:#8a8a8a;font-size:13px;margin-top:10px';$('go').parentNode.insertBefore(aide,$('go').nextSibling)}
  aide.textContent=busy?'Publication en cours…':!blob?'Choisis un fichier à publier.':!any?'Coche au moins une destination.':(isVideo&&!vidDur)?'Lecture de la vidéo…':(wantTT&&(!S||!C))?'TikTok : connecte ton compte ou décoche TikTok.':!ok?'TikTok : vérifie les réglages ci-dessus.':'';
  if(pendingAuto&&ok&&!busy&&(!isVideo||vidDur>0)){pendingAuto=false;stoppe=false;setTimeout(run,250)}
}
['dFb','dStory','dIg','dIgStory','dYt','dTt','ttPriv','ttDisc','ttOwn','ttBrand','cap'].forEach(id=>$(id).addEventListener('change',refresh));
document.querySelectorAll('input[name=ttMode]').forEach(r=>r.addEventListener('change',refresh));

function row(id,name){const r=document.createElement('div');r.className='r';r.id='r_'+id;r.innerHTML='<span>'+name+'</span><span class="s wait">En attente…</span>';$('res').appendChild(r)}
function setRow(id,t,cls){const s=document.querySelector('#r_'+id+' .s');if(s){s.textContent=t;s.className='s '+cls}}

async function pollTT(pid,n){const d=await tt({action:'status',publish_id:pid});const st=d.status&&d.status.status;
  if(st==='PUBLISH_COMPLETE')return setRow('tt','✅ Publié','ok');
  if(st==='SEND_TO_USER_INBOX')return setRow('tt','✅ Dans ta boîte TikTok','ok');
  if(st==='FAILED')return setRow('tt','❌ '+((d.status&&d.status.fail_reason)||'Refusé'),'err');
  if(n>40)return setRow('tt','⏳ Toujours en traitement','wait');
  setRow('tt','⏳ TikTok traite…','wait');setTimeout(()=>pollTT(pid,n+1),3000)}

function annuler(){stoppe=true;if(tic){clearInterval(tic);tic=null}reqs.forEach(x=>{try{x.abort()}catch(e){}});reqs=[];$('stop').style.display='none';busy=false;$('bar').style.display='none';$('pct').style.display='none';refresh()}
async function run(){
  if(stoppe)return;
  $('stop').style.display='block';$('stop').textContent='Annuler';
  try{$('prev').scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}
  pendingAuto=false;busy=true;refresh();$('res').innerHTML='';$('bar').style.display='block';$('pct').style.display='block';$('fill').style.width='0';$('pct').textContent='0 %';
  const job='j'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const cap=$('cap').value;const cibles=[];if($('dFb').checked)cibles.push('fb');if($('dStory').checked)cibles.push('story');if($('dIg').checked)cibles.push('ig');if($('dIgStory').checked)cibles.push('igstory');if($('dYt').checked)cibles.push('yt');
  const wantTT=$('dTt').checked;const prog={};const upd=()=>{let l=0,t=0;for(const k in prog){l+=prog[k][0];t+=prog[k][1]}const p=t?Math.round(l/t*100):0;$('fill').style.width=p+'%';$('pct').textContent=p+' %'};
  const ovl=txtOverlay(),opos=txtPos();
  let envoiBlob=blob;
  if(ovl&&!isVideo){try{envoiBlob=await ajouteTexte(blob,ovl,opos)}catch(e){}}
  if(isVideo&&blob.size>50*1048576){
    row('prep','Allègement');setRow('prep','⏳ Patientez, laissez la page ouverte…','wait');
    let cv=null;try{cv=await compresseVideo(blob,p=>setRow('prep','⏳ Allègement… '+Math.round(p*100)+' %','wait'))}catch(e){}
    if(cv&&cv.size&&cv.size<blob.size){envoiBlob=cv;setRow('prep','✅ '+(blob.size/1048576).toFixed(0)+' Mo → '+(cv.size/1048576).toFixed(0)+' Mo','ok')}
    else setRow('prep','⚠️ Envoi du fichier tel quel','wait');
  }
  const jobs=[];
  if(cibles.length){
    if(cibles.includes('fb'))row('fb','Facebook');if(cibles.includes('story'))row('story','Story Facebook');if(cibles.includes('ig'))row('ig','Instagram');if(cibles.includes('igstory'))row('igstory','Story Instagram');if(cibles.includes('yt'))row('yt','YouTube Shorts');
    prog.meta=[0,envoiBlob.size];
    jobs.push(async()=>{
      const fd=new FormData();
      const uM=await deposer(envoiBlob,fname,e=>{if(e.lengthComputable){prog.meta=[e.loaded,e.total];upd()}});
      if(!uM){cibles.forEach(c=>setRow(c,'❌ Envoi au stockage impossible','err'));return}
      fd.append('media_url',uM);
      const veutStory=cibles.includes('story')||cibles.includes('igstory');
      if(veutStory&&!isVideo){try{const sb=await toStory(blob,ovl,opos);const uS=await deposer(sb,'story.jpg');if(uS)fd.append('story_url',uS)}catch(e){}}
      if(veutStory&&isVideo){
        const maj=p=>{const t='\u23f3 Pr\u00e9paration\u2026 '+Math.round(p*100)+' %';if(cibles.includes('story'))setRow('story',t,'wait');if(cibles.includes('igstory'))setRow('igstory',t,'wait')};
        maj(0);let sv=null;try{sv=await toStoryVideo(envoiBlob,maj,ovl,opos)}catch(e){}
        if(sv){const uS=await deposer(sv,'story.mp4');if(uS)fd.append('story_url',uS)}
        const t2='\u23f3 Envoi\u2026';if(cibles.includes('story'))setRow('story',t2,'wait');if(cibles.includes('igstory'))setRow('igstory',t2,'wait');
      }
      fd.append('caption',cap);fd.append('cibles',cibles.join(','));fd.append('job',job);
      const r=await xhr(FB_API,fd,null);
      prog.meta=[envoiBlob.size,envoiBlob.size];upd();
      const fb=r.data&&r.data.facebook_feed;
      if(cibles.includes('fb')){if(fb&&(fb.id||fb.post_id))setRow('fb','\u2705 Publi\u00e9','ok');else setRow('fb','\u274c '+((fb&&fb.error&&fb.error.message)||(r.status?'\u00c9chec':'Coupure r\u00e9seau')),'err')}
      const ok200=r.status===200;
      if(cibles.includes('story')){if(ok200){setRow('story','\u23f3 Facebook traite\u2026','wait');suivre(job,'story','story','Envoy\u00e9e',0)}else setRow('story','\u274c \u00c9chec','err')}
            if(cibles.includes('yt')){if(ok200){setRow('yt','\u23f3 YouTube traite\u2026','wait');suivre(job,'yt','yt','Envoy\u00e9e',0)}else setRow('yt','\u274c \u00c9chec','err')}
      if(cibles.includes('igstory')){if(ok200){setRow('igstory','\u23f3 Instagram traite\u2026','wait');suivre(job,'igstory','igstory','Publi\u00e9e',0)}else setRow('igstory','\u274c \u00c9chec','err')}
      if(cibles.includes('ig')){if(ok200){setRow('ig','\u23f3 Instagram traite\u2026','wait');suivre(job,'ig','ig','Publi\u00e9',0)}else setRow('ig','\u274c \u00c9chec','err')}
    });
  }
  if(wantTT){
    row('tt','TikTok');prog.tt=[0,envoiBlob.size];
    const d=ttDirect();const f={mode:d?'direct':'brouillon'};
    if(d){f.titre=cap;f.privacy=$('ttPriv').value;f.disable_comment=!$('ttCom').checked;f.disable_duet=!$('ttDuet').checked;f.disable_stitch=!$('ttStitch').checked;f.brand_organic=$('ttDisc').checked&&$('ttOwn').checked;f.brand_content=$('ttDisc').checked&&$('ttBrand').checked}
    jobs.push(async()=>{
      const r=await tt(f,envoiBlob,e=>{if(e.lengthComputable){prog.tt=[e.loaded,e.total];upd()}});
      prog.tt=[envoiBlob.size,envoiBlob.size];upd();
      if(!r.ok)setRow('tt','\u274c '+(r.error||'\u00c9chec'),'err');else{setRow('tt','\u23f3 TikTok traite\u2026','wait');pollTT(r.publish_id,0)}
    });
  }
  for(const j of jobs){if(stoppe)break;try{await j()}catch(e){}}
  $('stop').style.display='none';
  if(!stoppe){$('fill').style.width='100%';$('pct').textContent='100 %'}
  busy=false;refresh();
}
function viderFichier(){annuler();blob=null;fname='';isVideo=false;vidDur=0;pendingAuto=false;try{$('file').value=''}catch(e){}
  $('prev').innerHTML='';$('res').innerHTML='';$('drop').classList.remove('has');
  $('dl').textContent='Choisir une vid\u00e9o ou une photo';$('ds').textContent='Depuis la galerie ou la cam\u00e9ra';
  $('vider').style.display='none';$('bar').style.display='none';$('pct').style.display='none';refresh()}
$('vider').onclick=viderFichier;
$('go').onclick=()=>{stoppe=false;run()};$('stop').onclick=annuler;
initTT();refresh();
