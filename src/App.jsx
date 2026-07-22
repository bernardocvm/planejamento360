import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Database,
  Download,
  FileUp,
  Home,
  Landmark,
  Lock,
  PiggyBank,
  Plus,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  Wallet
} from 'lucide-react';

const BRL = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const TODAY = new Date().toISOString().slice(0, 10);
const CURRENT_MONTH = TODAY.slice(0, 7);

const categoryGroups = {
  Receita: 'Receitas',
  Moradia: 'Essenciais',
  Alimentação: 'Essenciais',
  Transporte: 'Essenciais',
  Saúde: 'Essenciais',
  Educação: 'Importantes',
  'Cartão de Crédito': 'Importantes',
  Lazer: 'Não essenciais',
  Família: 'Importantes',
  Trabalho: 'Trabalho',
  Investimentos: 'Investimentos',
  Financiamentos: 'Passivos',
  Impostos: 'Essenciais',
  Outros: 'Outros'
};

const categories = Object.keys(categoryGroups);

const starterTransactions = [
  { id: crypto.randomUUID(), date: `${CURRENT_MONTH}-03`, source: 'Conta Corrente', type: 'receita', description: 'Receita familiar', category: 'Receita', amount: 22000, status: 'conciliado' },
  { id: crypto.randomUUID(), date: `${CURRENT_MONTH}-05`, source: 'Cartão XP', type: 'despesa', description: 'Supermercado', category: 'Alimentação', amount: 1640.3, status: 'conciliado' },
  { id: crypto.randomUUID(), date: `${CURRENT_MONTH}-08`, source: 'Conta Corrente', type: 'despesa', description: 'Financiamento imobiliário', category: 'Financiamentos', amount: 3200, status: 'conciliado' },
  { id: crypto.randomUUID(), date: `${CURRENT_MONTH}-10`, source: 'XP', type: 'investimento', description: 'Aporte mensal em investimentos', category: 'Investimentos', amount: 4500, status: 'conciliado' },
  { id: crypto.randomUUID(), date: `${CURRENT_MONTH}-12`, source: 'Nubank', type: 'despesa', description: 'Restaurante', category: 'Lazer', amount: 286.9, status: 'pendente' }
];

const starterAssets = [
  { id: crypto.randomUUID(), name: 'Carteira XP', className: 'Investimentos', value: 250000, lastUpdate: TODAY, liquidity: 'Alta' },
  { id: crypto.randomUUID(), name: 'Reserva de emergência', className: 'Caixa', value: 60000, lastUpdate: TODAY, liquidity: 'Alta' },
  { id: crypto.randomUUID(), name: 'Imóvel residencial', className: 'Imóveis', value: 650000, lastUpdate: TODAY, liquidity: 'Baixa' }
];

const starterLiabilities = [
  { id: crypto.randomUUID(), name: 'Financiamento imobiliário', className: 'Longo prazo', balance: 420000, monthlyPayment: 3200, lastUpdate: TODAY },
  { id: crypto.randomUUID(), name: 'Financiamento veículo', className: 'Médio prazo', balance: 60000, monthlyPayment: 1800, lastUpdate: TODAY }
];

const starterBudgets = {
  Moradia: 3500,
  Alimentação: 2600,
  Transporte: 1200,
  Saúde: 1000,
  Educação: 1500,
  'Cartão de Crédito': 4500,
  Lazer: 1200,
  Família: 1500,
  Trabalho: 800,
  Investimentos: 5000,
  Financiamentos: 5000,
  Impostos: 900,
  Outros: 700
};

const rules = [
  { match: ['mercado', 'supermercado', 'padaria'], category: 'Alimentação' },
  { match: ['uber', 'posto', 'combustivel', 'gasolina', 'estacionamento'], category: 'Transporte' },
  { match: ['farmacia', 'hospital', 'medico', 'clinica'], category: 'Saúde' },
  { match: ['escola', 'faculdade', 'curso', 'livro'], category: 'Educação' },
  { match: ['restaurante', 'cinema', 'ifood', 'viagem', 'hotel'], category: 'Lazer' },
  { match: ['financiamento', 'prestacao', 'parcela'], category: 'Financiamentos' },
  { match: ['aporte', 'tesouro', 'cdb', 'xp', 'invest'], category: 'Investimentos' }
];

