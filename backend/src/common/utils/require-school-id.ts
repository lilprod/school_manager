import { ForbiddenException } from '@nestjs/common';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user.js';

export function requireSchoolId(user: AuthenticatedUser): string {
  if (!user.schoolId) {
    throw new ForbiddenException('Cette action nécessite un compte rattaché à une école.');
  }
  return user.schoolId;
}
