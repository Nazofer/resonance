import { useMemo } from 'react';
import { createAvatar } from '@dicebear/core';
import { glass } from '@dicebear/collection';

export const useVoiceAvatar = (seed: string) => {
  const avatar = useMemo(() => {
    return createAvatar(glass, {
      seed,
      size: 128,
    }).toDataUri();
  }, [seed]);

  return avatar;
};
