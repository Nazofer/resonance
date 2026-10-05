# Voice & model sources

Where the system voices, TTS models and language tooling come from, under which licenses, how clips were picked, and where to look when extending the voice set.

System voice clips live in R2 (`voices/system/<voiceId>`); `scripts/system-voices/*.wav` (gitignored) is only the seed input. Transcripts and per-clip provenance are also recorded in `scripts/seed-system-voices.ts`.

## System voices

### English (original 20)

- Source: Chatterbox preset voice prompts from Modal's Chatterbox example — [modal.com/docs/examples/chatterbox_tts](https://modal.com/docs/examples/chatterbox_tts), archive `https://modal-cdn.com/blog/audio/chatterbox-tts-voices.zip`
- Archive contents: `prompts/*.wav` (the 20 voices) and `voice_conds/*.pt` (precomputed Chatterbox conditionals, not usable by other engines). No other languages.
- License: **none stated**. Provenance is unclear: Meera says "Thank you for using Eleven Labs", Madison is a clip from the "Extra Dirty" podcast. Fine for a non-commercial study project; replace before any public or commercial use.
- Local edits: Andy (52 s → 14.1 s) and Madison (59 s → 17.6 s) were trimmed at a pause, because OmniVoice degrades on references over 20 s. The originals are kept as `scripts/system-voices/*.orig.wav`.
- Transcripts: Whisper large-v3-turbo. Ivan is Russian (`ru-RU`), not English.

### Ukrainian (5) — speech-uk/opentts

