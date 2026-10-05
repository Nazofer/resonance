"""OmniVoice TTS API - Multilingual (incl. Ukrainian) text-to-speech with voice cloning on Modal."""

import modal

# Shares the Modal secrets with chatterbox_tts.py (hf-token, chatterbox-api-key, cloudflare-r2).

# Use this to test locally:
# modal run omnivoice_tts.py \
#   --prompt "Привіт! Це тест українського синтезу мовлення." \
#   --voice-key "voices/system/<voice-id>" \
#   --ref-text "<exact transcript of the voice clip>"

# Use this to test CURL:
# curl -X POST "https://<your-modal-endpoint>/generate" \
#   -H "Content-Type: application/json" \
#   -H "X-Api-Key: <your-api-key>" \
#   -d '{"prompt": "Привіт!", "voice_key": "voices/system/<voice-id>", "ref_text": "<transcript>", "language": "uk"}' \
#   --output output.wav

# R2 mount + API key auth duplicated from chatterbox_tts.py, extract a shared module if a 3rd engine lands
R2_BUCKET_NAME = "resonance-bumazik"
R2_ACCOUNT_ID = "54478b5b72d19bd9d2b222af5a2fdaf8"
R2_MOUNT_PATH = "/r2"
r2_bucket = modal.CloudBucketMount(
    R2_BUCKET_NAME,
    bucket_endpoint_url=f"https://{R2_ACCOUNT_ID}.r2.cloudflarestorage.com",
    secret=modal.Secret.from_name("cloudflare-r2"),
    read_only=True,
)

# Modal setup
image = modal.Image.debian_slim(python_version="3.11").uv_pip_install(
    "torch==2.8.0",
    "torchaudio==2.8.0",
    "omnivoice==0.2.1",
    "fastapi[standard]==0.124.4",
    "soundfile",
)
app = modal.App("omnivoice-tts", image=image)

with image.imports():
    import io
    import os
    from pathlib import Path

    import soundfile as sf  # pyright: ignore[reportMissingImports]
    import torch  # pyright: ignore[reportMissingImports]
    from fastapi import (
        Depends,
        FastAPI,
        HTTPException,
        Security,
    )
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import StreamingResponse
    from fastapi.security import APIKeyHeader
    from omnivoice import OmniVoice  # pyright: ignore[reportMissingImports]
    from pydantic import BaseModel, Field

    api_key_scheme = APIKeyHeader(
        name="x-api-key",
        scheme_name="ApiKeyAuth",
        auto_error=False,
    )

    def verify_api_key(x_api_key: str | None = Security(api_key_scheme)):
        expected = os.environ.get("CHATTERBOX_API_KEY", "")
        if not expected or x_api_key != expected:
            raise HTTPException(status_code=403, detail="Invalid API key")
        return x_api_key

    class TTSRequest(BaseModel):
        """Request model for text-to-speech generation."""

        prompt: str = Field(..., min_length=1, max_length=5000)
        voice_key: str = Field(..., min_length=1, max_length=300)
        # Transcript of the voice clip; required so no ASR model has to be loaded
        ref_text: str = Field(..., min_length=1, max_length=2000)
        # OmniVoice language id (e.g. "uk", "en"); None = language-agnostic mode
        language: str | None = Field(default="uk", max_length=16)
        speed: float = Field(default=1.0, ge=0.5, le=2.0)
        num_step: int = Field(default=32, ge=4, le=64)
        guidance_scale: float = Field(default=2.0, ge=0.0, le=5.0)


