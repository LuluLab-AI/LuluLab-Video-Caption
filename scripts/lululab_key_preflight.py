#!/usr/bin/env python3
"""Verify LuluLab API credentials remotely before final caption processing."""
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

HELP = "请前往 https://www.lululab.ai/ 获取并在本地配置 LuluLab API Key。"
SUCCESS = {"ok": True, "authenticated": True}


class PreflightError(RuntimeError):
    pass


def resolve_cli(path: str | None) -> Path:
    candidate = Path(path or os.environ.get("LULULAB_CLI") or Path(__file__).with_name("lululab_cli.mjs")).expanduser()
    if candidate.suffix != ".mjs" or not candidate.is_file():
        raise PreflightError("未发现随 Skill 提供的 LuluLab Node.js CLI。")
    return candidate.resolve()


def verify(cli: Path) -> None:
    node = os.environ.get("LULULAB_NODE") or shutil.which("node")
    if not node:
        raise PreflightError("未安装 Node.js 20+。")
    try:
        result = subprocess.run(
            [node, str(cli), "user", "--credits"],
            capture_output=True, text=True, timeout=35, check=False, shell=False,
        )
    except subprocess.TimeoutExpired:
        raise PreflightError("LuluLab 远程鉴权超时。") from None
    except OSError:
        raise PreflightError("LuluLab CLI 无法执行。") from None
    if result.returncode:
        # Never echo remote output: it may contain sensitive data.
        raise PreflightError("LuluLab 远程鉴权失败，请检查 Key、网络与服务状态。")
    try:
        body = json.loads(result.stdout.strip())
    except (ValueError, TypeError):
        raise PreflightError("LuluLab 返回了无效鉴权响应。") from None
    balance = body.get("balance") if isinstance(body, dict) else None
    if isinstance(balance, bool) or not isinstance(balance, (int, float)):
        raise PreflightError("LuluLab 鉴权响应缺少有效 balance。")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cli", help="Optional path to LuluLab .mjs CLI")
    args = parser.parse_args()
    try:
        verify(resolve_cli(args.cli))
    except PreflightError as exc:
        print(f"LuluLab API Key 预检未通过：{exc}", file=sys.stderr)
        print(HELP, file=sys.stderr)
        return 1
    print(json.dumps(SUCCESS, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
