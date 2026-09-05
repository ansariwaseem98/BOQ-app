import { ProjectRecord } from './index';

export type ActiveNavTab = 
  | 'dashboard' 
  | 'projects-list'
  | 'project-info'
  | 'drawings' 
  | 'intelligence'
  | 'takeoff'
  | 'measurement-engine'
  | 'workspace' 
  | 'rcc'
  | 'bbs'
  | 'steel'
  | 'roofing'
  | 'architectural'
  | 'mep'
  | 'boq' 
  | 'rate-analysis'
  | 'tender'
  | 'open-items' 
  | 'conflicts'
  | 'revisions'
  | 'reports'
  | 'exports'
  | 'settings';

export interface NavLocation {
  tab: ActiveNavTab;
  subSection?: string;
  itemId?: string;
  itemTitle?: string;
  sourceTab?: ActiveNavTab;
  extraState?: Record<string, any>;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  location?: NavLocation;
  onClick?: () => void;
  isCurrent?: boolean;
}
