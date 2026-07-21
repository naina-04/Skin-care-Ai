import React, { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from './ui/button';

export default function ImageUploader({ onAnalysisComplete }: { onAnalysisComplete: (data: any) => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
      setError(null);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5000/api/analyze', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze image.');
      }

      const data = await response.json();
      onAnalysisComplete(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to analyze image. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {!file ? (
        <div 
          className="group border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-16 text-center bg-slate-50/50 dark:bg-slate-900/50 hover:bg-green-50/50 dark:hover:bg-green-900/20 hover:border-green-300 dark:hover:border-green-700 transition-all duration-300 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-20 h-20 bg-white dark:bg-slate-800 shadow-sm rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:shadow-green-100 dark:group-hover:shadow-none">
            <Upload className="h-8 w-8 text-slate-400 dark:text-slate-500 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Click to select an image</h3>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Or drag and drop it here</p>
          <div className="flex justify-center gap-3 mb-8">
            <span className="px-4 py-1.5 bg-white dark:bg-slate-800 shadow-sm text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold tracking-wide">JPEG</span>
            <span className="px-4 py-1.5 bg-white dark:bg-slate-800 shadow-sm text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold tracking-wide">PNG</span>
            <span className="px-4 py-1.5 bg-white dark:bg-slate-800 shadow-sm text-slate-600 dark:text-slate-300 rounded-full text-xs font-semibold tracking-wide">WebP</span>
          </div>
          <Button type="button" variant="outline" className="px-8 h-12 rounded-xl font-semibold border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 group-hover:border-green-600 dark:group-hover:border-green-500 group-hover:text-green-700 dark:group-hover:text-green-400 group-hover:bg-green-50 dark:group-hover:bg-green-900/30 transition-colors">
            Browse Files
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/jpeg, image/png, image/webp"
          />
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center relative">
                {preview ? (
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-6 w-6 text-slate-400" />
                )}
              </div>
              <div>
                <h4 className="font-medium text-slate-900 truncate max-w-[200px] sm:max-w-[400px]">{file.name}</h4>
                <p className="text-sm text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <button onClick={handleClear} disabled={loading} className="p-2 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>

          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

          <Button 
            onClick={handleAnalyze} 
            disabled={loading} 
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-12 text-base font-medium"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyzing Image...
              </>
            ) : (
              'Analyze Skin'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
