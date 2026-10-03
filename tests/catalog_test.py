"""Run with: python -m unittest discover -s tests -p 'catalog*.py' -v."""
import json
import os
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
# Source projects (Website/, Apps/) live in the sibling Kumpulan folder; catalog URLs are
# relative to ROOT and point there.
SOURCE = Path(os.environ.get('PORTFOLIO_SOURCE', ROOT.parent / 'Kumpulan'))


class CatalogTests(unittest.TestCase):
    def test_catalog_contains_every_category(self):
        path = ROOT / 'data/catalog.json'
        self.assertTrue(path.is_file(), 'Generated catalog is missing')
        data = json.loads(path.read_text(encoding='utf-8'))
        # Hardware & IoT has no source folder: its three entries were written by hand.
        hand_authored = {'Hardware & IoT'}
        self.assertEqual(
            {p.name for p in (SOURCE / 'Website').iterdir() if p.is_dir()} | hand_authored,
            {c['name'] for c in data['categories']},
        )

    def test_every_fnb_website_has_a_unique_real_entry(self):
        from urllib.parse import unquote
        data = json.loads((ROOT / 'data/catalog.json').read_text(encoding='utf-8'))
        entries = next(c['items'] for c in data['categories'] if c['name'] == 'Food And Beverage')
        expected = {p.relative_to(SOURCE).as_posix() for p in (SOURCE / 'Website/Food And Beverage').iterdir() if p.is_dir() and (p / 'index.html').is_file()}
        self.assertGreaterEqual(len(entries), 200)
        self.assertEqual(expected, {item['sourceFolder'] for item in entries})
        self.assertEqual(len(entries), len({item['sourceFolder'] for item in entries}))
        for category in data['categories']:
            for item in category['items']:
                self.assertTrue(item['nama'])
                self.assertTrue((ROOT / unquote(item['localUrl'])).is_file())
                self.assertTrue(item['url'])

    def test_thumbnails_are_local_optimized_and_labeled(self):
        from PIL import Image
        data = json.loads((ROOT / 'data/catalog.json').read_text(encoding='utf-8'))
        for category in data['categories']:
            for item in category['items']:
                self.assertIsInstance(item['thumbnail'], str, item['nama'])
                asset = ROOT / item['thumbnail']
                self.assertTrue(asset.is_file(), str(asset))
                self.assertIn(item['thumbnailKind'], ['screenshot', 'source-image', 'placeholder'])
                self.assertTrue(item['thumbnailLabel'])
                self.assertLess(asset.stat().st_size, 180000)
                if asset.suffix == '.webp':
                    with Image.open(asset) as image:
                        # Fitted into 720x450: landscape sources stay <=720 wide, a portrait
                        # source (the hardware photos) reaches 720 tall instead.
                        self.assertLessEqual(max(image.size), 720, str(asset))
                        self.assertLessEqual(image.width * image.height, 720 * 720, str(asset))
        self.assertTrue((ROOT / data['portrait']).is_file())

    def test_app_evidence_and_file_protocol_data_are_honest(self):
        data = json.loads((ROOT / 'data/catalog.json').read_text(encoding='utf-8'))
        self.assertIn('app', data)
        app = data['app']
        self.assertEqual(app['name'], 'MakeMeSmart')
        self.assertIn('task', app['description'].lower())
        self.assertTrue(app['features'])
        for feature in app['featureEvidence']:
            self.assertTrue((ROOT / feature['source']).is_file())
        self.assertTrue((ROOT / app['image']).is_file())
        if app['download']:
            import zipfile
            with zipfile.ZipFile(ROOT / app['download']) as archive:
                self.assertIsNone(archive.testzip())
                self.assertIn('AndroidManifest.xml', archive.namelist())
                self.assertTrue(any(n.endswith('.dex') for n in archive.namelist()))
        else:
            self.assertFalse(app['downloadAvailable'])
            self.assertIn('unavailable', app['downloadLabel'].lower())
        javascript = (ROOT / 'data/catalog.js').read_text(encoding='utf-8')
        self.assertEqual(json.loads(javascript.removeprefix('window.PORTFOLIO_DATA = ').strip().removesuffix(';')), data)
        report = json.loads((ROOT / 'data/catalog-report.json').read_text(encoding='utf-8'))
        # The report is produced by the generator, which only walks the Website tree; the
        # hand-authored Hardware & IoT entries are not part of its counts.
        hand_authored = {'Hardware & IoT'}
        generated = sum(len(c['items']) for c in data['categories'] if c['name'] not in hand_authored)
        self.assertEqual(report['total'], generated)
        self.assertEqual(report['foodAndBeverage']['websiteCount'], 263)
        self.assertEqual(report['foodAndBeverage']['sourceFolderCount'], report['foodAndBeverage']['websiteCount'] + report['foodAndBeverage']['excludedCount'])


if __name__ == '__main__':
    unittest.main()
