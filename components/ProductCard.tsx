import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, Sparkles, Package, Ban } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';

interface ProductCardProps {
  product: Product;
  onAdd: (product: Product) => void;
  onUpdateProduct?: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAdd, onUpdateProduct }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const isLowStock = product.stock < 10 && product.stock > 0;
  const isOutOfStock = product.stock === 0;

  const handleGenerateDescription = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onUpdateProduct) return;

    setIsGenerating(true);
    try {
      const description = await generateProductDescription(product.name, product.category);
      onUpdateProduct({ ...product, description });
    } catch (error) {
      console.error("Failed to generate description", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div 
      onClick={() => !isOutOfStock && onAdd(product)}
      className={`group bg-white rounded-3xl p-3 shadow-sm border border-[#E8EFE6] flex flex-col h-full relative transition-all duration-200 ${
        isOutOfStock 
          ? 'opacity-75 grayscale cursor-not-allowed' 
          : 'cursor-pointer hover:shadow-md hover:border-[#4A6741]/30 active:scale-95'
      }`}
    >
      <div className="aspect-square w-full bg-[#F2F5F1] rounded-2xl overflow-hidden mb-3 relative">
        <img 
          src={product.image} 
          alt={product.name} 
          className={`w-full h-full object-cover transition-transform duration-500 ease-out ${!isOutOfStock ? 'group-hover:scale-105' : ''}`}
        />
        {isOutOfStock && (
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] flex items-center justify-center z-10">
            <span className="bg-[#1A2F1A]/90 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1">
              <Ban size={12} /> Out of Stock
            </span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col flex-grow px-1">
        <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-[#1A2F1A] text-sm leading-tight">{product.name}</h3>
        </div>
        
        {product.description ? (
          <p className="text-[10px] text-[#7A8C7A] line-clamp-2 mb-2 leading-relaxed">{product.description}</p>
        ) : (
          <div className="mb-2">
            <button 
              onClick={handleGenerateDescription}
              disabled={isGenerating || !onUpdateProduct || isOutOfStock}
              className="text-[10px] font-bold flex items-center gap-1 text-[#4A6741] bg-[#DCE7D9]/50 px-2 py-1 rounded-lg hover:bg-[#4A6741] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles size={10} className={isGenerating ? "animate-spin" : ""} />
              {isGenerating ? "Writing..." : "AI Describe"}
            </button>
          </div>
        )}

        <div className="mt-auto flex items-end justify-between">
          <div>
             <span className={`font-bold text-base block ${isOutOfStock ? 'text-[#7A8C7A]' : 'text-[#4A6741]'}`}>₱{Number(product.price || 0).toFixed(2)}</span>
             <div className={`flex items-center gap-1 text-[10px] font-bold mt-1 ${isOutOfStock ? 'text-red-500' : isLowStock ? 'text-amber-600' : 'text-[#7A8C7A]'}`}>
                <Package size={10} />
                <span>{product.stock} left</span>
             </div>
          </div>
          <button 
            disabled={isOutOfStock}
            className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors shadow-sm ${
              isOutOfStock 
              ? 'bg-[#F2F5F1] text-[#B0C4B0] cursor-not-allowed' 
              : 'bg-[#DCE7D9] text-[#4A6741] group-hover:bg-[#4A6741] group-hover:text-white'
            }`}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};