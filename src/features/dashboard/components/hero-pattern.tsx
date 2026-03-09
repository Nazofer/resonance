import { WavyBackground } from '@/components/ui/wavy-background';

export function HeroPattern() {
  return (
    <div className="pointer-events-none absolute inset-0 hidden overflow-hidden lg:block">
      <WavyBackground
        colors={['#FBBF24', '#F59E0B', '#F97316', '#EA580C']}
        backgroundFill="var(--background)"
        blur={3}
        speed="slow"
        waveOpacity={0.1}
        waveWidth={60}
        waveYOffset={250}
        containerClassName="h-full"
        className="hidden"
      />
    </div>
  );
}
