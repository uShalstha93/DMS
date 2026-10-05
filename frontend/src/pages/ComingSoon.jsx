import PageHeader from '../components/PageHeader';

export default function ComingSoon({ title, description }) {
  return (
    <>
      <PageHeader title={title} subtitle={description} />
      <div className="panel px-6 py-16 text-center">
        <p className="font-medium">{title} is not built yet.</p>
        <p className="mt-1 text-sm text-slate-600">This page is ready in the menu and will be filled in with the next feature.</p>
      </div>
    </>
  );
}