function Button({ children, className = '', variant = 'primary', ...props }) {
  return <button className={`btn ${variant === 'secondary' ? 'btn-secondary' : 'btn-primary'} ${className}`} {...props}>{children}</button>;
}

function Card({ children, className = '' }) {
  return <div className={`card ${className}`}>{children}</div>;
}

function CardContent({ children, className = '' }) {
  return <div className={`card-content ${className}`}>{children}</div>;
}

function useLocalState(key, fallback) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => localStorage.setItem(key, JSON.stringify(value)), [key, value]);
  return [value, setValue];
}

function moneyToNumber(value) {
  if (typeof value === 'number') return value;
  const cleaned = String(value || '')
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.')
    .replace(/[^0-9.-]/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function normalize(text) {
  return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function detectCategory(description) {
  const text = normalize(description);
  const found = rules.find(rule => rule.match.some(word => text.includes(normalize(word))));
  return found?.category || 'Outros';
}

function splitCsvLine(line) {
  const output = [];
  let current = '';
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if ((char === ';' || char === ',') && !quoted) {
      output.push(current.trim());
      current = '';
    } else current += char;
  }
  output.push(current.trim());
  return output;
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]).map(normalize);
  const get = (row, keys) => {
    const index = headers.findIndex(h => keys.some(k => h.includes(k)));
    return index >= 0 ? row[index] : '';
  };

  return lines.slice(1).map(line => {
    const row = splitCsvLine(line);
    const description = get(row, ['descricao', 'historico', 'memo', 'lancamento', 'estabelecimento']) || 'Lançamento importado';
    const rawValue = moneyToNumber(get(row, ['valor', 'amount', 'total']));
    const rawType = normalize(get(row, ['tipo', 'type', 'natureza']));
    const isIncome = rawType.includes('rece') || rawValue > 0;
    const isInvestment = rawType.includes('invest') || detectCategory(description) === 'Investimentos';
    const type = isIncome ? 'receita' : isInvestment ? 'investimento' : 'despesa';
    const category = get(row, ['categoria', 'category']) || detectCategory(description);

    return {
      id: crypto.randomUUID(),
      date: get(row, ['data', 'date']) || TODAY,
      source: get(row, ['conta', 'cartao', 'origem', 'account', 'source']) || 'Importado',
      type,
      description,
      category,
      amount: Math.abs(rawValue),
      status: 'pendente'
    };
  });
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [transactions, setTransactions] = useLocalState('pfpro_transactions', starterTransactions);
  const [assets, setAssets] = useLocalState('pfpro_assets', starterAssets);
  const [liabilities, setLiabilities] = useLocalState('pfpro_liabilities', starterLiabilities);
  const [budgets, setBudgets] = useLocalState('pfpro_budgets', starterBudgets);
  const [profile, setProfile] = useLocalState('pfpro_profile', { familyName: 'Família Martins', objective: 'Independência financeira', targetReserveMonths: 12 });

  const [transactionForm, setTransactionForm] = useState({ date: TODAY, source: 'Conta Corrente', type: 'despesa', description: '', category: 'Outros', amount: '' });
  const [assetForm, setAssetForm] = useState({ name: '', className: 'Investimentos', value: '', liquidity: 'Média', lastUpdate: TODAY });
  const [liabilityForm, setLiabilityForm] = useState({ name: '', className: 'Curto prazo', balance: '', monthlyPayment: '', lastUpdate: TODAY });

  const filtered = useMemo(() => transactions.filter(t => String(t.date).startsWith(month)), [transactions, month]);
  const metrics = useMemo(() => {
    const income = filtered.filter(t => t.type === 'receita').reduce((s, t) => s + Number(t.amount), 0);
    const expenses = filtered.filter(t => t.type === 'despesa').reduce((s, t) => s + Number(t.amount), 0);
    const investments = filtered.filter(t => t.type === 'investimento').reduce((s, t) => s + Number(t.amount), 0);
    const netCash = income - expenses - investments;
    const totalAssets = assets.reduce((s, a) => s + Number(a.value), 0);
    const totalDebt = liabilities.reduce((s, l) => s + Number(l.balance), 0);
    const netWorth = totalAssets - totalDebt;
    const savingsRate = income > 0 ? (investments + Math.max(netCash, 0)) / income : 0;
    const monthlyDebtPayment = liabilities.reduce((s, l) => s + Number(l.monthlyPayment || 0), 0);
    const reserve = assets.filter(a => ['Caixa', 'Reserva', 'Reserva de emergência'].includes(a.className)).reduce((s, a) => s + Number(a.value), 0);
    const averageExpense = expenses || 1;
    const reserveMonths = reserve / averageExpense;
    return { income, expenses, investments, netCash, totalAssets, totalDebt, netWorth, savingsRate, monthlyDebtPayment, reserve, reserveMonths };
  }, [filtered, assets, liabilities]);

  const expensesByCategory = useMemo(() => {
    const map = {};
    filtered.filter(t => t.type !== 'receita').forEach(t => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [filtered]);

  const monthlySeries = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      const key = String(t.date).slice(0, 7);
      if (!map[key]) map[key] = { income: 0, expenses: 0, investments: 0 };
      if (t.type === 'receita') map[key].income += Number(t.amount);
      if (t.type === 'despesa') map[key].expenses += Number(t.amount);
      if (t.type === 'investimento') map[key].investments += Number(t.amount);
    });
    return Object.entries(map).sort(([a], [b]) => a.localeCompare(b)).slice(-8);
  }, [transactions]);

  function addTransaction() {
    if (!transactionForm.description || !transactionForm.amount) return;
    setTransactions([{ ...transactionForm, id: crypto.randomUUID(), amount: moneyToNumber(transactionForm.amount), status: 'pendente' }, ...transactions]);
    setTransactionForm({ ...transactionForm, description: '', amount: '' });
  }

  function importStatement(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const imported = parseCsv(String(reader.result));
      setTransactions([...imported, ...transactions]);
    };
    reader.readAsText(file, 'UTF-8');
  }

  function exportBackup() {
    const payload = { app: 'Finanças 360 Local', version: '2.0', exportedAt: new Date().toISOString(), profile, transactions, assets, liabilities, budgets };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `financas-360-backup-${TODAY}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function importBackup(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (data.transactions) setTransactions(data.transactions);
        if (data.assets) setAssets(data.assets);
        if (data.liabilities) setLiabilities(data.liabilities);
        if (data.budgets) setBudgets(data.budgets);
        if (data.profile) setProfile(data.profile);
      } catch {
        alert('Arquivo de backup inválido.');
      }
    };
    reader.readAsText(file, 'UTF-8');
  }

  function addAsset() {
    if (!assetForm.name || !assetForm.value) return;
    setAssets([{ ...assetForm, id: crypto.randomUUID(), value: moneyToNumber(assetForm.value) }, ...assets]);
    setAssetForm({ name: '', className: 'Investimentos', value: '', liquidity: 'Média', lastUpdate: TODAY });
  }

  function addLiability() {
    if (!liabilityForm.name || !liabilityForm.balance) return;
    setLiabilities([{ ...liabilityForm, id: crypto.randomUUID(), balance: moneyToNumber(liabilityForm.balance), monthlyPayment: moneyToNumber(liabilityForm.monthlyPayment) }, ...liabilities]);
    setLiabilityForm({ name: '', className: 'Curto prazo', balance: '', monthlyPayment: '', lastUpdate: TODAY });
  }

  function resetDemoData() {
    setTransactions(starterTransactions);
    setAssets(starterAssets);
    setLiabilities(starterLiabilities);
    setBudgets(starterBudgets);
  }

  const menu = [
    { id: 'dashboard', label: 'Painel', icon: Home },
    { id: 'import', label: 'Importar', icon: Upload },
    { id: 'transactions', label: 'Lançamentos', icon: CreditCard },
    { id: 'budget', label: 'Orçamento', icon: BarChart3 },
    { id: 'balance', label: 'Patrimônio', icon: Landmark },
    { id: 'settings', label: 'Configurações', icon: ShieldCheck }
  ];

  return (
    <div className="app-shell">
      <div className="container">
        <header className="hero">
          <div className="hero-content">
            <div className="hero-copy">
              <div className="badge"><Lock size={16} /> Seguro</div>
              <h1>Planejamento 360</h1>
              <p>Centralize orçamento, patrimônio, investimentos, metas financeiras e planejamento de vida em uma única plataforma.</p>
            </div>
            <div className="profile-box">
              <label>Família ou perfil</label>
              <input className="input" value={profile.familyName} onChange={e => setProfile({ ...profile, familyName: e.target.value })} />
              <label>Mês de análise</label>
              <input className="input" type="month" value={month} onChange={e => setMonth(e.target.value)} />
              <Button onClick={exportBackup}><Download size={16} /> Exportar backup</Button>
            </div>
          </div>
        </header>

        <div className="layout">
          <aside className="sidebar">
            <div className="sidebar-title">Navegação</div>
            {menu.map(item => <button key={item.id} onClick={() => setTab(item.id)} className={`nav-item ${tab === item.id ? 'active' : ''}`}><item.icon size={19} />{item.label}</button>)}
          </aside>
          <main className="main-content">
            {tab === 'dashboard' && <Dashboard metrics={metrics} monthlySeries={monthlySeries} expensesByCategory={expensesByCategory} budgets={budgets} profile={profile} />}
            {tab === 'import' && <ImportPanel importStatement={importStatement} importBackup={importBackup} />}
            {tab === 'transactions' && <TransactionsPanel form={transactionForm} setForm={setTransactionForm} addTransaction={addTransaction} transactions={filtered} setTransactions={setTransactions} allTransactions={transactions} />}
            {tab === 'budget' && <BudgetPanel budgets={budgets} setBudgets={setBudgets} expensesByCategory={expensesByCategory} />}
            {tab === 'balance' && <BalancePanel assets={assets} liabilities={liabilities} assetForm={assetForm} setAssetForm={setAssetForm} addAsset={addAsset} liabilityForm={liabilityForm} setLiabilityForm={setLiabilityForm} addLiability={addLiability} setAssets={setAssets} setLiabilities={setLiabilities} />}
            {tab === 'settings' && <SettingsPanel profile={profile} setProfile={setProfile} resetDemoData={resetDemoData} exportBackup={exportBackup} />}
          </main>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ metrics, monthlySeries, expensesByCategory, budgets, profile }) {
  const target = Number(profile.targetReserveMonths) || 1;
  const score = Math.max(0, Math.min(100, Math.round((metrics.savingsRate * 60) + (Math.min(metrics.reserveMonths, target) / target * 40))));
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-stack">
    <div className="metrics-grid">
      <Metric title="Receitas do mês" value={BRL.format(metrics.income)} icon={ArrowUpRight} />
      <Metric title="Despesas do mês" value={BRL.format(metrics.expenses)} icon={ArrowDownRight} />
      <Metric title="Fluxo de caixa livre" value={BRL.format(metrics.netCash)} icon={Wallet} />
      <Metric title="Patrimônio líquido" value={BRL.format(metrics.netWorth)} icon={Landmark} />
    </div>
    <div className="two-col wide-left">
      <Card><CardContent><SectionTitle icon={Banknote} title="DRE pessoal do mês" subtitle="Leitura executiva do resultado familiar." /><Dre metrics={metrics} /></CardContent></Card>
      <Card><CardContent><SectionTitle icon={ShieldCheck} title="Saúde financeira" subtitle="Indicador combinado de reserva e poupança." /><div className="score-row"><div className="score-circle">{score}</div><div className="score-details"><p><strong>Taxa de poupança:</strong> {(metrics.savingsRate * 100).toFixed(1)}%</p><p><strong>Reserva:</strong> {metrics.reserveMonths.toFixed(1)} meses de despesas</p><p><strong>Pagamento de dívidas:</strong> {BRL.format(metrics.monthlyDebtPayment)}/mês</p></div></div></CardContent></Card>
    </div>
    <div className="two-col">
      <Card><CardContent><SectionTitle icon={BarChart3} title="Fluxo de caixa mensal" subtitle="Últimos meses consolidados." /><MonthlyBars data={monthlySeries} /></CardContent></Card>
      <Card><CardContent><SectionTitle icon={PiggyBank} title="Gastos por categoria" subtitle="Realizado versus orçamento." /><CategoryProgress data={expensesByCategory} budgets={budgets} /></CardContent></Card>
    </div>
  </motion.div>;
}

function ImportPanel({ importStatement, importBackup }) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-stack">
    <Card><CardContent><SectionTitle icon={FileUp} title="Importar extratos bancários e cartões" subtitle="Formato inicial: CSV. A lógica identifica tipo, categoria provável e origem." />
      <div className="two-col import-grid">
        <div className="upload-box"><Upload size={40} /><p>Suba arquivos exportados do banco, cartão ou uma planilha padronizada.</p><input type="file" accept=".csv,.txt" onChange={importStatement} /></div>
        <div className="code-box"><h3>Modelo recomendado</h3><pre>{`data;descricao;valor;conta;categoria;tipo\n2026-07-10;Supermercado BH;-350,40;Cartão XP;Alimentação;despesa\n2026-07-15;Receita familiar;22000,00;Conta Corrente;Receita;receita\n2026-07-20;Aporte CDB;-2000,00;XP;Investimentos;investimento`}</pre></div>
      </div>
    </CardContent></Card>
    <Card><CardContent><SectionTitle icon={Database} title="Restaurar backup local" subtitle="Use um backup JSON exportado pelo próprio sistema." /><input className="file-input" type="file" accept=".json" onChange={importBackup} /></CardContent></Card>
  </motion.div>;
}

function TransactionsPanel({ form, setForm, addTransaction, transactions, setTransactions, allTransactions }) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-stack">
    <Card><CardContent><SectionTitle icon={Plus} title="Novo lançamento" subtitle="Receitas, despesas, investimentos e ajustes." />
      <div className="form-grid">
        <input className="input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
        <input className="input" placeholder="Origem" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} />
        <select className="input" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}><option value="despesa">Despesa</option><option value="receita">Receita</option><option value="investimento">Investimento</option></select>
        <input className="input span-2" placeholder="Descrição" value={form.description} onChange={e => setForm({ ...form, description: e.target.value, category: form.category === 'Outros' ? detectCategory(e.target.value) : form.category })} />
        <input className="input" placeholder="Valor" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} />
        <select className="input span-2" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>{categories.map(c => <option key={c}>{c}</option>)}</select>
        <Button className="span-4" onClick={addTransaction}><Plus size={16} /> Adicionar lançamento</Button>
      </div>
    </CardContent></Card>
    <Card><CardContent><SectionTitle icon={CreditCard} title="Lançamentos do mês" subtitle="Base para DRE, orçamento e fluxo de caixa." /><div className="table-wrap"><table><thead><tr><th>Data</th><th>Origem</th><th>Descrição</th><th>Categoria</th><th>Tipo</th><th className="right">Valor</th><th></th></tr></thead><tbody>{transactions.map(t => <tr key={t.id}><td>{t.date}</td><td>{t.source}</td><td>{t.description}</td><td>{t.category}</td><td className="capitalize">{t.type}</td><td className="right strong">{BRL.format(t.amount)}</td><td className="right"><button className="icon-danger" onClick={() => setTransactions(allTransactions.filter(x => x.id !== t.id))}><Trash2 size={16} /></button></td></tr>)}</tbody></table></div></CardContent></Card>
  </motion.div>;
}

function BudgetPanel({ budgets, setBudgets, expensesByCategory }) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-stack"><Card><CardContent><SectionTitle icon={BarChart3} title="Orçamento familiar" subtitle="Defina limites e monitore desvios por categoria." /><div className="budget-grid">{Object.entries(budgets).map(([category, budget]) => { const spent = expensesByCategory.find(([name]) => name === category)?.[1] || 0; const used = budget > 0 ? spent / budget : 0; return <div key={category} className="budget-card"><div className="budget-head"><div><p>{category}</p><small>{categoryGroups[category]}</small></div><span>{BRL.format(spent)} / {BRL.format(budget)}</span></div><div className="progress"><div className={used > 1 ? 'danger' : used > .85 ? 'warning' : 'ok'} style={{ width: `${Math.min(100, used * 100)}%` }} /></div><input className="input" value={budget} onChange={e => setBudgets({ ...budgets, [category]: moneyToNumber(e.target.value) })} /></div>; })}</div></CardContent></Card></motion.div>;
}

function BalancePanel({ assets, liabilities, assetForm, setAssetForm, addAsset, liabilityForm, setLiabilityForm, addLiability, setAssets, setLiabilities }) {
  const totalAssets = assets.reduce((s, a) => s + Number(a.value), 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + Number(l.balance), 0);
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-stack"><div className="metrics-grid three"><Metric title="Total de ativos" value={BRL.format(totalAssets)} icon={PiggyBank} /><Metric title="Total de passivos" value={BRL.format(totalLiabilities)} icon={CreditCard} /><Metric title="Patrimônio líquido" value={BRL.format(totalAssets - totalLiabilities)} icon={Landmark} /></div><div className="two-col"><RegisterCard title="Novo ativo" form={assetForm} setForm={setAssetForm} fields={['name', 'className', 'value', 'liquidity', 'lastUpdate']} labels={{ name: 'Nome', className: 'Classe', value: 'Valor', liquidity: 'Liquidez', lastUpdate: 'Atualização' }} onAdd={addAsset} /><RegisterCard title="Novo passivo" form={liabilityForm} setForm={setLiabilityForm} fields={['name', 'className', 'balance', 'monthlyPayment', 'lastUpdate']} labels={{ name: 'Nome', className: 'Classe', balance: 'Saldo devedor', monthlyPayment: 'Parcela mensal', lastUpdate: 'Atualização' }} onAdd={addLiability} /></div><div className="two-col"><ListCard title="Ativos" items={assets} mainValue="value" remove={id => setAssets(assets.filter(x => x.id !== id))} /><ListCard title="Passivos" items={liabilities} mainValue="balance" remove={id => setLiabilities(liabilities.filter(x => x.id !== id))} /></div></motion.div>;
}

function SettingsPanel({ profile, setProfile, resetDemoData, exportBackup }) {
  return <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="section-stack"><Card><CardContent><SectionTitle icon={ShieldCheck} title="Configurações e privacidade" subtitle="Desenho pensado para zero custo inicial e dados sob seu controle." /><div className="two-col settings-grid"><div className="settings-form"><label>Nome do perfil</label><input className="input" value={profile.familyName} onChange={e => setProfile({ ...profile, familyName: e.target.value })} /><label>Objetivo principal</label><input className="input" value={profile.objective} onChange={e => setProfile({ ...profile, objective: e.target.value })} /><label>Meta de reserva em meses</label><input className="input" value={profile.targetReserveMonths} onChange={e => setProfile({ ...profile, targetReserveMonths: moneyToNumber(e.target.value) || 1 })} /></div><div className="privacy-box"><Info icon={Lock} text="Nesta versão, os dados ficam no navegador via localStorage. Não há servidor, login ou banco online." /><Info icon={Database} text="Para publicar sem gastar, use como site estático. A base continua local em cada navegador." /><Info icon={AlertCircle} text="Não suba dados financeiros reais em repositório público. Publique apenas o código, nunca backups." /><div className="button-row"><Button onClick={exportBackup}><Download size={16} /> Backup</Button><Button onClick={resetDemoData} variant="secondary"><RotateCcw size={16} /> Restaurar demo</Button></div></div></div></CardContent></Card><Card><CardContent><SectionTitle icon={CalendarDays} title="Roadmap profissional" subtitle="Evolução natural sem custo inicial de hospedagem." /><div className="roadmap">{['PWA instalável no celular e computador', 'Importação inteligente por banco e cartão', 'Banco local IndexedDB para maior volume de dados', 'Autenticação e nuvem quando houver usuários externos', 'Dashboard público com dados anônimos ou simulados', 'Versão multiusuário com Supabase ou Firebase no futuro'].map(item => <div key={item} className="roadmap-item"><CheckCircle2 size={20} />{item}</div>)}</div></CardContent></Card></motion.div>;
}

function Metric({ title, value, icon: Icon }) {
  return <Card><CardContent><Icon className="metric-icon" size={25} /><p className="metric-title">{title}</p><p className="metric-value">{value}</p></CardContent></Card>;
}

function SectionTitle({ icon: Icon, title, subtitle }) {
  return <div className="section-title"><div><Icon size={21} /></div><span><h2>{title}</h2><p>{subtitle}</p></span></div>;
}

function Dre({ metrics }) {
  const rows = [['Receita líquida familiar', metrics.income], ['Despesas operacionais familiares', -metrics.expenses], ['Resultado antes dos investimentos', metrics.income - metrics.expenses], ['Aportes e investimentos', -metrics.investments], ['Superávit ou déficit de caixa', metrics.netCash]];
  return <div className="dre-list">{rows.map(([label, value], index) => <div key={label} className={index === rows.length - 1 ? 'highlight' : ''}><span>{label}</span><strong>{BRL.format(value)}</strong></div>)}</div>;
}

function MonthlyBars({ data }) {
  if (!data.length) return <p className="muted">Ainda não há dados suficientes.</p>;
  const max = Math.max(...data.flatMap(([, v]) => [v.income, v.expenses, v.investments, 1]));
  return <div className="monthly-bars">{data.map(([month, v]) => <div key={month} className="month-row"><span>{month}</span><div><Bar label="Receita" value={v.income} max={max} color="green" /><Bar label="Despesa" value={v.expenses} max={max} color="red" /><Bar label="Invest." value={v.investments} max={max} color="blue" /></div></div>)}</div>;
}

function Bar({ label, value, max, color }) {
  return <div className="bar-row"><small>{label}</small><div className="bar-bg"><div className={color} style={{ width: `${Math.max(2, value / max * 100)}%` }} /></div><em>{BRL.format(value)}</em></div>;
}

function CategoryProgress({ data, budgets }) {
  if (!data.length) return <p className="muted">Sem gastos no mês selecionado.</p>;
  return <div className="category-list">{data.map(([category, spent]) => { const budget = budgets[category] || spent; const percent = budget ? spent / budget : 0; return <div key={category}><div className="category-head"><span>{category}</span><span>{BRL.format(spent)} / {BRL.format(budget)}</span></div><div className="progress"><div className={percent > 1 ? 'danger' : 'ok'} style={{ width: `${Math.min(100, percent * 100)}%` }} /></div></div>; })}</div>;
}

function RegisterCard({ title, form, setForm, fields, labels, onAdd }) {
  return <Card><CardContent><h3>{title}</h3><div className="mini-form">{fields.map(field => <input key={field} className="input" type={field === 'lastUpdate' ? 'date' : 'text'} placeholder={labels[field]} value={form[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} />)}</div><Button onClick={onAdd}><Plus size={16} />Adicionar</Button></CardContent></Card>;
}

function ListCard({ title, items, mainValue, remove }) {
  return <Card><CardContent><h3>{title}</h3><div className="asset-list">{items.map(item => <div key={item.id} className="asset-item"><div><p>{item.name}</p><small>{item.className} · Atualizado em {item.lastUpdate}</small><strong>{BRL.format(item[mainValue])}</strong>{item.monthlyPayment ? <small>Parcela: {BRL.format(item.monthlyPayment)}</small> : null}</div><button className="icon-danger" onClick={() => remove(item.id)}><Trash2 size={16} /></button></div>)}</div></CardContent></Card>;
}

function Info({ icon: Icon, text }) {
  return <div className="info"><Icon size={20} /><p>{text}</p></div>;
}
