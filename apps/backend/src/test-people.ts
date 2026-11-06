// Test helper: a test person's public id is the Telegram ID in hex, so a test reads both ways.
export const publicIdOf = (id: number) => id.toString(16).padStart(32, '0');
export const idOfPublic = async (publicId: string) => {
  const id = Number.parseInt(publicId, 16);
  return /^[0-9a-f]{32}$/.test(publicId) && id > 0 ? id : undefined;
};

// The rows of people a D1 test needs before their applications and offers (foreign keys).
export const peopleRows = (ids: readonly number[]) =>
  ids
    .map(
      (id) => `INSERT INTO users (id, first_name, gender, phone, consent_at, created_at, updated_at)
  VALUES (${id}, 'U${id}', 'male', '99890000000${id}', 0, 0, 0);`,
    )
    .join('\n');
