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
    maxFiles: 1
  });

  return (
    <div 
      {...getRootProps()} 
      className={`${className} bg-[#1A1A1A] border-2 border-dashed border-[#333333] rounded-lg cursor-pointer transition-colors duration-150 ${
        isDragActive ? 'border-[#F8D74B] bg-[#262626]' : 'hover:border-gray-500'
      }`}
    >
      <input {...getInputProps()} />
      
      {image ? (
        <div className="w-full h-full flex items-center justify-center p-2">
          <img 
            src={image} 
            alt="Uploaded" 
            className="max-w-full max-h-full object-contain rounded"
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
            {isDragActive ? 'Drop image here' : 'Paste/drop image here'}
          </p>
          <p className="text-xs text-gray-500 mb-3">OR</p>
          <button className="px-4 py-2 bg-[#333333] hover:bg-[#444444] rounded text-sm text-white transition-colors duration-150">
            Choose file
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;