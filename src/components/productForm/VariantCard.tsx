import React, { useState } from 'react';
import { Variant } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { XCircle, ImagePlus, Trash2, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { v4 as uuidv4 } from 'uuid';

interface VariantCardProps {
  variant: Variant;
  onChange: (updatedVariant: Variant) => void;
  onRemove: (variantId: string) => void;
  onAssignImageToVariant: (variantId: string, imageId: string, imageUrl: string) => void; // For images dragged from ImageUploader
}

export const VariantCard: React.FC<VariantCardProps> = ({ variant, onChange, onRemove, onAssignImageToVariant }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    onChange({ 
      ...variant, 
      [name]: value
    });
  };

  // Função para lidar com upload de imagens por clique
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Processar cada arquivo selecionado
    files.forEach(async (file) => {
      try {
        // Criar FormData para enviar o arquivo
        const formData = new FormData();
        formData.append('files', file);

        // Enviar o arquivo para o servidor
        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Erro ao fazer upload: ${response.status}`);
        }

        const data = await response.json();
        if (data && data.length > 0) {
          const fileInfo = data[0];
          // Formatar a URL absoluta
          const fileUrl = `${window.location.origin}${fileInfo.url}`;
          
          // Adicionar a imagem à variante atual
          const imageId = uuidv4();
          onAssignImageToVariant(variant.id, imageId, fileUrl);
          
          toast({
            title: "Imagem adicionada",
            description: `Imagem "${file.name}" adicionada à variante ${variant.color}.`,
          });
        }
      } catch (error) {
        console.error('Erro ao fazer upload de imagem:', error);
        toast({
          variant: "destructive",
          title: "Erro no upload",
          description: `Não foi possível enviar a imagem "${file.name}".`,
        });
      }
    });

    // Limpar o input file para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  const handleSetCoverImage = (imageUrl: string) => {
    const newImages = [imageUrl, ...variant.images.filter(img => img !== imageUrl)];
    onChange({ ...variant, images: newImages });
  };

  const handleRemoveImageFromVariant = (imageUrl: string) => {
    const newImages = variant.images.filter(img => img !== imageUrl);
    onChange({ ...variant, images: newImages });
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    try {
      const imageDataString = e.dataTransfer.getData('application/json');
      if (!imageDataString) {
        toast({ variant: "destructive", title: "Drop Error", description: "No image data received." });
        return;
      }
      const imageData = JSON.parse(imageDataString);
      const { imageId, imageUrl, originalName } = imageData;

      if (imageUrl) {
        if (variant.images.includes(imageUrl)) {
          toast({ variant: "default", title: "Image Exists", description: `Image "${originalName}" is already assigned to this variant.` });
          return;
        }
        onAssignImageToVariant(variant.id, imageId, imageUrl);
        toast({ title: "Image Assigned", description: `Image "${originalName}" dropped onto ${variant.color}.` });

      } else {
        toast({ variant: "destructive", title: "Drop Error", description: "Invalid image data dropped."});
      }
    } catch (error) {
      console.error("Failed to parse dropped data:", error);
      toast({ variant: "destructive", title: "Drop Error", description: "Could not process dropped image."});
    }
  };

  return (
    <TooltipProvider>
      <Card 
        className={`w-full transition-all ${isDragOver ? 'ring-2 ring-primary ring-offset-2' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center space-x-2">
            <div 
              className="w-6 h-6 rounded-full border" 
              style={{ backgroundColor: variant.hex || '#ccc' }}
              title={variant.hex} 
            />
            <CardTitle className="text-lg font-medium">{variant.color}</CardTitle>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="sm" onClick={() => onRemove(variant.id)} aria-label="Remover Variante">
                <XCircle className="h-5 w-5 text-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Remover Variante</p>
            </TooltipContent>
          </Tooltip>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-4 mt-4">

          </div>
          
          <div className="mt-4 space-y-2">
            <Label>Images ({variant.images.length})</Label>
            <div 
              className={`mt-1 p-2 border border-dashed rounded-md min-h-[100px] flex flex-col items-center justify-center transition-colors
                          ${isDragOver ? 'bg-primary-foreground border-primary' : 'border-muted-foreground/30 hover:border-muted-foreground/70'} 
                          cursor-pointer transition-colors`}
            >
              {variant.images.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <label htmlFor={`file-upload-${variant.id}`} className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded p-4 text-muted-foreground text-center cursor-pointer hover:border-primary hover:text-primary transition-colors">
                        <input
                          id={`file-upload-${variant.id}`}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={handleImageUpload}
                        />
                        <ImagePlus className="h-8 w-8 mb-2" />
                        <span>Arraste imagens ou clique para enviar</span>
                      </label>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Arraste imagens para esta variante</p>
                    </TooltipContent>
                  </Tooltip>
                  Arraste imagens para esta variante.
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 w-full">
                  {variant.images.map((imgUrl, idx) => (
                    <div key={imgUrl || idx} className="relative group aspect-square border rounded overflow-hidden">
                      <img 
                        src={imgUrl} 
                        alt={`Variant ${variant.color} image ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center space-y-1 p-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="icon" 
                              className="h-7 w-7 bg-white/80 hover:bg-white"
                              aria-label="Definir como imagem de capa"
                              onClick={() => handleSetCoverImage(imgUrl)}
                              disabled={idx === 0}
                            >
                              <Star className={`h-4 w-4 ${idx === 0 ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`} />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Definir como imagem de capa</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              variant="destructive" 
                              size="icon" 
                              className="h-7 w-7"
                              aria-label="Remover imagem da variante"
                              onClick={() => handleRemoveImageFromVariant(imgUrl)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Remover imagem da variante</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      {idx === 0 && (
                         <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-sm flex items-center">
                           <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-500" /> Cover
                         </div>
                      )}
                    </div>
                  ))}
                  {variant.images.length < 6 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <label htmlFor={`file-add-${variant.id}`}
                              className={`aspect-square flex items-center justify-center border-2 border-dashed rounded 
                                          ${isDragOver ? 'border-primary bg-primary-foreground' : 'border-muted-foreground/30 hover:border-primary'} 
                                          cursor-pointer transition-colors`}
                          >
                              <input
                                id={`file-add-${variant.id}`}
                                type="file"
                                accept="image/*"
                                multiple
                                className="hidden"
                                onChange={handleImageUpload}
                              />
                              <ImagePlus className={`h-6 w-6 ${isDragOver ? 'text-primary' : 'text-muted-foreground/70'}`} />
                          </label>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Arraste uma imagem ou clique para adicionar</p>
                        </TooltipContent>
                      </Tooltip>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};