export type CustomerJson =
  | string
  | number
  | boolean
  | null
  | { [key: string]: CustomerJson | undefined }
  | CustomerJson[];

export type CustomerRow = {
  id: string;
  business_id: string;
  customer_number: string | null;
  first_name: string;
  last_name: string;
  company_name: string | null;
  email: string;
  phone: string;
  address: CustomerJson;
  notes: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CustomerInsert = Omit<CustomerRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type CustomerUpdate = Partial<
  Omit<CustomerRow, 'id' | 'business_id' | 'created_at' | 'updated_at'>
>;

export interface CustomerDatabase {
  public: {
    Tables: {
      customers: {
        Row: CustomerRow;
        Insert: CustomerInsert;
        Update: CustomerUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      soft_delete_customer: {
        Args: { target_business_id: string; target_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
