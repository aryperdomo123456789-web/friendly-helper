import { z } from "zod";

export const kindSchema = z.enum(["live", "movie", "series"]);
export type IPTVKind = z.infer<typeof kindSchema>;

export interface Category {
  category_id: string;
  category_name: string;
}

export interface StreamItem {
  id: string;
  name: string;
  icon: string | null;
  ext: string | null;
  rating: string | null;
  category_id: string | null;
}

export interface Server {
  id: string;
  name: string;
  url: string;
  is_active: boolean;
  sort_order: number;
}
