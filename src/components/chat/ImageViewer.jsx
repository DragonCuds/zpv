import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import DownloadIcon from '@mui/icons-material/Download';
import { useState, useRef, useEffect } from 'react';

export default function ImageViewer({ images, startIndex = 0, onClose }) {
  const [current, setCurrent] = useState(startIndex);
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // touch
  const touchStart = useRef(null);
  const touchDist = useRef(null);
  const dragStart = useRef(null);
  const lastOffset = useRef({ x: 0, y: 0 });

  // keyboard
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [current]);

  const resetZoom = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
    lastOffset.current = { x: 0, y: 0 };
  };

  const goNext = () => {
    if (current < images.length - 1) {
      setCurrent(c => c + 1);
      resetZoom();
    }
  };

  const goPrev = () => {
    if (current > 0) {
      setCurrent(c => c - 1);
      resetZoom();
    }
  };

  // double tap zoom
  const lastTap = useRef(0);
  const handleTap = (e) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (scale === 1) {
        setScale(2.5);
      } else {
        resetZoom();
      }
    }
    lastTap.current = now;
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchDist.current = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
    } else if (e.touches.length === 1) {
      touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
  };

  const handleTouchMove = (e) => {
    e.preventDefault();
    if (e.touches.length === 2 && touchDist.current) {
      const newDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const delta = newDist / touchDist.current;
      setScale(s => Math.min(Math.max(s * delta, 1), 5));
      touchDist.current = newDist;
    } else if (e.touches.length === 1 && dragStart.current) {
      const dx = e.touches[0].clientX - dragStart.current.x;
      const dy = e.touches[0].clientY - dragStart.current.y;
      if (scale > 1) {
        setOffset({
          x: lastOffset.current.x + dx,
          y: lastOffset.current.y + dy,
        });
      }
    }
  };

  const handleTouchEnd = (e) => {
    if (scale === 1 && touchStart.current) {
      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0) goNext();
        else goPrev();
      } else if (dy > 80 && Math.abs(dx) < 30) {
        onClose();
      }
    }
    if (dragStart.current && scale > 1) {
      const dx = e.changedTouches[0]?.clientX - dragStart.current.x || 0;
      const dy = e.changedTouches[0]?.clientY - dragStart.current.y || 0;
      lastOffset.current = {
        x: lastOffset.current.x + dx,
        y: lastOffset.current.y + dy,
      };
    }
    touchDist.current = null;
    touchStart.current = null;
    dragStart.current = null;
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = images[current].url;
    a.download = images[current].name || 'image';
    a.click();
  };

  return (
    <Box
      sx={{
        position: 'fixed', inset: 0, zIndex: 200,
        bgcolor: 'rgba(0,0,0,0.95)',
        display: 'flex', flexDirection: 'column',
      }}
      onClick={handleTap}
    >
      {/* هدر */}
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        px: 2, py: 1,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
        position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1,
      }}>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
        <Typography color="white" fontSize={14}>
          {current + 1} / {images.length}
        </Typography>
        <IconButton onClick={handleDownload} sx={{ color: 'white' }}>
          <DownloadIcon />
        </IconButton>
      </Box>

      {/* عکس */}
      <Box
        sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Box
          component="img"
          src={images[current].url}
          sx={{
            maxWidth: '100%',
            maxHeight: '100vh',
            objectFit: 'contain',
            transform: `scale(${scale}) translate(${offset.x / scale}px, ${offset.y / scale}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {/* دکمه‌های ناوبری دسکتاپ */}
      {current > 0 && (
        <IconButton
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          sx={{
            position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
            color: 'white', bgcolor: 'rgba(255,255,255,0.15)',
            display: { xs: 'none', md: 'flex' },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
          }}
        >
          <ArrowBackIosIcon />
        </IconButton>
      )}
      {current < images.length - 1 && (
        <IconButton
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          sx={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            color: 'white', bgcolor: 'rgba(255,255,255,0.15)',
            display: { xs: 'none', md: 'flex' },
            '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' },
          }}
        >
          <ArrowForwardIosIcon />
        </IconButton>
      )}

      {/* thumbnail strip پایین */}
      {images.length > 1 && (
        <Box sx={{
          display: 'flex', gap: 1, px: 2, pb: 2, pt: 1,
          justifyContent: 'center', overflowX: 'auto',
          background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
        }}>
          {images.map((img, i) => (
            <Box
              key={i}
              component="img"
              src={img.url}
              onClick={(e) => { e.stopPropagation(); setCurrent(i); resetZoom(); }}
              sx={{
                width: 48, height: 48, objectFit: 'cover',
                borderRadius: 1,
                border: i === current ? '2px solid white' : '2px solid transparent',
                opacity: i === current ? 1 : 0.5,
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'opacity 0.2s, border 0.2s',
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}