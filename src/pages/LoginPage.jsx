import { Box, Typography, InputBase, IconButton, Tabs, Tab } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useState } from 'react';
import { login, register } from '../lib/api';

function InfoBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <Box sx={{
      bgcolor: 'rgba(255,193,7,0.1)',
      border: '1px solid rgba(255,193,7,0.25)',
      borderRadius: 2,
      px: 2, py: 1.5,
      mb: 2.5,
      position: 'relative',
    }}>
      <IconButton
        size="small"
        onClick={() => setVisible(false)}
        sx={{ position: 'absolute', top: 4, right: 4, p: 0.3, color: 'text.secondary' }}
      >
        <Typography fontSize={14} lineHeight={1}>✕</Typography>
      </IconButton>
      <Typography fontSize={13} color="warning.main" fontWeight={600} mb={0.5}>
        ⚠️ توجه
      </Typography>
      <Typography fontSize={12} color="text.secondary" lineHeight={1.7}>
        این یه پیام‌رسان ساده و خودمونیه. برای سرعت و ترافیک پایین طراحی شده و امنیت بالایی نداره. لطفاً حواستون باشه.
        <br />
        باهاش می‌تونید بدون محدودیت و با راحتی با عزیزانتون توی ایران صحبت کنید.
      </Typography>
    </Box>
  );
}

function InputField({ icon, placeholder, value, onChange, type = 'text', endIcon, onKeyDown }) {
  const [focused, setFocused] = useState(false);
  return (
    <Box sx={{
      display: 'flex', alignItems: 'center', gap: 1.5,
      bgcolor: 'background.paper',
      borderRadius: 2, px: 2, py: 1.5,
      border: '1.5px solid',
      borderColor: focused ? 'primary.main' : 'transparent',
      transition: 'border-color 0.2s',
    }}>
      <Box sx={{ color: focused ? 'primary.main' : 'text.secondary', transition: 'color 0.2s', display: 'flex' }}>
        {icon}
      </Box>
      <InputBase
        fullWidth
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        type={type}
        sx={{ fontSize: 15 }}
        inputProps={{ autoCapitalize: 'off', autoCorrect: 'off' }}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKeyDown}
      />
      {endIcon}
    </Box>
  );
}

export default function LoginPage({ onLogin }) {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('نام کاربری و رمز عبور رو وارد کن');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let data;
      if (tab === 0) {
        data = await login({ username, password });
      } else {
        data = await register({ username, password });
      }
      const user = data?.user || { username, id: Date.now() };
      onLogin(user);
    } catch (err) {
      setError(err.message || 'خطا در ورود');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100dvh',
      bgcolor: 'background.default',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
    }}>
      <Box sx={{ width: '100%', maxWidth: 360 }}>

        {/* لوگو */}
        <Box sx={{ textAlign: 'center', mb: 3.5 }}>
          <Box sx={{
            width: 76, height: 76,
            bgcolor: 'primary.main',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2,
            boxShadow: '0 8px 32px rgba(42,171,238,0.35)',
          }}>
            <Typography fontSize={34}>✈️</Typography>
          </Box>
          <Typography fontSize={26} fontWeight={700} letterSpacing={1}>ZPV</Typography>
          <Typography fontSize={13} color="text.secondary" mt={0.5}>
            {tab === 0 ? 'خوش برگشتی' : 'حساب جدید بساز'}
          </Typography>
        </Box>

        {/* بنر اطلاعاتی */}
        <InfoBanner />

        {/* تب‌ها */}
        <Box sx={{
          display: 'flex',
          bgcolor: 'background.paper',
          borderRadius: 2,
          p: 0.5,
          mb: 2.5,
          gap: 0.5,
        }}>
          {['ورود', 'ثبت‌نام'].map((label, i) => (
            <Box
              key={i}
              onClick={() => { setTab(i); setError(''); }}
              sx={{
                flex: 1, textAlign: 'center',
                py: 1, borderRadius: 1.5,
                fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
                bgcolor: tab === i ? 'primary.main' : 'transparent',
                color: tab === i ? 'white' : 'text.secondary',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </Box>
          ))}
        </Box>

        {/* فرم */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <InputField
            icon={<PersonIcon sx={{ fontSize: 20 }} />}
            placeholder="نام کاربری"
            value={username}
            onChange={e => { setUsername(e.target.value); setError(''); }}
          />

          <InputField
            icon={<LockIcon sx={{ fontSize: 20 }} />}
            placeholder="رمز عبور"
            value={password}
            onChange={e => { setPassword(e.target.value); setError(''); }}
            type={showPassword ? 'text' : 'password'}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            endIcon={
              <IconButton size="small" onClick={() => setShowPassword(p => !p)} sx={{ p: 0.5 }}>
                {showPassword
                  ? <VisibilityOffIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                  : <VisibilityIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
                }
              </IconButton>
            }
          />

          {error && (
            <Box sx={{
              bgcolor: 'rgba(244,67,54,0.1)',
              border: '1px solid rgba(244,67,54,0.2)',
              borderRadius: 1.5, px: 2, py: 1,
            }}>
              <Typography fontSize={13} color="error" textAlign="center">{error}</Typography>
            </Box>
          )}

          <Box
            onClick={!loading ? handleSubmit : undefined}
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
              bgcolor: loading ? 'action.disabled' : 'primary.main',
              color: 'white',
              borderRadius: 2, py: 1.6, mt: 0.5,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 15,
              boxShadow: loading ? 'none' : '0 4px 16px rgba(42,171,238,0.35)',
              transition: 'all 0.2s',
              '&:active': { opacity: loading ? 1 : 0.85, transform: 'scale(0.98)' },
            }}
          >
            {loading ? (
              <Box sx={{ display: 'flex', gap: 0.6, alignItems: 'center' }}>
                {[0,1,2].map(i => (
                  <Box key={i} sx={{
                    width: 6, height: 6, borderRadius: '50%', bgcolor: 'white',
                    animation: 'btn-dot 1.2s ease-in-out infinite',
                    animationDelay: `${i * 0.2}s`,
                    '@keyframes btn-dot': {
                      '0%,100%': { opacity: 0.3, transform: 'translateY(0)' },
                      '50%': { opacity: 1, transform: 'translateY(-3px)' },
                    },
                  }} />
                ))}
              </Box>
            ) : (
              <>
                {tab === 0 ? 'ورود' : 'ثبت‌نام'}
                <ArrowForwardIcon fontSize="small" />
              </>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}