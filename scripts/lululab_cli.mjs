#!/usr/bin/env node
/** LuluLab customer API CLI, authentication-only subset for Video-Caption.
 * Compatible with the user --credits contract of LuluLab-Recreate-Video.
 */
import { readFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

class CliError extends Error {}

async function loadKey() {
  for (const name of ['LULULAB_API_KEY', 'LINGZHI_API_KEY', 'LZSTUDIO_API_KEY']) {
    const key = process.env[name]?.trim();
    if (key) return key;
  }
  try {
    const obj = JSON.parse(await readFile(join(homedir(), '.recreate-video-lululab', 'config.json'), 'utf8'));
    if (typeof obj.apiKey === 'string' && obj.apiKey.trim()) return obj.apiKey.trim();
  } catch (err) {
    if (err.code !== 'ENOENT') throw new CliError('无法读取 LuluLab 本地凭证配置。');
  }
  throw new CliError('缺少 LuluLab API Key；请配置 LULULAB_API_KEY。');
}

async function main() {
  if (Number(process.versions.node.split('.')[0]) < 20) throw new CliError('需要 Node.js >=20。');
  const args = process.argv.slice(2);
  if (args.length !== 2 || args[0] !== 'user' || args[1] !== '--credits') {
    throw new CliError('该 Skill 仅支持 user --credits 校验。');
  }
  const base = new URL(process.env.LULULAB_API_BASE_URL || 'https://customer.lululab.ai');
  if (!['https:', 'http:'].includes(base.protocol) || (base.protocol === 'http:' && !['localhost', '127.0.0.1', '[::1]'].includes(base.hostname)) || base.username || base.password || base.search || base.hash || !['', '/'].includes(base.pathname)) {
    throw new CliError('LuluLab API 地址不合法。');
  }
  const key = await loadKey();
  let page = 1, seen = 0, balance = 0n;
  while (true) {
    let res;
    try {
      res = await fetch(new URL(`/credits?page=${page}&pageSize=100`, base), {
        headers: { Authorization: key, Accept: 'application/json' },
        redirect: 'error', signal: AbortSignal.timeout(30000)
      });
    } catch { throw new CliError('LuluLab API 网络错误或超时。'); }
    if (!res.ok) throw new CliError(`LuluLab API HTTP ${res.status}。`);
    let result;
    try { result = await res.json(); } catch { throw new CliError('LuluLab API 返回无效 JSON。'); }
    const total = Number(result?.total);
    if (!Number.isSafeInteger(total) || total < 0 || !Array.isArray(result.items)) throw new CliError('积分响应缺少有效分页信息。');
    for (const item of result.items) {
      const raw = item?.creditsBalance;
      if ((typeof raw !== 'string' && typeof raw !== 'number') || !/^-?(0|[1-9]\d*)$/.test(String(raw)) || (typeof raw === 'number' && !Number.isSafeInteger(raw))) throw new CliError('积分响应包含无效余额。');
      balance += BigInt(raw);
    }
    seen += result.items.length;
    if (seen >= total) break;
    if (!result.items.length || page >= 10000) throw new CliError('积分分页未完成。');
    page++;
  }
  if (balance > BigInt(Number.MAX_SAFE_INTEGER) || balance < BigInt(Number.MIN_SAFE_INTEGER)) throw new CliError('积分余额超出安全范围。');
  process.stdout.write(JSON.stringify({ balance: Number(balance) }) + '\n');
}

main().catch(err => {
  const diagnostic = err instanceof CliError ? err.message : 'LuluLab CLI 执行失败。';
  process.stderr.write(JSON.stringify({ ok: false, errorCode: 'LULULAB_CLI_FAILED', diagnostic }) + '\n');
  process.exitCode = 1;
});
