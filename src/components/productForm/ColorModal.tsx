import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Color as ColorEntity } from '@/api/entities'; // Corrected path
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2, Palette } from 'lucide-react';

export interface Color {
  id: string;
  name: string;
  hex: string;
}

interface ColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColorsChosen: (colors: Color[]) => void;
}

const isValidHex = (hex: string): boolean => /^#[0-9A-F]{6}$/i.test(hex);

export const ColorModal: React.FC<ColorModalProps> = ({
  isOpen,
  onClose,
  onColorsChosen,
}) => {
  const [colors, setColors] = useState<Color[]>([]);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('');
  const [selectedColorsMap, setSelectedColorsMap] = useState<Map<string, Color>>(new Map());
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [colorToDeleteId, setColorToDeleteId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchAndSetColors = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedColors = await ColorEntity.list();
      setColors(fetchedColors as Color[]); // Cast if your entity returns a slightly different type
    } catch (error) {
      console.error("Erro ao buscar cores:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Buscar Cores",
        description: "Não foi possível carregar a lista de cores.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchAndSetColors();
      setSelectedColorsMap(new Map()); // Reset selection on open
      setEditingColor(null); // Reset editing state
      setNewColorName('');
      setNewColorHex('');
    }
  }, [isOpen, fetchAndSetColors]);

  const handleFormSubmit = async () => {
    if (!newColorName.trim() || !newColorHex.trim()) {
      toast({ variant: "destructive", title: "Campos Obrigatórios", description: "Nome da cor e código HEX são obrigatórios."});
      return;
    }
    if (!isValidHex(newColorHex)) {
      toast({ variant: "destructive", title: "Formato Inválido", description: "Código HEX inválido. Use o formato #RRGGBB."});
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingColor) { // Update existing color
        await ColorEntity.update(editingColor.id, { name: newColorName, hex: newColorHex });
        toast({ title: "Cor Atualizada", description: `Cor "${newColorName}" atualizada com sucesso.` });
      } else { // Create new color
        const createdColor = await ColorEntity.create({ name: newColorName, hex: newColorHex });
        // Optionally auto-select new color, though current flow doesn't require it for product assignment directly
        toast({ title: "Cor Criada", description: `Cor "${newColorName}" criada com sucesso.` });
      }
      fetchAndSetColors(); // Refresh list
      setNewColorName('');
      setNewColorHex('');
      setEditingColor(null);
    } catch (error) {
      console.error("Erro ao salvar cor:", error);
      toast({
        variant: "destructive",
        title: editingColor ? "Erro ao Atualizar" : "Erro ao Criar",
        description: `Não foi possível salvar a cor "${newColorName}".`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditColor = (color: Color) => {
    setEditingColor(color);
    setNewColorName(color.name);
    setNewColorHex(color.hex);
  };

  const cancelEdit = () => {
    setEditingColor(null);
    setNewColorName('');
    setNewColorHex('');
  };

  const promptDeleteColor = (id: string) => {
    setColorToDeleteId(id);
    setIsConfirmDeleteDialogOpen(true);
  };

  const handleDeleteColor = async () => {
    if (!colorToDeleteId) return;
    setIsSubmitting(true);
    try {
      await ColorEntity.delete(colorToDeleteId);
      toast({ title: "Cor Excluída", description: "A cor foi excluída com sucesso." });
      fetchAndSetColors(); // Refresh list
      setSelectedColorsMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(colorToDeleteId);
        return newMap;
      });
      setColorToDeleteId(null);
    } catch (error) {
      console.error("Erro ao excluir cor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: "Não foi possível excluir a cor.",
      });
    } finally {
      setIsSubmitting(false);
      setIsConfirmDeleteDialogOpen(false);
    }
  };
  
  const toggleColorSelection = (color: Color) => {
    setSelectedColorsMap((prevSelected) => {
      const newSelection = new Map(prevSelected);
      if (newSelection.has(color.id)) {
        newSelection.delete(color.id);
      } else {
        newSelection.set(color.id, color);
      }
      return newSelection;
    });
  };

  const handleConfirmSelection = () => {
    onColorsChosen(Array.from(selectedColorsMap.values()));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
        <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingColor ? 'Editar Cor' : 'Selecionar ou Criar Cores'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Create/Edit Color Section */}
            <div className="space-y-3 p-4 border rounded-md">
              <Label className="text-base font-medium">{editingColor ? `Editando: ${editingColor.name}` : 'Criar Nova Cor'}</Label>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 items-start">
                <Input
                  value={newColorName}
                  onChange={(e) => setNewColorName(e.target.value)}
                  placeholder="Nome da Cor (Ex: Azul Royal)"
                  className="flex-1"
                  disabled={isSubmitting}
                />
                <div className="flex space-x-2 items-center w-full sm:w-auto">
                  <Input
                    type="text" // Use text to allow typing '#'
                    value={newColorHex}
                    onChange={(e) => setNewColorHex(e.target.value.toUpperCase())}
                    placeholder="#AABBCC"
                    className="w-32"
                    maxLength={7}
                    disabled={isSubmitting}
                  />
                  {newColorHex && isValidHex(newColorHex) && (
                    <div className="h-6 w-6 rounded-sm border" style={{ backgroundColor: newColorHex }} />
                  )}
                </div>
                
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-2">
                {editingColor && (
                    <Button variant="outline" onClick={cancelEdit} disabled={isSubmitting}>
                        Cancelar Edição
                    </Button>
                )}
                <Button onClick={handleFormSubmit} disabled={isSubmitting || !newColorName.trim() || !newColorHex.trim()}>
                  {isSubmitting ? (editingColor ? 'Salvando...' : 'Criando...') : (editingColor ? 'Salvar Alterações' : 'Criar Cor')}
                </Button>
              </div>
            </div>

            {/* Existing Colors Section */}
            <div className="space-y-2">
              <Label className="text-base font-medium">Cores Existentes</Label>
              {isLoading && <p className="text-sm text-muted-foreground">Carregando cores...</p>}
              {!isLoading && colors.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cor cadastrada.</p>}
              {!isLoading && colors.length > 0 && (
                <ScrollArea className="h-60 rounded-md border p-2">
                  <div className="space-y-1">
                    {colors.map((color) => (
                      <div key={color.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-accent">
                        <Checkbox
                          id={`color-select-${color.id}`}
                          checked={selectedColorsMap.has(color.id)}
                          onCheckedChange={() => toggleColorSelection(color)}
                          disabled={editingColor?.id === color.id} // Disable selection if it's being edited
                        />
                        <div
                          className="h-5 w-5 rounded-sm border"
                          style={{ backgroundColor: color.hex }}
                          title={color.hex}
                        />
                        <Label htmlFor={`color-select-${color.id}`} className="flex-1 cursor-pointer text-sm">
                          {color.name}
                        </Label>
                        <Button variant="ghost" size="sm" onClick={() => handleEditColor(color)} disabled={isSubmitting}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => promptDeleteColor(color.id)} disabled={isSubmitting}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => {cancelEdit(); onClose();}}>Cancelar</Button>
            </DialogClose>
            <Button onClick={handleConfirmSelection} disabled={selectedColorsMap.size === 0 || editingColor !== null}>
              Confirmar Seleção ({selectedColorsMap.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta cor? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setColorToDeleteId(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteColor}
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ColorModal;