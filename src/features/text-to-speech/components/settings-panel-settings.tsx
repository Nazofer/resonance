'use client';

import React from 'react';
import { useStore } from '@tanstack/react-form';

import {
  Field, FieldGroup, FieldLabel
} from '@/components/ui/field';
import { Slider } from '@/components/ui/slider';
import { useTypedAppFormContext } from '@/hooks/use-app-form';

import { sliders } from '../data/sliders';
import { ttsFormOptions } from './text-to-speech-form';
import VoiceSelector from './voice-selector';

const SettingsPanelSettings: React.FC = () => {
  const form = useTypedAppFormContext(ttsFormOptions);
  const isSubmitting = useStore(form.store, store => store.isSubmitting);

  return (
    <>
      <div className="border-b border-dashed p-4">
        <VoiceSelector />
      </div>

      <div className="flex-1 p-4">
        <FieldGroup className="gap-8">
          {sliders.map(slider => (
            <form.Field key={slider.id} name={slider.id}>
              {field => (
                <Field>
                  <FieldLabel>{slider.label}</FieldLabel>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {slider.leftLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {slider.rightLabel}
                    </span>
                  </div>
                  <Slider
                    value={[field.state.value]}
                    onValueChange={(value) => { field.handleChange(typeof value === 'number' ? value : value[0]); }}
                    min={slider.min}
                    max={slider.max}
                    step={slider.step}
                    disabled={isSubmitting}
                    className={`
                      **:data-[slot=slider-thumb]:size-3 **:data-[slot=slider-thumb]:bg-foreground
                      **:data-[slot=slider-track]:h-1
                    `}
                  />
                </Field>
              )}
            </form.Field>
          ))}
        </FieldGroup>
      </div>
    </>
  );
};

export default SettingsPanelSettings;
