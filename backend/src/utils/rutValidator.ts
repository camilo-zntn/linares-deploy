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
 * Formatea el RUT con puntos y guión
 */
export const formatRut = (rut: string): string => {
  const cleaned = cleanRut(rut);
  if (cleaned.length < 2) return cleaned;
  
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Agregar puntos cada 3 dígitos desde la derecha
  const formattedBody = body.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
  
  return `${formattedBody}-${dv}`;
};

/**
 * Calcula el dígito verificador de un RUT
 */
export const calculateDV = (rutBody: string): string => {
  let sum = 0;
  let multiplier = 2;
  
  // Recorrer desde el último dígito hacia el primero
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
  
  // Verificar longitud mínima y máxima
  if (cleaned.length < 8 || cleaned.length > 9) {
    return {
      isValid: false,
      message: 'RUT debe tener entre 8 y 9 caracteres'
    };
  }
  
  // Separar cuerpo y dígito verificador
  const body = cleaned.slice(0, -1);
  const dv = cleaned.slice(-1);
  
  // Verificar que el cuerpo sean solo números
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
  
  // Calcular y verificar dígito verificador
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
    formattedRut: formatRut(cleaned),
    message: 'RUT válido'
  };
};

/**
 * Middleware para validar RUT en requests
 */
export const validateRutMiddleware = (rutField: string = 'rut') => {
  return (req: any, res: any, next: any) => {
    const rut = req.body[rutField];
    
    if (!rut) {
      return res.status(400).json({
        success: false,
        message: 'RUT es requerido'
      });
    }
    
    const validation = validateRut(rut);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.message
      });
    }
    
    // Agregar RUT limpio al request para uso posterior
    req.body[rutField] = validation.cleanRut;
    req.body[`${rutField}Formatted`] = validation.formattedRut;
    
    next();
  };
};