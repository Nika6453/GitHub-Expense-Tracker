const CAT_META = {
  food:      { label: 'Еда',           color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  transport: { label: 'Транспорт',     color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  fun:       { label: 'Развлечения',   color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  subs:      { label: 'Подписки',      color: '#ec4899', bg: 'rgba(236,72,153,0.12)' },
  other:     { label: 'Прочее',        color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
};

const LS_KEY = 'expense_tracker_v1';

function loadExpenses() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data : [];
  } catch (e) {
    console.error('localStorage parse error:', e);
    return [];
  }
}

function saveExpenses(arr) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(arr));
  } catch (e) {
    console.error('localStorage save error:', e);
  }
}

function formatAmount(n) {
  return n.toLocaleString('ru-RU') + ' ₸';
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return d + '.' + m + '.' + y;
}

function pluralTrat(n) {
  if (n % 100 >= 11 && n % 100 <= 19) return n + ' трат';
  const r = n % 10;
  if (r === 1) return n + ' трата';
  if (r >= 2 && r <= 4) return n + ' траты';
  return n + ' трат';
}

let expenses = loadExpenses();

function render() {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  document.getElementById('total-amount').textContent = formatAmount(total);
  document.getElementById('total-count').textContent = pluralTrat(expenses.length);

  renderCategories(total);
  renderList();
}

function renderCategories(total) {
  const container = document.getElementById('cats-list');
  const sums = {};
  for (const cat of Object.keys(CAT_META)) sums[cat] = 0;
  for (const e of expenses) sums[e.category] = (sums[e.category] || 0) + e.amount;

  const active = Object.entries(sums).filter(([, v]) => v > 0);
  if (active.length === 0) {
    container.innerHTML = '<div style="padding:2rem 1rem;text-align:center;opacity:0.4;font-size:13px;">Пока нет трат</div>';
    return;
  }

  container.innerHTML = active.map(([cat, sum]) => {
    const meta = CAT_META[cat];
    const pct = total > 0 ? Math.round((sum / total) * 100) : 0;
    const barWidth = total > 0 ? (sum / total) * 100 : 0;
    return `
      <div class="cat-row">
        <div class="cat-dot" style="background:${meta.color}"></div>
        <div class="cat-name">${meta.label}</div>
        <div class="cat-bar-wrap">
          <div class="cat-bar" style="width:${barWidth}%;background:${meta.color}"></div>
        </div>
        <div class="cat-amount">${formatAmount(sum)}</div>
      </div>`;
  }).join('');
}

function renderList() {
  const container = document.getElementById('expenses-list');
  if (expenses.length === 0) {
    container.innerHTML = `
      <div class="empty">
        <p>Добавьте первую трату</p>
        <small>Заполните форму слева и нажмите «Добавить трату»</small>
      </div>`;
    return;
  }

  const sorted = [...expenses].sort((a, b) => b.id - a.id);
  container.innerHTML = sorted.map(e => {
    const meta = CAT_META[e.category] || CAT_META.other;
    const desc = e.desc ? e.desc : meta.label;
    return `
      <div class="expense-item" data-id="${e.id}">
        <div class="exp-dot" style="background:${meta.color}"></div>
        <div class="exp-info">
          <div class="exp-top">
            <span class="exp-cat" style="color:${meta.color};background:${meta.bg}">${meta.label}</span>
            <span class="exp-desc">${escHtml(desc)}</span>
          </div>
          <div class="exp-date">${formatDate(e.date)}</div>
        </div>
        <div class="exp-amount">${formatAmount(e.amount)}</div>
        <button class="btn-del" onclick="deleteExpense(${e.id})" title="Удалить">✕</button>
      </div>`;
  }).join('');
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses(expenses);
  render();
}

document.getElementById('btn-clear').addEventListener('click', () => {
  if (expenses.length === 0) return;
  if (confirm('Удалить все траты? Это действие нельзя отменить.')) {
    expenses = [];
    saveExpenses(expenses);
    render();
  }
});

// Set today's date
const today = new Date().toISOString().slice(0, 10);
document.getElementById('f-date').value = today;

document.getElementById('btn-add').addEventListener('click', () => {
  const cat    = document.getElementById('f-cat').value;
  const amount = parseFloat(document.getElementById('f-amount').value);
  const date   = document.getElementById('f-date').value;
  const desc   = document.getElementById('f-desc').value.trim();

  if (!amount || amount <= 0) {
    document.getElementById('f-amount').focus();
    document.getElementById('f-amount').style.borderColor = '#ff5f5f';
    setTimeout(() => document.getElementById('f-amount').style.borderColor = '', 1500);
    return;
  }
  if (!date) {
    document.getElementById('f-date').focus();
    return;
  }

  const entry = { id: Date.now(), category: cat, amount: Math.round(amount), date, desc };
  expenses.push(entry);
  saveExpenses(expenses);

  document.getElementById('f-amount').value = '';
  document.getElementById('f-desc').value = '';
  document.getElementById('f-date').value = today;

  render();
});

// Allow pressing Enter in amount field to submit
document.getElementById('f-amount').addEventListener('keydown', e => {
  if (e.key === 'Enter') document.getElementById('btn-add').click();
});

render();