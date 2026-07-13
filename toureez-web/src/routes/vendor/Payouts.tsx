import { useQuery } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { LoadingState, ErrorState, EmptyState, StatusBadge, PageHeader } from '../../components/ui';

export default function Payouts() {
  const query = useQuery({ queryKey: ['vendor', 'payouts'], queryFn: vendorApi.listPayouts });
  const accountsQuery = useQuery({ queryKey: ['vendor', 'payout-accounts'], queryFn: vendorApi.listPayoutAccounts });

  return (
    <div>
      <PageHeader title="Payouts" subtitle="Track your earnings and payout status" />

      {/* Payout history */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>Payout History</div>

        {query.isLoading && <LoadingState />}
        {query.isError && <ErrorState message="Failed to load payouts" onRetry={() => query.refetch()} />}
        {query.data?.data && query.data.data.length === 0 && (
          <EmptyState icon="💸" title="No payouts yet" message="Payouts are processed after bookings are completed." />
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {query.data?.data?.map((p) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--heading)', fontSize: '.9rem' }}>
                  {new Date(p.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <StatusBadge status={p.status} />
                <span style={{ fontWeight: 800, color: 'var(--heading)', fontSize: '.95rem' }}>₹{Number(p.amount).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bank accounts */}
      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)' }}>Bank Accounts</div>
          <a href="/vendor/company" style={{ fontSize: '.82rem', color: 'var(--primary)', fontWeight: 600 }}>Manage →</a>
        </div>
        {accountsQuery.data?.data && accountsQuery.data.data.length === 0 && (
          <EmptyState icon="🏦" title="No accounts" message="Add a bank account in Company Profile." />
        )}
        {accountsQuery.data?.data?.map((acc) => (
          <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.9rem' }}>{acc.account_holder_name}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>{acc.bank_name ?? acc.upi_id ?? '—'}</div>
            </div>
            {acc.is_primary && <span className="badge">Primary</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
