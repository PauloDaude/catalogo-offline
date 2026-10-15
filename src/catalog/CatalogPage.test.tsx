import { expect, test } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CatalogPage } from './CatalogPage';
import { snapshotA } from '../test/fixtures';
test('usuário encontra produto por nome e categoria', async () => { render(<CatalogPage products={snapshotA.products} images={new Map()} />); const user = userEvent.setup(); await user.type(screen.getByRole('searchbox'), 'tesoura'); expect(screen.getByText('Tesoura de cozinha')).toBeVisible(); expect(screen.queryByText('Lanterna 1')).not.toBeInTheDocument(); await user.click(screen.getByRole('button', { name: /^Iluminação$/ })); expect(screen.getByText('Nenhum produto encontrado')).toBeVisible(); });
test('nome com markup aparece como texto', () => { render(<CatalogPage products={[{ ...snapshotA.products[0], name: '<img src=x onerror=alert(1)>' }]} images={new Map()} />); expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeVisible(); });
