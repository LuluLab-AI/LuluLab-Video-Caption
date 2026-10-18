# Video Caption Assistant / 视频字幕助手

Remove burned-in captions, add synchronized subtitles, or replace old captions in user-provided videos. Choose `fast`, `standard` (default), or `high` quality. The skill adjusts subtitle removal, transcription, encoding, and visual checks to match the chosen level; specific user settings take precedence.

Before changing video pixels, generating paid narration, or rendering the final output, run the bundled LuluLab CLI's read-only account check:

```bash
python3 scripts/lululab_key_preflight.py
```

The preflight calls `node scripts/lululab_cli.mjs user --credits`. It accepts `LULULAB_API_KEY`, legacy `LINGZHI_API_KEY` or `LZSTUDIO_API_KEY`, or `~/.recreate-video-lululab/config.json` (`apiKey`). It neither submits a paid job nor prints the key. Configure the key locally; do not commit it. See [SKILL.md](SKILL.md) for the exact checkpoint and workflow.

## Requirements and usage

- Python 3.9+, Node.js 20+, FFmpeg, and `openai-whisper`
- `opencv-python-headless` when removing burned-in captions with the bundled repair script
- ElevenLabs API key only when generated narration is requested

```bash
./scripts/check_dependencies.sh
./scripts/add_subtitles.sh input.mp4 English output standard
./scripts/add_subtitles.sh input.mp4 Chinese output high
./scripts/add_subtitles.sh input.mp4 "" output fast
```

The rendered video is `output/final_subtitled.mp4`. For translated narration and subtitle workflows, consult [SKILL.md](SKILL.md); the normal workflow uses one localization pass and one timed ElevenLabs synthesis request.

## 中文说明

本 Skill 可去除用户视频中已烧录的字幕、添加同步硬字幕，或先清理旧字幕再添加新字幕。支持 `fast`、`standard`（默认）和 `high` 三种质量档位；用户指定的分辨率、编码或处理方法优先。

本地检查、抽帧和转写后，在修改画面、生成付费配音或最终渲染前，必须运行 `python3 scripts/lululab_key_preflight.py`。随包的 LuluLab Node.js CLI 通过 `user --credits` 进行只读远端鉴权，不提交付费任务，也不输出密钥。API Key 请在本地配置。完整流程、字幕样式与质检规则见 [SKILL.md](SKILL.md)。
