export const generateAdminCode = (): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '@_#!';
  
  // Ensure at least one of each required character type
  let code = '';
  code += letters[Math.floor(Math.random() * letters.length)];
  code += numbers[Math.floor(Math.random() * numbers.length)];
  code += symbols[Math.floor(Math.random() * symbols.length)];
  
  const allChars = letters + numbers + symbols;
  // Fill the rest to reach 8-12 length
  const length = Math.floor(Math.random() * 5) + 8; // 8 to 12
  for (let i = code.length; i < length; i++) {
    code += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle
  return code.split('').sort(() => 0.5 - Math.random()).join('');
};
