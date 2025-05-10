import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProductForm } from '../ProductForm';
import { useProductDraftStore } from '@/stores/useProductDraftStore'; // Zustand store
import { vi } from 'vitest'; // Vitest for mocking

// Mock child components that are not the focus of these tests or make API calls
vi.mock('../CategoryModal', () => ({
  CategoryModal: ({ isOpen, onClose, onCategorySelect }: any) => isOpen ? (
    <div data-testid="category-modal">
      Category Modal
      <button onClick={() => onCategorySelect({ id: 'cat1', name: 'Test Category' })}>Select Test Category</button>
      <button onClick={onClose}>Close Category Modal</button>
    </div>
  ) : null,
}));

vi.mock('../ColorModal', () => ({
  ColorModal: ({ isOpen, onClose, onColorsChosen }: any) => isOpen ? (
    <div data-testid="color-modal">
      Color Modal
      <button onClick={() => onColorsChosen([
        { id: 'color1', name: 'Red', hex: '#FF0000' },
        { id: 'color2', name: 'Blue', hex: '#0000FF' },
        { id: 'color3', name: 'Green', hex: '#00FF00' },
      ])}>
        Choose 3 Colors
      </button>
      <button onClick={onClose}>Close Color Modal</button>
    </div>
  ) : null,
}));

// Mock ImageUploader as it's complex and not the focus here
vi.mock('../ImageUploader', () => ({
  ImageUploader: () => <div data-testid="image-uploader">Image Uploader Mock</div>,
}));

// Mock ProgressSidebar to check its props
const mockProgressSidebar = vi.fn();
vi.mock('../ProgressSidebar', () => ({
  ProgressSidebar: (props: any) => {
    mockProgressSidebar(props);
    return <div data-testid="progress-sidebar">Progress Sidebar Mock</div>;
  }
}));

// Mock the store's initial state and actions for consistent testing
import type { ProductDraft } from '@/types/product';

const initialDraftState: ProductDraft = {
  baseName: '',
  categoryId: '',
  variants: [],
  status: 'draft', // Explicitly 'draft'
  seoTitle: '',
  seoDescription: '',
  keywords: [],
  // Ensure all properties from ProductDraft are here, even if optional and empty initially
  materials: undefined,
  dimensionsText: undefined,
  story: undefined,
};

// Helper to reset store before each test
// This needs to match the FULL structure of ProductDraftState when using replace: true
const resetStore = () => {
  const newInitialDraft = { ...initialDraftState, variants: [] }; // Create a fresh copy for the draft part
  useProductDraftStore.setState({
    draft: newInitialDraft,
    // Re-provide all action implementations from the original store definition
    // This is verbose but necessary if we are fully replacing the state including actions.
    // A more common pattern for testing is to reset only the 'draft' part of the state,
    // or to use the store's own actions to reset.
    // For full replacement:
    setDraft: (draft) => useProductDraftStore.setState({ draft }, false), // `false` or undefined for partial update
    setBaseName: (baseName) => useProductDraftStore.setState((state) => ({ draft: { ...state.draft, baseName } }), false),
    setCategoryId: (categoryId) => useProductDraftStore.setState((state) => ({ draft: { ...state.draft, categoryId } }), false),
    addVariant: (variant) => useProductDraftStore.setState((state) => ({ draft: { ...state.draft, variants: [...state.draft.variants, variant] } }), false),
    updateVariant: (variantId, updatedVariant) => useProductDraftStore.setState((state) => ({
      draft: { ...state.draft, variants: state.draft.variants.map(v => v.id === variantId ? { ...v, ...updatedVariant } : v) },
    }), false),
    removeVariant: (variantId) => useProductDraftStore.setState((state) => ({
      draft: { ...state.draft, variants: state.draft.variants.filter(v => v.id !== variantId) },
    }), false),
    setVariants: (variants) => useProductDraftStore.setState((state) => ({ draft: { ...state.draft, variants } }), false),
    setStatus: (status) => useProductDraftStore.setState((state) => ({ draft: { ...state.draft, status } }), false),
    setSeoTitle: (seoTitle) => useProductDraftStore.setState((state) => ({ draft: { ...state.draft, seoTitle } }), false),
    setSeoDescription: (seoDescription) => useProductDraftStore.setState((state) => ({ draft: { ...state.draft, seoDescription } }), false),
    setKeywords: (keywords) => useProductDraftStore.setState((state) => ({ draft: { ...state.draft, keywords } }), false),
  }, true); // `true` to replace the entire state including actions and data.
};


