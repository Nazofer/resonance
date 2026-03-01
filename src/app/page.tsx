'use client';

import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Home() {
  return (
    <Button variant="ghost" onClick={() => toast.success('Hello')}>
      Click me
    </Button>
  );
}