@app.cls(
    gpu="L4",
    scaledown_window=60 * 5,
    secrets=[
        modal.Secret.from_name("hf-token"),
        modal.Secret.from_name("chatterbox-api-key"),
        modal.Secret.from_name("cloudflare-r2"),
    ],
    volumes={R2_MOUNT_PATH: r2_bucket},
)
@modal.concurrent(max_inputs=10)
class OmniVoiceTTS:
    @modal.enter()
    def load_model(self):
        self.model = OmniVoice.from_pretrained(
            "k2-fsa/OmniVoice",
            device_map="cuda:0",
            dtype=torch.float16,
        )
        # Never invalidated, restart containers after re-uploading a clip under the same key
        self.voice_prompts = {}

    def voice_prompt(self, audio_prompt_path: str, ref_text: str):
        # ref_text is always passed: without it OmniVoice lazy-loads Whisper (~1.6 GB)
        key = (audio_prompt_path, ref_text)
        if key not in self.voice_prompts:
            self.voice_prompts[key] = self.model.create_voice_clone_prompt(
                ref_audio=audio_prompt_path,
                ref_text=ref_text,
            )
        return self.voice_prompts[key]

    @modal.asgi_app()
    def serve(self):
        web_app = FastAPI(
            title="OmniVoice TTS API",
            description="Multilingual text-to-speech with voice cloning",
            docs_url="/docs",
            dependencies=[Depends(verify_api_key)],
        )
        web_app.add_middleware(
            CORSMiddleware,
            allow_origins=["*"],
            allow_credentials=True,
            allow_methods=["*"],
            allow_headers=["*"],
        )

        @web_app.post("/generate", responses={200: {"content": {"audio/wav": {}}}})
        def generate_speech(request: TTSRequest):
            voice_path = Path(R2_MOUNT_PATH) / request.voice_key
            if not voice_path.exists():
                raise HTTPException(
                    status_code=400,
                    detail=f"Voice not found at '{request.voice_key}'",
                )

            try:
                audio_bytes = self.generate.local(
                    request.prompt,
                    str(voice_path),
                    request.ref_text,
                    request.language,
                    request.speed,
                    request.num_step,
                    request.guidance_scale,
                )
                return StreamingResponse(
                    io.BytesIO(audio_bytes),
                    media_type="audio/wav",
                )
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Failed to generate audio: {e}",
                )

        return web_app

    @modal.method()
    def generate(
        self,
        prompt: str,
        audio_prompt_path: str,
        ref_text: str,
        language: str | None = "uk",
        speed: float = 1.0,
        num_step: int = 32,
        guidance_scale: float = 2.0,
    ):
        audio = self.model.generate(
            text=prompt,
            language=language,
            voice_clone_prompt=self.voice_prompt(audio_prompt_path, ref_text),
            speed=speed,
            num_step=num_step,
            guidance_scale=guidance_scale,
        )[0]

        buffer = io.BytesIO()
        sf.write(buffer, audio, self.model.sampling_rate, format="WAV")
        buffer.seek(0)
        return buffer.read()


@app.local_entrypoint()
def test(
    prompt: str = "Привіт! Це тест українського синтезу мовлення.",
    voice_key: str = "voices/system/default.wav",
    ref_text: str = "",
    output_path: str = "/tmp/omnivoice-tts/output.wav",
    language: str = "uk",
    speed: float = 1.0,
    num_step: int = 32,
    guidance_scale: float = 2.0,
):
    import pathlib

    if not ref_text:
        raise SystemExit("--ref-text is required (the exact transcript of the voice clip)")

    # modal types app.cls(@modal.concurrent class) as the PartialFunction, not the class; works at runtime
    omnivoice = OmniVoiceTTS()  # pyright: ignore[reportCallIssue]
    audio_bytes = omnivoice.generate.remote(
        prompt=prompt,
        audio_prompt_path=f"{R2_MOUNT_PATH}/{voice_key}",
        ref_text=ref_text,
        language=language,
        speed=speed,
        num_step=num_step,
        guidance_scale=guidance_scale,
    )

    output_file = pathlib.Path(output_path)
    output_file.parent.mkdir(parents=True, exist_ok=True)
    output_file.write_bytes(audio_bytes)
    print(f"Audio saved to {output_file}")
