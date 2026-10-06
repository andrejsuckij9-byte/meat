const SUPABASE_URL = 'https://mclqxyrrtgypaasiqms.supabase.co';
const SUPABASE_KEY = 'sb_publishable_WmObJuntIew6GxrV6gTWpw_L3JIg9eS';

let db;
let data = [];

const $ = x => document.querySelector(x);

async function initSupabase() {
  const { createClient } = await import(
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'
  );

  db = createClient(SUPABASE_URL, SUPABASE_KEY);
  await loadProducts();
}

function day(s) {
  return new Date(s + 'T00:00:00');
}

function today() {
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function stat(p) {
  let n = Math.ceil((day(p.expiry) - today()) / 86400000);

  if (n < 0) return ['expired', 'Expired', n];

  if (n <= 2) {
    return [
      'soon',
      n === 0 ? 'Expires today' : `Expires in ${n} day(s)`,
      n
    ];
  }

  return ['fresh', `Fresh · ${n} day(s) left`, n];
}

function esc(s) {
  return String(s || '').replace(
    /[&<>"']/g,
    m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m])
  );
}

function render() {
  let q = $('#search').value.toLowerCase();
  let f = $('#filter').value;

  let a = data
    .filter(p =>
      (p.name + ' ' + (p.batch || '')).toLowerCase().includes(q)
    )
    .filter(p => f === 'all' || stat(p)[0] === f)
    .sort((a, b) => a.expiry.localeCompare(b.expiry));

  $('#total').textContent = data.length;

  $('#soon').textContent =
    data.filter(p => stat(p)[0] === 'soon').length;

  $('#expired').textContent =
    data.filter(p => stat(p)[0] === 'expired').length;

  $('#units').textContent =
    data.reduce((s, p) => s + Number(p.qty || 0), 0);

  $('#empty').style.display = a.length ? 'none' : 'block';

  $('#list').innerHTML = a.map(p => {
    let s = stat(p);

    return `
      <article class="card">
        <div class="top">
          <div>
            <h3>${esc(p.name)}</h3>
            <div class="sub">
              ${esc(p.category)} · ${p.qty} unit(s)
            </div>
          </div>

          <span class="badge ${s[0]}">${s[1]}</span>
        </div>

        <div class="info">
          📅 Expiry:
          <b>${day(p.expiry).toLocaleDateString('en-IE')}</b>
          <br>

          🏷️ Batch:
          ${esc(p.batch) || '—'}

          ${
            p.note
              ? '<br>📦 ' + esc(p.note)
              : ''
          }
        </div>

        <button class="del" onclick="removeP('${p.id}')">
          Delete
        </button>
      </article>
    `;
  }).join('');
}

async function loadProducts() {
  const { data: rows, error } = await db
    .from('products')
    .select('*')
    .order('expiry', { ascending: true });

  if (error) {
    console.error(error);
    alert('Could not load products from Supabase.');
    return;
  }

  data = (rows || []).map(p => ({
    id: p.id,
    name: p.name,
    category: p.category || '',
    qty: p.quantity,
    expiry: p.expiry,
    batch: p.batch || '',
    note: p.note || ''
  }));

  render();
}

function openForm() {
  $('#modal').classList.remove('hidden');

  let d = new Date(Date.now() + 3 * 864e5)
    .toISOString()
    .slice(0, 10);

  $('#form').expiry.value = d;
  $('#form').name.focus();
}

function closeForm() {
  $('#modal').classList.add('hidden');
  $('#form').reset();
}

window.removeP = async id => {
  const { error } = await db
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(error);
    alert('Could not delete product.');
    return;
  }

  data = data.filter(x => x.id !== id);
  render();
};

$('#form').onsubmit = async e => {
  e.preventDefault();

  let f = new FormData(e.target);

  const product = {
    name: f.get('name'),
    category: f.get('category'),
    quantity: Number(f.get('qty')),
    expiry: f.get('expiry'),
    batch: f.get('batch') || null,
    note: f.get('note') || null
  };

  const { data: inserted, error } = await db
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) {
    console.error(error);
    alert('Could not save product to Supabase.');
    return;
  }

  data.push({
    id: inserted.id,
    name: inserted.name,
    category: inserted.category || '',
    qty: inserted.quantity,
    expiry: inserted.expiry,
    batch: inserted.batch || '',
    note: inserted.note || ''
  });

  render();
  closeForm();
};

$('#search').oninput = render;
$('#filter').onchange = render;

initSupabase();   
