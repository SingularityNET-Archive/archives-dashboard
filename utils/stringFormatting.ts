// utils/stringFormatting.ts
export function formatEffectType(effect: string): string {
  if (!effect) return '';
  
  // Convert camelCase to space-separated words and capitalize first letter
  return effect
    // Insert space before capital letters
    .replace(/([A-Z])/g, ' $1')
    // Remove potential space at the start if string began with capital
    .trim()
    // Ensure first letter is capital and rest are lowercase
    .charAt(0).toUpperCase() + effect.replace(/([A-Z])/g, ' $1').trim().slice(1).toLowerCase();
}