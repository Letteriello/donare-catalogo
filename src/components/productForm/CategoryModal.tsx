import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProductDraftStore } from '@/stores/useProductDraftStore'; // Assuming store path
import { Category as ApiCategory } from '@/api/entities'; // Renamed to avoid conflict

// API functions
const fetchCategories = async () => {
  console.log('Fetching categories from API...');
  try {
    const categories = await ApiCategory.list();
    return categories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
};

const createCategory = async (name: string) => {
  console.log(`Creating category via API: ${name}`);
  try {
    const newCategory = await ApiCategory.create({ name }); // Pass name in an object
    return newCategory;
  } catch (error) {
    console.error("Failed to create category via API:", error);
    throw error; // Re-throw to be caught by caller
  }
};

interface Category {
  id: string;
  name: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategorySelect: (category: Category) => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onCategorySelect,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const setDraftCategoryId = useProductDraftStore((state) => state.setCategoryId);

  useEffect(() => {
    if (isOpen) {
      fetchCategories().then((apiCategories: Array<{ id: string; name?: unknown; [key: string]: any }>) => {
        // Filter out categories that don't have a string 'id' or 'name' property,
        // then map them to the expected Category type.
        const validCategories: Category[] = apiCategories
          .filter(
            (cat): cat is Category => // Type predicate to ensure cat is Category for the map
              cat && typeof cat.id === 'string' && typeof cat.name === 'string'
          )
          .map(cat => ({ // cat is now correctly typed as Category here
            id: cat.id,
            name: cat.name // This should now be type-safe
          }));
        setCategories(validCategories);
      });
    }
  }, [isOpen]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const newCategory = await createCategory(newCategoryName);
      setCategories([...categories, newCategory]);
      setNewCategoryName('');
      // Auto-select the newly created category and close the modal
      handleCategorySelectAndClose(newCategory);
    } catch (error) {
      console.error('Failed to create category:', error);
      // Handle error (e.g., show toast)
    }
  };
  

  const handleCategorySelectAndClose = (category: Category) => {
    setSelectedCategoryId(category.id);
    onCategorySelect(category);
    setDraftCategoryId(category.id);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Selecionar ou Criar Categoria</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="newCategory">Criar Nova Categoria</Label>
            <div className="flex space-x-2">
              <Input
                id="newCategory"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Porta Copos"
              />
              <Button onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                Criar
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Categorias Existentes</Label>
            {categories.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma categoria encontrada.</p>}
            <div className="max-h-60 overflow-y-auto space-y-1">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategoryId === cat.id ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => handleCategorySelectAndClose(cat)}
                >
                  {cat.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
export default CategoryModal;