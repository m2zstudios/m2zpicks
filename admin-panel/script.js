(() => {
const AUTH={u:'m2z.ahmed',p:'TestKey123'};const S='m2z_admin_logged_in',K='m2z_admin_key';
const $=id=>document.getElementById(id), qs=s=>document.querySelector(s), qsa=s=>[...document.querySelectorAll(s)];
const st={tools:[],page:1,size:20};
function cfg(){return{e:$('awEndpoint').value.trim(),p:$('awProject').value.trim(),d:$('awDatabase').value.trim(),c:$('awToolsCollection').value.trim(),cc:'creators',rc:'ranks'}}
function headers(){return{'x-appwrite-project':cfg().p,'x-appwrite-key':localStorage.getItem(K)||'','content-type':'application/json'}}
async function req(path,m='GET',b){const r=await fetch(`${cfg().e}${path}`,{method:m,headers:headers(),body:b?JSON.stringify(b):undefined});const t=await r.text();let j;try{j=JSON.parse(t)}catch{j={raw:t}}if(!r.ok)throw new Error(JSON.stringify(j));return j}
function path(col){return `/databases/${cfg().d}/collections/${col}/documents`}
function showOut(x){$('output').textContent=typeof x==='string'?x:JSON.stringify(x,null,2)}
function setPage(id){qsa('.page').forEach(p=>p.classList.remove('active'));$(id)?.classList.add('active');qsa('.nav-item[data-page]').forEach(n=>n.classList.toggle('active',n.dataset.page===id));$('pageTitle').textContent=id.replace('-',' ').toUpperCase()}
function updateAccess(){const has=!!(localStorage.getItem(K)||'').trim();$('keyStatus').textContent=has?'API key saved.':'No API key';$('adminTabsWrap').classList.toggle('hidden',!has);$('lockedNotice').classList.toggle('hidden',has);if(has)$('awApiKey').value='••••••••••';}
function renderTools(){const s=$('toolSearch').value.toLowerCase(),c=$('toolCategoryFilter').value.toLowerCase();let arr=st.tools.filter(t=>(t.title||'').toLowerCase().includes(s)&&(t.category||'').toLowerCase().includes(c));arr.sort((a,b)=>String(a.title||'').localeCompare(String(b.title||'')));const start=(st.page-1)*st.size,view=arr.slice(start,start+st.size);$('toolsTable').innerHTML=view.map(t=>`<tr><td>${t.title||''}</td><td>${t.category||''}</td><td>${t.id||''}</td><td><button data-edit="${t.$id}">Edit</button></td></tr>`).join('');$('pageLabel').textContent=`Page ${st.page} / ${Math.max(1,Math.ceil(arr.length/st.size))}`;qsa('[data-edit]').forEach(b=>b.onclick=()=>{const t=st.tools.find(x=>x.$id===b.dataset.edit);if(!t)return;setPage('tools-add');$('toolDocId').value=t.$id;$('toolId').value=t.id||'';$('toolTitle').value=t.title||'';$('toolCategory').value=t.category||'';$('toolDescription').value=t.description||'';$('toolLink').value=t.link||'';$('toolFeatured').checked=!!t.featured;});}
async function loadTools(){const r=await req(`${path(cfg().c)}?limit=500`);st.tools=r.documents||[];st.page=1;renderTools();$('mTools').textContent=String(r.total||st.tools.length);const map={};st.tools.forEach(t=>map[t.category||'Uncategorized']=(map[t.category||'Uncategorized']||0)+1);$('categoriesOut').textContent=JSON.stringify(Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([category,count])=>({category,count})),null,2);}

if(sessionStorage.getItem(S)==='1'){$('loginView').classList.add('hidden');$('panelView').classList.remove('hidden');updateAccess();}
$('loginForm').onsubmit=e=>{e.preventDefault();if($('username').value.trim()===AUTH.u&&$('password').value===AUTH.p){sessionStorage.setItem(S,'1');$('loginView').classList.add('hidden');$('panelView').classList.remove('hidden');updateAccess();}else $('loginError').classList.remove('hidden');};
$('logoutBtn').onclick=()=>{sessionStorage.removeItem(S);location.reload()};$('saveKeyBtn').onclick=()=>{const v=$('awApiKey').value.trim();if(v&&!v.includes('•'))localStorage.setItem(K,v);updateAccess();};
$('menuBtn').onclick=()=>$('appRoot').classList.toggle('sidebar-open');$('themeToggle').onclick=()=>document.body.dataset.theme=document.body.dataset.theme==='light'?'dark':'light';
qsa('.nav-item[data-page]').forEach(b=>b.onclick=()=>setPage(b.dataset.page));qsa('[data-page]').forEach(b=>b.onclick=()=>setPage(b.dataset.page));
$('loadStatsBtn').onclick=loadTools;$('reloadToolsBtn').onclick=loadTools;$('toolSearch').oninput=renderTools;$('toolCategoryFilter').oninput=renderTools;$('prevPageBtn').onclick=()=>{st.page=Math.max(1,st.page-1);renderTools()};$('nextPageBtn').onclick=()=>{st.page++;renderTools()};
$('createToolBtn').onclick=async()=>{try{const d={id:Number($('toolId').value),title:$('toolTitle').value,category:$('toolCategory').value,description:$('toolDescription').value,link:$('toolLink').value,tags:$('toolTags').value,pricing:$('toolPricing').value,thumbnail:$('toolThumb').value,featured:$('toolFeatured').checked};showOut(await req(path(cfg().c),'POST',{documentId:'unique()',data:d}));await loadTools();}catch(e){showOut(String(e))}};
$('updateToolBtn').onclick=async()=>{try{const id=$('toolDocId').value.trim();const d={id:Number($('toolId').value),title:$('toolTitle').value,category:$('toolCategory').value,description:$('toolDescription').value,link:$('toolLink').value,tags:$('toolTags').value,pricing:$('toolPricing').value,thumbnail:$('toolThumb').value,featured:$('toolFeatured').checked};showOut(await req(`${path(cfg().c)}/${id}`,'PATCH',{data:d}));await loadTools();}catch(e){showOut(String(e))}};
$('deleteToolBtn').onclick=async()=>{try{const id=$('toolDocId').value.trim();showOut(await req(`${path(cfg().c)}/${id}`,'DELETE'));await loadTools();}catch(e){showOut(String(e))}};
const j=(id)=>{const t=$(id).value.trim();return t?JSON.parse(t):{}};
$('listCreatorsBtn').onclick=async()=>showOut(await req(`${path(cfg().cc)}?limit=100`));
$('createCreatorBtn').onclick=async()=>showOut(await req(path(cfg().cc),'POST',{documentId:'unique()',data:j('creatorPayload')}));
$('updateCreatorBtn').onclick=async()=>showOut(await req(`${path(cfg().cc)}/${$('creatorDocId').value.trim()}`,'PATCH',{data:j('creatorPayload')}));
$('deleteCreatorBtn').onclick=async()=>showOut(await req(`${path(cfg().cc)}/${$('creatorDocId').value.trim()}`,'DELETE'));
$('listRanksBtn').onclick=async()=>showOut(await req(`${path(cfg().rc)}?limit=100`));
$('createRankBtn').onclick=async()=>showOut(await req(path(cfg().rc),'POST',{documentId:'unique()',data:j('rankPayload')}));
$('updateRankBtn').onclick=async()=>showOut(await req(`${path(cfg().rc)}/${$('rankDocId').value.trim()}`,'PATCH',{data:j('rankPayload')}));
$('deleteRankBtn').onclick=async()=>showOut(await req(`${path(cfg().rc)}/${$('rankDocId').value.trim()}`,'DELETE'));
})();
