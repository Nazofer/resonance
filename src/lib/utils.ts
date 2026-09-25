import {
  clsx, type ClassValue
} from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function downloadAudio(url: string, text: string) {
  const safeName
    = text
      .slice(0, 50)
      .trim()
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'speech';

  const link = document.createElement('a');
  link.href = url;
  link.download = `${safeName}.wav`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
