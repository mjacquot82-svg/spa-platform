export interface Role {
  id: string;
  businessId: string;
  name: string;
  description: string;
  systemRole: boolean;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

type ManagedRoleFields =
  | 'id'
  | 'businessId'
  | 'deletedAt'
  | 'createdAt'
  | 'updatedAt';

export type CreateRoleInput = Omit<Role, ManagedRoleFields>;
export type UpdateRoleInput = Partial<CreateRoleInput>;

export interface RoleFilters {
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export type RoleRow = {
  id: string;
  business_id: string;
  name: string;
  description: string;
  system_role: boolean;
  active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type RoleInsert = Omit<
  RoleRow,
  'id' | 'deleted_at' | 'created_at' | 'updated_at'
> & {
  id?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type RoleUpdate = Partial<
  Omit<RoleRow, 'id' | 'business_id' | 'created_at' | 'updated_at'>
>;

export interface RoleDatabase {
  public: {
    Tables: {
      roles: {
        Row: RoleRow;
        Insert: RoleInsert;
        Update: RoleUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      soft_delete_role: {
        Args: { target_business_id: string; target_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
