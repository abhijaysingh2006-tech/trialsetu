import type { RoleId } from './types';

// Role-based access control. In production these map 1:1 to Keycloak realm roles
// (OIDC `realm_access.roles`) and are enforced again server-side in FastAPI dependencies.

export type Permission =
  | 'ae:create' | 'sae:report' | 'coding:decide' | 'rules:edit' | 'batch:status' | 'ec:decide'
  | 'deviation:create' | 'capture' | 'ai:decide' | 'export' | 'vault:breakglass' | 'esign';

export interface RoleDef {
  id: RoleId;
  label: string;
  labelHi: string;
  short: string;
  color: string;
  permissions: Permission[];
  routes: string[]; // allowed route prefixes
  readOnly: boolean;
}

export const ROLES: Record<RoleId, RoleDef> = {
  investigator: {
    id: 'investigator', label: 'Investigator', labelHi: 'अन्वेषक', short: 'INV', color: 'bg-sky-600',
    permissions: ['ae:create', 'sae:report', 'coding:decide', 'deviation:create', 'capture', 'ai:decide', 'export', 'vault:breakglass', 'esign'],
    routes: ['/', '/studies', '/safety', '/batches', '/coding', '/capture', '/ai', '/ethics', '/consent', '/audit', '/interop', '/rules', '/scorecard', '/about'],
    readOnly: false,
  },
  ethics: {
    id: 'ethics', label: 'Ethics Committee', labelHi: 'आचार समिति', short: 'EC', color: 'bg-violet-600',
    permissions: ['ec:decide', 'export', 'esign', 'ai:decide'],
    routes: ['/', '/studies', '/ethics', '/safety', '/consent', '/audit', '/interop', '/rules', '/scorecard', '/about'],
    readOnly: false,
  },
  pv: {
    id: 'pv', label: 'Pharmacovigilance Officer', labelHi: 'फार्माकोविजिलेंस अधिकारी', short: 'PV', color: 'bg-haldi-600',
    permissions: ['ae:create', 'sae:report', 'coding:decide', 'rules:edit', 'batch:status', 'ai:decide', 'export', 'esign'],
    routes: ['/', '/studies', '/safety', '/batches', '/coding', '/ai', '/rules', '/audit', '/interop', '/scorecard', '/about'],
    readOnly: false,
  },
  leadership: {
    id: 'leadership', label: 'Leadership / Regulator', labelHi: 'नेतृत्व / नियामक', short: 'LDR', color: 'bg-brand-700',
    permissions: ['export'],
    routes: ['/', '/studies', '/safety', '/batches', '/ethics', '/ai', '/rules', '/consent', '/audit', '/interop', '/scorecard', '/about'],
    readOnly: true,
  },
};

export function can(role: RoleId, p: Permission) {
  return ROLES[role].permissions.includes(p);
}

export function canRoute(role: RoleId, path: string) {
  const first = '/' + (path.split('/')[1] ?? '');
  return ROLES[role].routes.includes(first === '/' ? '/' : first);
}
