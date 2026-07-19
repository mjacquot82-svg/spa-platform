import { useContext } from 'react';
import { ApplicationServicesContext } from './ApplicationServicesContext';
import type { ApplicationServices } from './application-composition';

export function useApplicationServices(): ApplicationServices { const value = useContext(ApplicationServicesContext); if (!value) throw new Error('Application services are not configured.'); return value; }
