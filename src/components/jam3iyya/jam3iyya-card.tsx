export function Jam3iyyaCard({
  name,
  description,
  monthlyAmount
}: Readonly<{
  name: string;
  description: string;
  monthlyAmount: string;
}>) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <h3 className="text-xl font-semibold">{name}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      <p className="mt-4 text-sm font-medium text-primary">{monthlyAmount} / month</p>
    </article>
  );
}