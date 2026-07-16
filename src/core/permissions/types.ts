export interface Permission {
  id: string;
  key: string;
  description: string;
  active: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePermissionInput {
  key: string;
  description: string;
  active: boolean;
}

export type UpdatePermissionInput = Partial<Pick<Permission, 'description' | 'active'>>;

export interface PermissionFilters {
  active?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface RolePermission {
  businessId: string;
  roleId: string;
  permissionId: string;
  createdAt: string;
}

export type PermissionRow = {
  id: string;
  key: string;
  description: string;
  active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PermissionInsert = Omit<
  PermissionRow,
  'id' | 'deleted_at' | 'created_at' | 'updated_at'
> & {
  id?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type PermissionUpdate = Partial<
  Omit<PermissionRow, 'id' | 'key' | 'created_at' | 'updated_at'>
>;

export type RolePermissionRow = {
  business_id: string;
  role_id: string;
  permission_id: string;
  created_at: string;
};

export type RolePermissionInsert = Omit<RolePermissionRow, 'created_at'> & {
  created_at?: string;
};

export interface PermissionDatabase {
  public: {
    Tables: {
      permissions: {
        Row: PermissionRow;
        Insert: PermissionInsert;
        Update: PermissionUpdate;
        Relationships: [];
      };
      role_permissions: {
        Row: RolePermissionRow;
        Insert: RolePermissionInsert;
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
