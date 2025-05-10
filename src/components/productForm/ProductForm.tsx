import React, { useState, useEffect } from 'react';
import ColorThief from 'colorthief';
import { useProductDraftStore } from '@/stores/useProductDraftStore';
import { useToast } from '@/components/ui/use-toast';
import { ProductDraft, Variant } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CategoryModal } from './CategoryModal';
import { ColorModal, Color } from './ColorModal';
import { VariantCard } from './VariantCard';
import { ImageUploader, UnassignedImage } from './ImageUploader';
import { ProgressSidebar } from './ProgressSidebar';
import { DimensionsModal } from './DimensionsModal'; // Added

interface UploadedFileResponse {
  fileId: string;
  url: string;
  originalName: string;
}

interface AiCompleteFieldsPayload {
  baseName: string;
  material: string;
  dimensions: string;
  description: string;
  colors: string[];
}

interface AiVariantSuggestion {
  color: string; // Used to map back to the variant
  sku: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
}

// --- ColorThief Helper Functions ---
const componentToHex = (c: number): string => {
  const hex = c.toString(16);
  return hex.length === 1 ? "0" + hex : hex;
};

const rgbToHex = (r: number, g: number, b: number): string => {
  return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
};

const hexToRgb = (hex: string): [number, number, number] | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : null;
};

