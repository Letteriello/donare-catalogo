import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Color as ColorEntity } from '@/api/entities';
import { useToast } from "@/components/ui/use-toast";
import { Pencil, Trash2 } from 'lucide-react';
import { PredefinedColor } from '@/lib/predefinedColors'; // Import PredefinedColor type

export interface Color {
  id: string; // Can be DB id or temporary like 'predefined_red_0'
  name: string;
  hex: string;
  isPredefined?: boolean; // True if this color originated from the initialPredefinedColors list and is not in DB
}

interface ColorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColorsChosen: (colors: Color[]) => void;
  initialPredefinedColors?: PredefinedColor[]; // To pass the list from ProductForm
}

const isValidHex = (hex: string): boolean => /^#[0-9A-F]{6}$/i.test(hex);

export const ColorModal: React.FC<ColorModalProps> = ({
  isOpen,
  onClose,
  onColorsChosen,
  initialPredefinedColors = [], // Default to empty array
}) => {
  const [dbColors, setDbColors] = useState<Color[]>([]); // Colors fetched from the database
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('');
  const [selectedColorsMap, setSelectedColorsMap] = useState<Map<string, Color>>(new Map());
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingColor, setEditingColor] = useState<Color | null>(null);

  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  const [colorToDeleteId, setColorToDeleteId] = useState<string | null>(null);

  const { toast } = useToast();

  const fetchDbColors = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedColorsFromDb = await ColorEntity.list();
      setDbColors(fetchedColorsFromDb.map(c => ({ ...c, id: String(c.id) })) as Color[]);
    } catch (error) {
      console.error("Erro ao buscar cores do banco de dados:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Buscar Cores",
        description: "Não foi possível carregar a lista de cores do banco de dados.",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      fetchDbColors();
      setSelectedColorsMap(new Map());
      setEditingColor(null);
      setNewColorName('');
      setNewColorHex('');
    }
  }, [isOpen, fetchDbColors]);

  const combinedColors = useMemo(() => {
    const combined = [...dbColors];
    const dbColorNames = new Set(dbColors.map(c => c.name.toLowerCase()));

    initialPredefinedColors.forEach((pColor, index) => {
      if (!dbColorNames.has(pColor.name.toLowerCase())) {
        combined.push({
          id: `predefined_${pColor.name.toLowerCase().replace(/\s+/g, '-')}_${index}`, // Unique temporary ID
          name: pColor.name,
          hex: pColor.hex,
          isPredefined: true,
        });
      }
    });
    // Sort alphabetically by name
    return combined.sort((a, b) => a.name.localeCompare(b.name));
  }, [dbColors, initialPredefinedColors]);


  const handleFormSubmit = async () => {
    if (!newColorName.trim() || !newColorHex.trim()) {
      toast({
        variant: "destructive",
        title: "Campos Obrigatórios",
        description: "Nome da cor e código HEX são obrigatórios.",
        duration: 2000
      });
      return;
    }
    if (!isValidHex(newColorHex)) {
      toast({
        variant: "destructive",
        title: "Formato Inválido",
        description: "Código HEX inválido. Use o formato #RRGGBB.",
        duration: 2000
      });
      return;
    }

    // Check if a predefined color with the same name/hex exists but isn't in the DB yet
    const existingPredefined = initialPredefinedColors.find(
      p => p.name.toLowerCase() === newColorName.trim().toLowerCase() && p.hex.toLowerCase() === newColorHex.trim().toLowerCase()
    );
    const existingDbColor = dbColors.find(
        c => c.name.toLowerCase() === newColorName.trim().toLowerCase()
    );

    if (!editingColor && (existingDbColor || existingPredefined)) {
        // If creating, and a DB color with the same name exists, or
        // a predefined color (not yet in DB) with the same name and hex exists.
        const isInDb = combinedColors.find(c => c.name.toLowerCase() === newColorName.trim().toLowerCase() && !c.isPredefined);
        if (isInDb) {
             toast({
               variant: "default",
               title: "Cor Já Existe",
               description: `A cor "${newColorName.trim()}" já existe no banco de dados.`,
               duration: 2000
             });
             return;
        }
        // If it's a predefined color not yet in DB, we proceed to create it.
        // The toast for "Cor Criada" will be shown.
    }


    setIsSubmitting(true);
    try {
      if (editingColor) { // Update existing color (only non-predefined ones should be editable)
        if (editingColor.isPredefined) {
            toast({
              variant: "destructive",
              title: "Ação Inválida",
              description: "Cores predefinidas que não estão no banco de dados não podem ser editadas diretamente aqui.",
              duration: 2000
            });
            setIsSubmitting(false);
            return;
        }
        await ColorEntity.update(editingColor.id, { name: newColorName, hex: newColorHex });
        toast({
          title: "Cor Atualizada",
          description: `Cor "${newColorName}" atualizada com sucesso.`,
          duration: 2000
        });
      } else { // Create new color
        // This will create the color in the database. If it was a predefined color, it effectively "materializes" it.
        await ColorEntity.create({ name: newColorName, hex: newColorHex });
        toast({
          title: "Cor Criada",
          description: `Cor "${newColorName}" adicionada ao banco de dados com sucesso.`,
          duration: 2000
        });
      }
      fetchDbColors(); // Refresh DB color list
      setNewColorName('');
      setNewColorHex('');
      setEditingColor(null);
    } catch (error: any) {
      console.error("Erro ao salvar cor:", error);
      toast({
        variant: "destructive",
        title: editingColor ? "Erro ao Atualizar" : "Erro ao Criar",
        description: error?.message || `Não foi possível salvar a cor "${newColorName}".`,
        duration: 2000
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditColor = (color: Color) => {
    if (color.isPredefined) {
        // If it's a predefined color not yet in DB, copy its details to the form
        // so the user can "create" it in the database.
        setNewColorName(color.name);
        setNewColorHex(color.hex);
        setEditingColor(null); // Not "editing" a predefined stub
        toast({
          title: "Usar Cor Predefinida",
          description: `Os dados de "${color.name}" foram carregados no formulário para criação.`,
          duration: 2000
        });
        return;
    }
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

    const colorToDeleteDetails = combinedColors.find(c => c.id === colorToDeleteId);
    if (colorToDeleteDetails?.isPredefined) {
      toast({
        variant: "destructive",
        title: "Ação Inválida",
        description: "Cores predefinidas que não estão no banco de dados não podem ser excluídas por aqui.",
        duration: 2000
      });
      setColorToDeleteId(null);
      setIsConfirmDeleteDialogOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await ColorEntity.delete(colorToDeleteId);
      toast({
        title: "Cor Excluída",
        description: "A cor foi excluída com sucesso do banco de dados.",
        duration: 2000
      });
      fetchDbColors(); // Refresh DB color list
      setSelectedColorsMap(prev => {
        const newMap = new Map(prev);
        newMap.delete(colorToDeleteId);
        return newMap;
      });
      setColorToDeleteId(null);
    } catch (error: any) {
      console.error("Erro ao excluir cor:", error);
      toast({
        variant: "destructive",
        title: "Erro ao Excluir",
        description: error?.message || "Não foi possível excluir a cor do banco de dados.",
        duration: 2000
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
              {!isLoading && combinedColors.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma cor cadastrada ou predefinida disponível.</p>}
              {!isLoading && combinedColors.length > 0 && (
                <ScrollArea className="h-60 rounded-md border p-2">
                  <div className="space-y-1">
                    {combinedColors.map((color) => (
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
                          title={`${color.hex}${color.isPredefined ? ' (Predefinida)' : ''}`}
                        />
                        <Label htmlFor={`color-select-${color.id}`} className="flex-1 cursor-pointer text-sm">
                          {color.name} {color.isPredefined ? <span className="text-xs text-muted-foreground">(Predefinida)</span> : ""}
                        </Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditColor(color)}
                          disabled={isSubmitting}
                          title={color.isPredefined ? "Carregar esta cor predefinida no formulário para adicionar ao banco" : "Editar cor"}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => promptDeleteColor(color.id)}
                          disabled={isSubmitting || color.isPredefined} // Prevent deleting predefined stubs
                          title={color.isPredefined ? "Cores predefinidas não salvas não podem ser excluídas aqui" : "Excluir cor do banco"}
                        >
                          <Trash2 className={`h-4 w-4 ${color.isPredefined ? 'text-gray-400' : 'text-red-500'}`} />
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