const FB_API='https://n8n-hetzner.duckdns.org/webhook/publier-partout';
const TT_API='https://n8n-hetzner.duckdns.org/webhook/tiktok-publier';
const TT_LOGIN='https://n8n-hetzner.duckdns.org/webhook/tiktok-connexion-autoluxe?ret=pp';
const $=id=>document.getElementById(id);
const SB='https://supabase.n8n-hetzner.duckdns.org/storage/v1/object/public/publications/statut/';
function suivre(job,plat,id,libelle,n){fetch(SB+job+'-'+plat+'.json?t='+Date.now()).then(r=>r.ok?r.json():null).then(d=>{if(d&&typeof d.ok!=='undefined'){setRow(id,d.ok?('\u2705 '+libelle):('\u274c '+(d.error||'\u00c9chec')),d.ok?'ok':'err');return}if(n>80){setRow(id,'\u23f3 Toujours en cours','wait');return}setTimeout(()=>suivre(job,plat,id,libelle,n+1),3000)}).catch(()=>{if(n<=80)setTimeout(()=>suivre(job,plat,id,libelle,n+1),3000)})}
const TPL="Votre ciel de toit est encore blanc ou beige ? 🤍➡️🖤\nPassez au noir et ajoutez un ciel étoilé : votre habitacle change complètement d'ambiance.\n\n✨ Ciel étoilé fibre optique, jusqu'à 500 étoiles\n🖤 Changement de couleur du ciel de toit : blanc ➜ noir, en tissu ou en Alcantara\n✔️ Finition d'origine • Garantie 24 mois\n\n📍 Auto Luxe Atelier – Chéraga, Alger\n📩 Écrivez-nous en privé pour un devis\n\nسقف طوموبيلتك مازال أبيض؟ 🤍\nردّوه أكحل 🖤 وزيدولو سما النجوم ✨ الطوموبيل تولي حاجة أخرى!\n📍 الشراقة – الجزائر | راسلونا في الخاص\n\n#cieletoile #cieldetoit #alcantara #starlight #autoluxeatelier #alger #algerie #dz #سقف_السيارة #تعديل_السيارات";
const LBL={PUBLIC_TO_EVERYONE:'Tout le monde',MUTUAL_FOLLOW_FRIENDS:'Amis (abonnés mutuels)',FOLLOWER_OF_CREATOR:'Abonnés',SELF_ONLY:'Moi uniquement'};
let S='',C=null,blob=null,fname='',isVideo=false,vidDur=0,busy=false,pendingAuto=false;
try{const h=new URLSearchParams(location.hash.slice(1));if(h.get('s')){localStorage.setItem('tt_s',h.get('s'));history.replaceState(null,'',location.pathname)}S=localStorage.getItem('tt_s')||''}catch(e){}

