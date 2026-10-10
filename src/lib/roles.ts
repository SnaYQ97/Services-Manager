import { Role } from '../../generated/prisma';

export const ROLE_LABELS: Record<Role, string> = {
  [Role.EMPLOYEE]: 'Pracownik',
  [Role.RECEPTIONIST]: 'Rejestratorka',
  [Role.MANAGER]: 'Kierownik',
};
