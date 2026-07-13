import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vendorApi } from '../../lib/api/vendor';
import { LoadingState, ErrorState, EmptyState, PageHeader } from '../../components/ui';

export default function Company() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['vendor', 'company'], queryFn: vendorApi.getCompany });
  const accountsQuery = useQuery({ queryKey: ['vendor', 'payout-accounts'], queryFn: vendorApi.listPayoutAccounts });

  const [name, setName] = useState('');
  const [about, setAbout] = useState('');
  const [gst, setGst] = useState('');
  const [initialized, setInitialized] = useState(false);

  if (query.data?.data && !initialized) {
    setName(query.data.data.name ?? '');
    setAbout(query.data.data.about ?? '');
    setGst(query.data.data.gst_number ?? '');
    setInitialized(true);
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = { name, about, gst_number: gst || undefined };
      return query.data?.data ? vendorApi.updateCompany(payload) : vendorApi.createCompany(payload);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['vendor', 'company'] }),
  });

  const [accountHolder, setAccountHolder] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');

  const addAccountMutation = useMutation({
    mutationFn: () => vendorApi.addPayoutAccount({ account_holder_name: accountHolder, bank_name: bankName || undefined, account_number: accountNumber || undefined, ifsc_code: ifsc || undefined }),
    onSuccess: () => {
      setAccountHolder(''); setBankName(''); setAccountNumber(''); setIfsc('');
      queryClient.invalidateQueries({ queryKey: ['vendor', 'payout-accounts'] });
    },
  });

  if (query.isLoading) return <LoadingState />;
  if (query.isError && query.error) return <ErrorState message="Failed to load company profile" onRetry={() => query.refetch()} />;

  const company = query.data?.data;

  return (
    <div style={{ maxWidth: 720 }}>
      <PageHeader
        title="Company Profile"
        subtitle={company?.status ? `Status: ${company.status}${company.is_verified ? ' · ✓ Verified' : ''}` : 'Complete your profile to start listing packages'}
      />

      {/* Company info */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>Business Details</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label className="form-label">Company name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your registered business name" required />
          </div>
          <div className="form-group">
            <label className="form-label">About <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(min 10 characters)</span></label>
            <textarea value={about} onChange={(e) => setAbout(e.target.value)} placeholder="Describe your company and what makes your trips special…" style={{ minHeight: 100 }} />
          </div>
          <div className="form-group">
            <label className="form-label">GST number <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
            <input value={gst} onChange={(e) => setGst(e.target.value)} placeholder="e.g. 22AAAAA0000A1Z5" />
          </div>
          <div>
            <button className="btn btn-primary" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
              {saveMutation.isPending ? 'Saving…' : 'Save Profile'}
            </button>
            {saveMutation.isSuccess && <span style={{ marginLeft: 12, color: 'var(--success)', fontSize: '.85rem', fontWeight: 600 }}>✓ Saved</span>}
          </div>
        </div>
      </div>

      {/* Payout accounts */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: '.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--muted)', marginBottom: 16 }}>Payout Accounts</div>

        {accountsQuery.data?.data && accountsQuery.data.data.length === 0 && (
          <EmptyState icon="🏦" title="No bank accounts" message="Add a payout account to receive earnings." />
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {accountsQuery.data?.data?.map((acc) => (
            <div key={acc.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid var(--border-light)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--heading)', fontSize: '.9rem' }}>{acc.account_holder_name}</div>
                <div style={{ fontSize: '.78rem', color: 'var(--muted)' }}>
                  {acc.bank_name ?? acc.upi_id ?? '—'}
                  {acc.account_number ? ` ···· ${acc.account_number.slice(-4)}` : ''}
                </div>
              </div>
              {acc.is_primary && <span className="badge" style={{ fontSize: '.7rem' }}>Primary</span>}
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
          <div style={{ fontSize: '.8rem', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 14 }}>Add New Account</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="form-group">
              <label className="form-label">Account holder name</label>
              <input value={accountHolder} onChange={(e) => setAccountHolder(e.target.value)} placeholder="Name as on bank account" required />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Bank name</label>
                <input value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" />
              </div>
              <div className="form-group">
                <label className="form-label">IFSC code</label>
                <input value={ifsc} onChange={(e) => setIfsc(e.target.value)} placeholder="e.g. HDFC0001234" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Account number</label>
              <input value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Your bank account number" />
            </div>
            <div>
              <button className="btn btn-outline" disabled={addAccountMutation.isPending || !accountHolder} onClick={() => addAccountMutation.mutate()}>
                {addAccountMutation.isPending ? 'Adding…' : '+ Add Account'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
