export const MEMBERSHIP_STATUSES = ['pending', 'active', 'suspended'] as const;

export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export interface Membership {
  id: string;
  userId: string;
  businessId: string;
  status: MembershipStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMembershipInput {
  userId: string;
  businessId: string;
  status?: MembershipStatus;
}

export interface UpdateMembershipInput {
  status: MembershipStatus;
}

export interface MembershipRow {
  id: string;
  user_id: string;
  business_id: string;
  status: MembershipStatus;
  joined_at: string;
  created_at: string;
  updated_at: string;
}
