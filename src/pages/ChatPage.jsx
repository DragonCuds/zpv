import { Box, Typography, Avatar } from '@mui/material';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import ChatList from '../components/chatpage/ChatList';
import ChatHeader from '../components/chat/ChatHeader';
import MessageList from '../components/chat/MessageList';
import MessageInput from '../components/chat/MessageInput';
import { getMessages, sendMessage, markMessagesRead, acceptChatRequest, rejectChatRequest, uploadFile } from '../lib/api';
import { connectionManager } from '../lib/connectionManager';
import bgImage from '../assets/Desktop.png';


function generateClientId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeMessage(msg, currentUserId) {
  return {
    id: msg.id,
    client_message_id: msg.client_message_id || null,
    senderId: msg.sender_id === currentUserId ? 'me' : 'other',
    senderName: msg.sender?.name || msg.sender?.username || '',
    content: msg.content || '',
    time: msg.created_at
      ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '',
    read: !!msg.is_read,
    replyTo: msg.reply_to || null,
    file: msg.type === 'file' || msg.type === 'video'
      ? { url: msg.file_url, name: msg.file_name || 'file', type: msg.type }
      : null,
    voice: msg.type === 'voice' ? { url: msg.file_url } : null,
    images: msg.type === 'image' ? [{ url: msg.file_url }] : null,
    gif: msg.type === 'gif' ? { url: msg.file_url } : null,
    status: 'sent',
    created_at: msg.created_at,
  };
}

const MESSAGE_POLL_INTERVAL = 3000;

