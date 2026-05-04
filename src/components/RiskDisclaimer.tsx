import { AlertTriangle, TrendingDown, Shield, BookOpen, HelpCircle, Scale } from 'lucide-react';

export default function RiskDisclaimer() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.28)', color: '#f87171' }}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Risk Warning</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Risk{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f87171] to-[#fb923c]">
              Disclaimer
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Last updated: May 2026 · Please read this carefully before using any feature of EDGERIFT.
          </p>
        </div>

        {/* Warning Banner */}
        <div
          className="rounded-2xl p-6 mb-8 flex items-start gap-4"
          style={{ background: 'rgba(248,113,113,0.07)', border: '1px solid rgba(248,113,113,0.25)' }}
        >
          <AlertTriangle className="h-6 w-6 text-[#f87171] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#f87171] mb-1">HIGH RISK WARNING</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trading cryptocurrencies, foreign exchange, and other financial instruments carries a{' '}
              <strong className="text-foreground">substantial risk of loss</strong> and may not be suitable for all investors.
              You could lose some or all of your invested capital. Do not trade with money you cannot afford to lose.
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-6">

          {/* Educational only */}
          <section
            className="rounded-2xl p-8"
            style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              1. For Educational Purposes Only
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              All content on EDGERIFT — including but not limited to courses, written materials, trading algorithms,
              buy/sell signals, strategy descriptions, and the trading simulator — is provided <strong className="text-foreground">
              solely for educational and informational purposes</strong>. Nothing on this platform constitutes, or should
              be construed as, financial advice, investment advice, trading advice, or a recommendation to buy, sell, or
              hold any financial instrument. Always conduct your own research and consult a qualified financial advisor
              before making any investment decision.
            </p>
          </section>

          {/* Simulator */}
          <section
            className="rounded-2xl p-8"
            style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <TrendingDown className="h-5 w-5 text-[#f87171]" />
              2. Simulator ≠ Real Trading
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                The EDGERIFT trading simulator uses <strong className="text-foreground">virtual (paper) money only</strong>.
                No real funds are involved at any stage. Simulator results do not constitute real financial performance
                and cannot be used as evidence of trading skill or profitability.
              </p>
              <p>
                Simulated trading environments differ materially from live markets in several respects including, but
                not limited to: execution speed, slippage, liquidity, market impact, and emotional factors. Past
                performance in a simulated environment does <strong className="text-foreground">not guarantee or predict
                future results</strong> in live markets.
              </p>
              <p>
                Passing a challenge on the EDGERIFT simulator <strong className="text-foreground">does not entitle the
                user to real capital, funding, compensation, or any financial reward</strong> of any kind.
                EDGERIFT is not a prop trading firm and does not manage or allocate real capital.
              </p>
            </div>
          </section>

          {/* Signals */}
          <section
            className="rounded-2xl p-8"
            style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              3. Trading Signals Risk
            </h2>
            <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
              <p>
                Buy/sell signals provided on EDGERIFT are generated by automated algorithms for <strong className="text-foreground">
                educational demonstration only</strong>. They are not tailored to any individual investor's financial
                situation, risk tolerance, or investment objectives.
              </p>
              <p>
                Signal accuracy rates shown are based on historical backtesting and do not guarantee future performance.
                Markets are unpredictable and past signal performance is not indicative of future results. You should
                never follow a signal without your own analysis and judgment.
              </p>
              <p>
                <strong className="text-foreground">You are solely responsible</strong> for any trading decisions you
                make, including any decisions that may be influenced by signals or strategies presented on this platform.
              </p>
            </div>
          </section>

          {/* Volatility */}
          <section
            className="rounded-2xl p-8"
            style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-secondary" />
              4. Cryptocurrency-Specific Risks
            </h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {[
                'Cryptocurrency markets operate 24/7 and can experience extreme price volatility at any time.',
                'Regulatory changes in any jurisdiction may adversely affect the value or legality of digital assets.',
                'Cryptocurrency exchanges and wallets may be subject to hacks, technical failures, or insolvency.',
                'Liquidity can vary significantly across different cryptocurrencies and market conditions.',
                'Leverage amplifies both gains and losses and can result in losses exceeding your initial deposit.',
                'Tax treatment of cryptocurrency gains varies by jurisdiction; consult a tax professional.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#f87171] shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Liability */}
          <section
            className="rounded-2xl p-8"
            style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Scale className="h-5 w-5 text-muted-foreground" />
              5. Limitation of Liability
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              EDGERIFT, its operators, employees, and affiliates shall not be liable for any direct, indirect,
              incidental, consequential, or special damages arising from your use of, or reliance on, any information,
              strategy, signal, or tool provided on this platform. This includes any financial losses incurred in
              live markets as a result of decisions influenced by EDGERIFT content. Your use of the platform is
              entirely at your own risk.
            </p>
          </section>

          {/* Suitability */}
          <section
            className="rounded-2xl p-8"
            style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              6. Suitability &amp; Independent Advice
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Trading and investing in financial markets is not suitable for everyone. Before engaging in real trading,
              ensure you fully understand the risks involved and, where appropriate, seek independent financial advice
              from a licensed professional. You should only trade with capital that you can afford to lose entirely
              without affecting your financial stability or lifestyle.
            </p>
          </section>

          {/* Acknowledgement */}
          <div
            className="rounded-2xl p-6"
            style={{ background: 'rgba(0,255,200,0.04)', border: '1px solid rgba(0,255,200,0.15)' }}
          >
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              By using EDGERIFT you acknowledge that you have read and understood this Risk Disclaimer and agree to
              its terms. If you do not agree, please do not use the platform.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
