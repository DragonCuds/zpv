import { Box, Typography, InputBase, CircularProgress } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import PersonIcon from '@mui/icons-material/Person';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendChatRequest, searchUsers } from '../lib/api';

export default function RequestChat({ onClose, onRequest }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setError('نام کاربری رو وارد کن');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendChatRequest({ receiver_username: trimmed });
      setSuccess(true);
      if (onRequest) onRequest({ username: trimmed });
      setTimeout(() => navigate('/chat'), 1200);
    } catch (err) {
      setError(err.message || 'خطا در ارسال درخواست');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* backdrop */}
      <Box
        onClick={() => navigate('/chat')}
        sx={{
          position: 'fixed', inset: 0, zIndex: 100,
          bgcolor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
        }}
      />

      {/* modal */}
      <Box sx={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 101,
        bgcolor: 'background.paper',
        borderRadius: 3,
        p: 3,
        width: { xs: 'calc(100% - 48px)', sm: 400 },
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      }}>
        {/* هدر */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Typography fontSize={16} fontWeight={600}>چت جدید</Typography>
          <Box
            onClick={() => navigate('/chat')}
            sx={{
              px: 2, py: 0.8, borderRadius: 2, cursor: 'pointer',
              bgcolor: 'primary.main', color: 'white',
              fontWeight: 600, fontSize: 14,
              '&:active': { opacity: 0.85 },
            }}
          >
            برگشت
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {/* نام کاربری */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 1.5,
            bgcolor: 'background.default', borderRadius: 2, px: 2, py: 1.5,
          }}>
            <PersonIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
            <InputBase
              fullWidth
              placeholder="نام کاربری"
              value={username}
              onChange={e => { setUsername(e.target.value); setError(''); setSuccess(false); }}
              sx={{ fontSize: 15 }}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              inputProps={{ autoCapitalize: 'off', autoCorrect: 'off' }}
            />
          </Box>

          {error && (
            <Typography fontSize={13} color="error" textAlign="center">
              {error}
            </Typography>
          )}

          {success && (
            <Typography fontSize={13} color="success.main" textAlign="center">
              ✅ درخواست ارسال شد!
            </Typography>
          )}

          {/* دکمه ارسال */}
          <Box
            onClick={!loading && !success ? handleSubmit : undefined}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
              bgcolor: success ? 'success.main' : loading ? 'action.disabled' : 'primary.main',
              color: 'white',
              borderRadius: 2, py: 1.5, mt: 1,
              cursor: loading || success ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 15,
              '&:active': { opacity: loading || success ? 1 : 0.85 },
              transition: 'background-color 0.2s',
            }}
          >
            {loading ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : success ? (
              '✅ ارسال شد'
            ) : (
              <>
                ارسال درخواست
                <ArrowForwardIcon fontSize="small" />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </>
  );
}