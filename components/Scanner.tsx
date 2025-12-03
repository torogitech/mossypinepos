
import React, { useState, useEffect, useRef } from 'react';
import { X, Scan, Zap, ZapOff, ZoomIn, ZoomOut, AlertTriangle, Settings, ShoppingBag } from 'lucide-react';
import { Product } from '../types';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';

interface ScannerProps {
  onClose: () => void;
  onScan: (code: string) => void;
  products: Product[];
  continuous?: boolean;
  onViewOrder?: () => void;
  paused?: boolean;
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

    // High-pitched "beep"
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(1800, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.15);
  } catch (e) {
    // Ignore audio errors
  }
};

export const Scanner: React.FC<ScannerProps> = ({ onClose, onScan, products, continuous = false, onViewOrder, paused = false }) => {
    // Status State Machine: IDLE -> PERMISSION_PROMPT -> PERMISSION_DENIED -> SEARCHING -> DETECTED -> ERROR
    const [scanStatus, setScanStatus] = useState<'IDLE' | 'PERMISSION_PROMPT' | 'PERMISSION_DENIED' | 'SEARCHING' | 'DETECTED' | 'ERROR'>('IDLE');
    
    const [torchOn, setTorchOn] = useState(false);
    const [zoom, setZoom] = useState(1.0);
    const [statusMessage, setStatusMessage] = useState<string>("Initializing camera...");
    const [isNative] = useState(Capacitor.isNativePlatform());

    // Refs to avoid stale closures in the event listener
    const isScanning = useRef(false);
    const productsRef = useRef(products);
    const onScanRef = useRef(onScan);
    const pausedRef = useRef(paused);

    useEffect(() => {
        productsRef.current = products;
    }, [products]);

    useEffect(() => {
        onScanRef.current = onScan;
    }, [onScan]);

    useEffect(() => {
        pausedRef.current = paused;
    }, [paused]);

    useEffect(() => {
        let listenerHandle: any;

        const initializeScanner = async () => {
            if (!isNative) {
                // Simple Web Fallback or message
                setStatusMessage("Web scanner not supported in this mode. Please use native app.");
                setScanStatus('ERROR');
                return;
            }

            try {
                // 1. Check/Request Permissions
                const status = await BarcodeScanner.checkPermissions();
                
                if (status.camera === 'denied') {
                    setScanStatus('PERMISSION_DENIED');
                    return;
                }
                
                if (status.camera !== 'granted') {
                    setScanStatus('PERMISSION_PROMPT');
                    const request = await BarcodeScanner.requestPermissions();
                    if (request.camera !== 'granted') {
                        setScanStatus('PERMISSION_DENIED');
                        return;
                    }
                }

                // 2. Prepare UI for Transparency
                // We need to make the body and app container transparent to see the native camera behind the WebView
                document.body.classList.add('scanner-active');
                document.documentElement.classList.add('scanner-active');
                // Attempt to make root transparent if it has a background
                const appRoot = document.getElementById('root');
                if (appRoot) appRoot.style.backgroundColor = 'transparent';

                // 3. Setup Listener
                listenerHandle = await BarcodeScanner.addListener('barcodeScanned', async (result) => {
                    // Prevent scan if locked (scanning) or paused (cart open)
                    if (isScanning.current || pausedRef.current) return;
                    
                    const code = result.barcode.rawValue;
                    isScanning.current = true;
                    
                    playScanSound();
                    if (navigator.vibrate) navigator.vibrate([50]);

                    const existing = productsRef.current.find(p => p.barcode === code);
                    setStatusMessage(existing ? `Added: ${existing.name}` : `Scanned: ${code}`);
                    
                    // Call the latest onScan handler
                    onScanRef.current(code);

                    if (!continuous) {
                        setScanStatus('DETECTED');
                        setTimeout(() => {
                            onClose();
                        }, 500);
                    } else {
                        // Continuous mode: Reset lock after delay to allow next scan
                        // Requested 1.5s delay
                        setTimeout(() => {
                            isScanning.current = false;
                            setStatusMessage("Align code within frame");
                        }, 1500);
                    }
                });

                // 4. Start Scanning
                await BarcodeScanner.startScan({ 
                    formats: [BarcodeFormat.QrCode, BarcodeFormat.Ean13, BarcodeFormat.Ean8, BarcodeFormat.UpcA, BarcodeFormat.UpcE, BarcodeFormat.Code128, BarcodeFormat.Code39],
                    lensFacing: LensFacing.Back 
                });
                
                setScanStatus('SEARCHING');
                setStatusMessage("Align code within frame");

            } catch (error: any) {
                console.error("Scanner Init Error:", error);
                setScanStatus('ERROR');
                setStatusMessage(error.message || "Failed to start scanner");
            }
        };

        initializeScanner();

        return () => {
            // Cleanup on unmount
            if (isNative) {
                BarcodeScanner.stopScan();
                if (listenerHandle) {
                    listenerHandle.remove();
                }
            }
            
            // Restore UI opacity
            document.body.classList.remove('scanner-active');
            document.documentElement.classList.remove('scanner-active');
            const appRoot = document.getElementById('root');
            if (appRoot) appRoot.style.backgroundColor = '';
        };
    }, [isNative, continuous, onClose]);

    const toggleTorch = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!isNative) return;
        try {
            if (torchOn) {
                await BarcodeScanner.disableTorch();
            } else {
                await BarcodeScanner.enableTorch();
            }
            setTorchOn(!torchOn);
        } catch (e) {
            console.log("Torch error", e);
        }
    };

    const handleZoom = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.stopPropagation();
        if (!isNative) return;
        const newZoom = parseFloat(e.target.value);
        setZoom(newZoom);
        try {
            await BarcodeScanner.setZoomRatio({ zoomRatio: newZoom });
        } catch (err) {
            console.error(err);
        }
    };

    const openSettings = async () => {
        if (isNative) {
            await BarcodeScanner.openSettings();
        }
    };

    // Inject styles for transparency override
    return (
        <div className="fixed inset-0 z-[100] flex flex-col bg-transparent">
            <style>{`
                body.scanner-active, html.scanner-active {
                    background: transparent !important; 
                }
                body.scanner-active #root {
                    background: transparent !important;
                }
                /* Hide other potential opaque layers if necessary */
                body.scanner-active .bg-white {
                    background-color: transparent !important;
                }
                body.scanner-active .bg-\\[\\#F2F5F1\\] {
                    background-color: transparent !important;
                }
            `}</style>

            {/* Main Content Area */}
            <div className="relative flex-1 overflow-hidden flex flex-col justify-center">
                
                {/* 1. Permission Denied State */}
                {scanStatus === 'PERMISSION_DENIED' && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-[#1A2F1A]">
                         <div className="bg-red-500/10 p-6 rounded-full mb-6">
                            <AlertTriangle size={48} className="text-red-500" />
                         </div>
                         <h3 className="text-white font-bold text-xl mb-2">Access Denied</h3>
                         <p className="text-white/60 mb-8 max-w-xs">
                             Camera permission was denied. Please enable it in your device settings.
                         </p>
                         <button 
                            onClick={openSettings}
                            className="bg-white/10 text-white border border-white/20 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-white/20 transition-colors"
                         >
                            <Settings size={18} />
                            Open Settings
                         </button>
                         <button 
                            onClick={onClose}
                            className="mt-6 text-white/50 text-sm font-medium hover:text-white"
                         >
                            Close Scanner
                         </button>
                     </div>
                )}

                {/* 2. Error State */}
                {scanStatus === 'ERROR' && (
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-30 bg-[#1A2F1A]">
                         <div className="bg-red-500/10 p-6 rounded-full mb-6">
                            <AlertTriangle size={48} className="text-red-500" />
                         </div>
                         <h3 className="text-white font-bold text-xl mb-2">Scanner Error</h3>
                         <p className="text-white/60 mb-8 max-w-xs">
                             {statusMessage}
                         </p>
                         <button 
                            onClick={onClose}
                            className="bg-white/10 text-white px-8 py-3 rounded-xl font-bold"
                         >
                            Close
                         </button>
                     </div>
                )}

                {/* 3. Active Scanning State - Overlay UI */}
                {(scanStatus === 'SEARCHING' || scanStatus === 'DETECTED') && (
                    <>
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 bg-black/40">
                                {/* Transparent Hole for Scanning Area */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-64 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden box-content border-2 border-white/20">
                                    {/* Corner Markers */}
                                    <div className="absolute top-0 left-0 w-10 h-10 border-t-[6px] border-l-[6px] rounded-tl-xl -mt-1 -ml-1 border-white"></div>
                                    <div className="absolute top-0 right-0 w-10 h-10 border-t-[6px] border-r-[6px] rounded-tr-xl -mt-1 -mr-1 border-white"></div>
                                    <div className="absolute bottom-0 left-0 w-10 h-10 border-b-[6px] border-l-[6px] rounded-bl-xl -mb-1 -ml-1 border-white"></div>
                                    <div className="absolute bottom-0 right-0 w-10 h-10 border-b-[6px] border-r-[6px] rounded-br-xl -mb-1 -mr-1 border-white"></div>

                                    {/* Scan Line Animation */}
                                    <div 
                                        className="absolute left-0 right-0 h-1 bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)] opacity-60"
                                        style={{ animation: 'scan 2s infinite linear' }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                
                {/* Header Controls */}
                <div className="absolute top-0 left-0 right-0 p-4 pt-10 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-2 text-white/90">
                       <Scan size={20} className="text-[#4A6741]" />
                       <span className="font-bold text-lg tracking-wide">Scan Barcode</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onClose(); }} 
                      className="bg-black/30 hover:bg-black/50 border border-white/20 p-2.5 rounded-full text-white backdrop-blur-md transition-all active:scale-95"
                    >
                      <X size={24}/>
                    </button>
                </div>
                
                {/* Footer Controls */}
                {(scanStatus === 'SEARCHING' || scanStatus === 'DETECTED') && (
                    <div className="absolute bottom-0 left-0 right-0 pb-10 pt-20 px-6 flex flex-col items-center gap-6 z-20 bg-gradient-to-t from-black/90 to-transparent">
                        
                        <div className="px-6 py-2.5 rounded-full backdrop-blur-xl border border-white/10 bg-white/10 text-white font-medium text-sm shadow-lg">
                            {statusMessage}
                        </div>

                        <div className="flex items-center gap-4 pointer-events-auto">
                            {/* Zoom Slider */}
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                <ZoomOut size={16} className="text-white/70" />
                                <input 
                                    type="range" 
                                    min="1.0" 
                                    max="3.0" 
                                    step="0.1"
                                    value={zoom}
                                    onChange={handleZoom}
                                    className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                                <ZoomIn size={16} className="text-white/70" />
                            </div>

                            {/* Torch Toggle */}
                            <button 
                                onClick={toggleTorch}
                                className={`p-3 rounded-full transition-all border backdrop-blur-md ${
                                    torchOn 
                                    ? 'bg-yellow-400/20 border-yellow-400 text-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.3)]' 
                                    : 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                }`}
                            >
                                {torchOn ? <ZapOff size={24} /> : <Zap size={24} />}
                            </button>

                             {/* View Order Button */}
                             {onViewOrder && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); onViewOrder(); }}
                                    className="p-3 rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 backdrop-blur-md transition-all active:scale-95 relative"
                                    title="View Order"
                                >
                                    <ShoppingBag size={24} />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
