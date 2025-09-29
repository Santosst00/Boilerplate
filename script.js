// =============================================
// HELPERS — declarados primeiro (evita ReferenceError)
// =============================================
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function currencyBRL(v) { return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }

// Pequenos testes (não afetam a UI)
(function selfTests(){
  try {
    console.assert(rand(1,1) === 1, 'rand(1,1) deve retornar 1');
    const r = rand(0,10); console.assert(r >= 0 && r <= 10, 'rand dentro do intervalo 0..10');
    console.assert(typeof currencyBRL(1234) === 'string', 'currencyBRL deve retornar string');
    console.log('[TEST] Helpers OK');
  } catch (e) { console.error('[TEST] Falhou:', e); }
})();

// ====== ELEMENTOS BASE ======
const sidebar = document.querySelector('.sidebar');
const sidebarToggles = document.querySelectorAll('.sidebar-toggle');
const themeToggleBtn = document.querySelector('.theme-toggle');
const themeIcon = themeToggleBtn.querySelector('.theme-icon');

// ====== TEMA ======
const savedTheme = localStorage.getItem('theme');
const systemPrefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
const shouldUseDark = savedTheme === 'dark' || (!savedTheme && systemPrefersDark);
document.body.classList.toggle('dark-theme', shouldUseDark);

const updateThemeIcon = () => {
  const isDark = document.body.classList.contains('dark-theme');
  themeIcon.textContent = sidebar.classList.contains('collapsed') ? (isDark ? 'light_mode' : 'dark_mode') : 'dark_mode';
};
updateThemeIcon();

themeToggleBtn.addEventListener('click', () => {
  const isDark = document.body.classList.toggle('dark-theme');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  updateThemeIcon();
});

// Sidebar toggle (desktop e mobile)
sidebarToggles.forEach(btn => btn.addEventListener('click', () => {
  sidebar.classList.toggle('collapsed');
  updateThemeIcon();
}));

// Expande sidebar ao focar busca quando colapsada
const searchForm = document.querySelector('.search-form');
searchForm?.addEventListener('click', () => {
  if (sidebar.classList.contains('collapsed')) {
    sidebar.classList.remove('collapsed');
    searchForm.querySelector('input')?.focus();
  }
});

// ====== MINI-ROUTER (hash) ======
const routes = ['dashboard','notifs','clients','sales','settings'];
const pageTitle = document.getElementById('page-title');
const appRoot = document.getElementById('app');

function setActive(route){
  document.querySelectorAll('.menu-link').forEach(a=>{
    const active = a.dataset.route === route;
    a.classList.toggle('active', active);
  });
  pageTitle.textContent = {
    dashboard: 'Dashboard', notifs: 'Notificações', clients: 'Clientes', sales: 'Vendas', settings: 'Configurações'
  }[route] || 'Dashboard';
}

function render(route){
  const tpl = document.getElementById(`tpl-${route}`) || document.getElementById('tpl-dashboard');
  appRoot.innerHTML = '';
  appRoot.appendChild(tpl.content.cloneNode(true));
  setActive(route);
  // pós-render hooks
  if(route==='dashboard') initDashboard();
  if(route==='notifs') initNotifs();
  if(route==='clients') initClients();
  if(route==='sales') initSales();
}

window.addEventListener('hashchange', () => {
  const r = location.hash.replace('#','') || 'dashboard';
  render(routes.includes(r)? r : 'dashboard');
});

// Navegar no clique sem reload
document.querySelectorAll('.menu-link').forEach(a=>{
  a.addEventListener('click', (e)=>{
    e.preventDefault();
    const r = a.dataset.route;
    location.hash = r;
    if(innerWidth < 769 && !sidebar.classList.contains('collapsed')) sidebar.classList.add('collapsed');
  });
});

// Primeira render
if(window.innerWidth > 768) sidebar.classList.add('collapsed');
render((location.hash || '#dashboard').replace('#',''));

// ====== Storage helpers ======
const DB = {
  get(key, def){ try { return JSON.parse(localStorage.getItem(key)) ?? def } catch { return def } },
  set(key, val){ localStorage.setItem(key, JSON.stringify(val)) }
}

