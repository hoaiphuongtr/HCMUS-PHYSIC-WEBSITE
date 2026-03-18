import { randomInt } from 'crypto';

export const generateOTP = () => {
  return String(randomInt(100000, 1000000));
};
