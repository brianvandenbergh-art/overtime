import { Link } from 'react-router-dom';
import { Clock, Shield, Users, FileSpreadsheet, Smartphone, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold text-brand-800">
            Overtime<span className="text-brand-500">SA</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/join" className="btn-secondary text-sm">Join with code</Link>
            <Link to="/login" className="btn-secondary text-sm">Sign in</Link>
            <Link to="/register" className="btn-primary text-sm">Start free trial</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight">
          Overtime management<br />
          <span className="text-brand-700">built for South African businesses</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
          Log, approve and export overtime in minutes. BCEA-compliant multipliers,
          multi-company ready, and installable as an app on any phone.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Start 14-day free trial
          </Link>
          <a href="#pricing" className="btn-secondary text-base px-8 py-3">
            View pricing
          </a>
        </div>
        <p className="mt-4 text-sm text-gray-500">No credit card required · Cancel anytime</p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-12">Everything you need</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Clock, title: 'BCEA Overtime Rules', desc: '1.5× weekday, 2× Sunday & public holidays. Auto-calculate hourly rates from monthly salary.' },
              { icon: Users, title: 'Multi-Company & Roles', desc: 'Register your company once. Invite managers, HR and employees. Full data isolation.' },
              { icon: FileSpreadsheet, title: 'Payroll-ready CSV', desc: 'Export approved hours and amounts directly into your payroll system.' },
              { icon: Shield, title: 'Secure & Private', desc: 'AES-256 encryption for salary data. JWT auth and role-based access control.' },
              { icon: Smartphone, title: 'Works as an App', desc: 'Progressive Web App – install on phones and desktops from the browser.' },
              { icon: CheckCircle, title: 'Simple Approvals', desc: 'Employees submit → Managers approve/reject with comments → HR exports.' }
            ].map((f) => (
              <div key={f.title} className="card">
                <f.icon className="text-brand-600 mb-3" size={28} />
                <h3 className="font-semibold text-lg">{f.title}</h3>
                <p className="mt-2 text-gray-600 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-16">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-center mb-4">Simple monthly pricing</h2>
          <p className="text-center text-gray-600 mb-12">Pay with card or Instant EFT via iKhokha</p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Basic', price: 99, features: ['Up to 20 users', 'Overtime logging', 'Manager approvals', 'CSV export', '14-day free trial'] },
              { name: 'Pro', price: 199, features: ['Up to 50 users', 'Everything in Basic', 'Travel & S&T claims', 'Expense claims', 'Dashboard charts'], popular: true },
              { name: 'Enterprise', price: 499, features: ['Unlimited users', 'Everything in Pro', 'Attendance tracking', 'Advanced RBAC', 'Priority support'] }
            ].map((p) => (
              <div key={p.name} className={`card relative ${p.popular ? 'ring-2 ring-brand-600' : ''}`}>
                {p.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-xs px-3 py-1 rounded-full">
                    Most popular
                  </span>
                )}
                <h3 className="text-xl font-bold">{p.name}</h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold">R{p.price}</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="mt-6 space-y-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <CheckCircle size={16} className="text-brand-600 mt-0.5 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="btn-primary w-full mt-6">
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 text-center text-sm text-gray-500">
        © {new Date().getFullYear()} OvertimeSA · Built for South African businesses · Powered by iKhokha
      </footer>
    </div>
  );
}
