import { NepaliInput } from '@itzsa/nepali-input';
import FormField, { StepTitle, bindField } from '../../components/FormField';

export default function FamilyDetails({ values, errors, touched, handleChange }) {
  const f = { touched, errors };
  const bind = bindField(touched, errors);

  const text = (name, label, placeholder = label) => (
    <FormField label={label} name={name} {...f}>
      <NepaliInput {...bind(name)} type="text" placeholder={placeholder} value={values[name]} onChange={handleChange} />
    </FormField>
  );

  return (
    <section>
      <StepTitle>पारिवारिक विवरण</StepTitle>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {text('fatherName', 'बुबाको नाम')}
        {text('motherName', 'आमाको नाम')}
        {text('grandFatherName', 'बाजेको नाम')}

        <FormField label="वैवाहिक स्थिति" name="maritalStatus" {...f}>
          <select {...bind('maritalStatus')} value={values.maritalStatus} onChange={handleChange}>
            <option value="">-- छान्नुहोस् --</option>
            <option value="अविवाहित">अविवाहित</option>
            <option value="विवाहित">विवाहित</option>
            <option value="अन्य">अन्य</option>
          </select>
        </FormField>

        {text('spouseName', 'पति/पत्नीको नाम')}
        {text('fatherInLawName', 'ससुराको नाम')}
      </div>
    </section>
  );
}
