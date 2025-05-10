export interface Variant {
  id: string;
  color: string;
  hex: string;
  images: string[];
  retail: number;
  wholesale: number;
  sku?: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
}

export interface ProductDraft {
  baseName: string;
  categoryId: string;
  variants: Variant[];
  material: string;
  dimensions: string;
  description: string;
  seoTitle?: string;
  seoDescription?: string;
  keywords?: string[];
  whatsapp_link?: string;
  careInstructions?: string;
  story?: string;
  status: 'draft' | 'published';
}