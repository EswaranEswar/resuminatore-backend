export const getCookieOptions = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isProd = nodeEnv === 'production';

  let sameSite = (process.env.COOKIE_SAMESITE || 'lax') as
    | 'lax'
    | 'strict'
    | 'none';
  let secure = process.env.COOKIE_SECURE === 'true';

  if (isProd) {
    if (sameSite === 'none') secure = true;
  } else {
    secure = false;
    if (sameSite === 'none') {
      sameSite = 'lax';
    }
  }

  return {
    secure,
    sameSite,
  };
};
