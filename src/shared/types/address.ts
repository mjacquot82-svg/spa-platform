export interface Address extends Record<string, string | undefined> {
  line1: string;
  line2?: string;
  city?: string;
  region?: string;
  postalCode?: string;
  country: string;
}
