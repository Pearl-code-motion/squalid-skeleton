/* Courses — PWA locale : recettes, catégories, fiches PDF et liste, sans service distant. */
(() => {
  'use strict';
  const DEFAULT_CATEGORIES = ['Sodas & alcools','Épicerie sucrée','Produits secs','Frais','Viandes et poissons','Fruits et légumes','Rayon BIO',"Produits d'entretien",'Hygiène','Surgelés','Épicerie asiatique','Pharmacie Lafayette'];
  const CSV_COLUMNS = ['recette','moment','ingredient','quantite','unite','categorie','ordre','personnes'];
  const REQUIRED_CSV_COLUMNS = CSV_COLUMNS.filter(c => c !== 'personnes');
  const MOMENTS = ['matin','midi','gouter','soir'];
  const UNITES = ['','g','kg','ml','l','u','cas','cac'];
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('fr');
  const uid = () => (globalThis.crypto?.randomUUID?.() || `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const qtyNum = value => { const s=String(value ?? '').trim().replace(',','.'); return s && Number.isFinite(Number(s)) ? Number(s) : null; };
  const fmt = n => Number(n.toFixed(3)).toLocaleString('fr-FR',{maximumFractionDigits:3});
  function parseCSV(text) {
    text=String(text??'').replace(/^\uFEFF/,'');
    let sep=',', quoted=false, firstRecord='';
    for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){firstRecord+='""';i++;continue;}if(c==='"'){quoted=!quoted;firstRecord+=c;continue;}if(!quoted&&(c==='\n'||c==='\r'))break;firstRecord+=c;}
    let commas=0,semis=0;quoted=false;for(let i=0;i<firstRecord.length;i++){const c=firstRecord[i];if(c==='"'&&quoted&&firstRecord[i+1]==='"'){i++;continue;}if(c==='"'){quoted=!quoted;continue;}if(!quoted){if(c===',')commas++;if(c===';')semis++;}}
    if(semis>commas)sep=';';
    const rows=[];let row=[],cell='',inQuotes=false,closedQuote=false,malformed=null;
    for(let i=0;i<text.length;i++){const c=text[i];
      if(inQuotes){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){inQuotes=false;closedQuote=true;}else cell+=c;continue;}
      if(closedQuote&&c!==sep&&c!=='\n'&&c!=='\r'&&c!==' '&&c!=='\t'){malformed=`Caractère inattendu après un champ entre guillemets (position ${i+1}).`;break;}
      if(c==='"'){if(cell.trim()){malformed=`Guillemet inattendu (position ${i+1}).`;break;}inQuotes=true;closedQuote=false;}
      else if(c===sep){row.push(cell);cell='';closedQuote=false;}
      else if(c==='\n'||c==='\r'){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';closedQuote=false;}
      else {cell+=c;if(c!==' '&&c!=='\t')closedQuote=false;}
    }
    if(inQuotes)malformed='Champ entre guillemets non terminé.';
    if(!malformed&&(cell.length||row.length)){row.push(cell);rows.push(row);}
    return {separator:sep,rows,error:malformed};
  }
  function validateCSV(text) {
    const {rows,error}=parseCSV(text);const errors=[];
    if(error)return {errors:[`CSV invalide : ${error}`],recipes:[]};
    if(!rows.length)return {errors:['Le fichier est vide ou ne contient pas d’en-tête.'],recipes:[]};
    const headers=rows[0].map(x=>x.trim().toLocaleLowerCase('fr'));
    const missing=REQUIRED_CSV_COLUMNS.filter(c=>!headers.includes(c));
    if(missing.length)return {errors:[`En-tête CSV invalide : colonne(s) manquante(s) ${missing.join(', ')}. Colonnes attendues : ${CSV_COLUMNS.join(', ')} (personnes facultative).`],recipes:[]};
    const ix=Object.fromEntries([...new Set([...CSV_COLUMNS,'repas'])].map(c=>[c,headers.indexOf(c)]));const valid=[];
    rows.slice(1).forEach((r,index)=>{const line=index+2;if(r.every(c=>!String(c??'').trim()))return;
      if(r.length!==headers.length){errors.push(`Ligne ${line} : ${r.length<headers.length?'colonnes manquantes':'trop de colonnes'} (${r.length} valeurs pour ${headers.length} colonnes).`);return;}
      const v=Object.fromEntries([...new Set([...CSV_COLUMNS,'repas'])].map(c=>[c,ix[c]<0?'':String(r[ix[c]]??'').trim()]));
      const fail=m=>errors.push(`Ligne ${line} : ${m}`);
      const servingText=v.personnes||v.repas||'1',people=Number(servingText);
      if(!Number.isInteger(people)||people<1)fail(`« personnes » doit être un entier supérieur ou égal à 1 (« ${servingText} »).`);
      if(!v.recette)fail('nom de recette manquant.');if(!v.ingredient)fail('nom d’ingrédient manquant.');if(!v.categorie)fail('catégorie vide.');
      const moments=v.moment.split('|').map(x=>norm(x));if(!v.moment||moments.some(m=>!MOMENTS.includes(m)))fail(`moment invalide (« ${v.moment} »). Valeurs admises : matin, midi, gouter, soir.`);
      if(v.quantite&&qtyNum(v.quantite)===null)fail(`quantité non numérique (« ${v.quantite} »).`);
      if(!UNITES.includes(norm(v.unite)))fail(`unité invalide (« ${v.unite} »).`);
      if(!errors.some(e=>e.startsWith(`Ligne ${line} :`)))valid.push({...v,personnes:people,line,moments:[...new Set(moments)],quantity:v.quantite.replace('.',',')});
    });
    if(rows.length<2)errors.push('Le fichier ne contient aucune ligne de données.');
    if(errors.length)return {errors,recipes:[]};
    const map=new Map();for(const v of valid){const key=norm(v.recette);let r=map.get(key);if(!r){r={name:v.recette,personnes:v.personnes,moments:v.moments,ingredients:[]};map.set(key,r);}else{if(r.personnes!==v.personnes){errors.push(`Lignes de la recette « ${v.recette} » : la valeur « personnes » doit être identique pour tous ses ingrédients.`);continue;}v.moments.forEach(m=>{if(!r.moments.includes(m))r.moments.push(m);});}r.ingredients.push({name:v.ingredient,quantity:v.quantity,unit:norm(v.unite),category:v.categorie,order:qtyNum(v.ordre)??r.ingredients.length});}
    if(errors.length)return {errors,recipes:[]};
    return {errors:[],recipes:[...map.values()].map(r=>({...r,ingredients:r.ingredients.sort((a,b)=>a.order-b.order).map(({order,...i})=>i)}))};
  }
  function recipeSignature(r){return JSON.stringify({personnes:Number(r.personnes||r.repas)||1,moments:[...(r.moments||[])].sort(),ingredients:(r.ingredients||[]).map(i=>[norm(i.name),String(i.quantity??''),norm(i.unit),norm(i.category)])});}
  function selectedMealCounts(selected,recipes){let midi=0,soir=0;for(const [key,count] of Object.entries(selected||{})){const [moment,part,...rest]=key.split(':');if(moment!=='midi'&&moment!=='soir')continue;const recipe=recipes.find(r=>r.id===rest.join(':'));const people=Number(part)||Number(recipe?.personnes||recipe?.repas)||1;if(moment==='midi')midi+=count*people;else soir+=count*people;}return {midi,soir,repas:midi+soir};}
  function reconcileRecipes(existing,incoming){const next=existing.map(r=>({...r,ingredients:(r.ingredients||[]).map(i=>({...i})),moments:[...(r.moments||[])]}));let added=0,updated=0,unchanged=0;for(const fresh of incoming){const old=next.find(r=>norm(r.name)===norm(fresh.name));if(!old){next.push({...fresh,id:fresh.id||uid()});added++;}else if(recipeSignature(old)!==recipeSignature(fresh)){Object.assign(old,fresh);updated++;}else unchanged++;}return {recipes:next,added,updated,unchanged};}
  function canonicalUnit(unit){const u=norm(unit);return ['kg','g'].includes(u)?'g':['l','ml'].includes(u)?'ml':['cas','cac'].includes(u)?'nonquantifiable':u;}
  function scale(q,people,recipePeople=1,unit=''){const v=qtyNum(q);if(v===null)return String(q||'');const scaled=v*(Number(people)||1)/(Number(recipePeople)||1);return String(norm(unit)==='u'?Math.ceil(scaled):Math.round(scaled*1000)/1000).replace('.',',');}
  function mergeListItem(list,source,multiplier=1){const name=String(source.name||'').trim();if(!name)return;let unit=norm(source.unit),q=qtyNum(source.quantity);if(['cas','cac'].includes(unit)){q=null;unit='';}
    if(q!==null&&['kg','l'].includes(unit)){q*=1000;unit=unit==='kg'?'g':'ml';}const value=q===null?'':String(Math.round(q*multiplier*1000)/1000);const baseUnit=canonicalUnit(unit);
    const found=list.find(x=>norm(x.name)===norm(name)&&canonicalUnit(x.unit)===baseUnit);
    if(found){if(value!=='')found.quantity=String((qtyNum(found.quantity)||0)+(Number(value)||0));if(baseUnit==='nonquantifiable'){found.quantity='';found.unit='';}return;}
    list.push({id:uid(),name,quantity:value,unit:baseUnit==='nonquantifiable'?'':baseUnit,category:source.category||'',checked:false});
  }
  function displayQty(item){let q=qtyNum(item.quantity);if(q===null)return '';let u=item.unit;if(u==='u')q=Math.ceil(q);if(u==='g'&&q>=1000){q/=1000;u='kg';}else if(u==='ml'&&q>=1000){q/=1000;u='l';}return `${fmt(q)}${u?` ${u}`:''}`;}

  if(typeof document==='undefined'){
    if(typeof module!=='undefined')module.exports={DEFAULT_CATEGORIES,CSV_COLUMNS,parseCSV,validateCSV,recipeSignature,reconcileRecipes,mergeListItem,displayQty,norm,qtyNum,selectedMealCounts,scale,canonicalUnit};
    return;
  }
  const view=$('#view'), toast=$('#toast'); let db, state={recipes:[],categories:[],pdfs:[],list:[]}, tab='list', modalOpen=false, workflow=null, monthCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1), days=new Map(), selectedCounts={};
  const dbReq=(req)=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('courses-local-v1',1);req.onupgradeneeded=()=>{const d=req.result;for(const n of ['recipes','categories','pdfs','list'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function all(store){return dbReq(db.transaction(store,'readonly').objectStore(store).getAll());}
  async function put(store,item){return dbReq(db.transaction(store,'readwrite').objectStore(store).put(item));}
  async function del(store,id){return dbReq(db.transaction(store,'readwrite').objectStore(store).delete(id));}
  async function replaceStore(store,items){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),os=tx.objectStore(store);os.clear();items.forEach(i=>os.put(i));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
  async function load(){[state.recipes,state.categories,state.pdfs,state.list]=await Promise.all(['recipes','categories','pdfs','list'].map(all));if(!state.categories.length){state.categories=DEFAULT_CATEGORIES.map((name,order)=>({id:uid(),name,order,ingredients:[]}));await replaceStore('categories',state.categories);}state.categories.sort((a,b)=>a.order-b.order);}
  function say(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),3000);}
  function page(title,subtitle,html){view.innerHTML=`<header class="page-head"><p>${esc(subtitle)}</p><h1>${esc(title)}</h1></header>${html}`;window.scrollTo(0,0);}
  function button(action,text,cls=''){return `<button class="button ${cls}" data-action="${action}">${text}</button>`;}
  function categoryName(id){return state.categories.find(c=>c.id===id)?.name||id||'Sans catégorie';}
  function renderImport(){page('Importer','RECETTES · CSV',`<section class="group"><p class="hint">CSV UTF‑8 : recette,moment,ingredient,quantite,unite,categorie,ordre,personnes. La colonne personnes est facultative à l’import (1 par défaut) ; sa valeur doit être un entier ≥ 1. Virgule ou point-virgule accepté. L’import est validé en entier avant toute modification.</p><label class="file-pick">Choisir un fichier CSV<input type="file" id="csv-file" accept=".csv,text/csv"></label></section><section class="group"><h2>Mes recettes <span class="muted">${state.recipes.length}</span></h2>${state.recipes.length?state.recipes.map(r=>`<details class="recipe-entry"><summary><b>${esc(r.name)}</b><small>${(r.moments||[]).map(esc).join(' · ')} · ${r.ingredients.length} ingrédients · ${Number(r.personnes||r.repas)||1} personne(s)</small><button class="text-button" data-action="delete-recipe" data-id="${esc(r.id)}" aria-label="Supprimer">Supprimer</button></summary><div>${r.ingredients.map(i=>`<p>${esc(i.name)} <span class="muted">${esc([i.quantity,i.unit,categoryName(i.category)].filter(Boolean).join(' · '))}</span></p>`).join('')}</div></details>`).join(''):'<p class="muted">Aucune recette importée.</p>'}</section><section class="group">${button('export-csv','Exporter les recettes','secondary')}</section>`);}
  function renderCategories(){page('Catégories','ORGANISATION',`<section class="group category-list">${state.categories.map((c,i)=>`<article class="category-card" data-category-id="${esc(c.id)}"><div class="cat-head"><b><span class="drag-grip" aria-hidden="true">⠿</span>${esc(c.name)}</b><div><button class="text-button" data-action="rename-cat" data-id="${esc(c.id)}">Renommer</button><button class="text-button" data-action="delete-cat" data-id="${esc(c.id)}">Supprimer</button></div></div><div class="chips">${c.ingredients.map(x=>`<span>${esc(x)}</span>`).join('')||'<span class="muted">Aucun ingrédient</span>'}</div><form class="inline-form" data-form="catalog" data-id="${esc(c.id)}"><input name="name" placeholder="Ajouter un ingrédient" required><button>＋</button></form></article>`).join('')}</section><p class="hint reorder-hint">Maintenez une catégorie environ une demi-seconde, puis faites-la glisser pour la déplacer.</p><form class="group inline-form" data-form="new-cat"><input name="name" placeholder="Nouvelle catégorie" required><button class="button">Ajouter</button></form>`);}
  function pdfDisplayName(name){return String(name||'').replace(/\.pdf$/i,'');}
  function renderPdfs(){page('Fiches','DOCUMENTS · STOCKAGE LOCAL',`<section class="group"><label class="file-pick">Importer un ou plusieurs PDF<input id="pdf-file" type="file" accept="application/pdf,.pdf" multiple></label><p class="hint">Les fichiers sont stockés localement dans IndexedDB.</p></section><section class="pdf-list">${state.pdfs.length?[...state.pdfs].sort((a,b)=>pdfDisplayName(a.name).localeCompare(pdfDisplayName(b.name),'fr',{sensitivity:'base'})).map(f=>`<article class="pdf-card" data-pdf-row="${esc(f.id)}" data-action="open-pdf" data-id="${esc(f.id)}" role="button" tabindex="0" aria-label="Ouvrir ${esc(pdfDisplayName(f.name))}"><span class="pdf-name">${esc(pdfDisplayName(f.name))}</span><button class="pdf-icon-button" data-action="rename-pdf" data-id="${esc(f.id)}" aria-label="Renommer ${esc(pdfDisplayName(f.name))}" title="Renommer">✎</button><button class="pdf-icon-button pdf-cross" data-action="delete-pdf" data-id="${esc(f.id)}" aria-label="Supprimer ${esc(pdfDisplayName(f.name))}" title="Supprimer">✕</button></article>`).join(''):'<section class="group empty-state"><b>Aucune fiche PDF</b><p>Importez vos documents pour les retrouver ici.</p></section>'}</section>`);}
  function groupedList(){const map=new Map();state.list.forEach(x=>{const k=norm(x.name);if(!map.has(k))map.set(k,[]);map.get(k).push(x);});return map;}
  function renderList(){const grouped=groupedList();let body='';state.categories.forEach(cat=>{const items=state.list.filter(i=>i.category===cat.id);if(!items.length)return;body+=`<section class="list-group"><h2>${esc(cat.name)}</h2>${items.map(i=>`<div class="shopping-row ${i.checked?'checked':''}"><input type="checkbox" data-action="toggle" data-id="${esc(i.id)}" ${i.checked?'checked':''} aria-label="Cocher ${esc(i.name)}"><span>${esc(i.name)}</span><small>${esc(displayQty(i))}</small></div>`).join('')}</section>`;});
    const uncategorized=state.list.filter(i=>!state.categories.some(c=>c.id===i.category));if(uncategorized.length)body+=`<section class="list-group"><h2>Autres</h2>${uncategorized.map(i=>`<div class="shopping-row ${i.checked?'checked':''}"><input type="checkbox" data-action="toggle" data-id="${esc(i.id)}"><span>${esc(i.name)}</span><small>${esc(displayQty(i))}</small></div>`).join('')}</section>`;
    page('Courses','VOTRE LISTE',`<div class="list-actions">${button('add-manual','＋ Ajouter un élément','primary')}${button('generate','Composer la liste','secondary')}${button('reset','Réinitialiser','danger')}</div>${state.list.length?body:'<section class="group empty-state"><b>Votre liste est vide</b><p>Ajoutez un article ou composez votre prochaine liste.</p></section>'}<form id="manual-form" class="group manual-form" hidden><h2>Ajouter un élément</h2><input name="name" placeholder="Nom" required><input name="quantity" placeholder="Quantité" inputmode="decimal"><select name="unit"><option value="">Sans unité</option>${UNITES.filter(Boolean).map(u=>`<option>${u}</option>`).join('')}</select><select name="category">${state.categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select><button class="button">Ajouter</button></form>`);}
  function setTab(which){tab=which;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===which));({import:renderImport,cats:renderCategories,pdf:renderPdfs,list:renderList}[which]||renderList)();}
  function showHome(){modalOpen=true;$('#home-modal').hidden=false;}
  function hideHome(){modalOpen=false;$('#home-modal').hidden=true;}
  function renderCalendar(){const year=monthCursor.getFullYear(),month=monthCursor.getMonth(),first=new Date(year,month,1),offset=(first.getDay()+6)%7,daysIn=new Date(year,month+1,0).getDate(),today=new Date();today.setHours(0,0,0,0);let cells='';for(let i=0;i<offset;i++)cells+='<span class="blank"></span>';for(let d=1;d<=daysIn;d++){const date=new Date(year,month,d),key=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,past=date<today;cells+=past?'<span class="blank"></span>':`<button class="day ${days.has(key)?'selected':''}" data-action="day" data-date="${key}">${d}</button>`;}
    const slot=(date,moment,label,opt)=>`<label><input type="checkbox" data-meal="${moment}" data-date="${date}" ${opt[moment].selected?'checked':''}> ${label}</label><label class="people-choice">Personnes <input type="number" min="1" step="1" inputmode="numeric" data-people="${moment}" data-date="${date}" value="${opt[moment].people}" ${opt[moment].selected?'':'disabled'}></label>`;
    page('Choisir les jours','PAR RECETTES · 1/2',`<section class="group"><div class="calendar-head"><button data-action="month" data-delta="-1">‹</button><b>${monthCursor.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</b><button data-action="month" data-delta="1">›</button></div><div class="calendar-grid">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}${cells}</div><div id="day-options">${[...days].map(([date,opt])=>`<div class="day-options"><b>${new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</b>${slot(date,'midi','Midi',opt)}${slot(date,'soir','Soir',opt)}<button data-action="un-day" data-date="${date}">Retirer</button></div>`).join('')}</div></section><div class="form-actions">${button('skip-calendar','Passer','secondary')}${button('calendar-next','Continuer','primary')}</div>`);}
  function mealsCounts(){let midi=0,soir=0;days.forEach(d=>{if(d.midi.selected)midi+=d.midi.people;if(d.soir.selected)soir+=d.soir.people;});return {days:days.size,midi,soir};}
  function renderRecipePicker(){const counts=mealsCounts(),selected=selectedMealCounts(selectedCounts,state.recipes),sections=['matin','midi','gouter','soir'];const counter=(label,value,target,complete)=>`<span class="meal-counter ${complete?'is-complete':'is-pending'}">${label} : ${value}/${target}</span>`;const fixed=`${counter('m',selected.midi,counts.midi,counts.midi>0&&selected.midi>=counts.midi)}${counter('s',selected.soir,counts.soir,counts.soir>0&&selected.soir>=counts.soir)}`;
    const rows=(moment,people=null,capacity=null)=>{const rs=state.recipes.filter(r=>(r.moments||[]).includes(moment));if(!rs.length)return '<p class="muted">Aucune recette pour ce moment.</p>';return rs.map(r=>{const key=people===null?`${moment}:${workflow?.passed?0:1}:${r.id}`:`${moment}:${people}:${r.id}`,n=selectedCounts[key]||0,chosen=Object.entries(selectedCounts).filter(([k])=>k.startsWith(`${moment}:${people}:`)).reduce((sum,[,v])=>sum+v,0);return `<div class="picker-row"><span>${esc(r.name)} <small class="recipe-meals">${Number(r.personnes||r.repas)||1} pers./recette</small></span><div><button data-action="count" data-key="${esc(key)}" data-delta="-1" ${n<=0?'disabled':''}>−</button><b>${n}</b><button data-action="count" data-key="${esc(key)}" data-delta="1" ${capacity!==null&&chosen>=capacity?'disabled':''}>＋</button></div></div>`;}).join('');};
    let html=`<section class="group"><h2>Matin <small class="muted">(facultatif)</small></h2>${rows('matin')}</section>`;
    for(const moment of ['midi','soir']){const groups=new Map();days.forEach(d=>{if(d[moment].selected){const n=d[moment].people;groups.set(n,(groups.get(n)||0)+1);}});if(workflow?.passed){html+=`<section class="group"><h2>${moment==='midi'?'Midi':'Soir'}</h2>${rows(moment,null,null)}</section>`;continue;}if(!groups.size)html+=`<section class="group"><h2>${moment==='midi'?'Midi':'Soir'}</h2><p class="muted">Aucun créneau sélectionné.</p></section>`;for(const [people,capacity] of [...groups].sort((a,b)=>a[0]-b[0]))html+=`<section class="group"><h2>${moment==='midi'?'Midi':'Soir'} – ${people} ${people===1?'personne':'personnes'}</h2>${rows(moment,people,capacity)}</section>`;}
    html+=`<section class="group"><h2>Goûter <small class="muted">(facultatif)</small></h2>${rows('gouter')}</section>`;
    page('Choisir les recettes','PAR RECETTES · 2/2',`<div class="sticky-count">${fixed}</div>${html}<div class="form-actions">${button('recipe-ok','OK · Générer les courses','primary')}</div>`);}
  function categoryPicker(){page('Par catégories','COMPOSER LA LISTE',`<div id="category-picker">${state.categories.map(c=>`<section class="group"><h2>${esc(c.name)}</h2>${c.ingredients.map(name=>`<label class="catalogue-pick"><input type="checkbox" data-pick="${esc(c.id)}|${esc(name)}"><span>${esc(name)}</span><input type="number" min="0" step="any" placeholder="Qté" data-pick-qty="${esc(c.id)}|${esc(name)}"><select data-pick-unit="${esc(c.id)}|${esc(name)}"><option value="">—</option>${UNITES.filter(Boolean).map(u=>`<option>${u}</option>`).join('')}</select></label>`).join('')||'<p class="muted">Ajoutez des ingrédients dans Catégories.</p>'}</section>`).join('')}</div><div class="form-actions">${button('category-ok','OK · Ajouter à la liste','primary')}</div>`);}
  function showGeneratorChoice(){workflow=null;$('#choice-modal').hidden=false;}
  async function afterImport(text){const result=validateCSV(text);if(result.errors.length){say(`Import annulé — ${result.errors[0]}`);return;}let added=0,updated=0,unchanged=0;const next=[...state.recipes];
    // Catalogue alimenté uniquement après validation complète, puis comparaison par contenu cohérent.
    result.recipes.forEach(r=>r.ingredients.forEach(i=>{let cat=state.categories.find(c=>norm(c.name)===norm(i.category));if(!cat){cat={id:uid(),name:i.category,order:state.categories.length,ingredients:[]};state.categories.push(cat);}if(!cat.ingredients.some(x=>norm(x)===norm(i.name)))cat.ingredients.push(i.name);i.category=cat.id;}));
    const reconciled=reconcileRecipes(next,result.recipes);added=reconciled.added;updated=reconciled.updated;unchanged=reconciled.unchanged;next.splice(0,next.length,...reconciled.recipes);
    state.recipes=next;await Promise.all([replaceStore('recipes',state.recipes),replaceStore('categories',state.categories)]);renderImport();say(`${added} ajoutée(s), ${updated} mise(s) à jour, ${unchanged} inchangée(s).`);}
  function selectedNewList(entries,mode='append'){if(mode==='replace')state.list=[];entries.forEach(x=>mergeListItem(state.list,x,1));replaceStore('list',state.list).then(()=>{setTab('list');say(mode==='replace'?'Liste remplacée.':'Articles ajoutés à la liste.');});}
  function askAppend(entries){if(!state.list.length)return selectedNewList(entries);$('#merge-modal').hidden=false;$('#merge-modal').dataset.payload=JSON.stringify(entries);}

  document.addEventListener('keydown',e=>{const card=e.target.closest('.pdf-card[role=button]');if(card&&e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click();}});
  let suppressPdfClick=false;
  const pdfObjectUrls=new Set();
  document.addEventListener('click',async e=>{if(suppressPdfClick&&e.target.closest('.pdf-card[data-pdf-row]')){e.preventDefault();e.stopImmediatePropagation();suppressPdfClick=false;return;}const tabButton=e.target.closest('[data-tab]');if(tabButton){setTab(tabButton.dataset.tab);return;}const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
    if(a==='home'){showHome();return;} if(a==='home-close'){hideHome();return;}
    if(a==='home-generate'){hideHome();showGeneratorChoice();return;} if(a==='home-open'){hideHome();setTab(tab);return;}
    if(a==='choose-recipes'){ $('#choice-modal').hidden=true;workflow={passed:false};days.clear();selectedCounts={};monthCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar();return;}
    if(a==='choose-categories'){ $('#choice-modal').hidden=true;categoryPicker();return;}
    if(a==='cancel-merge'){ $('#merge-modal').hidden=true;return;}
    if(a==='cancel-merge'){ $('#merge-modal').hidden=true;return;}
    if(a==='merge-add'||a==='merge-replace'){const entries=JSON.parse($('#merge-modal').dataset.payload||'[]');$('#merge-modal').hidden=true;selectedNewList(entries,a==='merge-replace'?'replace':'append');return;}
    if(a==='tab'){setTab(b.dataset.tab);return;}
    if(a==='export-csv'){const lines=[CSV_COLUMNS.join(',')];state.recipes.forEach(r=>r.ingredients.forEach((i,n)=>{const row=[r.name,(r.moments||[]).join('|'),i.name,i.quantity,i.unit,categoryName(i.category),n+1,Number(r.personnes||r.repas)||1];lines.push(row.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(','));}));const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='courses-recettes.csv';link.click();URL.revokeObjectURL(url);return;}
    if(a==='delete-recipe'){if(confirm('Supprimer cette recette ?')){state.recipes=state.recipes.filter(r=>r.id!==id);await del('recipes',id);renderImport();}return;}
    if(a==='rename-cat'){const cat=state.categories.find(c=>c.id===id),name=prompt('Nouveau nom de la catégorie',cat?.name||'');if(cat&&name?.trim()&&name.trim()!==cat.name&&confirm(`Renommer « ${cat.name} » en « ${name.trim()} » ?`)){cat.name=name.trim();await put('categories',cat);renderCategories();}return;}
    if(a==='delete-cat'){if(confirm('Supprimer cette catégorie ?')){state.categories=state.categories.filter(c=>c.id!==id);state.categories.forEach((c,i)=>c.order=i);await replaceStore('categories',state.categories);renderCategories();}return;}
    if(a==='toggle'){const item=state.list.find(x=>x.id===id);if(item){item.checked=b.checked;await put('list',item);renderList();}return;}
    if(a==='add-manual'){const f=$('#manual-form');f.hidden=!f.hidden;return;}
    if(a==='reset'){if(confirm('Réinitialiser toute la liste de courses ?')){state.list=[];await replaceStore('list',[]);renderList();say('Liste réinitialisée.');}return;}
    if(a==='generate'){showGeneratorChoice();return;}
    if(a==='month'){monthCursor.setMonth(monthCursor.getMonth()+Number(b.dataset.delta));const firstAllowed=new Date(new Date().getFullYear(),new Date().getMonth(),1);if(monthCursor<firstAllowed)monthCursor=firstAllowed;renderCalendar();return;}
    if(a==='day'){const date=b.dataset.date;if(!days.has(date))days.set(date,{midi:{selected:false,people:1},soir:{selected:false,people:1}});else days.delete(date);renderCalendar();return;}
    if(a==='un-day'){days.delete(b.dataset.date);renderCalendar();return;}
    if(a==='skip-calendar'){workflow={passed:true};renderRecipePicker();return;}
    if(a==='calendar-next'){workflow={passed:false};renderRecipePicker();return;}
    if(a==='count'){const n=Math.max(0,(selectedCounts[b.dataset.key]||0)+Number(b.dataset.delta));if(n)selectedCounts[b.dataset.key]=n;else delete selectedCounts[b.dataset.key];renderRecipePicker();return;}
    if(a==='recipe-ok'){const entries=[];Object.entries(selectedCounts).forEach(([key,n])=>{const [moment,peopleText,...rest]=key.split(':'),r=state.recipes.find(x=>x.id===rest.join(':'));if(!r)return;const basePeople=(moment==='midi'||moment==='soir'?Number(r.personnes||r.repas)||1:1),people=(moment==='midi'||moment==='soir'?(workflow?.passed?basePeople:(Number(peopleText)||1))*n:n);r.ingredients.forEach(i=>entries.push({...i,category:state.categories.find(c=>norm(c.name)===norm(i.category))?.id||'',quantity:scale(i.quantity,people,basePeople,i.unit)}));});if(!entries.length){say('Choisissez au moins une recette.');return;}askAppend(entries);return;}
    if(a==='category-ok'){const entries=[];document.querySelectorAll('[data-pick]:checked').forEach(ch=>{const [cat,name]=ch.dataset.pick.split('|'),q=$(`[data-pick-qty="${CSS.escape(ch.dataset.pick)}"]`)?.value||'',unit=$(`[data-pick-unit="${CSS.escape(ch.dataset.pick)}"]`)?.value||'';entries.push({name,quantity:q,unit,category:cat});});if(!entries.length){say('Choisissez au moins un article.');return;}askAppend(entries);return;}
    if(a==='open-pdf'){const f=state.pdfs.find(x=>x.id===id);if(f){const url=URL.createObjectURL(f.blob);pdfObjectUrls.add(url);const opened=window.open(url,'_blank');if(opened)opened.opener=null;else window.location.assign(url);}return;}
    if(a==='rename-pdf'){const f=state.pdfs.find(x=>x.id===id),name=prompt('Nouveau nom du fichier',pdfDisplayName(f?.name||''));if(f&&name?.trim()){f.name=pdfDisplayName(name.trim());await put('pdfs',f);renderPdfs();}return;}
    if(a==='delete-pdf'){await deletePdf(id);return;}
  });
  // Réordonnancement au toucher : appui long, carte flottante, emplacement animé et sauvegarde IndexedDB.
  let dragState=null;
  const categoryList=$('#view');
  function flipCategoryCards(list, mutate){
    const cards=[...list.querySelectorAll('.category-card')], before=new Map(cards.map(card=>[card,card.getBoundingClientRect().top]));
    mutate();
    for(const card of cards){if(card===dragState?.card)continue;const delta=before.get(card)-card.getBoundingClientRect().top;if(Math.abs(delta)<1)continue;
      card.style.transition='none';card.style.transform=`translate3d(0,${delta}px,0)`;void card.offsetHeight;
      requestAnimationFrame(()=>{card.style.transition='';card.style.transform='';});
    }
  }
  function beginCategoryPress(card,x,y,pointerId=null){
    if(!card||dragState)return;
    const d=dragState={card,pointerId,startX:x,startY:y,x,y,started:false,timer:null,placeholder:null,rect:null,raf:null,originalStyle:card.getAttribute('style')};
    d.timer=setTimeout(()=>{
      if(dragState!==d)return;d.started=true;d.rect=card.getBoundingClientRect();
      d.placeholder=document.createElement('div');d.placeholder.className='category-placeholder';d.placeholder.style.height=`${d.rect.height}px`;
      card.before(d.placeholder);card.classList.add('dragging');document.body.classList.add('category-dragging');$('.category-list')?.classList.add('drag-active');
      card.style.position='fixed';card.style.left=`${d.rect.left}px`;card.style.top=`${d.rect.top}px`;card.style.width=`${d.rect.width}px`;card.style.margin='0';card.style.zIndex='40';card.style.pointerEvents='none';
      card.style.transform=`translate3d(0,0,0) scale(1.025)`;
      if(pointerId!==null)try{card.setPointerCapture(pointerId);}catch(_){}
      try{navigator.vibrate?.(14);}catch(_){}
      d.raf=requestAnimationFrame(autoScrollCategoryDrag);
    },500);
  }
  function placeDraggedCard(y){
    const list=$('.category-list');if(!list||!dragState?.placeholder)return;
    const d=dragState, cards=[...list.querySelectorAll('.category-card')].filter(card=>card!==d.card);
    let target=cards.find(card=>y<card.getBoundingClientRect().top+card.getBoundingClientRect().height/2);
    if(target){if(d.placeholder.nextElementSibling!==target)flipCategoryCards(list,()=>list.insertBefore(d.placeholder,target));}
    else if(d.placeholder!==list.lastElementChild)flipCategoryCards(list,()=>list.appendChild(d.placeholder));
  }
  function updateCategoryDrag(x,y){
    if(!dragState?.started)return;const d=dragState;d.x=x;d.y=y;
    d.card.style.transform=`translate3d(${x-d.startX}px,${y-d.startY}px,0) scale(1.025)`;
    placeDraggedCard(y);
  }
  function autoScrollCategoryDrag(){
    if(!dragState?.started)return;const edge=72,speed=14,y=dragState.y;
    if(y<edge)window.scrollBy(0,-Math.ceil(speed*(edge-y)/edge));
    else if(y>window.innerHeight-edge)window.scrollBy(0,Math.ceil(speed*(y-(window.innerHeight-edge))/edge));
    placeDraggedCard(y);dragState.raf=requestAnimationFrame(autoScrollCategoryDrag);
  }
  async function finishCategoryDrag(){
    if(!dragState)return;const d=dragState;clearTimeout(d.timer);dragState=null;
    if(d.raf)cancelAnimationFrame(d.raf);
    if(!d.started)return;
    const list=$('.category-list');if(!list)return;
    flipCategoryCards(list,()=>d.placeholder.replaceWith(d.card));
    d.card.classList.remove('dragging');if(d.originalStyle===null)d.card.removeAttribute('style');else d.card.setAttribute('style',d.originalStyle);
    document.body.classList.remove('category-dragging');list.classList.remove('drag-active');
    const ids=[...list.querySelectorAll('.category-card')].map(x=>x.dataset.categoryId);
    state.categories.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));state.categories.forEach((c,i)=>c.order=i);
    await replaceStore('categories',state.categories);setTimeout(()=>{if(tab==='cats')renderCategories();},220);
  }
  function cancelCategoryPress(){if(dragState&&!dragState.started){clearTimeout(dragState.timer);dragState=null;}}
  categoryList.addEventListener('pointerdown',e=>{
    if(e.pointerType==='touch')return;const card=e.target.closest('.category-card');
    if(!card||e.target.closest('button,input,select,form'))return;beginCategoryPress(card,e.clientX,e.clientY,e.pointerId);
  });
  categoryList.addEventListener('pointermove',e=>{
    if(!dragState||dragState.pointerId!==e.pointerId)return;
    if(!dragState.started&&Math.hypot(e.clientX-dragState.startX,e.clientY-dragState.startY)>9){cancelCategoryPress();return;}
    if(dragState.started){e.preventDefault();updateCategoryDrag(e.clientX,e.clientY);}
  },{passive:false});
  categoryList.addEventListener('pointerup',e=>{if(dragState?.pointerId===e.pointerId)finishCategoryDrag();});
  categoryList.addEventListener('pointercancel',e=>{if(dragState?.pointerId===e.pointerId)finishCategoryDrag();});
  categoryList.addEventListener('touchstart',e=>{
    const card=e.target.closest('.category-card');if(!card||e.target.closest('button,input,select,form')||e.touches.length!==1)return;
    beginCategoryPress(card,e.touches[0].clientX,e.touches[0].clientY);
  },{passive:true});
  categoryList.addEventListener('touchmove',e=>{
    if(!dragState||e.touches.length!==1)return;const t=e.touches[0];
    if(!dragState.started&&Math.hypot(t.clientX-dragState.startX,t.clientY-dragState.startY)>9){cancelCategoryPress();return;}
    if(dragState.started){e.preventDefault();updateCategoryDrag(t.clientX,t.clientY);}
  },{passive:false});
  categoryList.addEventListener('touchend',e=>{
    if(dragState)finishCategoryDrag();
    if(!pdfSwipe)return;const swipe=pdfSwipe,t=e.changedTouches[0],dx=t.clientX-swipe.x,dy=t.clientY-swipe.y;pdfSwipe=null;
    if(dx < -55 && Math.abs(dx)>Math.abs(dy)){suppressPdfClick=true;setTimeout(()=>{suppressPdfClick=false;},800);deletePdf(swipe.id);}
  },{passive:true});
  categoryList.addEventListener('touchcancel',()=>{if(dragState)finishCategoryDrag();pdfSwipe=null;},{passive:true});
  let pdfSwipe=null;
  categoryList.addEventListener('touchstart',e=>{const row=e.target.closest('.pdf-card[data-pdf-row]');if(row&&e.touches.length===1)pdfSwipe={id:row.dataset.pdfRow,x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  async function deletePdf(id){if(!confirm('Supprimer cette fiche PDF ?'))return;state.pdfs=state.pdfs.filter(x=>x.id!==id);await del('pdfs',id);renderPdfs();}
  document.addEventListener('change',async e=>{
    if(e.target.id==='csv-file'){const file=e.target.files[0];if(file)afterImport(await file.text());e.target.value='';}
    if(e.target.id==='pdf-file'){for(const f of e.target.files){const rec={id:uid(),name:pdfDisplayName(f.name),blob:f,type:f.type||'application/pdf'};state.pdfs.push(rec);await put('pdfs',rec);}renderPdfs();say(`${e.target.files.length} fiche(s) ajoutée(s).`);}
    if(e.target.dataset.meal){const d=days.get(e.target.dataset.date),m=d?.[e.target.dataset.meal];if(m){m.selected=e.target.checked;renderCalendar();}}
    if(e.target.dataset.people){const d=days.get(e.target.dataset.date),m=d?.[e.target.dataset.people],value=Math.max(1,Math.floor(Number(e.target.value)||1));if(m){m.people=value;e.target.value=value;}}
  });
  document.addEventListener('submit',async e=>{const form=e.target;if(form.dataset.form==='new-cat'){e.preventDefault();const name=new FormData(form).get('name').trim();if(state.categories.some(c=>norm(c.name)===norm(name)))return say('Cette catégorie existe déjà.');if(!confirm(`Ajouter la catégorie « ${name} » ?`))return;state.categories.push({id:uid(),name,order:state.categories.length,ingredients:[]});await replaceStore('categories',state.categories);renderCategories();return;}
    if(form.dataset.form==='catalog'){e.preventDefault();const cat=state.categories.find(c=>c.id===form.dataset.id),name=new FormData(form).get('name').trim();if(cat&&!cat.ingredients.some(x=>norm(x)===norm(name))){cat.ingredients.push(name);await put('categories',cat);}renderCategories();return;}
    if(form.id==='manual-form'){e.preventDefault();const d=new FormData(form),item={id:uid(),name:d.get('name').trim(),quantity:String(d.get('quantity')||''),unit:d.get('unit'),category:d.get('category'),checked:false};mergeListItem(state.list,item);state.list.forEach(x=>{if(x.name===item.name&&x.category===undefined)x.category=item.category;});state.list.forEach(x=>{if(x.name===item.name&&x.category===undefined)x.category=item.category;});await replaceStore('list',state.list);renderList();say('Élément ajouté.');}
  });
  document.addEventListener('click',e=>{if(e.target.id==='home-button')showHome(); if(e.target.dataset.action==='home-close')$('#choice-modal').hidden=true; if(e.target.dataset.action==='cancel-merge')$('#merge-modal').hidden=true; if(e.target.dataset.action==='home-close')$('#choice-modal').hidden=true; if(e.target.dataset.action==='cancel-merge')$('#merge-modal').hidden=true;});
  document.addEventListener('change',e=>{if(e.target.dataset.pick){/* La sélection est lue au moment de valider. */}});
  function installPolish(){const style=document.createElement('style');style.textContent=`:root{--accent:#8E6BD8;--pastel-blue:#5AC8FA;--pastel-violet:#8E6BD8;--pastel-mauve:#F28BB3;--pastel-pink:#F28BB3;--counter-pink:#F28BB3;--counter-blue:#5AC8FA}.sticky-count{position:sticky;top:70px;z-index:6;justify-content:flex-end;pointer-events:none}.meal-counter.is-pending{color:#F28BB3;background:rgba(242,139,179,.14);border:1px solid rgba(242,139,179,.48);box-shadow:0 3px 12px rgba(242,139,179,.16)}.meal-counter.is-complete{color:#168fc0;background:rgba(90,200,250,.16);border:1px solid rgba(90,200,250,.52);box-shadow:0 3px 12px rgba(90,200,250,.18)}.choice[data-action=choose-recipes]{color:#8E6BD8}.choice[data-action=choose-categories]{color:#8E8E93}.pdf-name{color:#8E6BD8}.people-choice{display:inline-flex;align-items:center;gap:6px}.people-choice input{width:62px;border:1px solid var(--line);border-radius:8px;padding:6px}.picker-row button:disabled{opacity:.35;cursor:not-allowed}.category-card{transition:transform .22s cubic-bezier(.2,.8,.2,1),box-shadow .22s ease}.button{background:rgba(142,107,216,.13);box-shadow:0 3px 10px rgba(142,107,216,.12)}.button.secondary,.choice.secondary,.day{background:rgba(90,200,250,.18)}.choice{background:rgba(142,107,216,.14)}.day.selected{background:rgba(142,107,216,.28)}.chips span,.modal-close{background:rgba(242,139,179,.18)}.category-card{border-top-color:rgba(242,139,179,.62)}.inline-form button{background:rgba(242,139,179,.18)}.group h2,.list-group h2{border-left-color:rgba(142,107,216,.72)}`;document.head.appendChild(style);const recipes=$('[data-action=choose-recipes]'),cats=$('[data-action=choose-categories]');if(recipes){const arrow=recipes.querySelector('span');recipes.firstChild.nodeValue='Par jours de la semaine ';if(arrow)recipes.appendChild(arrow);}if(cats){const arrow=cats.querySelector('span');cats.firstChild.nodeValue='Choisir manuellement ';if(arrow)cats.appendChild(arrow);}}
  async function start(){installPolish();try{db=await openDB();await load();setTab('list');showHome();}catch(err){console.error('IndexedDB indisponible',err);say('Stockage local indisponible sur cet appareil.');}}
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
  start();
  if(typeof module!=='undefined')module.exports={validateCSV,parseCSV,mergeListItem,displayQty,recipeSignature,reconcileRecipes,norm,mealsCounts,selectedMealCounts,scale,canonicalUnit};
})();
