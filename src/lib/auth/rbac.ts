import { Role } from '@prisma/client'

const rank: Record<Role, number> = {
  [Role.EMPLOYEE]: 1,
  [Role.MANAGER]: 2,
  [Role.ADMIN]: 3,
}

export function hasAtLeast(userRole: Role, minRole: Role) {
  return rank[userRole] >= rank[minRole]
}


