import { Box, IconButton, Typography } from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DoneIcon from '@mui/icons-material/Done';
import ReplyIcon from '@mui/icons-material/Reply';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EditIcon from '@mui/icons-material/Edit';
import PushPinIcon from '@mui/icons-material/PushPin';
import ForwardIcon from '@mui/icons-material/Forward';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import { useState, useRef, useEffect } from 'react';
import ImageViewer from './ImageViewer';
import { saveGif } from '../../lib/gifDB';

const REACTIONS = ['❤️', '🙏', '👍', '👎', '🔥', '🥰', '👏'];

const menuItems = [
  { icon: <ReplyIcon fontSize="small" />, label: 'Reply' },
  { icon: <ContentCopyIcon fontSize="small" />, label: 'Copy' },
  { icon: <BookmarkIcon fontSize="small" />, label: 'Save GIF', gifOnly: true },
  { icon: <EditIcon fontSize="small" />, label: 'Edit' },
  { icon: <PushPinIcon fontSize="small" />, label: 'Pin' },
  { icon: <ForwardIcon fontSize="small" />, label: 'Forward' },
  { icon: <DeleteIcon fontSize="small" />, label: 'Delete', color: '#f44336' },
  { icon: <CheckCircleOutlineIcon fontSize="small" />, label: 'Select', divider: true },
];

