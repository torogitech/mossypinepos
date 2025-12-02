import React, { useState, useEffect, useRef } from 'react';
import { X, Scan, CheckCircle2, Zap, ZapOff, ZoomIn, ZoomOut, AlertTriangle, Settings } from 'lucide-react';
import { Product } from '../types';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

interface ScannerProps {
  onClose: () => void;
  onScan: (code: string) => void;
  products: Product[];
  continuous?: boolean;
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

export const Scanner: React.FC<ScannerProps> = ({ onClose, onScan, products, continuous = false }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scanStatus, setScanStatus] = useState<'SEARCHING' | 'DETECTED' | 'ERROR' | 'PERMISSION_DENIED'>('SEARCHING');
    const [torchOn, setTorchOn] = useState(false);
    const [hasNativeSupport, setHasNativeSupport] = useState(false);
    const [track, setTrack] = useState<MediaStreamTrack | null>(null);
    const [zoom, setZoom] = useState(1);
    const [capabilities, setCapabilities] = useState<any>(null);
    const [statusMessage, setStatusMessage] = useState<string>("Align barcode within frame");
    const [flash, setFlash] = useState(false);

    useEffect(() => {
        let stream: MediaStream | null = null;
        let intervalId: any = null;
        let detector: any = null;

        const hasSupport = 'BarcodeDetector' in window;
        setHasNativeSupport(hasSupport);
        
        if (!hasSupport) {
            setStatusMessage("Tap screen to simulate scan (Demo Mode)");
        }

        const initCamera = async () => {
            try {
                // Check Capacitor Permissions first
                if (Capacitor.isNativePlatform()) {
                    const permissions = await Camera.checkPermissions();
                    if (permissions.camera !== 'granted') {
                        const permissionRequest = await Camera.requestPermissions({ permissions: ['camera'] });
                        if (permissionRequest.camera !== 'granted') {
                            setScanStatus('PERMISSION_DENIED');
                            setStatusMessage("Camera permission is required");
                            return;
                        }
                    }
                }

                // Request camera with preference for back camera and high resolution
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
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play().catch(e => console.log("Play error", e));
                    };
                }

                const videoTrack = stream.getVideoTracks()[0];
                setTrack(videoTrack);

                // Get Capabilities for Zoom/Torch
                const caps = videoTrack.getCapabilities() as any;
                setCapabilities(caps);
                if (caps.zoom) {
                    setZoom(caps.zoom.min || 1);
                }

                // Initialize Barcode Detector
                if (hasSupport) {
                    try {
                        detector = new (window as any).BarcodeDetector({
                            formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'qr_code', 'code_128', 'code_39', 'itf']
                        });
                    } catch (e) {
                        console.warn("BarcodeDetector initialization failed", e);
                        setHasNativeSupport(false);
                        setStatusMessage("Tap screen to simulate scan");
                    }

                    if (detector) {
                        intervalId = setInterval(async () => {
                            if (videoRef.current && videoRef.current.readyState === 4 && scanStatus === 'SEARCHING') {
                                try {
                                    const barcodes = await detector.detect(videoRef.current);
                                    if (barcodes.length > 0) {
                                        handleSuccess(barcodes[0].rawValue);
                                    }
                                } catch (e) {
                                    // Ignore frame detection errors
                                }
                            }
                        }, 100); 
                    }
                }

            } catch (err: any) {
                console.error("Camera Init Error:", err);
                if (err.name === 'NotAllowedError' || err.message?.includes('Permission denied')) {
                     setScanStatus('PERMISSION_DENIED');
                     setStatusMessage("Camera permission denied");
                } else {
                     setScanStatus('ERROR');
                     setStatusMessage("Camera access failed");
                }
            }
        };

        if (scanStatus === 'SEARCHING' || scanStatus === 'ERROR') {
             initCamera();
        }

        return () => {
            if (intervalId) clearInterval(intervalId);
            if (stream) stream.getTracks().forEach(t => t.stop());
        };
    }, [scanStatus]);

    const handleSuccess = (code: string) => {
        if (scanStatus === 'DETECTED') return;
        
        setScanStatus('DETECTED');
        setFlash(true); // Visual flash
        playScanSound(); // Audio feedback
        
        if (navigator.vibrate) navigator.vibrate([50, 50, 50]); // Haptic feedback
        
        const existing = products.find(p => p.barcode === code);
        setStatusMessage(existing ? `Found: ${existing.name}` : `Scanned: ${code}`);
        
        onScan(code);
        
        setTimeout(() => setFlash(false), 300);
        
        if (!continuous) {
            setTimeout(() => {
                onClose();
            }, 1200);
        } else {
            // In continuous mode, reset after 2 seconds
            setTimeout(() => {
                setScanStatus('SEARCHING');
                setStatusMessage("Ready for next item...");
            }, 2000);
        }
    };

    const handleSimulatedClick = () => {
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
                console.log("Torch error", e);
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
    
    const handleRequestPermission = async () => {
        try {
            await Camera.requestPermissions({ permissions: ['camera'] });
            setScanStatus('SEARCHING'); // Retry
        } catch (e) {
            // If native request fails, user might need to go to settings manually
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[60] flex flex-col" onClick={handleSimulatedClick}>
            
            {/* Camera View */}
            <div className="relative flex-1 bg-black overflow-hidden">
                {scanStatus === 'PERMISSION_DENIED' ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                         <div className="bg-red-500/10 p-6 rounded-full mb-6">
                            <AlertTriangle size={48} className="text-red-500" />
                         </div>
                         <h3 className="text-white font-bold text-xl mb-2">Camera Access Needed</h3>
                         <p className="text-white/60 mb-8 max-w-xs">We need camera access to scan barcodes. Please allow access in your settings.</p>
                         <button 
                            onClick={handleRequestPermission}
                            className="bg-[#4A6741] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#3A5232] transition-colors"
                         >
                            <Settings size={18} />
                            Allow Camera
                         </button>
                     </div>
                ) : (
                    <>
                        <video 
                        ref={videoRef} 
                        muted 
                        playsInline 
                        className="absolute inset-0 w-full h-full object-cover" 
                        />
                        
                        {/* Visual Flash Overlay */}
                        <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-300 ${flash ? 'opacity-80' : 'opacity-0'}`} />

                        {/* Dark Backdrop with Cutout Effect */}
                        <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-0 bg-black/50">
                                {/* The Cutout - Centered */}
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-56 bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] rounded-3xl overflow-hidden">
                                    {/* Corner Markers */}
                                    <div className={`absolute top-0 left-0 w-8 h-8 border-t-[6px] border-l-[6px] rounded-tl-xl -mt-1 -ml-1 transition-colors ${scanStatus === 'DETECTED' ? 'border-emerald-500' : 'border-white'}`}></div>
                                    <div className={`absolute top-0 right-0 w-8 h-8 border-t-[6px] border-r-[6px] rounded-tr-xl -mt-1 -mr-1 transition-colors ${scanStatus === 'DETECTED' ? 'border-emerald-500' : 'border-white'}`}></div>
                                    <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-[6px] border-l-[6px] rounded-bl-xl -mb-1 -ml-1 transition-colors ${scanStatus === 'DETECTED' ? 'border-emerald-500' : 'border-white'}`}></div>
                                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-[6px] border-r-[6px] rounded-br-xl -mb-1 -mr-1 transition-colors ${scanStatus === 'DETECTED' ? 'border-emerald-500' : 'border-white'}`}></div>

                                    {/* Laser Animation */}
                                    {scanStatus === 'SEARCHING' && (
                                        <div 
                                            className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent shadow-[0_0_15px_rgba(239,68,68,0.8)]"
                                            style={{ animation: 'scan 2s infinite linear' }}
                                        ></div>
                                    )}

                                    {/* Success Indicator */}
                                    {scanStatus === 'DETECTED' && (
                                        <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in duration-300 bg-black/20 backdrop-blur-sm">
                                            <div className="bg-emerald-500 text-white p-4 rounded-full shadow-lg">
                                                <CheckCircle2 size={40} />
                                            </div>
                                        </div>
                                    )}
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
                <div className="absolute bottom-0 left-0 right-0 pb-10 pt-20 px-6 flex flex-col items-center gap-6 z-20 bg-gradient-to-t from-black/90 to-transparent pointer-events-none">
                    
                    {/* Status Pill */}
                    <div className={`px-6 py-2.5 rounded-full backdrop-blur-xl border font-medium text-sm shadow-lg transition-colors ${
                        scanStatus === 'ERROR' || scanStatus === 'PERMISSION_DENIED'
                            ? 'bg-red-500/20 border-red-500/50 text-red-200' 
                            : scanStatus === 'DETECTED' 
                                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-200' 
                                : 'bg-white/10 border-white/10 text-white'
                    }`}>
                        {statusMessage}
                    </div>

                    <div className="flex items-center gap-4 pointer-events-auto">
                        {/* Zoom Control */}
                        {capabilities?.zoom && scanStatus !== 'PERMISSION_DENIED' && (
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
                                <ZoomOut size={16} className="text-white/70" />
                                <input 
                                type="range" 
                                min={capabilities.zoom.min} 
                                max={capabilities.zoom.max} 
                                step={0.1}
                                value={zoom}
                                onChange={handleZoom}
                                className="w-24 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                                />
                                <ZoomIn size={16} className="text-white/70" />
                            </div>
                        )}

                        {/* Torch Button */}
                        {capabilities?.torch && scanStatus !== 'PERMISSION_DENIED' && (
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
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};