import { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { UploadFile } from "@/api/integrations";

export default function EditableImage({ 
  src, 
  alt, 
  isEditing, 
  onImageChange,
  className = '' 
}) {
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const response = await UploadFile({ file });
      // Extrai file_url da resposta do servidor
      onImageChange(response.file_url);
    } catch (error) {
      console.error("Erro ao fazer upload:", error);
      // Adiciona uma lógica para mostrar o erro ao usuário se necessário
    } finally {
      setIsUploading(false);
    }
  };

  if (isEditing) {
    return (
      <div className={`relative ${className}`}>
        {src && <img src={src} alt={alt} className="w-full h-full object-cover" />}
        <label className="absolute inset-0 flex items-center justify-center bg-black/50 cursor-pointer">
          {isUploading ? (
            <div className="text-white text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
              <span>Enviando...</span>
            </div>
          ) : (
            <div className="text-white text-center">
              <Upload className="w-6 h-6 mx-auto mb-2" />
              <span>Alterar imagem</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
}