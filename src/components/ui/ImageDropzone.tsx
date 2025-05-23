import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ImageIcon, Upload } from 'lucide-react';

interface ImageDropzoneProps {
  image: string | null;
  onImageChange: (imageUrl: string) => void;
  className?: string;
}

const ImageDropzone: React.FC<ImageDropzoneProps> = ({ image, onImageChange, className = '' }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImageChange(reader.result);
        }
      };
      
      reader.readAsDataURL(file);
    }
  }, [onImageChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024 // 5MB limit
  });

  return (
    <div 
      {...getRootProps()} 
      className={`h-full ${className} bg-[#1A1A1A] border-2 border-dashed border-[#333333] rounded-lg cursor-pointer transition-colors duration-150 ${
        isDragActive ? 'border-[#F8D74B] bg-[#262626]' : 'hover:border-gray-500'
      }`}
    >
      <input {...getInputProps()} />
      
      {image ? (
        <div className="w-full h-full flex items-center justify-center p-4">
          <img 
            src={image} 
            alt="Uploaded" 
            className="max-w-full max-h-full object-contain rounded"
            style={{ maxHeight: 'calc(100% - 2rem)' }}
          />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-full p-4 text-center">
          <div className="mb-2 p-2 rounded-full bg-[#333333]">
            {isDragActive ? (
              <Upload size={24} className="text-[#F8D74B]" />
            ) : (
              <ImageIcon size={24} className="text-gray-400" />
            )}
          </div>
          <p className="mb-1 text-sm font-medium text-gray-300">
            {isDragActive ? 'Drop image here' : 'Drop image here or click to upload'}
          </p>
          <p className="text-xs text-gray-500">Maximum size: 5MB</p>
          <p className="text-xs text-gray-500">Supported formats: JPG, PNG, WebP</p>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;