import ColdsnapClient from '@/components/coldsnap-client';
import ErrorBoundary from '@/components/error-boundary';

export default function Home() {
  return (
    <main className="min-h-screen">
      <ErrorBoundary>
        <ColdsnapClient />
      </ErrorBoundary>
    </main>
  );
}
