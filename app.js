/* Courses — PWA locale : recettes, catégories, fiches PDF et liste, sans service distant. */
(() => {
  'use strict';
  const DEFAULT_CATEGORIES = ['Sodas & alcools','Épicerie sucrée','Produits secs','Frais','Viandes et poissons','Fruits et légumes','Rayon BIO',"Produits d'entretien",'Hygiène','Surgelés','Épicerie asiatique','Pharmacie Lafayette'];
  const STORE_FILTERS = {
    'Auchan St Cyprien':['Fruits et légumes','Viandes & poissons','Hygiène',"Produits d'entretien",'Rayon asiatique','Épicerie sucrée','Produits secs','Rayon BIO','Sodas & alcools','Frais','Surgelés'],
    'Auchan Balma':['Sodas & alcools','Épicerie sucrée','Produits secs','Frais','Viandes & poissons','Fruits et légumes','Rayon asiatique',"Produits d'entretien",'Hygiène','Rayon BIO','Surgelés'],
    'Intermarché':['Fruits et légumes','Sodas & alcools','Viandes & poissons','Frais','Surgelés','Hygiène',"Produits d'entretien",'Épicerie sucrée','Rayon asiatique','Produits secs'],
    'Épicerie asiatique':['Sauce','Autres'],
    'Pharmacie Lafayette':['Hygiène','Autres produits']
  };
  const CSV_COLUMNS = ['recette','moment','ingredient','quantite','unite','categorie','ordre'];
  const SERVINGS_COLUMN = 'repas';
  let recipeGroupOpen = {};
  const MOMENTS = ['matin','midi','gouter','soir'];
  const canonicalMoment = value => { const m=norm(value).replace(/\s+/g,' '); return ['gouter et dessert','gouter/dessert','gouter dessert'].includes(m)?'gouter':m; };
  const UNITES = ['','g','kg','ml','l','u','cas','cac'];
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('fr');
  const hasUppercaseLetter = value => /\p{Lu}/u.test(String(value ?? ''));
  const isCatalogIngredientValid = value => /^[\p{Ll}\p{M} '\-’]+$/u.test(String(value ?? '').trim());
  const ingredientKey = (category, name) => `${norm(category)}|${norm(name)}`;
  const isIngredientSuppressed = (suppressed, category, name) => !!suppressed?.[ingredientKey(category, name)];
  const storeCategoryKey = name => {let key=norm(name).replace(/\s+et\s+/g,' & ').replace(/\s*&\s*/g,' & ').replace(/\s+/g,' ').trim();if(key==='epicerie asiatique'||key==='rayon asiatique')key='rayon asiatique';return key;};
  const splitCategories = value => [...new Set((Array.isArray(value)?value:String(value??'').split('|')).map(x=>String(x??'').trim()).filter(Boolean))];
  const itemCategoryIds = item => splitCategories(item?.categories?.length?item.categories:item?.category);
  const showEmptyStoreCategories = store => ['Épicerie asiatique','Pharmacie Lafayette'].includes(store);
  function hiddenIngredientNames(items,isVisible){const hidden=new Map(),visible=new Set();items.forEach(item=>{const key=norm(item?.name),name=String(item?.name??'').trim();if(!key||!name)return;if(isVisible(item))visible.add(key);else if(!hidden.has(key))hidden.set(key,name);});return [...hidden].filter(([key])=>!visible.has(key)).map(([,name])=>name);}
  function preferredStoreCategory(ids,categories,store=activeStore){const available=splitCategories(ids);const wanted=STORE_FILTERS[store]||[];for(const label of wanted){const hit=available.find(id=>{const cat=categories.find(c=>c.id===id)||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(id));return cat&&storeCategoryKey(cat.name)===storeCategoryKey(label);});if(hit)return (categories.find(c=>c.id===hit)||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(hit)))?.id||hit;}return available[0]||'';}
  function resolvedItemCategory(item,store=activeStore){const available=itemCategoryIds(item),wanted=STORE_FILTERS[store]||[];for(const label of wanted){const hit=available.find(id=>{const cat=state.categories.find(c=>c.id===id)||state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(id));return cat&&storeCategoryKey(cat.name)===storeCategoryKey(label);});if(hit)return (state.categories.find(c=>c.id===hit)||state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(hit)))?.id||hit;}return '';}
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
    const map=new Map(); valid.forEach(v=>{let key=norm(v.recette), r=map.get(key); if(!r){r={name:v.recette,moments:v.moments,servings:v.servings,ingredients:[]};map.set(key,r);}else v.moments.forEach(m=>{if(!r.moments.includes(m))r.moments.push(m);});r.ingredients.push({name:v.ingredient,quantity:v.quantity,unit:norm(v.unite),category:splitCategories(v.categorie),order:qtyNum(v.ordre)??r.ingredients.length});});
    return {errors:[],recipes:[...map.values()].map(r=>({...r,ingredients:r.ingredients.sort((a,b)=>a.order-b.order).map(({order,...i})=>i)}))};
  }
  function recipeSignature(r){return JSON.stringify({moments:[...(r.moments||[])].sort(),servings:recipeServings(r),ingredients:(r.ingredients||[]).map(i=>[norm(i.name),String(i.quantity??''),norm(i.unit),splitCategories(i.categories?.length?i.categories:i.category).map(norm).sort()])});}
  function reconcileRecipes(existing,incoming){const next=existing.map(r=>({...r,ingredients:(r.ingredients||[]).map(i=>({...i})),moments:[...(r.moments||[])]}));let added=0,updated=0,unchanged=0;for(const fresh of incoming){const old=next.find(r=>norm(r.name)===norm(fresh.name));if(!old){next.push({...fresh,id:fresh.id||uid()});added++;}else if(recipeSignature(old)!==recipeSignature(fresh)){Object.assign(old,fresh);updated++;}else unchanged++;}return {recipes:next,added,updated,unchanged};}
  function canonicalUnit(unit){const u=norm(unit);return ['kg','g'].includes(u)?'g':['l','ml'].includes(u)?'ml':u;}
  function recipeServings(recipe){const n=qtyNum(recipe?.servings);return n!==null&&n>=1?n:1;}
  function adjustQuantity(quantity,people,servings=1){const value=qtyNum(quantity);return value===null?String(quantity||''):String(value*Number(people||1)/Math.max(1,Number(servings)||1)).replace('.',',');}
  function mergeListItem(list, source, multiplier=1, keepUnitlessQuantity=false) {
    const name=String(source.name||'').trim();if(!name)return;
    let unit=norm(source.unit), q=qtyNum(source.quantity);
    if(['cas','cac'].includes(unit)||(!unit&&!keepUnitlessQuantity))q=null;
    const value=q===null?'':String(q*multiplier), categories=itemCategoryIds(source), category=String(source.category||categories[0]||'');
    const found=list.find(x=>norm(x.name)===norm(name)&&norm(x.unit)===unit);
    if(found){if(value!=='') found.quantity=String((qtyNum(found.quantity)||0)+(Number(value)||0));found.categories=[...new Set([...itemCategoryIds(found),...categories])];return;}
    list.push({id:uid(),name,quantity:value,unit,category,categories,checked:false});
  }
  function finalizeShoppingList(list){list.forEach(x=>{const q=qtyNum(x.quantity);if(q===null)return;if(x.unit==='u')x.quantity=String(Math.ceil(q-1e-10));});return list;}
  function mealTotals(daysMap, peopleMap, planned={}){let midi=0,soir=0,selectedMidi=0,selectedSoir=0;daysMap.forEach((options,date)=>['midi','soir'].forEach(meal=>{if(!options[meal])return;if(meal==='midi'){midi++;if(planned[`${date}|${meal}`])selectedMidi++;}else{soir++;if(planned[`${date}|${meal}`])selectedSoir++;}}));return {midi,soir,selectedMidi,selectedSoir};}
  function countSelections(plan, meal){return Object.entries(plan||{}).reduce((n,[key,value])=>{const count=Math.max(0,Number(value)||0);if(!count)return n;try{return JSON.parse(key)[0]===meal?n+count:n;}catch{return n;}},0);}
  function countSelectedPeople(plan,meal){return countSelections(plan,meal);}
  function planKey(meal,people,recipeId){return JSON.stringify([meal,Math.max(1,Number(people)||1),recipeId]);}
  function mergeGeneratedWeekBatches(weeks,incoming=null){
    const result=(Array.isArray(weeks)?weeks:[]).filter(Boolean);if(!result.length&&!incoming)return [];const first=result[0]||incoming||{id:uid(),groups:{}};
    const sources=result.map(w=>w.groups||{});if(incoming)sources.push(incoming.groups||{});
    const groups={matin:[],midi:[],gouter:[],soir:[]};
    const usedIds=new Set();
    for(const source of sources)for(const [moment,rows] of Object.entries(source)){
      if(!Array.isArray(rows))continue;if(!groups[moment])groups[moment]=[];
      for(const row of rows){if(!row||!String(row.name||'').trim())continue;let id=String(row.id||'');if(!id||usedIds.has(id))id=uid();while(usedIds.has(id))id=uid();usedIds.add(id);groups[moment].push({...row,id});}
    }
    return [{...first,groups}];
  }
  function scaleRecipeIngredients(recipe,people=recipeServings(recipe),times=1){const count=Math.max(1,Number(times)||1);return (recipe.ingredients||[]).map(i=>({...i,quantity:adjustQuantity(i.quantity,Number(people||1)*count,recipeServings(recipe))}));}
  function recipePickerMarkup(recipes,daysMap,peopleMap,planned={},extras={},passedCalendar=false){
    const totals=mealTotals(daysMap,peopleMap,{}),m=countSelectedPeople(planned,'midi'),s=countSelectedPeople(planned,'soir');
    const counter=(r,key,count)=>`<div class="recipe-counter"><button type="button" data-action="recipe-count" data-key="${esc(key)}" data-delta="-1" aria-label="Diminuer ${esc(r.name)}">−</button><b>${count}</b><button type="button" data-action="recipe-count" data-key="${esc(key)}" data-delta="1" aria-label="Augmenter ${esc(r.name)}">＋</button></div>`;
    const recipeRow=(r,key,count)=>`<div class="recipe-choice-row"><span class="recipe-choice-name ${count>0?'has-quantity':''}">${esc(r.name)}</span>${counter(r,key,count)}</div>`;
    const momentList=(moment,title)=>{const list=recipes.filter(r=>(r.moments||[]).includes(moment));return `<section class="group recipe-moment"><h2>${title}</h2>${list.length?list.map(r=>{const k=JSON.stringify([moment,r.id]);return recipeRow(r,k,Number(extras[k])||0);}).join(''):'<p class="muted">Aucune recette pour ce moment.</p>'}</section>`;};
    if(passedCalendar){
      const groups=[['matin','Matin'],['midi','Midi'],['soir','Soir'],['gouter','Goûter']].map(([moment,title])=>{
        const list=recipes.filter(r=>(r.moments||[]).includes(moment));
        const rows=list.length?list.map(r=>{const key=(moment==='midi'||moment==='soir')?planKey(moment,1,r.id):JSON.stringify([moment,r.id]);const count=(moment==='midi'||moment==='soir')?Number(planned[key])||0:Number(extras[key])||0;return recipeRow(r,key,count);}).join(''):'<p class="muted">Aucune recette pour ce moment.</p>';
        return `<section class="group recipe-moment"><h2>${title}</h2><div class="recipe-group-one"><div class="recipe-checklist">${rows}</div></div></section>`;
      }).join('');
      return `<p class="unit-note">1 unité = 1 repas pour 1 personnes</p><div class="sticky-count meal-total" aria-live="polite"><b>Repas : ${m+s}</b></div>${groups}`;
    }
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
    if(typeof module!=='undefined')module.exports={DEFAULT_CATEGORIES,STORE_FILTERS,storeCategoryKey,splitCategories,itemCategoryIds,preferredStoreCategory,showEmptyStoreCategories,hiddenIngredientNames,CSV_COLUMNS,parseCSV,validateCSV,canonicalMoment,recipeSignature,reconcileRecipes,mergeListItem,displayQty,norm,qtyNum,recipeServings,mealTotals,finalizeShoppingList,adjustQuantity,countSelections,planKey,countSelectedPeople,mergeGeneratedWeekBatches,scaleRecipeIngredients,shoppingEntries,recipePickerMarkup,ingredientKey,isIngredientSuppressed,hasUppercaseLetter,isCatalogIngredientValid};
    return;
  }
  const view=$('#view'), toast=$('#toast'); let db, state={recipes:[],categories:[],pdfs:[],list:[]}, tab='list', modalOpen=false, workflow=null, monthCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1), days=new Map(), selectedCounts={}, plannedMeals={}, peopleBySlot={}, reviewEntries=[], reviewChecks={}, recipeChecked={};
  let activeStore='Auchan St Cyprien',storeCategoryOrders={};
  try{const saved=JSON.parse(localStorage.getItem('courses-active-store-v1')||'null');if(STORE_FILTERS[saved])activeStore=saved;}catch{}
  try{storeCategoryOrders=JSON.parse(localStorage.getItem('courses-category-orders-v1')||'{}')||{};}catch{storeCategoryOrders={};}
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
  function storeCategories(store=activeStore){const wanted=STORE_FILTERS[store]||STORE_FILTERS['Auchan St Cyprien'],matches=wanted.map(label=>state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(label))).filter(Boolean),saved=(storeCategoryOrders[store]||[]).map(id=>matches.find(c=>c.id===id)).filter(Boolean),ordered=[...saved,...matches.filter(c=>!saved.some(x=>x.id===c.id))];return ordered;}
  function storeCategoryLabel(cat,store=activeStore){return (STORE_FILTERS[store]||[]).find(label=>storeCategoryKey(label)===storeCategoryKey(cat.name))||cat.name;}
  function saveStoreOrders(){try{localStorage.setItem('courses-category-orders-v1',JSON.stringify(storeCategoryOrders));}catch{}}
  function storeFilterControl(){return `<label class="store-filter"><span>Magasin</span><select data-store-filter aria-label="Filtrer par magasin">${Object.keys(STORE_FILTERS).map(name=>`<option value="${esc(name)}" ${name===activeStore?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`;}
  async function load(){
    [state.recipes,state.categories,state.pdfs,state.list]=await Promise.all(['recipes','categories','pdfs','list'].map(all));
    if(!state.categories.length)state.categories=DEFAULT_CATEGORIES.map((name,order)=>({id:uid(),name,order,ingredients:[]}));
    for(const name of ['Sauce','Autres','Autres produits'])if(!state.categories.some(c=>norm(c.name)===norm(name)))state.categories.push({id:uid(),name,order:state.categories.length,ingredients:[]});
    state.categories.sort((a,b)=>a.order-b.order);
    let recipesMigrated=false,listMigrated=false;
    const categoryByName=name=>state.categories.find(c=>norm(c.name)===norm(name));
    const legacyOther=categoryByName('Autres'),pharmacyOther=categoryByName('Autres produits');
    // L’ancien « Autres » était partagé : copier son catalogue sans le renommer ni le vider.
    if(legacyOther&&pharmacyOther&&!pharmacyOther.legacyOtherCopied){
      legacyOther.ingredients.forEach(name=>{if(!pharmacyOther.ingredients.some(x=>norm(x)===norm(name)))pharmacyOther.ingredients.push(name);});
      pharmacyOther.legacyOtherCopied=true;
    }
    const migratePharmacyMembership=(item,storeType)=>{
      const ids=itemCategoryIds(item),hasLegacyOther=ids.some(id=>id===legacyOther?.id||norm(state.categories.find(c=>c.id===id)?.name||id)==='autres');
      // Dupliquer l’association vers la nouvelle catégorie, sans retirer « Autres » (Épicerie asiatique).
      if(hasLegacyOther&&pharmacyOther&&!ids.includes(pharmacyOther.id)){
        ids.push(pharmacyOther.id);item.categories=ids;
        if(storeType==='recipes')recipesMigrated=true;else listMigrated=true;
      }
    };
    const sauceCategory=categoryByName('Sauce'),rayonCategory=state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey('Rayon asiatique'));
    state.recipes.forEach(r=>(r.ingredients||[]).forEach(i=>{
      const ids=splitCategories(i.categories?.length?i.categories:i.category);
      if(!Array.isArray(i.categories)||!Array.isArray(i.category)){i.categories=ids;i.category=ids[0]||'';recipesMigrated=true;}
      migratePharmacyMembership(i,'recipes');
      if(norm(i.name)==='sauce soja salee')for(const cat of [rayonCategory,sauceCategory].filter(Boolean)){
        if(!i.categories.includes(cat.id)){i.categories.push(cat.id);recipesMigrated=true;}
        if(!isIngredientSuppressed(suppressedIngredients,cat.name,i.name)&&!cat.ingredients.some(x=>norm(x)===norm(i.name)))cat.ingredients.push(i.name);
      }
    }));
    state.list.forEach(i=>{
      if(!Array.isArray(i.categories)){i.categories=splitCategories(i.category);listMigrated=true;}
      migratePharmacyMembership(i,'list');
    });
    await Promise.all([replaceStore('categories',state.categories),recipesMigrated?replaceStore('recipes',state.recipes):Promise.resolve(),listMigrated?replaceStore('list',state.list):Promise.resolve()]);
  }
  function say(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),3000);}
  function ingredientFieldKind(input){const form=input?.form;return form?.dataset.form==='catalog'?'catalog':form?.dataset.form==='list-add'||form?.dataset.form==='manual-add'?'lowercase':null;}
  function ingredientFieldValid(kind,value){return kind==='catalog'?isCatalogIngredientValid(value):!hasUppercaseLetter(value);}
  // Valider au moment de l’ajout, jamais pendant l’édition, pour autoriser l’effacement intégral.
  function rejectField(input,message){input.classList.add('input-invalid');clearTimeout(input.invalidTimer);input.invalidTimer=setTimeout(()=>input.classList.remove('input-invalid'),1800);say(message);input.focus();}
  function saveWindowScroll(){const root=document.scrollingElement,containers=[...document.querySelectorAll('#view,[data-scroll-container]')].map((el,index)=>({index,top:el.scrollTop,left:el.scrollLeft}));return {left:window.scrollX,top:window.scrollY,rootTop:root?.scrollTop||0,rootLeft:root?.scrollLeft||0,containers};}
  function page(title,subtitle,html,scrollPosition=null,headerAction=''){const keepScroll=!!workflow&&['calendar','recipes','review','manual'].includes(workflow.screen),restorePosition=scrollPosition||(keepScroll?saveWindowScroll():null);document.body.classList.toggle('workflow-active',keepScroll);view.dataset.page=norm(title);const nav=keepScroll?(workflow.screen==='manual'?'<div class="workflow-nav manual-workflow-nav"><button type="button" data-action="manual-close" aria-label="Fermer sans enregistrer">✕</button></div>':'<div class="workflow-nav"><button type="button" data-action="workflow-back" aria-label="Retour">‹</button><button type="button" data-action="workflow-close" aria-label="Fermer le parcours">✕</button></div>'):'';const heading=headerAction?`<h1>${esc(title)}</h1><div class="recipes-header-action">${headerAction}</div>`:`<h1>${esc(title)}</h1>`;view.innerHTML=`<header class="page-head${keepScroll?' workflow-head':''}${headerAction?' recipes-page-head':''}">${nav}${subtitle?`<p>${esc(subtitle)}</p>`:''}${heading}</header>${html}`;if(['courses','liste de courses'].includes(norm(title))){window.scrollTo(0,0);document.querySelectorAll('#view .scroll-container,[data-scroll-container]').forEach(el=>{el.scrollTop=0;el.scrollLeft=0;});}else if(restorePosition){window.scrollTo({left:restorePosition.left||0,top:restorePosition.top||0,behavior:'instant'});const root=document.scrollingElement;if(root){root.scrollLeft=restorePosition.rootLeft??restorePosition.left??0;root.scrollTop=restorePosition.rootTop??restorePosition.top??0;}if(restorePosition.containers)restorePosition.containers.forEach(saved=>{const el=saved.index===0?$('#view'):document.querySelectorAll('[data-scroll-container]')[saved.index-1];if(el){el.scrollLeft=saved.left;el.scrollTop=saved.top;}});}else window.scrollTo(0,0);}
  function button(action,text,cls=''){return `<button class="button ${cls}" data-action="${action}">${text}</button>`;}
  function categoryName(value){return splitCategories(value).map(id=>state.categories.find(c=>c.id===id)?.name||id).join(' | ')||'Sans catégorie';}
  function renderImport(){page('Importer','RECETTES · CSV',`<section class="group"><label class="file-pick">Choisir un fichier CSV<input type="file" id="csv-file" accept=".csv,text/csv"></label><details class="csv-help"><summary>En savoir plus</summary><p class="hint">CSV UTF‑8 avec les colonnes recette,moment,ingredient,quantite,unite,categorie,ordre. La colonne facultative « repas » indique le nombre de personnes prévu (défaut : 1). Virgule ou point-virgule accepté. Séparez plusieurs catégories avec |. L’import est validé en entier avant toute modification.</p></details></section><section class="group"><h2>Mes recettes <span class="muted">${state.recipes.length}</span></h2>${state.recipes.length?state.recipes.map(r=>`<details class="recipe-entry"><summary><b>${esc(r.name)}</b><small>${(r.moments||[]).map(esc).join(' · ')} · ${r.ingredients.length} ingrédients</small><button class="text-button" data-action="delete-recipe" data-id="${esc(r.id)}" aria-label="Supprimer">Supprimer</button></summary><div>${r.ingredients.map(i=>`<p>${esc(i.name)} <span class="muted">${esc([i.quantity,i.unit,categoryName(i.category)].filter(Boolean).join(' · '))}</span></p>`).join('')}</div></details>`).join(''):'<p class="muted">Aucune recette importée.</p>'}</section><section class="group">${button('export-csv','Exporter des recettes','outline-violet')}</section>`);}
  function renderCategories(scrollPosition=null){page('Catégories','ORGANISATION',`${storeFilterControl()}<section class="group category-list">${storeCategories().map(c=>`<article class="category-card" data-category-id="${esc(c.id)}"><div class="cat-head"><h2 class="category-title"><span class="drag-grip" aria-hidden="true">⠿</span><span class="category-name">${esc(storeCategoryLabel(c))}</span></h2><div class="category-actions"><button type="button" class="category-icon-btn rename-category" data-action="rename-cat" data-id="${esc(c.id)}" aria-label="Renommer ${esc(c.name)}" title="Renommer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></button><button type="button" class="category-icon-btn delete-category" data-action="delete-cat" data-id="${esc(c.id)}" aria-label="Supprimer ${esc(c.name)}" title="Supprimer">×</button></div></div><div class="chips">${c.ingredients.map(x=>`<span class="ingredient-chip"><span>${esc(x)}</span><button class="ingredient-delete" type="button" data-action="delete-ingredient" data-id="${esc(c.id)}" data-ingredient="${esc(x)}" aria-label="Supprimer ${esc(x)}" title="Supprimer ${esc(x)}">×</button></span>`).join('')||'<span class="muted">Aucun ingrédient</span>'}</div><form class="inline-form category-ingredient-form" data-form="catalog" data-id="${esc(c.id)}"><input name="name" placeholder="Ajouter un ingrédient" required aria-label="Ajouter un ingrédient dans ${esc(c.name)}" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off"></form></article>`).join('')}</section><p class="hint reorder-hint">Maintenez une catégorie environ une demi-seconde, puis faites-la glisser pour la déplacer.</p><form class="group inline-form" data-form="new-cat"><input name="name" placeholder="Nouvelle catégorie" required><button class="button category-add-button" aria-label="Ajouter" title="Ajouter"></button></form>`,scrollPosition);}
  function pdfDisplayName(name){return String(name||'').replace(/\.pdf$/i,'');}
  function renderPdfs(){const sortedPdfs=[...state.pdfs].sort((a,b)=>pdfDisplayName(a.name).localeCompare(pdfDisplayName(b.name),'fr',{sensitivity:'base'}));page('Fiches','DOCUMENTS · STOCKAGE LOCAL',`<section class="group"><label class="file-pick">Importer un ou plusieurs PDF<input id="pdf-file" type="file" accept="application/pdf,.pdf" multiple></label><p class="hint">Les fichiers sont stockés localement dans IndexedDB.</p></section><section class="pdf-list">${sortedPdfs.length?sortedPdfs.map(f=>`<article class="pdf-card" data-pdf-row="${esc(f.id)}" data-action="open-pdf" data-id="${esc(f.id)}" role="button" tabindex="0" aria-label="Ouvrir ${esc(pdfDisplayName(f.name))}"><span class="pdf-name">${esc(pdfDisplayName(f.name))}</span><button class="pdf-icon-button" data-action="rename-pdf" data-id="${esc(f.id)}" aria-label="Renommer ${esc(pdfDisplayName(f.name))}" title="Renommer">✎</button><button class="pdf-icon-button pdf-cross" data-action="delete-pdf" data-id="${esc(f.id)}" aria-label="Supprimer ${esc(pdfDisplayName(f.name))}" title="Supprimer">✕</button></article>`).join(''):'<section class="group empty-state"><b>Aucune fiche PDF</b><p>Importez vos documents pour les retrouver ici.</p></section>'}</section>`);}
  function groupedList(){const map=new Map();state.list.forEach(x=>{const k=norm(x.name);if(!map.has(k))map.set(k,[]);map.get(k).push(x);});return map;}
  function renderList(scrollPosition=null){
    let body=''; const activeCats=new Set(),visible=storeCategories(),visibleIds=new Set(visible.map(c=>c.id));
    const hiddenIngredients=hiddenIngredientNames(state.list,item=>!!resolvedItemCategory(item));
    const hiddenIngredientsControl=hiddenIngredients.length?`<details class="hidden-ingredients"><summary>${hiddenIngredients.length} ingrédient${hiddenIngredients.length===1?'':'s'} masqué${hiddenIngredients.length===1?'':'s'} <span aria-hidden="true">▾</span></summary><div class="hidden-ingredients-list">${hiddenIngredients.map(name=>`<div>${esc(name)}</div>`).join('')}</div></details>`:'';
    const renderRows=(id,items,title,showEmpty=false)=>{if(!items.length&&!showEmpty)return '';activeCats.add(id);return `<section class="list-group active-list-category" data-list-category="${esc(id)}"><h2 class="list-group-title">${esc(title||(state.categories.find(c=>c.id===id)?storeCategoryLabel(state.categories.find(c=>c.id===id)):categoryName(id)))}</h2>${items.map(i=>`<div class="shopping-row ${i.checked?'checked':''}" data-list-item="${esc(i.id)}" data-category="${esc(id)}"><input type="checkbox" data-action="toggle" data-id="${esc(i.id)}" ${i.checked?'checked':''} aria-label="Cocher ${esc(i.name)}"><span>${esc(i.name)}</span><small>${esc(displayQty(i))}</small></div>`).join('')}</section>`;};
    const forceEmpty=showEmptyStoreCategories(activeStore);
    let visibleItemCount=0;
    visible.forEach(cat=>{const items=state.list.filter(i=>resolvedItemCategory(i)===cat.id);visibleItemCount+=items.length;if(items.length)body+=renderRows(cat.id,items,storeCategoryLabel(cat));});
    const empties=visible.filter(c=>!activeCats.has(c.id));
    if(forceEmpty)empties.forEach(cat=>body+=renderRows(cat.id,[],storeCategoryLabel(cat),true));
    else if(empties.length)body+=`<details class="empty-categories"><summary>Catégories vides</summary><div class="empty-category-list">${empties.map(c=>`<div class="empty-category-name">${esc(storeCategoryLabel(c))}</div>`).join('')}</div></details>`;
    if(state.list.length&&visibleItemCount===0)body+=`<p class="list-empty-message">Aucun article dans ce magasin</p>`;
    const content=`${storeFilterControl()}${hiddenIngredientsControl}${state.list.length?`<div class="list-actions"><div class="list-workflows">${button('start-recipes','Depuis mes recettes','workflow-recipes')}${button('start-manual','Manuellement','workflow-manual')}</div>${button('reset','Supprimer la liste','danger')}</div>${body}`:`<div class="list-workflows list-workflows-empty">${button('start-recipes','Depuis mes recettes','workflow-recipes')}${button('start-manual','Manuellement','workflow-manual')}</div><p class="list-empty-message">Aucune liste pour le moment</p>${forceEmpty?body:''}`}`;
    page('Courses','VOTRE LISTE',content,scrollPosition);
  }
  function setTab(which){tab=which;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===which));({import:renderImport,cats:renderCategories,pdf:renderPdfs,list:renderList,recipes:renderRecipesTab}[which]||renderList)();}
  function slotKey(date,meal){return `${date}|${meal}`;}
  function slotPeople(date,meal){const n=Number(peopleBySlot[slotKey(date,meal)]);return Number.isFinite(n)&&n>=1?Math.floor(n):1;}
  function savePeople(){try{localStorage.setItem('courses-meal-people-v1',JSON.stringify(peopleBySlot));}catch{}}
  function cleanupMealPlan(date,meal){const people=slotPeople(date,meal),stillScheduled=[...days.entries()].some(([d,opt])=>d!==date&&opt[meal]&&slotPeople(d,meal)===people);if(stillScheduled)return;for(const key of Object.keys(plannedMeals)){try{const [m,n]=JSON.parse(key);if(m===meal&&Number(n)===people)delete plannedMeals[key];}catch{}}}
  function renderCalendar(){const year=monthCursor.getFullYear(),month=monthCursor.getMonth(),first=new Date(year,month,1),offset=(first.getDay()+6)%7,daysIn=new Date(year,month+1,0).getDate(),today=new Date();today.setHours(0,0,0,0);let cells='';for(let i=0;i<offset;i++)cells+='<span class="blank"></span>';for(let d=1;d<=daysIn;d++){const date=new Date(year,month,d),key=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,past=date<today;cells+=`<button class="day ${past?'past':''} ${days.has(key)?'selected':''}" data-action="day" data-date="${key}" ${past?'disabled':''}>${d}</button>`;}
    page('Choisir les jours','',`<section class="group"><div class="calendar-skip-wrap"><button type="button" class="calendar-skip" data-action="skip-calendar">passer cette étape</button></div><div class="calendar-head"><button data-action="month" data-delta="-1">‹</button><b>${monthCursor.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</b><button data-action="month" data-delta="1">›</button></div><div class="calendar-grid">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}${cells}</div><div id="day-options">${[...days].map(([date,opt])=>`<div class="day-options"><b>${new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</b>${['midi','soir'].map(meal=>`<div class="meal-option"><label><input type="checkbox" data-meal="${meal}" data-date="${date}" ${opt[meal]?'checked':''}> ${meal==='midi'?'Midi':'Soir'}</label>${opt[meal]?`<div class="person-counter"><span>Personnes</span><button data-action="people" data-date="${date}" data-meal="${meal}" data-delta="-1" aria-label="Diminuer">−</button><b>${slotPeople(date,meal)}</b><button data-action="people" data-date="${date}" data-meal="${meal}" data-delta="1" aria-label="Augmenter">＋</button></div>`:''}</div>`).join('')}<button data-action="un-day" data-date="${date}">Retirer</button></div>`).join('')}</div></section><div class="form-actions workflow-actions">${button('calendar-next','Continuer','primary')}</div>`);}
  function mealsCounts(){let midi=0,soir=0;days.forEach((d,date)=>{if(d.midi)midi+=slotPeople(date,'midi');if(d.soir)soir+=slotPeople(date,'soir');});return {days:days.size,midi,soir};}
  function topScrollPosition(){return {left:0,top:0,rootLeft:0,rootTop:0,containers:[{index:0,left:0,top:0}]};}
  function renderRecipePicker(scrollPosition=null){document.querySelectorAll('[data-recipe-group]').forEach(el=>{recipeGroupOpen[el.dataset.recipeGroup]=el.open;});page('Choisir les recettes',workflow?.passed?'SÉLECTIONNER LES REPAS':'PAR JOURS DE LA SEMAINE · 2/2',`${recipePickerMarkup(state.recipes,days,peopleBySlot,plannedMeals,selectedCounts,!!workflow?.passed)}<div class="form-actions workflow-actions">${button('recipe-ok','OK - Générer les courses','primary')}</div>`,scrollPosition);}
  let generatedWeeks=[];
  try{const saved=JSON.parse(localStorage.getItem('courses-generated-weeks-v1')||'[]');if(Array.isArray(saved))generatedWeeks=saved;}catch{}
  function saveGeneratedWeeks(){try{localStorage.setItem('courses-generated-weeks-v1',JSON.stringify(generatedWeeks));}catch{say('Impossible d’enregistrer l’historique sur cet appareil.');}}
  const legacyWeekCount=generatedWeeks.length;generatedWeeks=mergeGeneratedWeekBatches(generatedWeeks);if(generatedWeeks.length!==legacyWeekCount)saveGeneratedWeeks();
  function appendGeneratedWeek(snapshot){generatedWeeks=mergeGeneratedWeekBatches(generatedWeeks,snapshot);saveGeneratedWeeks();}
  function buildWeekSnapshot(){
    const groups={matin:[],midi:[],gouter:[],soir:[]};
    for(const [key,raw] of Object.entries(plannedMeals)){const count=Math.max(0,Number(raw)||0);if(!count)continue;let meal,people,recipeId;try{[meal,people,recipeId]=JSON.parse(key);}catch{continue;}const r=state.recipes.find(x=>x.id===recipeId);if(r&&groups[meal])for(let i=0;i<count;i++)groups[meal].push({id:uid(),name:r.name,checked:false});}
    for(const [key,raw] of Object.entries(selectedCounts)){const count=Math.max(0,Number(raw)||0);if(!count)continue;let moment,recipeId;try{[moment,recipeId]=JSON.parse(key);}catch{continue;}const r=state.recipes.find(x=>x.id===recipeId);if(r&&groups[moment])for(let i=0;i<count;i++)groups[moment].push({id:uid(),name:r.name,checked:false});}
    return {id:uid(),groups};
  }
  function renderRecipesTab(scrollPosition=null){
    const hasRows=generatedWeeks.some(w=>Object.values(w.groups||{}).some(rows=>rows.length));
    if(!hasRows){page('Recettes','VOTRE HISTORIQUE','<section class="recipes-empty-card"><p>Les recettes sélectionnées pour vos courses apparaîtront ici.</p></section>',scrollPosition);return;}
    const momentTitles=[['matin','Matin'],['midi','Midi'],['gouter','Goûter'],['soir','Soir']];
    const blocks=generatedWeeks.map(week=>{const groups=week.groups||{},sections=momentTitles.map(([moment,title])=>{const rows=groups[moment]||[];return rows.length?`<section class="week-moment"><h3>${title}</h3>${rows.map(r=>`<div class="week-recipe-entry"><label class="week-recipe ${r.checked?'checked':''}"><input type="checkbox" data-week-id="${esc(week.id)}" data-line-id="${esc(r.id)}" ${r.checked?'checked':''}><span><b>${esc(r.name)}</b></span></label><button type="button" class="week-recipe-delete" data-action="delete-week-recipe" data-week-id="${esc(week.id)}" data-line-id="${esc(r.id)}" aria-label="Supprimer ${esc(r.name)}">×</button></div>`).join('')}</section>`:''}).join('');return `<article class="generated-group" data-week="${esc(week.id)}">${sections}</article>`;}).join('');
    page('Recettes','VOTRE HISTORIQUE',blocks,scrollPosition,'<button class="text-button recipes-delete-all" data-action="delete-weeks">Tout supprimer</button>');
  }
  function renderRecipeReview(scrollPosition=null){const lines=reviewEntries.map(item=>`<label class="review-row"><input type="checkbox" data-review-item="${esc(item.id)}" ${reviewChecks[item.id]!==false?'checked':''}><span>${esc(item.name)}</span><small>${esc(displayQty(item))}</small></label>`).join('');page('Liste de courses','VÉRIFIER LES INGRÉDIENTS',`<p class="hint">Décochez les ingrédients que vous avez déjà. Seuls les éléments cochés seront ajoutés.</p><section class="group review-list">${lines}</section><div class="form-actions workflow-actions">${button('review-confirm','Générer la liste de courses','primary')}</div>`,scrollPosition);if(!scrollPosition)window.scrollTo(0,0);}
  function manualIngredientRow(category,name,checked=false){const key=`${category}|${name}`;return `<div class="manual-ingredient-row"><input type="checkbox" data-pick="${esc(key)}" ${checked?'checked':''} aria-label="Sélectionner ${esc(name)}"><span class="manual-ingredient-name">${esc(name)}</span><input type="number" min="0" step="any" inputmode="decimal" placeholder="Qté" data-pick-qty="${esc(key)}" aria-label="Quantité pour ${esc(name)}"><select data-pick-unit="${esc(key)}" aria-label="Unité pour ${esc(name)}"><option value="">—</option>${UNITES.filter(Boolean).map(u=>`<option value="${esc(u)}">${esc(u)}</option>`).join('')}</select></div>`;}
  let manualViewportBase=0;
  function syncManualKeyboardState(){const active=workflow?.screen==='manual'&&document.body.classList.contains('workflow-active'),focused=active&&document.activeElement?.matches('.manual-add-form input'),viewport=window.visualViewport,short=active&&viewport&&manualViewportBase>0&&viewport.height<manualViewportBase-120;document.body.classList.toggle('manual-keyboard-open',!!(focused||short));}
  function categoryPicker(){workflow={screen:'manual'};manualViewportBase=window.visualViewport?.height||window.innerHeight;const groups=storeCategories().map(c=>`<section class="group manual-category" data-manual-category="${esc(c.id)}"><div class="manual-category-head"><h2>${esc(storeCategoryLabel(c))}</h2><button type="button" class="manual-add-toggle" data-action="toggle-manual-add" data-id="${esc(c.id)}" aria-label="Ajouter un ingrédient dans ${esc(c.name)}">+</button></div><div class="manual-tags">${c.ingredients.map(name=>manualIngredientRow(c.id,name)).join('')||'<p class="muted manual-no-tags">Aucun ingrédient enregistré.</p>'}</div><form class="inline-form manual-add-form" data-form="manual-add" data-id="${esc(c.id)}" hidden><input name="name" placeholder="Ajouter un ingrédient" aria-label="Ajouter un ingrédient dans ${esc(c.name)}" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off" required></form></section>`).join('');page('Choisir manuellement','COMPOSER LA LISTE',`${storeFilterControl()}<div id="category-picker">${groups}</div><div class="form-actions category-picker-actions">${button('category-ok','Ajouter à la liste','primary')}</div>`);}
  async function afterImport(text){const result=validateCSV(text);if(result.errors.length){say(`Import annulé — ${result.errors[0]}`);return;}let added=0,updated=0,unchanged=0;const next=[...state.recipes];
    // Un import CSV valide réinitialise les suppressions manuelles du catalogue.
    suppressedIngredients={};saveSuppressedIngredients();
    // Catalogue alimenté uniquement après validation complète, puis comparaison par contenu cohérent.
    result.recipes.forEach(r=>r.ingredients.forEach(i=>{let labels=splitCategories(i.category);if(norm(i.name)==='sauce soja salee')labels=[...new Set([...labels,'Sauce'])];const ids=[];for(const label of labels){let cat=state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(label));if(!cat){cat={id:uid(),name:label,order:state.categories.length,ingredients:[]};state.categories.push(cat);}if(!isIngredientSuppressed(suppressedIngredients,cat.name,i.name)&&!cat.ingredients.some(x=>norm(x)===norm(i.name)))cat.ingredients.push(i.name);ids.push(cat.id);}i.categories=[...new Set(ids)];i.category=i.categories[0]||'';}));
    const reconciled=reconcileRecipes(next,result.recipes);added=reconciled.added;updated=reconciled.updated;unchanged=reconciled.unchanged;next.splice(0,next.length,...reconciled.recipes);
    state.recipes=next;await Promise.all([replaceStore('recipes',state.recipes),replaceStore('categories',state.categories)]);renderImport();say(`${added} ajoutée(s), ${updated} mise(s) à jour, ${unchanged} inchangée(s).`);}
  function selectedNewList(entries,mode='append'){if(mode==='replace')state.list=[];entries.forEach(x=>mergeListItem(state.list,x,1));finalizeShoppingList(state.list);replaceStore('list',state.list).then(()=>{setTab('list');say(mode==='replace'?'Liste remplacée.':'Articles ajoutés à la liste.');});}
  function askRecipeMerge(entries){if(!state.list.length)return selectedNewList(entries);$('#merge-modal').hidden=false;$('#merge-modal').dataset.payload=JSON.stringify(entries);}

  // La validation est volontairement faite à la soumission : la saisie et l’effacement restent libres.
  document.addEventListener('keydown',e=>{const card=e.target.closest('.pdf-card[role=button]');if(card&&e.target===card&&(e.key==='Enter'||e.key===' ')){e.preventDefault();card.click();}});
  let suppressPdfClick=false;
  const pdfObjectUrls=new Set();
  document.addEventListener('click',async e=>{if(suppressPdfClick&&e.target.closest('.pdf-card[data-pdf-row]')){e.preventDefault();e.stopImmediatePropagation();suppressPdfClick=false;return;}const tabButton=e.target.closest('[data-tab]');if(tabButton){setTab(tabButton.dataset.tab);return;}const b=e.target.closest('[data-action]');if(!b)return;const a=b.dataset.action,id=b.dataset.id;
    if(a==='workflow-back'){if(workflow?.screen==='review'){workflow.screen='recipes';renderRecipePicker(topScrollPosition());}else if(workflow?.screen==='recipes'){workflow.screen='calendar';renderCalendar();}else{workflow=null;document.body.classList.remove('workflow-active');setTab('list');}return;}
    if(a==='workflow-close'){workflow=null;$('#merge-modal').hidden=true;setTab('list');return;}
    if(a==='start-recipes'){workflow={passed:false,screen:'calendar'};days.clear();selectedCounts={};plannedMeals={};peopleBySlot={};savePeople();saveWeekPlan();recipeGroupOpen={};monthCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1);renderCalendar();return;}
    if(a==='start-manual'){categoryPicker();return;}
    if(a==='manual-close'){workflow=null;document.body.classList.remove('workflow-active','manual-keyboard-open');setTab('list');return;}
    if(a==='cancel-merge'){ $('#merge-modal').hidden=true;return;}
    if(a==='merge-add'||a==='merge-replace'){const modal=$('#merge-modal'),entries=JSON.parse(modal.dataset.payload||'[]'),source=modal.dataset.source;modal.hidden=true;delete modal.dataset.source;if(a==='merge-replace')state.list=[];entries.forEach(x=>mergeListItem(state.list,x,1,true));finalizeShoppingList(state.list);await replaceStore('list',state.list);if(source==='recipes'){appendGeneratedWeek(buildWeekSnapshot());workflow=null;document.body.classList.remove('workflow-active');setTab('list');say(a==='merge-replace'?'Liste remplacée.':'Articles ajoutés à la liste.');}else{setTab('list');say(a==='merge-replace'?'Liste remplacée.':'Articles ajoutés à la liste.');}return;}
    if(a==='tab'){setTab(b.dataset.tab);return;}
    if(a==='export-csv'){const lines=[CSV_COLUMNS.concat(SERVINGS_COLUMN).join(',')];state.recipes.forEach(r=>r.ingredients.forEach((i,n)=>{const row=[r.name,(r.moments||[]).join('|'),i.name,i.quantity,i.unit,categoryName(i.categories?.length?i.categories:i.category),n+1,recipeServings(r)];lines.push(row.map(x=>`"${String(x??'').replace(/"/g,'""')}"`).join(','));}));const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download='courses-recettes.csv';link.click();URL.revokeObjectURL(url);return;}
    if(a==='delete-week-recipe'){const week=generatedWeeks.find(w=>w.id===b.dataset.weekId),lineId=b.dataset.lineId;if(week&&lineId){for(const rows of Object.values(week.groups||{})){const index=rows.findIndex(r=>r.id===lineId);if(index!==-1){rows.splice(index,1);break;}}saveGeneratedWeeks();renderRecipesTab(saveWindowScroll());}return;}
    if(a==='delete-week'){const weekId=b.dataset.weekId;if(confirm('Supprimer cette semaine de l’historique ?')){generatedWeeks=generatedWeeks.filter(w=>w.id!==weekId);saveGeneratedWeeks();renderRecipesTab(saveWindowScroll());}return;}
    if(a==='delete-weeks'){if(confirm('Supprimer toutes les semaines de l’historique ?')){generatedWeeks=[];saveGeneratedWeeks();renderRecipesTab(saveWindowScroll());}return;}
    if(a==='delete-recipe'){if(confirm('Supprimer cette recette ?')){state.recipes=state.recipes.filter(r=>r.id!==id);await del('recipes',id);renderImport();}return;}
    if(a==='rename-cat'){const cat=state.categories.find(c=>c.id===id),title=b.closest('.category-card')?.querySelector('.category-title');if(cat&&title&&!title.querySelector('input')){const input=document.createElement('input');input.className='category-rename-input';input.value=cat.name;input.setAttribute('aria-label','Nouveau nom de la catégorie');title.querySelector('.category-name')?.replaceWith(input);input.focus();input.select();let finished=false;const finish=async cancel=>{if(finished)return;finished=true;if(cancel){renderCategories(saveWindowScroll());return;}const name=input.value.trim();if(!name||name===cat.name){renderCategories(saveWindowScroll());return;}if(state.categories.some(c=>c.id!==id&&norm(c.name)===norm(name))){say('Cette catégorie existe déjà.');renderCategories(saveWindowScroll());return;}cat.name=name;await put('categories',cat);renderCategories(saveWindowScroll());};input.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();finish(true);}else if(ev.key==='Enter'){ev.preventDefault();finish(false);}});input.addEventListener('blur',()=>finish(false),{once:true});}return;}
    if(a==='delete-cat'){if(confirm('Supprimer cette catégorie ?')){const scrollPosition=saveWindowScroll();state.categories=state.categories.filter(c=>c.id!==id);state.categories.forEach((c,i)=>c.order=i);await replaceStore('categories',state.categories);renderCategories(scrollPosition);}return;}
    if(a==='delete-ingredient'){const cat=state.categories.find(c=>c.id===id),name=b.dataset.ingredient;if(cat&&name&&cat.ingredients.some(x=>norm(x)===norm(name))){const scrollPosition=saveWindowScroll();cat.ingredients=cat.ingredients.filter(x=>norm(x)!==norm(name));suppressedIngredients[ingredientKey(cat.name,name)]=true;suppressedIngredients[ingredientKey(cat.id,name)]=true;saveSuppressedIngredients();await put('categories',cat);renderCategories(scrollPosition);say('Ingrédient retiré du catalogue.');}return;}
    if(a==='toggle'){const item=state.list.find(x=>x.id===id);if(item){item.checked=b.checked;b.closest('.shopping-row')?.classList.toggle('checked',item.checked);await put('list',item);}return;}
    if(a==='toggle-list-add'){return;}
    if(a==='toggle-manual-add'){const form=b.closest('.manual-category')?.querySelector('.manual-add-form');if(form){form.hidden=!form.hidden;if(!form.hidden)form.querySelector('input')?.focus();}return;}
    if(a==='reset'){if(confirm('Supprimer la liste de courses ?')){state.list=[];await replaceStore('list',[]);renderList();say('Liste réinitialisée.');}return;}
    if(a==='month'){monthCursor.setMonth(monthCursor.getMonth()+Number(b.dataset.delta));renderCalendar();return;}
    if(a==='day'){const date=b.dataset.date;if(!days.has(date))days.set(date,{midi:false,soir:false});else{days.delete(date);cleanupMealPlan(date,'midi');cleanupMealPlan(date,'soir');}saveWeekPlan();renderCalendar();return;}
    if(a==='people'){const key=slotKey(b.dataset.date,b.dataset.meal);peopleBySlot[key]=Math.max(1,slotPeople(b.dataset.date,b.dataset.meal)+Number(b.dataset.delta));savePeople();renderCalendar();return;}
    if(a==='un-day'){const date=b.dataset.date;days.delete(date);cleanupMealPlan(date,'midi');cleanupMealPlan(date,'soir');saveWeekPlan();renderCalendar();return;}
    if(a==='skip-calendar'){workflow={passed:true,screen:'recipes'};days.clear();plannedMeals={};selectedCounts={};saveWeekPlan();renderRecipePicker(topScrollPosition());return;}
    if(a==='calendar-next'){workflow={passed:false,screen:'recipes'};saveWeekPlan();renderRecipePicker(topScrollPosition());return;}
    
    if(a==='recipe-ok'){const entries=shoppingEntries(state.recipes,plannedMeals,selectedCounts).map(i=>{const ids=itemCategoryIds(i).filter(value=>!isSuppressedCatalogIngredient(value,i.name)).map(value=>state.categories.find(c=>c.id===value)?.id||state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(value))?.id||value);const unique=[...new Set(ids)];return {...i,categories:unique,category:preferredStoreCategory(unique,state.categories)||unique[0]||''};}).filter(i=>i.categories.length);if(!entries.length){say('Choisissez au moins une recette.');return;}reviewEntries=[];entries.forEach(i=>mergeListItem(reviewEntries,i));finalizeShoppingList(reviewEntries);reviewChecks=Object.fromEntries(reviewEntries.map(i=>[i.id,true]));workflow.screen='review';renderRecipeReview();return;}
    if(a==='recipe-count'){let key=b.dataset.key,decoded;try{decoded=JSON.parse(key);}catch{return;}const moment=decoded[0],people=decoded.length>2?decoded[1]:1,recipeId=decoded.length>2?decoded[2]:decoded[1],delta=Number(b.dataset.delta);if(moment==='midi'||moment==='soir'){key=planKey(moment,people,recipeId);plannedMeals[key]=Math.max(0,(Number(plannedMeals[key])||0)+delta);}else{key=JSON.stringify([moment,recipeId]);selectedCounts[key]=Math.max(0,(Number(selectedCounts[key])||0)+delta);}saveWeekPlan();renderRecipePicker(saveWindowScroll());return;}
    if(a==='review-confirm'){const chosen=reviewEntries.filter(i=>reviewChecks[i.id]!==false);if(!chosen.length){say('Sélectionnez au moins un ingrédient.');return;}if(state.list.length){$('#merge-modal').dataset.payload=JSON.stringify(chosen);$('#merge-modal').dataset.source='recipes';$('#merge-modal').hidden=false;return;}chosen.forEach(i=>mergeListItem(state.list,i));finalizeShoppingList(state.list);await replaceStore('list',state.list);appendGeneratedWeek(buildWeekSnapshot());workflow=null;document.body.classList.remove('workflow-active');setTab('list');say('Liste de courses générée.');return;}
    if(a==='category-ok'){const entries=[];document.querySelectorAll('[data-pick]:checked').forEach(ch=>{const [cat,...parts]=ch.dataset.pick.split('|'),name=parts.join('|'),key=ch.dataset.pick,quantity=document.querySelector(`[data-pick-qty="${CSS.escape(key)}"]`)?.value||'',unit=document.querySelector(`[data-pick-unit="${CSS.escape(key)}"]`)?.value||'';entries.push({name,quantity,unit,category:cat,categories:[cat],checked:false});});if(!entries.length){say('Choisissez au moins un article.');return;}const manualUnique=new Map();entries.sort((a,b)=>storeCategories().findIndex(c=>c.id===a.category)-storeCategories().findIndex(c=>c.id===b.category)).forEach(x=>{const key=norm(x.name),prior=manualUnique.get(key);if(prior){prior.categories=[...new Set([...itemCategoryIds(prior),x.category])];return;}manualUnique.set(key,x);});manualUnique.forEach(x=>{const key=norm(x.name),existing=state.list.find(i=>norm(i.name)===key&&norm(i.unit)===norm(x.unit));if(!existing)mergeListItem(state.list,x,1,true);else existing.categories=[...new Set([...itemCategoryIds(existing),...itemCategoryIds(x)])];});finalizeShoppingList(state.list);await replaceStore('list',state.list);workflow=null;document.body.classList.remove('workflow-active','manual-keyboard-open');setTab('list');say('Articles ajoutés à la liste.');return;}
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
    const defaultOrder=storeCategories(activeStore).map(c=>c.id);if(ids.length===defaultOrder.length&&ids.every((id,i)=>id===defaultOrder[i]))delete storeCategoryOrders[activeStore];else storeCategoryOrders[activeStore]=ids;saveStoreOrders();
    setTimeout(()=>{if(tab==='cats')renderCategories(scrollPosition);},220);
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
  // Réordonnancement des ingrédients de la liste par appui long, limité à un groupe de catégorie.
  let listDrag=null;
  function listDragStart(row,x,y){
    if(!row||row.querySelector('input:focus'))return;
    const d=listDrag={row,x,y,started:false,timer:null};
    d.timer=setTimeout(()=>{if(listDrag!==d)return;d.started=true;row.classList.add('list-row-dragging');row.dataset.dragActive='true';if(navigator.vibrate)navigator.vibrate(18);},450);
  }
  function moveListRow(y){
    if(!listDrag?.started)return;const row=listDrag.row,group=row.closest('.active-list-category');if(!group)return;
    const others=[...group.querySelectorAll('.shopping-row:not(.list-row-dragging)')];
    const target=others.find(el=>y<el.getBoundingClientRect().top+el.offsetHeight/2);
    if(target)group.insertBefore(row,target);else group.append(row);
  }
  async function finishListDrag(){
    if(!listDrag)return;const d=listDrag;clearTimeout(d.timer);listDrag=null;d.row.classList.remove('list-row-dragging');delete d.row.dataset.dragActive;
    if(!d.started)return;const group=d.row.closest('.active-list-category');if(!group)return;
    const category=group.dataset.listCategory, ids=[...group.querySelectorAll('.shopping-row')].map(el=>el.dataset.listItem), ordered=ids.map(id=>state.list.find(i=>i.id===id)).filter(Boolean);
    let index=0;state.list=state.list.map(item=>(category==='__other__'?!resolvedItemCategory(item):resolvedItemCategory(item)===category)?ordered[index++]||item:item);
    await replaceStore('list',state.list);renderList(saveWindowScroll());
  }
  categoryList.addEventListener('pointerdown',e=>{if(e.pointerType==='touch')return;const row=e.target.closest('.shopping-row[data-list-item]');if(!row||e.target.closest('input,button'))return;listDragStart(row,e.clientX,e.clientY);});
  categoryList.addEventListener('pointermove',e=>{if(!listDrag)return;if(!listDrag.started&&Math.hypot(e.clientX-listDrag.x,e.clientY-listDrag.y)>10){clearTimeout(listDrag.timer);listDrag=null;return;}if(listDrag.started){e.preventDefault();moveListRow(e.clientY);}});
  categoryList.addEventListener('pointerup',()=>{if(listDrag)finishListDrag();});
  categoryList.addEventListener('pointercancel',()=>{if(listDrag)finishListDrag();});
  categoryList.addEventListener('touchstart',e=>{const row=e.target.closest('.shopping-row[data-list-item]');if(row&&!e.target.closest('input,button')&&e.touches.length===1)listDragStart(row,e.touches[0].clientX,e.touches[0].clientY);},{passive:true});
  categoryList.addEventListener('touchmove',e=>{if(!listDrag||e.touches.length!==1)return;const t=e.touches[0];if(!listDrag.started&&Math.hypot(t.clientX-listDrag.x,t.clientY-listDrag.y)>10){clearTimeout(listDrag.timer);listDrag=null;return;}if(listDrag.started){e.preventDefault();moveListRow(t.clientY);}},{passive:false});
  categoryList.addEventListener('touchend',()=>{if(listDrag)finishListDrag();},{passive:true});
  categoryList.addEventListener('touchcancel',()=>{if(listDrag)finishListDrag();},{passive:true});
  async function deletePdf(id){if(!confirm('Supprimer cette fiche PDF ?'))return;state.pdfs=state.pdfs.filter(x=>x.id!==id);await del('pdfs',id);renderPdfs();}
  
  document.addEventListener('toggle',e=>{const group=e.target.closest?.('[data-recipe-group]');if(group)recipeGroupOpen[group.dataset.recipeGroup]=group.open;},true);
  document.addEventListener('focusin',e=>{if(e.target.matches('.manual-add-form input'))syncManualKeyboardState();});
  document.addEventListener('focusout',e=>{if(e.target.matches('.manual-add-form input'))setTimeout(syncManualKeyboardState,0);});
  window.visualViewport?.addEventListener('resize',syncManualKeyboardState);
  window.visualViewport?.addEventListener('scroll',syncManualKeyboardState);
  document.addEventListener('change',e=>{if(!e.target.matches('[data-store-filter]'))return;activeStore=STORE_FILTERS[e.target.value]?e.target.value:'Auchan St Cyprien';try{localStorage.setItem('courses-active-store-v1',activeStore);}catch{}if(workflow?.screen==='manual')categoryPicker();else if(tab==='cats')renderCategories(saveWindowScroll());else renderList(saveWindowScroll());});
  document.addEventListener('change',async e=>{
    if(e.target.id==='csv-file'){const file=e.target.files[0];if(file)afterImport(await file.text());e.target.value='';}
    if(e.target.id==='pdf-file'){for(const f of e.target.files){const rec={id:uid(),name:pdfDisplayName(f.name),blob:f,type:f.type||'application/pdf'};state.pdfs.push(rec);await put('pdfs',rec);}renderPdfs();say(`${e.target.files.length} fiche(s) ajoutée(s).`);}
    if(e.target.dataset.meal){const d=days.get(e.target.dataset.date);if(d){const meal=e.target.dataset.meal;d[meal]=e.target.checked;if(!e.target.checked)cleanupMealPlan(e.target.dataset.date,meal);saveWeekPlan();renderCalendar();}}
    if(e.target.dataset.recipeChoice){/* Compatibilité pour les anciennes vues en cache. */}
    if(e.target.dataset.weekId&&e.target.dataset.lineId){const week=generatedWeeks.find(w=>w.id===e.target.dataset.weekId),rows=week?.groups&&Object.values(week.groups).flat(),line=rows?.find(r=>r.id===e.target.dataset.lineId);if(line){line.checked=e.target.checked;saveGeneratedWeeks();}renderRecipesTab(saveWindowScroll());}
    if(e.target.dataset.reviewItem){reviewChecks[e.target.dataset.reviewItem]=e.target.checked;}
  });
  document.addEventListener('submit',async e=>{const form=e.target;if(form.dataset.form==='new-cat'){e.preventDefault();const scrollPosition=saveWindowScroll(),name=new FormData(form).get('name').trim();if(state.categories.some(c=>norm(c.name)===norm(name)))return say('Cette catégorie existe déjà.');state.categories.push({id:uid(),name,order:state.categories.length,ingredients:[]});await replaceStore('categories',state.categories);renderCategories(scrollPosition);return;}
    if(form.dataset.form==='catalog'){e.preventDefault();const cat=state.categories.find(c=>c.id===form.dataset.id),input=form.elements.namedItem('name'),name=input.value.trim();if(!cat||!name)return;if(!isCatalogIngredientValid(name)){rejectField(input,'Minuscules, espaces, tirets ou apostrophes uniquement.');return;}if(cat.ingredients.some(x=>norm(x)===norm(name))){say('Cet ingrédient existe déjà.');input.focus();return;}cat.ingredients.push(name);delete suppressedIngredients[ingredientKey(cat.name,name)];delete suppressedIngredients[ingredientKey(cat.id,name)];saveSuppressedIngredients();await put('categories',cat);const chips=form.closest('.category-card').querySelector('.chips');chips.innerHTML=cat.ingredients.map(x=>`<span class="ingredient-chip"><span>${esc(x)}</span><button class="ingredient-delete" type="button" data-action="delete-ingredient" data-id="${esc(cat.id)}" data-ingredient="${esc(x)}" aria-label="Supprimer ${esc(x)}" title="Supprimer ${esc(x)}">×</button></span>`).join('');input.value='';input.focus();return;}
    if(form.dataset.form==='manual-add'){e.preventDefault();const cat=state.categories.find(c=>c.id===form.dataset.id),input=form.elements.namedItem('name'),name=input.value.trim();if(!cat||!name)return;if(hasUppercaseLetter(name)){rejectField(input,'Veuillez saisir l’ingrédient en minuscules.');return;}const existing=cat.ingredients.find(x=>norm(x)===norm(name)),actualName=existing||name;if(!existing){cat.ingredients.push(actualName);delete suppressedIngredients[ingredientKey(cat.name,actualName)];delete suppressedIngredients[ingredientKey(cat.id,actualName)];saveSuppressedIngredients();await put('categories',cat);}const pick=`${cat.id}|${actualName}`;let checkbox=document.querySelector(`[data-pick="${CSS.escape(pick)}"]`);if(!checkbox){const tags=form.closest('.manual-category').querySelector('.manual-tags');tags.querySelector('.manual-no-tags')?.remove();tags.insertAdjacentHTML('beforeend',manualIngredientRow(cat.id,actualName,false));}input.value='';input.blur();syncManualKeyboardState();return;}
    if(form.dataset.form==='list-add'){e.preventDefault();const input=form.elements.namedItem('name'),raw=String(new FormData(form).get('name')||'').trim();if(!raw)return;if(hasUppercaseLetter(raw)){rejectField(input,'Veuillez saisir l’ingrédient en minuscules.');return;}let quantity='',name=raw;const parsed=raw.match(/^([0-9]+(?:[.,][0-9]+)?)\s+(.+)$/);if(parsed){quantity=parsed[1].replace('.',',');name=parsed[2].trim();}if(!name)return;const category=form.dataset.category;const item={id:uid(),name,quantity,unit:'',category:category==='__other__'?'':category,categories:category==='__other__'?[]:[category],checked:false};mergeListItem(state.list,item,1,true);await replaceStore('list',state.list);renderList();say('Ingrédient ajouté.');}
  });
  document.addEventListener('change',e=>{if(e.target.dataset.pick){/* La sélection est lue au moment de valider. */}});
  async function start(){try{db=await openDB();await load();setTab('list');}catch(err){console.error('IndexedDB indisponible',err);say('Stockage local indisponible sur cet appareil.');}}
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
  start();
  if(typeof module!=='undefined')module.exports={validateCSV,parseCSV,canonicalMoment,mergeListItem,displayQty,recipeSignature,reconcileRecipes,norm,mealsCounts,mealTotals,recipeServings,finalizeShoppingList,adjustQuantity,countSelections,planKey,countSelectedPeople,mergeGeneratedWeekBatches,scaleRecipeIngredients,shoppingEntries,recipePickerMarkup,ingredientKey,isIngredientSuppressed,hasUppercaseLetter,isCatalogIngredientValid};
})();
