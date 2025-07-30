export interface RutValidationResult {
  isValid: boolean;
  cleanRut?: string;
  formattedRut?: string;
  message?: string;
}

/**
 * Limpia el RUT removiendo puntos, guiones y espacios
 */
export const cleanRut = (rut: string): string => {
  return rut.replace(/[^0-9kK]/g, '').toUpperCase();
};

/**
 * Formatea el RUT con puntos y guión mientras el usuario escribe
 */
export const formatRutAsUserTypes = (value: string): string => {
  // Limpiar el valor
  const cleaned = cleanRut(value);
  
  // Limitar a 9 caracteres máximo
  const limited = cleaned.slice(0, 9);
  
  if (limited.length <= 1) return limited;
  
  // Separar cuerpo y dígito verificador
  const body = limited.slice(0, -1);
  const dv = limited.slice(-1);
  
  // Formatear el cuerpo con puntos
  const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  
  // Si hay dígito verificador, agregarlo con guión
  if (dv) {
    return `${formattedBody}-${dv}`;
  }
  
  return formattedBody;
};

/**
 * Calcula el dígito verificador de un RUT
 */
export const calculateDV = (rutBody: string): string => {
  let sum = 0;
  let multiplier = 2;
  
  for (let i = rutBody.length - 1; i >= 0; i--) {
    sum += parseInt(rutBody[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  
  const remainder = sum % 11;
  const dv = 11 - remainder;
  
  if (dv === 11) return '0';
  if (dv === 10) return 'K';
  return dv.toString();
};

/**
 * Verifica si un RUT tiene dígitos repetitivos o secuenciales
 */
export const hasInvalidPattern = (rutBody: string): boolean => {
  // Verificar si todos los dígitos son iguales
  const allSame = rutBody.split('').every(digit => digit === rutBody[0]);
  if (allSame) return true;
  
  // Verificar secuencias ascendentes o descendentes
  let ascending = true;
  let descending = true;
  
  for (let i = 1; i < rutBody.length; i++) {
    const current = parseInt(rutBody[i]);
    const previous = parseInt(rutBody[i - 1]);
    
    if (current !== previous + 1) ascending = false;
    if (current !== previous - 1) descending = false;
  }
  
  return ascending || descending;
};

/**
 * Valida un RUT chileno
 */
export const validateRut = (rut: string): RutValidationResult => {
  if (!rut || typeof rut !== 'string') {
    return {
      isValid: false,
      message: 'RUT es requerido'
    };
  }
  
  const cleaned = cleanRut(rut);
  
  if (cleaned.length < 8 || cleaned.length > 9) {
    return {
      isValid: false,
      message: 'RUT debe tener entre 8 y 9 caracteres'
    };
  }
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  if (!/^\d+$/.test(body)) {
    return {
      isValid: false,
      message: 'RUT contiene caracteres inválidos'
    };
  }
  
  // Verificar patrones inválidos (dígitos repetitivos o secuenciales)
  if (hasInvalidPattern(body)) {
    return {
      isValid: false,
      message: 'RUT no puede tener todos los dígitos iguales o en secuencia'
    };
  }
  
  const calculatedDV = calculateDV(body);
  
  if (dv !== calculatedDV) {
    return {
      isValid: false,
      message: 'RUT inválido'
    };
  }
  
  return {
    isValid: true,
    cleanRut: cleaned,
    formattedRut: formatRutAsUserTypes(cleaned),
    message: 'RUT válido'
  };
};