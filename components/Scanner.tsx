
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Scan, Zap, ZapOff, ZoomIn, ZoomOut, AlertTriangle, Settings, ShoppingBag, AlertCircle, Ban, CheckCircle2 } from 'lucide-react';
import { Product } from '../types';
import { BarcodeScanner, BarcodeFormat, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { Capacitor } from '@capacitor/core';
import { Button } from './ui/Button';

interface ScannerProps {
  onClose: () => void;
  onScan: (code: string) => void;
  products: Product[];
  continuous?: boolean;
  onViewOrder?: () => void;
  paused?: boolean;
}

const playSuccessSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    const playTone = (freq: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Play a "ding-dong" success sound (High C then Higher E)
    playTone(880, now, 0.1); // A5
    playTone(1760, now + 0.1, 0.3); // A6

  } catch (e) {
    // Ignore audio errors
  }
};

const playErrorSound = () => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    
    const ctx = new AudioContext();
    
    const playTone = (freq: number, type: OscillatorType, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = type;
        oscillator.frequency.value = freq;
        
        gainNode.gain.setValueAtTime(0.1, startTime);
        gainNode.gain.linearRampToValueAtTime(0, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    // Play a "buzz" error sound (Sawtooth wave, low frequency)
    playTone(150, 'sawtooth', now, 0.4); 
    playTone(100, 'sawtooth', now + 0.1, 0.4);

  } catch (e) {
    // Ignore audio errors
  }
};

interface ScannerAlert {
    title: string;
    message: string;
    type: 'warning' | 'error';
}

