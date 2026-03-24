import { Box, IconButton, Typography, InputBase, Checkbox, FormControlLabel } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import SendIcon from '@mui/icons-material/Send';
import { useState, useRef } from 'react';

export default function ImageUploadSheet({ initialFiles, onSend, onClose }) {
  const [files, setFiles] = useState(initialFiles);
  const [caption, setCaption] = useState('');
  const [groupItems, setGroupItems] = useState(true);
  const [sendAsDocument, setSendAsDocument] = useState(false);
  const addRef = useRef();

  const handleRemove = (i) => {
    const updated = files.filter((_, idx) => idx !== i);
    if (updated.length === 0) { onClose(); return; }
    setFiles(updated);
  };

  const handleAdd = (e) => {
    const newFiles = Array.from(e.target.files).map(file => ({
      file,                          // ← File object نگه داشته میشه
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setFiles(prev => [...prev, ...newFiles]);
    e.target.value = '';
  };

  const handleSend = () => {
    if (sendAsDocument) {
      files.forEach(f => {
        onSend({
          content: caption,
          file: { file: f.file, name: f.name, size: '', url: f.url, type: 'file' },
        });
      });
    } else if (groupItems) {
      onSend({
        content: '',
        caption,
        // هر عکس هم File object داره هم url
        images: files.map(f => ({ file: f.file, url: f.url, name: f.name })),
      });
    } else {
      files.forEach((f, i) => {
        onSend({
          content: '',
          caption: i === files.length - 1 ? caption : '',
          images: [{ file: f.file, url: f.url, name: f.name }],
        });
      });
    }
    onClose();
  };

  return (
    <>
      <Box onClick={onClose} sx={{
        position: 'fixed', inset: 0, zIndex: 100,
        bgcolor: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }} />

      <Box sx={{
        position: 'fixed',
        bottom: 0, left: 0, right: 0,
        zIndex: 101,
        bgcolor: 'background.paper',
        borderRadius: '16px 16px 0 0',
        pb: { xs: 4, lg: 2 },
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1.5,
          borderBottom: '1px solid', borderColor: 'divider',
        }}>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
          <Typography fontWeight={600}>
            {files.length} {files.length === 1 ? 'image' : 'images'} selected
          </Typography>
          <Box sx={{ width: 40 }} />
        </Box>

        <Box sx={{
          display: 'flex', gap: 1.5, px: 2, py: 2,
          overflowX: 'auto',
          '&::-webkit-scrollbar': { display: 'none' },
        }}>
          {files.map((f, i) => (
            <Box key={i} sx={{ position: 'relative', flexShrink: 0 }}>
              <Box
                component="img"
                src={f.url}
                sx={{ width: 120, height: 120, objectFit: 'cover', borderRadius: 2, display: 'block' }}
              />
              <IconButton
                size="small"
                onClick={() => handleRemove(i)}
                sx={{
                  position: 'absolute', top: 4, right: 4,
                  bgcolor: 'rgba(0,0,0,0.6)', color: 'white', p: 0.3,
                  '&:hover': { bgcolor: 'rgba(200,0,0,0.7)' },
                }}
              >
                <DeleteIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Box>
          ))}

          <Box
            onClick={() => addRef.current.click()}
            sx={{
              width: 120, height: 120,
              border: '2px dashed', borderColor: 'divider',
              borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
              '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
            }}
          >
            <AddPhotoAlternateIcon sx={{ color: 'text.secondary', fontSize: 32 }} />
          </Box>
          <input ref={addRef} type="file" accept="image/*" multiple hidden onChange={handleAdd} />
        </Box>

        <Box sx={{ px: 2, pb: 1 }}>
          <FormControlLabel
            control={<Checkbox checked={groupItems} onChange={e => setGroupItems(e.target.checked)} size="small" sx={{ color: 'primary.main' }} />}
            label={<Typography fontSize={14}>Group items</Typography>}
          />
          <FormControlLabel
            control={<Checkbox checked={sendAsDocument} onChange={e => setSendAsDocument(e.target.checked)} size="small" />}
            label={<Typography fontSize={14}>Send as documents</Typography>}
          />
        </Box>

        <Box sx={{
          display: 'flex', alignItems: 'flex-end', gap: 1,
          px: 2, pt: 1,
          borderTop: '1px solid', borderColor: 'divider',
        }}>
          <Box sx={{ flex: 1, bgcolor: 'background.default', borderRadius: 3, px: 2, py: 1 }}>
            <InputBase
              fullWidth multiline maxRows={4}
              placeholder="Caption..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              autoFocus
              sx={{ fontSize: 15 }}
            />
          </Box>
          <IconButton
            onClick={handleSend}
            sx={{ bgcolor: 'primary.main', color: 'white', '&:hover': { bgcolor: 'primary.dark' }, mb: 0.5 }}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </>
  );
}