import { Link } from 'react-router-dom';

import { PageContainer } from '../core/layouts';

export default function NotFoundPage() {
  return <PageContainer><section className="mx-auto max-w-xl py-20 text-center"><span className="mx-auto grid size-14 place-items-center rounded-2xl bg-jds-100 text-lg font-bold text-jds-700">404</span><h1 className="mt-5 text-3xl font-semibold tracking-tight text-jds-950">Page not found</h1><p className="mt-2 text-slate-500">The page may have moved or is no longer available.</p><Link to="/dashboard" className="mt-6 inline-flex rounded-lg bg-jds-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-jds-950">Return to Today</Link></section></PageContainer>;
}