export const Scanner: React.FC<ScannerProps> = ({ onClose, onScan, products, continuous = false, onViewOrder, paused = false }) => {
    // Status State Machine: IDLE -> PERMISSION_PROMPT -> PERMISSION_DENIED -> SEARCHING -> DETECTED -> ERROR
    const [scanStatus, setScanStatus] = useState<'IDLE' | 'PERMISSION_PROMPT' | 'PERMISSION_DENIED' | 'SEARCHING' | 'DETECTED' | 'ERROR'>('IDLE');
    
    const [torchOn, setTorchOn] = useState(false);
    const [zoom, setZoom] = useState(1.0);
    const [statusMessage, setStatusMessage] = useState<string>("Align code within frame");
    const [isNative] = useState(Capacitor.isNativePlatform());
    const [alert, setAlert] = useState<ScannerAlert | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

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
        let isActive = true;

        const initializeScanner = async () => {
            if (!isNative) {
                // Simple Web Fallback or message
                setStatusMessage("Web scanner not supported in this mode. Please use native app.");
                setScanStatus('ERROR');
                return;
            }

            try {
                // CRITICAL FIX: Stop any existing scan first to clear camera surfaces
                await BarcodeScanner.stopScan();
                // Add a small delay to ensure native camera resources are released
                await new Promise(resolve => setTimeout(resolve, 500));
                
                if (!isActive) return;

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

                // 3. Setup Listener
                listenerHandle = await BarcodeScanner.addListener('barcodeScanned', async (result) => {
                    // Prevent scan if locked (scanning), paused (cart open), or alert visible
                    if (isScanning.current || pausedRef.current) return;
                    
                    const code = result.barcode.rawValue;
                    isScanning.current = true; // Lock
                    
                    // --- Validation Logic ---
                    const existing = productsRef.current.find(p => p.barcode === code);

                    // If continuous mode (POS), check inventory first
                    if (continuous) {
                        if (!existing) {
                             playErrorSound();
                             if (navigator.vibrate) navigator.vibrate([200]); // Long Error Vibrate
                             setAlert({
                                 title: 'Item Not Found',
                                 message: `Barcode "${code}" does not match any product in inventory.`,
                                 type: 'error'
                             });
                             // Don't process further, wait for alert dismissal
                             return; 
                        }
                        
                        if (existing.stock <= 0) {
                             playErrorSound();
                             if (navigator.vibrate) navigator.vibrate([200]); 
                             setAlert({
                                 title: 'Out of Stock',
                                 message: `${existing.name} is currently out of stock.`,
                                 type: 'warning'
                             });
                             return;
                        }
                    }

                    // Success Case
                    playSuccessSound();
                    if (navigator.vibrate) navigator.vibrate([50]);
                    
                    setIsSuccess(true);
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
                        setTimeout(() => {
                            if (isActive) {
                                setIsSuccess(false);
                                isScanning.current = false;
                                setStatusMessage("Align code within frame");
                            }
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
                if (isActive) {
                    setScanStatus('ERROR');
                    setStatusMessage(error.message || "Failed to start scanner. Restart app.");
                }
            }
        };

        initializeScanner();

        return () => {
            isActive = false;
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

    const dismissAlert = () => {
        setAlert(null);
        // Add a small delay before allowing scan again to prevent immediate rescanning of same bad code
        setTimeout(() => {
            isScanning.current = false;
        }, 1000);
    };

    // Use Portal to render outside root div, allowing us to hide the entire app container
    // Conditionally hide the scanner UI itself when paused (viewing cart)
    return createPortal(
        <div className={`fixed inset-0 z-[100] flex flex-col bg-transparent ${paused ? 'invisible pointer-events-none' : ''}`}>
            <style>{`
                /* Make body transparent to see native camera layer */
                body.scanner-active, html.scanner-active {
                    background: transparent !important;
                }
                
                /* Hide the entire React App container while scanning ONLY if not paused */
                /* This ensures NO HTML elements block the camera view normally */
                /* But when paused (viewing order), we MUST show the app container so the Cart modal is visible */
                ${!paused ? `
                body.scanner-active #app-root-container {
                    display: none !important;
                }
                ` : ''}
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
                         <p className="text-white/60 mb-8 max-w-xs text-xs break-all">
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

                {/* 3. Alert Modal (Overlay) */}
                {alert && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                        <div className="bg-white w-full max-w-xs rounded-3xl p-6 text-center shadow-2xl animate-in zoom-in-95 duration-200 transform">
                            <div className={`h-16 w-16 mx-auto rounded-full flex items-center justify-center mb-4 ${alert.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                                {alert.type === 'error' ? <AlertCircle size={32} /> : <Ban size={32} />}
                            </div>
                            <h3 className="text-xl font-bold text-[#1A2F1A] mb-2">{alert.title}</h3>
                            <p className="text-[#7A8C7A] text-sm mb-6 leading-relaxed">{alert.message}</p>
                            <Button onClick={dismissAlert} className="w-full py-3 text-base shadow-lg" variant={alert.type === 'error' ? 'danger' : 'primary'}>
                                OK
                            </Button>
                        </div>
                    </div>
                )}

                {/* 4. Active Scanning State - Overlay UI */}
                {(scanStatus === 'SEARCHING' || scanStatus === 'DETECTED') && !alert && (
                    <>
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Transparent Hole for Scanning Area - Shadow provides the dimming for rest of screen */}
                            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-64 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden box-content border-2 transition-colors duration-300 ${isSuccess ? 'border-emerald-500 shadow-[0_0_0_9999px_rgba(0,0,0,0.7)]' : 'border-white/20'}`}>
                                
                                {isSuccess ? (
                                    <div className="absolute inset-0 flex items-center justify-center bg-emerald-500/20 animate-in fade-in zoom-in duration-200">
                                        <div className="bg-emerald-500 text-white p-4 rounded-full shadow-lg shadow-emerald-500/40 animate-bounce">
                                            <CheckCircle2 size={48} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
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
                                    </>
                                )}
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
                        
                        <div className={`px-6 py-2.5 rounded-full backdrop-blur-xl border font-medium text-sm shadow-lg transition-colors duration-300 ${isSuccess ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-100' : 'bg-white/10 border-white/10 text-white'}`}>
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
                                    type="button"
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
        </div>,
        document.body
    );
};
