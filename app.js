const K='meattrack2';let data=JSON.parse(localStorage.getItem(K)||'[]');const $=x=>document.querySelector(x);
function day(s){return new Date(s+'T00:00:00')}function today(){let d=new Date();d.setHours(0,0,0,0);return d}
function stat(p){let n=Math.ceil((day(p.expiry)-today())/86400000);return n<0?['expired','Expired',n]:n<=2?['soon',n===0?'Expires today':`Expires in ${n} day(s)`,n]:['fresh',`Fresh · ${n} day(s) left`,n]}
function esc(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function render(){let q=$('#search').value.toLowerCase(),f=$('#filter').value;let a=data.filter(p=>(p.name+' '+p.batch).toLowerCase().includes(q)).filter(p=>f==='all'||stat(p)[0]===f).sort((a,b)=>a.expiry.localeCompare(b.expiry));
$('#total').textContent=data.length;$('#soon').textContent=data.filter(p=>stat(p)[0]=='soon').length;$('#expired').textContent=data.filter(p=>stat(p)[0]=='expired').length;$('#units').textContent=data.reduce((s,p)=>s+Number(p.qty),0);
$('#empty').style.display=a.length?'none':'block';$('#list').innerHTML=a.map(p=>{let s=stat(p);return `<article class=card><div class=top><div><h3>${esc(p.name)}</h3><div class=sub>${esc(p.category)} · ${p.qty} unit(s)</div></div><span class="badge ${s[0]}">${s[1]}</span></div><div class=info>📅 Expiry: <b>${day(p.expiry).toLocaleDateString('en-IE')}</b><br>🏷️ Batch: ${esc(p.batch)||'—'}${p.note?'<br>📦 '+esc(p.note):''}</div><button class=del onclick="removeP('${p.id}')">Delete</button></article>`}).join('')}
function openForm(){$('#modal').classList.remove('hidden');let d=new Date(Date.now()+3*864e5).toISOString().slice(0,10);$('#form').expiry.value=d;$('#form').name.focus()}
function closeForm(){$('#modal').classList.add('hidden');$('#form').reset()}
window.removeP=id=>{data=data.filter(x=>x.id!==id);save()};function save(){localStorage.setItem(K,JSON.stringify(data));render()}
$('#form').onsubmit=e=>{e.preventDefault();let f=new FormData(e.target);data.push({id:crypto.randomUUID(),name:f.get('name'),category:f.get('category'),qty:f.get('qty'),expiry:f.get('expiry'),batch:f.get('batch'),note:f.get('note')});save();closeForm()}
$('#search').oninput=render;$('#filter').onchange=render;render();
