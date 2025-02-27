"use client";

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { FaPlus, FaTrash, FaSave, FaFileExport, FaFileImage } from 'react-icons/fa';
import IconPicker from './components/IconPicker';
import { Icon } from '@iconify/react';


// Define the default card and collections
const defaultCard = {
  id: uuidv4(),
  iconType: 'text',
  icon: '?',
  question: 'New Question',
  options: [
    { id: uuidv4(), color: '#4285F4', text: 'Option 1', tally: '' },
    { id: uuidv4(), color: '#EA4335', text: 'Option 2', tally: '' },
    { id: uuidv4(), color: '#FBBC05', text: 'Option 3', tally: '' },
  ]
};

export default function Home() {
  const [collections, setCollections] = useState([]);
  const [activeCollection, setActiveCollection] = useState(null);
  const [cards, setCards] = useState([]);
  const [activeCard, setActiveCard] = useState(null);
  const [showNewCollectionModal, setShowNewCollectionModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [imageUploadKey, setImageUploadKey] = useState(0);
  const [showIconPicker, setShowIconPicker] = useState(false);

  // Load collections from localStorage on component mount
  useEffect(() => {
    const savedCollections = localStorage.getItem('cardCollections');
    if (savedCollections) {
      try {
        setCollections(JSON.parse(savedCollections));
      } catch (e) {
        console.error('Failed to parse saved collections', e);
      }
    }
  }, []);

  // Save collections to localStorage when they change
  useEffect(() => {
    if (collections.length > 0) {
      localStorage.setItem('cardCollections', JSON.stringify(collections));
    }
  }, [collections]);

  // Load cards when active collection changes
  useEffect(() => {
    if (activeCollection) {
      const collectionData = collections.find(c => c.id === activeCollection);
      if (collectionData) {
        setCards(collectionData.cards || []);
      }
    } else {
      setCards([]);
    }
  }, [activeCollection, collections]);

  // Create a new collection
  const createCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection = {
      id: uuidv4(),
      name: newCollectionName,
      cards: []
    };

    setCollections([...collections, newCollection]);
    setActiveCollection(newCollection.id);
    setShowNewCollectionModal(false);
    setNewCollectionName('');
  };

  // Add a new card to the active collection
  const addCard = () => {
    if (!activeCollection) return;

    const newCard = { ...defaultCard, id: uuidv4() };
    const updatedCards = [...cards, newCard];

    // Update the cards state
    setCards(updatedCards);

    // Update the collection
    const updatedCollections = collections.map(collection =>
      collection.id === activeCollection
        ? { ...collection, cards: updatedCards }
        : collection
    );
    setCollections(updatedCollections);
    setActiveCard(newCard.id);
  };

  // Update a card
  const updateCard = (updatedCard) => {
    const updatedCards = cards.map(card =>
      card.id === updatedCard.id ? updatedCard : card
    );

    // Update the cards state
    setCards(updatedCards);

    // Update the collection
    const updatedCollections = collections.map(collection =>
      collection.id === activeCollection
        ? { ...collection, cards: updatedCards }
        : collection
    );
    setCollections(updatedCollections);
  };

  // Delete a card
  const deleteCard = (cardId) => {
    const updatedCards = cards.filter(card => card.id !== cardId);

    // Update the cards state
    setCards(updatedCards);

    // Update the collection
    const updatedCollections = collections.map(collection =>
      collection.id === activeCollection
        ? { ...collection, cards: updatedCards }
        : collection
    );
    setCollections(updatedCollections);

    if (activeCard === cardId) {
      setActiveCard(updatedCards.length > 0 ? updatedCards[0].id : null);
    }
  };

  // Add a new option to a card
  const addOptionToCard = (cardId) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate) return;

    const colors = ['#4285F4', '#EA4335', '#FBBC05', '#34A853', '#9C27B0', '#00ACC1', '#FF9800'];
    const colorIndex = cardToUpdate.options.length % colors.length;

    const updatedCard = {
      ...cardToUpdate,
      options: [
        ...cardToUpdate.options,
        {
          id: uuidv4(),
          color: colors[colorIndex],
          text: `Option ${cardToUpdate.options.length + 1}`,
          tally: ''
        }
      ]
    };

    updateCard(updatedCard);
  };

  // Delete an option from a card
  const deleteOptionFromCard = (cardId, optionId) => {
    const cardToUpdate = cards.find(card => card.id === cardId);
    if (!cardToUpdate || cardToUpdate.options.length <= 1) return;

    const updatedCard = {
      ...cardToUpdate,
      options: cardToUpdate.options.filter(option => option.id !== optionId)
    };

    updateCard(updatedCard);
  };

  // Handle image upload
  const handleImageUpload = (cardId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const cardToUpdate = cards.find(card => card.id === cardId);
      if (!cardToUpdate) return;

      const updatedCard = {
        ...cardToUpdate,
        iconType: 'image',
        icon: event.target.result
      };

      updateCard(updatedCard);

      // Reset the file input
      setImageUploadKey(prev => prev + 1);
    };

    reader.readAsDataURL(file);
  };

  // Export collection to PDF
  const exportToPDF = async () => {
    if (!activeCollection || cards.length === 0) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      const pdf = new jsPDF('p', 'mm', 'a4');
      const cardsPerPage = 4;
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const cardWidth = pageWidth / 2;
      const cardHeight = pageHeight / 2;

      // Process cards sequentially
      for (let i = 0; i < cards.length; i++) {
        const cardElement = document.getElementById(`card-print-${cards[i].id}`);
        if (!cardElement) continue;

        // Wait for any images to load
        await new Promise(resolve => setTimeout(resolve, 100));

        // Render with lower scale but higher quality settings
        const canvas = await html2canvas(cardElement, {
          scale: 1,
          useCORS: true,
          allowTaint: true,
          logging: false,
          imageTimeout: 0,
          backgroundColor: null
        });

        // Convert to PNG with maximum quality
        const imgData = canvas.toDataURL('image/jpeg', 0.95);

        // Calculate position
        const pageIndex = Math.floor(i / cardsPerPage);
        const positionOnPage = i % cardsPerPage;
        const xPosition = (positionOnPage % 2) * cardWidth;
        const yPosition = Math.floor(positionOnPage / 2) * cardHeight;

        // Add new page if needed
        if (positionOnPage === 0 && i > 0) {
          pdf.addPage();
        }

        // Add image with compression disabled
        pdf.addImage(imgData, 'JPEG', xPosition, yPosition, cardWidth, cardHeight);
      }

      // Get collection name and save
      const collectionData = collections.find(c => c.id === activeCollection);
      const fileName = collectionData ? `${collectionData.name.replace(/\s+/g, '_')}_cards.pdf` : 'data_collection_cards.pdf';
      pdf.save(fileName);

    } catch (error) {
      console.error('Failed to export to PDF:', error);
      alert('Failed to export to PDF. Please try again.');
    }
  };

  // Get the active card
  const currentCard = activeCard ? cards.find(card => card.id === activeCard) : null;

  return (
    <div className="min-h-screen bg-gray-100">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Data Collection Card Creator</h1>

        {/* Top bar with collections and actions */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <label className="font-semibold">Collection:</label>
            <select
              className="border rounded p-2"
              value={activeCollection || ''}
              onChange={(e) => setActiveCollection(e.target.value)}
            >
              <option value="">Select a collection</option>
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <button
              className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center"
              onClick={() => setShowNewCollectionModal(true)}
            >
              <FaPlus className="mr-1" /> New
            </button>
          </div>

          <div className="flex items-center space-x-4">
            <button
              className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded flex items-center"
              onClick={() => {window.location.href = './export';}}
              
            >
              <FaFileExport className="mr-1" /> Export Cards
            </button>
          </div>
        </div>

        {/* Main content area */}
        <div className="flex flex-col md:flex-row space-y-6 md:space-y-0 md:space-x-6">
          {/* Card list sidebar */}
          <div className="w-full md:w-1/4 bg-white rounded-lg shadow-md p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Cards</h2>
              {activeCollection && (
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded"
                  onClick={addCard}
                >
                  <FaPlus />
                </button>
              )}
            </div>

            {!activeCollection ? (
              <p className="text-gray-500 text-center py-4">Select or create a collection first</p>
            ) : cards.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No cards yet. Click + to add a card.</p>
            ) : (
              <ul className="space-y-2">
                {cards.map(card => (
                  <li
                    key={card.id}
                    className={`p-2 rounded cursor-pointer flex justify-between items-center ${activeCard === card.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
                    onClick={() => setActiveCard(card.id)}
                  >
                    <div className="truncate">{card.question}</div>
                    <button
                      className="text-red-500 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteCard(card.id);
                      }}
                    >
                      <FaTrash />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Card editor */}
          <div className="w-full md:w-3/4 bg-white rounded-lg shadow-md p-4">
            {!activeCard ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">Select or create a card to edit</p>
                {activeCollection && (
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded flex items-center mx-auto"
                    onClick={addCard}
                  >
                    <FaPlus className="mr-2" /> Add Card
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card editor form */}
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold">Edit Card</h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Question Text
                    </label>
                    <input
                      type="text"
                      className="w-full border rounded p-2"
                      value={currentCard?.question || ''}
                      onChange={(e) => updateCard({ ...currentCard, question: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Icon Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={currentCard?.iconType === 'text'}
                          onChange={() => updateCard({ ...currentCard, iconType: 'text' })}
                          className="mr-2"
                        />
                        Text
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={currentCard?.iconType === 'image'}
                          onChange={() => updateCard({ ...currentCard, iconType: 'image' })}
                          className="mr-2"
                        />
                        Image
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          checked={currentCard?.iconType === 'icon'}
                          onChange={() => updateCard({ ...currentCard, iconType: 'icon' })}
                          className="mr-2"
                        />
                        Icon
                      </label>
                    </div>
                  </div>

                  {currentCard?.iconType === 'icon' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Select Icon
                      </label>
                      <div className="flex items-center space-x-2">
                        {currentCard?.icon ? (
                          <div className="border rounded p-2 bg-gray-100 flex items-center justify-center h-12 w-12">
                            <Icon icon={currentCard.icon} width="32" height="32" />
                          </div>
                        ) : (
                          <div className="border rounded p-2 bg-gray-100 flex items-center justify-center h-12 w-12 text-gray-400">
                            No icon
                          </div>
                        )}
                        <button
                          className="px-3 py-1 border rounded hover:bg-gray-100"
                          onClick={() => setShowIconPicker(true)}
                        >
                          Change Icon
                        </button>
                      </div>
                    </div>
                  )}

                  {currentCard?.iconType === 'text' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Text Icon
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        value={currentCard?.icon || ''}
                        onChange={(e) => updateCard({ ...currentCard, icon: e.target.value })}
                        maxLength={2}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Use 1-2 characters for best results
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image Icon
                      </label>
                      {currentCard?.icon && currentCard.iconType === 'image' && (
                        <div className="mb-2">
                          <img
                            src={currentCard.icon}
                            alt="Card icon"
                            className="h-16 w-16 object-contain border rounded"
                          />
                        </div>
                      )}
                      <input
                        key={imageUploadKey}
                        type="file"
                        accept="image/*"
                        className="w-full border rounded p-2"
                        onChange={(e) => handleImageUpload(currentCard.id, e)}
                      />
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Answer Options
                      </label>
                      <button
                        className="text-blue-500 hover:text-blue-600 text-sm flex items-center"
                        onClick={() => addOptionToCard(currentCard.id)}
                      >
                        <FaPlus className="mr-1" /> Add Option
                      </button>
                    </div>

                    <div className="space-y-3">
                      {currentCard?.options.map((option, index) => (
                        <div key={option.id} className="flex items-center space-x-2">
                          <div
                            className="w-6 h-6 rounded-full flex-shrink-0"
                            style={{ backgroundColor: option.color }}
                          />
                          <input
                            type="text"
                            className="flex-grow border rounded p-1 text-sm"
                            value={option.text}
                            onChange={(e) => {
                              const updatedOptions = [...currentCard.options];
                              updatedOptions[index] = { ...option, text: e.target.value };
                              updateCard({ ...currentCard, options: updatedOptions });
                            }}
                            placeholder="Option text"
                          />
                          <input
                            type="color"
                            value={option.color}
                            onChange={(e) => {
                              const updatedOptions = [...currentCard.options];
                              updatedOptions[index] = { ...option, color: e.target.value };
                              updateCard({ ...currentCard, options: updatedOptions });
                            }}
                            className="w-8 h-8 border-0 rounded p-0"
                          />
                          <button
                            className="text-red-500 hover:text-red-600 p-1"
                            onClick={() => deleteOptionFromCard(currentCard.id, option.id)}
                            disabled={currentCard.options.length <= 1}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Card preview */}
                <div>
                  <h2 className="text-xl font-semibold mb-4">Card Preview</h2>

                  <div className="border-2 border-gray-300 rounded-lg p-4 w-full max-w-xs mx-auto aspect-[3/4]">
                    {/* Card preview content */}
                    <div className="h-full flex flex-col">
                      {/* Collection name at the top of each card */}
                      <div className="text-center mb-2">
                        <h4 className="text-sm font-medium text-gray-500">
                          {collections.find(c => c.id === activeCollection)?.name}
                        </h4>
                      </div>
                      
                      {/* Icon area */}
                      <div className="flex justify-center items-center mb-4 h-1/3">
                        {currentCard?.iconType === 'text' ? (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
                            {currentCard?.icon || '?'}
                          </div>
                        ) : currentCard?.iconType === 'icon' ? (
                          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
                            {currentCard?.icon && <Icon icon={currentCard.icon} width="32" height="32" />}
                          </div>
                        ) : (
                          <div className="w-24 h-24 flex items-center justify-center">
                            {currentCard?.icon ? (
                              <div
                                className="w-full h-full bg-contain bg-center bg-no-repeat"
                                style={{
                                  backgroundImage: `url(${currentCard.icon})`,
                                  backgroundColor: '#ffffff'
                                }}
                              />
                            ) : (
                              <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                <FaFileImage size={24} />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Question area */}
                      <div className="text-center mb-4">
                        <h3 className="text-lg font-semibold">{currentCard?.question || 'Question'}</h3>
                      </div>

                      {/* Options area */}
                      <div className="space-y-3 flex-grow">
                        {currentCard?.options.map(option => (
                          <div key={option.id} className="flex items-center space-x-3">
                            <div
                              className="w-6 h-6 rounded-full flex-shrink-0"
                              style={{ backgroundColor: option.color }}
                            />
                            <div className="flex-grow">{option.text}</div>
                            <div className="w-20 h-6 border border-gray-300 rounded text-xs text-gray-400 flex items-center justify-center">
                              Tally area
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Hidden print area for PDF export */}
        <div className="hidden">
          {cards.map(card => (
            <div
              key={card.id}
              id={`card-print-${card.id}`}
              className="border border-gray-300 rounded-lg p-4"
              style={{
                width: '105mm',
                height: '148mm',
                backgroundColor: '#ffffff'
              }}
            >
              {/* Card content for printing */}
              <div className="p-4 h-full flex flex-col">
                {/* Collection name at the top of each card */}
                <div className="text-center mb-2">
                  <h4 className="text-sm font-medium text-gray-500">
                    {collections.find(c => c.id === activeCollection)?.name}
                  </h4>
                </div>
                
                {/* Icon area */}
                <div className="flex justify-center items-center mb-4 h-1/3">
                  {card.iconType === 'text' ? (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold">
                      {card.icon || '?'}
                    </div>
                  ) : card.iconType === 'icon' ? (
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-2xl">
                      ★
                    </div>
                  ) : (
                    <div className="w-24 h-24 flex items-center justify-center">
                      {card.icon ? (
                        <img
                          src={card.icon}
                          alt="Card icon"
                          className="max-h-full max-w-full object-contain"
                          style={{ backgroundColor: '#ffffff' }}
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gray-200"></div>
                      )}
                    </div>
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
                        style={{ backgroundColor: option.color }}
                      />
                      <div className="flex-grow">{option.text}</div>
                      <div className="w-20 h-6 border border-gray-300 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* New Collection Modal */}
        {showNewCollectionModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-semibold mb-4">Create New Collection</h2>
              <input
                type="text"
                className="w-full border rounded p-2 mb-4"
                placeholder="Collection Name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
              />
              <div className="flex justify-end space-x-2">
                <button
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                  onClick={() => {
                    setShowNewCollectionModal(false);
                    setNewCollectionName('');
                  }}
                >
                  Cancel
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={createCollection}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {showIconPicker && (
        <IconPicker
          onSelectIcon={(iconId) => {
            updateCard({ ...currentCard, icon: iconId });
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}
    </div>

  );
}