- Source: [speech-uk/opentts](https://huggingface.co/datasets/Yehor/opentts-uk) by Yehor Smoliakov (speech-uk community), original index [egorsmkv/ukrainian-tts-datasets](https://github.com/egorsmkv/ukrainian-tts-datasets)
- Content: studio-quality single-speaker readings of fiction; 48 kHz OGG/Opus inside parquet, with published transcripts.
- Speakers: Lada ♀ (~10.6 h, 6962 clips), Tetiana ♀ (~8 h, 5227), Kateryna ♀ (~2.7 h, 1803), Mykyta ♂ (~8.2 h, 6436), Oleksa ♂ (~6 h, 3555). This is the full speaker set.
- Citation: `@misc{smoliakov_2025, author = {Smoliakov}, title = {opentts-uk}, year = 2025, url = {https://huggingface.co/datasets/Yehor/opentts-uk}}`

| Voice | Dataset | Row (train) | Duration | License |
|---|---|---|---|---|
| Kateryna | [speech-uk/opentts-kateryna](https://huggingface.co/datasets/speech-uk/opentts-kateryna) | 1792 | 6.1 s | CC-BY-NC-4.0 |
| Lada | [speech-uk/opentts-lada](https://huggingface.co/datasets/speech-uk/opentts-lada) | 4469 | 6.7 s | Apache-2.0 |
| Mykyta | [speech-uk/opentts-mykyta](https://huggingface.co/datasets/speech-uk/opentts-mykyta) | 5965 | 6.9 s | Apache-2.0 |
| Oleksa | [speech-uk/opentts-oleksa](https://huggingface.co/datasets/speech-uk/opentts-oleksa) | 853 | 8.0 s | Apache-2.0 |
| Tetiana | [speech-uk/opentts-tetiana](https://huggingface.co/datasets/speech-uk/opentts-tetiana) | 3862 | 6.4 s | Apache-2.0 |

### Other languages (16) — Google FLEURS

- Source: [google/fleurs](https://huggingface.co/datasets/google/fleurs), license **CC-BY-4.0** (attribution required)
- Content: native speakers reading FLoRes (Wikipedia) sentences; 102 languages, 16 kHz; TSV per split with transcript and gender (`id, file, raw_transcription, transcription, chars, num_samples, gender`). No speaker ids.
- Download: `data/<config>/{dev,test,train}.tsv` plus `data/<config>/audio/<split>.tar.gz` (dev ~150–300 MB, train ~1.4–1.8 GB per language). Some splits lack a gender (e.g. `de_de` and `pt_br` have no female speakers in dev/test), so fall back to train.
- Citation: Conneau et al., *FLEURS: Few-shot Learning Evaluation of Universal Representations of Speech*, 2022, [arXiv:2205.12446](https://arxiv.org/abs/2205.12446)

| Voice | Language | FLEURS config / split | File | Duration |
|---|---|---|---|---|
| Anna | de-DE (female) | `de_de` / train | `4218598733355248523.wav` | 9.0 s |
| Lukas | de-DE (male) | `de_de` / dev | `2451196745503996684.wav` | 7.1 s |
| Camille | fr-FR (female) | `fr_fr` / dev | `10587796381228744557.wav` | 7.4 s |
| Julien | fr-FR (male) | `fr_fr` / dev | `15486459632428455015.wav` | 6.3 s |
| Lucia | es-419 (female) | `es_419` / dev | `6153923534060353431.wav` | 8.6 s |
| Mateo | es-419 (male) | `es_419` / dev | `12832763676170496221.wav` | 7.3 s |
| Giulia | it-IT (female) | `it_it` / dev | `14780160000188802638.wav` | 8.2 s |
| Marco | it-IT (male) | `it_it` / test | `8646216597303794244.wav` | 8.3 s |
| Zofia | pl-PL (female) | `pl_pl` / dev | `6876347035317342980.wav` | 8.3 s |
| Jakub | pl-PL (male) | `pl_pl` / dev | `12251322188293877093.wav` | 6.4 s |
| Beatriz | pt-BR (female) | `pt_br` / train | `5492165931023405494.wav` | 8.5 s |
| Rafael | pt-BR (male) | `pt_br` / dev | `10777509745863636963.wav` | 9.2 s |
| Olga | ru-RU (female) | `ru_ru` / dev | `13441608534573947650.wav` | 6.6 s |
| Dmitry | ru-RU (male) | `ru_ru` / dev | `1058855104882293960.wav` | 9.1 s |
| Mei | zh-CN (female) | `cmn_hans_cn` / dev | `12720876761211996171.wav` | 5.9 s |
| Wei | zh-CN (male) | `cmn_hans_cn` / dev | `11896869400830064294.wav` | 7.3 s |

### How clips were picked

OmniVoice clones from a short reference **plus its exact transcript**, so the selection optimizes for clean audio that matches the text word for word:

1. **Duration:** 6–10 s. OmniVoice recommends 3–10 s and trims references over 20 s only when no transcript is given.
2. **Content:** narration only. No dialogue dashes or quotes, and nothing emotional, political or offensive, since the reference's prosody carries into every generation.
3. **Density** (opentts): most characters per second, so there are few pauses.
4. **Transcript check:** Whisper large-v3-turbo ([mlx-whisper](https://github.com/ml-explore/mlx-examples/tree/main/whisper) locally) must reproduce the dataset transcript (similarity ≥ 0.98). This rejects clips where the reader deviated from the text.
5. **Cleanliness** (FLEURS): highest SNR, computed as the 90th minus 10th percentile of 20 ms frame RMS after dropping digital-silence padding. Reject quiet recordings (peak below −20 dBFS).
6. **Gender sanity** (FLEURS): median F0 (autocorrelation). Female clips are expected at ≥ 160 Hz and male clips at < 160 Hz, which catches mislabelled rows.

End-to-end check: every new voice generated a native sentence through OmniVoice, and Whisper recognised the right language with an exact text match for all 21.

## Extending the voice set

### From FLEURS (same pipeline)

These 48 languages are supported by OmniVoice **and** recognised by the input language detector, so native voices would be auto-picked:

Amharic, Arabic, Azerbaijani, Belarusian, Bulgarian, Bangla, Bosnian, Cebuano, Central Kurdish, Czech, Greek, Persian, Filipino, Gujarati, Hausa, Hindi, Croatian, Hungarian, Indonesian, Igbo, Japanese, Javanese, Kazakh, Kannada, Korean, Lingala, Malayalam, Marathi, Burmese, Nepali, Dutch, Nyanja, Punjabi, Pashto, Romanian, Somali, Serbian, Swedish, Swahili, Tamil, Telugu, Thai, Turkish, Urdu, Uzbek, Vietnamese, Yoruba, Zulu.

These 43 are supported by OmniVoice but **not** recognised by `franc-min`. Voices can be added, but only picked by hand, unless the detector is switched to `franc` (187 languages) or `franc-all` (414):

Afrikaans, Assamese, Asturian, Catalan, Welsh, Danish, Estonian, Fula, Finnish, Irish, Galician, Hebrew, Armenian, Icelandic, Georgian, Kamba, Kabuverdianu, Khmer, Kyrgyz, Luxembourgish, Ganda, Lao, Lithuanian, Luo, Latvian, Māori, Macedonian, Mongolian, Malay, Maltese, Norwegian Bokmål, Northern Sotho, Occitan, Oromo, Sindhi, Slovak, Slovenian, Shona, Tajik, Umbundu, Wolof, Xhosa, Cantonese.

FLEURS limits: 16 kHz volunteer recordings with a neutral reading style. There are no speaker ids, so more than one voice per gender per language risks picking the same person twice.

### Other candidate datasets

| Dataset | License | Languages | Notes |
|---|---|---|---|
| [Multilingual LibriSpeech](https://huggingface.co/datasets/facebook/multilingual_librispeech) | CC-BY-4.0 | en, de, nl, fr, es, it, pt, pl | LibriVox audiobooks, 16 kHz, thousands of speakers **with ids**: best for many distinct voices per language. Pratap et al. 2020, [arXiv:2012.03411](https://arxiv.org/abs/2012.03411) |
| [VoxPopuli](https://huggingface.co/datasets/facebook/voxpopuli) | CC0 | EU languages | European Parliament speeches, speaker ids, more spontaneous but "plenary hall" acoustics. Wang et al. 2021, [arXiv:2101.00390](https://arxiv.org/abs/2101.00390) |
| [Emilia](https://huggingface.co/datasets/amphion/Emilia-Dataset) | per card (parts CC-BY-NC-4.0) | zh, en, ja, fr, de, ko | In-the-wild expressive speech, 24 kHz: best for expressive voices. **Gated:** terms must be accepted on Hugging Face by the account owner |
| [Common Voice](https://commonvoice.mozilla.org/) | CC0 | 100+ incl. uk | Removed from Hugging Face, now on Mozilla Data Collective (account required); very uneven recording quality |
| [speech-uk](https://huggingface.co/speech-uk) | per dataset | uk | Other Ukrainian speech datasets from the same community, useful for more Ukrainian voices |

## TTS models

| Model | Ukrainian | License | Link |
|---|---|---|---|
| **OmniVoice** (k2-fsa, 0.6B) — in use | yes, ~1852 h training data | code Apache-2.0, weights CC-BY-NC | [HF](https://huggingface.co/k2-fsa/OmniVoice), [GitHub](https://github.com/k2-fsa/OmniVoice), [supported languages](https://github.com/k2-fsa/OmniVoice/blob/master/docs/languages.md), [demo](https://huggingface.co/spaces/k2-fsa/OmniVoice) |
| **Chatterbox Turbo** — in use | no (English only) | MIT | [GitHub](https://github.com/resemble-ai/chatterbox), [Modal example](https://modal.com/docs/examples/chatterbox_tts) |
| Chatterbox Multilingual | no (23 languages) | MIT | [HF Space](https://huggingface.co/spaces/ResembleAI/Chatterbox-Multilingual-TTS) |
| Qwen3-TTS | no (10 languages) | Apache-2.0 | [GitHub](https://github.com/QwenLM/Qwen3-TTS), [Ukrainian request](https://github.com/QwenLM/Qwen3-TTS/discussions/235) |
| VoxCPM2 | no | Apache-2.0 | [GitHub](https://github.com/OpenBMB/VoxCPM) |
| F5-TTS | community fine-tunes only | CC-BY-NC | [GitHub](https://github.com/SWivid/F5-TTS), [languages](https://github.com/SWivid/F5-TTS/issues/87) |
| Fish Speech | undocumented | research license | [GitHub](https://github.com/fishaudio/fish-speech) |

## Language tooling

- Input language detection: [franc-min](https://github.com/wooorm/franc) (MIT), 76 languages. Trigram-based for alphabetic scripts, and script-based (reliable from the first character) for Hangul, Kana, Han, Greek, Thai, …
- Language names: the browser's `Intl.DisplayNames` (CLDR), plus two missing names written into the code.
- OmniVoice language ids: `docs/lang_id_name_map.tsv` in the OmniVoice repo. Detected tags that differ from OmniVoice ids: `ar → arb`, `ne → npi`, `mg → plt`, `zlm → ms`.
- Transcript and output verification: [Whisper large-v3-turbo](https://huggingface.co/openai/whisper-large-v3-turbo) (MIT).
