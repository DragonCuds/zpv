import {
  Box, Typography, Avatar, InputBase, List, ListItem,
  IconButton, Button, CircularProgress, Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PushPinIcon from '@mui/icons-material/PushPin';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConversations, getChatRequests } from '../../lib/api';
import LogoutIcon from '@mui/icons-material/Logout';


const LIST_POLL_INTERVAL = 5000;

// نشانگر وضعیت اتصال
function ConnIndicator({ state }) {
  const config = {
    connecting:  { color: '#f59e0b', label: 'در حال اتصال...' },
    ws:          { color: '#22c55e', label: 'متصل (WS)' },
    stabilizing: { color: '#f59e0b', label: 'در حال تثبیت...' },
    polling:     { color: '#3b82f6', label: 'متصل (HTTP)' },
  }[state] || { color: '#6b7280', label: 'نامشخص' };

  const pulse = state === 'connecting' || state === 'stabilizing';

  return (
    <Tooltip title={config.label} placement="bottom" arrow>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.6, cursor: 'default' }}>
        <Box sx={{ position: 'relative', width: 10, height: 10 }}>
          {pulse && (
            <Box sx={{
              position: 'absolute', inset: 0, borderRadius: '50%',
              bgcolor: config.color, opacity: 0.4,
              animation: 'conn-pulse 1.6s ease-out infinite',
              '@keyframes conn-pulse': {
                '0%':   { transform: 'scale(1)',   opacity: 0.4 },
                '70%':  { transform: 'scale(2.2)', opacity: 0 },
                '100%': { transform: 'scale(2.2)', opacity: 0 },
              },
            }} />
          )}
          <Box sx={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            bgcolor: config.color, transition: 'background-color 0.4s ease',
          }} />
        </Box>
        <Typography fontSize={11} sx={{ color: config.color, fontWeight: 500, transition: 'color 0.4s ease' }}>
          {config.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function normalizeConversation(conv) {
  return {
    id: conv.id,
    name: conv.other_user?.name || conv.other_user?.username || 'ناشناس',
    avatar: (conv.other_user?.name || conv.other_user?.username || '?')[0].toUpperCase(),
    lastMessage: conv.last_message?.content || '',
    time: conv.last_message?.created_at
      ? new Date(conv.last_message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    unread: conv.unread_count || 0,
    pinned: conv.pinned || false,
    accepted: true,
    direction: null,
    other_user: conv.other_user,
  };
}

function normalizeRequest(req, direction) {
  const user = direction === 'received' ? req.sender : req.receiver;
  return {
    id: req.id,
    requestId: req.id,
    name: user?.name || user?.username || 'ناشناس',
    avatar: (user?.name || user?.username || '?')[0].toUpperCase(),
    lastMessage: '',
    time: req.created_at
      ? new Date(req.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    unread: direction === 'received' ? 1 : 0,
    pinned: false,
    accepted: false,
    direction,
    other_user: user,
  };
}

export default function ChatList({ onSelectChat, selectedChat, connState = 'connecting', onRegisterRefresh }) {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pollTimerRef = useRef(null);
  const connStateRef = useRef(connState);

  useEffect(() => { connStateRef.current = connState; }, [connState]);

  const loadData = useCallback(async (silent = false) => {
    try {
      if (!silent) setError('');
      const [conversations, requests] = await Promise.all([
        getConversations(),
        getChatRequests(),
      ]);
      const convList         = (conversations || []).map(normalizeConversation);
      const receivedRequests = (requests?.received || []).map(r => normalizeRequest(r, 'received'));
      const sentRequests     = (requests?.sent     || []).map(r => normalizeRequest(r, 'sent'));
      setChats([...convList, ...receivedRequests, ...sentRequests]);
    } catch (err) {
      if (!silent) setError('خطا در بارگذاری چت‌ها');
      console.error('[ChatList]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // بار اول
  useEffect(() => { loadData(false); }, [loadData]);

  // ─── مدیریت polling بر اساس connState ─────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    stopPolling();
    pollTimerRef.current = setInterval(() => {
      if (connStateRef.current === 'ws') return; // WS وصله، poll نزن
      loadData(true);
    }, LIST_POLL_INTERVAL);
  }, [loadData, stopPolling]);

  useEffect(() => {
    if (connState === 'polling') {
      startPolling();
    } else if (connState === 'ws') {
      stopPolling();
    }
    // connecting و stabilizing → polling نزن، صبر کن
    return () => stopPolling();
  }, [connState]);

  // ─── refresh از ChatPage (بعد از send، accept، reject و WS event) ─────────
  useEffect(() => {
    if (!onRegisterRefresh) return;
    onRegisterRefresh((reason) => {
      // همیشه یه reload فوری بزن صرف‌نظر از mode
      loadData(true);
    });
  }, [onRegisterRefresh, loadData]);


  const handleLogout = () => {
    localStorage.removeItem('zpv_user');
    localStorage.removeItem('zpv_token'); 
    navigate('/login');
  };

  const filtered = chats
    .filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => b.pinned - a.pinned);

  return (
    <Box sx={{ height: '100dvh', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>

      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
          <Typography fontWeight={700} fontSize={18} noWrap>ZPV</Typography>
          <ConnIndicator state={connState} />
        </Box>
        <Box display={"flex"} alignItems={"center"} justifyContent={"end"} gap={1}>
            <IconButton sx={{color:""}} size="small" onClick={() => navigate('/request')}>
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color='error' size="small" onClick={() => handleLogout()}>
                <LogoutIcon fontSize="small" />
            </IconButton> 
        </Box>

      </Box>

      <Box sx={{ px: 1.5, pb: 1 }}>
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1,
          bgcolor: 'background.default', borderRadius: 3, px: 2, py: 0.8,
        }}>
          <SearchIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
          <InputBase
            placeholder="Search"
            fullWidth
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ fontSize: 15 }}
          />
        </Box>
      </Box>

      {loading ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <CircularProgress size={28} />
        </Box>
      ) : error ? (
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Typography color="error" fontSize={14} textAlign="center">{error}</Typography>
        </Box>
      ) : (
        <List sx={{ flex: 1, overflow: 'auto', p: 0, '&::-webkit-scrollbar': { display: 'none' } }}>
          {filtered.length === 0 && (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary" fontSize={14}>چتی وجود نداره</Typography>
            </Box>
          )}
          {filtered.map((chat) => (
            <ListItem
            
              key={`${chat.accepted ? 'conv' : 'req'}-${chat.id}`}
              onClick={() => (chat.accepted || chat.direction === 'received') && onSelectChat(chat)}
              sx={{
                cursor: (chat.accepted || chat.direction === 'received') ? 'pointer' : 'default',
                px: 1.5, py: 0.8,
                bgcolor: selectedChat?.id === chat.id ? 'primary.main' : 'transparent',
                '&:hover': {
                  bgcolor: (chat.accepted || chat.direction === 'received')
                    ? selectedChat?.id === chat.id ? 'primary.main' : 'action.hover'
                    : 'transparent',
                },
                borderRadius: 2, mx: 0.5, gap: 1.5,
                opacity: chat.direction === 'sent' ? 0.6 : 1,
                width:"95%",
                mx:"auto"
              }}
            >
              <Avatar sx={{
                bgcolor: chat.accepted ? 'primary.main' : chat.direction === 'received' ? 'success.main' : 'grey.600',
                width: 50, height: 50, fontSize: 18, flexShrink: 0,
              }}>
                {chat.avatar}
              </Avatar>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, minWidth: 0 }}>
                    {chat.pinned && (
                      <PushPinIcon sx={{
                        fontSize: 14,
                        color: selectedChat?.id === chat.id ? 'white' : 'text.secondary',
                        transform: 'rotate(45deg)', flexShrink: 0,
                      }} />
                    )}
                    <Typography fontWeight={600} fontSize={15} noWrap>{chat.name}</Typography>
                  </Box>
                  <Typography fontSize={12}
                    color={selectedChat?.id === chat.id ? 'inherit' : 'text.secondary'}
                    sx={{ flexShrink: 0, ml: 1 }}>
                    {chat.time}
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography fontSize={13}
                    color={
                      !chat.accepted && chat.direction === 'received' ? 'primary.main' :
                      !chat.accepted && chat.direction === 'sent' ? 'text.disabled' :
                      selectedChat?.id === chat.id ? 'inherit' : 'text.secondary'
                    }
                    noWrap sx={{ flex: 1 }}>
                    {!chat.accepted && chat.direction === 'sent' ? '⏳ منتظر تایید...' :
                     !chat.accepted && chat.direction === 'received' ? '👋 درخواست چت جدید' :
                     chat.lastMessage}
                  </Typography>
                  {chat.unread > 0 && (
                    <Box sx={{
                      bgcolor: selectedChat?.id === chat.id ? 'white' : 'primary.main',
                      color: selectedChat?.id === chat.id ? 'primary.main' : 'white',
                      borderRadius: 10, px: 0.8, fontSize: 12, fontWeight: 700,
                      minWidth: 22, textAlign: 'center', ml: 1, flexShrink: 0,
                    }}>
                      {chat.unread}
                    </Box>
                  )}
                </Box>
              </Box>
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="contained" startIcon={<AddIcon />}
          onClick={() => navigate('/request')} sx={{ borderRadius: 2, py: 1.2 }}>
          درخواست چت جدید
        </Button>
      </Box>
    </Box>
  );
}