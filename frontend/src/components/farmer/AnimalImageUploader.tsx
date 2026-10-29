import React, { useState, useRef, useEffect } from 'react';
import { Upload, Camera, X, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface AnimalImageUploaderProps {
  selectedFile?: File | null;
  onFileSelect?: (file: File | null) => void;
  onImageSelected?: (file: File) => void;
  onImageRemoved?: () => void;
}

export const AnimalImageUploader: React.FC<AnimalImageUploaderProps> = ({ 
  selectedFile, 
  onFileSelect,
  onImageSelected,
  onImageRemoved
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [selectedFile]);

  const handleFile = (file: File) => {
    setErrorMsg(null);
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setErrorMsg('Invalid file format. Please upload a standard photo (JPG, PNG, or WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMsg('Image size exceeds 15 MB. Please select a smaller photo.');
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    if (onFileSelect) onFileSelect(file);
    if (onImageSelected) onImageSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setErrorMsg(null);
    if (onFileSelect) onFileSelect(null);
    if (onImageRemoved) onImageRemoved();
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-3">
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {previewUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 group shadow-sm">
          <img
            src={previewUrl}
            alt="Uploaded animal preview"
            className="w-full h-64 object-contain mx-auto bg-slate-950/60"
          />
          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              Replace Photo
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Remove
            </button>
          </div>
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-lg text-slate-900 text-[11px] font-semibold flex items-center gap-1.5 border border-slate-200 shadow-sm">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Image Attached</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50/60 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 hover:bg-blue-50/30 bg-slate-50/50'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <Upload className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Drag and drop animal photograph here</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
            Take a clear photo of skin, muzzle, lesions, or posture for AI screening.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3 text-xs">
            <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-white text-slate-700 font-semibold border border-slate-200 shadow-sm">
              <Camera className="w-3.5 h-3.5 mr-1 text-blue-600" /> Camera / File
            </span>
            <span className="text-slate-400 text-[11px]">JPG, PNG, WEBP up to 15MB</span>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
};

export default AnimalImageUploader;
