/* Courses — PWA locale : recettes, catégories, fiches PDF et liste, sans service distant. */
(() => {
  'use strict';
  const DEFAULT_CATEGORIES = ['Sodas & alcools','Épicerie sucrée','Produits secs','Frais','Viandes et poissons','Fruits et légumes','Rayon BIO',"Produits d'entretien",'Hygiène','Surgelés','Épicerie asiatique','Pharmacie Lafayette'];
  const CSV_COLUMNS = ['recette','moment','ingredient','quantite','unite','categorie','ordre'];
  const SERVINGS_COLUMN = 'repas';
  let recipeGroupOpen = {};
  const MOMENTS = ['matin','midi','gouter','soir'];
  const canonicalMoment = value => { const m=norm(value).replace(/\s+/g,' '); return ['gouter et dessert','gouter/dessert','gouter dessert'].includes(m)?'gouter':m; };
  const UNITES = ['','g','kg','ml','l','u','cas','cac'];
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('fr');
  const ingredientKey = (category, name) => `${norm(category)}|${norm(name)}`;
  const isIngredientSuppressed = (suppressed, category, name) => !!suppressed?.[ingredientKey(category, name)];
  const uid = () => (globalThis.crypto?.randomUUID?.() || `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`);
  const qtyNum = value => { const s=String(value ?? '').trim().replace(',','.'); return s && Number.isFinite(Number(s)) ? Number(s) : null; };
  const fmt = n => Number(n.toFixed(2)).toLocaleString('fr-FR',{maximumFractionDigits:2});
  function parseCSV(text) {
    text=String(text??'').replace(/^\uFEFF/,'');
    const first=(text.split(/\r?\n/,1)[0]||'');
    const sep=(first.split(';').length > first.split(',').length-0) ? ';' : ',';
    const rows=[]; let row=[], cell='', quoted=false;
    for(let i=0;i<text.length;i++){const c=text[i]; if(quoted){if(c==='"'&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"')quoted=false;else cell+=c;}else if(c==='"')quoted=true;else if(c===sep){row.push(cell);cell='';}else if(c==='\n'){row.push(cell.replace(/\r$/,''));rows.push(row);row=[];cell='';}else cell+=c;}
    if(cell.length||row.length){row.push(cell.replace(/\r$/,''));rows.push(row);}
    return {separator:sep, rows};
  }
  function validateCSV(text) {
    const {rows}=parseCSV(text); const errors=[];
    if(!rows.length) return {errors:['Le fichier est vide.'], recipes:[]};
    const headers=rows[0].map(x=>x.trim().toLocaleLowerCase('fr'));
    const missing=CSV_COLUMNS.filter(c=>!headers.includes(c));
    if(missing.length) return {errors:[`En-tête invalide : colonne(s) manquante(s) ${missing.join(', ')}.`],recipes:[]};
    const ix=Object.fromEntries(CSV_COLUMNS.map(c=>[c,headers.indexOf(c)])); const valid=[];
    rows.slice(1).forEach((r,index)=>{const line=index+2; if(r.every(c=>!String(c??'').trim())){errors.push(`Ligne ${line} : ligne vide.`);return;}
      const v=Object.fromEntries(CSV_COLUMNS.map(c=>[c,String(r[ix[c]]??'').trim()]));
      const servingsIx=headers.indexOf(SERVINGS_COLUMN), servingsRaw=servingsIx>=0?String(r[servingsIx]??'').trim():'';
      const servings=servingsRaw?qtyNum(servingsRaw):1;
      const fail=m=>errors.push(`Ligne ${line} : ${m}`);
      if(!v.recette) fail('nom de recette manquant.');
      if(!v.ingredient) fail('nom d’ingrédient manquant.');
      if(!v.categorie) fail('catégorie vide.');
      const moments=v.moment.split('|').map(canonicalMoment);
      if(!v.moment||moments.some(m=>!MOMENTS.includes(m))) fail(`moment invalide (« ${v.moment} »). Valeurs admises : matin, midi, gouter, soir.`);
      if(v.quantite && qtyNum(v.quantite)===null) fail(`quantité non numérique (« ${v.quantite} »).`);
      if(servings===null||servings<1) fail(`nombre de personnes invalide (« ${servingsRaw} »).`);
      const unit=norm(v.unite); if(!UNITES.includes(unit)) fail(`unité invalide (« ${v.unite} »).`);
      if(!errors.some(e=>e.startsWith(`Ligne ${line} :`))) valid.push({...v,servings,moments:[...new Set(moments)],quantity:v.quantite.replace('.',',')});
    });
    if(rows.length<2) errors.push('Le fichier ne contient aucune ligne de données.');
    if(errors.length) return {errors,recipes:[]};
    const map=new Map(); valid.forEach(v=>{let key=norm(v.recette), r=map.get(key); if(!r){r={name:v.recette,moments:v.moments,servings:v.servings,ingredients:[]};map.set(key,r);}else v.moments.forEach(m=>{if(!r.moments.includes(m))r.moments.push(m);});r.ingredients.push({name:v.ingredient,quantity:v.quantity,unit:norm(v.unite),category:v.categorie,order:qtyNum(v.ordre)??r.ingredients.length});});
    return {errors:[],recipes:[...map.values()].map(r=>({...r,ingredients:r.ingredients.sort((a,b)=>a.order-b.order).map(({order,...i})=>i)}))};
  }
  function recipeSignature(r){return JSON.stringify({moments:[...(r.moments||[])].sort(),servings:recipeServings(r),ingredients:(r.ingredients||[]).map(i=>[norm(i.name),String(i.quantity??''),norm(i.unit),norm(i.category)])});}
  function reconcileRecipes(existing,incoming){const next=existing.map(r=>({...r,ingredients:(r.ingredients||[]).map(i=>({...i})),moments:[...(r.moments||[])]}));let added=0,updated=0,unchanged=0;for(const fresh of incoming){const old=next.find(r=>norm(r.name)===norm(fresh.name));if(!old){next.push({...fresh,id:fresh.id||uid()});added++;}else if(recipeSignature(old)!==recipeSignature(fresh)){Object.assign(old,fresh);updated++;}else unchanged++;}return {recipes:next,added,updated,unchanged};}
  function canonicalUnit(unit){const u=norm(unit);return ['kg','g'].includes(u)?'g':['l','ml'].includes(u)?'ml':u;}
  function recipeServings(recipe){const n=qtyNum(recipe?.servings);return n!==null&&n>=1?n:1;}
  function adjustQuantity(quantity,people,servings=1){const value=qtyNum(quantity);return value===null?String(quantity||''):String(value*Number(people||1)/Math.max(1,Number(servings)||1)).replace('.',',');}
  function mergeListItem(list, source, multiplier=1) {
    const name=String(source.name||'').trim();if(!name)return;
    let unit=norm(source.unit), q=qtyNum(source.quantity);
    if(['cas','cac'].includes(unit)||!unit)q=null;
    const value=q===null?'':String(q*multiplier), category=String(source.category||'');
    const found=list.find(x=>norm(x.name)===norm(name)&&norm(x.unit)===unit&&norm(x.category)===norm(category));
    if(found){if(value!=='') found.quantity=String((qtyNum(found.quantity)||0)+(Number(value)||0));return;}
    list.push({id:uid(),name,quantity:value,unit,category,checked:false});
  }
  function finalizeShoppingList(list){list.forEach(x=>{const q=qtyNum(x.quantity);if(q===null)return;if(x.unit==='u')x.quantity=String(Math.ceil(q-1e-10));});return list;}
  function mealTotals(daysMap, peopleMap, planned={}){let midi=0,soir=0,selectedMidi=0,selectedSoir=0;daysMap.forEach((options,date)=>['midi','soir'].forEach(meal=>{if(!options[meal])return;if(meal==='midi'){midi++;if(planned[`${date}|${meal}`])selectedMidi++;}else{soir++;if(planned[`${date}|${meal}`])selectedSoir++;}}));return {midi,soir,selectedMidi,selectedSoir};}
  function countSelections(plan, meal){return Object.entries(plan||{}).reduce((n,[key,value])=>{const count=Math.max(0,Number(value)||0);if(!count)return n;try{return JSON.parse(key)[0]===meal?n+count:n;}catch{return n;}},0);}
  function planKey(meal,people,recipeId){return JSON.stringify([meal,Math.max(1,Number(people)||1),recipeId]);}
  function scaleRecipeIngredients(recipe,people=recipeServings(recipe),times=1){const count=Math.max(1,Number(times)||1);return (recipe.ingredients||[]).map(i=>({...i,quantity:adjustQuantity(i.quantity,Number(people||1)*count,recipeServings(recipe))}));}
  function recipePickerMarkup(recipes,daysMap,peopleMap,planned={},extras={}){
    const totals=mealTotals(daysMap,peopleMap,{}),m=countSelections(planned,'midi'),s=countSelections(planned,'soir');
    const counter=(r,key,count)=>`<div class="recipe-counter"><button type="button" data-action="recipe-count" data-key="${esc(key)}" data-delta="-1" aria-label="Diminuer ${esc(r.name)}">−</button><b>${count}</b><button type="button" data-action="recipe-count" data-key="${esc(key)}" data-delta="1" aria-label="Augmenter ${esc(r.name)}">＋</button></div>`;
    const recipeRow=(r,key,count)=>`<div class="recipe-choice-row"><span>${esc(r.name)}</span>${counter(r,key,count)}</div>`;
    const momentList=(moment,title)=>{const list=recipes.filter(r=>(r.moments||[]).includes(moment));return `<section class="group recipe-moment"><h2>${title}</h2>${list.length?list.map(r=>{const k=JSON.stringify([moment,r.id]);return recipeRow(r,k,Number(extras[k])||0);}).join(''):'<p class="muted">Aucune recette pour ce moment.</p>'}</section>`;};
    const meals=['midi','soir'].map(meal=>{
      const groups=new Map();daysMap.forEach((options,date)=>{if(options[meal]){const n=slotPeopleFrom(peopleMap,date,meal);if(!groups.has(n))groups.set(n,[]);groups.get(n).push(date);}});
      const rs=recipes.filter(r=>(r.moments||[]).includes(meal));
      const html=[...groups.entries()].sort((a,b)=>a[0]-b[0]).map(([n,dates])=>{
        const list=rs.length?rs.map(r=>{const k=planKey(meal,n,r.id);return recipeRow(r,k,Number(planned[k])||0);}).join(''):'<p class="muted">Aucune recette pour ce moment.</p>';
        if(n===1)return `<div class="recipe-group recipe-group-one"><div class="recipe-checklist">${list}</div></div>`;
        const groupKey=`${meal}|${n}`,open=recipeGroupOpen[groupKey]===true;
        return `<details class="recipe-group" data-recipe-group="${groupKey}" ${open?'open':''}><summary>${n} personnes <span class="muted">· ${dates.length} repas</span></summary><div class="recipe-checklist">${list}</div></details>`;
      }).join('');
      return `<section class="group recipe-moment"><h2>${meal==='midi'?'Midi':'Soir'}</h2>${html||'<p class="muted">Aucun repas sélectionné au calendrier.</p>'}</section>`;
    }).join('');
    return `<div class="sticky-count">${totals.midi?`<b class="${m>=totals.midi?'goal-met':'goal-open'}">midi : ${m}/${totals.midi}</b>`:''}${totals.soir?`<b class="${s>=totals.soir?'goal-met':'goal-open'}">soir : ${s}/${totals.soir}</b>`:''}</div>${momentList('matin','Matin')}${meals}${momentList('gouter','Goûter et dessert')}`;
  }
  function slotPeopleFrom(peopleMap,date,meal){const n=Number(peopleMap?.[`${date}|${meal}`]);return Number.isFinite(n)&&n>=1?Math.floor(n):1;}
  function shoppingEntries(recipes,plan={},extras={}){const entries=[];for(const [key,selected] of Object.entries(plan)){const times=Math.max(0,Number(selected)||0);if(!times)continue;let meal,people,recipeId;try{[meal,people,recipeId]=JSON.parse(key);}catch{continue;}const recipe=recipes.find(r=>r.id===recipeId);if(recipe)scaleRecipeIngredients(recipe,people,times).forEach(i=>entries.push({...i}));}for(const [key,selected] of Object.entries(extras)){const times=Math.max(0,Number(selected)||0);if(!times)continue;let moment,recipeId;try{[moment,recipeId]=JSON.parse(key);}catch{continue;}const recipe=recipes.find(r=>r.id===recipeId);if(recipe)scaleRecipeIngredients(recipe,recipeServings(recipe),times).forEach(i=>entries.push({...i}));}return entries;}
  function displayQty(item){let q=qtyNum(item.quantity);if(q===null)return '';let u=item.unit;if(u==='u')q=Math.ceil(q-1e-10);if(u==='g'&&q>=1000){q/=1000;u='kg';}else if(u==='ml'&&q>=1000){q/=1000;u='l';}return `${fmt(q)}${u?` ${u}`:''}`;}

  if(typeof document==='undefined'){
    if(typeof module!=='undefined')module.exports={DEFAULT_CATEGORIES,CSV_COLUMNS,parseCSV,validateCSV,canonicalMoment,recipeSignature,reconcileRecipes,mergeListItem,displayQty,norm,qtyNum,recipeServings,mealTotals,finalizeShoppingList,adjustQuantity,countSelections,planKey,scaleRecipeIngredients,shoppingEntries,recipePickerMarkup,ingredientKey,isIngredientSuppressed};
    return;
  }
  const view=$('#view'), toast=$('#toast'); let db, state={recipes:[],categories:[],pdfs:[],list:[]}, tab='list', modalOpen=false, workflow=null, monthCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1), days=new Map(), selectedCounts={}, plannedMeals={}, peopleBySlot={}, reviewEntries=[], reviewChecks={}, recipeChecked={};
  try{recipeChecked=JSON.parse(localStorage.getItem('courses-week-recipes-checked-v1')||'{}')||{};}catch{recipeChecked={};}
  try{const savedDays=JSON.parse(localStorage.getItem('courses-week-days-v1')||'[]');if(Array.isArray(savedDays))days=new Map(savedDays);}catch{}
  try{plannedMeals=JSON.parse(localStorage.getItem('courses-week-plan-v1')||'{}')||{};selectedCounts=JSON.parse(localStorage.getItem('courses-week-extras-v1')||'{}')||{};}catch{plannedMeals={};selectedCounts={};}
  function saveWeekPlan(){try{localStorage.setItem('courses-week-days-v1',JSON.stringify([...days]));localStorage.setItem('courses-week-plan-v1',JSON.stringify(plannedMeals));localStorage.setItem('courses-week-extras-v1',JSON.stringify(selectedCounts));}catch{}}
  let suppressedIngredients={};
  try{suppressedIngredients=JSON.parse(localStorage.getItem('courses-suppressed-ingredients-v1')||'{}')||{};}catch{suppressedIngredients={};}
  function saveSuppressedIngredients(){try{localStorage.setItem('courses-suppressed-ingredients-v1',JSON.stringify(suppressedIngredients));}catch{say('Impossible d’enregistrer la suppression sur cet appareil.');}}
  function isSuppressedCatalogIngredient(category,name){const cat=state.categories.find(c=>c.id===category)||state.categories.find(c=>norm(c.name)===norm(category));return isIngredientSuppressed(suppressedIngredients,cat?.name||category,name);}
  try{peopleBySlot=JSON.parse(localStorage.getItem('courses-meal-people-v1')||'{}')||{};}catch{peopleBySlot={};}
  const dbReq=(req)=>new Promise((resolve,reject)=>{req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
  function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open('courses-local-v1',1);req.onupgradeneeded=()=>{const d=req.result;for(const n of ['recipes','categories','pdfs','list'])if(!d.objectStoreNames.contains(n))d.createObjectStore(n,{keyPath:'id'});};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});}
  async function all(store){return dbReq(db.transaction(store,'readonly').objectStore(store).getAll());}
  async function put(store,item){return dbReq(db.transaction(store,'readwrite').objectStore(store).put(item));}
  async function del(store,id){return dbReq(db.transaction(store,'readwrite').objectStore(store).delete(id));}
  async function replaceStore(store,items){return new Promise((resolve,reject)=>{const tx=db.transaction(store,'readwrite'),os=tx.objectStore(store);os.clear();items.forEach(i=>os.put(i));tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});}
  async function load(){[state.recipes,state.categories,state.pdfs,state.list]=await Promise.all(['recipes','categories','pdfs','list'].map(all));if(!state.categories.length){state.categories=DEFAULT_CATEGORIES.map((name,order)=>({id:uid(),name,order,ingredients:[]}));await replaceStore('categories',state.categories);}state.categories.sort((a,b)=>a.order-b.order);}
  function say(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),3000);}
  function saveWindowScroll(){return {left:window.scrollX,top:window.scrollY};}
  function page(title,subtitle,html,scrollPosition=null){const keepScroll=!!workflow&&['calendar','recipes','review'].includes(workflow.screen),restorePosition=scrollPosition||(keepScroll?saveWindowScroll():null);document.body.classList.toggle('workflow-active',keepScroll);const nav=keepScroll?'<div class="workflow-nav"><button type="button" data-action="workflow-back" aria-label="Retour">‹</button><button type="button" data-action="workflow-close" aria-label="Fermer le parcours">✕</button></div>':'';view.innerHTML=`<header class="page-head${keepScroll?' workflow-head':''}">${nav}${subtitle?`<p>${esc(subtitle)}</p>`:''}<h1>${esc(title)}</h1></header>${html}`;if(restorePosition)window.scrollTo({left:restorePosition.left,top:restorePosition.top,behavior:'instant'});else window.scrollTo(0,0);}
  function button(action,text,cls=''){return `<button class="button ${cls}" data-action="${action}">${text}</button>`;}
  function categoryName(id){return state.categories.find(c=>c.id===id)?.name||id||'Sans catégorie';}
  function renderImport(){page('Importer','RECETTES · CSV',`<section class="group"><label class="file-pick">Choisir un fichier CSV<input type="file" id="csv-file" accept=".csv,text/csv"></label><details class="csv-help"><summary>En savoir plus</summary><p class="hint">CSV UTF‑8 avec les colonnes recette,moment,ingredient,quantite,unite,categorie,ordre. La colonne facultative « repas » indique le nombre de personnes prévu (défaut : 1). Virgule ou point-virgule accepté. L’import est validé en entier avant toute modification.</p></details></section><section class="group"><h2>Mes recettes <span class="muted">${state.recipes.length}</span></h2>${state.recipes.length?state.recipes.map(r=>`<details class="recipe-entry"><summary><b>${esc(r.name)}</b><small>${(r.moments||[]).map(esc).join(' · ')} · ${r.ingredients.length} ingrédients</small><button class="text-button" data-action="delete-recipe" data-id="${esc(r.id)}" aria-label="Supprimer">Supprimer</button></summary><div>${r.ingredients.map(i=>`<p>${esc(i.name)} <span class="muted">${esc([i.quantity,i.unit,categoryName(i.category)].filter(Boolean).join(' · '))}</span></p>`).join('')}</div></details>`).join(''):'<p class="muted">Aucune recette importée.</p>'}</section><section class="group">${button('export-csv','Exporter des recettes','outline-violet')}</section>`);}
  function renderCategories(scrollPosition=null){page('Catégories','ORGANISATION',`<section class="group category-list">${state.categories.map((c,i)=>`<article class="category-card" data-category-id="${esc(c.id)}"><div class="cat-head"><h2 class="category-title"><span class="drag-grip" aria-hidden="true">⠿</span>${esc(c.name)}</h2><div class="category-actions"><button type="button" class="category-action-btn" data-action="add-cat-ingredient" data-id="${esc(c.id)}">Ajouter</button><button type="button" class="category-action-btn" data-action="rename-cat" data-id="${esc(c.id)}">Renommer</button><button type="button" class="category-action-btn" data-action="delete-cat" data-id="${esc(c.id)}">Supprimer</button></div></div><div class="chips">${c.ingredients.map(x=>`<span class="ingredient-chip"><span>${esc(x)}</span><button class="ingredient-delete" type="button" data-action="delete-ingredient" data-id="${esc(c.id)}" data-ingredient="${esc(x)}" aria-label="Supprimer ${esc(x)}" title="Supprimer ${esc(x)}">×</button></span>`).join('')||'<span class="muted">Aucun ingrédient</span>'}</div><form class="inline-form category-ingredient-form" data-form="catalog" data-id="${esc(c.id)}" hidden><input name="name" placeholder="Ajouter un ingrédient" required aria-label="Ajouter un ingrédient dans ${esc(c.name)}"></form></article>`).join('')}</section><p class="hint reorder-hint">Maintenez une catégorie environ une demi-seconde, puis faites-la glisser pour la déplacer.</p><form class="group inline-form" data-form="new-cat"><input name="name" placeholder="Nouvelle catégorie" required><button class="button">Ajouter</button></form>`,scrollPosition);}
  function pdfDisplayName(name){return String(name||'').replace(/\.pdf$/i,'');}
  function renderPdfs(){const sortedPdfs=[...state.pdfs].sort((a,b)=>pdfDisplayName(a.name).localeCompare(pdfDisplayName(b.name),'fr',{sensitivity:'base'}));page('Fiches','DOCUMENTS · STOCKAGE LOCAL',`<section class="group"><label class="file-pick">Importer un ou plusieurs PDF<input id="pdf-file" type="file" accept="application/pdf,.pdf" multiple></label><p class="hint">Les fichiers sont stockés localement dans IndexedDB.</p></section><section class="pdf-list">${sortedPdfs.length?sortedPdfs.map(f=>`<article class="pdf-card" data-pdf-row="${esc(f.id)}" data-action="open-pdf" data-id="${esc(f.id)}" role="button" tabindex="0" aria-label="Ouvrir ${esc(pdfDisplayName(f.name))}"><span class="pdf-name">${esc(pdfDisplayName(f.name))}</span><button class="pdf-icon-button" data-action="rename-pdf" data-id="${esc(f.id)}" aria-label="Renommer ${esc(pdfDisplayName(f.name))}" title="Renommer">✎</button><button class="pdf-icon-button pdf-cross" data-action="delete-pdf" data-id="${esc(f.id)}" aria-label="Supprimer ${esc(pdfDisplayName(f.name))}" title="Supprimer">✕</button></article>`).join(''):'<section class="group empty-state"><b>Aucune fiche PDF</b><p>Importez vos documents pour les retrouver ici.</p></section>'}</section>`);}
  function groupedList(){const map=new Map();state.list.forEach(x=>{const k=norm(x.name);if(!map.has(k))map.set(k,[]);map.get(k).push(x);});return map;}
  function renderList(scrollPosition=null){const grouped=groupedList();let body='';state.categories.forEach(cat=>{const items=state.list.filter(i=>i.category===cat.id);if(!items.length)return;body+=`<section class="list-group"><h2>${esc(cat.name)}</h2>${items.map(i=>`<div class="shopping-row ${i.checked?'checked':''}"><input type="checkbox" data-action="toggle" data-id="${esc(i.id)}" ${i.checked?'checked':''} aria-label="Cocher ${esc(i.name)}"><span>${esc(i.name)}</span><small>${esc(displayQty(i))}</small></div>`).join('')}</section>`;});
    const uncategorized=state.list.filter(i=>!state.categories.some(c=>c.id===i.category));if(uncategorized.length)body+=`<section class="list-group"><h2>Autres</h2>${uncategorized.map(i=>`<div class="shopping-row ${i.checked?'checked':''}"><input type="checkbox" data-action="toggle" data-id="${esc(i.id)}" ${i.checked?'checked':''} aria-label="Cocher ${esc(i.name)}"><span>${esc(i.name)}</span><small>${esc(displayQty(i))}</small></div>`).join('')}</section>`;
    page('Courses','VOTRE LISTE',`<div class="list-actions">${button('add-manual','Ajouter un élément','primary')}${button('generate','Composer la liste','secondary')}${button('reset','Supprimer la liste','danger')}</div>${state.list.length?body:'<section class="group empty-state"><b>Votre liste est vide</b><p>Ajoutez un article ou composez votre prochaine liste.</p></section>'}<form id="manual-form" class="group manual-form" hidden><h2>Ajouter un élément</h2><input name="name" placeholder="Nom" required><input name="quantity" placeholder="Quantité" inputmode="decimal"><select name="unit"><option value="">Sans unité</option>${UNITES.filter(Boolean).map(u=>`<option>${u}</option>`).join('')}</select><select name="category">${state.categories.map(c=>`<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}</select><div class="manual-form-actions"><button type="submit" class="button primary">Ajouter</button><button type="button" class="button secondary" data-action="cancel-manual">Annuler</button></div></form>`,scrollPosition);}
  function setTab(which){tab=which;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===which));({import:renderImport,cats:renderCategories,pdf:renderPdfs,list:renderList,recipes:renderRecipesTab}[which]||renderList)();}
  function showHome(){modalOpen=true;$('#home-modal').hidden=false;}
  function hideHome(){modalOpen=false;$('#home-modal').hidden=true;}
  function slotKey(date,meal){return `${date}|${meal}`;}
  function slotPeople(date,meal){const n=Number(peopleBySlot[slotKey(date,meal)]);return Number.isFinite(n)&&n>=1?Math.floor(n):1;}
  function savePeople(){try{localStorage.setItem('courses-meal-people-v1',JSON.stringify(peopleBySlot));}catch{}}
  function cleanupMealPlan(date,meal){const people=slotPeople(date,meal),stillScheduled=[...days.entries()].some(([d,opt])=>d!==date&&opt[meal]&&slotPeople(d,meal)===people);if(stillScheduled)return;for(const key of Object.keys(plannedMeals)){try{const [m,n]=JSON.parse(key);if(m===meal&&Number(n)===people)delete plannedMeals[key];}catch{}}}
  function renderCalendar(){const year=monthCursor.getFullYear(),month=monthCursor.getMonth(),first=new Date(year,month,1),offset=(first.getDay()+6)%7,daysIn=new Date(year,month+1,0).getDate(),today=new Date();today.setHours(0,0,0,0);let cells='';for(let i=0;i<offset;i++)cells+='<span class="blank"></span>';for(let d=1;d<=daysIn;d++){const date=new Date(year,month,d),key=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,past=date<today;cells+=`<button class="day ${past?'past':''} ${days.has(key)?'selected':''}" data-action="day" data-date="${key}" ${past?'disabled':''}>${d}</button>`;}
    page('Choisir les jours','',`<section class="group"><div class="calendar-head"><button data-action="month" data-delta="-1">‹</button><b>${monthCursor.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</b><button data-action="month" data-delta="1">›</button></div><div class="calendar-grid">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}${cells}</div><div id="day-options">${[...days].map(([date,opt])=>`<div class="day-options"><b>${new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</b>${['midi','soir'].map(meal=>`<div class="meal-option"><label><input type="checkbox" data-meal="${meal}" data-date="${date}" ${opt[meal]?'checked':''}> ${meal==='midi'?'Midi':'Soir'}</label>${opt[meal]?`<div class="person-counter"><span>Personnes</span><button data-action="people" data-date="${date}" data-meal="${meal}" data-delta="-1" aria-label="Diminuer">−</button><b>${slotPeople(date,meal)}</b><button data-action="people" data-date="${date}" data-meal="${meal}" data-delta="1" aria-label="Augmenter">＋</button></div>`:''}</div>`).join('')}<button data-action="un-day" data-date="${date}">Retirer</button></div>`).join('')}</div></section><div class="form-actions workflow-actions">${button('skip-calendar','Passer','secondary')}${button('calendar-next','Continuer','primary')}</div>`);}
  function mealsCounts(){let midi=0,soir=0;days.forEach((d,date)=>{if(d.midi)midi+=slotPeople(date,'midi');if(d.soir)soir+=slotPeople(date,'soir');});return {days:days.size,midi,soir};}
  function renderRecipePicker(scrollPosition=null){document.querySelectorAll('[data-recipe-group]').forEach(el=>{recipeGroupOpen[el.dataset.recipeGroup]=el.open;});page('Choisir les recettes','PAR JOURS DE LA SEMAINE · 2/2',`${recipePickerMarkup(state.recipes,days,peopleBySlot,plannedMeals,selectedCounts)}<div class="form-actions workflow-actions">${button('recipe-ok','OK - Générer les courses','primary')}</div>`,scrollPosition);}
  function weekRangeLabel(){const selected=[...days.keys()].map(k=>new Date(`${k}T12:00:00`)).filter(d=>!Number.isNaN(d.getTime())).sort((a,b)=>a-b);let first,last;if(selected.length){first=selected[0];last=selected[selected.length-1];}else{const now=new Date(),monday=new Date(now);monday.setHours(12,0,0,0);monday.setDate(monday.getDate()-((monday.getDay()+6)%7));first=monday;last=new Date(monday);last.setDate(last.getDate()+4);}const fmtDate=d=>`${d.getDate()}/${d.getMonth()+1}`,fmtDay=d=>d.toLocaleDateString('fr-FR',{weekday:'long'});return `Du ${fmtDay(first)} ${fmtDate(first)} au ${fmtDay(last)} ${fmtDate(last)}`;}
  let generatedWeeks=[];
  try{const saved=JSON.parse(localStorage.getItem('courses-generated-weeks-v1')||'[]');if(Array.isArray(saved))generatedWeeks=saved;}catch{}
  function saveGeneratedWeeks(){try{localStorage.setItem('courses-generated-weeks-v1',JSON.stringify(generatedWeeks));}catch{say('Impossible d’enregistrer l’historique sur cet appareil.');}}
  function buildWeekSnapshot(){
    const label=days.size?weekRangeLabel():null,groups={matin:[],midi:[],gouter:[],soir:[]};
    for(const [key,raw] of Object.entries(plannedMeals)){const count=Math.max(0,Number(raw)||0);if(!count)continue;let meal,people,recipeId;try{[meal,people,recipeId]=JSON.parse(key);}catch{continue;}const r=state.recipes.find(x=>x.id===recipeId);if(r&&groups[meal])for(let i=0;i<count;i++)groups[meal].push({id:uid(),name:r.name,checked:false});}
    for(const [key,raw] of Object.entries(selectedCounts)){const count=Math.max(0,Number(raw)||0);if(!count)continue;let moment,recipeId;try{[moment,recipeId]=JSON.parse(key);}catch{continue;}const r=state.recipes.find(x=>x.id===recipeId);if(r&&groups[moment])for(let i=0;i<count;i++)groups[moment].push({id:uid(),name:r.name,checked:false});}
    return {id:uid(),label,groups};
  }
  function renderRecipesTab(scrollPosition=null){
    const hasRows=generatedWeeks.some(w=>Object.values(w.groups||{}).some(rows=>rows.length));
    if(!hasRows){page('Recettes','VOTRE HISTORIQUE','<section class="recipes-empty-card"><p>Composez vos repas par jour de semaine pour qu’ils apparaissent ici</p></section>',scrollPosition);return;}
    const momentTitles={matin:'Matin',midi:'Midi',gouter:'Goûter',soir:'Soir'};
    const blocks=generatedWeeks.map(week=>{const groups=week.groups||{},sections=Object.keys(momentTitles).map(moment=>{const rows=groups[moment]||[];return rows.length?`<section class="week-moment"><h3>${momentTitles[moment]}</h3>${rows.map(r=>`<label class="week-recipe ${r.checked?'checked':''}"><input type="checkbox" data-week-id="${esc(week.id)}" data-line-id="${esc(r.id)}" ${r.checked?'checked':''}><span><b>${esc(r.name)}</b></span></label>`).join('')}</section>`:''}).join('');return `<article class="generated-week" data-week="${esc(week.id)}">${week.label?`<section class="week-date"><p>${esc(week.label)}</p></section>`:''}<div class="week-controls"><button class="text-button" data-action="delete-week" data-week-id="${esc(week.id)}">Supprimer cette semaine</button></div>${sections}</article>`;}).join('');
    page('Recettes','VOTRE HISTORIQUE',`${blocks}<div class="week-controls all-weeks"><button class="text-button" data-action="delete-weeks">Tout supprimer</button></div>`,scrollPosition);
  }
  function renderRecipeReview(scrollPosition=null){const lines=reviewEntries.map(item=>`<label class="review-row"><input type="checkbox" data-review-item="${esc(item.id)}" ${reviewChecks[item.id]!==false?'checked':''}><span>${esc(item.name)}</span><small>${esc(displayQty(item))}</small></label>`).join('');page('Liste de courses','VÉRIFIER LES INGRÉDIENTS',`<p class="hint">Décochez les ingrédients que vous avez déjà. Seuls les éléments cochés seront ajoutés.</p><section class="group review-list">${lines}</section><div class="form-actions workflow-actions">${button('review-confirm','Générer la liste de courses','primary')}</div>`,scrollPosition);}
  function categoryPicker(){page('Choisir manuellement','COMPOSER LA LISTE',`<div id="category-picker">${state.categories.map(c=>`<section class="group"><h2>${esc(c.name)}</h2>${c.ingredients.map(name=>`<label class="catalogue-pick"><input type="checkbox" data-pick="${esc(c.id)}|${esc(name)}"><span>${esc(name)}</span><input type="number" min="0" step="any" placeholder="Qté" data-pick-qty="${esc(c.id)}|${esc(name)}"><select data-pick-unit="${esc(c.id)}|${esc(name)}"><option value="">—</option>${UNITES.filter(Boolean).map(u=>`<option>${u}</option>`).join('')}</select></label>`).join('')||'<p class="muted">Ajoutez des ingrédients dans Catégories.</p>'}</section>`).join('')}</div><div class="form-actions category-picker-actions">${button('category-ok','OK - Ajouter à l’écran','primary')}</div>`);}
  function showGeneratorChoice(){workflow={screen:'choice',resume:false};$('#choice-modal').hidden=false;}
  async function afterImport(text){const result=validateCSV(text);if(result.errors.length){say(`Import annulé — ${result.errors[0]}`);return;}let added=0,updated=0,unchanged=0;const next=[...state.recipes];
    // Un import CSV valide réinitialise les suppressions manuelles du catalogue.
    suppressedIngredients={};saveSuppressedIngredients();
    // Catalogue alimenté uniquement après validation complète, puis comparaison par contenu cohérent.
    result.recipes.forEach(r=>r.ingredients.forEach(i=>{let cat=state.categories.find(c=>norm(c.name)===norm(i.category));if(!cat){cat={id:uid(),name:i.category,order:state.categories.length,ingredients:[]};state.categories.push(cat);}if(!isIngredientSuppressed(suppressedIngredients,cat.name,i.name)&&!cat.ingredients.some(x=>norm(x)===norm(i.name)))cat.ingredients.push(i.name);i.category=cat.id;}));
    const reconciled=reconcileRecipes(next,result.recipes);added=reconciled.added;updated=reconciled.updated;unchanged=reconciled.unchanged;next.splice(0,next.length,...reconciled.recipes);
    state.recipes=next;await Promise.all([replaceStore('recipes',state.recipes),replaceStore('categories',state.categories)]);renderImport();say(`${added} ajoutée(s), ${updated} mise(s) à jour, ${unchanged} inchangée(s).`);}
  function selectedNewList(entries,mode='append'){if(mode==='replace')state.list=[];entries.forEach(x=>mergeListItem(state.list,x,1));finalizeShoppingList(state.list);replaceStore('list',state.list).then(()=>{setTab('list');say(mode==='replace'?'Liste remplacée.':'Articles ajoutés à la liste.');});}
  function askAppend(entries){if(!state.list.length)return selectedNewList(entries);$('#merge-modal').hidden=false;$('#merge-modal').dataset.payload=JSON.stringify(entries);}

  document.addEventListener('keydown',e=>{const card=e.target.closest('.pdf-card[role=button]');if(card&&e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click();}});
  let suppressPdfClick=false;
  const pdfObjectUrls=new Set();
  document.addEventListener('click',async e=>{if(suppressPdfClick&&e.target.closest('.pdf-card[data-pdf-row]')){e.preventDefault();e.stopImmediatePropagation();suppressPdfClick=false;return;}const tabButton=e.target.closest('[data-tab]');if(tabButton){setTab(tabButton.dataset.tab);return;}const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
    if(a==='home'){showHome();return;} if(a==='home-close'){hideHome();return;}
    if(a==='workflow-back'){if(workflow?.screen==='review'){workflow.screen='recipes';renderRecipePicker();}else if(workflow?.screen==='recipes'){workflow.screen='calendar';renderCalendar();}else if(workflow?.screen==='calendar'){workflow.screen='choice';workflow.resume=true;$('#choice-modal').hidden=false;}else if(workflow?.screen==='choice'){workflow=null;document.body.classList.remove('workflow-active');$('#choice-modal').hidden=true;$('#home-modal').hidden=false;}return;}
    if(a==='workflow-close'){workflow=null;$('#home-modal').hidden=true;$('#choice-modal').hidden=true;$('#merge-modal').hidden=true;setTab(tab);return;}
    if(a==='home-generate'){hideHome();showGeneratorChoice();return;} if(a==='home-open'){hideHome();categoryPicker();return;}
    if(a==='choose-recipes'){ $('#choice-modal').hidden=true;const resume=workflow?.screen==='choice'&&workflow.resume===true;if(!resume){workflow={passed:false,screen:'calendar'};days.clear();selectedCounts={};plannedMeals={};peopleBySlot={};savePeople();saveWeekPlan();recipeGroupOpen={};monthCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);}else workflow.screen='calendar';renderCalendar();return;}
    if(a==='choose-categories'){ $('#choice-modal').hidden=true;categoryPicker();return;}
    if(a==='cancel-merge'){ $('#merge-modal').hidden=true;return;}
    if(a==='merge-add'||a==='merge-replace'){const entries=JSON.parse($('#merge-modal').dataset.payload||'[]');$('#merge-modal').hidden=true;selectedNewList(entries,a==='merge-replace'?'replace':'append');return;}
    if(a==='tab'){setTab(b.dataset.tab);return;}
    if(a==='export-csv'){const lines=[CSV_COLUMNS.concat(SERVINGS_COLUMN).join(',')];state.recipes.forEach(r=>r.ingredients.forEach((i,n)=>{const row=[r.name,(r.moments||[]).join('|'),i.name,i.quantity,i.unit,categoryName(i.category),n+1,recipeServings(r)];lines.push(row.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(','));}));const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='courses-recettes.csv';link.click();URL.revokeObjectURL(url);return;}
    if(a==='delete-week'){const weekId=b.dataset.weekId;if(confirm('Supprimer cette semaine de l’historique ?')){generatedWeeks=generatedWeeks.filter(w=>w.id!==weekId);saveGeneratedWeeks();renderRecipesTab(saveWindowScroll());}return;}
    if(a==='delete-weeks'){if(confirm('Supprimer toutes les semaines de l’historique ?')){generatedWeeks=[];saveGeneratedWeeks();renderRecipesTab(saveWindowScroll());}return;}
    if(a==='delete-recipe'){if(confirm('Supprimer cette recette ?')){state.recipes=state.recipes.filter(r=>r.id!==id);await del('recipes',id);renderImport();}return;}
    if(a==='add-cat-ingredient'){const forms=[...document.querySelectorAll('.category-ingredient-form')];forms.forEach(form=>{if(form.dataset.id!==id)form.hidden=true;});const form=forms.find(item=>item.dataset.id===id);if(form){form.hidden=!form.hidden;if(!form.hidden)form.querySelector('[name=\"name\"]')?.focus();}return;}
    if(a==='rename-cat'){const cat=state.categories.find(c=>c.id===id);if(cat){const name=prompt('Nouveau nom de la catégorie',cat.name)?.trim();if(name&&name!==cat.name){if(state.categories.some(c=>c.id!==id&&norm(c.name)===norm(name)))return say('Cette catégorie existe déjà.');const scrollPosition=saveWindowScroll();cat.name=name;await put('categories',cat);renderCategories(scrollPosition);}}return;}
    if(a==='delete-cat'){if(confirm('Supprimer cette catégorie ?')){const scrollPosition=saveWindowScroll();state.categories=state.categories.filter(c=>c.id!==id);state.categories.forEach((c,i)=>c.order=i);await replaceStore('categories',state.categories);renderCategories(scrollPosition);}return;}
    if(a==='delete-ingredient'){const cat=state.categories.find(c=>c.id===id),name=b.dataset.ingredient;if(cat&&name&&cat.ingredients.some(x=>norm(x)===norm(name))){const scrollPosition=saveWindowScroll();cat.ingredients=cat.ingredients.filter(x=>norm(x)!==norm(name));suppressedIngredients[ingredientKey(cat.name,name)]=true;suppressedIngredients[ingredientKey(cat.id,name)]=true;saveSuppressedIngredients();await put('categories',cat);renderCategories(scrollPosition);say('Ingrédient retiré du catalogue.');}return;}
    if(a==='toggle'){const item=state.list.find(x=>x.id===id);if(item){const scrollPosition=saveWindowScroll();item.checked=b.checked;await put('list',item);renderList(scrollPosition);}return;}
    if(a==='add-manual'){const f=$('#manual-form');f.hidden=!f.hidden;if(!f.hidden){requestAnimationFrame(()=>{f.scrollIntoView({behavior:'smooth',block:'center'});f.querySelector('[name="name"]')?.focus({preventScroll:true});});}return;}
    if(a==='cancel-manual'){const f=$('#manual-form');if(f){f.reset();f.hidden=true;}return;}
    if(a==='reset'){if(confirm('Supprimer la liste de courses ?')){state.list=[];await replaceStore('list',[]);renderList();say('Liste réinitialisée.');}return;}
    if(a==='generate'){showGeneratorChoice();return;}
    if(a==='month'){monthCursor.setMonth(monthCursor.getMonth()+Number(b.dataset.delta));renderCalendar();return;}
    if(a==='day'){const date=b.dataset.date;if(!days.has(date))days.set(date,{midi:false,soir:false});else{days.delete(date);cleanupMealPlan(date,'midi');cleanupMealPlan(date,'soir');}saveWeekPlan();renderCalendar();return;}
    if(a==='people'){const key=slotKey(b.dataset.date,b.dataset.meal);peopleBySlot[key]=Math.max(1,slotPeople(b.dataset.date,b.dataset.meal)+Number(b.dataset.delta));savePeople();renderCalendar();return;}
    if(a==='un-day'){const date=b.dataset.date;days.delete(date);cleanupMealPlan(date,'midi');cleanupMealPlan(date,'soir');saveWeekPlan();renderCalendar();return;}
    if(a==='skip-calendar'){workflow={passed:true,screen:'recipes'};days.clear();plannedMeals={};selectedCounts={};saveWeekPlan();renderRecipePicker();return;}
    if(a==='calendar-next'){workflow={passed:false,screen:'recipes'};saveWeekPlan();renderRecipePicker();return;}
    
    if(a==='recipe-ok'){const entries=shoppingEntries(state.recipes,plannedMeals,selectedCounts).filter(i=>!isSuppressedCatalogIngredient(i.category,i.name)).map(i=>({...i,category:state.categories.find(c=>norm(c.name)===norm(i.category))?.id||i.category||''}));if(!entries.length){say('Choisissez au moins une recette.');return;}reviewEntries=[];entries.forEach(i=>mergeListItem(reviewEntries,i));finalizeShoppingList(reviewEntries);reviewChecks=Object.fromEntries(reviewEntries.map(i=>[i.id,true]));workflow.screen='review';renderRecipeReview();return;}
    if(a==='recipe-count'){let key=b.dataset.key,decoded;try{decoded=JSON.parse(key);}catch{return;}const [moment,people,recipeId]=decoded,delta=Number(b.dataset.delta);if(moment==='midi'||moment==='soir'){key=planKey(moment,people,recipeId);plannedMeals[key]=Math.max(0,(Number(plannedMeals[key])||0)+delta);}else{key=JSON.stringify([moment,people]);selectedCounts[key]=Math.max(0,(Number(selectedCounts[key])||0)+delta);}saveWeekPlan();renderRecipePicker(saveWindowScroll());return;}
    if(a==='review-confirm'){const chosen=reviewEntries.filter(i=>reviewChecks[i.id]!==false);chosen.forEach(i=>mergeListItem(state.list,i));finalizeShoppingList(state.list);await replaceStore('list',state.list);generatedWeeks.push(buildWeekSnapshot());saveGeneratedWeeks();workflow=null;document.body.classList.remove('workflow-active');$('#choice-modal').hidden=true;setTab('list');say('Liste de courses générée.');return;}
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
    if(!dragState)return;const scrollPosition=saveWindowScroll(),d=dragState;clearTimeout(d.timer);dragState=null;
    if(d.raf)cancelAnimationFrame(d.raf);
    if(!d.started)return;
    const list=$('.category-list');if(!list)return;
    flipCategoryCards(list,()=>d.placeholder.replaceWith(d.card));
    d.card.classList.remove('dragging');if(d.originalStyle===null)d.card.removeAttribute('style');else d.card.setAttribute('style',d.originalStyle);
    document.body.classList.remove('category-dragging');list.classList.remove('drag-active');
    const ids=[...list.querySelectorAll('.category-card')].map(x=>x.dataset.categoryId);
    state.categories.sort((a,b)=>ids.indexOf(a.id)-ids.indexOf(b.id));state.categories.forEach((c,i)=>c.order=i);
    await replaceStore('categories',state.categories);setTimeout(()=>{if(tab==='cats')renderCategories(scrollPosition);},220);
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
  
  document.addEventListener('toggle',e=>{const group=e.target.closest?.('[data-recipe-group]');if(group)recipeGroupOpen[group.dataset.recipeGroup]=group.open;},true);
  document.addEventListener('change',async e=>{
    if(e.target.id==='csv-file'){const file=e.target.files[0];if(file)afterImport(await file.text());e.target.value='';}
    if(e.target.id==='pdf-file'){for(const f of e.target.files){const rec={id:uid(),name:pdfDisplayName(f.name),blob:f,type:f.type||'application/pdf'};state.pdfs.push(rec);await put('pdfs',rec);}renderPdfs();say(`${e.target.files.length} fiche(s) ajoutée(s).`);}
    if(e.target.dataset.meal){const d=days.get(e.target.dataset.date);if(d){const meal=e.target.dataset.meal;d[meal]=e.target.checked;if(!e.target.checked)cleanupMealPlan(e.target.dataset.date,meal);saveWeekPlan();renderCalendar();}}
    if(e.target.dataset.recipeChoice){/* Compatibilité pour les anciennes vues en cache. */}
    if(e.target.dataset.weekId&&e.target.dataset.lineId){const week=generatedWeeks.find(w=>w.id===e.target.dataset.weekId),rows=week?.groups&&Object.values(week.groups).flat(),line=rows?.find(r=>r.id===e.target.dataset.lineId);if(line){line.checked=e.target.checked;saveGeneratedWeeks();}renderRecipesTab(saveWindowScroll());}
    if(e.target.dataset.reviewItem){reviewChecks[e.target.dataset.reviewItem]=e.target.checked;renderRecipeReview(saveWindowScroll());}
  });
  document.addEventListener('submit',async e=>{const form=e.target;if(form.dataset.form==='new-cat'){e.preventDefault();const scrollPosition=saveWindowScroll(),name=new FormData(form).get('name').trim();if(state.categories.some(c=>norm(c.name)===norm(name)))return say('Cette catégorie existe déjà.');state.categories.push({id:uid(),name,order:state.categories.length,ingredients:[]});await replaceStore('categories',state.categories);renderCategories(scrollPosition);return;}
    if(form.dataset.form==='catalog'){e.preventDefault();const cat=state.categories.find(c=>c.id===form.dataset.id),input=form.elements.namedItem('name'),name=input.value.trim();if(!cat||!name)return;if(cat.ingredients.some(x=>norm(x)===norm(name))){say('Cet ingrédient existe déjà.');input.focus();return;}cat.ingredients.push(name);delete suppressedIngredients[ingredientKey(cat.name,name)];delete suppressedIngredients[ingredientKey(cat.id,name)];saveSuppressedIngredients();await put('categories',cat);const chips=form.closest('.category-card').querySelector('.chips');chips.innerHTML=cat.ingredients.map(x=>`<span class="ingredient-chip"><span>${esc(x)}</span><button class="ingredient-delete" type="button" data-action="delete-ingredient" data-id="${esc(cat.id)}" data-ingredient="${esc(x)}" aria-label="Supprimer ${esc(x)}" title="Supprimer ${esc(x)}">×</button></span>`).join('');input.value='';input.focus();return;}
    if(form.id==='manual-form'){e.preventDefault();const scrollPosition=saveWindowScroll(),d=new FormData(form),item={id:uid(),name:d.get('name').trim(),quantity:String(d.get('quantity')||''),unit:d.get('unit'),category:d.get('category'),checked:false};mergeListItem(state.list,item);await replaceStore('list',state.list);renderList(scrollPosition);say('Élément ajouté.');}
  });
  document.addEventListener('click',e=>{if(e.target.id==='home-button')showHome(); if(e.target.dataset.action==='home-close')$('#choice-modal').hidden=true; if(e.target.dataset.action==='cancel-merge')$('#merge-modal').hidden=true; if(e.target.dataset.action==='home-close')$('#choice-modal').hidden=true; if(e.target.dataset.action==='cancel-merge')$('#merge-modal').hidden=true;});
  document.addEventListener('change',e=>{if(e.target.dataset.pick){/* La sélection est lue au moment de valider. */}});
  async function start(){try{db=await openDB();await load();setTab('list');showHome();}catch(err){console.error('IndexedDB indisponible',err);say('Stockage local indisponible sur cet appareil.');}}
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
  start();
  if(typeof module!=='undefined')module.exports={validateCSV,parseCSV,canonicalMoment,mergeListItem,displayQty,recipeSignature,reconcileRecipes,norm,mealsCounts,mealTotals,recipeServings,finalizeShoppingList,adjustQuantity,countSelections,planKey,scaleRecipeIngredients,shoppingEntries,recipePickerMarkup,ingredientKey,isIngredientSuppressed};
})();
