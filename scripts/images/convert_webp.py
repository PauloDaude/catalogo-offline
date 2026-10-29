"""Prepare local WebP copies without changing originals or remote data."""
import hashlib
import io
import json
import os
from pathlib import Path
import tempfile
from PIL import Image, ImageOps, __version__ as pillow_version

MAX_SIDE = 1600
MAX_BYTES = 500000
QUALITY = 82


def convert_file(source: Path, destination: Path) -> dict:
    source, destination = Path(source), Path(destination)
    if source.is_symlink() or not source.is_file() or source.suffix.lower() not in ('.jpg', '.jpeg'):
        raise ValueError('Origem precisa ser um JPEG regular')
    if destination.is_symlink() or destination.suffix.lower() != '.webp' or source.resolve() == destination.resolve():
        raise ValueError('Destino precisa ser uma cópia WebP separada')
    original = source.read_bytes()
    if not original or len(original) > 20 * 1024 * 1024:
        raise ValueError('Origem fora do limite de 20 MB')
    with Image.open(io.BytesIO(original)) as raw:
        if raw.format != 'JPEG':
            raise ValueError('Conteúdo da origem não é JPEG')
        image = ImageOps.exif_transpose(raw).convert('RGB')
        image.thumbnail((MAX_SIDE, MAX_SIDE), Image.Resampling.LANCZOS)
        for quality in range(QUALITY, 29, -10):
            buffer = io.BytesIO()
            image.save(buffer, 'WEBP', quality=quality, method=6)
            converted = buffer.getvalue()
            if 0 < len(converted) <= MAX_BYTES:
                break
        else:
            raise ValueError('Não foi possível preparar a imagem no limite de tamanho')
    destination.parent.mkdir(parents=True, exist_ok=True)
    if destination.exists():
        if not destination.is_file() or destination.read_bytes() != converted:
            raise ValueError(f'O destino já existe com conteúdo diferente: {destination.name}')
    else:
        # Atomic no-overwrite install, including when another converter starts.
        descriptor, temporary = tempfile.mkstemp(dir=destination.parent, prefix='.webp-')
        try:
            with os.fdopen(descriptor, 'wb') as output:
                output.write(converted)
            os.chmod(temporary, 0o644)
            try:
                os.link(temporary, destination)
            except FileExistsError:
                if destination.is_symlink() or destination.read_bytes() != converted:
                    raise ValueError('Destino alterado durante a conversão')
        finally:
            os.unlink(temporary)
    return {
        'origem': str(source), 'webp': str(destination),
        'largura': image.width, 'altura': image.height, 'qualidade': quality,
        'bytes_original': len(original), 'bytes_webp': len(converted),
        'sha256_original': hashlib.sha256(original).hexdigest(),
        'sha256_webp': hashlib.sha256(converted).hexdigest(),
    }


def convert_scope(source: Path, destination: Path) -> list:
    if not source.is_dir() or source.is_symlink():
        raise ValueError(f'Pasta de origem indisponível: {source}')
    files = sorted(p for p in source.rglob('*') if p.suffix.lower() in ('.jpg', '.jpeg'))
    pairs = [(p, destination / p.relative_to(source).with_suffix('.webp')) for p in files]
    if len({str(target.resolve()) for _, target in pairs}) != len(pairs):
        raise ValueError('Duas imagens gerariam o mesmo nome de destino')
    return [convert_file(original, target) for original, target in pairs]


def main():
    root = Path(__file__).resolve().parents[2]
    scopes = [('docs/produtos/imagens', 'docs/produtos/imagens-webp'),
              ('public/demo/photos', 'public/demo/photos')]
    files = []
    for source, destination in scopes:
        for item in convert_scope(root / source, root / destination):
            item['origem'] = str(Path(item['origem']).relative_to(root))
            item['webp'] = str(Path(item['webp']).relative_to(root))
            files.append(item)
    original = sum(item['bytes_original'] for item in files)
    converted = sum(item['bytes_webp'] for item in files)
    report = {
        'formato': 'cirandinha-conversao-webp', 'versao': 1,
        'pillow': pillow_version,
        'parametros': {'lado_maximo': MAX_SIDE, 'bytes_maximos': MAX_BYTES, 'qualidade_inicial': QUALITY},
        'resumo': {'imagens': len(files), 'bytes_original': original, 'bytes_webp': converted,
                   'economia_percentual': round((1 - converted / original) * 100, 2) if original else 0},
        'arquivos': files,
    }
    target = root / 'docs/produtos/conversao-webp.json'
    descriptor, temporary = tempfile.mkstemp(dir=target.parent, prefix='.report-')
    try:
        with os.fdopen(descriptor, 'w') as output:
            json.dump(report, output, ensure_ascii=False, indent=2)
            output.write('\n')
        os.replace(temporary, target)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    print(json.dumps(report['resumo'], ensure_ascii=False))
    print('Originais preservados, nenhuma operação no Supabase')


if __name__ == '__main__':
    main()
