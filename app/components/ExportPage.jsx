"use client";

import React, { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import { useRouter } from 'next/navigation';

export default function ExportPage() {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [cards, setCards] = useState([]);
  const router = useRouter();
  
  // Load collections from localStorage on component mount
  useEffect(() => {
    const savedCollections = localStorage.getItem('cardCollections');
    if (savedCollections) {
      try {
        const parsedCollections = JSON.parse(savedCollections);
        setCollections(parsedCollections);
        
        // If there's only one collection, select it automatically
        if (parsedCollections.length === 1) {
          setSelectedCollection(parsedCollections[0].id);
          setCards(parsedCollections[0].cards || []);
        }
      } catch (e) {
        console.error('Failed to parse saved collections', e);
      }
    }
  }, []);
  
  // Update cards when selected collection changes
  useEffect(() => {
    if (selectedCollection) {
      const collection = collections.find(c => c.id === selectedCollection);
      if (collection) {
        setCards(collection.cards || []);
      }
    }
  }, [selectedCollection, collections]);
  
  // Handle collection change
  const handleCollectionChange = (e) => {
    const collectionId = e.target.value;
    setSelectedCollection(collectionId);
  };
  
  // Handle print action
  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 500);
  };
  
  // Go back to main app
  const handleBack = () => {
    router.push('/');
  };
  
  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Header/Controls (hidden during print) */}
      <div className="print:hidden bg-white p-4 shadow-md mb-8">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">Data Collection Card Export</h1>
            
            <div className="flex items-center gap-4">
              <select
                className="border rounded p-2"
                value={selectedCollection || ''}
                onChange={handleCollectionChange}
              >
                <option value="">Select a collection</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
              
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleBack}
              >
                Back to Editor
              </button>
              
              <button
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded flex items-center gap-2"
                onClick={handlePrint}
                disabled={!selectedCollection || cards.length === 0}
              >
                <span>Print Cards</span>
              </button>
            </div>
          </div>
          
          <div className="mt-4 bg-yellow-50 border border-yellow-200 p-3 rounded">
            <p className="text-yellow-800">
              <strong>Print tip:</strong> For best results, enable "Background Colors and Images" in your browser's print dialog.
              This ensures all colors and design elements print correctly.
            </p>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="container mx-auto px-2 mb-8">
        {!selectedCollection || cards.length === 0 ? (
          <div className="print:hidden bg-white rounded-lg p-8 text-center">
            <h2 className="text-xl mb-4">No cards to display</h2>
            <p className="text-gray-600 mb-4">
              Please select a collection with cards to export.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:grid-cols-2 print:gap-1">
            {cards.map(card => (
              <div
                key={card.id}
                className="h-full bg-white rounded-lg shadow-md overflow-hidden print:shadow-none print:border-2 print:border-gray-300 print:rounded"
                style={{ 
                  pageBreakInside: 'avoid',
                  maxHeight: '400px'
                }}
              >
                <div className="p-4 h-full flex flex-col">
                  {/* Collection name at the top of each card */}
                  <div className="text-center mb-2">
                    <h4 className="text-sm font-medium text-gray-500">
                      {collections.find(c => c.id === selectedCollection)?.name}
                    </h4>
                  </div>
                  
                  {/* Icon area */}
                  <div className="flex justify-center items-center mb-4 h-1/3">
                    {card.iconType === 'text' ? (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold print:bg-gray-200 print:border-2 print:border-gray-400"
                           style={{ 
                             /* Fallback for print without backgrounds */
                             border: '2px solid #9ca3af'
                           }}>
                        {card.icon || '?'}
                      </div>
                    ) : card.iconType === 'icon' && card.icon ? (
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center print:bg-gray-200 print:border-2 print:border-gray-400"
                           style={{ 
                             /* Fallback for print without backgrounds */
                             border: '2px solid #9ca3af'
                           }}>
                        <Icon icon={card.icon} width="32" height="32" />
                      </div>
                    ) : card.iconType === 'image' && card.icon ? (
                      <div className="w-24 h-24 flex items-center justify-center print:border print:border-gray-300 print:rounded-lg"
                           style={{
                             border: '1px solid #e5e7eb',
                             borderRadius: '0.5rem'
                           }}>
                        <img 
                          src={card.icon} 
                          alt="Card icon" 
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 print:bg-gray-200 print:border-2 print:border-gray-400"
                           style={{ 
                             /* Fallback for print without backgrounds */
                             border: '2px solid #9ca3af'
                           }}></div>
                    )}
                  </div>
                  
                  {/* Question area */}
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold">{card.question || 'Question'}</h3>
                  </div>
                  
                  {/* Options area */}
                  <div className="space-y-3 flex-grow">
                    {card.options.map(option => (
                      <div key={option.id} className="flex items-center space-x-3">
                        <div
                          className="w-6 h-6 rounded-full flex-shrink-0"
                          style={{ 
                            backgroundColor: option.color,
                            border: `2px solid ${option.color}`, // Add border in the same color
                            boxShadow: '0 0 0 1px rgba(0,0,0,0.1)' // Add subtle shadow for definition
                          }}
                        ></div>
                        <div className="flex-grow">{option.text}</div>
                        <div className="w-20 h-6 border border-gray-300 rounded print:border print:border-gray-400"
                             style={{ border: '1px solid #9ca3af' }}></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Print-only page info */}
      <div className="hidden print:block text-center text-xs text-gray-500 mt-4">
        {selectedCollection && (
          <p>
            {collections.find(c => c.id === selectedCollection)?.name} - 
            Printed on {new Date().toLocaleDateString()}
          </p>
        )}
      </div>
      
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          /* Force background colors and images in print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .print\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
          .print\\:gap-1 {
            gap: 0.25rem;
          }
          .print\\:shadow-none {
            box-shadow: none;
          }
          .print\\:border-2 {
            border-width: 2px !important;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db !important;
          }
          .print\\:border-gray-400 {
            border-color: #9ca3af !important;
          }
          .print\\:rounded {
            border-radius: 0.375rem;
          }
          .print\\:hidden {
            display: none;
          }
          .print\\:bg-gray-200 {
            background-color: #e5e7eb !important;
          }
          .print\\:bg-white {
            background-color: white !important;
          }
        }
      `}</style>
    </div>
  );
}