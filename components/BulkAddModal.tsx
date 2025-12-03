
import React, { useState } from 'react';
import { Category, Product } from '../types';
import { Button } from './ui/Button';
import { X, Upload, AlertCircle } from 'lucide-react';

interface BulkAddModalProps {
  onSave: (products: Product[]) => void;
  onClose: () => void;
  categories: string[];
}

export const BulkAddModal: React.FC<BulkAddModalProps> = ({ onSave, onClose, categories }) => {
  const [csvData, setCsvData] = useState('');
  const [previewData, setPreviewData] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'INPUT' | 'PREVIEW'>('INPUT');

  const parseCSV = (text: string) => {
    try {
      const lines = text.trim().split('\n');
      const parsed: Product[] = [];
      
      lines.forEach((line, index) => {
        if (!line.trim()) return;
        const parts = line.split(',').map(p => p.trim());
        // Expect at least Name and Price
        if (parts.length < 2) return; 

        const [name, priceStr, categoryStr, stockStr] = parts;
        const price = parseFloat(priceStr);
        let stock = parseInt(stockStr);
        
        if (!name || isNaN(price)) return;
        if (isNaN(stock)) stock = 0;

        let category = categories[0] || 'Coffee';
        const normalizedCat = categoryStr ? categoryStr.toUpperCase() : '';
        
        // Try to find category match
        const matchedCat = categories.find(c => c.toUpperCase() === normalizedCat);
        if (matchedCat) {
            category = matchedCat;
        }

        parsed.push({
          id: `bulk-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 5)}`,
          name,
          price,
          costPrice: price * 0.6, // Default cost estimate
          category,
          stock,
          description: '',
          image: `https://picsum.photos/seed/${name.replace(/[^a-zA-Z0-9]/g, '')}/200/200`
        });
      });

      if (parsed.length === 0) {
        setError('Could not parse any valid products. Please use format: Name, Price, Category, Stock');
        return;
      }

      setPreviewData(parsed);
      setStep('PREVIEW');
      setError(null);
    } catch (e) {
      setError('Error parsing data. Please check your format.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
          const text = e.target?.result as string;
          setCsvData(text);
          parseCSV(text);
      };
      reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-[#1A2F1A]/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#FDFDFD] rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 border border-[#F2F5F1] max-h-[90vh] flex flex-col">
        
        <div className="p-5 border-b border-[#F2F5F1] flex justify-between items-center bg-white shrink-0">
          <div>
            <h3 className="font-bold text-xl text-[#1A2F1A]">Bulk Add Items</h3>
            <p className="text-xs text-[#7A8C7A]">Import multiple products</p>
          </div>
          <button onClick={onClose} className="text-[#7A8C7A] hover:text-[#1A2F1A] bg-[#F2F5F1] p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
            {step === 'INPUT' ? (
                <div className="space-y-4">
                    <div className="bg-[#E8F5E9] p-4 rounded-2xl border border-[#DCE7D9]">
                        <h4 className="font-bold text-[#4A6741] text-sm mb-1 flex items-center gap-2">
                            <AlertCircle size={16} /> CSV Format Guide
                        </h4>
                        <p className="text-xs text-[#1A2F1A]">Name, Price, Category, Stock</p>
                        <code className="block mt-2 bg-white p-2 rounded border border-[#DCE7D9] text-[10px] text-[#7A8C7A] font-mono">
                            Caramel Latte, 140, Coffee, 50<br/>
                            Blueberry Bagel, 85, Bakery, 20
                        </code>
                    </div>

                    <textarea 
                        value={csvData}
                        onChange={(e) => setCsvData(e.target.value)}
                        className="w-full h-40 p-4 bg-[#F2F5F1] border-none rounded-2xl text-sm font-mono focus:ring-2 focus:ring-[#4A6741]/50 focus:outline-none placeholder-[#B0C4B0] uppercase"
                        placeholder="Paste CSV data here..."
                    />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-[#E8EFE6]"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-[#FDFDFD] text-[#7A8C7A]">OR</span>
                        </div>
                    </div>

                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-[#B0C4B0] rounded-2xl cursor-pointer hover:bg-[#F2F5F1] hover:border-[#4A6741] transition-all group">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-6 h-6 mb-2 text-[#B0C4B0] group-hover:text-[#4A6741]" />
                            <p className="text-xs text-[#7A8C7A]">Upload .csv or .txt file</p>
                        </div>
                        <input type="file" className="hidden" accept=".csv,.txt" onChange={handleFileChange} />
                    </label>

                    {error && (
                        <p className="text-red-500 text-xs font-bold">{error}</p>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-[#1A2F1A]">Preview ({previewData.length} items)</h4>
                        <button onClick={() => setStep('INPUT')} className="text-xs text-[#4A6741] font-bold hover:underline">Back to Input</button>
                    </div>
                    <div className="border border-[#E8EFE6] rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#F9FAF9] text-[#7A8C7A] text-xs font-bold sticky top-0">
                                <tr>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Price</th>
                                    <th className="p-3">Category</th>
                                    <th className="p-3">Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#F2F5F1]">
                                {previewData.map((item) => (
                                    <tr key={item.id}>
                                        <td className="p-3 font-medium">{item.name}</td>
                                        <td className="p-3">₱{item.price.toFixed(2)}</td>
                                        <td className="p-3 text-[#7A8C7A]">{item.category}</td>
                                        <td className="p-3">{item.stock}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>

        <div className="p-5 border-t border-[#F2F5F1] bg-white shrink-0">
            {step === 'INPUT' ? (
                <Button onClick={() => parseCSV(csvData)} className="w-full" disabled={!csvData.trim()}>
                    Process Data
                </Button>
            ) : (
                <Button onClick={() => onSave(previewData)} className="w-full">
                    Import Products
                </Button>
            )}
        </div>

      </div>
    </div>
  );
};
