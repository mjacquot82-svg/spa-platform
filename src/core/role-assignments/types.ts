export interface RoleAssignment {
  id: string;
  membershipId: string;
  roleId: string;
  businessId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleAssignmentInput {
  membershipId: string;
  roleId: string;
}

export type RoleAssignmentRow = {
  id: string;
  membership_id: string;
  role_id: string;
  business_id: string;
  created_at: string;
  updated_at: string;
};

export type RoleAssignmentInsert = Omit<
  RoleAssignmentRow,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export interface RoleAssignmentDatabase {
  public: {
    Tables: {
      role_assignments: {
        Row: RoleAssignmentRow;
        Insert: RoleAssignmentInsert;
        Update: Record<string, never>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
