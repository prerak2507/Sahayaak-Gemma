'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImageCaptureProps {
  onImagesChange: (files: File[]) => void;
  maxImages?: number;
}

export function ImageCapture({ onImagesChange, maxImages = 3 }: ImageCaptureProps) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 🛡️ STABLE CALLBACK PATTERN:
  // We use a Ref to store the latest callback so the Effect doesn't re-run 
  // just because the parent re-rendered.
  const onImagesChangeRef = useRef(onImagesChange);
  useEffect(() => {
    onImagesChangeRef.current = onImagesChange;
  }, [onImagesChange]);

  useEffect(() => {
    onImagesChangeRef.current(images);
  }, [images]); // Only re-run when the actual IMAGES array changes

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      setIsCameraOpen(true);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = stream;
      }, 100);
    } catch (err) {
      toast.error('Camera access denied.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
          addFile(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(addFile);
  };

  const addFile = (file: File) => {
    setImages(prev => {
      if (prev.length >= maxImages) {
        toast.error(`Limit reached.`);
        return prev;
      }
      return [...prev, file];
    });
    
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviews(prev => [...prev, reader.result as string]);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {previews.map((preview, i) => (
          <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border-2 border-white shadow-md group">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <button onClick={() => removeImage(i)} className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full"><X size={12} /></button>
          </div>
        ))}
        {images.length < maxImages && !isCameraOpen && (
          <div className="flex gap-2 col-span-3 sm:col-span-1">
            <button onClick={startCamera} className="flex-1 aspect-square rounded-2xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 transition-all">
              <Camera size={24} />
              <span className="text-[9px] font-black mt-1">SNAP</span>
            </button>
            <label className="flex-1 aspect-square rounded-2xl bg-white border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-200 transition-all cursor-pointer">
              <Upload size={24} />
              <span className="text-[9px] font-black mt-1">FILE</span>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>
        )}
      </div>

      {isCameraOpen && (
        <div className="fixed inset-0 z-[2000] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-lg bg-black rounded-[3rem] overflow-hidden relative shadow-2xl border border-white/10 aspect-[3/4]">
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none">
              <div className="flex justify-between items-center">
                 <div className="px-3 py-1 bg-red-600 text-white text-[10px] font-black rounded-full animate-pulse uppercase tracking-widest">Live Feed</div>
                 <button onClick={stopCamera} className="p-3 bg-white/10 rounded-full pointer-events-auto text-white"><X size={20} /></button>
              </div>
              <div className="flex justify-center"><div className="w-16 h-16 border-2 border-white/30 rounded-full flex items-center justify-center"><div className="w-1 h-1 bg-white/50 rounded-full" /></div></div>
              <div className="flex justify-center pointer-events-auto pb-4">
                 <button onClick={capturePhoto} className="w-20 h-20 bg-white rounded-full border-[6px] border-white/30 shadow-2xl active:scale-90 transition-transform" />
              </div>
            </div>
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>
      )}
    </div>
  );
}