export default function ChatPage({ darkMode, setDarkMode, onLogout }) {
  const [selectedChat, setSelectedChat] = useState(null);
  const [visibleChat, setVisibleChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [connState, setConnState] = useState('connecting');
  const [isTyping, setIsTyping] = useState(false);

  const touchStartX = useRef(null);
  const chatPanelRef = useRef(null);
  const visibleChatRef = useRef(null);
  const onRefreshListRef = useRef(null);
  const pollTimerRef = useRef(null);
  const isSendingRef = useRef(false);
  const connStateRef = useRef('connecting');
  const typingTimerRef = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem('zpv_user') || 'null');
  const currentUserId = currentUser?.id;

  useEffect(() => { visibleChatRef.current = visibleChat; }, [visibleChat]);
  useEffect(() => { connStateRef.current = connState; }, [connState]);

  // اولین پیام خوانده‌نشده
  const firstUnreadId = useMemo(() => {
    const firstUnread = messages.find(m => m.senderId !== 'me' && !m.read);
    return firstUnread?.id || null;
  }, [messages]);

  // visual viewport fix برای موبایل
  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;
    const handleResize = () => {
      if (chatPanelRef.current) {
        chatPanelRef.current.style.height = `${viewport.height}px`;
        chatPanelRef.current.style.top = `${viewport.offsetTop}px`;
      }
    };
    viewport.addEventListener('resize', handleResize);
    viewport.addEventListener('scroll', handleResize);
    return () => {
      viewport.removeEventListener('resize', handleResize);
      viewport.removeEventListener('scroll', handleResize);
    };
  }, []);

  // ─── merge پیام‌های جدید بدون duplicate ──────────────────────────────────
  const mergeMessages = useCallback((normalized) => {
    setMessages(prev => {
      const lastNew  = normalized[normalized.length - 1];
      const lastPrev = prev[prev.length - 1];
      if (
        lastNew?.id === lastPrev?.id &&
        normalized.length === prev.filter(m => m.status === 'sent').length
      ) return prev;

      const optimistic  = prev.filter(m => m.status === 'sending');
      const realIds     = new Set(normalized.map(m => m.id));
      const pendingOpts = optimistic.filter(m => !realIds.has(m.id));
      return [...normalized, ...pendingOpts];
    });
  }, []);

  // ─── polling پیام‌های داخل چت ─────────────────────────────────────────────
  const stopMessagePolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startMessagePolling = useCallback(() => {
    stopMessagePolling();
    const poll = async () => {
      const chat = visibleChatRef.current;
      if (!chat?.id || isSendingRef.current) return;
      if (connStateRef.current === 'ws') return;
      try {
        const data = await getMessages(chat.id);
        mergeMessages((data || []).map(m => normalizeMessage(m, currentUserId)));
      } catch (err) {
        console.error('[MsgPoll]', err);
      }
    };
    poll();
    pollTimerRef.current = setInterval(poll, MESSAGE_POLL_INTERVAL);
  }, [currentUserId, mergeMessages, stopMessagePolling]);

  // ─── connectionManager subscribe ──────────────────────────────────────────
  useEffect(() => {
    if (!currentUserId) return;
    connectionManager.init(currentUserId);

    const unsub = connectionManager.subscribe({
      onState: (state) => {
        setConnState(state);
        if (state === 'polling') {
          const chat = visibleChatRef.current;
          if (chat?.id && chat.accepted) startMessagePolling();
          if (onRefreshListRef.current) onRefreshListRef.current('startPolling');
        } else if (state === 'ws') {
          stopMessagePolling();
          if (onRefreshListRef.current) onRefreshListRef.current('stopPolling');
        }
      },

      onMessage: ({ conversation_id, message }) => {
        const chat = visibleChatRef.current;
        if (chat?.id === conversation_id) {
          const newMsg = normalizeMessage(message, currentUserId);
          setMessages(prev => {
            const isDup =
              prev.some(m => m.id === newMsg.id) ||
              (newMsg.client_message_id &&
               prev.some(m => m.client_message_id === newMsg.client_message_id && m.status === 'sent'));
            if (isDup) return prev;
            markMessagesRead(conversation_id).catch(() => {});
            return [...prev, newMsg];
          });
        }
      },

      // typing indicator از WS
      onTyping: ({ conversation_id }) => {
        const chat = visibleChatRef.current;
        if (chat?.id === conversation_id) {
          setIsTyping(true);
          clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setIsTyping(false), 3000);
        }
      },

      onListRefresh: () => {
        if (onRefreshListRef.current) onRefreshListRef.current('wsEvent');
      },
    });

    return () => {
      unsub();
      stopMessagePolling();
      clearTimeout(typingTimerRef.current);
    };
  }, [currentUserId, startMessagePolling, stopMessagePolling]);

  // ─── وقتی چت عوض میشه ────────────────────────────────────────────────────
  useEffect(() => {
    if (!visibleChat?.id || !visibleChat.accepted) {
      stopMessagePolling();
      return;
    }
    setIsTyping(false);
    if (connStateRef.current === 'polling') {
      startMessagePolling();
    }
    return () => stopMessagePolling();
  }, [visibleChat?.id, visibleChat?.accepted]);

  const loadMessages = useCallback(async (chat) => {
    if (!chat?.id) return;
    try {
      const data = await getMessages(chat.id);
      const normalized = (data || []).map(m => normalizeMessage(m, currentUserId));
      setMessages(normalized);
      markMessagesRead(chat.id).catch(() => {});
    } catch (err) {
      console.error('Failed to load messages:', err);
    }
  }, [currentUserId]);

  const handleSelectChat = (chat) => {
    if (!chat.accepted && chat.direction !== 'received') return;
    stopMessagePolling();
    setVisibleChat(chat);
    setReplyTo(null);
    setMessages([]);
    setIsTyping(false);
    loadMessages(chat);
    requestAnimationFrame(() => requestAnimationFrame(() => setSelectedChat(chat)));
  };

  const handleBack = () => {
    stopMessagePolling();
    setSelectedChat(null);
    setTimeout(() => setVisibleChat(null), 300);
  };

  const handleAccept = async () => {
    if (!visibleChat?.requestId) return;
    try { await acceptChatRequest(visibleChat.requestId); } catch (err) { console.error(err); }
    handleBack();
    if (onRefreshListRef.current) onRefreshListRef.current('reload');
  };

  const handleReject = async () => {
    if (!visibleChat?.requestId) return;
    try { await rejectChatRequest(visibleChat.requestId); } catch (err) { console.error(err); }
    handleBack();
    if (onRefreshListRef.current) onRefreshListRef.current('reload');
  };

  const handleSend = async ({ content, replyTo: replyToMsg, file, voice, images, caption, gif }) => {
    if (!visibleChat?.id) return;

    const clientMsgId = generateClientId();
    const optimisticMsg = {
      id: clientMsgId,
      client_message_id: clientMsgId,
      senderId: 'me',
      content: content || caption || '',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      created_at: new Date().toISOString(),
      read: false,
      replyTo: replyToMsg || null,
      status: 'sending',
      file: file || null,
      voice: voice || null,
      images: images || null,
      gif: gif || null,
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setReplyTo(null);
    isSendingRef.current = true;

    try {
      let type = 'text';
      let file_url = null;

      if (file && file.file) {
        type = file.type || 'file';
        file_url = await uploadFile(file.file);
      } else if (file) {
        type = file.type || 'file';
        file_url = file.url;
      } else if (voice && voice.blob) {
        type = 'voice';
        file_url = await uploadFile(new File([voice.blob], 'voice.ogg', { type: 'audio/ogg' }));
      } else if (images?.length) {
        type = 'image';
        const imgFile = images[0].file || null;
        file_url = imgFile ? await uploadFile(imgFile) : images[0].url;
      } else if (gif) {
        type = 'gif';
        file_url = gif.url;
      }

      const data = await sendMessage(visibleChat.id, {
        content: content || caption || '',
        type,
        file_url,
        client_message_id: clientMsgId,
      });

      if (data) {
        const realMsg = normalizeMessage(data, currentUserId);
        setMessages(prev => prev.map(m =>
          m.client_message_id === clientMsgId ? { ...realMsg, isNew: true } : m
        ));
        if (onRefreshListRef.current) onRefreshListRef.current('reload');
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setMessages(prev => prev.map(m =>
        m.client_message_id === clientMsgId ? { ...m, status: 'failed' } : m
      ));
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleDelete = (id) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return (
    <Box sx={{
      display: 'flex', height: '100dvh', overflow: 'hidden',
      position: 'relative', bgcolor: 'background.default',
    }}>
      <Box sx={{
        flexShrink: 0, height: '100%',
        position: { xs: 'absolute', lg: 'relative' },
        width: { xs: '100%', lg: 400 }, zIndex: 1,
        transform: { xs: selectedChat ? 'translateX(-100%)' : 'translateX(0)', lg: 'none' },
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
            <ChatList
            onSelectChat={handleSelectChat}
            selectedChat={selectedChat}
            connState={connState}
            onRegisterRefresh={(fn) => { onRefreshListRef.current = fn; }}
            />
      </Box>

      <Box
        ref={chatPanelRef}
        sx={{
          flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden',
          height: '100dvh', position: { xs: 'fixed', lg: 'relative' },
          width: { xs: '100%', lg: 'auto' }, right: 0, top: 0, zIndex: 2,
          transform: { xs: selectedChat ? 'translateX(0)' : 'translateX(100%)', lg: 'none' },
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        onTouchStart={e => {
          const x = e.touches[0].clientX;
          if (x < window.innerWidth - 40) return;
          touchStartX.current = x;
        }}
        onTouchEnd={e => {
          if (!touchStartX.current) return;
          const dx = e.changedTouches[0].clientX - touchStartX.current;
          if (dx > 60) handleBack();
          touchStartX.current = null;
        }}
      >
        {visibleChat ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' , width:"100%" }}>
            <ChatHeader chat={visibleChat} onBack={handleBack} />
            {!visibleChat.accepted && visibleChat.direction === 'received' ? (
              <Box sx={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 2, p: 3,
              }}>
                <Avatar sx={{ width: 80, height: 80, bgcolor: 'primary.main', fontSize: 32 }}>
                  {visibleChat.avatar}
                </Avatar>
                <Typography fontWeight={600} fontSize={18}>{visibleChat.name}</Typography>
                <Typography fontSize={14} color="text.secondary" textAlign="center">
                  میخواد باهات چت کنه
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                  <Box onClick={handleReject} sx={{
                    px: 4, py: 1.2, borderRadius: 2, cursor: 'pointer',
                    bgcolor: 'error.main', color: 'white', fontWeight: 600, fontSize: 15,
                    '&:active': { opacity: 0.8 },
                  }}>رد کردن</Box>
                  <Box onClick={handleAccept} sx={{
                    px: 4, py: 1.2, borderRadius: 2, cursor: 'pointer',
                    bgcolor: 'primary.main', color: 'white', fontWeight: 600, fontSize: 15,
                    '&:active': { opacity: 0.8 },
                  }}>قبول کردن</Box>
                </Box>
              </Box>
            ) : (
              <>
                <MessageList
                  messages={messages}
                  onReply={setReplyTo}
                  onDelete={handleDelete}
                  isTyping={isTyping}
                  firstUnreadId={firstUnreadId}
                />
                <MessageInput
                  onSend={handleSend}
                  replyTo={replyTo}
                  onCancelReply={() => setReplyTo(null)}
                />
              </>
            )}
          </Box>
        ) : (
          <Box sx={{
            flex: 1, display: { xs: 'none', lg: 'flex' },
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography color="text.secondary">Select a chat to start messaging</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}