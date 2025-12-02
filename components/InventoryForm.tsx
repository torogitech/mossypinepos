
import React, { useState, useEffect } from 'react';
import { Category, Product } from '../types';
import { Button } from './ui/Button';
import { X, Sparkles, Image as ImageIcon, Upload, AlertCircle, Scan } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';
import { Scanner } from './Scanner';

interface InventoryFormProps {
  onSave: (product: Product) => void;
  onClose: () => void;
  initialProduct?: Product | null;
  categories: string[];
  products: Product[]; // To check for existing barcodes
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ onSave, onClose, initialProduct, categories, products }) => {
  // Initialize category: use existing, or first available, or empty string. Do NOT default to hardcoded 'Coffee'.
  const [name, setName] = useState(initialProduct?.name || '');
  const [price, setPrice] = useState(initialProduct?.price.toString() || '');
  const [costPrice, setCostPrice] = useState(initialProduct?.costPrice?.toString() || '');
  const [category, setCategory] = useState<Category>(
    initialProduct?.category || (categories.length > 0 ? categories[0] : '')
  );
  const [stock, setStock] = useState(initialProduct?.stock.toString() || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [barcode, setBarcode] = useState(initialProduct?.barcode || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialProduct?.image || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const isEditing = !!initialProduct;

  // Effect to ensure category is valid if categories prop changes or on init if empty
  useEffect(() => {
      if (!category && categories.length > 0) {
          setCategory(categories[0]);
      }
  }, [categories, category]);

  const handleGenerateDescription = async () => {
    if (!name) return;
    setIsGenerating(true);
    const desc = await generateProductDescription(name, category);
    setDescription(desc);
    setIsGenerating(false);
  };

  const processFile = (file: File) => {
    setError(null);
    
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, WEBP)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size is too large (Max 5MB)');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => {
      setError('Error reading file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const removeImage = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setImagePreview(null);
      setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Strict Validation
    if (!name.trim()) {
        setError('Product name is required. Please populate data.');
        return;
    }
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
        setError('Valid price is required. Please populate data.');
        return;
    }
    if (!stock || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
        setError('Valid stock quantity is required. Please populate data.');
        return;
    }
    // Check if category is selected and exists
    if (!category || category.trim() === '') {
        setError('Category is missing. Please select a valid category.');
        return;
    }
    
    const finalCostPrice = costPrice ? parseFloat(costPrice) : (parseFloat(price) * 0.6);
    
    const newProduct: Product = {
      id: initialProduct?.id || Date.now().toString(),
      name,
      price: parseFloat(price),
      costPrice: finalCostPrice,
      category,
      stock: parseInt(stock),
      description,
      image: imagePreview || `https://picsum.photos/seed/${name.replace(/\s/g, '')}/200/200`,
      barcode: barcode
    };
    onSave(newProduct);
  };

  const handleBarcodeScanned = (code: string) => {
      setBarcode(code);
      
      const existing = products.find(p => p.barcode === code);
      if (existing) {
          setName(existing.name);
          setPrice(existing.price.toString());
          setCostPrice(existing.costPrice.toString());
          setCategory(existing.category as Category);
          setStock(existing.stock.toString());
          setDescription(existing.description || '');
          setImagePreview(existing.image);
      }
  };

  return (
    <>
    {showScanner && (
        <Scanner 
            onClose={() => setShowScanner(false)} 
            onScan={handleBarcodeScanned}
            products={products}
            continuous={false}
        />
    )}
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#F2F5F1] max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
          <h3 className="font-bold text-xl text-[#1A2F1A]">{isEditing ? 'Edit Item' : 'Add New Item'}</h3>
          <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Image Upload Section */}
            <div>
                <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Product Image</label>
                <div 
                  className={`relative w-full h-40 rounded-2xl border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden group ${
                    error && !imagePreview && !isEditing // Highlight if error related to image (simplified logic)
                      ? 'border-red-300 bg-red-50'
                      : isDragging 
                        ? 'border-[#4A6741] bg-[#E8F5E9] scale-[1.02]' 
                        : 'border-[#B0C4B0] bg-[#F2F5F1] hover:border-[#4A6741] hover:bg-[#E8EFE6]'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  
                  {imagePreview ? (
                    <div className="relative w-full h-full group-hover:opacity-90 transition-opacity">
                         <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium text-xs">
                             Change Image
                         </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center p-4 pointer-events-none">
                      <div className={`p-3 rounded-full mb-2 transition-transform duration-300 ${
                        error && !imagePreview
                          ? 'bg-red-100 text-red-500'
                          : isDragging 
                            ? 'bg-[#4A6741] text-white scale-110' 
                            : 'bg-white text-[#4A6741] shadow-sm group-hover:scale-110'
                      }`}>
                        {error && !imagePreview ? <AlertCircle size={24} /> : isDragging ? <Upload size={24} /> : <ImageIcon size={24} />}
                      </div>
                      <span className={`text-xs font-bold transition-colors ${error && !imagePreview ? 'text-red-500' : isDragging ? 'text-[#4A6741]' : 'text-[#1A2F1A]'}`}>
                        {error && !imagePreview ? 'Upload Failed' : isDragging ? 'Drop image here' : 'Click or Drag to upload'}
                      </span>
                      <span className={`text-[10px] mt-1 ${error ? 'text-red-400' : 'text-[#7A8C7A]'}`}>
                        {error ? 'Please try again' : 'PNG, JPG up to 5MB'}
                      </span>
                    </div>
                  )}

                   {imagePreview && (
                      <button 
                        onClick={removeImage}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-md z-20 text-[#1A2F1A] hover:text-red-500 transition-colors"
                        title="Remove image"
                      >
                          <X size={14} />
                      </button>
                  )}
                </div>
            </div>

            {/* Barcode Section */}
            <div>
              <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Barcode / SKU</label>
              <div className="flex gap-2">
                  <div className="relative flex-1">
                      <input 
                        type="text" 
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all"
                        placeholder="Scan or type..."
                      />
                  </div>
                  <button 
                    type="button"
                    onClick={() => setShowScanner(true)}
                    className="bg-[#1A2F1A] text-white p-4 rounded-2xl hover:bg-[#4A6741] transition-colors shadow-md flex items-center gap-2"
                    title="Scan Barcode"
                  >
                      <Scan size={20} />
                      <span className="hidden sm:inline font-bold text-sm">Scan</span>
                  </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Item Name</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all"
                placeholder="e.g., Vanilla Latte"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Price (₱)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Cost (₱)</label>
                <input 
                  type="number" 
                  step="0.01"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Stock Qty</label>
                <input 
                  required
                  type="number" 
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all"
                  placeholder="100"
                />
              </div>
               <div>
                <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider mb-2">Category</label>
                <div className="relative">
                    <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Category)}
                    className={`w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all appearance-none ${!category ? 'text-[#B0C4B0]' : ''}`}
                    required
                    >
                    {categories.length === 0 ? (
                        <option value="">No Categories Found</option>
                    ) : (
                        categories.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))
                    )}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4A6741]">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
                {categories.length === 0 && (
                    <p className="text-[10px] text-red-500 mt-1 pl-1 font-bold">
                        * Create a category first in Settings.
                    </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-xs font-bold text-[#4A6741] uppercase tracking-wider">Description</label>
                <button 
                  type="button"
                  onClick={handleGenerateDescription}
                  disabled={!name || isGenerating}
                  className="text-xs flex items-center text-[#4A6741] bg-[#DCE7D9] px-2 py-1 rounded-lg hover:bg-[#4A6741] hover:text-white font-bold transition-all disabled:opacity-50 disabled:hover:bg-[#DCE7D9] disabled:hover:text-[#4A6741]"
                >
                  <Sparkles size={12} className="mr-1" />
                  {isGenerating ? 'Writing...' : 'AI Write'}
                </button>
              </div>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium placeholder-[#B0C4B0] focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all h-24 resize-none"
                placeholder="Product details..."
              />
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-red-600 text-xs font-bold animate-in slide-in-from-top-1">
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-2 pb-2">
              <Button type="submit" className="w-full py-4 text-base shadow-xl shadow-[#4A6741]/20">
                {isEditing ? 'Save Changes' : 'Add Item'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </>
  );
};
