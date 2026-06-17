type PageHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  className = "",
}: PageHeaderProps) {
  return (
    <div className={`hero-card ${className}`}>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  );
}