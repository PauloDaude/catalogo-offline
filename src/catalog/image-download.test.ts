import { beforeEach, expect, test, vi } from 'vitest';
import { installBrowserFakes, jpeg } from '../test/sync-fixtures';
import { validatePhoto } from './image-download';
beforeEach(installBrowserFakes);
test('aceita JPEG decodificável', async () => { await expect(validatePhoto(jpeg())).resolves.toBeUndefined(); });
test('rejeita HTML mesmo rotulado como JPEG', async () => { await expect(validatePhoto(new Blob(['<html>'], { type: 'image/jpeg' }))).rejects.toThrow(); });
test('rejeita MIME incorreto', async () => { await expect(validatePhoto(new Blob(['x'], { type: 'text/html' }))).rejects.toThrow(); });
test('rejeita JPEG com decodificação inválida', async () => { vi.stubGlobal('createImageBitmap', async () => { throw new Error('broken'); }); await expect(validatePhoto(jpeg())).rejects.toThrow(); });
