import React from 'react';
import { ProductDraft } from '@/types/product';
import { CheckCircle2, XCircle, Circle } from 'lucide-react'; // Icons for status

interface ProgressSidebarProps {
  draft: ProductDraft;
}

interface ChecklistItem {
  label: string;
  completed: boolean;
}

export const ProgressSidebar: React.FC<ProgressSidebarProps> = ({ draft }) => {
  const checklistItems: ChecklistItem[] = [
    {
      label: 'Nome Base Adicionado',
      completed: !!draft.baseName && draft.baseName.trim() !== '',
    },
    {
      label: 'Categoria Selecionada',
      completed: !!draft.categoryId,
    },
    {
      label: 'Pelo Menos Uma Variante Criada',
      completed: draft.variants.length > 0,
    },
    {
      label: 'Todas as Variantes Possuem Imagens',
      completed: draft.variants.length > 0 && draft.variants.every(v => v.images.length > 0),
    },
    {
      label: 'Título SEO Adicionado',
      completed: !!draft.seoTitle && draft.seoTitle.trim() !== '',
    },
    {
      label: 'Descrição SEO Adicionada',
      completed: !!draft.seoDescription && draft.seoDescription.trim() !== '',
    },
    // Add more checks as needed, e.g., for required variant fields
  ];

  const allComplete = checklistItems.every(item => item.completed);

  return (
    <div className="p-6 border rounded-lg shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Lista de Progresso</h2>
      <ul className="space-y-3">
        {checklistItems.map((item, index) => (
          <li key={index} className="flex items-center">
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
              // Or use a neutral icon for pending items:
              // <Circle className="h-5 w-5 text-muted-foreground mr-2 flex-shrink-0" />
            )}
            <span className={item.completed ? 'text-foreground' : 'text-muted-foreground'}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
      {allComplete && (
        <p className="mt-4 text-sm text-green-600 font-semibold">
          Todas as informações essenciais parecem completas! Pronto para publicar.
        </p>
      )}
      {!allComplete && draft.status === 'published' && (
         <p className="mt-4 text-sm text-orange-600 font-semibold">
            Alguns itens estão faltando para um produto publicado completo.
       </p>
      )}
    </div>
  );
};