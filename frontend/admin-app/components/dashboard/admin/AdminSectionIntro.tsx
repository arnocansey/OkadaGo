export function AdminSectionIntro({
  title
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <section className="exact-admin-section exact-admin-section--compact">
      <div className="exact-admin-heading">
        <h1>{title}</h1>
      </div>
    </section>
  );
}
