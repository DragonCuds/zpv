import { Box, Typography, Fab } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import MessageBubble from './MessageBubble';

function DateSeparator({ date }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', my: 1.5, px: 2 }}>
      <Box sx={{
        bgcolor: 'rgba(0,0,0,0.18)',
        backdropFilter: 'blur(8px)',
        color: 'white',
        fontSize: 12,
        fontWeight: 500,
        px: 1.8,
        py: 0.4,
        borderRadius: 10,
      }}>
        {date}
      </Box>
    </Box>
  );
}

function UnreadDivider() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, my: 1.5, px: 2 }}>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'primary.main', opacity: 0.5 }} />
      <Typography fontSize={12} color="primary.main" fontWeight={600}>
        پیام‌های خوانده نشده
      </Typography>
      <Box sx={{ flex: 1, height: '1px', bgcolor: 'primary.main', opacity: 0.5 }} />
    </Box>
  );
}

function TypingIndicator() {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'flex-start', px: 2, mb: 1 }}>
      <Box sx={{
        bgcolor: 'background.paper',
        borderRadius: '4px 18px 18px 18px',
        px: 1.8,
        py: 1.2,
        display: 'flex',
        alignItems: 'center',
        gap: 0.5,
        boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
      }}>
        {[0, 1, 2].map(i => (
          <Box key={i} sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            bgcolor: 'text.secondary',
            animation: 'typing-dot 1.4s ease-in-out infinite',
            animationDelay: `${i * 0.2}s`,
            '@keyframes typing-dot': {
              '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
              '30%': { transform: 'translateY(-5px)', opacity: 1 },
            },
          }} />
        ))}
      </Box>
    </Box>
  );
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'امروز';
  if (date.toDateString() === yesterday.toDateString()) return 'دیروز';
  return date.toLocaleDateString('fa-IR', { year: 'numeric', month: 'long', day: 'numeric' });
}

function isSameDay(a, b) {
  if (!a || !b) return false;
  return new Date(a).toDateString() === new Date(b).toDateString();
}

export default function MessageList({ messages, onReply, onDelete, isTyping, firstUnreadId }) {
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const isNearBottomRef = useRef(true);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
    setUnreadCount(0);
  }, []);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    setShowScrollBtn(!nearBottom);
    if (nearBottom) setUnreadCount(0);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll, { passive: true });
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (isNearBottomRef.current) {
      scrollToBottom();
    } else if (lastMsg.senderId !== 'me') {
      setUnreadCount(p => p + 1);
    }
  }, [messages.length]);

  useEffect(() => {
    if (isTyping && isNearBottomRef.current) {
      scrollToBottom();
    }
  }, [isTyping]);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => setTimeout(() => scrollToBottom('instant'), 50);
    viewport.addEventListener('resize', handleResize);
    return () => viewport.removeEventListener('resize', handleResize);
  }, []);

  const items = useMemo(() => {
    const result = [];
    messages.forEach((msg, i) => {
      const prev = messages[i - 1];
      if (!prev || !isSameDay(prev.created_at, msg.created_at)) {
        result.push(<DateSeparator key={`date-${msg.id}`} date={formatDateLabel(msg.created_at)} />);
      }
      if (firstUnreadId && msg.id === firstUnreadId) {
        result.push(<UnreadDivider key="unread-divider" />);
      }
      result.push(
        <MessageBubble key={msg.id} message={msg} onReply={onReply} onDelete={onDelete} />
      );
    });
    return result;
  }, [messages, firstUnreadId, onReply, onDelete]);

  return (
    <Box sx={{ position: 'relative', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
      <Box
        ref={containerRef}
        sx={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(255,255,255,0.1)',
            borderRadius: 10,
          },
        }}
      >
        <Box sx={{ py: 1, marginTop: 'auto' }}>
          {messages.length === 0 && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography color="text.secondary" fontSize={14}>هنوز پیامی نیست</Typography>
            </Box>
          )}
          {items}
          {isTyping && <TypingIndicator />}
          <div ref={bottomRef} />
        </Box>
      </Box>

      {showScrollBtn && (
        <Box sx={{ position: 'absolute', bottom: 12, right: 12, zIndex: 10 }}>
          <Fab
            size="small"
            onClick={() => scrollToBottom()}
            sx={{
              bgcolor: 'background.paper',
              color: 'text.primary',
              boxShadow: 3,
              width: 38,
              height: 38,
              minHeight: 'unset',
            }}
          >
            <KeyboardArrowDownIcon fontSize="small" />
            {unreadCount > 0 && (
              <Box sx={{
                position: 'absolute',
                top: -6, right: -6,
                bgcolor: 'primary.main',
                color: 'white',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                px: 0.6,
                minWidth: 18,
                textAlign: 'center',
                lineHeight: '18px',
                height: 18,
              }}>
                {unreadCount}
              </Box>
            )}
          </Fab>
        </Box>
      )}
    </Box>
  );
}