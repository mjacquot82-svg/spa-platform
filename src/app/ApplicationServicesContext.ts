import { createContext } from 'react';
import type { ApplicationServices } from './application-composition';
export const ApplicationServicesContext = createContext<ApplicationServices | null>(null);