export default function MessageBubble({ message, onReply, onDelete }) {
  const [showContext, setShowContext] = useState(false);
  const [reactions, setReactions] = useState(message.reactions || []);
  const [showActions, setShowActions] = useState(false);
  const [animate, setAnimate] = useState(message.isNew || false);
  const [pinned, setPinned] = useState(false);
  const [selected, setSelected] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.content);
  const [displayContent, setDisplayContent] = useState(message.content);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);
  const isMe = message.senderId === 'me';

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);
  const [swipeX, setSwipeX] = useState(0);
  const longPressTimer = useRef(null);
  const didSwipe = useRef(false);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setAnimate(false), 200);
      return () => clearTimeout(t);
    }
  }, []);

  useEffect(() => {
    if (showContext) document.activeElement?.blur();
  }, [showContext]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    didSwipe.current = false;
    longPressTimer.current = setTimeout(() => {
      if (!didSwipe.current) setShowContext(true);
    }, 500);
  };

  const handleTouchMove = (e) => {
    if (!touchStartX.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dy) > Math.abs(dx)) { clearTimeout(longPressTimer.current); return; }
    if (Math.abs(dx) > 5) { clearTimeout(longPressTimer.current); didSwipe.current = true; }
    if (dx > 0 && dx < 80) setSwipeX(dx);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
    if (swipeX > 50 && !showContext) onReply(message);
    setSwipeX(0);
    touchStartX.current = null;
  };

  const toggleReaction = (emoji) => {
    setReactions(prev => {
      const exists = prev.find(r => r.emoji === emoji);
      if (exists) return prev.map(r => r.emoji === emoji ? { ...r, count: r.count - 1 } : r).filter(r => r.count > 0);
      return [...prev, { emoji, count: 1 }];
    });
    setShowContext(false);
  };

  const handleMenuAction = (label) => {
    switch (label) {
      case 'Reply': onReply(message); break;
      case 'Copy': navigator.clipboard?.writeText(displayContent); break;
      case 'Edit': setIsEditing(true); break;
      case 'Pin': setPinned(p => !p); break;
      case 'Forward': break;
      case 'Delete': if (onDelete) onDelete(message.id); break;
      case 'Select': setSelected(p => !p); break;
      case 'Save GIF':
        if (message.gif?.url) {
          fetch(message.gif.url)
            .then(r => r.blob())
            .then(blob => {
              const file = new File([blob], `gif_${Date.now()}.gif`, { type: 'image/gif' });
              saveGif(file);
            });
        }
        break;
    }
    setShowContext(false);
  };

  // ── tail shape برای حباب تلگرام‌مانند ──
  const bubbleTail = isMe ? {
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      right: -7,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderWidth: '0 0 10px 8px',
      borderColor: 'transparent transparent transparent',
      borderLeftColor: 'transparent',
    },
  } : {
    '&::after': {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: -7,
      width: 0,
      height: 0,
      borderStyle: 'solid',
      borderWidth: '0 8px 10px 0',
      borderColor: 'transparent',
      borderRightColor: '#182533',
    },
  };

  const timeBlock = (
    <Box component="span" sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.3,
      fontSize: 11, opacity: 0.7,
      whiteSpace: 'nowrap', flexShrink: 0,
      alignSelf: 'flex-end', mb: '2px',
    }}>
      {pinned && <PushPinIcon sx={{ fontSize: 11 }} />}
      {message.time}
      {isMe && (message.read
        ? <DoneAllIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)' }} />
        : <DoneIcon sx={{ fontSize: 13, opacity: 0.7 }} />
      )}
    </Box>
  );

  const timeOverlay = (
    <Box sx={{
      position: 'absolute', bottom: 6, right: 8,
      display: 'flex', alignItems: 'center', gap: 0.3,
      bgcolor: 'rgba(0,0,0,0.5)',
      borderRadius: 10, px: 0.8, py: 0.2,
      pointerEvents: 'none',
    }}>
      <Typography fontSize={11} color="white" sx={{ opacity: 0.9 }}>{message.time}</Typography>
      {isMe && (message.read
        ? <DoneAllIcon sx={{ fontSize: 12, color: 'white' }} />
        : <DoneIcon sx={{ fontSize: 12, color: 'white', opacity: 0.7 }} />
      )}
    </Box>
  );

  const renderImages = () => {
    const imgs = message.images;
    if (!imgs) return null;

    const imgStyle = (i, total) => {
      if (total === 1) return { borderRadius: 2 };
      if (total === 2) return { borderRadius: i === 0 ? '12px 2px 2px 12px' : '2px 12px 12px 2px' };
      if (total === 3) {
        if (i === 0) return { borderRadius: '12px 2px 2px 12px' };
        if (i === 1) return { borderRadius: '2px 12px 2px 2px' };
        return { borderRadius: '2px 2px 12px 2px' };
      }
      const map = ['12px 2px 2px 2px', '2px 12px 2px 2px', '2px 2px 2px 12px', '2px 2px 12px 2px'];
      return { borderRadius: map[i] || '2px' };
    };

    return (
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
        {imgs.length === 1 && (
          <Box component="img" src={imgs[0].url}
            onClick={(e) => { e.stopPropagation(); setViewerIndex(0); setViewerOpen(true); }}
            sx={{ maxWidth: 280, width: '100%', display: 'block', cursor: 'pointer', ...imgStyle(0, 1) }}
          />
        )}
        {imgs.length === 2 && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {imgs.map((img, i) => (
              <Box key={i} component="img" src={img.url}
                onClick={(e) => { e.stopPropagation(); setViewerIndex(i); setViewerOpen(true); }}
                sx={{ width: '50%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer', ...imgStyle(i, 2) }}
              />
            ))}
          </Box>
        )}
        {imgs.length === 3 && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Box component="img" src={imgs[0].url}
              onClick={(e) => { e.stopPropagation(); setViewerIndex(0); setViewerOpen(true); }}
              sx={{ width: '50%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer', ...imgStyle(0, 3) }}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, width: '50%' }}>
              {imgs.slice(1).map((img, i) => (
                <Box key={i} component="img" src={img.url}
                  onClick={(e) => { e.stopPropagation(); setViewerIndex(i + 1); setViewerOpen(true); }}
                  sx={{ width: '100%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer', ...imgStyle(i + 1, 3) }}
                />
              ))}
            </Box>
          </Box>
        )}
        {imgs.length >= 4 && (
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
            {imgs.slice(0, 4).map((img, i) => (
              <Box key={i} sx={{ position: 'relative' }}>
                <Box component="img" src={img.url}
                  onClick={(e) => { e.stopPropagation(); setViewerIndex(i); setViewerOpen(true); }}
                  sx={{ width: '100%', aspectRatio: '1', objectFit: 'cover', cursor: 'pointer', display: 'block', ...imgStyle(i, 4) }}
                />
                {i === 3 && imgs.length > 4 && (
                  <Box sx={{
                    position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0.6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    borderRadius: '2px 2px 12px 2px', cursor: 'pointer',
                  }} onClick={(e) => { e.stopPropagation(); setViewerIndex(3); setViewerOpen(true); }}>
                    <Typography fontSize={24} fontWeight={700} color="white">+{imgs.length - 4}</Typography>
                  </Box>
                )}
              </Box>
            ))}
          </Box>
        )}
        {timeOverlay}
        {message.caption && (
          <Box sx={{ px: 1.5, pt: 0.8, pb: 0.5, bgcolor: isMe ? 'primary.main' : 'background.paper' }}>
            <Typography fontSize={14} sx={{ wordBreak: 'break-word', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
              {message.caption}
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <>
      {showContext && (
        <Box onClick={() => setShowContext(false)} sx={{
          position: 'fixed', inset: 0, zIndex: 50,
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          bgcolor: 'rgba(0,0,0,0.5)',
        }} />
      )}

      {viewerOpen && message.images && (
        <ImageViewer images={message.images} startIndex={viewerIndex} onClose={() => setViewerOpen(false)} />
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: isMe ? 'flex-end' : 'flex-start',
          mb: 0.5,
          // فاصله کمتر برای پیام‌های همان فرستنده — تلگرام‌مانند
          px: isMe ? '10px' : '10px',
          position: 'relative',
          zIndex: showContext ? 51 : 1,
          bgcolor: selected ? 'rgba(42,171,238,0.15)' : 'transparent',
          borderRadius: 1,
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
      >
        <Box sx={{
          position: 'absolute',
          left: isMe ? 'auto' : 8, right: isMe ? 8 : 'auto',
          top: '50%', transform: 'translateY(-50%)',
          opacity: Math.min(swipeX / 50, 1),
          transition: swipeX === 0 ? 'opacity 0.2s' : 'none',
          pointerEvents: 'none',
        }}>
          <ReplyIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
        </Box>

        {showActions && !showContext && (
          <Box sx={{
            display: { xs: 'none', md: 'flex' },
            alignItems: 'center', gap: 0.3,
            order: isMe ? 0 : 2, mx: 0.5,
          }}>
            <IconButton size="small" onClick={() => onReply(message)} sx={{ p: 0.5 }}>
              <ReplyIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton size="small" onClick={() => setShowContext(true)} sx={{ p: 0.5 }}>
              <Typography fontSize={14} lineHeight={1}>😊</Typography>
            </IconButton>
          </Box>
        )}

        <Box
          sx={{
            maxWidth: { xs: '85%', lg: '65%' },
            order: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isMe ? 'flex-end' : 'flex-start',
            transform: showContext
              ? 'scale(1.02)'
              : animate
                ? `translateX(${isMe ? '20px' : '-20px'}) scale(0.85)`
                : `translateX(${swipeX}px) scale(1)`,
            opacity: animate ? 0 : 1,
            transition: animate
              ? 'none'
              : showContext
                ? 'transform 0.2s ease'
                : 'transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.1s ease',
            userSelect: 'none',
            WebkitUserSelect: 'none',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => { e.preventDefault(); setShowContext(true); }}
        >
          {showContext && (
            <Box sx={{
              mb: 1, display: 'flex', flexDirection: 'column',
              alignItems: isMe ? 'flex-end' : 'flex-start', width: '100%',
            }}>
              <Box sx={{
                display: 'flex', gap: 0.3,
                bgcolor: 'rgba(30,30,30,0.97)',
                borderRadius: 3, p: 0.8, mb: 0.8,
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              }}>
                {REACTIONS.map(emoji => (
                  <IconButton key={emoji} onClick={() => toggleReaction(emoji)} sx={{ p: 0.5 }}>
                    <Typography fontSize={20}>{emoji}</Typography>
                  </IconButton>
                ))}
              </Box>

              <Box sx={{
                bgcolor: 'rgba(30,30,30,0.97)', borderRadius: 2, overflow: 'hidden',
                boxShadow: '0 4px 20px rgba(0,0,0,0.4)', minWidth: 180,
              }}>
                {menuItems
                  .filter(item => !item.gifOnly || message.gif)
                  .map((item) => (
                    <Box key={item.label}>
                      {item.divider && <Box sx={{ height: '1px', bgcolor: 'divider' }} />}
                      <Box onClick={() => handleMenuAction(item.label)} sx={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        px: 1.5, py: 1, cursor: 'pointer',
                        color: item.color || 'text.primary',
                        '&:active': { bgcolor: 'rgba(255,255,255,0.08)' },
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                      }}>
                        <Typography fontSize={14}>{item.label}</Typography>
                        <Box sx={{ color: item.color || 'text.secondary', ml: 2 }}>{item.icon}</Box>
                      </Box>
                    </Box>
                  ))}
              </Box>
            </Box>
          )}

          {message.replyTo && (
            <Box sx={{
              borderLeft: '8px solid #1a3a5c',
              borderColor: 'primary.main',
              borderRadius: isMe ? '8px 8px 0 0' : '8px 8px 0 0',
              bgcolor: isMe ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.06)',
              px: 1.5, py: 0.8, mb: '-4px',
              width: 'fit-content', maxWidth: '100%',
            }}>
              <Typography fontSize={12} color="primary.main" fontWeight={600} noWrap>
                {message.replyTo.senderName || 'You'}
              </Typography>
              <Typography fontSize={12} sx={{ opacity: 0.7 }} noWrap>
                {message.replyTo.content}
              </Typography>
            </Box>
          )}

          {/* عکس‌ها */}
          {message.images && !isEditing && renderImages()}

          {/* گیف */}
          {message.gif && !isEditing && (
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
              <img
                src={message.gif.url}
                alt="gif"
                style={{ maxWidth: 250, width: '100%', borderRadius: 12, display: 'block' }}
              />
              {timeOverlay}
            </Box>
          )}

          {/* محتوای متنی و فایل */}
          {!message.images && !message.gif && (
            isEditing ? (
              <Box sx={{
                position: 'relative',
                bgcolor: isMe ? undefined : '#182533',
                background: isMe ? 'linear-gradient(135deg, #1a3a5c, #2b5278)' : undefined,
                borderRadius: 2, px: 1.5, py: 0.8,
                width: 'fit-content', maxWidth: '100%', minWidth: 200,
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
              }}>
                <textarea
                  autoFocus
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onBlur={() => { setDisplayContent(editText); setIsEditing(false); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); setDisplayContent(editText); setIsEditing(false); }
                    if (e.key === 'Escape') setIsEditing(false);
                  }}
                  style={{
                    background: 'transparent', border: 'none', outline: 'none',
                    color: 'white', fontSize: 14, width: '100%',
                    resize: 'none', fontFamily: 'inherit', lineHeight: 1.6,
                  }}
                />
              </Box>
            ) : (
              <Box sx={{
                position: 'relative',
                bgcolor: isMe ? undefined : '#182533',
                background: isMe ? 'linear-gradient(135deg, #1a3a5c, #2b5278)' : undefined,
                color: isMe ? 'white' : 'text.primary',
                // ── شکل تلگرام‌مانند ──
                borderRadius: isMe
                  ? message.replyTo ? '12px 12px 2px 12px' : '12px 12px 2px 12px'
                  : message.replyTo ? '12px 12px 12px 2px' : '12px 12px 12px 2px',
                px: 1.5, py: 0.8,
                width: 'fit-content', maxWidth: '100%', overflow: 'hidden',
                boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                // ── دُم تلگرامی با CSS ──
                ...(!message.replyTo ? bubbleTail : {}),
              }} dir="auto">

                {message.file?.type === 'video' && (
                  <Box>
                    <Box component="video" src={message.file.url} controls sx={{
                      maxWidth: '100%', borderRadius: 1.5, display: 'block', maxHeight: 300,
                    }} />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>{timeBlock}</Box>
                  </Box>
                )}

                {message.file?.type === 'file' && (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, minWidth: 200 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ bgcolor: 'rgba(255,255,255,0.2)', borderRadius: '50%', p: 1, display: 'flex' }}>
                        <InsertDriveFileIcon sx={{ fontSize: 20 }} />
                      </Box>
                      <Box>
                        <Box sx={{ fontSize: 13, fontWeight: 600 }}>{message.file.name}</Box>
                        <Box sx={{ fontSize: 11, opacity: 0.7 }}>{message.file.size}</Box>
                      </Box>
                    </Box>
                    {timeBlock}
                  </Box>
                )}

                {message.voice && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 200 }}>
                    <IconButton size="small"
                      onClick={() => new Audio(message.voice.url).play()}
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit' }}>
                      <PlayArrowIcon fontSize="small" />
                    </IconButton>
                    <Box sx={{ flex: 1, height: 3, bgcolor: 'rgba(255,255,255,0.3)', borderRadius: 2 }} />
                    <Box sx={{ fontSize: 11, opacity: 0.7 }}>
                      {Math.floor((message.voice.duration || 0) / 60).toString().padStart(2, '0')}:{((message.voice.duration || 0) % 60).toString().padStart(2, '0')}
                    </Box>
                    {timeBlock}
                  </Box>
                )}

                {displayContent && (
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1 }}>
                    <Typography fontSize={14} sx={{
                      wordBreak: 'break-word', lineHeight: 1.6,
                      whiteSpace: 'pre-wrap', textAlign: 'right',
                      flex: 1, fontWeight: 400,
                    }}>
                      {displayContent}
                    </Typography>
                    {timeBlock}
                  </Box>
                )}

                {!displayContent && !message.file && !message.voice && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>{timeBlock}</Box>
                )}
              </Box>
            )
          )}

          {reactions.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
              {reactions.map((r, i) => (
                <Box key={i} onClick={() => toggleReaction(r.emoji)} sx={{
                  bgcolor: 'background.paper', borderRadius: 10,
                  px: 0.8, py: 0.2, fontSize: 12, boxShadow: 1, cursor: 'pointer',
                }}>
                  {r.emoji} {r.count}
                </Box>
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </>
  );
}