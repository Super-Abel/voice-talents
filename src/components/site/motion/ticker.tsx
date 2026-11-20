/** Bandeau défilant. La seconde copie est décorative : elle est masquée aux lecteurs d'écran. */
export function Ticker({
  items,
  durationSeconds = 34,
  className = "",
}: {
  items: readonly string[];
  durationSeconds?: number;
  className?: string;
}) {
  const group = (ariaHidden: boolean) => (
    <ul
      className="vt-marquee-track"
      aria-hidden={ariaHidden || undefined}
      style={{ animationDuration: `${durationSeconds}s` }}
    >
      {items.map((item) => (
        <li
          key={item}
          className="flex shrink-0 items-center gap-6 font-display text-xl tracking-wide whitespace-nowrap text-ink uppercase sm:text-2xl"
        >
          <span>{item}</span>
          <span className="text-flame-100" aria-hidden="true">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className={`vt-marquee ${className}`.trim()}>
      {group(false)}
      {group(true)}
    </div>
  );
}
