import type { MembershipRepository } from './repository';
import type { CreateMembershipInput, Membership, UpdateMembershipInput } from './types';
import {
  requireMembershipId,
  validateCreateMembership,
  validateUpdateMembership,
} from './validation';

export class MembershipService {
  constructor(private readonly repository: MembershipRepository) {}

  listByUser(userId: string): Promise<Membership[]> {
    return this.repository.listByUser(requireMembershipId(userId, 'userId'));
  }

  listByBusiness(businessId: string): Promise<Membership[]> {
    return this.repository.listByBusiness(requireMembershipId(businessId, 'businessId'));
  }

  getById(id: string): Promise<Membership | null> {
    return this.repository.getById(requireMembershipId(id, 'id'));
  }

  getByUserAndBusiness(userId: string, businessId: string): Promise<Membership | null> {
    return this.repository.getByUserAndBusiness(
      requireMembershipId(userId, 'userId'),
      requireMembershipId(businessId, 'businessId'),
    );
  }

  create(input: CreateMembershipInput): Promise<Membership> {
    validateCreateMembership(input);
    return this.repository.create({
      ...input,
      userId: input.userId.trim(),
      businessId: input.businessId.trim(),
    });
  }

  update(id: string, input: UpdateMembershipInput): Promise<Membership> {
    validateUpdateMembership(input);
    return this.repository.update(requireMembershipId(id, 'id'), input);
  }

  delete(id: string): Promise<void> {
    return this.repository.delete(requireMembershipId(id, 'id'));
  }
}
