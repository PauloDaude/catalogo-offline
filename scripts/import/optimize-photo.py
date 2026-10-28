"""Local JPEG preparation; preserves originals, same limits as the admin form."""
from PIL import Image, ImageOps
import sys, io
with Image.open(sys.argv[1]) as original:
    original.load()
    image = ImageOps.exif_transpose(original).convert('RGB')
    image.thumbnail((1600,1600), Image.Resampling.LANCZOS)
    for quality in range(90,29,-10):
        out=io.BytesIO();image.save(out,format='JPEG',quality=quality)
        data=out.getvalue()
        if 0<len(data)<=500000:
            sys.stdout.buffer.write(data)
            break
    else:
        raise ValueError('Imagem não cabe no limite do catálogo')
