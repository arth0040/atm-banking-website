import { type FormEvent, type ReactNode, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import {
  ArrowDown,
  ArrowRight,
  BookOpen,
  Calculator,
  Check,
  ChevronDown,
  CircleAlert,
  Copy,
  Eraser,
  FlaskConical,
  Info,
  KeyRound,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
type Operator = '+' | '-' | '/' | '//' | '*' | '**' | '%';
type HistoryItem = { first: string; second: string; operator: Operator; result: string };

const operatorNotes: Record<Operator, string> = {
  '+': 'adds the values',
  '-': 'subtracts the second value',
  '/': 'divides and keeps the decimal',
  '//': 'divides and rounds down',
  '*': 'multiplies the values',
  '**': 'raises the first value to a power',
  '%': 'finds the remainder',
};

const pythonCode = [
  'first = float(input("First number: "))',
  'second = float(input("Second number: "))',
  'operator = input("Choose an operator: ")',
  '',
  'if operator == "+":',
  '    result = first + second',
  'elif operator == "/":',
  '    result = first / second',
  'else:',
  '    print("Unknown operator")',
  '',
  'print(f"Result: {result}")',
];

const safeCode = [
  'if operator == "/" and second == 0:',
  '    print("You cannot divide by zero.")',
  'elif operator == "//" and second == 0:',
  '    print("You cannot divide by zero.")',
  'elif operator == "+":',
  '    result = first + second',
  'elif operator == "-":',
  '    result = first - second',
  'else:',
  '    result = calculate(first, second, operator)',
];

const examples: Array<{ first: string; second: string; operator: Operator; label: string }> = [
  { first: '8', second: '3', operator: '%', label: '8 % 3' },
  { first: '2', second: '5', operator: '**', label: '2 ** 5' },
  { first: '17', second: '4', operator: '//', label: '17 // 4' },
];

function formatResult(value: number) {
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(8)).toString();
}

function calculate(first: number, second: number, operator: Operator) {
  switch (operator) {
    case '+': return first + second;
    case '-': return first - second;
    case '/': return first / second;
    case '//': return Math.floor(first / second);
    case '*': return first * second;
    case '**': return first ** second;
    case '%': return first % second;
  }
}

function CodeBlock({ lines, label, safe = false }: { lines: string[]; label: string; safe?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    await navigator.clipboard?.writeText(lines.join('\n'));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  return (
    <div className={`overflow-hidden rounded-2xl border ${safe ? 'border-[#9bcfc2] bg-[#e6f2ee]' : 'border-[#d8cfbc] bg-[#f0e9dc]'}`}>
      <div className="flex items-center justify-between border-b border-inherit px-4 py-3">
        <span className="font-code text-[11px] font-medium uppercase tracking-[.13em] text-[#53615f]">{label}</span>
        <button type="button" onClick={copyCode} data-testid={`button-copy-${safe ? 'safe' : 'original'}-code`} className="focus-ring flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-[#53615f] transition-colors hover:bg-black/5">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-code text-[12px] leading-6 text-[#273736]">
        {lines.map((line, index) => (
          <span className="code-line" key={`${line}-${index}`}>
            <span className="code-number">{index + 1}</span>
            <span className="code-content">{line || ' '}</span>
          </span>
        ))}
      </pre>
    </div>
  );
}

function CalculatorCard() {
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const [operator, setOperator] = useState<Operator>('+');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const expression = useMemo(() => `${first || '0'} ${operator} ${second || '0'}`, [first, operator, second]);

  const runCalculation = (event?: FormEvent) => {
    event?.preventDefault();
    const a = Number(first);
    const b = Number(second);
    if (first.trim() === '' || second.trim() === '') {
      setError('Add a number in both fields first.');
      setResult(null);
      return;
    }
    if (!Number.isFinite(a) || !Number.isFinite(b)) {
      setError('Use regular numbers, like 4 or 3.5.');
      setResult(null);
      return;
    }
    if ((operator === '/' || operator === '//') && b === 0) {
      setError('Python stops here: division by zero is not allowed.');
      setResult(null);
      return;
    }
    const answer = calculate(a, b, operator);
    if (!Number.isFinite(answer)) {
      setError('That calculation grows beyond this small calculator.');
      setResult(null);
      return;
    }
    const formatted = formatResult(answer);
    setError('');
    setResult(formatted);
    setHistory((current) => [{ first, second, operator, result: formatted }, ...current].slice(0, 3));
  };

  const clear = () => {
    setFirst('');
    setSecond('');
    setOperator('+');
    setResult(null);
    setError('');
  };

  const useExample = (example: typeof examples[number]) => {
    setFirst(example.first);
    setSecond(example.second);
    setOperator(example.operator);
    setError('');
    setResult(null);
  };

  return (
    <section id="calculator" className="relative scroll-mt-8 rounded-[1.7rem] border border-[#d8cfbc] bg-[#fffdf8] p-5 soft-shadow sm:p-7">
      <div className="absolute -right-3 -top-3 flex h-12 w-12 rotate-6 items-center justify-center rounded-xl bg-[#e8c65b] text-[#3b3d30] shadow-[4px_5px_0_hsl(220_35%_22%/.12)]">
        <Calculator size={23} strokeWidth={2.2} />
      </div>
      <div className="mb-7 pr-9">
        <div className="mb-2 flex items-center gap-2 text-[#c74c37]">
          <span className="pulse-dot h-2 w-2 rounded-full bg-current" />
          <span className="eyebrow">Interactive lesson</span>
        </div>
        <h2 className="font-display text-3xl leading-tight text-[#243b3a]">Try the safer version</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-[#66716d]">Change the values, pick an operator, and see the same kind of answer Python would give you.</p>
      </div>

      <form onSubmit={runCalculation} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#66716d]">First number</span>
            <input value={first} onChange={(event) => { setFirst(event.target.value); setError(''); }} inputMode="decimal" placeholder="e.g. 12" data-testid="input-first-number" className="focus-ring w-full rounded-xl border border-[#cfc5b1] bg-[#fbf7ef] px-4 py-3 font-code text-lg text-[#243b3a] placeholder:text-[#a7a092] transition-colors focus:border-[#c74c37]" />
          </label>
          <label className="block">
            <span className="mb-2 block text-xs font-bold uppercase tracking-[.1em] text-[#66716d]">Second number</span>
            <input value={second} onChange={(event) => { setSecond(event.target.value); setError(''); }} inputMode="decimal" placeholder="e.g. 4" data-testid="input-second-number" className="focus-ring w-full rounded-xl border border-[#cfc5b1] bg-[#fbf7ef] px-4 py-3 font-code text-lg text-[#243b3a] placeholder:text-[#a7a092] transition-colors focus:border-[#c74c37]" />
          </label>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-[.1em] text-[#66716d]">Operator</span>
            <span className="font-code text-xs text-[#9a9386]">{operatorNotes[operator]}</span>
          </div>
          <div className="mobile-scroll flex gap-2 pb-1">
            {(['+', '-', '/', '//', '*', '**', '%'] as Operator[]).map((item) => (
              <button type="button" key={item} onClick={() => { setOperator(item); setError(''); setResult(null); }} data-testid={`button-operator-${item.replace('*', 'power').replace('/', 'divide').replace('%', 'remainder').replace('-', 'minus').replace('+', 'plus')}`} className={`operator-button focus-ring min-w-[45px] rounded-xl border px-3 py-2 font-code text-sm font-medium ${operator === item ? 'border-[#243b3a] bg-[#243b3a] text-[#fffdf8]' : 'border-[#d8cfbc] bg-[#fbf7ef] text-[#53615f] hover:border-[#9cae9d] hover:bg-[#e8f0e8]'}`}>
                {item}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div role="alert" data-testid="status-calculator-error" className="flex items-start gap-3 rounded-xl border border-[#e8ada0] bg-[#fce9e4] px-4 py-3 text-sm leading-5 text-[#8e382d]">
            <CircleAlert className="mt-0.5 shrink-0" size={17} />
            <span>{error}</span>
          </div>
        )}

        <div className="rounded-2xl bg-[#243b3a] px-5 py-5 text-[#fffdf8]">
          <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[.13em] text-[#b4cbc3]">
            <span>Your expression</span>
            <span className="font-code text-[10px]">Python math</span>
          </div>
          <div className="font-code text-lg text-[#d4e1d8]" data-testid="text-expression">{expression}</div>
          <div className="mt-3 flex min-h-14 items-end justify-between gap-3 border-t border-white/15 pt-3">
            <span className="text-sm text-[#b4cbc3]">Result</span>
            {result ? <strong key={result} className="result-pop font-display text-4xl font-semibold text-[#e8c65b]" data-testid="text-calculator-result">{result}</strong> : <span className="font-code text-sm text-[#829a92]" data-testid="text-calculator-placeholder">waiting for your numbers</span>}
          </div>
        </div>

        <div className="flex gap-3">
          <button type="submit" data-testid="button-calculate" className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#c74c37] px-4 py-3.5 font-bold text-[#fffdf8] shadow-[0_5px_0_#963827] transition-transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-[0_2px_0_#963827]">
            Calculate <ArrowRight size={17} />
          </button>
          <button type="button" onClick={clear} data-testid="button-clear-calculator" className="focus-ring flex items-center justify-center gap-2 rounded-xl border border-[#d8cfbc] bg-[#fbf7ef] px-4 py-3 font-semibold text-[#53615f] transition-colors hover:bg-[#e8f0e8]">
            <Eraser size={16} /> <span className="hidden sm:inline">Clear</span>
          </button>
        </div>
      </form>

      <div className="mt-7 border-t border-[#e5ddcd] pt-5">
        <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[.1em] text-[#66716d]"><Sparkles size={14} className="text-[#c74c37]" /> Quick practice</div>
        <div className="flex flex-wrap gap-2">
          {examples.map((example) => (
            <button type="button" key={example.label} onClick={() => useExample(example)} data-testid={`button-example-${example.operator.replace('*', 'power').replace('/', 'divide').replace('%', 'remainder')}`} className="focus-ring rounded-full border border-[#d8cfbc] bg-[#f7f1e6] px-3 py-1.5 font-code text-xs text-[#53615f] transition-all hover:-translate-y-0.5 hover:border-[#9cae9d] hover:bg-[#e8f0e8]">{example.label}</button>
          ))}
        </div>
      </div>

      {history.length > 0 && (
        <div className="mt-6 border-t border-[#e5ddcd] pt-5">
          <div className="mb-3 flex items-center justify-between text-xs font-bold uppercase tracking-[.1em] text-[#66716d]"><span>Recent answers</span><button type="button" onClick={() => setHistory([])} data-testid="button-clear-history" className="focus-ring flex items-center gap-1 font-semibold normal-case tracking-normal text-[#c74c37] hover:underline"><RotateCcw size={12} /> clear</button></div>
          <div className="space-y-2">
            {history.map((item, index) => (
              <button type="button" key={`${item.first}-${item.second}-${item.operator}-${index}`} onClick={() => useExample({ first: item.first, second: item.second, operator: item.operator, label: `${item.first} ${item.operator} ${item.second}` })} data-testid={`button-history-${index}`} className="focus-ring flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left font-code text-xs text-[#66716d] transition-colors hover:bg-[#f1eadf]">
                <span>{item.first} {item.operator} {item.second}</span><span className="font-semibold text-[#243b3a]">= {item.result}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SectionLabel({ number, children }: { number: string; children: ReactNode }) {
  return <div className="mb-4 flex items-center gap-3"><span className="font-code text-xs font-medium text-[#c74c37]">{number}</span><span className="eyebrow text-[#66716d]">{children}</span><span className="h-px flex-1 bg-[#d8cfbc]" /></div>;
}

function Home() {
  return (
    <main className="app-shell">
      <div className="top-rule" />
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <a href="#top" data-testid="link-home" className="focus-ring flex items-center gap-2.5 rounded-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#243b3a] text-[#e8c65b]"><KeyRound size={17} /></span>
          <span className="font-display text-xl font-semibold tracking-tight text-[#243b3a]">Arth calculator</span>
        </a>
        <nav className="hidden items-center gap-6 text-sm font-semibold text-[#66716d] sm:flex">
          <a href="#calculator" data-testid="link-nav-calculator" className="focus-ring rounded-md transition-colors hover:text-[#243b3a]">Calculator</a>
          <a href="#lesson" data-testid="link-nav-lesson" className="focus-ring rounded-md transition-colors hover:text-[#243b3a]">The lesson</a>
          <a href="#safety" data-testid="link-nav-safety" className="focus-ring rounded-md transition-colors hover:text-[#243b3a]">Safer code</a>
        </nav>
        <div className="flex items-center gap-2 text-xs font-semibold text-[#66716d]"><span className="h-2 w-2 rounded-full bg-[#6caa96]" /> made for curious beginners</div>
      </header>

      <div id="top" className="mx-auto grid max-w-6xl gap-10 px-5 pb-16 pt-9 sm:px-8 lg:grid-cols-[1fr_1.02fr] lg:items-center lg:gap-16 lg:pb-24 lg:pt-16">
        <section className="fade-up">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8cfbc] bg-[#f7f1e6] px-3 py-1.5 text-xs font-semibold text-[#66716d]"><BookOpen size={14} className="text-[#c74c37]" /> a tiny lesson in everyday code</div>
          <h1 className="max-w-xl font-display text-[clamp(3.2rem,7vw,6.1rem)] leading-[.93] tracking-[-.045em] text-[#243b3a]">Answers are <em className="text-[#c74c37] not-italic">better</em> when you know why.</h1>
          <p className="mt-7 max-w-lg text-lg leading-8 text-[#66716d]">Meet a friendly calculator for two numbers — plus the plain-English ideas behind the Python program that makes it work.</p>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a href="#calculator" data-testid="link-hero-calculator" className="focus-ring inline-flex items-center gap-2 rounded-xl bg-[#243b3a] px-5 py-3.5 font-bold text-[#fffdf8] transition-transform hover:-translate-y-0.5">Start calculating <ArrowDown size={17} /></a>
            <span className="font-code text-xs text-[#9a9386]">no setup · no wrong answers</span>
          </div>
          <div className="mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-[#d8cfbc] pt-5 text-sm">
            <div><strong className="block font-display text-2xl text-[#243b3a]">07</strong><span className="text-[#66716d]">operators</span></div>
            <div><strong className="block font-display text-2xl text-[#243b3a]">01</strong><span className="text-[#66716d]">safe habit</span></div>
            <div><strong className="block font-display text-2xl text-[#243b3a]">∞</strong><span className="text-[#66716d]">questions</span></div>
          </div>
        </section>
        <div className="fade-up fade-up-delay-1"><CalculatorCard /></div>
      </div>

      <section id="lesson" className="scroll-mt-8 border-y border-[#d8cfbc] bg-[#e8f0e8]">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20 lg:py-24">
          <div className="fade-up">
            <SectionLabel number="01">Read the recipe</SectionLabel>
            <h2 className="font-display text-4xl leading-tight tracking-[-.03em] text-[#243b3a] sm:text-5xl">A program is just a recipe with choices.</h2>
            <p className="mt-5 max-w-md text-[15px] leading-7 text-[#53615f]">The original calculator asks for ingredients, checks the choice, then prints what it made. Python reads those instructions from top to bottom.</p>
            <div className="mt-7 flex items-start gap-3 rounded-xl border border-[#b9d4ca] bg-[#f4f8f1] p-4 text-sm leading-6 text-[#53615f]"><Info size={17} className="mt-1 shrink-0 text-[#4e8c7b]" /><span><strong className="text-[#243b3a]">Jargon, translated:</strong> a variable is a named box that holds a value. <span className="font-code text-xs">first</span> is one box; <span className="font-code text-xs">second</span> is another.</span></div>
          </div>
          <div className="fade-up fade-up-delay-1">
            <CodeBlock lines={pythonCode} label="the original recipe" />
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {[
                ['1', 'Collect', 'input() listens to the person using the program.'],
                ['2', 'Choose', 'if and elif compare the operator.'],
                ['3', 'Show', 'print() puts the answer on screen.'],
              ].map(([number, title, body]) => <div key={number} className="rounded-xl border border-[#b9d4ca] bg-[#f4f8f1] p-4"><span className="font-code text-xs text-[#c74c37]">{number}</span><h3 className="mt-2 font-semibold text-[#243b3a]">{title}</h3><p className="mt-1 text-xs leading-5 text-[#66716d]">{body}</p></div>)}
            </div>
          </div>
        </div>
      </section>

      <section id="safety" className="scroll-mt-8 mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.08fr_.92fr] lg:items-start">
          <div className="fade-up">
            <SectionLabel number="02">Make it sturdy</SectionLabel>
            <h2 className="max-w-2xl font-display text-4xl leading-tight tracking-[-.03em] text-[#243b3a] sm:text-5xl">Good code expects a curious person to try something unexpected.</h2>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#66716d]">The corrected version keeps the same friendly flow, but adds guardrails. It refuses impossible math before Python has a chance to crash.</p>
            <div className="mt-7 flex items-start gap-4 rounded-2xl border-l-4 border-[#c74c37] bg-[#f7f1e6] p-5">
              <ShieldCheck size={24} className="mt-0.5 shrink-0 text-[#c74c37]" />
              <div><h3 className="font-semibold text-[#243b3a]">Division by zero is a stop sign</h3><p className="mt-1 text-sm leading-6 text-[#66716d]">There is no number that means “how many times does zero fit?” So <span className="font-code text-xs">/</span> and <span className="font-code text-xs">//</span> check for zero before dividing and explain what happened instead.</p></div>
            </div>
          </div>
          <div className="fade-up fade-up-delay-1">
            <CodeBlock lines={safeCode} label="the sturdier recipe" safe />
          </div>
        </div>
      </section>

      <section className="border-t border-[#d8cfbc] bg-[#f7f1e6]">
        <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 lg:py-20">
          <SectionLabel number="03">Keep exploring</SectionLabel>
          <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
            <div className="rounded-2xl bg-[#243b3a] p-7 text-[#fffdf8] sm:p-9">
              <div className="mb-8 flex items-center justify-between"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8c65b] text-[#243b3a]"><FlaskConical size={20} /></div><span className="font-code text-xs text-[#b4cbc3]">operator field notes</span></div>
              <h2 className="max-w-xl font-display text-3xl leading-tight text-[#fffdf8] sm:text-4xl">Seven little symbols, seven ways to ask a number a question.</h2>
              <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
                {Object.entries(operatorNotes).map(([symbol, description]) => <div key={symbol} className="border-t border-white/15 pt-3"><div className="font-code text-xl text-[#e8c65b]">{symbol}</div><p className="mt-1 text-xs leading-5 text-[#b4cbc3]">{description}</p></div>)}
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-2xl border border-[#d8cfbc] bg-[#fffdf8] p-7 sm:p-9">
              <div><div className="mb-5 flex items-center gap-2 text-[#c74c37]"><Lightbulb size={19} /><span className="eyebrow">One idea to take with you</span></div><p className="font-display text-2xl leading-snug text-[#243b3a]">“Before the happy path, ask: what could make this break?”</p><p className="mt-4 text-sm leading-6 text-[#66716d]">That question is the beginning of safer programs — and a surprisingly useful habit outside of code, too.</p></div>
              <a href="#calculator" data-testid="link-footer-practice" className="focus-ring mt-8 inline-flex w-fit items-center gap-2 rounded-lg font-semibold text-[#c74c37] hover:underline">Practice one more <ArrowRight size={16} /></a>
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-8 text-xs text-[#7d827a] sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <span className="font-display text-base text-[#53615f]">Arth calculator</span>
        <span>Small steps. Clear reasons. Safer code.</span>
      </footer>
    </main>
  );
}

function Router() {
  return (
    <ErrorBoundary resetKey={useLocation()[0]}>
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;