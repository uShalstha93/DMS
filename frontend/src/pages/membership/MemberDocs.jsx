import { useEffect, useState } from 'react';
import { StepTitle } from '../../components/FormField';

// Preview URL for a chosen file; also restores the preview when you come back to this step
function useFilePreview(file) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!file) { setUrl(null); return; }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

function ImagePicker({ label, name, emptyText, file, error, onPick }) {
  const preview = useFilePreview(file);
  return (
    <div>
      <label htmlFor={name} className="label text-center">{label}</label>
      <div className="flex h-48 items-center justify-center overflow-hidden rounded-md border-2 border-dashed border-rule bg-paper">
        {preview ? (
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <span className="text-sm text-slate-500">{emptyText}</span>
        )}
      </div>
      <input
        id={name}
        name={name}
        type="file"
        accept=".jpeg,.jpg,.png"
        onChange={(e) => onPick(e.currentTarget.files[0])}
        aria-invalid={!!error}
        className={`field mt-2 file:mr-3 file:rounded-md file:border-0 file:bg-white file:px-3 file:py-1 file:text-sm file:font-medium ${error ? 'field-error' : ''}`}
      />
      {error && <p className="mt-1 text-sm text-stamp">{error}</p>}
    </div>
  );
}

export default function MemberDocs({ values, errors, touched, setFieldValue }) {
  const err = (name) => (touched[name] && errors[name]) || null;
  return (
    <section>
      <StepTitle>फोटो विवरण</StepTitle>
      <div className="grid gap-6 sm:grid-cols-2 lg:max-w-3xl">
        <ImagePicker label="फोटो" name="photoIm" emptyText="No photo" file={values.photoIm} error={err('photoIm')}
          onPick={(file) => file && setFieldValue('photoIm', file)} />
        <ImagePicker label="हस्ताक्षर" name="signIm" emptyText="No signature" file={values.signIm} error={err('signIm')}
          onPick={(file) => file && setFieldValue('signIm', file)} />
      </div>
    </section>
  );
}
