export const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string) => {
  return /^[A-Za-z0-9@_#!]{6,12}$/.test(password);
};

export const validateUsername = (username: string) => {
  return /^[A-Za-z0-9_]{3,30}$/.test(username);
};
