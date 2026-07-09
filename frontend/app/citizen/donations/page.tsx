'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Package, Send, Printer, CheckCircle, Shield, X, Award, FileText, ArrowRight, Navigation } from 'lucide-react';

const QRIcon = () => (
  <svg width="140" height="140" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-800">
    <rect x="2" y="2" width="6" height="6" strokeWidth="2" />
    <rect x="4" y="4" width="2" height="2" fill="currentColor" />
    <rect x="16" y="2" width="6" height="6" strokeWidth="2" />
    <rect x="18" y="4" width="2" height="2" fill="currentColor" />
    <rect x="2" y="16" width="6" height="6" strokeWidth="2" />
    <rect x="4" y="18" width="2" height="2" fill="currentColor" />
    <path d="M10 2h2v4h-2zm0 8h4v2h-4zm8 0h2v2h-2zm-4 4h2v4h-2zm4 2h2v2h-2zm-8-2h2v2h-2zm8-4h2v2h-2zm-4 4h2v2h-2z" fill="currentColor" />
  </svg>
);

export default function CitizenDonationsPage() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    type: 'goods' as 'goods' | 'funds',
    description: '',
    targetAllocation: 'General Crisis Relief Operations',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [donations, setDonations] = useState<any[]>([]);
  const [selectedCertificateDonation, setSelectedCertificateDonation] = useState<any>(null);
  const [recentPledge, setRecentPledge] = useState<any>(null);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [showPaymentScreen, setShowPaymentScreen] = useState(false);

  // Fetch donation history
  const fetchDonations = async () => {
    try {
      const res = await api.get('/donations');
      setDonations(res.data.donations || []);
    } catch (err) {
      console.error('Failed to fetch donations history:', err);
    }
  };

  useEffect(() => {
    fetchDonations();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.description.trim()) {
      setError('Please describe your donation');
      return;
    }

    if (form.type === 'funds') {
      setShowPaymentScreen(true);
    } else {
      executeSubmit();
    }
  };

  const executeSubmit = async () => {
    setLoading(true);
    setError('');
    const finalDescription = form.type === 'funds'
      ? `[Allocation: ${form.targetAllocation}] ${form.description}`
      : form.description;

    try {
      const res = await api.post('/donations', {
        type: form.type,
        description: finalDescription,
      });

      const newDon = res.data.donation;
      setRecentPledge(newDon);
      setSelectedCertificateDonation(newDon); // Auto-open certificate modal for the new pledge
      setShowSuccessAlert(true);
      setForm({
        type: 'goods',
        description: '',
        targetAllocation: 'General Crisis Relief Operations',
      });
      setShowPaymentScreen(false);
      fetchDonations(); // Refresh ledger list
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit donation');
    } finally {
      setLoading(false);
    }
  };

  // Helper parsing functions to extract target allocation details
  const getAllocationInfo = (desc: string, type: 'goods' | 'funds') => {
    if (type === 'goods') return 'Emergency Supplies & Relief Goods';
    const match = desc.match(/^\[Allocation: (.*?)\]/);
    return match ? match[1] : 'General Crisis Relief Operations';
  };

  const getCleanDescription = (desc: string) => {
    return desc.replace(/^\[Allocation: (.*?)\]\s*/, '');
  };

  if (showPaymentScreen) {
    return (
      <div className="p-4 md:p-6 max-w-md mx-auto space-y-6 animate-slide-up">
        {/* UPI Scan-and-Pay screen */}
        <div className="card p-6 space-y-5 border border-surface-border bg-surface-secondary shadow-lg">
          <div className="text-center">
            <div className="w-12 h-12 bg-accent/15 rounded-full flex items-center justify-center mx-auto mb-3">
              <Shield size={24} className="text-accent" />
            </div>
            <h2 className="text-heading-lg font-bold text-text-primary">UPI Payment Portal</h2>
            <p className="text-xs text-text-secondary mt-1">Scan the QR code using GPay, PhonePe, Paytm, or BHIM to contribute.</p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-slate-200 shadow-inner">
            <QRIcon />
            <span className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-wider font-semibold">UPI ID: donate@aasha.space</span>
          </div>

          <div className="bg-surface-elevated/40 p-3.5 rounded border border-surface-border text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-text-secondary">Payee:</span>
              <span className="font-semibold text-text-primary">Aasha Emergency Relief</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Allocation:</span>
              <span className="font-semibold text-text-primary">{form.targetAllocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Details:</span>
              <span className="font-mono text-text-secondary truncate max-w-[200px]">{form.description}</span>
            </div>
          </div>

          {error && (
            <div className="badge-critical p-3 rounded text-xs">{error}</div>
          )}

          <div className="flex gap-2">
            <button
              onClick={executeSubmit}
              disabled={loading}
              className="flex-1 btn-primary py-2.5 text-xs font-bold cursor-pointer"
            >
              {loading ? 'Verifying Transfer...' : 'Confirm Transfer & Get Certificate'}
            </button>
            <button
              onClick={() => setShowPaymentScreen(false)}
              disabled={loading}
              className="btn-secondary py-2.5 text-xs cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto space-y-6 animate-slide-up">
      <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          nav, sidebar, header, aside, main > :not(.print-modal-overlay), .no-print, button {
            display: none !important;
          }
          .print-modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            background: white !important;
            padding: 0 !important;
            margin: 0 !important;
            z-index: 99999 !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .print-certificate-card {
            border: 14px double #C5A059 !important; /* Gold border */
            padding: 40px !important;
            background: #FDFBF7 !important;
            color: #1E293B !important;
            box-shadow: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 100vh !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: center !important;
            position: relative !important;
          }
        }
      `}</style>

      {/* Header */}
      <div>
        <p className="text-label">Support the Platform</p>
        <h1 className="text-heading-xl mt-1">Donations & Recognition</h1>
      </div>

      {/* Success Alert Banner */}
      {showSuccessAlert && recentPledge && (
        <div className="no-print card p-4 bg-status-resolved/10 border-status-resolved/30 flex items-center justify-between animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-status-resolved/20 flex items-center justify-center">
              <CheckCircle size={20} className="text-status-resolved" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary text-sm">Donation Pledged Successfully</h3>
              <p className="text-xs text-text-secondary">Your pledge has been recorded. View and print your certificate below.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setSelectedCertificateDonation(recentPledge);
              }}
              className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer"
            >
              <Award size={14} />
              Open Certificate
            </button>
            <button
              onClick={() => setShowSuccessAlert(false)}
              className="btn-secondary py-1.5 px-3 text-xs cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Two-Column Layout */}
      <div className="grid lg:grid-cols-5 gap-6 items-start no-print">
        {/* Left Column: Pledge Form (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card p-5 space-y-4">
            <h2 className="text-heading-md border-b border-surface-border pb-2 flex items-center gap-2">
              <Package size={18} className="text-accent" />
              Make a Donation Pledge
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="badge-critical p-3 rounded text-xs">{error}</div>
              )}

              <div>
                <label className="text-label block mb-1.5">Donation Category</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: 'goods' }))}
                    className={`flex-1 card p-2.5 text-center text-xs font-semibold transition-colors cursor-pointer ${
                      form.type === 'goods' ? 'border-accent bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-elevated/40'
                    }`}
                  >
                    Goods / Supplies
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, type: 'funds' }))}
                    className={`flex-1 card p-2.5 text-center text-xs font-semibold transition-colors cursor-pointer ${
                      form.type === 'funds' ? 'border-accent bg-accent/10 text-accent' : 'text-text-secondary hover:bg-surface-elevated/40'
                    }`}
                  >
                    Financial Funds
                  </button>
                </div>
              </div>

              {/* Conditional target allocation block */}
              {form.type === 'funds' && (
                <div>
                  <label htmlFor="allocation" className="text-label block mb-1">Allocate Funds To</label>
                  <select
                    id="allocation"
                    value={form.targetAllocation}
                    onChange={(e) => setForm(prev => ({ ...prev, targetAllocation: e.target.value }))}
                    className="input-field text-xs cursor-pointer"
                  >
                    <option value="Primary Medical & First Aid Supplies">Primary Medical & First Aid Supplies</option>
                    <option value="Emergency Shelter Infrastructure & Beds">Emergency Shelter Infrastructure & Beds</option>
                    <option value="Water Purification & Food Logistics">Water Purification & Food Logistics</option>
                    <option value="Search & Rescue Specialized Gear">Search & Rescue Specialized Gear</option>
                    <option value="General Crisis Relief Operations">General Crisis Relief Operations</option>
                  </select>
                  <span className="text-[10px] text-text-muted mt-1 block">Your financial pledge will directly resource this category.</span>
                </div>
              )}

              <div>
                <label htmlFor="desc" className="text-label block mb-1">
                  {form.type === 'goods' ? 'Supplies List & Quantity' : 'Amount & Allocation Notes'}
                </label>
                <textarea
                  id="desc"
                  value={form.description}
                  onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="input-field min-h-[90px] text-xs resize-y"
                  placeholder={
                    form.type === 'goods'
                      ? 'e.g., 15 heavy blankets, 10 hygiene packs, 2 cases bottled water...'
                      : 'e.g., ₹7500 allocated for water filters or general distribution...'
                  }
                  required
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full py-2.5 flex items-center justify-center gap-1.5 cursor-pointer">
                <Send size={14} />
                {loading ? 'Pledging...' : 'Pledge Donation'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: Ledger / Certificates Grid (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="card p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-surface-border pb-2">
              <h2 className="text-heading-md flex items-center gap-2">
                <Award size={18} className="text-accent" />
                Donation History & Certificates
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-elevated font-semibold text-text-secondary">
                {donations.length} Pledges
              </span>
            </div>

            {donations.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-surface-border rounded bg-surface-elevated/10">
                <FileText size={32} className="text-text-muted mx-auto mb-2" />
                <p className="text-xs text-text-secondary font-medium">No donation history recorded yet</p>
                <p className="text-[10px] text-text-muted mt-0.5">Your pledges and certificates will compile here.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                {donations.map((don) => {
                  const allocation = getAllocationInfo(don.description, don.type);
                  const cleanDesc = getCleanDescription(don.description);
                  const statusColors: Record<string, string> = {
                    pledged: 'badge-info',
                    collected: 'badge-medium',
                    distributed: 'badge-success',
                  };

                  return (
                    <div key={don._id} className="p-3 bg-surface-elevated/30 rounded border border-surface-border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 hover:border-accent/40 transition-colors">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            don.type === 'goods' ? 'bg-status-active/10 text-status-active' : 'bg-accent/10 text-accent'
                          }`}>
                            {don.type}
                          </span>
                          <span className={`text-[10px] capitalize font-bold px-1.5 py-0.5 rounded ${statusColors[don.status] || 'badge-info'}`}>
                            {don.status}
                          </span>
                          <span className="text-[10px] text-text-muted font-mono">
                            {new Date(don.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-[11px] text-text-primary font-bold truncate">
                          {allocation}
                        </p>
                        <p className="text-[10px] text-text-secondary truncate max-w-md">
                          {cleanDesc}
                        </p>
                      </div>

                      <button
                        onClick={() => setSelectedCertificateDonation(don)}
                        className="btn-secondary py-1 px-2.5 text-[10px] font-bold flex items-center gap-1 flex-shrink-0 cursor-pointer w-full sm:w-auto justify-center"
                      >
                        Award View
                        <ArrowRight size={10} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL OVERLAY: Premium Gold Wax Seal Certificate */}
      {selectedCertificateDonation && (
        <div className="print-modal-overlay fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto no-print:animate-fade-in">
          {/* Professional Gilded Certificate Container */}
          <div className="print-certificate-card card w-full max-w-2xl bg-[#FDFBF7] border-[14px] border-double border-[#C5A059] p-6 md:p-12 text-center relative overflow-hidden shadow-2xl rounded-lg text-slate-800 no-print">
            
            {/* Close button (Hidden during printing) */}
            <button
              onClick={() => setSelectedCertificateDonation(null)}
              className="no-print absolute top-4 right-4 text-amber-900/60 hover:text-amber-900 p-1.5 hover:bg-amber-100/40 rounded-full transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            {/* Inner Gold Frame Border */}
            <div className="absolute inset-4 border border-[#C5A059]/20 pointer-events-none rounded-sm"></div>

            {/* Background Watermark Crest */}
            <div className="absolute inset-0 opacity-[0.035] pointer-events-none flex items-center justify-center">
              <Shield size={380} className="text-amber-900" />
            </div>

            <div className="relative z-10 space-y-6">
              {/* Header Emblem */}
              <div className="flex justify-center mb-1">
                <div className="w-14 h-14 rounded-full bg-amber-600/10 flex items-center justify-center border-2 border-amber-600/25">
                  <Award size={28} className="text-amber-700" />
                </div>
              </div>

              <p className="font-display tracking-widest text-[9px] uppercase font-bold text-amber-700/80">
                Aasha DISASTER MANAGEMENT COMMAND
              </p>

              <h1 className="font-serif text-2xl md:text-3xl font-extrabold text-amber-900 uppercase tracking-wide">
                Certificate of Appreciation
              </h1>

              <p className="text-[11px] text-slate-600 italic max-w-md mx-auto leading-relaxed">
                This document officially recognizes the humanitarian contributions and financial/logistical assistance provided to crisis relief operations.
              </p>

              {/* Recipient block */}
              <div className="py-2">
                <span className="text-[8px] text-amber-800 uppercase tracking-wider block font-semibold mb-1">This Honor is Conferred Upon</span>
                <span className="text-xl md:text-2xl font-bold border-b-2 border-amber-600/35 px-12 pb-0.5 inline-block text-slate-900 font-serif">
                  {selectedCertificateDonation.donorId?.name || user?.name || "Jane Doe"}
                </span>
              </div>

              {/* Donation Specifications */}
              <div className="max-w-md mx-auto bg-amber-50/40 p-4 rounded border border-amber-200/50 text-left space-y-1.5">
                <span className="text-[8px] text-amber-800 font-bold block uppercase tracking-widest">Relief Designation</span>
                <p className="text-xs font-semibold text-slate-800">
                  Target: {getAllocationInfo(selectedCertificateDonation.description, selectedCertificateDonation.type)}
                </p>
                <p className="text-[10px] text-slate-600 font-mono leading-normal">
                  Details: {getCleanDescription(selectedCertificateDonation.description)}
                </p>
              </div>

              {/* Signatures & Wax Seal Row */}
              <div className="grid grid-cols-3 gap-2 pt-6 items-center max-w-lg mx-auto text-[10px]">
                {/* Left signature block */}
                <div className="space-y-1 text-center">
                  <span className="font-serif italic text-amber-800 text-xs block font-semibold">
                    Jane Smith
                  </span>
                  <span className="border-t border-slate-300 pt-0.5 block text-[8px] text-slate-500 uppercase tracking-wider scale-90">
                    Command Director
                  </span>
                </div>

                {/* Golden Wax Seal with Ribbons */}
                <div className="flex flex-col items-center justify-center relative">
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-300 via-amber-500 to-yellow-600 rounded-full border-4 border-amber-300 shadow-lg flex items-center justify-center relative z-25">
                    <div className="w-12 h-12 rounded-full border border-dashed border-amber-100 flex flex-col items-center justify-center text-[7px] font-bold text-white uppercase tracking-widest leading-none">
                      <span>FLARE</span>
                      <span className="text-[10px] my-0.5">★</span>
                      <span>COMMAND</span>
                    </div>
                    {/* Ribbons */}
                    <div className="absolute top-12 left-1.5 w-4 h-10 bg-amber-600 -rotate-12 origin-top rounded-b shadow z-10"></div>
                    <div className="absolute top-12 right-1.5 w-4 h-10 bg-amber-600 rotate-12 origin-top rounded-b shadow z-10"></div>
                  </div>
                </div>

                {/* Right signature block */}
                <div className="space-y-1 text-center">
                  <span className="font-serif italic text-amber-800 text-xs block font-semibold">
                    John Doe
                  </span>
                  <span className="border-t border-slate-300 pt-0.5 block text-[8px] text-slate-500 uppercase tracking-wider scale-90">
                    Relief Coordinator
                  </span>
                </div>
              </div>

              {/* Footer specs */}
              <div className="text-[8px] text-slate-500 pt-3 border-t border-slate-200/50 flex justify-between max-w-md mx-auto">
                <span>Verification ID: AASHA-DON-{selectedCertificateDonation._id.slice(-6).toUpperCase()}</span>
                <span>Pledge Date: {new Date(selectedCertificateDonation.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Modal actions (Hidden during print) */}
            <div className="no-print mt-6 pt-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => window.print()}
                className="btn-primary py-1.5 px-3 text-xs flex items-center gap-1 cursor-pointer animate-pulse-subtle"
              >
                <Printer size={12} />
                Print Certificate
              </button>
              <button
                onClick={() => setSelectedCertificateDonation(null)}
                className="btn-secondary py-1.5 px-3 text-xs cursor-pointer"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
