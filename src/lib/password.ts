import 'server-only';
import bcrypt from 'bcryptjs';

export const MIN_PASSWORD_LENGTH = 8;

export const hashPassword = (password: string) => bcrypt.hash(password, 12);

// RFC 5321: maksymalna długość adresu e-mail
export const MAX_EMAIL_LENGTH = 254;