function xhr(url,fd,onp){return new Promise(ok=>{const x=new XMLHttpRequest();x.open('POST',url);if(onp)x.upload.onprogress=onp;
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
function toStory(src){return new Promise((ok,ko)=>{const img=new Image();img.onload=()=>{
  const W=1080,H=1920;const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#0d0d0d';x.fillRect(0,0,W,H);
  const iw=img.naturalWidth,ih=img.naturalHeight;
  try{const kc=Math.max(W/iw,H/ih);const bw=iw*kc,bh=ih*kc;x.filter='blur(42px)';x.drawImage(img,(W-bw)/2,(H-bh)/2,bw,bh);x.filter='none'}catch(e){}
  const k=Math.min(W/iw,H/ih);const w=iw*k,h=ih*k;x.drawImage(img,(W-w)/2,(H-h)/2,w,h);
  c.toBlob(b=>b?ok(b):ko('story'),'image/jpeg',0.92)};img.onerror=()=>ko('image');img.src=URL.createObjectURL(src)})}
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('prev').innerHTML='';vidDur=0;pendingAuto=true;$('res').innerHTML='';
  if(f.type.startsWith('image/')){isVideo=false;blob=await toJpeg(f);fname='photo.jpg';const i=document.createElement('img');i.src=URL.createObjectURL(blob);$('prev').appendChild(i)}
  else{isVideo=true;blob=f;fname=f.name||'video.mp4';const v=document.createElement('video');v.src=URL.createObjectURL(f);v.controls=true;v.playsInline=true;v.onloadedmetadata=()=>{vidDur=v.duration||0;refresh()};$('prev').appendChild(v)}
  $('drop').classList.add('has');$('dl').textContent=f.name;$('ds').textContent=(f.size/1048576).toFixed(1)+' Mo · '+(isVideo?'vidéo':'photo');refresh()};

const ttDirect=()=>document.querySelector('input[name=ttMode]:checked').value==='direct';
function refresh(){
  const aFichier=!!blob;
  const ytOff=aFichier&&!isVideo;$('rowYt').classList.toggle('off',ytOff);if(ytOff)$('dYt').checked=false;$('dYt').disabled=ytOff;
  $('rowStory').classList.toggle('off',false);$('dStory').disabled=false;
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
  if(pendingAuto&&ok&&!busy){pendingAuto=false;setTimeout(run,250)}
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

async function run(){
  pendingAuto=false;busy=true;refresh();$('res').innerHTML='';$('bar').style.display='block';$('pct').style.display='block';$('fill').style.width='0';$('pct').textContent='0 %';
  const job='j'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const cap=$('cap').value;const cibles=[];if($('dFb').checked)cibles.push('fb');if($('dStory').checked)cibles.push('story');if($('dIg').checked)cibles.push('ig');if($('dIgStory').checked)cibles.push('igstory');if($('dYt').checked)cibles.push('yt');
  const wantTT=$('dTt').checked;const prog={};const upd=()=>{let l=0,t=0;for(const k in prog){l+=prog[k][0];t+=prog[k][1]}const p=t?Math.round(l/t*100):0;$('fill').style.width=p+'%';$('pct').textContent=p+' %'};
  const jobs=[];
  if(cibles.length){
    if(cibles.includes('fb'))row('fb','Facebook');if(cibles.includes('story'))row('story','Story Facebook');if(cibles.includes('ig'))row('ig','Instagram');if(cibles.includes('igstory'))row('igstory','Story Instagram');if(cibles.includes('yt'))row('yt','YouTube Shorts');
    prog.meta=[0,blob.size];
    jobs.push(async()=>{
      const fd=new FormData();fd.append('video',blob,fname);
      if(!isVideo&&(cibles.includes('story')||cibles.includes('igstory'))){try{const sb=await toStory(blob);fd.append('video',sb,'story.jpg')}catch(e){}}
      fd.append('caption',cap);fd.append('cibles',cibles.join(','));fd.append('job',job);
      const r=await xhr(FB_API,fd,e=>{if(e.lengthComputable){prog.meta=[e.loaded,e.total];upd()}});
      prog.meta=[blob.size,blob.size];upd();
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
    row('tt','TikTok');prog.tt=[0,blob.size];
    const d=ttDirect();const f={mode:d?'direct':'brouillon'};
    if(d){f.titre=cap;f.privacy=$('ttPriv').value;f.disable_comment=!$('ttCom').checked;f.disable_duet=!$('ttDuet').checked;f.disable_stitch=!$('ttStitch').checked;f.brand_organic=$('ttDisc').checked&&$('ttOwn').checked;f.brand_content=$('ttDisc').checked&&$('ttBrand').checked}
    jobs.push(async()=>{
      const r=await tt(f,blob,e=>{if(e.lengthComputable){prog.tt=[e.loaded,e.total];upd()}});
      prog.tt=[blob.size,blob.size];upd();
      if(!r.ok)setRow('tt','\u274c '+(r.error||'\u00c9chec'),'err');else{setRow('tt','\u23f3 TikTok traite\u2026','wait');pollTT(r.publish_id,0)}
    });
  }
  for(const j of jobs){try{await j()}catch(e){}}
  $('fill').style.width='100%';$('pct').textContent='100 %';busy=false;refresh();
}
$('go').onclick=run;
initTT();refresh();