// ====== DASHBOARD ======
function initDashboard(){
  // KPIs
  const revenue = rand(120000, 260000);
  const newClients = rand(20, 90);
  const orders = rand(300, 900);
  const nps = rand(60, 95);
  appRoot.querySelector('[data-kpi="revenue"]').textContent = currencyBRL(revenue);
  appRoot.querySelector('[data-kpi="newClients"]').textContent = newClients;
  appRoot.querySelector('[data-kpi="orders"]').textContent = orders;
  appRoot.querySelector('[data-kpi="nps"]').textContent = nps;

  // Chart vendas (canvas puro)
  const c = document.getElementById('chartSales');
  drawLineChart(c, 12);

  // Activity
  const activity = document.getElementById('activity');
  const sample = [
    'Novo pedido #'+rand(1000,9999)+' confirmado',
    'Cliente Ana Beatriz atualizou endereço',
    'Fatura #'+rand(10000,99999)+' paga com sucesso',
    'Ticket #'+rand(300,399)+' fechado',
    'Lead importado da campanha Instagram Ads'
  ];
  activity.innerHTML = sample.map(t=> `<li class="notif"><span class="material-symbols-rounded">flash_on</span>${t}</li>`).join('');
  appRoot.querySelector('[data-action="refresh-activity"]').addEventListener('click', ()=> initDashboard());
}

function drawLineChart(canvas, points=12){
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth * devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * devicePixelRatio;
  const PAD = 32 * devicePixelRatio;
  const data = Array.from({length:points}, ()=> rand(40, 160));
  const max = Math.max(...data) * 1.2;
  const stepX = (w - PAD*2) / (points-1);

  // bg
  ctx.clearRect(0,0,w,h);
  // axis
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--color-border-hr');
  ctx.lineWidth = 1 * devicePixelRatio; ctx.beginPath();
  ctx.moveTo(PAD, h-PAD); ctx.lineTo(w-PAD, h-PAD); ctx.stroke();

  // line
  ctx.beginPath();
  data.forEach((v,i)=>{
    const x = PAD + i*stepX;
    const y = h-PAD - (v/max)*(h-PAD*2/1.2);
    if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  });
  ctx.lineWidth = 3 * devicePixelRatio;
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--color-hover-primary').trim();
  ctx.stroke();

  // dots
  ctx.fillStyle = ctx.strokeStyle;
  data.forEach((v,i)=>{
    const x = PAD + i*stepX;
    const y = h-PAD - (v/max)*(h-PAD*2/1.2);
    ctx.beginPath(); ctx.arc(x,y, 3*devicePixelRatio, 0, Math.PI*2); ctx.fill();
  });
}

// ====== NOTIFICAÇÕES ======
function initNotifs(){
  const key = 'notifs';
  const def = [
    {id:1, text:'Boas-vindas! Seu painel está pronto.', unread:true, type:'celebration'},
    {id:2, text:'Atualização disponível para o app mobile.', unread:true, type:'system_update'},
    {id:3, text:'Plano renovado com sucesso.', unread:false, type:'verified'},
    {id:4, text:'2 novos comentários no ticket #482.', unread:true, type:'forum'},
  ];
  const state = DB.get(key, def);
  const el = document.getElementById('notif-list');
  const tabs = document.querySelectorAll('.tab');

  function renderList(filter='all'){
    el.innerHTML = '';
    const list = state.filter(n => filter==='all' ? true : n.unread);
    if(!list.length){ el.innerHTML = '<div class="card">Sem notificações por aqui ✨</div>'; return; }
    list.forEach(n=>{
      const item = document.createElement('div');
      item.className = `notif ${n.unread? 'unread':''}`;
      item.innerHTML = `<span class="material-symbols-rounded">${n.type||'notifications'}</span><div style="flex:1;">${n.text}</div>`+
      `<button class="btn ghost" data-id="${n.id}">${n.unread? 'Marcar lida':'Desfazer'}</button>`;
      item.querySelector('button').addEventListener('click', ()=>{
        const idx = state.findIndex(x=>x.id===n.id); state[idx].unread = !state[idx].unread; DB.set(key, state); renderList(filter);
      });
      el.appendChild(item);
    });
  }

  tabs.forEach(t=> t.addEventListener('click', ()=>{
    tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');
    renderList(t.dataset.tab);
  }));

  document.querySelector('[data-action="mark-all-read"]').onclick = ()=>{ state.forEach(n=> n.unread=false); DB.set(key,state); renderList(document.querySelector('.tab.active').dataset.tab); };
  document.querySelector('[data-action="clear-notifs"]').onclick = ()=>{ DB.set(key,[]); state.length = 0; renderList('all'); };

  renderList('all');
}

