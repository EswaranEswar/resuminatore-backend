export const hashConstants = {
  saltRounds: 10,
};
export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'secretKey',
  accessExpiry: '1d',
  refreshExpiry: '7d',
};


