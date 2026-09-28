import { Text } from '@telegram-apps/telegram-ui';

// A short value at the right side of a cell, in the gray Telegram hint style (docs/21).
export function CellValue({ children }: { readonly children: string }) {
  return <Text className="cell-value">{children}</Text>;
}

// Uzbek numbers read in groups: +998 90 123 45 67.
export function formatPhone(phone: string): string {
  const match = /^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(phone);
  return match ? `+998 ${match.slice(1).join(' ')}` : phone;
}
