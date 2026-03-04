export const getCookieOptions = (
  nodeEnv: string = 'development',
  envSameSite: string = 'lax',
  envSecure: boolean = false,
) => {
  const isProd = nodeEnv.toLowerCase() === 'production';

  let sameSite = envSameSite as 'lax' | 'strict' | 'none';
  let secure = envSecure;

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
    httpOnly: true,
    path: '/',
  };
};
