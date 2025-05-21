interface GenerationParams {
  modelImage: string;
  garmentImage: string;
  category: string;
  mode: string;
  samples: number;
  seed: number;
}

interface GenerationResult {
  id: string;
  resultImageUrl: string;
}

// Mock API function to simulate the fashion try-on process
export const simulateAPICall = async (params: GenerationParams): Promise<GenerationResult> => {
  console.log('API request with params:', params);
  
  // Simulating a delay for the API call
  return new Promise((resolve) => {
    setTimeout(() => {
      // For demo purposes, just return the garment image as the result
      // In a real app, this would be the AI-generated image from the backend
      resolve({
        id: `gen-${Math.random().toString(36).substring(2, 9)}`,
        resultImageUrl: params.garmentImage || 'https://via.placeholder.com/400x600/333/fff?text=Result'
      });
    }, 6000); // Simulate ~6 seconds processing time
  });
};

// Mock function to simulate polling for status
export const pollGenerationStatus = async (id: string): Promise<{ status: string; progress: number }> => {
  // In a real app, this would check the status of the generation process
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        status: 'completed',
        progress: 100
      });
    }, 1000);
  });
};