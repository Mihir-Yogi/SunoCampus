import jwt from 'jsonwebtoken';

export const generateJWT = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'your_super_secret_key_change_in_production',
    { expiresIn: '7d' }
  );
};

export default generateJWT;
