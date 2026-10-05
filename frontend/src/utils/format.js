export const CURRENCY = 'NPR';

export const money = (n) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: CURRENCY, maximumFractionDigits: 2 }).format(n ?? 0);

export const date = (d) =>
  d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

export const dateTime = (d) =>
  d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export const timeOnly = (d) => new Date(d).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

export const LOAN_TYPES = ['Home Loan', 'Personal Loan', 'Vehicle Loan', 'Business Loan', 'Education Loan', 'Agriculture Loan'];
