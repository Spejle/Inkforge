import React, { useState } from 'react';
import { STAMP_CATEGORIES, STAMPS } from '../engine/stampsCatalog';
import { Upload, Search, Sparkles, Layers, ChevronRight, ChevronLeft } from 'lucide-react';

export default function StampDrawer({
  isOpen,
  setIsOpen,
  activeStampId,
  setActiveStampId,
  onUploadCustomStamp
}) {
  const [selectedCat, setSelectedCat] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = React.useRef(null);

  const filteredStamps = STAMPS.filter(stamp => {
    const matchesCat = selectedCat === 'all' || stamp.category === selectedCat;
    const matchesSearch = stamp.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCustomUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        const img = new Image();
        img.onload = () => {
          onUploadCustomStamp(img, file.name);
        };
        img.src = loadEvt.target.result;
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    }
  };

  return (
    <aside className={`stamp-drawer ${isOpen ? 'open' : 'closed'}`}>
      {/* Toggle collapse button */}
      <button 
        className="drawer-toggle-btn"
        onClick={() => setIsOpen(v => !v)}
        title={isOpen ? "Collapse Stamp Library" : "Open Stamp Library"}
      >
        {isOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {isOpen && (
        <div className="drawer-content">
          <div className="drawer-header">
            <div className="flex-row items-center gap-2">
              <Sparkles size={18} className="text-amber-400" />
              <h3>Stamp Library</h3>
            </div>
            <button 
              className="btn-upload-stamp"
              onClick={() => fileInputRef.current?.click()}
              title="Upload your own PNG or SVG stamp"
            >
              <Upload size={14} /> Import Stamp
            </button>
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="image/png,image/svg+xml,image/webp,image/jpeg" 
              style={{ display: 'none' }} 
              onChange={handleCustomUpload}
            />
          </div>

          {/* Search bar */}
          <div className="search-box">
            <Search size={15} className="search-icon" />
            <input 
              type="text"
              placeholder="Search mountains, castles, tokens..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category Tabs */}
          <div className="category-chips">
            <button
              className={`chip ${selectedCat === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedCat('all')}
            >
              All Assets
            </button>
            {STAMP_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                className={`chip ${selectedCat === cat.id ? 'active' : ''}`}
                onClick={() => setSelectedCat(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Stamp Grid */}
          <div className="stamp-grid">
            {filteredStamps.map(stamp => {
              const isSelected = activeStampId === stamp.id;

              return (
                <div
                  key={stamp.id}
                  className={`stamp-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setActiveStampId(stamp.id)}
                  title={`Select ${stamp.name}`}
                >
                  <div className="stamp-preview-canvas-box">
                    <StampThumbnail stamp={stamp} />
                  </div>
                  <span className="stamp-name-caption">{stamp.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}

// Renders a miniature preview of the vector stamp
function StampThumbnail({ stamp }) {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 72, 72);
    if (stamp.render) {
      stamp.render(ctx, 72);
    }
  }, [stamp]);

  return <canvas ref={canvasRef} width={72} height={72} className="thumbnail-canvas" />;
}
