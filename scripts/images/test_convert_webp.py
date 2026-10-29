import hashlib
import tempfile
import unittest
from pathlib import Path
from PIL import Image
from convert_webp import convert_file, convert_scope


class WebPConversionTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.source = self.root / 'originais'
        self.source.mkdir()
        self.photo = self.source / 'produto.jpg'
        Image.new('RGB', (2000, 1000), '#225588').save(self.photo, 'JPEG')

    def tearDown(self):
        self.temp.cleanup()

    def test_real_webp_limits_and_original_preserved(self):
        original = self.photo.read_bytes()
        output = self.root / 'webp' / 'produto.webp'
        result = convert_file(self.photo, output)
        with Image.open(output) as image:
            self.assertEqual(image.format, 'WEBP')
            self.assertEqual(image.size, (1600, 800))
        self.assertLessEqual(output.stat().st_size, 500000)
        self.assertEqual(self.photo.read_bytes(), original)
        self.assertEqual(result['sha256_original'], hashlib.sha256(original).hexdigest())
        self.assertEqual(convert_file(self.photo, output), result)

    def test_collision_does_not_overwrite(self):
        output = self.root / 'produto.webp'
        output.write_bytes(b'arquivo existente')
        with self.assertRaises(ValueError):
            convert_file(self.photo, output)
        self.assertEqual(output.read_bytes(), b'arquivo existente')

    def test_repeated_stems_rejected_before_writing(self):
        (self.source / 'produto.jpeg').write_bytes(self.photo.read_bytes())
        destination = self.root / 'webp'
        with self.assertRaises(ValueError):
            convert_scope(self.source, destination)
        self.assertFalse(destination.exists())

    def test_orientation_and_no_upscaling(self):
        exif = Image.Exif()
        exif[274] = 6
        Image.new('RGB', (400, 800), '#cccccc').save(self.photo, 'JPEG', exif=exif)
        output = self.root / 'foto.webp'
        convert_file(self.photo, output)
        with Image.open(output) as image:
            self.assertEqual(image.size, (800, 400))
            self.assertFalse(image.getexif())


if __name__ == '__main__':
    unittest.main()
