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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast"; // Adicionado useToast

interface Dimensions {
  width: string;
  height: string;
  depth: string;
  unit: string;
}

interface DimensionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (dimensionsString: string) => void;
  currentDimensions: string; // e.g., "L: 10cm, A: 20cm, P: 5cm" or "10x20x5 cm"
}

const DEFAULT_UNIT = 'cm';

// Basic parsing (can be made more robust)
const parseDimensionsString = (dimStr: string): Partial<Dimensions> => {
  if (!dimStr) return { unit: DEFAULT_UNIT };
  const dimensions: Partial<Dimensions> = { unit: DEFAULT_UNIT };
  
  // Try "L: Xunit, A: Yunit, P: Zunit" format
  const detailedMatch = dimStr.match(/L:\s*([\d.]+)(\w*),\s*A:\s*([\d.]+)(\w*),\s*P:\s*([\d.]+)(\w*)/i);
  if (detailedMatch) {
    dimensions.width = detailedMatch[1];
    dimensions.height = detailedMatch[3];
    dimensions.depth = detailedMatch[5];
    dimensions.unit = detailedMatch[2] || detailedMatch[4] || detailedMatch[6] || DEFAULT_UNIT;
    return dimensions;
  }

  // Try "X x Y x Z unit" or "Xunit x Yunit x Zunit"
  const simpleMatch = dimStr.match(/([\d.]+)(\w*)\s*x\s*([\d.]+)(\w*)\s*x\s*([\d.]+)(\w*)/i);
  if (simpleMatch) {
    dimensions.width = simpleMatch[1];
    dimensions.height = simpleMatch[3];
    dimensions.depth = simpleMatch[5];
    dimensions.unit = simpleMatch[2] || simpleMatch[4] || simpleMatch[6] || DEFAULT_UNIT;
    return dimensions;
  }
  
  // Fallback for "X Y Z" or just numbers, assuming last part might be unit
  const parts = dimStr.replace(/,/g, '').split(/\s+/).filter(Boolean);
  const unitCandidates = ['cm', 'mm', 'm', 'in', 'ft'];
  let potentialUnit = DEFAULT_UNIT;

  if (parts.length > 0 && unitCandidates.includes(parts[parts.length - 1].toLowerCase())) {
    potentialUnit = parts.pop()!.toLowerCase();
  }
  
  if (parts.length >= 3) {
    dimensions.width = parts[0];
    dimensions.height = parts[1];
    dimensions.depth = parts[2];
    dimensions.unit = potentialUnit;
  } else if (parts.length === 1 && !isNaN(parseFloat(parts[0]))) {
    // If only one number, could be a general size, or user started typing
    // For now, don't assign to w/h/d to avoid confusion.
  }

  return dimensions;
};


export const DimensionsModal: React.FC<DimensionsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  currentDimensions,
}) => {
  const { toast } = useToast(); // Instanciado toast
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [depth, setDepth] = useState('');
  const [unit, setUnit] = useState(DEFAULT_UNIT);

  useEffect(() => {
    if (isOpen && currentDimensions) {
      const parsed = parseDimensionsString(currentDimensions);
      setWidth(parsed.width || '');
      setHeight(parsed.height || '');
      setDepth(parsed.depth || '');
      setUnit(parsed.unit || DEFAULT_UNIT);
    } else if (!isOpen) {
      // Reset when closing if not saving
      // setWidth(''); setHeight(''); setDepth(''); setUnit(DEFAULT_UNIT);
    }
  }, [isOpen, currentDimensions]);

  const handleSave = () => {
    if (width && height && depth && unit) {
      const dimString = `L: ${width}${unit}, A: ${height}${unit}, P: ${depth}${unit}`;
      onSave(dimString);
      onClose();
    } else {
      // Basic validation: all fields must be filled
      // Consider adding a toast message here for better UX
      toast({ // Substituído alert por toast
        title: "Campos incompletos",
        description: "Por favor, preencha todas as dimensões (Largura, Altura, Profundidade) e selecione uma unidade.",
        variant: "destructive",
      });
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Definir Dimensões do Produto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="dimWidth">Largura</Label>
              <Input
                id="dimWidth"
                type="number"
                min="0" // Adicionado min="0"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                placeholder="Ex: 10"
              />
            </div>
            <div>
              <Label htmlFor="dimHeight">Altura</Label>
              <Input
                id="dimHeight"
                type="number"
                min="0" // Adicionado min="0"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="Ex: 20"
              />
            </div>
            <div>
              <Label htmlFor="dimDepth">Profundidade</Label>
              <Input
                id="dimDepth"
                type="number"
                min="0" // Adicionado min="0"
                value={depth}
                onChange={(e) => setDepth(e.target.value)}
                placeholder="Ex: 5"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="dimUnit">Unidade</Label>
            <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger id="dimUnit">
                    <SelectValue placeholder="Selecione unidade" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="cm">cm (Centímetros)</SelectItem>
                    <SelectItem value="mm">mm (Milímetros)</SelectItem>
                    <SelectItem value="m">m (Metros)</SelectItem>
                    <SelectItem value="in">in (Polegadas)</SelectItem>
                </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </DialogClose>
          <Button onClick={handleSave}>Salvar Dimensões</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DimensionsModal;