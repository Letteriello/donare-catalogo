import React, { useState } from 'react';
import { Variant } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { XCircle, ImagePlus, Trash2, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

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
    let processedValue: string | number = value;

    if (name === 'retail' || name === 'wholesale') {
      processedValue = parseFloat(value);
      if (isNaN(processedValue)) {
        processedValue = 0;
      }
    }
    
    onChange({ 
      ...variant, 
      [name]: processedValue
    });
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
        // Call the new prop to notify ProductForm that an unassigned image is now assigned
        onAssignImageToVariant(variant.id, imageId, imageUrl);
        // The actual addition to variant.images will be handled by ProductForm through onChange
        // after it removes the image from unassignedImages.
        // For now, directly update here to show immediate effect,
        // but ProductForm should be the source of truth for this change.
        // onChange({ ...variant, images: [...variant.images, imageUrl] });
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
        <Button variant="ghost" size="sm" onClick={() => onRemove(variant.id)} title="Remove Variant">
          <XCircle className="h-5 w-5 text-destructive" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor={`retail-${variant.id}`}>Retail Price</Label>
          <Input
            id={`retail-${variant.id}`}
            name="retail"
            type="number"
            placeholder="e.g., 29.90"
            value={variant.retail ?? ''}
            onChange={handleInputChange}
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <Label htmlFor={`wholesale-${variant.id}`}>Wholesale Price</Label>
          <Input
            id={`wholesale-${variant.id}`}
            name="wholesale"
            type="number"
            placeholder="e.g., 19.90"
            value={variant.wholesale ?? ''}
            onChange={handleInputChange}
            min="0"
            step="0.01"
          />
        </div>
        
        <div className="mt-4 space-y-2">
          <Label>Images ({variant.images.length})</Label>
          <div 
            className={`mt-1 p-2 border border-dashed rounded-md min-h-[100px] flex flex-col items-center justify-center transition-colors
                        ${isDragOver ? 'bg-primary-foreground border-primary' : 'border-muted-foreground/30 hover:border-muted-foreground/70'}`}
          >
            {variant.images.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground py-4">
                <ImagePlus className="mx-auto h-8 w-8 mb-1" />
                Drag an image here or it will be auto-assigned.
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
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-7 w-7 bg-white/80 hover:bg-white"
                        title="Set as Cover"
                        onClick={() => handleSetCoverImage(imgUrl)}
                        disabled={idx === 0} // Already cover if first
                      >
                        <Star className={`h-4 w-4 ${idx === 0 ? 'fill-yellow-400 text-yellow-500' : 'text-muted-foreground'}`} />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        className="h-7 w-7"
                        title="Remove Image"
                        onClick={() => handleRemoveImageFromVariant(imgUrl)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {idx === 0 && (
                       <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-sm flex items-center">
                         <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-500" /> Cover
                       </div>
                    )}
                  </div>
                ))}
                 {/* Add more images placeholder if fewer than max, e.g. 3 */}
                {variant.images.length < 6 && ( // Example: allow up to 6 images
                    <div 
                        className={`aspect-square flex items-center justify-center border-2 border-dashed rounded 
                                    ${isDragOver ? 'border-primary bg-primary-foreground' : 'border-muted-foreground/30 hover:border-muted-foreground/60'} 
                                    cursor-pointer transition-colors`}
                        onClick={() => { /* Potentially open a file dialog or highlight the main uploader */ }}
                        title="Drag another image here"
                    >
                        <ImagePlus className={`h-6 w-6 ${isDragOver ? 'text-primary' : 'text-muted-foreground/70'}`} />
                    </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};