// Calculates Euclidean distance between two RGB colors
const getColorDistance = (rgb1: [number, number, number], rgb2: [number, number, number]): number => {
  const dr = rgb1[0] - rgb2[0];
  const dg = rgb1[1] - rgb2[1];
  const db = rgb1[2] - rgb2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const COLOR_DISTANCE_THRESHOLD = 75; // Adjust as needed for sensitivity

export const ProductForm: React.FC = () => {
  const draft = useProductDraftStore((state) => state.draft);
  const setBaseName = useProductDraftStore((state) => state.setBaseName);
  const setCategoryId = useProductDraftStore((state) => state.setCategoryId);
  const setVariants = useProductDraftStore((state) => state.setVariants);
  const setStatus = useProductDraftStore((state) => state.setStatus);
  const updateVariant = useProductDraftStore((state) => state.updateVariant);
  const removeVariant = useProductDraftStore((state) => state.removeVariant);
  const setSeoTitle = useProductDraftStore((state) => state.setSeoTitle);
  const setSeoDescription = useProductDraftStore((state) => state.setSeoDescription);
  const setKeywords = useProductDraftStore((state) => state.setKeywords);
  const addImageToVariantStore = useProductDraftStore((state) => state.addImageToVariant);
  const setMaterial = useProductDraftStore((state) => state.setMaterial);
  const setDimensions = useProductDraftStore((state) => state.setDimensions);
  const setDescription = useProductDraftStore((state) => state.setDescription);

  const { toast } = useToast();
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isDimensionsModalOpen, setIsDimensionsModalOpen] = useState(false); // Added
  const [selectedCategoryName, setSelectedCategoryName] = useState<string | null>(null);
  const [unassignedImages, setUnassignedImages] = useState<UnassignedImage[]>([]);

  const handleDimensionsSave = (dimensionsString: string) => { // Added
    setDimensions(dimensionsString);
    setIsDimensionsModalOpen(false);
  };

  const handleBaseNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseName(e.target.value);
  };
  const handleMaterialChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMaterial(e.target.value);
  };
  const handleDimensionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDimensions(e.target.value);
  };
  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleCategorySelect = (category: { id: string; name: string }) => {
    setCategoryId(category.id);
    setSelectedCategoryName(category.name);
    setIsCategoryModalOpen(false);
  };

  const handleColorsChosen = (chosenColors: Color[]) => {
    setIsColorModalOpen(false);
    const currentVariants = draft.variants;
    const newVariantsToAdd: Variant[] = [];
    chosenColors.forEach(color => {
      if (!currentVariants.find(v => v.color === color.name)) {
        newVariantsToAdd.push({
          id: `variant-${color.id || color.name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
          color: color.name,
          hex: color.hex,
          images: [],
          retail: 0,
          wholesale: 0,
        });
      }
    });
    if (newVariantsToAdd.length > 0) {
      setVariants([...currentVariants, ...newVariantsToAdd]);
    }
  };

  const processImageWithColorThief = async (imageFile: UnassignedImage, productVariants: Variant[]): Promise<UnassignedImage> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Important for ColorThief if images are from a different origin
      img.onload = () => {
        try {
          const colorThief = new ColorThief();
          const dominantRgb = colorThief.getColor(img);
          const dominantHex = rgbToHex(dominantRgb[0], dominantRgb[1], dominantRgb[2]);
          
          let bestMatch: { variant?: Variant; distance: number } = { distance: Infinity };

          for (const variant of productVariants) {
            const variantRgb = hexToRgb(variant.hex);
            if (variantRgb) {
              const distance = getColorDistance(dominantRgb, variantRgb);
              if (distance < bestMatch.distance) {
                bestMatch = { variant, distance };
              }
            }
          }

          if (bestMatch.variant && bestMatch.distance < COLOR_DISTANCE_THRESHOLD) {
            toast({
              title: "Sugestão de Combinação de Cor",
              description: `Imagem "${imageFile.originalName}" cor dominante (${dominantHex}) parece combinar com a variante "${bestMatch.variant.color}".`,
            });
            resolve({
              ...imageFile,
              dominantColor: dominantHex,
              suggestedVariantId: bestMatch.variant.id,
              suggestedVariantColor: bestMatch.variant.color
            });
          } else {
            resolve({ ...imageFile, dominantColor: dominantHex }); // No suggestion, but store dominant color
          }
        } catch (error) {
          console.error("ColorThief error for", imageFile.originalName, error);
          resolve(imageFile); // Resolve with original if error
        }
      };
      img.onerror = () => {
        console.error("Could not load image for ColorThief:", imageFile.originalName);
        resolve(imageFile); // Resolve with original if image load error
      };
      img.src = imageFile.url; // Ensure this URL is accessible
    });
  };


  const handleImageUploadComplete = async (uploadedFiles: UploadedFileResponse[]) => {
    const productVariants = draft.variants;
    let imagesToManuallyAssign: UnassignedImage[] = [];
    let autoAssignedByNameCount = 0;

    // 1. Attempt filename-based assignment
    uploadedFiles.forEach(file => {
      let assigned = false;
      for (const variant of productVariants) {
        if (file.originalName.toLowerCase().includes(variant.color.toLowerCase())) {
          if (!variant.images.includes(file.url)) {
            addImageToVariantStore(variant.id, file.url);
            toast({
              title: "Imagem Auto-Atribuída",
              description: `"${file.originalName}" atribuída automaticamente à variante "${variant.color}".`,
            });
            autoAssignedByNameCount++;
          } else {
            toast({
              title: "Imagem Existente",
              description: `"${file.originalName}" já existe na variante "${variant.color}". Adicionando a não atribuídas.`,
            });
            imagesToManuallyAssign.push({ id: file.fileId, url: file.url, originalName: file.originalName });
          }
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        imagesToManuallyAssign.push({ id: file.fileId, url: file.url, originalName: file.originalName });
      }
    });

    let finalUnassignedImages: UnassignedImage[] = [];
    let suggestedCount = 0;

    // 2. Process remaining images with ColorThief
    if (imagesToManuallyAssign.length > 0) {
      toast({ title: "Analisando Imagens", description: `Tentando encontrar correspondências de cores para ${imagesToManuallyAssign.length} imagem(ns)...`});
      const colorThiefPromises = imagesToManuallyAssign.map(img => processImageWithColorThief(img, productVariants));
      const processedImages = await Promise.all(colorThiefPromises);
      
      processedImages.forEach(img => {
        if(img.suggestedVariantId) {
          suggestedCount++;
        }
      });
      finalUnassignedImages = processedImages;
    }
    
    // 3. Update unassignedImages state
    if (finalUnassignedImages.length > 0) {
      setUnassignedImages(prev => {
        const existingIds = new Set(prev.map(img => img.id));
        const trulyNewUnassigned = finalUnassignedImages.filter(nImg => !existingIds.has(nImg.id));
        // If an image already exists in unassigned, update it with suggestion data
        const updatedPrev = prev.map(pImg => {
            const updatedVersion = finalUnassignedImages.find(fImg => fImg.id === pImg.id);
            return updatedVersion || pImg;
        });
        const combined = [...updatedPrev.filter(pImg => !finalUnassignedImages.find(fImg => fImg.id === pImg.id)), ...trulyNewUnassigned];

        return combined;
      });
    }

    // 4. Toast notifications based on processing results
    if (autoAssignedByNameCount > 0 && suggestedCount === 0 && finalUnassignedImages.length === 0) { // Only filename
      // Already toasted per image
    } else if (suggestedCount > 0) {
      toast({
        title: "Processamento de Imagem Concluído",
        description: `${autoAssignedByNameCount} imagem(ns) auto-atribuídas por nome. ${suggestedCount} sugestão(ões) de correspondência de cor feita(s). ${finalUnassignedImages.filter(img => !img.suggestedVariantId).length} imagem(ns) permanecem não atribuídas.`,
      });
    } else if (finalUnassignedImages.length > 0 && autoAssignedByNameCount === 0 && suggestedCount === 0) { // Only unassigned, no suggestions
       toast({
            title: "Uploads Requerem Atribuição",
            description: `${finalUnassignedImages.length} imagem(ns) adicionadas a não atribuídas. Por favor, atribua-as manualmente.`,
        });
    }
  };

  // Called by ImageUploader when a user removes an image from the unassigned list
  const handleRemoveUnassignedImage = (imageIdToRemove: string) => {
    setUnassignedImages(prev => prev.filter(img => img.id !== imageIdToRemove));
    // Optionally, call API to delete the file from server if needed: DELETE /api/uploads/:imageId
  };

  // Called by VariantCard when an image is dropped onto it
  const handleAssignImageToVariant = (variantId: string, imageId: string, imageUrl: string, originalName?: string) => {
    const variantToUpdate = draft.variants.find(v => v.id === variantId);
    if (variantToUpdate) {
      if (variantToUpdate.images.includes(imageUrl)) {
        toast({ variant: "default", title: "Imagem Existente", description: `A imagem "${originalName || 'Selecionada'}" já está atribuída à variante ${variantToUpdate.color}.` });
        return;
      }
      // Use the store action to update the variant
      addImageToVariantStore(variantId, imageUrl); 

      // Remove the image from the unassigned list
      setUnassignedImages(prev => prev.filter(img => img.id !== imageId && img.url !== imageUrl));
      
      toast({ title: "Imagem Atribuída", description: `A imagem "${originalName || 'Selecionada'}" foi atribuída à variante ${variantToUpdate.color}.` });
    } else {
        toast({ variant: "destructive", title: "Erro de Atribuição", description: "Não foi possível encontrar a variante para atribuir a imagem." });
    }
  };
  
  const handleSaveDraft = () => {
    setStatus('draft');
    console.log('Saving draft:', draft);
    toast({
      title: "Rascunho Salvo (Simulado)",
      description: "O rascunho do produto foi salvo localmente.",
    });
  };

  const handlePublish = () => {
    const errors: string[] = [];
    if (!draft.baseName.trim()) errors.push("Nome Base é obrigatório.");
    if (!draft.categoryId) errors.push("Categoria é obrigatória.");
    if (draft.variants.length === 0) errors.push("Pelo menos uma variante é obrigatória.");
    else {
      draft.variants.forEach((v) => {
        if (v.images.length === 0) errors.push(`Variante "${v.color}" precisa de pelo menos uma imagem.`);
      });
    }
    if (!draft.seoTitle?.trim()) errors.push("Título SEO é obrigatório para publicação.");
    if (!draft.seoDescription?.trim()) errors.push("Descrição SEO é obrigatória para publicação.");

    if (errors.length > 0) {
      toast({
        variant: "destructive",
        title: "Erro de Validação",
        description: (
          <ul className="list-disc pl-5">
            {errors.map((err, i) => <li key={i}>{err}</li>)}
          </ul>
        ),
      });
      return;
    }

    setStatus('published');
    console.log('Publishing product:', draft);
    toast({
      title: "Produto Publicado (Simulado)",
      description: "O produto foi publicado.",
    });
  };

  const handleVariantChange = (updatedVariant: Variant) => {
    updateVariant(updatedVariant.id, updatedVariant);
  };

  const handleVariantRemove = (variantId: string) => {
    removeVariant(variantId);
  };

  const handleSeoTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSeoTitle(e.target.value);
  };

  const handleSeoDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSeoDescription(e.target.value);
  };

  const handleKeywordsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setKeywords(e.target.value.split(',').map(kw => kw.trim()).filter(kw => kw !== ''));
  };

  const fetchAiSuggestions = async () => {
    if (!draft.baseName || !draft.material || !draft.dimensions || !draft.description || draft.variants.length === 0) {
      // console.log("AI Completion: Not enough data to fetch suggestions.");
      return;
    }

    const payload: AiCompleteFieldsPayload = {
      baseName: draft.baseName,
      material: draft.material,
      dimensions: draft.dimensions,
      description: draft.description,
      colors: draft.variants.map(v => v.color),
    };

    console.log("Calling /api/ai/completeFields with payload:", payload);
    toast({
      title: "Preenchimento com IA",
      description: "Buscando sugestões de conteúdo da IA...",
    });

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // MOCK API RESPONSE
      const aiResponse: AiVariantSuggestion[] = draft.variants.map(variant => ({
        color: variant.color, // Ensure the color is present for mapping
        sku: `${draft.baseName.substring(0, 3).toUpperCase()}-${variant.color.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
        seoTitle: `${draft.baseName} ${variant.color} - Ideal para ${draft.material}`,
        seoDescription: `Descubra o ${draft.baseName} na cor ${variant.color}, feito com ${draft.material} de alta qualidade. Dimensões: ${draft.dimensions}. Perfeito para adicionar um toque de elegância.`,
        keywords: [draft.baseName, variant.color, draft.material, "design exclusivo", "qualidade premium"],
      }));
      
      console.log("AI Response:", aiResponse);

      aiResponse.forEach(suggestion => {
        const targetVariant = draft.variants.find(v => v.color === suggestion.color);
        if (targetVariant) {
          // Only update if the AI suggestion is different or not yet set
          const updates: Partial<Variant> = {};
          if (targetVariant.sku !== suggestion.sku) updates.sku = suggestion.sku;
          // For product-level SEO, we handle it differently. Here, we update variant-specific SEO if needed.
          // For this example, let's assume the AI gives variant specific SEO titles/descriptions.
          // If not, this logic should be adjusted or these fields removed from AiVariantSuggestion.
          if (targetVariant.seoTitle !== suggestion.seoTitle) updates.seoTitle = suggestion.seoTitle;
          if (targetVariant.seoDescription !== suggestion.seoDescription) updates.seoDescription = suggestion.seoDescription;
          if (JSON.stringify(targetVariant.keywords) !== JSON.stringify(suggestion.keywords)) updates.keywords = suggestion.keywords;
          
          if (Object.keys(updates).length > 0) {
             updateVariant(targetVariant.id, updates);
          }
        }
      });

      toast({
        title: "Preenchimento com IA Concluído",
        description: "Os campos do produto foram preenchidos automaticamente com sugestões da IA. Revise e ajuste conforme necessário.",
      });

    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
      toast({
        variant: "destructive",
        title: "Falha no Preenchimento com IA",
        description: "Não foi possível buscar sugestões da IA. Por favor, tente novamente mais tarde.",
      });
    }
  };


  useEffect(() => {
    const { baseName, variants, seoTitle, seoDescription, keywords } = draft;
    if (baseName && variants.length > 0) {
      const firstVariantColor = variants[0].color;
      // This SEO defaulting is general. The AI will provide per-variant details if configured.
      // Consider if this general defaulting should still apply or be replaced by AI.
      // For now, it sets a general SEO if product-level SEO is empty.
      if (firstVariantColor) {
        if (!seoTitle) { // Product-level SEO title
          setSeoTitle(`${baseName} em Couro Vegano – Donare Home`);
        }
        if (!seoDescription) { // Product-level SEO description
          setSeoDescription(`Porta Copo em couro vegano cortado a laser, cor ${firstVariantColor}. Sofisticação e praticidade para sua mesa posta.`);
        }
        if (!keywords || keywords.length === 0) { // Product-level keywords
          setKeywords([baseName, "Donare Home", firstVariantColor, "couro vegano", "mesa posta"]);
        }
      }
    }
  }, [draft.baseName, draft.variants, draft.seoTitle, draft.seoDescription, draft.keywords, setSeoTitle, setSeoDescription, setKeywords]);

  // useEffect for AI autocompletion
  useEffect(() => {
    const { baseName, material, dimensions, description, variants } = draft;
    // Trigger AI completion if key fields are filled and variants exist
    if (baseName && material && dimensions && description && variants.length > 0) {
      // Check if any variant is missing AI-completed fields (e.g. SKU as a proxy)
      // This prevents re-fetching if data is already there from a previous run or manual edit.
      // For a more robust check, you might want to see if *all* AI-targetted fields are empty.
      const needsAiCompletion = variants.some(v => !v.sku);
      if (needsAiCompletion) {
        fetchAiSuggestions();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft.baseName, draft.material, draft.dimensions, draft.description, draft.variants, updateVariant]); // updateVariant is stable from Zustand

  return (
    <div className="container mx-auto p-4">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          {/* Basic Product Info */}
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Informações do Produto</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="baseName">Nome Base</Label>
                <Input 
                  id="baseName" 
                  value={draft.baseName} 
                  onChange={handleBaseNameChange}
                  placeholder="Ex: Porta Copo Redondo"
                />
              </div>
              <div>
                <Label htmlFor="category">Categoria</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="categoryDisplay"
                    value={selectedCategoryName || 'Nenhuma categoria selecionada'}
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => setIsCategoryModalOpen(true)}>
                    {draft.categoryId ? 'Alterar' : 'Selecionar'} Categoria
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="material">Material</Label>
                <Input
                  id="material"
                  value={draft.material}
                  onChange={handleMaterialChange}
                  placeholder="Ex: Couro Vegano Premium"
                />
              </div>
              <div>
                <Label htmlFor="dimensionsDisplay">Dimensões</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="dimensionsDisplay"
                    value={draft.dimensions || 'Nenhuma dimensão definida'}
                    readOnly
                    className="flex-1"
                  />
                  <Button variant="outline" onClick={() => setIsDimensionsModalOpen(true)}>
                    {draft.dimensions ? 'Editar' : 'Definir'} Dimensões
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição do Produto</Label>
                <Textarea
                  id="description"
                  value={draft.description}
                  onChange={handleDescriptionChange}
                  placeholder="Descrição detalhada do produto..."
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* Variants Section */}
          <div className="p-6 border rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Variantes</h2>
              <Button onClick={() => setIsColorModalOpen(true)}>Adicionar/Gerenciar Cores</Button>
            </div>
            {draft.variants.length === 0 && (
              <p className="text-muted-foreground">Nenhuma variante criada ainda. Adicione cores para gerar variantes.</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {
                draft.variants.map(variant => (
                  <VariantCard
                    key={variant.id}
                    variant={variant}
                    onChange={handleVariantChange}
                    onRemove={handleVariantRemove}
                    onAssignImageToVariant={handleAssignImageToVariant} // Pass the new handler
                  />
                ))
              }
            </div>
          </div>
          
          {/* Image Uploader */}
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Upload & Atribuir Imagens</h2>
            <ImageUploader
                onUploadComplete={handleImageUploadComplete}
                unassignedImages={unassignedImages}
                onRemoveUnassignedImage={handleRemoveUnassignedImage}
            />
          </div>
          
          {/* SEO Section */}
          <div className="p-6 border rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Informações de SEO</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="seoTitle">Título SEO</Label>
                <Input
                  id="seoTitle"
                  value={draft.seoTitle || ''}
                  onChange={handleSeoTitleChange}
                  placeholder="Título SEO do Produto"
                />
              </div>
              <div>
                <Label htmlFor="seoDescription">Descrição SEO</Label>
                <Textarea
                  id="seoDescription"
                  value={draft.seoDescription || ''}
                  onChange={handleSeoDescriptionChange}
                  placeholder="Descrição SEO do Produto"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="keywords">Palavras-chave</Label>
                <Input
                  id="keywords"
                  value={(draft.keywords || []).join(', ')}
                  onChange={handleKeywordsChange}
                  placeholder="Palavras-chave separadas por vírgula, ex: palavra1, palavra2"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Insira palavras-chave separadas por vírgulas.
                </p>
              </div>
            </div>
          </div>

        </div>
        
        {/* Right Sidebar / Actions */}
        <div className="md:col-span-1 space-y-6 sticky top-4 self-start max-h-[calc(100vh-1rem)] overflow-y-auto">
          <ProgressSidebar draft={draft} />
          <div className="p-6 border rounded-lg shadow-sm">
             <h2 className="text-xl font-semibold mb-4">Ações</h2>
            <div className="space-y-2">
              <Button onClick={handleSaveDraft} className="w-full" variant="outline">Salvar Rascunho</Button>
              <Button onClick={handlePublish} className="w-full">Publicar Produto</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onCategorySelect={handleCategorySelect}
      />
      <DimensionsModal
        isOpen={isDimensionsModalOpen}
        onClose={() => setIsDimensionsModalOpen(false)}
        onSave={handleDimensionsSave}
        currentDimensions={draft.dimensions}
      />
      <ColorModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        onColorsChosen={handleColorsChosen}
      />
    </div>
  );
};