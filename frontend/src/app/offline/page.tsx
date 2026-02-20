import { Header } from '@/components/layout/Header';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header showSearch={false} />

      <main className="flex items-center justify-center px-4 py-24">
        <div className="w-full max-w-md text-center">
          {/* Offline Icon */}
          <div className="mb-6 flex justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-200">
              <svg
                className="h-12 w-12 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
                />
              </svg>
            </div>
          </div>

          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            તમે ઓફલાઇન છો
          </h1>
          <p className="mb-6 text-gray-600">
            તમારું ઇન્ટરનેટ જોડાણ તપાસો અને ફરી પ્રયત્ન કરો.
          </p>

          <button
            onClick={() => window.location.reload()}
            className="btn-xl w-full bg-primary-500 text-white hover:bg-primary-600"
          >
            ફરી પ્રયત્ન કરો
          </button>
        </div>
      </main>
    </div>
  );
}
