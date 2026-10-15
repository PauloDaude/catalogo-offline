import { beforeEach, expect, test } from 'vitest';
import { installBrowserFakes } from '../test/sync-fixtures';
import { withSyncLock } from './sync-lock';
beforeEach(installBrowserFakes);
test('trava mantém operações sequenciais', async () => { const order: string[] = []; await Promise.all([withSyncLock(async () => { order.push('a'); await new Promise(r => setTimeout(r, 5)); order.push('b'); }), withSyncLock(async () => { order.push('c'); })]); expect(order).toEqual(['a', 'b', 'c']); });
test('trava indisponível não executa escrita insegura', async () => { Object.defineProperty(navigator, 'locks', { value: undefined, configurable: true }); await expect(withSyncLock(async () => 1)).rejects.toThrow(); });
