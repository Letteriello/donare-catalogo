import { create } from 'zustand';
import { ProductDraft, Variant } from '@/types/product';

interface ProductDraftState {
  draft: ProductDraft;
  setDraft: (draft: ProductDraft) => void;
  setBaseName: (baseName: string) => void;
  setCategoryId: (categoryId: string) => void;
  addVariant: (variant: Variant) => void;
  updateVariant: (variantId: string, updatedVariant: Partial<Variant>) => void;
  removeVariant: (variantId: string) => void;
  setVariants: (variants: Variant[]) => void;
  addImageToVariant: (variantId: string, imageUrl: string) => void; // New action
  setStatus: (status: ProductDraft['status']) => void;
  setSeoTitle: (seoTitle: string) => void;
  setSeoDescription: (seoDescription: string) => void;
  setKeywords: (keywords: string[]) => void;
  setMaterial: (material: string) => void;
  setDimensions: (dimensions: string) => void;
  setDescription: (description: string) => void;
  // Add other actions as needed
}

const initialDraftState: ProductDraft = {
  baseName: '',
  categoryId: '',
  variants: [],
  material: '',
  dimensions: '',
  description: '',
  status: 'draft',
  // Initialize other optional fields if necessary
  seoTitle: undefined,
  seoDescription: undefined,
  keywords: undefined,
};

export const useProductDraftStore = create<ProductDraftState>((set) => ({
  draft: initialDraftState,
  setDraft: (draft) => set({ draft }),
  setBaseName: (baseName) =>
    set((state) => ({ draft: { ...state.draft, baseName } })),
  setCategoryId: (categoryId) =>
    set((state) => ({ draft: { ...state.draft, categoryId } })),
  addVariant: (variant) =>
    set((state) => ({
      draft: { ...state.draft, variants: [...state.draft.variants, variant] },
    })),
  updateVariant: (variantId, updatedFields) =>
    set((state) => ({
      draft: {
        ...state.draft,
        variants: state.draft.variants.map((v) =>
          v.id === variantId ? { ...v, ...updatedFields } : v
        ),
      },
    })),
  removeVariant: (variantId) =>
    set((state) => ({
      draft: {
        ...state.draft,
        variants: state.draft.variants.filter((v) => v.id !== variantId),
      },
    })),
  setVariants: (variants) =>
    set((state) => ({ draft: { ...state.draft, variants } })),
  addImageToVariant: (variantId, imageUrl) =>
    set((state) => ({
      draft: {
        ...state.draft,
        variants: state.draft.variants.map((v) => {
          if (v.id === variantId) {
            // Ensure image is not already in the array
            if (!v.images.includes(imageUrl)) {
              return { ...v, images: [...v.images, imageUrl] };
            }
          }
          return v;
        }),
      },
    })),
  setStatus: (status) =>
    set((state) => ({ draft: { ...state.draft, status } })),
  setSeoTitle: (seoTitle) =>
    set((state) => ({ draft: { ...state.draft, seoTitle } })),
  setSeoDescription: (seoDescription) =>
    set((state) => ({ draft: { ...state.draft, seoDescription } })),
  setKeywords: (keywords) =>
    set((state) => ({ draft: { ...state.draft, keywords } })),
  setMaterial: (material) =>
    set((state) => ({ draft: { ...state.draft, material } })),
  setDimensions: (dimensions) =>
    set((state) => ({ draft: { ...state.draft, dimensions } })),
  setDescription: (description) =>
    set((state) => ({ draft: { ...state.draft, description } })),
}));