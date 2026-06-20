import ProviderSidebar from '@/components/ProviderSidebar';

export default function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <ProviderSidebar />
      <div className="lg:ml-72 pt-16 lg:pt-0">{children}</div>
    </div>
  );
}