// ====== CLIENTES (CRUD localStorage) ======
function initClients(){
  const key = 'clients';
  // seed se vazio
  const seed = Array.from({length: 28}).map((_,i)=>({
    id: crypto.randomUUID(),
    name: ['Ana Beatriz','Carlos Souza','Studio Aurora','Mercado Verde','Oficina Turbo','TechNuvem','Maria Clara','Bistrô Sabor','Farmácia Vida','Academia Power'][i%10] + ' ' + (i+1),
    email: `user${i+1}@exemplo.com`,
    phone: `(${rand(11,99)}) 9${rand(1000,9999)}-${rand(1000,9999)}`,
    segment: ['Varejo','Serviços','Indústria'][i%3],
    status: ['Ativo','Em teste','Inativo'][i%3]
  }));
  if(!DB.get(key,[]).length) DB.set(key, seed);

  let data = DB.get(key, []);
  const tbody = document.getElementById('client-tbody');
  const search = document.getElementById('client-search');
  const segment = document.getElementById('client-segment');
  const count = document.getElementById('client-count');
  const prev = document.getElementById('prev-page');
  const next = document.getElementById('next-page');
  const pageSize = 8; let page = 1;

  function filtered(){
    const q = (search.value||'').toLowerCase();
    return data.filter(c=> (c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q)) && (!segment.value || c.segment===segment.value));
  }
  function renderTable(){
    const list = filtered();
    const total = list.length; const pages = Math.max(1, Math.ceil(total/pageSize));
    page = Math.min(page, pages);
    const slice = list.slice((page-1)*pageSize, page*pageSize);
    tbody.innerHTML = slice.map(c => `
      <tr>
        <td><strong>${c.name}</strong><div style="color:var(--color-text-placeholder); font-size:.85rem;">${c.email}</div></td>
        <td>${c.phone}</td>
        <td>${c.segment}</td>
        <td><span class="badge"><span class="material-symbols-rounded">${c.status==='Ativo'?'verified':'hourglass'}</span>${c.status}</span></td>
        <td style="text-align:right; display:flex; gap:8px; justify-content:flex-end;">
          <button class="btn ghost" data-edit="${c.id}">Editar</button>
          <button class="btn" data-del="${c.id}">Excluir</button>
        </td>
      </tr>
    `).join('');
    count.textContent = `${total} resultado(s) — página ${page}/${pages}`;
    prev.disabled = page<=1; next.disabled = page>=pages;

    tbody.querySelectorAll('[data-del]').forEach(b => b.onclick = ()=>{
      const id = b.getAttribute('data-del'); data = data.filter(x=>x.id!==id); DB.set(key,data); renderTable();
    });
    tbody.querySelectorAll('[data-edit]').forEach(b => b.onclick = ()=> openModal(b.getAttribute('data-edit')));
  }

  search.oninput = ()=> { page = 1; renderTable() }
  segment.onchange = ()=> { page = 1; renderTable() }
  prev.onclick = ()=> { page--; renderTable() }
  next.onclick = ()=> { page++; renderTable() }

  // Modal
  const dlg = document.getElementById('client-modal');
  const fName = document.getElementById('f-name');
  const fEmail = document.getElementById('f-email');
  const fPhone = document.getElementById('f-phone');
  const fSegment = document.getElementById('f-segment');
  const fStatus = document.getElementById('f-status');
  const modalTitle = document.getElementById('client-modal-title');
  const btnSave = document.getElementById('client-save');
  let editingId = null;

  function openModal(id){
    editingId = id || null;
    if(editingId){
      const c = data.find(x=>x.id===editingId);
      modalTitle.textContent = 'Editar cliente';
      fName.value = c.name; fEmail.value = c.email; fPhone.value = c.phone; fSegment.value = c.segment; fStatus.value = c.status;
    } else {
      modalTitle.textContent = 'Novo cliente';
      fName.value = ''; fEmail.value = ''; fPhone.value = ''; fSegment.value = 'Varejo'; fStatus.value = 'Ativo';
    }
    dlg.showModal();
  }

  document.querySelector('[data-action="add-client"]').onclick = ()=> openModal();
  btnSave.onclick = (e)=>{
    e.preventDefault();
    const payload = { id: editingId || crypto.randomUUID(), name:fName.value, email:fEmail.value, phone:fPhone.value, segment:fSegment.value, status:fStatus.value };
    if(editingId){
      const idx = data.findIndex(x=>x.id===editingId); data[idx] = payload;
    } else { data.unshift(payload); }
    DB.set(key,data); dlg.close(); renderTable();
  };

  dlg.addEventListener('close', ()=> { editingId=null; });

  renderTable();
}

