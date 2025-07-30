// Caracteres seguros separados por tipo
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const NUMBERS = '23456789';
const SAFE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

// Función para garantizar combinación de números y letras
export const generateReferralCode = (length: number = 6): string => {
  if (length < 2) {
    throw new Error('La longitud mínima debe ser 2 para garantizar números y letras');
  }

  let result = '';
  
  // Garantizar al menos una letra y un número
  result += LETTERS.charAt(Math.floor(Math.random() * LETTERS.length));
  result += NUMBERS.charAt(Math.floor(Math.random() * NUMBERS.length));
  
  // Completar el resto con caracteres aleatorios
  for (let i = 2; i < length; i++) {
    result += SAFE_CHARS.charAt(Math.floor(Math.random() * SAFE_CHARS.length));
  }
  
  // Mezclar los caracteres para que la letra y número no estén siempre al inicio
  return result.split('').sort(() => Math.random() - 0.5).join('');
};

export const generateUniqueReferralCode = async (): Promise<string> => {
  const { UserModel } = await import('../models/user.model');
  
  let code: string;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (!isUnique && attempts < maxAttempts) {
    code = generateReferralCode();
    const existingUser = await UserModel.findOne({ referralCode: code });
    if (!existingUser) {
      isUnique = true;
      return code;
    }
    attempts++;
  }
  
  // Si no se pudo generar un código único, usar timestamp
  // Garantizar que el fallback también tenga números y letras
  const fallbackCode = generateReferralCode(4) + Date.now().toString().slice(-2);
  return fallbackCode;
};