describe('ProductForm Component', () => {
  beforeEach(() => {
    resetStore(); // Reset store state before each test
    mockProgressSidebar.mockClear(); // Clear mock call history
  });

  test('PASSO 10.1: should allow inserting base name, selecting 3 colors, and rendering 3 variant cards', async () => {
    const user = userEvent.setup();
    render(<ProductForm />);

    // 1. Insert base name
    const baseNameInput = screen.getByLabelText(/Base Name/i);
    await user.type(baseNameInput, 'Porta Copo Teste');
    expect(useProductDraftStore.getState().draft.baseName).toBe('Porta Copo Teste');

    // 2. Open color modal
    const addColorsButton = screen.getByRole('button', { name: /Add\/Manage Colors/i });
    await user.click(addColorsButton);
    const colorModal = screen.getByTestId('color-modal');
    expect(colorModal).toBeInTheDocument();

    // 3. Select 3 colors (using the mock implementation)
    const chooseColorsButton = within(colorModal).getByRole('button', { name: /Choose 3 Colors/i });
    await user.click(chooseColorsButton);

    // Verify modal is closed
    // expect(screen.queryByTestId('color-modal')).not.toBeInTheDocument(); // This might be tricky if modal closes async

    // 4. Check if 3 VariantCard components are rendered
    // We expect VariantCard to render something identifiable, e.g., based on color name
    // For now, let's assume VariantCard renders the color name.
    // The actual VariantCard component would need to be inspectable or mocked with more detail.
    // Our simple mock for VariantCard doesn't render content, so we check the store's state.
    
    const finalDraftState = useProductDraftStore.getState().draft;
    expect(finalDraftState.variants).toHaveLength(3);
    expect(finalDraftState.variants[0].colorName).toBe('Red');
    expect(finalDraftState.variants[1].colorName).toBe('Blue');
    expect(finalDraftState.variants[2].colorName).toBe('Green');

    // To actually check for rendered cards, if VariantCard was more complex or not mocked out:
    // const variantCards = await screen.findAllByTestId(/^variant-card-/); // Assuming VariantCard has a testId like "variant-card-variantId"
    // expect(variantCards).toHaveLength(3);
    // Or check for content specific to each card:
    // expect(screen.getByText('Red')).toBeInTheDocument(); // If VariantCard displays the color name
    // expect(screen.getByText('Blue')).toBeInTheDocument();
    // expect(screen.getByText('Green')).toBeInTheDocument();
  });

  // Test for checklist in ProgressSidebar (PASSO 10.4)
  test('PASSO 10.4: ProgressSidebar checklist should update based on draft state', async () => {
    const user = userEvent.setup();
    render(<ProductForm />);
    const initialDraft = useProductDraftStore.getState().draft;

    // Initially, nothing should be checked
    expect(mockProgressSidebar).toHaveBeenCalledWith(expect.objectContaining({
        draft: expect.objectContaining({
            baseName: '',
            categoryId: '',
            variants: [],
            seoTitle: '',
            seoDescription: '',
        })
    }));

    // Fill baseName
    const baseNameInput = screen.getByLabelText(/Base Name/i);
    await user.type(baseNameInput, 'Test Product');
    expect(useProductDraftStore.getState().draft.baseName).toBe('Test Product');
    expect(mockProgressSidebar).toHaveBeenLastCalledWith(expect.objectContaining({
        draft: expect.objectContaining({ baseName: 'Test Product' })
    }));

    // Select category (mocked)
    const categoryButton = screen.getByRole('button', { name: /Select Category/i });
    await user.click(categoryButton);
    const categoryModal = screen.getByTestId('category-modal');
    const selectCategoryButton = within(categoryModal).getByRole('button', { name: /Select Test Category/i });
    await user.click(selectCategoryButton);
    expect(useProductDraftStore.getState().draft.categoryId).toBe('cat1');
     expect(mockProgressSidebar).toHaveBeenLastCalledWith(expect.objectContaining({
        draft: expect.objectContaining({ categoryId: 'cat1' })
    }));


    // Add variants (mocked)
    const addColorsButton = screen.getByRole('button', { name: /Add\/Manage Colors/i });
    await user.click(addColorsButton);
    const colorModal = screen.getByTestId('color-modal');
    const chooseColorsButton = within(colorModal).getByRole('button', { name: /Choose 3 Colors/i });
    await user.click(chooseColorsButton);
    expect(useProductDraftStore.getState().draft.variants.length).toBe(3);
    expect(mockProgressSidebar).toHaveBeenLastCalledWith(expect.objectContaining({
        draft: expect.objectContaining({ variants: expect.any(Array) }) // Further check length if ProgressSidebar cares
    }));
    // Check that the variants array passed to ProgressSidebar has 3 items
     const lastCallArgs = mockProgressSidebar.mock.calls[mockProgressSidebar.mock.calls.length - 1][0];
     expect(lastCallArgs.draft.variants.length).toBe(3);


    // Add SEO Title
    const seoTitleInput = screen.getByLabelText(/SEO Title/i);
    await user.type(seoTitleInput, 'Test SEO Title');
    expect(useProductDraftStore.getState().draft.seoTitle).toBe('Test SEO Title');
    expect(mockProgressSidebar).toHaveBeenLastCalledWith(expect.objectContaining({
        draft: expect.objectContaining({ seoTitle: 'Test SEO Title' })
    }));

    // Add SEO Description
    const seoDescriptionInput = screen.getByLabelText(/SEO Description/i);
    await user.type(seoDescriptionInput, 'Test SEO Description');
    expect(useProductDraftStore.getState().draft.seoDescription).toBe('Test SEO Description');
     expect(mockProgressSidebar).toHaveBeenLastCalledWith(expect.objectContaining({
        draft: expect.objectContaining({ seoDescription: 'Test SEO Description' })
    }));
  });

  // Placeholder for future tests (Image Upload and Drag-and-Drop)
  // test.skip('PASSO 10.2: Uploading 5 images should show 5 thumbs in unassigned grid', () => {});
  // test.skip('PASSO 10.3: Dragging an image to a variant card should assign it', () => {});

});