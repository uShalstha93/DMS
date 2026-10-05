export default function Logo({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M7 3h13l6 6v20H7z" fill="#F4F6F5" />
      <path d="M20 3v6h6z" fill="#B9C7C1" />
      <path d="M11.5 18.5l3.2 3.2 6-6.4" fill="none" stroke="#0E7C66" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 11.5h6M11 14.5h4" stroke="#16222E" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
