import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { PlaceholderPage } from './app/PlaceholderPage';
import { AppShell } from './core/layouts';

const DashboardPage = lazy(() => import('./modules/dashboard/pages/DashboardPage'));
const DeveloperPlayground = import.meta.env.DEV ? lazy(() => import('./app/DeveloperPlayground')) : null;
const NotFoundPage = lazy(() => import('./app/NotFoundPage'));
const CalendarPage = lazy(() => import('./modules/scheduling/pages/CalendarDemo'));
const ResourcesPage = lazy(() => import('./modules/scheduling/pages/ResourcesDemo'));
const BookingPage = lazy(() => import('./modules/booking/pages/BookingDemo'));
const ReschedulePage = lazy(() => import('./modules/booking/pages/RescheduleDemo'));
const AppointmentFormsPage = lazy(() => import('./modules/booking/pages/AppointmentFormsDemo'));
const PlanningPage = lazy(() => import('./modules/scheduling/pages/PlanningDemo'));

function LoadingScreen() {
  return <main className="grid min-h-screen place-items-center bg-slate-50"><div className="text-center" role="status"><span className="mx-auto grid size-11 animate-pulse place-items-center rounded-xl bg-jds-950 text-sm font-bold text-white shadow-sm">J</span><p className="mt-3 text-sm font-medium text-slate-500">Loading workspace…</p></div></main>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          {DeveloperPlayground && <Route path="/playground/*" element={<DeveloperPlayground />} />}

          <Route element={<AppShell />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="calendar" element={<CalendarPage />} />
            <Route path="appointments" element={<ResourcesPage />} />
            <Route path="planning" element={<PlanningPage />} />
            <Route path="booking" element={<BookingPage />} />
            <Route path="reschedule" element={<ReschedulePage />} />
            <Route path="appointment-forms" element={<AppointmentFormsPage />} />
            <Route path="customers" element={<PlaceholderPage title="Customers" description="Manage customer profiles and relationships." />} />
            <Route path="catalog" element={<PlaceholderPage title="Treatments" description="Manage treatments, products, and appointment details." />} />
            <Route path="reports" element={<PlaceholderPage title="Reports" description="Business reporting and operational insights." />} />
            <Route path="settings" element={<PlaceholderPage title="Settings" description="Configure business preferences." />} />
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
