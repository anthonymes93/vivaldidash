import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
}

interface AddBookmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, url: string) => void;
  onEdit: (id: string, title: string, url: string) => void;
  editData: Bookmark | null;
}

const AddBookmarkModal: React.FC<AddBookmarkModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  onEdit, 
  editData 
}) => {
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (editData) {
      setTitle(editData.title);
      setUrl(editData.url);
    } else {
      setTitle('');
      setUrl('');
    }
  }, [editData, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && url) {
      let formattedUrl = url;
      if (!/^https?:\/\//i.test(url)) {
        formattedUrl = 'https://' + url;
      }
      
      if (editData) {
        onEdit(editData.id, title, formattedUrl);
      } else {
        onAdd(title, formattedUrl);
      }
      
      setTitle('');
      setUrl('');
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="modal-overlay" onClick={onClose}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="glass modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 600 }}>
                {editData ? 'Edit Bookmark' : 'Add Bookmark'}
              </h2>
              <button onClick={onClose}><X size={20} color="rgba(255, 255, 255, 0.5)" /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Google"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label>URL</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. google.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <button type="submit" className="primary-button">
                {editData ? 'Save Changes' : 'Add Bookmark'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default AddBookmarkModal;
