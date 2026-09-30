// Test helper: a test person's public id is the Telegram ID in hex, so a test reads both ways.
export const publicIdOf = (id: number) => id.toString(16).padStart(32, '0');
export const idOfPublic = async (publicId: string) => {
  const id = Number.parseInt(publicId, 16);
  return /^[0-9a-f]{32}$/.test(publicId) && id > 0 ? id : undefined;
};
