
import React, { useState, useEffect, useRef } from 'react';
import { Category, Product } from '../types';
import { Button } from './ui/Button';
import { X, Sparkles, Image as ImageIcon, Upload, AlertCircle, Trash2, Scan, CheckCircle2, Zap, ZapOff, ZoomIn, ZoomOut } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';

interface InventoryFormProps {
  onSave: (product: Product) => void;
  onClose: () => void;
  initialProduct?: Product | null;
  categories: string[];
  products: Product[]; // To check for existing barcodes
}

const playScanSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // Ignore audio errors
  }
};

interface ScannerOverlayProps {
  onClose: () => void;
  onScan: (code: string) => void;
  products: Product[];
}

const ScannerOverlay: React.FC<ScannerOverlayProps> = ({ onClose, onScan, products }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scanStatus, setScanStatus] = useState<'SEARCHING' | 'DETECTED' | 'ERROR'>('SEARCHING');
    const [torchOn, setTorchOn] = useState(false);
    const [hasNativeSupport, setHasNativeSupport] = useState(false);
    const [track, setTrack] = useState<MediaStreamTrack | null>(null);
    const [zoom, setZoom] = useState(1);
    const [capabilities, setCapabilities] = useState<any>(null);
    const [statusMessage, setStatusMessage] = useState<string>("Align barcode within frame");

    useEffect(() => {
        let stream: MediaStream | null = null;
        let intervalId: any = null;
        let detector: any = null;

        // Check for native BarcodeDetector support
        const hasSupport = 'BarcodeDetector' in window;
        setHasNativeSupport(hasSupport);
        
        if (!hasSupport) {
            setStatusMessage("Tap screen to simulate scan");
        }

        const initCamera = async () => {
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    video: { 
                      facingMode: 'environment',
                      width: { ideal: 1920 },
                      height: { ideal: 1080 },
                      focusMode: 'continuous'
                    } as any
                });
                
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    // Wait for metadata to load to play
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play().catch(e => console.log("Play error", e));
                    };
                }

                const videoTrack = stream.getVideoTracks()[0];
                setTrack(videoTrack);

                // Get Capabilities
                const caps = videoTrack.getCapabilities() as any;
                setCapabilities(caps);
                if (caps.zoom) {
                    setZoom(caps.zoom.min || 1);
                }

                // Setup detection loop if supported
                if (hasSupport) {
                    detector = new (window as any).BarcodeDetector({
                        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39']
                    });

                    intervalId = setInterval(async () => {
                        if (videoRef.current && videoRef.current.readyState === 4 && scanStatus === 'SEARCHING') {
                            try {
                                const barcodes = await detector.detect(videoRef.current);
                                if (barcodes.length > 0) {
                                    handleSuccess(barcodes[0].rawValue);
                                }
                            } catch (e) {
                                // Detection error or no barcode, ignore frame
                            }
                        }
                    }, 100); // Check 10 times a second
                }

            } catch (err) {
                console.error("Camera Init Error:", err);
                setScanStatus('ERROR');
                setStatusMessage("Camera access denied");
            }
        };

        initCamera();

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [scanStatus]);

    const handleSuccess = (code: string) => {
        if (scanStatus === 'DETECTED') return;
        setScanStatus('DETECTED');
        playScanSound();
        if (navigator.vibrate) navigator.vibrate(200);
        
        const existing = products.find(p => p.barcode === code);
        setStatusMessage(existing ? `Found: ${existing.name}` : `Scanned: ${code}`);
        
        setTimeout(() => {
            onScan(code);
            onClose();
        }, 800);
    };

    const handleSimulatedClick = () => {
        // If native support is missing, allow click to simulate for demo purposes
        if (!hasNativeSupport && scanStatus === 'SEARCHING') {
            const mock = Math.floor(Math.random() * 9000000000000 + 1000000000000).toString();
            handleSuccess(mock);
        }
    };
    
    const toggleTorch = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (track) {
            try {
                 await track.applyConstraints({ advanced: [{ torch: !torchOn }] } as any);
                 setTorchOn(!torchOn);
            } catch (e) {
                console.log("Torch not supported on this device");
            }
        }
    };

    const handleZoom = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
        if (track && capabilities?.zoom) {
            try {
                await track.applyConstraints({ advanced: [{ zoom: newZoom }] } as any);
            } catch (err) {
                console.error(err);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col animate-in fade-in duration-300" onClick={handleSimulatedClick}>
            <div className="relative flex-1 bg-black overflow-hidden">
                <video 
                  ref={videoRef} 
                  muted 
                  playsInline 
                  className="absolute inset-0 w-full h-full object-cover opacity-80" 
                />
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 pt-8 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2 text-white">
                       <Scan size={20} className="text-[#4A6741]" />
                       <span className="font-bold text-lg">Scan Barcode</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onClose(); }} 
                      className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                      <X size={20}/>
                    </button>
                </div>

                {/* Viewfinder */}
                <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                    {/* Darkened Overlay */}
                    <div className="absolute inset-0 bg-black/40">
                       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-48 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-2xl"></div>
                    </div>

                    {/* Scanning Frame */}
                    <div className={`relative w-72 h-48 border-2 rounded-2xl transition-all duration-300 ${scanStatus === 'DETECTED' ? 'border-emerald-500 bg-emerald-500/10' : scanStatus === 'ERROR' ? 'border-red-500' : 'border-white/70'}`}>
                        
                        {/* Corner Markers */}
                        <div className={`absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg -mt-1 -ml-1 ${scanStatus === 'DETECTED' ? 'border-emerald-500' : 'border-[#4A6741]'}`}></div>
                        <div className={`absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg -mt-1 -mr-1 ${scanStatus === 'DETECTED' ? 'border-emerald-500' : 'border-[#4A6741]'}`}></div>
                        <div className={`absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg -mb-1 -ml-1 ${scanStatus === 'DETECTED' ? 'border-emerald-500' : 'border-[#4A6741]'}`}></div>
                        <div className={`absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 rounded-br-lg -mb-1 -mr-1 ${scanStatus === 'DETECTED' ? 'border-emerald-500' : 'border-[#4A6741]'}`}></div>

                        {scanStatus === 'SEARCHING' && (
                            <div className="absolute top-0 left-4 right-4 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                        )}
                        
                        {scanStatus === 'DETECTED' && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="bg-emerald-500/90 text-white p-3 rounded-full shadow-lg scale-125 transition-transform animate-in zoom-in">
                                   <CheckCircle2 size={32} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Footer Controls */}
                <div className="absolute bottom-10 left-0 right-0 flex flex-col items-center gap-6 z-20 pointer-events-none">
                    
                    {/* Zoom Control */}
                    {capabilities?.zoom && (
                        <div className="flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-64 pointer-events-auto">
                            <ZoomOut size={16} className="text-white/80" />
                            <input 
                              type="range" 
                              min={capabilities.zoom.min} 
                              max={capabilities.zoom.max} 
                              step={0.1}
                              value={zoom}
                              onChange={handleZoom}
                              className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                            />
                            <ZoomIn size={16} className="text-white/80" />
                        </div>
                    )}

                    <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-white/10 pointer-events-auto">
                         <span className={`font-medium text-sm ${scanStatus === 'ERROR' ? 'text-red-400' : scanStatus === 'DETECTED' ? 'text-emerald-400' : 'text-white'}`}>
                             {statusMessage}
                         </span>
                    </div>
                    
                    {/* Torch Button */}
                    {capabilities?.torch && (
                      <button 
                         onClick={toggleTorch}
                         className={`p-4 rounded-full transition-all pointer-events-auto border ${torchOn ? 'bg-white text-black border-white' : 'bg-black/40 text-white border-white/20 hover:bg-black/60'}`}
                      >
                          {torchOn ? <ZapOff size={24} /> : <Zap size={24} />}
                      </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export const InventoryForm: React.FC<InventoryFormProps> = ({ onSave, onClose, initialProduct, categories, products }) => {
  const [name, setName] = useState(initialProduct?.name || '');
  const [price, setPrice] = useState(initialProduct?.price.toString() || '');
  const [costPrice, setCostPrice] = useState(initialProduct?.costPrice?.toString() || '');
  const [category, setCategory] = useState<Category>(initialProduct?.category || categories[0] || 'Coffee');
  const [stock, setStock] = useState(initialProduct?.stock.toString() || '');
  const [description, setDescription] = useState(initialProduct?.description || '');
  const [barcode, setBarcode] = useState(initialProduct?.barcode || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(initialProduct?.image || null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const isEditing = !!initialProduct;

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

    // 5MB limit check matching UI text
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
    // Default cost price to 60% of selling price if not provided
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
      setShowScanner(false);
      
      // Check if product exists
      const existing = products.find(p => p.barcode === code);
      if (existing) {
          // Populate fields
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
        <ScannerOverlay 
            onClose={() => setShowScanner(false)} 
            onScan={handleBarcodeScanned}
            products={products}
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
                    error
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
                        error 
                          ? 'bg-red-100 text-red-500'
                          : isDragging 
                            ? 'bg-[#4A6741] text-white scale-110' 
                            : 'bg-white text-[#4A6741] shadow-sm group-hover:scale-110'
                      }`}>
                        {error ? <AlertCircle size={24} /> : isDragging ? <Upload size={24} /> : <ImageIcon size={24} />}
                      </div>
                      <span className={`text-xs font-bold transition-colors ${error ? 'text-red-500' : isDragging ? 'text-[#4A6741]' : 'text-[#1A2F1A]'}`}>
                        {error ? 'Upload Failed' : isDragging ? 'Drop image here' : 'Click or Drag to upload'}
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
                {error && (
                  <div className="mt-2 p-2 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-red-600 text-xs font-medium animate-in slide-in-from-top-1">
                    <AlertCircle size={14} />
                    {error}
                  </div>
                )}
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
                    className="w-full p-4 bg-[#F2F5F1] border-none rounded-2xl text-[#1A2F1A] font-medium focus:outline-none focus:ring-2 focus:ring-[#4A6741]/50 transition-all appearance-none"
                    >
                    {categories.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#4A6741]">
                        <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
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
