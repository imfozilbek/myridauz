import { downloadFile } from '@telegram-apps/sdk-react';
import { openExternal } from './feedback';

// Telegram's own download of a file by its link (Bot API 8.0); an old client opens the link instead.
export async function downloadPicture(url: string, fileName: string): Promise<void> {
  const call = downloadFile.ifAvailable(url, fileName);
  if (call?.[0]) {
    await call[1];
    return;
  }
  openExternal(url);
}
