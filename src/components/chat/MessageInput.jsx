import { Box, IconButton, InputBase, Typography } from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import MicIcon from '@mui/icons-material/Mic';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import StopIcon from '@mui/icons-material/Stop';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import ImageIcon from '@mui/icons-material/Image';
import VideocamIcon from '@mui/icons-material/Videocam';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import { useState, useRef } from 'react';
import { useReactMediaRecorder } from 'react-media-recorder';
import ImageUploadSheet from './ImageUploadSheet';
import GifPicker from './GifPicker';

const EMOJIS = [
  '😀','😂','🥰','😎','🤔','😭','😡','🥳','😴','🤯',
  '👍','👎','❤️','🔥','💯','🎉','🙏','👀','💪','🤝',
  '😊','😅','🤣','😍','🥺','😤','😳','🤗','😬','🫡',
  '⚡','✨','💥','🎯','🚀','💎','🌟','👑','🎭','🤡',
];

export default function MessageInput({ onSend, replyTo, onCancelReply }) {
  const [text, setText] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadFiles, setUploadFiles] = useState(null);
  const [showGif, setShowGif] = useState(false);
  const fileRef = useRef();
  const imageRef = useRef();
  const videoRef = useRef();
  const inputRef = useRef();
  const timerRef = useRef();
  const hasText = text.trim().length > 0;

  const { startRecording, stopRecording } = useReactMediaRecorder({
    audio: true,
    onStop: (blobUrl, blob) => {
      onSend({ content: '', replyTo, voice: { url: blobUrl, blob, duration: recordingTime } });
      setRecordingTime(0);
    },
  });

  const handleSend = () => {
    if (!text.trim()) return;
    onSend({ content: text, replyTo });
    setText('');
    setShowEmoji(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleEmojiClick = (emoji) => {
    setText(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFile = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onSend({ content: '', replyTo, file: { name: file.name, size: formatSize(file.size), url, type } });
    e.target.value = '';
    setShowAttach(false);
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    startRecording();
    timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    stopRecording();
    clearInterval(timerRef.current);
  };

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <Box sx={{
      flexShrink: 0,
      bgcolor: 'background.paper',
      borderLeft:"1px solid gray",
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255,255,255,0.07)',
    }}>

      {uploadFiles && (
        <ImageUploadSheet
          initialFiles={uploadFiles}
          onSend={(data) => onSend({ ...data, replyTo })}
          onClose={() => setUploadFiles(null)}
        />
      )}

      {/* ریپلای */}
      {replyTo && (
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2, py: 1,
          borderLeft: '3px solid', borderColor: 'primary.main',
          bgcolor: 'rgba(255,255,255,0.04)',
          mx: 1, mt: 1, borderRadius: '0 8px 8px 0',
        }}>
          <Box sx={{ minWidth: 0 }}>
            <Box sx={{ fontSize: 12, color: 'primary.main', fontWeight: 600, mb: 0.2 }}>
              {replyTo.senderName || 'You'}
            </Box>
            <Box sx={{ fontSize: 12, color: 'text.secondary', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {replyTo.content}
            </Box>
          </Box>
          <IconButton size="small" onClick={onCancelReply} sx={{ color: 'text.secondary', ml: 1 }}>
            <CloseIcon sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      )}

      {/* emoji picker */}
      {showEmoji && (
        <Box sx={{
          display: 'flex', flexWrap: 'wrap', gap: 0.3,
          p: 1.5, maxHeight: 180, overflowY: 'auto',
          bgcolor: 'rgba(255,255,255,0.03)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          {EMOJIS.map(emoji => (
            <Box key={emoji} onClick={() => handleEmojiClick(emoji)} sx={{
              fontSize: 22, cursor: 'pointer', p: 0.4, borderRadius: 1.5,
              transition: 'transform 0.1s',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', transform: 'scale(1.2)' },
              '&:active': { transform: 'scale(0.9)' },
            }}>
              {emoji}
            </Box>
          ))}
        </Box>
      )}

      {/* attach menu */}
      {showAttach && (
        <Box sx={{
          display: 'flex', gap: 2, px: 2, py: 1.5,
          bgcolor: 'background.paper',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          justifyContent: 'center',
        }}>
          {[
            { icon: <ImageIcon sx={{ fontSize: 22, color: 'white' }} />, label: 'Photo', color: '#2AABEE', onClick: () => imageRef.current.click() },
            { icon: <VideocamIcon sx={{ fontSize: 22, color: 'white' }} />, label: 'Video', color: '#E91E8C', onClick: () => videoRef.current.click() },
            { icon: <InsertDriveFileIcon sx={{ fontSize: 22, color: 'white' }} />, label: 'File', color: '#9C27B0', onClick: () => fileRef.current.click() },
          ].map(item => (
            <Box key={item.label} onClick={item.onClick} sx={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.6,
              cursor: 'pointer',
              '&:active': { opacity: 0.7 },
            }}>
              <Box sx={{
                bgcolor: item.color, borderRadius: '50%', p: 1.4,
                display: 'flex', boxShadow: `0 4px 12px ${item.color}55`,
                transition: 'transform 0.15s',
                '&:hover': { transform: 'scale(1.08)' },
              }}>
                {item.icon}
              </Box>
              <Box sx={{ fontSize: 11, color: 'text.secondary' }}>{item.label}</Box>
            </Box>
          ))}
        </Box>
      )}

      {/* GIF picker */}
      {showGif && (
        <GifPicker
          onSelect={(gif) => {
            onSend({ content: '', replyTo, gif: { url: gif.url, name: gif.name } });
            setShowGif(false);
          }}
          onClose={() => setShowGif(false)}
        />
      )}

      {/* hidden inputs */}
      <input ref={imageRef} type="file" accept="image/*" multiple hidden
        onChange={e => {
          const files = Array.from(e.target.files);
          if (!files.length) return;
          setUploadFiles(files.map(f => ({ file: f, url: URL.createObjectURL(f), name: f.name })));
          setShowAttach(false);
          e.target.value = '';
        }}
      />
      <input ref={videoRef} type="file" accept="video/*" hidden onChange={e => handleFile(e, 'video')} />
      <input ref={fileRef} type="file" hidden onChange={e => handleFile(e, 'file')} />

      {/* recording */}
      {isRecording ? (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          px: 2, py: 1.5, pb: { xs: 3.5, lg: 1.5 },
        }}>
          <Box sx={{
            width: 8, height: 8, borderRadius: '50%', bgcolor: '#f44336',
            animation: 'rec-pulse 1s ease-in-out infinite',
            '@keyframes rec-pulse': { '0%,100%': { opacity: 1, transform: 'scale(1)' }, '50%': { opacity: 0.4, transform: 'scale(0.8)' } },
            flexShrink: 0,
          }} />
          <Typography fontSize={14} color="error.main" fontWeight={500} sx={{ flex: 1 }}>
            {formatTime(recordingTime)}
          </Typography>
          <IconButton onClick={handleStopRecording} sx={{
            bgcolor: '#f44336', color: 'white', width: 40, height: 40,
            '&:hover': { bgcolor: '#d32f2f' },
            boxShadow: '0 2px 8px rgba(244,67,54,0.4)',
          }}>
            <StopIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>
      ) : (
        <Box sx={{
          display: 'flex', alignItems: 'center', gap: 0.5,
          px: 1, py: 1, pb: { xs: 3, lg: 1 },
        }}>
          {/* attach */}
          <IconButton
            size="small"
            onClick={() => { setShowAttach(p => !p); setShowEmoji(false); setShowGif(false); }}
            sx={{
              color: showAttach ? 'primary.main' : 'text.secondary',
              transition: 'color 0.2s',
              mb: 0.3,
            }}
          >
            <AttachFileIcon sx={{ fontSize: 22 }} />
          </IconButton>

          {/* input box */}
          <Box sx={{
            flex: 1,
            display: 'flex', alignItems: 'center',
            bgcolor: 'rgba(255,255,255,0.07)',
            borderRadius: 3,
            px: 1.5, py: 0.3,
            gap: 0.5,
            border: '1px solid rgba(255,255,255,0.08)',
            transition: 'border-color 0.2s',
            '&:focus-within': { borderColor: 'rgba(42,171,238,0.4)' },
          }}>
            <InputBase
              inputRef={inputRef}
              fullWidth
              multiline
              maxRows={5}
              placeholder="Message"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKey}
              inputProps={{ autoCorrect: 'off', autoCapitalize: 'off', spellCheck: false }}
              sx={{
                fontSize: 15, flex: 1,
                '& textarea': { py: 0.3, lineHeight: 1.5 },
              }}
            />

            {/* emoji */}
            <IconButton
              size="small"
              onClick={() => { setShowEmoji(p => !p); setShowAttach(false); setShowGif(false); }}
              sx={{
                p: 0.4, mb: 0.2,
                color: showEmoji ? 'primary.main' : 'text.secondary',
                transition: 'color 0.2s, transform 0.2s',
                '&:hover': { transform: 'scale(1.15)' },
              }}
            >
              <EmojiEmotionsOutlinedIcon sx={{ fontSize: 20 }} />
            </IconButton>

            {/* GIF */}
            <Box
              onClick={() => { setShowGif(p => !p); setShowEmoji(false); setShowAttach(false); }}
              sx={{
                px: 0.6, py: 0.2, 
                fontSize: 11, fontWeight: 700,
                color: showGif ? 'primary.main' : 'text.secondary',
                cursor: 'pointer', borderRadius: 1,
                lineHeight: 1.4,
                transition: 'color 0.2s, border-color 0.2s',
                userSelect: 'none',
                '&:hover': { color: 'primary.main', borderColor: 'primary.main' },
              }}
            >
              GIF
            </Box>
          </Box>

          {/* mic / send */}
          <Box sx={{ position: 'relative', width: 42, height: 42, flexShrink: 0, mb: 0.2 }}>
            {/* mic */}
            <IconButton
              size="small"
              onTouchStart={handleStartRecording}
              onClick={!('ontouchstart' in window) ? handleStartRecording : undefined}
              sx={{
                position: 'absolute', inset: 0,
                color: 'text.secondary',
                opacity: hasText ? 0 : 1,
                transform: hasText ? 'scale(0.5) rotate(-90deg)' : 'scale(1) rotate(0deg)',
                transition: 'opacity 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                pointerEvents: hasText ? 'none' : 'auto',
              }}
            >
              <MicIcon sx={{ fontSize: 22 }} />
            </IconButton>

            {/* send */}
            <IconButton
              size="small"
              onClick={handleSend}
              sx={{
                position: 'absolute', inset: 0,
                bgcolor: 'primary.main',
                color: 'white',
                opacity: hasText ? 1 : 0,
                transform: hasText ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(90deg)',
                transition: 'opacity 0.2s, transform 0.25s cubic-bezier(0.34,1.56,0.64,1)',
                pointerEvents: hasText ? 'auto' : 'none',
                boxShadow: hasText ? '0 2px 12px rgba(42,171,238,0.45)' : 'none',
                '&:hover': { bgcolor: 'primary.dark', transform: 'scale(1.05)' },
                '&:active': { transform: 'scale(0.95)' },
              }}
            >
              <SendIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Box>
        </Box>
      )}
    </Box>
  );
}