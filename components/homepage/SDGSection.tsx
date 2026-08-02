import { SDGBadge } from '../shared/SDGBadge';

export function SDGSection() {
  const goals = [
    { id: 'SDG2', desc: 'Eliminating hunger by securing resilient urban food supply chains and supporting community infrastructure.' },
    { id: 'SDG3', desc: 'Maintaining critical municipal healthcare infrastructure and emergency responder access routes.' },
    { id: 'SDG4', desc: 'Ensuring safe, well-maintained civic infrastructure surrounding public schools and educational districts.' },
    { id: 'SDG6', desc: 'Rapidly resolving sewerage and pipeline blockages to secure clean urban water supply networks.' },
    { id: 'SDG10', desc: 'Distributing municipal resources fairly through unbiased AI command dispatch across all neighborhoods.' },
    { id: 'SDG11', desc: 'Building resilient, highly-responsive cities equipped for modern infrastructure maintenance and rapid disaster recovery.' },
  ];

  return (
    <section className="py-24 bg-[var(--surface-2)] border-t border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold font-mukta mb-4 text-[var(--ink)]">
            Contributing to UN Sustainable Development Goals
          </h2>
          <p className="text-[var(--ink-muted)] text-lg max-w-2xl mx-auto">
            Every need resolved on Sahaayak directly contributes to a better, more sustainable future for India.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {goals.map((goal) => (
            <div key={goal.id} className="card flex items-start gap-4 hover:shadow-lg transition-shadow bg-white">
              <div className="shrink-0 mt-1">
                <SDGBadge sdg={goal.id} size="large" />
              </div>
              <div>
                <h3 className="font-bold font-mukta text-lg mb-1" style={{ color: 'var(--ink)' }}>
                  {/* The SDGBadge shows the short name, but we can also display a slightly longer title or rely on badge */}
                </h3>
                <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
                  {goal.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
