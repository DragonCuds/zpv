import { Box, Typography } from '@mui/material';

export default function ChatLoadingScreen() {
  return (
    <Box sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 2,
      bgcolor: 'transparent',
    }}>
      {/* حباب‌های انیمیشن */}
      <Box sx={{ display: 'flex', gap: 1.2, alignItems: 'flex-end', height: 40 }}>
        {[0, 1, 2, 3].map(i => (
          <Box
            key={i}
            sx={{
              width: i === 1 || i === 2 ? 14 : 10,
              bgcolor: 'primary.main',
              borderRadius: 10,
              opacity: 0.85,
              animation: 'chat-load 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`,
              '@keyframes chat-load': {
                '0%, 100%': { height: '10px', opacity: 0.4 },
                '50%': { height: i === 1 || i === 2 ? '36px' : '24px', opacity: 1 },
              },
            }}
          />
        ))}
      </Box>

      <Typography fontSize={13} color="text.secondary" sx={{ letterSpacing: 0.3 }}>
        در حال بارگذاری...
      </Typography>
    </Box>
  );
}