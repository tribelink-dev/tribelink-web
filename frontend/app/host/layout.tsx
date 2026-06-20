/** Mobile top spacer so fixed host menu button does not overlap page titles. */
export default function HostLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="lg:hidden h-16 shrink-0 safe-area-top pointer-events-none" aria-hidden />
      {children}
    </>
  );
}
