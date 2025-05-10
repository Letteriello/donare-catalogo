import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { X } from 'lucide-react';
// Removed useProductDraftStore imports as direct manipulation is not done here anymore for adding images to variants

// Type for the server response for a single file upload
// Ensured originalName is part of this, as ProductForm expects it
interface UploadedFileResponse {
  fileId: string;
  url: string;
  originalName: string; 
}

// Represents an image that has been uploaded (or is being uploaded)
// This will be used for props.unassignedImages and for the internal currentBatchFiles state.
export interface UnassignedImage { // Exporting to allow ProductForm to use the same type if it imports it.
  id: string; 
  url: string; 
  originalName: string; 
  file?: File; 
  progress?: number;
  error?: string;
  dominantColor?: string; // This might be set by ColorThief
  suggestedVariantId?: string; // ID of the variant suggested by ColorThief match
  suggestedVariantColor?: string; // Name of the color of the suggested variant
}

interface ImageUploaderProps {
  onUploadComplete: (uploadedFiles: UploadedFileResponse[]) => void;
  unassignedImages: UnassignedImage[]; // Received from ProductForm
  onRemoveUnassignedImage: (imageId: string) => void; // To notify ProductForm
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  onUploadComplete, 
  unassignedImages: propUnassignedImages, // Renaming for clarity
  onRemoveUnassignedImage 
}) => {
  // State for files currently being processed (dropped, uploading)
  const [currentBatchFiles, setCurrentBatchFiles] = useState<UnassignedImage[]>([]);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false); // Tracks if any file in the current batch is uploading
  const [totalBatchProgress, setTotalBatchProgress] = useState(0);
  const { toast } = useToast();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploadingGlobal(true);
    setTotalBatchProgress(0);

    const initialImageStates: UnassignedImage[] = acceptedFiles.map(file => ({
      id: `temp-${file.name}-${Date.now()}`,
      url: URL.createObjectURL(file), 
      originalName: file.name,
      file,
      progress: 0,
    }));

    setCurrentBatchFiles(initialImageStates); // Set current batch for UI updates

    const uploadPromises = initialImageStates.map(async (imageState) => {
      const formData = new FormData();
      formData.append('files', imageState.file!); 

      try {
        // Simulate progress
        for (let p = 0; p <= 70; p += 10) {
            await new Promise(resolve => setTimeout(resolve, 50));
            setCurrentBatchFiles(prev =>
                prev.map(img =>
                    img.id === imageState.id ? { ...img, progress: p } : img
                )
            );
        }

        const response = await fetch('/api/uploads', {
          method: 'POST',
          body: formData,
        });

        setCurrentBatchFiles(prev =>
            prev.map(img =>
                img.id === imageState.id ? { ...img, progress: 100 } : img
            )
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Upload failed with status: ' + response.status }));
          throw new Error(errorData.message || 'Unknown upload error');
        }

        // Assuming /api/uploads for a single file in 'files' field returns UploadedFileResponse[] with one item.
        // If API can truly accept multiple 'files' fields or a list and returns multiple, this would need adjustment.
        // For now, assuming one file per request cycle, matching `results[0]` logic.
        const results: UploadedFileResponse[] = await response.json(); 
        const result = results[0]; 
        
        if (!result || !result.fileId || !result.url) {
            throw new Error('Invalid response structure from upload API.');
        }

        return {
          // This is the successful file data to be passed to onUploadComplete
          fileId: result.fileId, 
          url: result.url,   
          originalName: imageState.originalName, // Keep original name
          // Include other data for internal state update if needed, or for onUploadComplete
          tempId: imageState.id, // To map back and update the currentBatchFiles state
          error: undefined,
        };

      } catch (error: any) {
        console.error(`Error uploading ${imageState.originalName}:`, error);
        // Update this specific file in currentBatchFiles with an error
        setCurrentBatchFiles(prev =>
            prev.map(img =>
                img.id === imageState.id ? { ...img, error: error.message || 'Upload failed', progress: 100 } : img
            )
        );
        return { // This structure helps in Promise.all to know it failed
          tempId: imageState.id,
          originalName: imageState.originalName,
          error: error.message || 'Upload failed',
        };
      }
    });

    const processedResults = await Promise.all(uploadPromises);

    const successfulUploads: UploadedFileResponse[] = [];
    processedResults.forEach(res => {
      if (res && !res.error && res.fileId) { // Check for fileId to ensure it's a success structure
        successfulUploads.push({
            fileId: res.fileId,
            url: res.url!, // Assert url exists due to check
            originalName: res.originalName,
        });
      }
    });
    
    if (successfulUploads.length > 0) {
      onUploadComplete(successfulUploads); // Notify ProductForm
    }

    // Update UI for any errors that occurred during the batch
    setCurrentBatchFiles(prevBatchFiles => {
        return prevBatchFiles.map(batchFile => {
            const result = processedResults.find(r => r.tempId === batchFile.id);
            if (result && result.error) {
                return { ...batchFile, error: result.error, progress: 100 };
            }
            // If successful, it would have been reported. We can choose to clear them or keep them with 100% progress until next batch.
            // For now, let's assume ProductForm's update will refresh the displayed list, so currentBatchFiles can be cleared or filtered.
            return batchFile; // Or filter out successful ones if ProductForm doesn't show them immediately.
        }).filter(bf => bf.error); // Only keep errored files in current batch display, successful ones are handled by ProductForm
    });


    const numAttempted = acceptedFiles.length;
    setTotalBatchProgress(numAttempted > 0 ? Math.round((successfulUploads.length / numAttempted) * 100) : 0);
    setIsUploadingGlobal(false);

    if (successfulUploads.length < numAttempted && numAttempted > 0) {
        toast({
            variant: "warning",
            title: "Some uploads failed",
            description: `${numAttempted - successfulUploads.length} out of ${numAttempted} images could not be uploaded.`,
        });
    } else if (successfulUploads.length > 0) {
        toast({
            title: "Uploads Complete",
            description: `${successfulUploads.length} image(s) submitted for processing.`,
        });
    }
    // Clear current batch files after processing and reporting.
    // ProductForm will provide the new list of unassignedImages.
    if(successfulUploads.length === numAttempted) { // if all successful
        setCurrentBatchFiles([]);
    }


  }, [toast, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/gif': [],
    },
    multiple: true,
  });

  // This now calls the prop function
  const handleRemovePropUnassignedImage = (imageId: string) => {
    onRemoveUnassignedImage(imageId); 
  };

  const handleDragStartImage = (e: React.DragEvent<HTMLDivElement>, image: UnassignedImage) => {
    if (image.error) { 
        e.preventDefault();
        return;
    }
    // Ensure all necessary data is included for ProductForm's assignment logic
    e.dataTransfer.setData('application/json', JSON.stringify({ 
        imageId: image.id, // This is the server-confirmed fileId
        imageUrl: image.url, 
        originalName: image.originalName 
    }));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Display for files currently being uploaded from the latest batch
  const renderCurrentBatchFiles = () => (
    currentBatchFiles.map((image) => (
      <div 
        key={image.id} 
        className={`relative group border rounded-md p-1 aspect-square flex flex-col items-center justify-center ${image.error ? 'border-red-500' : 'border-muted'}`}
        // Draggable is false for these as they are in-process or temporary
      >
        <img 
          src={image.url} 
          alt={image.originalName} 
          className={`max-w-full max-h-full object-contain rounded ${image.error ? 'opacity-50' : ''}`}
        />
        {image.progress !== undefined && image.progress < 100 && !image.error && (
          <Progress value={image.progress} className="w-[calc(100%-0.5rem)] h-1 absolute bottom-1 left-1 right-1" />
        )}
        {image.error && <p className="text-xs text-red-600 p-1 text-center break-words">{image.error}</p>}
        {/* No remove button for batch files; they either succeed and go to ProductForm or show error and get cleared */}
      </div>
    ))
  );

  // Display for unassigned images received from ProductForm (already uploaded)
  const renderPropUnassignedImages = () => (
    propUnassignedImages.map((image) => (
      <div 
        key={image.id} 
        className={`relative group border rounded-md p-1 aspect-square flex flex-col items-center justify-center ${image.error ? 'border-red-500' : 'border-muted'} ${!image.error ? 'cursor-grab' : 'cursor-not-allowed'}`}
        draggable={!image.error}
        onDragStart={(e) => handleDragStartImage(e, image)}
      >
        <img 
          src={image.url} 
          alt={image.originalName} 
          className={`max-w-full max-h-full object-contain rounded ${image.error ? 'opacity-50' : ''}`}
        />
        {/* Progress bar not typically shown for propUnassignedImages as they are post-upload */}
        {image.error && <p className="text-xs text-red-600 p-1 text-center break-words">{image.error}</p>}
        {!image.error && (
            <Button 
            variant="destructive" 
            size="icon" 
            className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => handleRemovePropUnassignedImage(image.id)}
            title="Remove image from unassigned list"
            >
            <X className="h-4 w-4" />
            </Button>
        )}
      </div>
    ))
  );


  return (
    <div className="space-y-6">
      <div 
        {...getRootProps()} 
        className={`p-8 border-2 border-dashed rounded-lg text-center cursor-pointer
                    ${isDragActive ? 'border-primary bg-primary-foreground' : 'border-muted-foreground/50 hover:border-primary'}`}
      >
        <input {...getInputProps()} />
        {isUploadingGlobal ? (
            <p className="text-primary">Uploading batch...</p>
        ) : isDragActive ? (
          <p className="text-primary">Drop the images here ...</p>
        ) : (
          <p className="text-muted-foreground">Drag & drop some images here, or click to select images</p>
        )}
        <p className="text-xs text-muted-foreground mt-1">Supports: JPG, PNG, WEBP, GIF</p>
      </div>

      {isUploadingGlobal && totalBatchProgress < 100 && (
        <div className="space-y-2">
          <Label>Current Batch Upload Progress: {totalBatchProgress}%</Label>
          <Progress value={totalBatchProgress} className="w-full" />
        </div>
      )}

      {/* Section for files currently being processed in this component */}
      {currentBatchFiles.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Processing Uploads...</h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {renderCurrentBatchFiles()}
          </div>
        </div>
      )}
      
      {/* Section for unassigned images managed by ProductForm */}
      {(propUnassignedImages.length > 0 || currentBatchFiles.some(f => f.error)) && ( // Show this section if there are prop images OR if there were errors in the last batch
        <div className="mt-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">
              Unassigned Images ({propUnassignedImages.filter(img => !img.error).length})
            </h3>
            {/* Auto-assign button can remain, but its logic will involve propUnassignedImages and calling ProductForm or Zustand actions */}
            <Button variant="outline" size="sm" onClick={() => console.log("Auto-assign clicked - TBD")} disabled={isUploadingGlobal || propUnassignedImages.filter(img => !img.error).length === 0}>
              Auto-assign by Name
            </Button>
          </div>
          {propUnassignedImages.length === 0 && currentBatchFiles.every(f => !f.error) && (
             <p className="text-muted-foreground">No images uploaded yet, or all assigned.</p>
          )}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
            {renderPropUnassignedImages()}
          </div>
        </div>
      )}
    </div>
  );
};
