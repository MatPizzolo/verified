/**
 * Price Utility Functions
 * 
 * Shared utilities for price conversion between pesos and centavos
 * Ensures consistent handling across all components
 */

/**
 * Convert user input (pesos) to centavos (integers) for backend
 * @param pesos - Price in pesos (e.g., 100000.50)
 * @returns Price in centavos (e.g., 10000050)
 * @throws Error if price is invalid
 */
export function pesosTocentavos(pesos: number): number {
  if (isNaN(pesos) || pesos <= 0) {
    throw new Error('Price must be a positive number');
  }
  
  // Multiply by 100 and round to ensure integer
  return Math.round(pesos * 100);
}

/**
 * Convert centavos to pesos for display
 * @param centavos - Price in centavos (e.g., 10000050)
 * @returns Price in pesos (e.g., 100000.50)
 */
export function centavosToPesos(centavos: number): number {
  return centavos / 100;
}

/**
 * Format price for display in Argentine locale
 * @param centavos - Price in centavos
 * @returns Formatted string (e.g., "$100.000,50")
 */
export function formatPrice(centavos: number): string {
  const pesos = centavosToPesos(centavos);
  return pesos.toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Validate that a price is a valid positive number
 * @param price - Price to validate
 * @returns true if valid, false otherwise
 */
export function isValidPrice(price: number): boolean {
  return !isNaN(price) && price > 0 && isFinite(price);
}
