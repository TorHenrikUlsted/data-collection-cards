"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Icon } from '@iconify/react';
import { loadIcon, searchIconsets } from '@iconify/react';

// Icon sets to include - you can add more here
const ICON_SETS = [
  { prefix: 'fa6-solid', name: 'Font Awesome 6 Solid' },
  { prefix: 'bi', name: 'Bootstrap Icons' },
  { prefix: 'material-symbols', name: 'Material Symbols' },
  { prefix: 'mdi', name: 'Material Design Icons' },
  { prefix: 'tabler', name: 'Tabler Icons' }
];

// Categories to organize icons
const CATEGORIES = [
  { id: 'common', name: 'Common', keywords: ['home', 'user', 'settings', 'search', 'star', 'heart'] },
  { id: 'arrows', name: 'Arrows', keywords: ['arrow', 'chevron', 'caret', 'direction'] },
  { id: 'communication', name: 'Communication', keywords: ['message', 'chat', 'email', 'phone', 'mail'] },
  { id: 'devices', name: 'Devices', keywords: ['phone', 'mobile', 'computer', 'laptop', 'tablet'] },
  { id: 'animals', name: 'Animals', keywords: ['dog', 'cat', 'bird', 'fish', 'animal'] },
  { id: 'nature', name: 'Nature', keywords: ['tree', 'flower', 'leaf', 'sun', 'cloud', 'weather'] },
  { id: 'transport', name: 'Transport', keywords: ['car', 'truck', 'plane', 'bus', 'train', 'bicycle'] },
  { id: 'food', name: 'Food', keywords: ['food', 'drink', 'coffee', 'pizza', 'fruit'] },
  { id: 'sports', name: 'Sports', keywords: ['sport', 'football', 'basketball', 'tennis', 'golf'] },
  { id: 'ui', name: 'UI Elements', keywords: ['plus', 'minus', 'check', 'x', 'menu', 'dots'] },
  { id: 'social', name: 'Social', keywords: ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'] }
];

export default function IconPicker({ onSelectIcon, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('common');
  const [icons, setIcons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [iconsCache, setIconsCache] = useState({});
  const modalRef = useRef(null);
  
  // Function to load icons for a specific category or search term
  const loadIcons = useCallback(async (category, searchString = '') => {
    setLoading(true);
    
    try {
      const results = [];
      const cacheKey = searchString || category;
      
      // Check if we have cached results
      if (iconsCache[cacheKey]) {
        setIcons(iconsCache[cacheKey]);
        setLoading(false);
        return;
      }
      
      // Determine search terms based on category or direct search
      const searchTerms = searchString 
        ? [searchString] 
        : CATEGORIES.find(cat => cat.id === category)?.keywords || [];
        
      // Process each icon set
      for (const iconSet of ICON_SETS) {
        try {
          // Dynamic import of icon set metadata (not the full icon set)
          const iconSetData = await import(`@iconify-json/${iconSet.prefix}/icons.json`)
            .catch(() => ({ default: { icons: {} } }));
            
          const iconNames = Object.keys(iconSetData.default.icons || {});
          
          // Filter icons based on search terms
          const matchingIcons = iconNames.filter(name => {
            // For direct search, match the exact search string
            if (searchString) {
              return name.toLowerCase().includes(searchString.toLowerCase());
            }
            
            // For category search, match any of the category keywords
            return searchTerms.some(term => name.toLowerCase().includes(term.toLowerCase()));
          });
          
          // Prepare icon data
          matchingIcons.slice(0, 50).forEach(name => { // Limit to 50 icons per set for performance
            results.push({
              id: `${iconSet.prefix}:${name}`,
              name: name,
              provider: iconSet.name,
              category: CATEGORIES.find(cat => 
                cat.keywords.some(keyword => name.includes(keyword))
              )?.name || 'Other'
            });
          });
        } catch (error) {
          console.error(`Error loading icons from ${iconSet.prefix}:`, error);
        }
      }
      
      // Cache the results
      setIconsCache(prev => ({ ...prev, [cacheKey]: results }));
      setIcons(results);
    } catch (error) {
      console.error('Error loading icons:', error);
    } finally {
      setLoading(false);
    }
  }, [iconsCache]);
  
  // Initial load based on default category
  useEffect(() => {
    loadIcons(selectedCategory);
  }, [loadIcons, selectedCategory]);
  
  // Handle search
  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm) {
        loadIcons('', searchTerm);
      } else {
        loadIcons(selectedCategory);
      }
    }, 300);
    
    return () => clearTimeout(handler);
  }, [searchTerm, selectedCategory, loadIcons]);
  
  // Group icons by category
  const groupedIcons = icons.reduce((acc, icon) => {
    const category = icon.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(icon);
    return acc;
  }, {});
  
  // Handle click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div 
        ref={modalRef} 
        className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[80vh] flex flex-col"
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Select an Icon</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search icons..."
            className="w-full border rounded p-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {!searchTerm && (
          <div className="mb-4 flex flex-wrap gap-2">
            {CATEGORIES.map(category => (
              <button
                key={category.id}
                className={`px-3 py-1 rounded text-sm ${
                  selectedCategory === category.id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
        
        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">Loading icons...</div>
            </div>
          ) : icons.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-gray-500">No icons found. Try a different search or category.</div>
            </div>
          ) : (
            <>
              {Object.entries(groupedIcons).map(([category, categoryIcons]) => (
                <div key={category} className="mb-6">
                  <h3 className="text-lg font-medium mb-3">{category}</h3>
                  <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
                    {categoryIcons.map(icon => (
                      <button
                        key={icon.id}
                        className="p-2 border rounded hover:bg-blue-50 flex items-center justify-center h-12"
                        onClick={() => onSelectIcon(icon.id)}
                        title={icon.name}
                      >
                        <Icon icon={icon.id} width="24" height="24" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              
              {icons.length === 0 && (
                <p className="text-center text-gray-500 my-8">
                  No icons found matching your search.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}