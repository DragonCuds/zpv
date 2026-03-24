import { Box, Typography, Avatar, IconButton, Button } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CallIcon from '@mui/icons-material/Call';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

export default function ChatHeader({ chat, onBack }) {
  if (!chat) return null;

  return (
    <Box sx={{
      flexShrink: 0,
      position: 'sticky',  // ← اضافه کن
      top: 0,              // ← اضافه کن
      zIndex: 10,          // ← اضافه کن
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      px: 1,
      py: 1,
      bgcolor: 'background.paper',
      borderBottom: '1px solid',
      borderColor: 'divider',
      minHeight: 56,
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <IconButton onClick={onBack} sx={{ display: { lg: 'none' } }} size="small">
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
          {chat.avatar}
        </Avatar>
        <Box sx={{ ml: 1 }}>
          <Typography fontWeight={600} fontSize={15} lineHeight={1.2}>
            {chat.name}
          </Typography>
          <Typography fontSize={12} color="text.secondary">
            online
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <IconButton size="small"><SearchIcon fontSize="small" /></IconButton>
        <IconButton size="small"><CallIcon fontSize="small" /></IconButton>
        <IconButton size="small"><MoreVertIcon fontSize="small" /></IconButton>
      </Box>
    </Box>
  );
}