import type { RoleAssignmentRepository } from './repository';
import type { CreateRoleAssignmentInput, RoleAssignment } from './types';
import {
  requireRoleAssignmentId,
  validateCreateRoleAssignment,
} from './validation';

export class RoleAssignmentService {
  constructor(private readonly repository: RoleAssignmentRepository) {}

  listByMembership(businessId: string, membershipId: string): Promise<RoleAssignment[]> {
    return this.repository.listByMembership(
      requireRoleAssignmentId(businessId, 'businessId'),
      requireRoleAssignmentId(membershipId, 'membershipId'),
    );
  }

  listByRole(businessId: string, roleId: string): Promise<RoleAssignment[]> {
    return this.repository.listByRole(
      requireRoleAssignmentId(businessId, 'businessId'),
      requireRoleAssignmentId(roleId, 'roleId'),
    );
  }

  getById(businessId: string, id: string): Promise<RoleAssignment | null> {
    return this.repository.getById(
      requireRoleAssignmentId(businessId, 'businessId'),
      requireRoleAssignmentId(id, 'id'),
    );
  }

  create(businessId: string, input: CreateRoleAssignmentInput): Promise<RoleAssignment> {
    validateCreateRoleAssignment(input);
    return this.repository.create(requireRoleAssignmentId(businessId, 'businessId'), {
      membershipId: input.membershipId.trim(),
      roleId: input.roleId.trim(),
    });
  }

  delete(businessId: string, id: string): Promise<void> {
    return this.repository.delete(
      requireRoleAssignmentId(businessId, 'businessId'),
      requireRoleAssignmentId(id, 'id'),
    );
  }
}
