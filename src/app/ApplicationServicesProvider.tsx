import type { ReactNode } from 'react';
import type { ApplicationServices } from './application-composition';
import { ApplicationServicesContext } from './ApplicationServicesContext';

export function ApplicationServicesProvider({ application, children }: { application: ApplicationServices; children: ReactNode }) { return <ApplicationServicesContext.Provider value={application}>{children}</ApplicationServicesContext.Provider>; }
