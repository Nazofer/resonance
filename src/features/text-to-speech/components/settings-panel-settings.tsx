'use client';

import React, { useState } from 'react';
import { useStore } from '@tanstack/react-form';

import {
  Field, FieldGroup, FieldLabel
} from '@/components/ui/field';
import {
  Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useTypedAppFormContext } from '@/hooks/use-app-form';

import {
  defaultTtsModelSettings, TTS_MODEL_IDS, ttsModels, type TtsModelId
} from '../data/tts-models';
import {
  ttsFormOptions, useSetModelSettings
} from './text-to-speech-form';
import VoiceSelector from './voice-selector';

interface SettingSelectProps {
  label: string
  value: string
  options: { value: string, label: string, group?: string }[]
  onChange: (value: string) => void
  disabled: boolean
}

const SettingSelect: React.FC<SettingSelectProps> = ({ label, value, options, onChange, disabled }) => {
  // Modal drawer blocks pointer events outside itself, so portal the popup into it when nested
  const [portalContainer, setPortalContainer] = useState<HTMLElement>();

  return (
    <Field>
      <FieldLabel>{label}</FieldLabel>
      <Select
        value={value}
        items={options}
        onValueChange={(next) => { if (next) onChange(next); }}
        disabled={disabled}
      >
        <SelectTrigger
          ref={(el: HTMLElement | null) => { setPortalContainer(el?.closest<HTMLElement>('[data-slot="drawer-content"]') ?? undefined); }}
          className="w-full bg-white"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent alignItemWithTrigger={false} container={portalContainer}>
          {[...Map.groupBy(options, option => option.group ?? '')].map(([group, groupOptions], index) => (
            <React.Fragment key={group}>
              {index > 0 && <SelectSeparator />}
              <SelectGroup>
                {group && <SelectLabel>{group}</SelectLabel>}
                {groupOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
};

const modelOptions = TTS_MODEL_IDS.map(id => ({
  value: id,
  label: `${ttsModels[id].label} - ${ttsModels[id].description}`,
}));

const SettingsPanelSettings: React.FC = () => {
  const form = useTypedAppFormContext(ttsFormOptions);
  const isSubmitting = useStore(form.store, store => store.isSubmitting);
  const model = useStore(form.store, store => store.values.model);
  const setModelSettings = useSetModelSettings();

  // Settings are model-specific, so switching resets them to the new model's defaults
  const handleModelChange = (next: string) => {
    setModelSettings(defaultTtsModelSettings(next as TtsModelId));
  };

  return (
    <>
      <div className="flex flex-col gap-4 border-b border-dashed p-4">
        <SettingSelect
          label="Model"
          value={model}
          options={modelOptions}
          onChange={handleModelChange}
          disabled={isSubmitting}
        />
        <VoiceSelector />
      </div>

      <div className="flex-1 p-4">
        <form.Field name="settings">
          {(field) => {
            // Controls are typed per model in the registry, widened here to render generically
            const settings = field.state.value as Record<string, number | string | undefined>;
            const setSetting = (id: string, value: number | string) => {
              field.handleChange({ ...field.state.value, [id]: value });
            };

            return (
              <FieldGroup className="gap-8">
                {ttsModels[model].controls.map(control => control.type === 'select' ? (
                  <SettingSelect
                    key={`${model}.${control.id}`}
                    label={control.label}
                    value={String(settings[control.id])}
                    options={control.options}
                    onChange={(value) => { setSetting(control.id, value); }}
                    disabled={isSubmitting}
                  />
                ) : (
                  <Field key={`${model}.${control.id}`}>
                    <FieldLabel>{control.label}</FieldLabel>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {control.leftLabel}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {control.rightLabel}
                      </span>
                    </div>
                    <Slider
                      value={[Number(settings[control.id])]}
                      onValueChange={(value) => { setSetting(control.id, typeof value === 'number' ? value : value[0]); }}
                      min={control.min}
                      max={control.max}
                      step={control.step}
                      disabled={isSubmitting}
                      className={`
                        **:data-[slot=slider-thumb]:size-3 **:data-[slot=slider-thumb]:bg-foreground
                        **:data-[slot=slider-track]:h-1
                      `}
                    />
                  </Field>
                ))}
              </FieldGroup>
            );
          }}
        </form.Field>
      </div>
    </>
  );
};

export default SettingsPanelSettings;
