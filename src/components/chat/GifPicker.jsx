import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useEffect, useRef } from 'react';
import { saveGif, getAllGifs, deleteGif } from '../../lib/gifDB';

export default function GifPicker({ onSelect, onClose }) {
  const [gifs, setGifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const uploadRef = useRef();
  const urlsRef = useRef([]);

  useEffect(() => {
    loadGifs();
    // return () => {
    //   // cleanup urls
    //   urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    // };
  }, []);

  const loadGifs = async () => {
    setLoading(true);
    // urlsRef.current.forEach(url => URL.revokeObjectURL(url));
    // urlsRef.current = [];
  
    const all = await getAllGifs();
    urlsRef.current = all.map(g => g.url);
    setGifs(all);
    setLoading(false);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.includes('gif')) {
      alert('فقط فایل GIF قبول میشه');
      return;
    }
    await saveGif(file);
    await loadGifs();
    e.target.value = '';
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    await deleteGif(id);
    setGifs(prev => prev.filter(g => g.id !== id));
  };

  return (
    <Box sx={{
      bgcolor: 'background.paper',
      borderTop: '1px solid', borderColor: 'divider',
      maxHeight: 280,
      display: 'flex',
      flexDirection: 'column',
    }}>

      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1,
        borderBottom: '1px solid', borderColor: 'divider',
      }}>
        <Typography fontSize={14} fontWeight={600}>GIFs</Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" onClick={() => uploadRef.current.click()}>
            <AddIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={onClose}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
        <input ref={uploadRef} type="file" accept=".gif,image/gif" hidden onChange={handleUpload} />
      </Box>

      <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <Typography fontSize={13} color="text.secondary">Loading...</Typography>
          </Box>
        ) : gifs.length === 0 ? (
          <Box sx={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            py: 4, gap: 1,
          }}>
            <Typography fontSize={32}>🎞️</Typography>
            <Typography fontSize={13} color="text.secondary">هنوز گیفی نداری</Typography>
            <Box onClick={() => uploadRef.current.click()} sx={{
              fontSize: 13, color: 'primary.main', cursor: 'pointer', mt: 0.5,
              '&:hover': { textDecoration: 'underline' },
            }}>
              + اضافه کن
            </Box>
          </Box>
        ) : (
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
            gap: 1,
          }}>
            {gifs.map(gif => (
              <Box
                key={gif.id}
                sx={{ position: 'relative', cursor: 'pointer', borderRadius: 1.5, overflow: 'hidden' }}
                onClick={() => onSelect({ url: gif.url, name: gif.name })}
              >
                <img
  src={gif.url}
  alt={gif.name}
  onError={(e) => console.error('img error:', e, 'src:', gif.url)}
  onLoad={() => console.log('img loaded:', gif.url)}
  style={{
    width: '100%',
    aspectRatio: '1',
    objectFit: 'cover',
    display: 'block',
  }}
/>
                <IconButton
                  size="small"
                  onClick={(e) => handleDelete(e, gif.id)}
                  sx={{
                    position: 'absolute', top: 2, right: 2,
                    bgcolor: 'rgba(0,0,0,0.6)', color: 'white',
                    p: 0.3,
                  }}
                >
                  <DeleteIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}