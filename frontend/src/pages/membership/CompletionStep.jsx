import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';

export default function CompletionStep({ resetRegistrationForm }) {
  return (
    <div className="py-8 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ledger-tint">
        <Check size={24} className="text-ledger-dark" />
      </div>
      <h2 className="mt-4 text-2xl font-semibold">दर्ता सफल भयो!</h2>
      <p className="mt-2 text-slate-600">धन्यवाद, तपाईंको दर्ता प्रक्रिया सम्पन्न भयो।</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn-primary" onClick={resetRegistrationForm}>नयाँ सदस्य दर्ता गर्नुहोस्</button>
        <Link to="/membership" className="btn-secondary">सदस्य सूचीमा जानुहोस्</Link>
      </div>
    </div>
  );
}
