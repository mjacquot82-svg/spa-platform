export type CatalogItemRow = {
  id: string;
  business_id: string;
  type: 'Product' | 'Service';
  name: string;
  description: string | null;
  category: string | null;
  image: string | null;
  duration_minutes: number | null;
  buffer_before_minutes: number;
  buffer_after_minutes: number;
  resource_types_required: Array<'staff' | 'room' | 'equipment'>;
  active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type CatalogItemInsert = Omit<CatalogItemRow, 'id' | 'created_at' | 'updated_at' | 'deleted_at'> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
};

export type CatalogItemUpdate = Partial<Omit<CatalogItemRow, 'id' | 'business_id' | 'type' | 'created_at'>>;

export interface CatalogDatabase {
  public: {
    Tables: {
      catalog_items: {
        Row: CatalogItemRow;
        Insert: CatalogItemInsert;
        Update: CatalogItemUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      soft_delete_catalog_item: {
        Args: { target_business_id: string; target_id: string };
        Returns: undefined;
      };
    };
    Enums: {
      catalog_item_type: 'Product' | 'Service';
    };
    CompositeTypes: Record<string, never>;
  };
}
