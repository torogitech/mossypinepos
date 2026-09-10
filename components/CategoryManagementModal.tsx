import React, { useState } from 'react';
import { Button } from './ui/Button';
import { X, Plus, Trash2, Tag } from 'lucide-react';
import { DeleteCategoryConfirmationModal } from './DeleteCategoryConfirmationModal';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (category: string) => void;
  onDeleteCategory: (category: string) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory
}) => {
  const [newCategory, setNewCategory] = useState('');
  const [categoryToDelete, setCategoryToDelete] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCategory.trim()) {
      onAddCategory(newCategory.trim());
      setNewCategory('');
    }
  };

  const confirmDelete = () => {
      if (categoryToDelete) {
          onDeleteCategory(categoryToDelete);
          setCategoryToDelete(null);
      }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={onClose}>
        <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-[#F2F5F1] max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
          
          {/* Header */}
          <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
            <div>
              <h3 className="font-bold text-xl text-[#1A2F1A]">Manage Categories</h3>
              <p className="text-xs text-[#7A8C7A]">Add or remove product categories</p>
            </div>
            <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 overflow-y-auto flex-1">
              
              {/* Add New Category Form */}
              <form onSubmit={handleSubmit} className="mb-6">
                  <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">New Category Name</label>
                  <div className="flex gap-2">
                      <input 
                          type="text" 
                          value={newCategory || ''}
                          onChange={(e) => setNewCategory(e.target.value)}
                          placeholder="e.g., Seasonal"
                          className="flex-1 p-3 bg-[#F2F5F1] rounded-2xl text-[#1A2F1A] font-bold focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 uppercase"
                      />
                      <button 
                          type="submit"
                          disabled={!newCategory.trim()}
                          className="bg-[#4A6741] text-white p-3 rounded-2xl shadow-md hover:bg-[#3A5232] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                          <Plus size={24} />
                      </button>
                  </div>
              </form>

              {/* Categories List */}
              <div className="space-y-2">
                  <h4 className="text-xs font-bold text-[#7A8C7A] uppercase tracking-wider mb-2">Active Categories ({categories.length})</h4>
                  {categories.map((cat, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-white border border-[#E8EFE6] rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3">
                              <div className="bg-[#E8F5E9] text-[#4A6741] p-2 rounded-xl">
                                  <Tag size={16} />
                              </div>
                              <span className="font-bold text-[#1A2F1A]">{cat}</span>
                          </div>
                          <button 
                              onClick={() => setCategoryToDelete(cat)}
                              className="p-2 text-[#7A8C7A] hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors"
                              title="Delete Category"
                          >
                              <Trash2 size={18} />
                          </button>
                      </div>
                  ))}
                  {categories.length === 0 && (
                      <p className="text-center text-[#B0C4B0] text-sm py-4">No categories defined.</p>
                  )}
              </div>
          </div>
        </div>
      </div>

      <DeleteCategoryConfirmationModal 
          isOpen={!!categoryToDelete}
          onClose={() => setCategoryToDelete(null)}
          onConfirm={confirmDelete}
          categoryName={categoryToDelete || ''}
      />
    </>
  );
};