// ====== VENDAS ======
function initSales(){
  // Chart Receita
  drawBarChart(document.getElementById('chartRevenue'));
  // Top produtos
  const list = document.getElementById('top-products');
  const products = ['Plano Pro','Assinatura CRM','Módulo WhatsApp','Catálogo Digital','Suporte Premium'];
  list.innerHTML = products.map((p,i)=> `<li class="notif"><span class="material-symbols-rounded">inventory_2</span><div style="flex:1;">${p}</div><strong>${currencyBRL(rand(12000, 85000))}</strong></li>`).join('');
  // Pedidos
  const tbody = document.getElementById('orders-tbody');
  function gen(){
    const names = ['Ana','Bruno','Carla','Diego','Eva','Felipe','Gabi','Henrique'];
    const prods = products;
    const rows = Array.from({length: 12}).map((_,i)=> ({
      id: rand(10000,99999), client: names[rand(0,names.length-1)], product: prods[rand(0,prods.length-1)], value: rand(500,8000), date: new Date(Date.now()-rand(0, 25)*86400000)
    }));
    tbody.innerHTML = rows.map(r=> `<tr><td>#${r.id}</td><td>${r.client}</td><td>${r.product}</td><td>${currencyBRL(r.value)}</td><td>${r.date.toLocaleDateString('pt-BR')}</td></tr>`).join('');
  }
  gen();
  document.querySelector('[data-action="gen-orders"]').onclick = gen;
}

function drawBarChart(canvas){
  const ctx = canvas.getContext('2d');
  const w = canvas.width = canvas.clientWidth * devicePixelRatio;
  const h = canvas.height = canvas.clientHeight * devicePixelRatio;
  const PAD = 32 * devicePixelRatio;
  const bars = 12; const data = Array.from({length:bars}, ()=> rand(40, 160));
  const max = Math.max(...data) * 1.2;
  const bw = (w - PAD*2) / bars * .7;
  const gap = ((w - PAD*2) / bars) - bw;

  ctx.clearRect(0,0,w,h);
  ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--color-hover-primary').trim();
  for(let i=0;i<bars;i++){
    const x = PAD + i*(bw+gap);
    const bh = (data[i]/max)*(h-PAD*2/1.2);
    ctx.fillRect(x, h-PAD-bh, bw, bh);
  }
  // eixo
  ctx.strokeStyle = getComputedStyle(document.body).getPropertyValue('--color-border-hr');
  ctx.lineWidth = 1 * devicePixelRatio; ctx.beginPath(); ctx.moveTo(PAD, h-PAD); ctx.lineTo(w-PAD, h-PAD); ctx.stroke();
}
