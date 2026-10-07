export function InventoryHeading({ administration, title }: { administration: string; title: string }) {
  return <div className="shopping-heading"><div>
    <span className="catalogue-artist">{administration}</span><h1>{title}</h1>
  </div></div>;
}
