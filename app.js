/* Courses — PWA locale : recettes, catégories, fiches PDF et liste, sans service distant. */
(() => {
  'use strict';
  // Exceptions de singularisation : entrées invariantes et formes irrégulières à examiner.
  const INGREDIENT_PLURAL_EXCEPTIONS = {
    invariant: ['radis','maïs','mais','ananas','pois','riz','noix','jus','cresson','gras','oeuf','boeuf'],
    irregular: { 'oeufs':'oeuf', 'choux':'chou', 'boeufs':'boeuf' },
    aliases: { 'œuf':'oeuf', 'œufs':'oeuf', 'bœuf':'boeuf', 'bœufs':'boeuf' },
    regular: ['fenouil','épinard/épinards','tamarin','sucre']
  };
  const DEFAULT_CATEGORIES = ['Sodas & alcools','Épicerie sucrée','Produits secs','Épices','Frais','Viandes et poissons','Fruits','Légumes','Rayon BIO',"Produits d'entretien",'Hygiène','Surgelés','Rayon asiatique','Sauce','Autres','Autres produits','Sans catégories','Pharmacie Lafayette'];
  const STORE_FILTERS = {
    'Auchan St Cyprien':['Fruits','Légumes','Viandes et poissons','Hygiène',"Produits d'entretien",'Rayon asiatique','Épicerie sucrée','Épices','Produits secs','Rayon BIO','Sodas & alcools','Frais','Surgelés','Sans catégories'],
    'Auchan Balma':['Sodas & alcools','Épicerie sucrée','Produits secs','Épices','Frais','Viandes et poissons','Fruits','Légumes','Rayon asiatique',"Produits d'entretien",'Hygiène','Rayon BIO','Surgelés','Sans catégories'],
    'Intermarché':['Fruits','Légumes','Sodas & alcools','Viandes et poissons','Frais','Surgelés','Hygiène',"Produits d'entretien",'Épicerie sucrée','Rayon asiatique','Produits secs','Épices','Rayon BIO','Sans catégories'],
    'Épicerie asiatique':['Sauce','Autres'],
    'Pharmacie Lafayette':['Hygiène','Rayon BIO','Autres produits']
  };
  const INGREDIENT_CATALOG = [{"name":"savon","categories":["Hygiène"],"months":[]},{"name":"rasoirs","categories":["Hygiène"],"months":[]},{"name":"gel douche","categories":["Hygiène"],"months":[]},{"name":"shampoing","categories":["Hygiène"],"months":[]},{"name":"mousse à raser","categories":["Hygiène"],"months":[]},{"name":"coton tige","categories":["Hygiène"],"months":[]},{"name":"coton démaquillant","categories":["Hygiène"],"months":[]},{"name":"alcool désinfectant","categories":["Hygiène"],"months":[]},{"name":"déodorant","categories":["Hygiène"],"months":[]},{"name":"nettoyant visage","categories":["Hygiène"],"months":[]},{"name":"crème visage","categories":["Hygiène"],"months":[]},{"name":"huile cheveux","categories":["Hygiène"],"months":[]},{"name":"dentifrice","categories":["Hygiène"],"months":[]},{"name":"brosse à dent","categories":["Hygiène"],"months":[]},{"name":"éponges ménage","categories":["Produits d'entretien"],"months":[]},{"name":"gants de ménage","categories":["Produits d'entretien"],"months":[]},{"name":"serviettes hygiéniques","categories":["Hygiène"],"months":[]},{"name":"papier toilette","categories":["Hygiène"],"months":[]},{"name":"nettoyant toilette","categories":["Produits d'entretien"],"months":[]},{"name":"protège slip","categories":["Hygiène"],"months":[]},{"name":"lingettes toilettes","categories":["Hygiène"],"months":[]},{"name":"huile d’olive","categories":["Produits secs"],"months":[]},{"name":"huile de tournesol","categories":["Produits secs"],"months":[]},{"name":"vinaigre de cidre","categories":["Produits secs"],"months":[]},{"name":"huile de sésame","categories":["Rayon asiatique","Autres"],"months":[]},{"name":"liquide vaiselle","categories":["Produits d'entretien"],"months":[]},{"name":"éponges vaiselle","categories":["Produits d'entretien"],"months":[]},{"name":"lingettes poussière","categories":["Produits d'entretien"],"months":[]},{"name":"savon noir","categories":["Produits d'entretien"],"months":[]},{"name":"lessive","categories":["Produits d'entretien"],"months":[]},{"name":"sel","categories":["Épices"],"months":[]},{"name":"poivre en poudre","categories":["Épices"],"months":[]},{"name":"poivre en grains","categories":["Épices"],"months":[]},{"name":"thym","categories":["Épices"],"months":[]},{"name":"gingembre en poudre","categories":["Épices"],"months":[]},{"name":"mouchoirs","categories":["Hygiène"],"months":[]},{"name":"sopalin","categories":["Hygiène"],"months":[]},{"name":"nettoyant vitre","categories":["Produits d'entretien"],"months":[]},{"name":"paprika","categories":["Épices"],"months":[]},{"name":"curcuma","categories":["Épices"],"months":[]},{"name":"herbes de provence","categories":["Épices"],"months":[]},{"name":"paprika fumé","categories":["Épices"],"months":[]},{"name":"oignons en poudre","categories":["Épices"],"months":[]},{"name":"ail semoule","categories":["Épices"],"months":[]},{"name":"sac poubelle","categories":["Produits d'entretien"],"months":[]},{"name":"piles","categories":["Sans catégories"],"months":[]},{"name":"miel","categories":["Épicerie sucrée"],"months":[]},{"name":"beurre de cacahouète","categories":["Rayon BIO"],"months":[]},{"name":"crème sésame noir","categories":["Rayon BIO"],"months":[]},{"name":"sirop d’érable","categories":["Épicerie sucrée"],"months":[]},{"name":"thé","categories":["Rayon BIO"],"months":[]},{"name":"tisane","categories":["Rayon BIO"],"months":[]},{"name":"café","categories":["Rayon BIO"],"months":[]},{"name":"cacao","categories":["Épicerie sucrée"],"months":[]},{"name":"nutella","categories":["Épicerie sucrée"],"months":[]},{"name":"pâte à tartiner","categories":["Épicerie sucrée"],"months":[]},{"name":"fond de veau","categories":["Épices"],"months":[]},{"name":"pois chiche","categories":["Produits secs"],"months":[]},{"name":"haricots rouge","categories":["Produits secs"],"months":[]},{"name":"riz","categories":["Produits secs"],"months":[]},{"name":"riz rond","categories":["Produits secs"],"months":[]},{"name":"pâte","categories":["Produits secs"],"months":[]},{"name":"feuille de riz","categories":["Rayon asiatique","Autres"],"months":[]},{"name":"noix du brésil","categories":["Produits secs"],"months":[]},{"name":"sésame noir","categories":["Rayon BIO"],"months":[]},{"name":"cacahouète","categories":["Produits secs"],"months":[]},{"name":"flocons d’avoine","categories":["Produits secs"],"months":[]},{"name":"graine de courge","categories":["Rayon BIO"],"months":[]},{"name":"graine de chia","categories":["Rayon BIO"],"months":[]},{"name":"pain burger","categories":["Épicerie sucrée"],"months":[]},{"name":"chocolat noir (sel)","categories":["Épicerie sucrée"],"months":[]},{"name":"lentilles corail","categories":["Produits secs"],"months":[]},{"name":"lentilles vertes","categories":["Produits secs"],"months":[]},{"name":"film étirable","categories":["Produits d'entretien"],"months":[]},{"name":"papier cuisson","categories":["Produits d'entretien"],"months":[]},{"name":"sacs de congélation","categories":["Produits d'entretien"],"months":[]},{"name":"farine","categories":["Produits secs"],"months":[]},{"name":"sucre","categories":["Épicerie sucrée"],"months":[]},{"name":"maïzena","categories":["Produits secs"],"months":[]},{"name":"cassonade","categories":["Épicerie sucrée"],"months":[]},{"name":"eau gazeuse","categories":["Sodas & alcools"],"months":[]},{"name":"bière","categories":["Sodas & alcools"],"months":[]},{"name":"œufs","categories":["Frais"],"months":[]},{"name":"lait","categories":["Frais"],"months":[]},{"name":"lait d’avoine","categories":["Frais"],"months":[]},{"name":"sauce soja salée","categories":["Rayon asiatique","Sauce"],"months":[]},{"name":"sauce soja sucrée","categories":["Rayon asiatique","Sauce"],"months":[]},{"name":"ail en poudre","categories":["Épices"],"months":[]},{"name":"piment d’espelette","categories":["Épices"],"months":[]},{"name":"bouillon de légumes","categories":["Épices"],"months":[]},{"name":"concentré de tomate","categories":["Produits secs"],"months":[]},{"name":"oignon jaune","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"citron","categories":["Fruits"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"haricots à la tomate","categories":["Produits secs"],"months":[]},{"name":"pesto","categories":["Produits secs"],"months":[]},{"name":"épinards surgelés","categories":["Surgelés"],"months":[]},{"name":"tomates cerises","categories":["Légumes"],"months":["Mai","Juin","Juillet","Août","Septembre","Octobre"]},{"name":"beurre","categories":["Frais"],"months":[]},{"name":"chocolat noir","categories":["Épicerie sucrée"],"months":[]},{"name":"sel de guérande","categories":["Produits secs"],"months":[]},{"name":"hauts de cuisses de poulet","categories":["Viandes et poissons"],"months":[]},{"name":"ail","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"gingembre frais","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"piment asiatique","categories":["Rayon asiatique","Autres"],"months":[]},{"name":"crevettes surgelées","categories":["Surgelés"],"months":[]},{"name":"cébette","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"vinaigre de riz","categories":["Rayon asiatique","Sauce"],"months":[]},{"name":"huile neutre","categories":["Produits secs"],"months":[]},{"name":"poivre","categories":["Épices"],"months":[]},{"name":"betterave","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"carotte","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"céleri","categories":["Légumes"],"months":["Janvier","Février"]},{"name":"chou","categories":["Légumes"],"months":["Janvier","Mars","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"chou rouge","categories":["Légumes"],"months":["Janvier","Février","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"courge","categories":["Légumes"],"months":["Janvier","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"endive","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Octobre","Novembre","Décembre"]},{"name":"épinard","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"salade","categories":["Légumes"],"months":["Janvier"]},{"name":"navet","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Octobre","Novembre","Décembre"]},{"name":"oignon","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"poireau","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Septembre","Octobre","Novembre","Décembre"]},{"name":"pomme de terre","categories":["Légumes"],"months":["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"clémentine","categories":["Fruits"],"months":["Janvier","Février","Novembre","Décembre"]},{"name":"kaki","categories":["Fruits"],"months":["Janvier","Octobre","Novembre","Décembre"]},{"name":"kiwi","categories":["Fruits"],"months":["Janvier","Février","Mars","Novembre","Décembre"]},{"name":"mandarine","categories":["Fruits"],"months":["Janvier","Février","Novembre","Décembre"]},{"name":"orange","categories":["Fruits"],"months":["Janvier","Février","Mars","Novembre","Décembre"]},{"name":"pamplemousse","categories":["Fruits"],"months":["Janvier","Février","Mars","Avril","Mai","Juin"]},{"name":"poire","categories":["Fruits"],"months":["Janvier","Février","Mars","Avril","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"pomme","categories":["Fruits"],"months":["Janvier","Février","Mars","Avril","Juin","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"mâche","categories":["Légumes"],"months":["Février","Novembre","Décembre"]},{"name":"radis","categories":["Légumes"],"months":["Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"]},{"name":"topinambour","categories":["Légumes"],"months":["Février","Mars","Octobre","Novembre","Décembre"]},{"name":"asperge","categories":["Légumes"],"months":["Mars","Avril","Mai","Juin","Juillet"]},{"name":"artichaut","categories":["Légumes"],"months":["Avril","Mai","Juin","Juillet","Août","Septembre"]},{"name":"concombre","categories":["Légumes"],"months":["Avril","Mai","Juin","Juillet","Août","Septembre","Octobre"]},{"name":"laitue","categories":["Légumes"],"months":["Avril","Mai","Juin","Juillet","Août","Septembre","Octobre"]},{"name":"petit pois","categories":["Légumes"],"months":["Avril","Mai","Juin","Juillet"]},{"name":"aubergine","categories":["Légumes"],"months":["Mai","Juin","Juillet","Août","Septembre","Octobre"]},{"name":"courgette","categories":["Légumes"],"months":["Mai","Juin","Juillet","Août","Septembre","Octobre"]},{"name":"cerise","categories":["Fruits"],"months":["Mai","Juin","Juillet"]},{"name":"fraise","categories":["Fruits"],"months":["Mai","Juin","Juillet","Août"]},{"name":"tomate","categories":["Légumes"],"months":["Mai","Juin","Juillet","Août","Septembre","Octobre"]},{"name":"brocoli","categories":["Légumes"],"months":["Juin","Juillet","Août","Septembre","Octobre","Novembre"]},{"name":"fenouil","categories":["Légumes"],"months":["Juin","Juillet","Août","Septembre","Octobre","Novembre"]},{"name":"haricot vert","categories":["Légumes"],"months":["Juin","Juillet","Août","Septembre","Octobre"]},{"name":"poivron","categories":["Légumes"],"months":["Juin","Juillet","Août","Septembre"]},{"name":"abricot","categories":["Fruits"],"months":["Juin","Juillet","Août"]},{"name":"cassis","categories":["Fruits"],"months":["Juin","Juillet","Août"]},{"name":"framboise","categories":["Fruits"],"months":["Juin","Juillet","Août","Octobre"]},{"name":"groseille","categories":["Fruits"],"months":["Juin","Juillet","Août"]},{"name":"melon","categories":["Fruits"],"months":["Juin","Juillet","Août","Septembre"]},{"name":"pastèque","categories":["Fruits"],"months":["Juin","Juillet","Août","Septembre"]},{"name":"pêche","categories":["Fruits"],"months":["Juin","Juillet","Août","Septembre"]},{"name":"prune","categories":["Fruits"],"months":["Juin","Juillet","Août","Septembre"]},{"name":"figue","categories":["Fruits"],"months":["Juillet","Août","Septembre","Octobre"]},{"name":"myrtille","categories":["Fruits"],"months":["Juillet","Août","Septembre","Octobre"]},{"name":"nectarine","categories":["Fruits"],"months":["Juillet","Août"]},{"name":"mûre","categories":["Fruits"],"months":["Août","Septembre"]},{"name":"raisin","categories":["Fruits"],"months":["Août","Septembre","Octobre"]},{"name":"patate douce","categories":["Légumes"],"months":["Septembre","Octobre"]},{"name":"potiron","categories":["Légumes"],"months":["Septembre","Octobre","Novembre","Décembre"]},{"name":"echalote","categories":["Légumes"],"months":["Octobre","Novembre","Décembre"]},{"name":"châtaigne","categories":["Fruits"],"months":["Octobre","Novembre","Décembre"]},{"name":"citrouille","categories":["Légumes"],"months":["Novembre"]},{"name":"steak hachée","categories":["Viandes et poissons"],"months":[]},{"name":"bavette","categories":["Viandes et poissons"],"months":[]},{"name":"saumon","categories":["Viandes et poissons"],"months":[]},{"name":"sardines","categories":["Produits secs"],"months":[]},{"name":"chips","categories":["Produits secs"],"months":[]},{"name":"fromage","categories":["Frais"],"months":[]},{"name":"raclette","categories":["Frais"],"months":[]},{"name":"skyr","categories":["Frais"],"months":[]},{"name":"crème fraiche","categories":["Frais"],"months":[]},{"name":"madame loïc","categories":["Frais"],"months":[]},{"name":"fleur d’oranger","categories":["Produits secs"],"months":[]},{"name":"mont d’or","categories":["Frais"],"months":[]},{"name":"lardons","categories":["Frais"],"months":[]},{"name":"pâtes fraiches","categories":["Frais"],"months":[]},{"name":"huile de colza","categories":["Produits secs"],"months":[]}];
  const CATALOG_MONTHS = ['janvier','fevrier','mars','avril','mai','juin','juillet','aout','septembre','octobre','novembre','decembre'];
  const MONTH_LABELS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
  // null = mode automatique (mois courant du téléphone), conservé uniquement en mémoire vive.
  let selectedSeasonMonth = null;
  const CSV_COLUMNS = ['recette','moment','ingredient','quantite','unite','categorie','ordre'];
  const SERVINGS_COLUMN = 'repas';
  const APP_VERSION = 40;
  const MARGIN = 80;
  let recipeGroupOpen = {};
  let quickIngredients = [];
  const MOMENTS = ['matin','midi','gouter','soir'];
  const canonicalMoment = value => { const m=norm(value).replace(/\s+/g,' '); return ['gouter et dessert','gouter/dessert','gouter dessert'].includes(m)?'gouter':m; };
  const UNITES = ['','g','kg','ml','l','u','cas','cac','gousse'];
  const $ = (s, root=document) => root.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm = s => String(s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLocaleLowerCase('fr');
  const singularizeIngredientWord = word => {
    const lower=String(word||'').toLocaleLowerCase('fr');
    const plain=lower.replace(/œ/g,'oe').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(INGREDIENT_PLURAL_EXCEPTIONS.aliases[lower]) return INGREDIENT_PLURAL_EXCEPTIONS.aliases[lower];
    if(INGREDIENT_PLURAL_EXCEPTIONS.irregular[plain]) return INGREDIENT_PLURAL_EXCEPTIONS.irregular[plain];
    if(INGREDIENT_PLURAL_EXCEPTIONS.invariant.includes(plain)) return plain;
    if(plain.endsWith('(s)')) return plain.slice(0,-3);
    return plain.length>3&&/[sx]$/.test(plain)?plain.slice(0,-1):plain;
  };
  const normalizeIngredient = value => {
    const raw=String(value??'').toLocaleLowerCase('fr').trim().replace(/\s+/g,' ').replace(/\s*\(s\)\s*$/i,'');
    return raw.split(' ').filter(Boolean).map((word,index)=>{
      const plain=word.replace(/œ/g,'oe').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
      // Les particules ne sont pas des noms/adjectifs pluriels.
      return ['de','du','des','d','à','au','aux','en','et'].includes(plain)?plain:singularizeIngredientWord(word);
    }).join(' ');
  };
  const catalogIngredient = name => INGREDIENT_CATALOG.find(x=>normalizeIngredient(x.name)===normalizeIngredient(name))||null;
  function monthPillsMarkup(selectedMonth=null,phoneMonth=new Date().getMonth()) { const selected=selectedMonth===null?phoneMonth:selectedMonth; return `<div class=\"month-pills\" role=\"group\" aria-label=\"Choisir un mois\">${MONTH_LABELS.map((month,index)=>`<button type=\"button\" class=\"month-pill ${index===selected?'selected':''}\" data-season-month data-month=\"${index}\" aria-label=\"${month}\" aria-pressed=\"${index===selected?'true':'false'}\">${month[0]}</button>`).join('')}</div>`; }
  const hasUppercaseLetter = value => /\p{Lu}/u.test(String(value ?? ''));
  const isCatalogIngredientValid = value => /^[\p{Ll}\p{M} '\-’]+$/u.test(String(value ?? '').trim());
  const ingredientKey = (category, name) => `${norm(category)}|${normalizeIngredient(name)}`;
  const isIngredientSuppressed = (suppressed, category, name) => !!(suppressed?.[ingredientKey(category,name)]||suppressed?.[`${norm(category)}|${norm(name)}`]);
  const storeCategoryKey = name => {let key=norm(name).replace(/\s+et\s+/g,' & ').replace(/\s*&\s*/g,' & ').replace(/\s+/g,' ').trim();if(key==='epicerie asiatique'||key==='rayon asiatique')key='rayon asiatique';if(['fruits','legumes','fruits & legumes'].includes(key))key='fruits & legumes';if(key==='viandes et poissons')key='viandes & poissons';return key;};
  const activeSeasonMonth = () => selectedSeasonMonth ?? new Date().getMonth();
  const ingredientIsInSeason = (name, month=activeSeasonMonth()) => {const item=catalogIngredient(name);return !item||!item.months.length||item.months.some(m=>norm(m)===CATALOG_MONTHS[month]);};
  function orderedStoreCategories(categories,store,orders={}){const wanted=STORE_FILTERS[store]||STORE_FILTERS['Auchan St Cyprien'],matches=wanted.map(label=>categories.find(c=>norm(c.name)===norm(label))||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(label))).filter((c,i,a)=>c&&a.findIndex(x=>x.id===c.id)===i),saved=(orders[store]||[]).map(id=>matches.find(c=>c.id===id)).filter(Boolean),ordered=[...saved,...matches.filter(c=>!saved.some(x=>x.id===c.id))];const spice=ordered.findIndex(c=>norm(c.name)==='epices'),dry=ordered.findIndex(c=>norm(c.name)==='produits secs');if(spice>=0&&dry>=0){const item=ordered.splice(spice,1)[0],newDry=ordered.findIndex(c=>norm(c.name)==='produits secs');ordered.splice(newDry+(store==='Auchan St Cyprien'?0:1),0,item);}const uncategorized=ordered.findIndex(c=>norm(c.name)==='sans categories');if(uncategorized>=0)ordered.push(ordered.splice(uncategorized,1)[0]);return ordered;}
  function applyIngredientCatalog(categories){const byName=new Map(categories.map(c=>[norm(c.name),c]));let legacyFruit=byName.get('fruits et legumes');if(legacyFruit&&!byName.has('legumes')){legacyFruit.name='Légumes';byName.set('legumes',legacyFruit);byName.delete('fruits et legumes');}const catalogCategoryKeys=new Set(INGREDIENT_CATALOG.flatMap(x=>x.categories).map(norm));categories.forEach(c=>{if(catalogCategoryKeys.has(norm(c.name)))c.ingredients=[];});for(const item of INGREDIENT_CATALOG){for(const label of item.categories){let cat=byName.get(norm(label))||(!['fruits','legumes'].includes(norm(label))?categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(label)):null);if(!cat){cat={id:`catalog-${norm(label).replace(/[^a-z0-9]+/g,'-')}`,name:label,order:categories.length,ingredients:[]};while(categories.some(x=>x.id===cat.id))cat.id+=`-${categories.length}`;categories.push(cat);byName.set(norm(label),cat);}if(!cat.ingredients.some(x=>normalizeIngredient(x)===normalizeIngredient(item.name)))cat.ingredients.push(item.name);}}return categories;}
  function seasonalIngredientsForCategories(categories,month=activeSeasonMonth()){return categories.flatMap(c=>c.ingredients.filter(n=>ingredientIsInSeason(n,month)).map(n=>({category:c,name:n})));}
  function ensureCatalogCategories(categories){
    for(const label of new Set(INGREDIENT_CATALOG.flatMap(item=>item.categories))){
      let cat=categories.find(c=>norm(c.name)===norm(label))||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(label));
      if(!cat){cat={id:`catalog-${norm(label).replace(/[^a-z0-9]+/g,'-')}`,name:label,order:categories.length,ingredients:[]};while(categories.some(x=>x.id===cat.id))cat.id+=`-${categories.length}`;categories.push(cat);}
    }
    return categories;
  }
  function enrichItemCatalogCategories(item,categories){
    const entry=catalogIngredient(item?.name);if(!entry)return false;
    const ids=[...new Set([...splitCategories(item.categories),...splitCategories(item.category)])], resolved=entry.categories.map(label=>categories.find(c=>norm(c.name)===norm(label))?.id||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(label))?.id).filter(Boolean);
    const merged=[...new Set([...ids,...resolved])],changed=merged.length!==itemCategoryIds(item).length||!Array.isArray(item.categories)||ids.length!==itemCategoryIds(item).length;
    if(changed)item.categories=merged;
    if(!item.category&&merged.length)item.category=merged[0];
    return changed;
  }
  function resolvedStoreCategory(item,categories,store){
    const available=itemCategoryIds(item),wanted=STORE_FILTERS[store]||[];
    for(const label of wanted){const hit=available.find(id=>{const cat=categories.find(c=>c.id===id)||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(id));return cat&&storeCategoryKey(cat.name)===storeCategoryKey(label);});if(hit)return (categories.find(c=>c.id===hit)||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(hit)))?.id||hit;}
    const fallbackLabels=['Autres','Autres produits','Sans catégories'];
    for(const label of fallbackLabels){if(!wanted.some(w=>storeCategoryKey(w)===storeCategoryKey(label)))continue;const fallback=categories.find(c=>norm(c.name)===norm(label));if(fallback)return fallback.id;}
    return '';
  }
  function syncCatalogMembership(){
    const categoryCount=state.categories.length;
    state.categories=ensureCatalogCategories(state.categories);
    const categoriesChanged=state.categories.length!==categoryCount;
    let recipesChanged=false,listChanged=false;
    state.recipes.forEach(r=>(r.ingredients||[]).forEach(i=>{if(enrichItemCatalogCategories(i,state.categories))recipesChanged=true;}));
    state.list.forEach(i=>{if(enrichItemCatalogCategories(i,state.categories))listChanged=true;});
    if(db){if(recipesChanged)replaceStore('recipes',state.recipes).catch(()=>{});if(listChanged)replaceStore('list',state.list).catch(()=>{});if(categoriesChanged)replaceStore('categories',state.categories).catch(()=>{});}
  }

  const splitCategories = value => [...new Set((Array.isArray(value)?value:String(value??'').split('|')).map(x=>String(x??'').trim()).filter(Boolean))];
  const itemCategoryIds = item => splitCategories(item?.categories?.length?item.categories:item?.category);
  function preferredStoreCategory(ids,categories,store=activeStore){const available=splitCategories(ids);const wanted=STORE_FILTERS[store]||[];for(const label of wanted){const hit=available.find(id=>{const cat=categories.find(c=>c.id===id)||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(id));return cat&&storeCategoryKey(cat.name)===storeCategoryKey(label);});if(hit)return (categories.find(c=>c.id===hit)||categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(hit)))?.id||hit;}const fallback=categories.find(c=>norm(c.name)==='sans categories');return fallback?.id||available[0]||'';}
  function resolvedItemCategory(item,store=activeStore){return resolvedStoreCategory(item,state.categories,store);}
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
  function recipeSignature(r){return JSON.stringify({moments:[...(r.moments||[])].sort(),servings:recipeServings(r),ingredients:(r.ingredients||[]).map(i=>[normalizeIngredient(i.name),String(i.quantity??''),norm(i.unit),splitCategories(i.categories?.length?i.categories:i.category).map(norm).sort()])});}
  function reconcileRecipes(existing,incoming){const next=existing.map(r=>({...r,ingredients:(r.ingredients||[]).map(i=>({...i})),moments:[...(r.moments||[])]}));let added=0,updated=0,unchanged=0;for(const fresh of incoming){const old=next.find(r=>norm(r.name)===norm(fresh.name));if(!old){next.push({...fresh,id:fresh.id||uid()});added++;}else if(recipeSignature(old)!==recipeSignature(fresh)){Object.assign(old,fresh);updated++;}else unchanged++;}return {recipes:next,added,updated,unchanged};}
  function canonicalUnit(unit){const u=norm(unit);return ['kg','g'].includes(u)?'g':['l','ml'].includes(u)?'ml':u;}
  function recipeServings(recipe){const n=qtyNum(recipe?.servings);return n!==null&&n>=1?n:1;}
  function adjustQuantity(quantity,people,servings=1){const value=qtyNum(quantity);return value===null?String(quantity||''):String(value*Number(people||1)/Math.max(1,Number(servings)||1)).replace('.',',');}
  function mergeListItem(list, source, multiplier=1, keepUnitlessQuantity=false) {
    let name=String(source.name||'').trim();if(!name)return;
    let unit=norm(source.unit), q=qtyNum(source.quantity);
    if(['cas','cac'].includes(unit))q=null;
    const value=q===null?'':String(q*multiplier), categories=itemCategoryIds(source), category=String(source.category||categories[0]||'');
    const sourceQuick=categories.includes('__quick__');const catalog=catalogIngredient(name),displayName=catalog?.name||name;if(catalog){name=displayName;}const found=list.find(x=>(itemCategoryIds(x).includes('__quick__')===sourceQuick)&&normalizeIngredient(x.name)===normalizeIngredient(name)&&norm(x.unit)===unit);
    if(found){if(value!=='') found.quantity=String((qtyNum(found.quantity)||0)+(Number(value)||0));found.categories=[...new Set([...itemCategoryIds(found),...categories])];if(catalog)found.name=catalog.name;return;}
    const catalogMatch=catalogIngredient(name);list.push({id:uid(),name:catalogMatch?.name||name,quantity:value,unit,category,categories,checked:false});
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
      const sortedGroups=[...groups.entries()].sort((a,b)=>a[0]-b[0]), hasSingleGroup=sortedGroups.length===1;
      const html=sortedGroups.map(([n,dates])=>{
        const list=rs.length?rs.map(r=>{const k=planKey(meal,n,r.id);return recipeRow(r,k,Number(planned[k])||0);}).join(''):'<p class="muted">Aucune recette pour ce moment.</p>';
        if(n===1)return `<div class="recipe-group-one"><div class="recipe-checklist">${list}</div></div>`;
        const groupKey=`${meal}|${n}`,open=recipeGroupOpen[groupKey]??hasSingleGroup;
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
    if(typeof module!=='undefined')module.exports={DEFAULT_CATEGORIES,STORE_FILTERS,INGREDIENT_CATALOG,ensureCatalogCategories,enrichItemCatalogCategories,resolvedStoreCategory,INGREDIENT_PLURAL_EXCEPTIONS,normalizeIngredient,monthPillsMarkup,storeCategoryKey,orderedStoreCategories,applyIngredientCatalog,ingredientIsInSeason,seasonalIngredientsForCategories,splitCategories,itemCategoryIds,preferredStoreCategory,CSV_COLUMNS,parseCSV,validateCSV,canonicalMoment,recipeSignature,reconcileRecipes,mergeListItem,displayQty,norm,qtyNum,recipeServings,mealTotals,finalizeShoppingList,adjustQuantity,countSelections,planKey,countSelectedPeople,mergeGeneratedWeekBatches,scaleRecipeIngredients,shoppingEntries,recipePickerMarkup,ingredientKey,isIngredientSuppressed,hasUppercaseLetter,isCatalogIngredientValid};
    return;
  }
  const view=$('#view'), toast=$('#toast'); let db, state={recipes:[],categories:[],pdfs:[],list:[]}, tab='list', modalOpen=false, workflow=null, monthCursor=new Date(new Date().getFullYear(),new Date().getMonth(),1), days=new Map(), selectedCounts={}, plannedMeals={}, peopleBySlot={}, reviewEntries=[], reviewChecks={}, recipeChecked={};
  let activeStore='Auchan St Cyprien',storeCategoryOrders={};
  try{const saved=JSON.parse(localStorage.getItem('courses-active-store-v1')||'null');if(STORE_FILTERS[saved])activeStore=saved;}catch{}
  try{storeCategoryOrders=JSON.parse(localStorage.getItem('courses-category-orders-v1')||'{}')||{};}catch{storeCategoryOrders={};}
  try{recipeChecked=JSON.parse(localStorage.getItem('courses-week-recipes-checked-v1')||'{}')||{};}catch{recipeChecked={};}
  try{const savedDays=JSON.parse(localStorage.getItem('courses-week-days-v1')||'[]');if(Array.isArray(savedDays))days=new Map(savedDays.sort(([a],[b])=>a.localeCompare(b)));}catch{}
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
  function storeCategories(store=activeStore){return orderedStoreCategories(state.categories,store,storeCategoryOrders);}
  function storeCategoryLabel(cat,store=activeStore){if(['fruits','legumes','fruits & legumes'].includes(storeCategoryKey(cat.name)))return 'Fruits et légumes';return (STORE_FILTERS[store]||[]).find(label=>storeCategoryKey(label)===storeCategoryKey(cat.name))||cat.name;}
  function saveStoreOrders(){try{localStorage.setItem('courses-category-orders-v1',JSON.stringify(storeCategoryOrders));}catch{}}
  function storeFilterControl(){return `<label class="store-filter"><span>Magasin</span><select data-store-filter aria-label="Filtrer par magasin">${Object.keys(STORE_FILTERS).map(name=>`<option value="${esc(name)}" ${name===activeStore?'selected':''}>${esc(name)}</option>`).join('')}</select></label>`;}
  function seasonMonthControl(){return monthPillsMarkup(selectedSeasonMonth,new Date().getMonth());}
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
        if(!isIngredientSuppressed(suppressedIngredients,cat.name,i.name)&&!cat.ingredients.some(x=>normalizeIngredient(x)===normalizeIngredient(i.name)))cat.ingredients.push(i.name);
      }
    }));
    state.list.forEach(i=>{
      if(!Array.isArray(i.categories)){i.categories=splitCategories(i.category);listMigrated=true;}
      migratePharmacyMembership(i,'list');
    });
    let catalogVersion=0;try{catalogVersion=Number(localStorage.getItem('courses-ingredient-catalog-version')||0);}catch{}
    if(catalogVersion<1){
      state.categories=applyIngredientCatalog(state.categories);
      const attachCatalogCategories=item=>{const entry=catalogIngredient(item.name);if(!entry)return false;const ids=itemCategoryIds(item);let changed=false;const resolved=entry.categories.map(label=>state.categories.find(c=>norm(c.name)===norm(label))?.id).filter(Boolean);if(resolved.length&&!resolved.some(id=>ids.includes(id))){item.categories=[...new Set([...ids,...resolved])];item.category=item.category||resolved[0];changed=true;}return changed;};
      state.recipes.forEach(r=>(r.ingredients||[]).forEach(i=>{if(attachCatalogCategories(i))recipesMigrated=true;}));
      state.list.forEach(i=>{if(attachCatalogCategories(i))listMigrated=true;});
      try{localStorage.setItem('courses-ingredient-catalog-version','1');}catch{}
    }
    state.categories=ensureCatalogCategories(state.categories);
    state.recipes.forEach(r=>(r.ingredients||[]).forEach(i=>{if(enrichItemCatalogCategories(i,state.categories))recipesMigrated=true;}));
    state.list.forEach(i=>{if(enrichItemCatalogCategories(i,state.categories))listMigrated=true;});
    await Promise.all([replaceStore('categories',state.categories),recipesMigrated?replaceStore('recipes',state.recipes):Promise.resolve(),listMigrated?replaceStore('list',state.list):Promise.resolve()]);
  }
  function say(msg){toast.textContent=msg;toast.classList.add('show');clearTimeout(say.t);say.t=setTimeout(()=>toast.classList.remove('show'),3000);}
  function ingredientFieldKind(input){const form=input?.form;return form?.dataset.form==='catalog'?'catalog':form?.dataset.form==='list-add'||form?.dataset.form==='manual-add'?'lowercase':null;}
  function ingredientFieldValid(kind,value){return kind==='catalog'?isCatalogIngredientValid(value):!hasUppercaseLetter(value);}
  // Valider au moment de l’ajout, jamais pendant l’édition, pour autoriser l’effacement intégral.
  function focusWithoutScroll(input){if(!input)return;try{input.focus({preventScroll:true});}catch{input.focus();}}
  function rejectField(input,message){input.classList.add('input-invalid');clearTimeout(input.invalidTimer);input.invalidTimer=setTimeout(()=>input.classList.remove('input-invalid'),1800);say(message);focusWithoutScroll(input);}
  function saveWindowScroll(){const root=document.scrollingElement,containers=[...document.querySelectorAll('#view,[data-scroll-container]')].map((el,index)=>({index,top:el.scrollTop,left:el.scrollLeft}));return {left:window.scrollX,top:window.scrollY,rootTop:root?.scrollTop||0,rootLeft:root?.scrollLeft||0,containers};}
  function page(title,subtitle,html,scrollPosition=null,headerAction=''){const keepScroll=!!workflow&&['calendar','recipes','review','manual'].includes(workflow.screen),restorePosition=scrollPosition||(keepScroll?saveWindowScroll():null);document.body.classList.toggle('workflow-active',keepScroll);view.dataset.page=norm(title);const nav=keepScroll?(workflow.screen==='manual'?'<div class="workflow-nav manual-workflow-nav"><button type="button" data-action="manual-close" aria-label="Fermer sans enregistrer">✕</button></div>':'<div class="workflow-nav"><button type="button" data-action="workflow-back" aria-label="Retour">‹</button><button type="button" data-action="workflow-close" aria-label="Fermer le parcours">✕</button></div>'):'';const heading=headerAction?`<h1>${esc(title)}</h1><div class="recipes-header-action">${headerAction}</div>`:`<h1>${esc(title)}</h1>`;view.innerHTML=`<header class="page-head${keepScroll?' workflow-head':''}${headerAction?' recipes-page-head':''}">${nav}${subtitle?`<p>${esc(subtitle)}</p>`:''}${heading}</header>${html}<footer class="app-version">version ${APP_VERSION}</footer>`;view.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea').forEach(input=>{if(input.tagName==='INPUT'&&!input.matches('[type=number]')){input.type='text';if(input.matches('[data-form=quick-add] input,[data-quick-entry],[data-form=list-add] input,[data-form=catalog] input,.manual-add-form input'))input.type='search';input.name=`field-${Math.random().toString(36).slice(2,10)}`;input.setAttribute('inputmode','text');input.setAttribute('enterkeyhint','done');}input.setAttribute('autocomplete','off');input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');input.setAttribute('spellcheck','false');input.setAttribute('data-lpignore','true');input.setAttribute('data-form-type','other');});if(['courses','liste de courses'].includes(norm(title))){window.scrollTo(0,0);document.querySelectorAll('#view .scroll-container,[data-scroll-container]').forEach(el=>{el.scrollTop=0;el.scrollLeft=0;});}else if(restorePosition){window.scrollTo({left:restorePosition.left||0,top:restorePosition.top||0,behavior:'instant'});const root=document.scrollingElement;if(root){root.scrollLeft=restorePosition.rootLeft??restorePosition.left??0;root.scrollTop=restorePosition.rootTop??restorePosition.top??0;}if(restorePosition.containers)restorePosition.containers.forEach(saved=>{const el=saved.index===0?$('#view'):document.querySelectorAll('[data-scroll-container]')[saved.index-1];if(el){el.scrollLeft=saved.left;el.scrollTop=saved.top;}});}else window.scrollTo(0,0);}
  function button(action,text,cls=''){return `<button class="button ${cls}" data-action="${action}">${text}</button>`;}
  function categoryName(value){return splitCategories(value).map(id=>state.categories.find(c=>c.id===id)?.name||id).join(' | ')||'Sans catégorie';}
  function renderImport(){page('Importer','RECETTES · CSV',`<section class="group"><label class="file-pick">Choisir un fichier CSV<input type="file" id="csv-file" accept=".csv,text/csv"></label><details class="csv-help"><summary>En savoir plus</summary><p class="hint">CSV UTF‑8 avec les colonnes recette,moment,ingredient,quantite,unite,categorie,ordre. La colonne facultative « repas » indique le nombre de personnes prévu (défaut : 1). Virgule ou point-virgule accepté. Séparez plusieurs catégories avec |. L’import est validé en entier avant toute modification.</p></details></section><section class="group"><h2>Mes recettes <span class="muted">${state.recipes.length}</span></h2>${state.recipes.length?state.recipes.map(r=>`<details class="recipe-entry"><summary><b>${esc(r.name)}</b><small>${(r.moments||[]).map(esc).join(' · ')} · ${r.ingredients.length} ingrédients</small><button class="text-button" data-action="delete-recipe" data-id="${esc(r.id)}" aria-label="Supprimer">Supprimer</button></summary><div>${r.ingredients.map(i=>`<p>${esc(i.name)} <span class="muted">${esc([i.quantity,i.unit,categoryName(i.category)].filter(Boolean).join(' · '))}</span></p>`).join('')}</div></details>`).join(''):'<p class="muted">Aucune recette importée.</p>'}</section><section class="group">${button('export-csv','Exporter des recettes','outline-violet')}</section>`);}
  function renderCategories(scrollPosition=null){page('Catégories','ORGANISATION',`${seasonMonthControl()}${storeFilterControl()}<section class="group category-list">${storeCategories().map(c=>{const ingredients=c.ingredients.filter(x=>ingredientIsInSeason(x));return `<article class="category-card" data-category-id="${esc(c.id)}"><div class="cat-head"><h2 class="category-title"><span class="drag-grip" aria-hidden="true">⠿</span><span class="category-name">${esc(c.name)}</span></h2><div class="category-actions"><button type="button" class="category-icon-btn rename-category" data-action="rename-cat" data-id="${esc(c.id)}" aria-label="Renommer ${esc(c.name)}" title="Renommer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L8 18l-4 1 1-4Z"/></svg></button><button type="button" class="category-icon-btn delete-category" data-action="delete-cat" data-id="${esc(c.id)}" aria-label="Supprimer ${esc(c.name)}" title="Supprimer">×</button></div></div><div class="chips">${ingredients.map(x=>`<span class="ingredient-chip"><span>${esc(x)}</span><button class="ingredient-delete" type="button" data-action="delete-ingredient" data-id="${esc(c.id)}" data-ingredient="${esc(x)}" aria-label="Supprimer ${esc(x)}" title="Supprimer ${esc(x)}">×</button></span>`).join('')||'<span class="muted">Aucun ingrédient</span>'}</div><div class="inline-form category-ingredient-form" data-form="catalog" data-id="${esc(c.id)}"><input name="name" placeholder="Ajouter un ingrédient" required aria-label="Ajouter un ingrédient dans ${esc(c.name)}" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off"></div></article>`;}).join('')}</section><p class="hint reorder-hint">Maintenez une catégorie environ une demi-seconde, puis faites-la glisser pour la déplacer.</p><div class="group inline-form" data-form="new-cat"><input name="name" placeholder="Nouvelle catégorie" required><button type="button" class="button category-add-button" data-action="new-cat-add" aria-label="Ajouter" title="Ajouter"></button></div>`,scrollPosition);}
  function pdfDisplayName(name){return String(name||'').replace(/\.pdf$/i,'');}
  function renderPdfs(){const sortedPdfs=[...state.pdfs].sort((a,b)=>pdfDisplayName(a.name).localeCompare(pdfDisplayName(b.name),'fr',{sensitivity:'base'}));page('Fiches','DOCUMENTS · STOCKAGE LOCAL',`<section class="group"><label class="file-pick">Importer un ou plusieurs PDF<input id="pdf-file" type="file" accept="application/pdf,.pdf" multiple></label><p class="hint">Les fichiers sont stockés localement dans IndexedDB.</p></section><section class="pdf-list">${sortedPdfs.length?sortedPdfs.map(f=>`<article class="pdf-card" data-pdf-row="${esc(f.id)}" data-action="open-pdf" data-id="${esc(f.id)}" role="button" tabindex="0" aria-label="Ouvrir ${esc(pdfDisplayName(f.name))}"><span class="pdf-name">${esc(pdfDisplayName(f.name))}</span><button class="pdf-icon-button" data-action="rename-pdf" data-id="${esc(f.id)}" aria-label="Renommer ${esc(pdfDisplayName(f.name))}" title="Renommer">✎</button><button class="pdf-icon-button pdf-cross" data-action="delete-pdf" data-id="${esc(f.id)}" aria-label="Supprimer ${esc(pdfDisplayName(f.name))}" title="Supprimer">✕</button></article>`).join(''):'<section class="group empty-state"><b>Aucune fiche PDF</b><p>Importez vos documents pour les retrouver ici.</p></section>'}</section>`);}
  function groupedList(){const map=new Map();state.list.forEach(x=>{const k=normalizeIngredient(x.name);if(!map.has(k))map.set(k,[]);map.get(k).push(x);});return map;}
  function renderList(scrollPosition=null){
    syncCatalogMembership();
    let body=''; const visible=storeCategories();
    const renderRows=(id,items,title)=>{if(!items.length)return '';return `<section class="list-group active-list-category" data-list-category="${esc(id)}"><h2 class="list-group-title">${esc(title||(state.categories.find(c=>c.id===id)?storeCategoryLabel(state.categories.find(c=>c.id===id)):categoryName(id)))}</h2>${items.map(i=>`<div class="shopping-row ${i.checked?'checked':''}" data-list-item="${esc(i.id)}" data-category="${esc(id)}"><input type="checkbox" data-action="toggle" data-id="${esc(i.id)}" ${i.checked?'checked':''} aria-label="Cocher ${esc(i.name)}"><span>${esc(i.name)}</span><small>${esc(displayQty(i))}</small></div>`).join('')}</section>`;};
    let visibleItemCount=0;
    const quickItems=state.list.filter(i=>itemCategoryIds(i).includes('__quick__'));visibleItemCount+=quickItems.length;body+=renderRows('__quick__',quickItems,'Saisie rapide');
    let fruitGroupDone=false;visible.forEach(cat=>{if(storeCategoryKey(cat.name)==='fruits & legumes'){if(fruitGroupDone)return;fruitGroupDone=true;const fruitCats=visible.filter(c=>storeCategoryKey(c.name)==='fruits & legumes'),items=state.list.filter(i=>!itemCategoryIds(i).includes('__quick__')&&fruitCats.some(c=>resolvedItemCategory(i)===c.id));visibleItemCount+=items.length;if(items.length)body+=renderRows(fruitCats[0].id,items,'Fruits et légumes');return;}const items=state.list.filter(i=>!itemCategoryIds(i).includes('__quick__')&&resolvedItemCategory(i)===cat.id);visibleItemCount+=items.length;if(items.length)body+=renderRows(cat.id,items,storeCategoryLabel(cat));});
    const emptyStoreMessage='<p class="list-empty-message">Aucun article dans ce magasin</p>';
    const emptyListMessage='<p class="list-empty-message">Aucune liste pour le moment</p>';
    const content=`${storeFilterControl()}${state.list.length?`<div class="list-actions"><div class="list-workflows">${button('start-recipes','Depuis mes recettes','workflow-recipes')}${button('start-manual','Manuellement','workflow-manual')}</div>${button('reset','Supprimer la liste','danger')}</div>${visibleItemCount===0?emptyStoreMessage:body}`:`<div class="list-workflows list-workflows-empty">${button('start-recipes','Depuis mes recettes','workflow-recipes')}${button('start-manual','Manuellement','workflow-manual')}</div>${emptyListMessage}`}`;
    page('Courses','VOTRE LISTE',content,scrollPosition);
  }
  function setTab(which){tab=which;document.querySelectorAll('[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===which));({import:renderImport,cats:renderCategories,pdf:renderPdfs,list:renderList,recipes:renderRecipesTab}[which]||renderList)();}
  function slotKey(date,meal){return `${date}|${meal}`;}
  function slotPeople(date,meal){const n=Number(peopleBySlot[slotKey(date,meal)]);return Number.isFinite(n)&&n>=1?Math.floor(n):1;}
  function savePeople(){try{localStorage.setItem('courses-meal-people-v1',JSON.stringify(peopleBySlot));}catch{}}
  function orderedDays(){return [...days.entries()].sort(([a],[b])=>a.localeCompare(b));}
  function cleanupMealPlan(date,meal){const people=slotPeople(date,meal),stillScheduled=[...days.entries()].some(([d,opt])=>d!==date&&opt[meal]&&slotPeople(d,meal)===people);if(stillScheduled)return;for(const key of Object.keys(plannedMeals)){try{const [m,n]=JSON.parse(key);if(m===meal&&Number(n)===people)delete plannedMeals[key];}catch{}}}
  function renderCalendar(){const year=monthCursor.getFullYear(),month=monthCursor.getMonth(),first=new Date(year,month,1),offset=(first.getDay()+6)%7,daysIn=new Date(year,month+1,0).getDate(),today=new Date();today.setHours(0,0,0,0);let cells='';for(let i=0;i<offset;i++)cells+='<span class="blank"></span>';for(let d=1;d<=daysIn;d++){const date=new Date(year,month,d),key=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`,past=date<today;cells+=`<button class="day ${past?'past':''} ${days.has(key)?'selected':''}" data-action="day" data-date="${key}" ${past?'disabled':''}>${d}</button>`;}
    page('Choisir les jours','',`<section class="group"><div class="calendar-skip-wrap"><button type="button" class="calendar-skip" data-action="skip-calendar">passer cette étape</button></div><div class="calendar-head"><button data-action="month" data-delta="-1">‹</button><b>${monthCursor.toLocaleDateString('fr-FR',{month:'long',year:'numeric'})}</b><button data-action="month" data-delta="1">›</button></div><div class="calendar-grid">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}${cells}</div><div id="day-options">${orderedDays().map(([date,opt])=>`<div class="day-options"><b>${new Date(`${date}T12:00:00`).toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}</b>${['midi','soir'].map(meal=>`<div class="meal-option"><label><input type="checkbox" data-meal="${meal}" data-date="${date}" ${opt[meal]?'checked':''}> ${meal==='midi'?'Midi':'Soir'}</label>${opt[meal]?`<div class="person-counter"><span>Personnes</span><button data-action="people" data-date="${date}" data-meal="${meal}" data-delta="-1" aria-label="Diminuer">−</button><b>${slotPeople(date,meal)}</b><button data-action="people" data-date="${date}" data-meal="${meal}" data-delta="1" aria-label="Augmenter">＋</button></div>`:''}</div>`).join('')}<button data-action="un-day" data-date="${date}">Retirer</button></div>`).join('')}</div></section><div class="form-actions workflow-actions"><button type="button" class="button primary" data-action="calendar-next" ${[...days.values()].some(opt=>!opt.midi&&!opt.soir)?'disabled':''}>Continuer</button></div>`);}
  function mealsCounts(){let midi=0,soir=0;days.forEach((d,date)=>{if(d.midi)midi+=slotPeople(date,'midi');if(d.soir)soir+=slotPeople(date,'soir');});return {days:days.size,midi,soir};}
  function topScrollPosition(){return {left:0,top:0,rootLeft:0,rootTop:0,containers:[{index:0,left:0,top:0}]};}
  function renderRecipePicker(scrollPosition=null){syncCatalogMembership();document.querySelectorAll('[data-recipe-group]').forEach(el=>{recipeGroupOpen[el.dataset.recipeGroup]=el.open;});page('Choisir les recettes',workflow?.passed?'SÉLECTIONNER LES REPAS':'PAR JOURS DE LA SEMAINE · 2/2',`${recipePickerMarkup(state.recipes,days,peopleBySlot,plannedMeals,selectedCounts,!!workflow?.passed)}<div class="form-actions workflow-actions">${button('recipe-ok','OK - Générer les courses','primary')}</div>`,scrollPosition);}
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
    syncCatalogMembership();
    const hasRows=generatedWeeks.some(w=>Object.values(w.groups||{}).some(rows=>rows.length));
    if(!hasRows){page('Recettes','VOTRE HISTORIQUE','<section class="recipes-empty-card"><p>Les recettes sélectionnées pour vos courses apparaîtront ici.</p></section>',scrollPosition);return;}
    const momentTitles=[['matin','Matin'],['midi','Midi'],['gouter','Goûter'],['soir','Soir']];
    const blocks=generatedWeeks.map(week=>{const groups=week.groups||{},sections=momentTitles.map(([moment,title])=>{const rows=groups[moment]||[];return rows.length?`<section class="week-moment"><h3>${title}</h3>${rows.map(r=>`<div class="week-recipe-entry"><label class="week-recipe ${r.checked?'checked':''}"><input type="checkbox" data-week-id="${esc(week.id)}" data-line-id="${esc(r.id)}" ${r.checked?'checked':''}><span>${esc(r.name)}</span></label><button type="button" class="week-recipe-delete" data-action="delete-week-recipe" data-week-id="${esc(week.id)}" data-line-id="${esc(r.id)}" aria-label="Supprimer ${esc(r.name)}">×</button></div>`).join('')}</section>`:''}).join('');return `<article class="generated-group" data-week="${esc(week.id)}">${sections}</article>`;}).join('');
    page('Recettes','VOTRE HISTORIQUE',blocks,scrollPosition,'<button class="text-button recipes-delete-all" data-action="delete-weeks">Tout supprimer</button>');
  }
  function renderRecipeReview(scrollPosition=null){const lines=reviewEntries.map(item=>`<label class="review-row"><input type="checkbox" data-review-item="${esc(item.id)}" ${reviewChecks[item.id]!==false?'checked':''}><span>${esc(item.name)}</span><small>${esc(displayQty(item))}</small></label>`).join('');page('Liste de courses','VÉRIFIER LES INGRÉDIENTS',`<p class="hint">Décochez les ingrédients que vous avez déjà. Seuls les éléments cochés seront ajoutés.</p><section class="group review-list">${lines}</section><div class="form-actions workflow-actions">${button('review-confirm','Générer la liste de courses','primary')}</div>`,scrollPosition);if(!scrollPosition)window.scrollTo(0,0);}
  function manualIngredientRow(category,name,checked=false){const key=`${category}|${name}`;return `<div class="manual-ingredient-row"><input type="checkbox" data-pick="${esc(key)}" ${checked?'checked':''} aria-label="Sélectionner ${esc(name)}"><span class="manual-ingredient-name" data-check-label>${esc(name)}</span><input type="number" min="0" step="any" inputmode="decimal" placeholder="Qté" data-pick-qty="${esc(key)}" aria-label="Quantité pour ${esc(name)}"><select data-pick-unit="${esc(key)}" aria-label="Unité pour ${esc(name)}"><option value="">—</option>${UNITES.filter(Boolean).map(u=>`<option value="${esc(u)}">${esc(u)}</option>`).join('')}</select></div>`;}
  let manualViewportBase=0;
  function syncManualKeyboardState(){const active=workflow?.screen==='manual'&&document.body.classList.contains('workflow-active'),focused=active&&document.activeElement?.matches('.manual-add-form input,[data-quick-entry]'),viewport=window.visualViewport,short=active&&viewport&&manualViewportBase>0&&viewport.height<manualViewportBase-120;document.body.classList.toggle('manual-keyboard-open',!!(focused||short));document.body.style.setProperty('--manual-viewport-offset',`${Math.max(0,viewport?.offsetTop||0)}px`);}
  let manualScrollAnimation=0;
  function animateManualScroll(target){
    const root=document.scrollingElement;
    if(!root)return;
    let scroller=root;
    if(target){
      for(let node=target.parentElement;node&&node!==document.body&&node!==document.documentElement;node=node.parentElement){
        const overflow=getComputedStyle(node).overflowY;
        if((overflow==='auto'||overflow==='scroll')&&node.scrollHeight>node.clientHeight){scroller=node;break;}
      }
    }
    cancelAnimationFrame(manualScrollAnimation);
    const start=scroller.scrollTop;
    if(!target&&start<MARGIN)return;
    let destination=0;
    if(target){
      const targetRect=target.getBoundingClientRect();
      const scrollerTop=scroller===root?0:scroller.getBoundingClientRect().top+scroller.clientTop;
      const quickBar=document.querySelector('.quick-entry-bar');
      const topBar=document.querySelector('.topbar');
      const stickyBottom=Math.max(quickBar?.getBoundingClientRect().bottom||0,topBar?.getBoundingClientRect().bottom||0);
      const stickyOffset=Math.max(0,stickyBottom-scrollerTop);
      const viewportBottom=scroller===root?window.innerHeight:scroller.getBoundingClientRect().top+scroller.clientTop+scroller.clientHeight;
      const comfortableTop=Math.max(scrollerTop,stickyBottom)+MARGIN;
      const comfortableBottom=viewportBottom-MARGIN;
      if(targetRect.top>=comfortableTop&&targetRect.bottom<=comfortableBottom)return;
      destination=start+targetRect.top-scrollerTop-stickyOffset-14;
      destination=Math.max(0,Math.min(destination,scroller.scrollHeight-scroller.clientHeight));
    }
    cancelAnimationFrame(manualScrollAnimation);
    const began=performance.now(),duration=700,delta=destination-start;
    if(Math.abs(delta)<1)return;
    const step=now=>{
      const progress=Math.min(1,(now-began)/duration);
      const eased=progress<.5?4*progress*progress*progress:1-Math.pow(-2*progress+2,3)/2;
      scroller.scrollTop=start+delta*eased;
      if(progress<1)manualScrollAnimation=requestAnimationFrame(step);
    };
    manualScrollAnimation=requestAnimationFrame(step);
  }
  function syncQuickIngredients(){document.querySelectorAll('[data-quick-qty]').forEach(input=>{const item=quickIngredients.find(x=>x.id===input.dataset.quickQty);if(item){item.quantity=input.value;item.unit=document.querySelector(`[data-quick-unit="${CSS.escape(item.id)}"]`)?.value||'';item.checked=document.querySelector(`[data-pick="${CSS.escape(`__quick__|${item.id}`)}"]`)?.checked??item.checked;}});}
  function categoryPicker(){workflow={screen:'manual'};manualViewportBase=window.visualViewport?.height||window.innerHeight;const quickRows=quickIngredients.map(x=>`<div class="manual-ingredient-row"><input type="checkbox" data-pick="__quick__|${esc(x.id)}" ${x.checked?'checked':''} aria-label="Sélectionner ${esc(x.name)}"><span class="manual-ingredient-name" data-check-label>${esc(x.name)}</span><input type="number" min="0" step="any" inputmode="decimal" placeholder="Qté" value="${esc(x.quantity)}" data-quick-qty="${esc(x.id)}" aria-label="Quantité pour ${esc(x.name)}"><select data-quick-unit="${esc(x.id)}" aria-label="Unité pour ${esc(x.name)}"><option value="">—</option>${UNITES.filter(Boolean).map(u=>`<option value="${esc(u)}" ${x.unit===u?'selected':''}>${esc(u)}</option>`).join('')}</select></div>`).join('');const quick=`<div class="quick-entry-bar"><input type="search" data-quick-entry placeholder="Ajouter un ingrédient" aria-label="Saisie rapide" enterkeyhint="done"></div>${quickRows?`<section class="group manual-category quick-category" data-manual-category="__quick__"><div class="manual-tags">${quickRows}</div></section>`:''}`;const categories=storeCategories(),renderManualGroup=(c,items,title=storeCategoryLabel(c))=>`<section class="group manual-category" data-manual-category="${esc(c.id)}"><div class="manual-category-head"><h2>${esc(title)}</h2><button type="button" class="manual-add-toggle" data-action="toggle-manual-add" data-id="${esc(c.id)}" aria-label="Ajouter un ingrédient dans ${esc(c.name)}">+</button></div><div class="manual-tags">${items.join('')||'<p class="muted manual-no-tags">Aucun ingrédient enregistré.</p>'}</div><div class="inline-form manual-add-form" data-form="manual-add" data-id="${esc(c.id)}" hidden><input name="name" placeholder="Ajouter un ingrédient" aria-label="Ajouter un ingrédient dans ${esc(c.name)}" autocapitalize="none" autocorrect="off" spellcheck="false" autocomplete="off"></div></section>`,groups=(()=>{let html='',fruitDone=false;for(const c of categories){if(storeCategoryKey(c.name)==='fruits & legumes'){if(fruitDone)continue;fruitDone=true;const fc=categories.filter(x=>storeCategoryKey(x.name)==='fruits & legumes'),rows=fc.flatMap(x=>x.ingredients.filter(n=>ingredientIsInSeason(n)).map(n=>manualIngredientRow(x.id,n)));html+=renderManualGroup(fc[0],rows,'Fruits et légumes');}else{const rows=c.ingredients.filter(n=>ingredientIsInSeason(n)).map(n=>manualIngredientRow(c.id,n));html+=renderManualGroup(c,rows);}}return html;})();page('Choisir manuellement','COMPOSER LA LISTE',`${storeFilterControl()}<div id="category-picker">${quick}${groups}</div><div class="form-actions category-picker-actions">${button('category-ok','Ajouter à la liste','primary')}</div>`);}

  async function processQuickEntry(input){syncQuickIngredients();const name=input.value.trim();if(!name)return;if(hasUppercaseLetter(name)){rejectField(input,'Veuillez saisir l’ingrédient en minuscules.');return;}const cat=storeCategories().find(c=>c.ingredients.some(x=>normalizeIngredient(x)===normalizeIngredient(name)&&ingredientIsInSeason(x)&&!isSuppressedCatalogIngredient(c.id,x)));if(cat){const actual=cat.ingredients.find(x=>normalizeIngredient(x)===normalizeIngredient(name)&&ingredientIsInSeason(x));let checkbox=document.querySelector(`[data-pick="${CSS.escape(`${cat.id}|${actual}`)}"]`);if(!checkbox){const section=document.querySelector(`[data-manual-category="${CSS.escape(cat.id)}"]`),tags=section?.querySelector('.manual-tags');if(tags){tags.querySelector('.manual-no-tags')?.remove();tags.insertAdjacentHTML('beforeend',manualIngredientRow(cat.id,actual));checkbox=tags.querySelector(`[data-pick="${CSS.escape(`${cat.id}|${actual}`)}"]`);}}if(checkbox){checkbox.checked=true;const pick=`${cat.id}|${actual}`;requestAnimationFrame(()=>requestAnimationFrame(()=>{const current=document.querySelector(`[data-pick="${CSS.escape(pick)}"]`);if(!current)return;const details=current.closest('details');if(details&&!details.open){details.open=true;requestAnimationFrame(()=>animateManualScroll(current.closest('.manual-ingredient-row')));}else animateManualScroll(current.closest('.manual-ingredient-row'));}));}input.value='';input.blur();syncManualKeyboardState();return;}quickIngredients.push({id:uid(),name,quantity:'',unit:'',checked:true});input.value='';categoryPicker();requestAnimationFrame(()=>animateManualScroll(null));}
  document.addEventListener('keydown',e=>{const input=e.target.closest('[data-quick-entry]');if(input&&e.key==='Enter'){e.preventDefault();processQuickEntry(input);return;}const field=e.target.closest('[data-form="catalog"] input,[data-form="manual-add"] input,[data-form="new-cat"] input');if(field&&e.key==='Enter'){e.preventDefault();field.closest('[data-form]')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));}});
  async function afterImport(text){const result=validateCSV(text);if(result.errors.length){say(`Import annulé — ${result.errors[0]}`);return;}let added=0,updated=0,unchanged=0;const next=[...state.recipes];
    // Un import CSV valide réinitialise les suppressions manuelles du catalogue.
    suppressedIngredients={};saveSuppressedIngredients();
    // Catalogue alimenté uniquement après validation complète, puis comparaison par contenu cohérent.
    result.recipes.forEach(r=>r.ingredients.forEach(i=>{const match=catalogIngredient(i.name);if(match)i.name=match.name;let labels=match?match.categories:splitCategories(i.category);if(!match)labels=['Sans catégories'];if(norm(i.name)==='sauce soja salee')labels=[...new Set([...labels,'Sauce'])];const ids=[];for(const label of labels){let cat=state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(label));if(!cat){cat={id:uid(),name:label,order:state.categories.length,ingredients:[]};state.categories.push(cat);}if(!isIngredientSuppressed(suppressedIngredients,cat.name,i.name)&&!cat.ingredients.some(x=>normalizeIngredient(x)===normalizeIngredient(i.name)))cat.ingredients.push(i.name);ids.push(cat.id);}i.categories=[...new Set(ids)];i.category=i.categories[0]||'';}));
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
    if(a==='rename-cat'){const cat=state.categories.find(c=>c.id===id),title=b.closest('.category-card')?.querySelector('.category-title');if(cat&&title&&!title.querySelector('input')){const input=document.createElement('input');input.className='category-rename-input';input.setAttribute('autocomplete','off');input.setAttribute('autocorrect','off');input.setAttribute('autocapitalize','off');input.setAttribute('spellcheck','false');input.setAttribute('data-lpignore','true');input.setAttribute('data-form-type','other');input.setAttribute('inputmode','text');input.setAttribute('enterkeyhint','done');input.name=`field-${Math.random().toString(36).slice(2,10)}`;input.type='text';input.value=cat.name;input.setAttribute('aria-label','Nouveau nom de la catégorie');title.querySelector('.category-name')?.replaceWith(input);input.focus();input.select();let finished=false;const finish=async cancel=>{if(finished)return;finished=true;if(cancel){renderCategories(saveWindowScroll());return;}const name=input.value.trim();if(!name||name===cat.name){renderCategories(saveWindowScroll());return;}if(state.categories.some(c=>c.id!==id&&norm(c.name)===norm(name))){say('Cette catégorie existe déjà.');renderCategories(saveWindowScroll());return;}cat.name=name;await put('categories',cat);renderCategories(saveWindowScroll());};input.addEventListener('keydown',ev=>{if(ev.key==='Escape'){ev.preventDefault();finish(true);}else if(ev.key==='Enter'){ev.preventDefault();finish(false);}});input.addEventListener('blur',()=>finish(false),{once:true});}return;}
    if(a==='delete-cat'){if(confirm('Supprimer cette catégorie ?')){const scrollPosition=saveWindowScroll();state.categories=state.categories.filter(c=>c.id!==id);state.categories.forEach((c,i)=>c.order=i);await replaceStore('categories',state.categories);renderCategories(scrollPosition);}return;}
    if(a==='delete-ingredient'){const cat=state.categories.find(c=>c.id===id),name=b.dataset.ingredient;if(cat&&name&&cat.ingredients.some(x=>normalizeIngredient(x)===normalizeIngredient(name))){const scrollPosition=saveWindowScroll();cat.ingredients=cat.ingredients.filter(x=>normalizeIngredient(x)!==normalizeIngredient(name));suppressedIngredients[ingredientKey(cat.name,name)]=true;suppressedIngredients[ingredientKey(cat.id,name)]=true;saveSuppressedIngredients();await put('categories',cat);renderCategories(scrollPosition);say('Ingrédient retiré du catalogue.');}return;}
    if(a==='toggle'){const item=state.list.find(x=>x.id===id);if(item){item.checked=b.checked;b.closest('.shopping-row')?.classList.toggle('checked',item.checked);await put('list',item);}return;}
    if(a==='new-cat-add'){b.closest('[data-form="new-cat"]')?.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));return;}
    if(a==='toggle-list-add'){return;}
    if(a==='toggle-manual-add'){const form=b.closest('.manual-category')?.querySelector('.manual-add-form');if(form){form.hidden=!form.hidden;if(!form.hidden)focusWithoutScroll(form.querySelector('input'));}return;}
    if(a==='reset'){if(confirm('Supprimer la liste de courses ?')){state.list=[];await replaceStore('list',[]);renderList();say('Liste réinitialisée.');}return;}
    if(a==='month'){monthCursor.setMonth(monthCursor.getMonth()+Number(b.dataset.delta));renderCalendar();return;}
    if(a==='day'){const date=b.dataset.date;if(!days.has(date))days.set(date,{midi:false,soir:false});else{days.delete(date);cleanupMealPlan(date,'midi');cleanupMealPlan(date,'soir');}days=new Map(orderedDays());saveWeekPlan();renderCalendar();return;}
    if(a==='people'){const meal=b.dataset.meal,key=slotKey(b.dataset.date,meal),n=Math.max(1,slotPeople(b.dataset.date,meal)+Number(b.dataset.delta));peopleBySlot[key]=n;savePeople();renderCalendar();return;}
    if(a==='un-day'){const date=b.dataset.date;days.delete(date);cleanupMealPlan(date,'midi');cleanupMealPlan(date,'soir');saveWeekPlan();renderCalendar();return;}
    if(a==='skip-calendar'){workflow={passed:true,screen:'recipes'};days.clear();plannedMeals={};selectedCounts={};saveWeekPlan();renderRecipePicker(topScrollPosition());return;}
    if(a==='calendar-next'){workflow={passed:false,screen:'recipes'};saveWeekPlan();renderRecipePicker(topScrollPosition());return;}
    
    if(a==='recipe-ok'){const entries=shoppingEntries(state.recipes,plannedMeals,selectedCounts).map(i=>{const ids=itemCategoryIds(i).filter(value=>!isSuppressedCatalogIngredient(value,i.name)).map(value=>state.categories.find(c=>c.id===value)?.id||state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(value))?.id||value);const unique=[...new Set(ids)];return {...i,categories:unique,category:preferredStoreCategory(unique,state.categories)||unique[0]||''};}).filter(i=>i.categories.length);if(!entries.length){say('Choisissez au moins une recette.');return;}reviewEntries=[];entries.forEach(i=>mergeListItem(reviewEntries,i));finalizeShoppingList(reviewEntries);reviewChecks=Object.fromEntries(reviewEntries.map(i=>[i.id,true]));workflow.screen='review';renderRecipeReview();return;}
    if(a==='recipe-count'){let key=b.dataset.key,decoded;try{decoded=JSON.parse(key);}catch{return;}const moment=decoded[0],people=decoded.length>2?decoded[1]:1,recipeId=decoded.length>2?decoded[2]:decoded[1],delta=Number(b.dataset.delta);if(moment==='midi'||moment==='soir'){key=planKey(moment,people,recipeId);plannedMeals[key]=Math.max(0,(Number(plannedMeals[key])||0)+delta);}else{key=JSON.stringify([moment,recipeId]);selectedCounts[key]=Math.max(0,(Number(selectedCounts[key])||0)+delta);}saveWeekPlan();renderRecipePicker(saveWindowScroll());return;}
    if(a==='review-confirm'){const chosen=reviewEntries.filter(i=>reviewChecks[i.id]!==false);if(!chosen.length){say('Sélectionnez au moins un ingrédient.');return;}if(state.list.length){$('#merge-modal').dataset.payload=JSON.stringify(chosen);$('#merge-modal').dataset.source='recipes';$('#merge-modal').hidden=false;return;}chosen.forEach(i=>mergeListItem(state.list,i));finalizeShoppingList(state.list);await replaceStore('list',state.list);appendGeneratedWeek(buildWeekSnapshot());workflow=null;document.body.classList.remove('workflow-active');setTab('list');say('Liste de courses générée.');return;}
    if(a==='category-ok'){syncQuickIngredients();const entries=[];document.querySelectorAll('[data-pick]:checked').forEach(ch=>{const [cat,...parts]=ch.dataset.pick.split('|'),raw=parts.join('|'),quick=cat==='__quick__',quickItem=quick?quickIngredients.find(x=>x.id===raw):null,name=quick?quickItem?.name:raw,key=ch.dataset.pick,quantity=quick?document.querySelector(`[data-quick-qty="${CSS.escape(raw)}"]`)?.value||'':document.querySelector(`[data-pick-qty="${CSS.escape(key)}"]`)?.value||'',unit=quick?document.querySelector(`[data-quick-unit="${CSS.escape(raw)}"]`)?.value||'':document.querySelector(`[data-pick-unit="${CSS.escape(key)}"]`)?.value||'';if(name)entries.push({name,quantity,unit,category:cat,categories:[cat],checked:false});});if(!entries.length){say('Choisissez au moins un article.');return;}const manualUnique=new Map();entries.sort((a,b)=>storeCategories().findIndex(c=>c.id===a.category)-storeCategories().findIndex(c=>c.id===b.category)).forEach(x=>{const key=`${x.category==='__quick__'?'__quick__|':''}${normalizeIngredient(x.name)}|${norm(x.unit)}`,prior=manualUnique.get(key);if(prior){prior.categories=[...new Set([...itemCategoryIds(prior),x.category])];return;}manualUnique.set(key,x);});manualUnique.forEach(x=>{const key=normalizeIngredient(x.name),existing=x.category==='__quick__'?state.list.find(i=>itemCategoryIds(i).includes('__quick__')&&normalizeIngredient(i.name)===key&&norm(i.unit)===norm(x.unit)):state.list.find(i=>!itemCategoryIds(i).includes('__quick__')&&normalizeIngredient(i.name)===key&&norm(i.unit)===norm(x.unit));if(!existing)mergeListItem(state.list,x,1,true);else existing.categories=[...new Set([...itemCategoryIds(existing),...itemCategoryIds(x)])];});finalizeShoppingList(state.list);await replaceStore('list',state.list);quickIngredients=[];workflow=null;document.body.classList.remove('workflow-active','manual-keyboard-open');setTab('list');say('Articles ajoutés à la liste.');return;}
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
  
  // Appui long de 250 ms, puis glissement sans défilement; clic synthétique neutralisé après le geste.
  let reviewDrag=null, suppressReviewClick=false;
  document.addEventListener('touchstart',e=>{const row=e.target.closest('.review-row');if(!row||e.touches.length!==1)return;const box=row.querySelector('input[data-review-item]');if(!box)return;const x=e.touches[0].clientX,y=e.touches[0].clientY;reviewDrag={row,id:box.dataset.reviewItem,x,y,initial:box.checked,timer:setTimeout(()=>{if(!reviewDrag)return;reviewDrag.active=true;reviewDrag.target=!reviewDrag.initial;reviewDrag.row.classList.add('review-dragging');box.checked=reviewDrag.target;reviewChecks[reviewDrag.id]=reviewDrag.target;},250)};},{passive:true});
  document.addEventListener('touchmove',e=>{if(!reviewDrag||e.touches.length!==1)return;const t=e.touches[0];if(!reviewDrag.active){if(Math.hypot(t.clientX-reviewDrag.x,t.clientY-reviewDrag.y)>8){clearTimeout(reviewDrag.timer);reviewDrag=null;}return;}e.preventDefault();const row=document.elementFromPoint(t.clientX,t.clientY)?.closest('.review-row');if(row){const box=row.querySelector('input[data-review-item]');if(box){box.checked=reviewDrag.target;reviewChecks[box.dataset.reviewItem]=reviewDrag.target;}}},{passive:false});
  document.addEventListener('touchend',()=>{if(!reviewDrag)return;clearTimeout(reviewDrag.timer);if(reviewDrag.active){reviewDrag.row.classList.remove('review-dragging');suppressReviewClick=true;setTimeout(()=>suppressReviewClick=false,500);}reviewDrag=null;},{passive:true});
  document.addEventListener('touchcancel',()=>{if(reviewDrag){clearTimeout(reviewDrag.timer);reviewDrag.row?.classList.remove('review-dragging');reviewDrag=null;}},{passive:true});
  document.addEventListener('click',e=>{if(suppressReviewClick&&e.target.closest('.review-row')){e.preventDefault();e.stopImmediatePropagation();}},true);
  document.addEventListener('click',e=>{const name=e.target.closest('[data-check-label]');if(!name)return;const row=name.closest('.manual-ingredient-row');const checkbox=row?.querySelector('input[type=checkbox]');if(checkbox){checkbox.click();}});
  document.addEventListener('click',e=>{const row=e.target.closest('.shopping-row');if(!row||e.target.closest('input,small,button'))return;const box=row.querySelector('input[type=checkbox]');if(box)box.click();});
  document.addEventListener('pointerdown',e=>{if(e.target.closest('input,select,textarea'))return;const active=document.activeElement;if(active?.matches('input[type=text],input:not([type]),textarea')&&!active.closest('[data-form="new-cat"]')){if(active.matches('.manual-add-form input')||active.matches('[data-form="list-add"] input')||active.matches('[data-form="catalog"] input'))active.value='';active.blur();}});
  document.addEventListener('toggle',e=>{const group=e.target.closest?.('[data-recipe-group]');if(group)recipeGroupOpen[group.dataset.recipeGroup]=group.open;},true);
  document.addEventListener('focusin',e=>{if(e.target.matches('.manual-add-form input,[data-quick-entry]'))syncManualKeyboardState();});
  document.addEventListener('focusout',e=>{if(e.target.matches('.manual-add-form input,[data-quick-entry]'))setTimeout(syncManualKeyboardState,0);});
  window.visualViewport?.addEventListener('resize',syncManualKeyboardState);
  window.visualViewport?.addEventListener('scroll',syncManualKeyboardState);
  document.addEventListener('click',e=>{const pill=e.target.closest('[data-season-month][data-month]');if(!pill)return;const month=Number(pill.dataset.month);selectedSeasonMonth=month===new Date().getMonth()?null:month;if(workflow?.screen==='manual')categoryPicker();else if(tab==='cats')renderCategories(saveWindowScroll());});
  document.addEventListener('change',e=>{if(!e.target.matches('[data-store-filter]'))return;activeStore=STORE_FILTERS[e.target.value]?e.target.value:'Auchan St Cyprien';try{localStorage.setItem('courses-active-store-v1',activeStore);}catch{}if(workflow?.screen==='manual')categoryPicker();else if(tab==='cats')renderCategories(saveWindowScroll());else renderList(saveWindowScroll());});
  document.addEventListener('change',async e=>{
    if(e.target.id==='csv-file'){const file=e.target.files[0];if(file)afterImport(await file.text());e.target.value='';}
    if(e.target.id==='pdf-file'){for(const f of e.target.files){const rec={id:uid(),name:pdfDisplayName(f.name),blob:f,type:f.type||'application/pdf'};state.pdfs.push(rec);await put('pdfs',rec);}renderPdfs();say(`${e.target.files.length} fiche(s) ajoutée(s).`);}
    if(e.target.dataset.meal){const d=days.get(e.target.dataset.date);if(d){const meal=e.target.dataset.meal;d[meal]=e.target.checked;if(!e.target.checked)cleanupMealPlan(e.target.dataset.date,meal);saveWeekPlan();renderCalendar();}}
    if(e.target.dataset.recipeChoice){/* Compatibilité pour les anciennes vues en cache. */}
    if(e.target.dataset.weekId&&e.target.dataset.lineId){const week=generatedWeeks.find(w=>w.id===e.target.dataset.weekId),rows=week?.groups&&Object.values(week.groups).flat(),line=rows?.find(r=>r.id===e.target.dataset.lineId);if(line){line.checked=e.target.checked;saveGeneratedWeeks();}renderRecipesTab(saveWindowScroll());}
    if(e.target.dataset.reviewItem){reviewChecks[e.target.dataset.reviewItem]=e.target.checked;}
  });
  document.addEventListener('submit',async e=>{const form=e.target;if(form.dataset.form==='new-cat'){e.preventDefault();const scrollPosition=saveWindowScroll(),name=form.querySelector('input')?.value.trim()||'';if(!name)return;if(state.categories.some(c=>norm(c.name)===norm(name)))return say('Cette catégorie existe déjà.');state.categories.push({id:uid(),name,order:state.categories.length,ingredients:[]});await replaceStore('categories',state.categories);renderCategories(scrollPosition);return;}
    if(form.dataset.form==='catalog'){e.preventDefault();const cat=state.categories.find(c=>c.id===form.dataset.id),input=form.querySelector('input'),name=input.value.trim();if(!cat||!name)return;if(!isCatalogIngredientValid(name)){rejectField(input,'Minuscules, espaces, tirets ou apostrophes uniquement.');return;}const catalogMatch=catalogIngredient(name),actualName=catalogMatch?.name||name;if(cat.ingredients.some(x=>normalizeIngredient(x)===normalizeIngredient(actualName))){say('Cet ingrédient existe déjà.');focusWithoutScroll(input);return;}cat.ingredients.push(actualName);delete suppressedIngredients[ingredientKey(cat.name,actualName)];delete suppressedIngredients[ingredientKey(cat.id,actualName)];saveSuppressedIngredients();await put('categories',cat);const chips=form.closest('.category-card').querySelector('.chips');const visibleIngredients=cat.ingredients.filter(x=>ingredientIsInSeason(x));chips.innerHTML=visibleIngredients.map(x=>`<span class="ingredient-chip"><span>${esc(x)}</span><button class="ingredient-delete" type="button" data-action="delete-ingredient" data-id="${esc(cat.id)}" data-ingredient="${esc(x)}" aria-label="Supprimer ${esc(x)}" title="Supprimer ${esc(x)}">×</button></span>`).join('')||'<span class="muted">Aucun ingrédient</span>';input.value='';focusWithoutScroll(input);return;}
    if(form.dataset.form==='manual-add'){e.preventDefault();const cat=state.categories.find(c=>c.id===form.dataset.id),input=form.querySelector('input'),name=input.value.trim();if(!cat||!name)return;if(hasUppercaseLetter(name)){rejectField(input,'Veuillez saisir l’ingrédient en minuscules.');return;}const existing=cat.ingredients.find(x=>normalizeIngredient(x)===normalizeIngredient(name)),actualName=existing||name;if(!existing){cat.ingredients.push(actualName);delete suppressedIngredients[ingredientKey(cat.name,actualName)];delete suppressedIngredients[ingredientKey(cat.id,actualName)];saveSuppressedIngredients();await put('categories',cat);}const pick=`${cat.id}|${actualName}`;let checkbox=document.querySelector(`[data-pick="${CSS.escape(pick)}"]`);if(!checkbox){const tags=form.closest('.manual-category').querySelector('.manual-tags');tags.querySelector('.manual-no-tags')?.remove();tags.insertAdjacentHTML('beforeend',manualIngredientRow(cat.id,actualName,false));}input.value='';input.blur();syncManualKeyboardState();return;}
    if(form.dataset.form==='quick-add'){e.preventDefault();syncQuickIngredients();const input=form.querySelector('input'),name=input.value.trim();if(!name)return;if(hasUppercaseLetter(name)){rejectField(input,'Veuillez saisir l’ingrédient en minuscules.');return;}const cat=state.categories.find(c=>c.ingredients.some(x=>normalizeIngredient(x)===normalizeIngredient(name)&&ingredientIsInSeason(x)&&!isSuppressedCatalogIngredient(c.id,x)));if(cat){const actual=cat.ingredients.find(x=>normalizeIngredient(x)===normalizeIngredient(name)&&ingredientIsInSeason(x));const checkbox=document.querySelector(`[data-pick="${CSS.escape(`${cat.id}|${actual}`)}"]`);if(checkbox){checkbox.checked=true;requestAnimationFrame(()=>checkbox.closest('.manual-ingredient-row')?.scrollIntoView({behavior:'smooth',block:'center'}));}input.value='';input.blur();return;}quickIngredients.push({id:uid(),name,quantity:'',unit:'',checked:true});input.value='';categoryPicker();return;}
    if(form.dataset.form==='list-add'){e.preventDefault();const input=form.querySelector('input'),raw=String(form.querySelector('input')?.value||'').trim();if(!raw)return;if(hasUppercaseLetter(raw)){rejectField(input,'Veuillez saisir l’ingrédient en minuscules.');return;}let quantity='',name=raw;const parsed=raw.match(/^([0-9]+(?:[.,][0-9]+)?)\s+(.+)$/);if(parsed){quantity=parsed[1].replace('.',',');name=parsed[2].trim();}if(!name)return;const match=catalogIngredient(name);if(match)name=match.name;const category=form.dataset.category,matchedCategory=match?.categories?.[0]&&state.categories.find(c=>storeCategoryKey(c.name)===storeCategoryKey(match.categories[0]));const item={id:uid(),name,quantity,unit:'',category:matchedCategory?.id||(category==='__other__'?'':category),categories:matchedCategory?[matchedCategory.id]:(category==='__other__'?[]:[category]),checked:false};mergeListItem(state.list,item,1,true);await replaceStore('list',state.list);renderList();say('Ingrédient ajouté.');}
  });
  document.addEventListener('change',e=>{if(e.target.dataset.pick){/* La sélection est lue au moment de valider. */}if(e.target.dataset.quickUnit){const item=quickIngredients.find(x=>x.id===e.target.dataset.quickUnit);if(item)item.unit=e.target.value;}});
  document.addEventListener('input',e=>{if(e.target.dataset.quickQty){const item=quickIngredients.find(x=>x.id===e.target.dataset.quickQty);if(item)item.quantity=e.target.value;}});
  async function start(){try{db=await openDB();await load();setTab('list');}catch(err){console.error('IndexedDB indisponible',err);say('Stockage local indisponible sur cet appareil.');}}
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{});
  start();
  if(typeof module!=='undefined')module.exports={validateCSV,parseCSV,canonicalMoment,mergeListItem,displayQty,recipeSignature,normalizeIngredient,monthPillsMarkup,INGREDIENT_PLURAL_EXCEPTIONS,reconcileRecipes,norm,mealsCounts,mealTotals,recipeServings,finalizeShoppingList,adjustQuantity,countSelections,planKey,countSelectedPeople,mergeGeneratedWeekBatches,scaleRecipeIngredients,shoppingEntries,recipePickerMarkup,ingredientKey,isIngredientSuppressed,hasUppercaseLetter,isCatalogIngredientValid};
})();
