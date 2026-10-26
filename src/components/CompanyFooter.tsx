import React, { useState } from 'react';
import { 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  CheckCircle2, 
  ShieldCheck, 
  Zap, 
  Server, 
  Cpu, 
  Wrench, 
  Camera, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Check
} from 'lucide-react';

export const CompanyFooter: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('onestependlesssolutions@gmail.com');
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const services = [
    {
      icon: Server,
      title: 'Enterprise IT & Cloud',
      desc: 'Managed PoE switches, enterprise WiFi 6, structured Cat6 cabling & cloud servers',
    },
    {
      icon: Zap,
      title: 'Solar & Backup Energy',
      desc: 'Commercial solar arrays, hybrid inverters, LiFePO4 batteries & borehole pumps',
    },
    {
      icon: Camera,
      title: 'Security & Surveillance',
      desc: 'AI IP CCTV systems, biometric time-attendance, and electronic gate access',
    },
    {
      icon: Cpu,
      title: 'Software & M-Pesa APIs',
      desc: 'Custom web portals, Safaricom Daraja automation, ERP & database clustering',
    },
    {
      icon: Wrench,
      title: 'Construction & Finishes',
      desc: 'Drywall partitioning, MEP electrical layout, acoustic ceilings & renovations',
    },
    {
      icon: ShieldCheck,
      title: 'Maintenance & SLA',
      desc: 'Round-the-clock technical support, hardware warranty replacement & site audits',
    },
  ];

  return (
    <footer className="mt-12 bg-[#0b1326] border-t border-[#334155] text-slate-300 rounded-xl overflow-hidden shadow-2xl print:hidden">
      {/* Top Banner / Callout Strip */}
      <div className="bg-gradient-to-r from-[#0284c7] via-[#0369a1] to-[#0f172a] p-6 sm:p-8 text-white relative overflow-hidden">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-16 h-16 rounded-xl bg-white p-1.5 shadow-lg flex items-center justify-center shrink-0">
              <img
                src="/assets/aistudio/image_6276447f.png"
                alt="One Step Solution Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  One Step Solution
                </h2>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/20 text-white border border-white/30">
                  Kenya & East Africa
                </span>
              </div>
              <p className="text-sm text-sky-100 font-medium tracking-wide mt-0.5">
                ONE STEP. ENDLESS SOLUTIONS.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyEmail}
              className="px-3.5 py-2 rounded-lg bg-white text-[#0369a1] hover:bg-sky-50 font-semibold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Mail className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'onestependlesssolutions@gmail.com'}</span>
            </button>

            <a
              href="tel:+254111537414"
              className="px-3.5 py-2 rounded-lg bg-[#0b1326]/80 hover:bg-[#0b1326] text-white border border-white/20 font-semibold text-xs transition-all flex items-center gap-1.5"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>+254 111 537 414</span>
            </a>

            <a
              href="https://wa.me/254111537414"
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-lg bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold text-xs transition-all shadow-md flex items-center gap-1.5"
              title="Chat on WhatsApp"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Services Grid */}
      <div className="p-6 sm:p-10 max-w-5xl mx-auto space-y-8">
        <div>
          <div className="text-center max-w-xl mx-auto space-y-1.5 mb-6">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#38bdf8] block">
              Commercial & Engineering Solutions
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              Turnkey Technology, Power & Infrastructure Partner
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              From commercial quotation to complete procurement, site installation, and 24/7 SLA maintenance—One Step Solution delivers everything under one roof.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {services.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[#131b2e] border border-[#1e293b] hover:border-[#0284c7]/50 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0284c7]/15 border border-[#0284c7]/30 text-[#38bdf8] flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-bold text-white mb-1 group-hover:text-[#38bdf8] transition-colors">
                    {srv.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Value Proposition Strip */}
        <div className="p-4 rounded-xl bg-[#131b2e] border border-[#1e293b] flex flex-wrap items-center justify-around gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>KRA Tax Compliant (16% VAT Invoicing)</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Direct Manufacturer Warranty on Hardware</span>
          </div>
          <div className="flex items-center gap-2 text-slate-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Countrywide Delivery & Commissioning Across Kenya</span>
          </div>
        </div>

        {/* Office & Contact Bottom Bar */}
        <div className="pt-6 border-t border-[#1e293b] grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-slate-400">
          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
              Headquarters
            </span>
            <p className="text-slate-300 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-[#38bdf8] shrink-0 mt-0.5" />
              <span>The Westcom Point, Mahiga Mairu Ave, Westlands, Nairobi, Kenya</span>
            </p>
            <p className="text-[11px] text-slate-500">P.O. Box 48201 - 00100 GPO Nairobi</p>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
              Inquiries & Orders
            </span>
            <p className="text-slate-300 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <a href="tel:+254111537414" className="hover:text-emerald-400 transition-colors">
                +254 111 537 414
              </a>
            </p>
            <p className="text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#38bdf8]" />
              <a href="mailto:onestependlesssolutions@gmail.com" className="hover:text-[#38bdf8] transition-colors">
                onestependlesssolutions@gmail.com
              </a>
            </p>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-300 block">
              Online & Digital
            </span>
            <p className="text-slate-300 flex items-center sm:justify-end gap-1.5">
              <Mail className="w-3.5 h-3.5 text-[#38bdf8]" />
              <a href="mailto:onestependlesssolutions@gmail.com" className="hover:text-[#38bdf8] transition-colors">
                onestependlesssolutions@gmail.com
              </a>
            </p>
            <p className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} One Step Solution Ltd. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
