export const hasError = (touched, errors, name) => !!(touched[name] && errors[name]);

// Props every input needs: id, name, the right border colour, and aria links to the error text
export const bindField = (touched, errors) => (name) => {
  const invalid = hasError(touched, errors, name);
  return {
    id: name,
    name,
    className: `field ${invalid ? 'field-error' : ''}`,
    'aria-invalid': invalid,
    'aria-describedby': invalid ? `${name}-error` : undefined,
  };
};

export function StepTitle({ children }) {
  return <h2 className="mb-5 text-lg font-semibold">{children}</h2>;
}

// Label + input + error message
export default function FormField({ label, name, touched, errors, className = '', children }) {
  const error = hasError(touched, errors, name) ? errors[name] : null;
  return (
    <div className={className}>
      <label htmlFor={name} className="label">{label}</label>
      {children}
      {error && <p id={`${name}-error`} className="mt-1 text-sm text-stamp">{error}</p>}
    </div>
  );
}
