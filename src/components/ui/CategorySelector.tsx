import React from 'react';

interface Category {
  id: string;
  label: string;
  icon: React.ReactNode;
}

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategory,
  onCategoryChange
}) => {
  return (
    <div className="grid grid-cols-3 gap-2">
      {categories.map((category) => (
        <button
          key={category.id}
          onClick={() => onCategoryChange(category.id)}
          className={`py-3 px-2 rounded flex flex-col items-center justify-center transition-colors duration-150 ${
            selectedCategory === category.id
              ? 'bg-[#F8D74B] text-black'
              : 'bg-[#333333] text-gray-300 hover:bg-[#444444]'
          }`}
        >
          <span className="mb-1">{category.icon}</span>
          <span className="text-xs font-medium">{category.label}</span>
        </button>
      ))}
    </div>
  );
};

export default CategorySelector;