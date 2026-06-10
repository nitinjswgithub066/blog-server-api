export const calculateReadingTime = (html: string) => {
  const plainText = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  const words = plainText ? plainText.split(/\s+/).length : 0;
  return Math.max(1, Math.ceil(words / 200));
};
