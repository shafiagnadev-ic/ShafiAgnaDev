"""Rebuild portfolio data from source folders; never modify source assets.

Run: python scripts/build_catalog.py
Dependencies: Pillow (python -m pip install Pillow)
Only explicit deployment metadata is trusted; business/social URLs are not demos.
"""
import hashlib
import html
import json
import os
import re
import unicodedata
import shutil
import zipfile
from collections import Counter
from pathlib import Path
from urllib.parse import quote, unquote, urlsplit
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
# Source projects (Website/, Apps/) were moved out of the portfolio folder to keep it
# small, so they are read from the sibling Kumpulan folder and every generated URL is
# written relative to the portfolio root (ROOT).
SOURCE = Path(os.environ.get('PORTFOLIO_SOURCE', ROOT.parent / 'Kumpulan'))
URL_PREFIX = '../Kumpulan/'
SKIP = {'.git', 'node_modules', '.next', '.dart_tool', '.gradle', 'build', '__pycache__'}


def walk_files(folder):
    for base, dirs, files in os.walk(folder):
        dirs[:] = sorted(d for d in dirs if d not in SKIP)
        for name in sorted(files):
            yield Path(base) / name


def entrypoint(project):
    for relative in ['index.html', 'legacy/landing.html', 'Web/tani-landing.html']:
        path = project / relative
        if path.is_file():
            return path
    for path in sorted(walk_files(project), key=lambda p: (len(p.parts), p.as_posix())):
        if path.name == 'index.html':
            text = path.read_text(encoding='utf-8', errors='replace')
            if '$FLUTTER_BASE_HREF' in text or 'flutter_bootstrap.js' in text or 'flutter.js' in text:
                continue  # An unbuilt Flutter shell is not an openable website.
            return path
    return None


def deployment_url(project):
    for filename in ['deployment.json', 'deploy.json', '.netlify/state.json']:
        path = project / filename
        if not path.is_file():
            continue
        metadata = json.loads(path.read_text(encoding='utf-8-sig'))
        for key in ['deploymentUrl', 'deployUrl', 'deploy_url', 'ssl_url', 'url']:
            value = metadata.get(key)
            if isinstance(value, str) and urlsplit(value).scheme in {'http', 'https'} and urlsplit(value).netloc:
                return value, path
    return None, None


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


def optimize(source, target, size=(720, 450)):
    target.parent.mkdir(parents=True, exist_ok=True)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image)
        image.thumbnail(size, Image.Resampling.LANCZOS)
        image = image.convert('RGBA' if 'A' in image.getbands() else 'RGB')
        image.save(target, 'WEBP', quality=76, method=6)


def thumbnail(project, entry, root, source):
    identity = project.relative_to(source).as_posix()
    slug = unicodedata.normalize('NFKD', project.name).encode('ascii', 'ignore').decode().lower()
    slug = re.sub(r'[^a-z0-9]+', '-', slug).strip('-')[:70]
    stem = slug + '-' + hashlib.sha256(identity.encode()).hexdigest()[:8]
    images = [p for p in walk_files(project) if p.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}]
    screenshots = [p for p in images if 'screenshot' in p.name.lower()]
    text = entry.read_text(encoding='utf-8', errors='replace')
    references = re.findall(r'''(?:src\s*=\s*["']|url\(\s*["']?)([^"'\s)>]+)''', text, re.I)
    referenced = []
    for reference in references:
        if urlsplit(reference).scheme or reference.startswith('//'):
            continue
        path = (entry.parent / unquote(html.unescape(reference).split('?')[0])).resolve()
        if path.is_relative_to(project.resolve()) and path.is_file() and path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}:
            referenced.append(path)
    preferred = sorted(images, key=lambda p: (not any(t in p.name.lower() for t in ['hero', 'm16x9_p01', 'w_p01', 'p01']), 'logo' in p.name.lower(), p.as_posix()))
    candidates = screenshots + referenced + preferred
    target = root / 'assets/thumbnails' / (stem + '.webp')
    for candidate in dict.fromkeys(candidates):
        try:
            with Image.open(candidate) as image:
                if min(image.size) < 100:
                    continue
            optimize(candidate, target)
            kind = 'screenshot' if candidate in screenshots else 'source-image'
            return {'thumbnail': target.relative_to(root).as_posix(), 'thumbnailKind': kind,
                    'thumbnailLabel': 'Existing project screenshot' if kind == 'screenshot' else 'Project source image — not a website screenshot',
                    'thumbnailSource': URL_PREFIX + candidate.resolve().relative_to(source.resolve()).as_posix()}
        except (OSError, ValueError):
            continue
    target = target.with_suffix('.svg')
    target.parent.mkdir(parents=True, exist_ok=True)
    title = html.escape(project.name[:48])
    target.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 450" role="img" aria-label="No local preview available"><rect width="720" height="450" fill="#ebe7df"/><path d="M60 90h600v240H60z" fill="none" stroke="#b4b0a6"/><text x="90" y="195" font-family="Arial,sans-serif" font-size="22" fill="#343b35">{title}</text><text x="90" y="235" font-family="Arial,sans-serif" font-size="16" fill="#656b65">Local website · preview image unavailable</text></svg>\n', encoding='utf-8')
    return {'thumbnail': target.relative_to(root).as_posix(), 'thumbnailKind': 'placeholder',
            'thumbnailLabel': 'Preview unavailable — no local project image', 'thumbnailSource': None}


def app_data(root, source):
    app_root = source / 'Apps/MakeMeSmart'
    android = app_root / 'Apps/Android/MakeMeSmartApp/app/src/main'
    sources = android / 'java/com/makemesmart'
    specs = [
        ('Task planning with due dates, completion and postponement', 'data/Models.kt', 'POSTPONED'),
        ('Subject categories and custom task organization', 'data/Models.kt', 'CategoryItem'),
        ('Photo attachments for tasks', 'data/Models.kt', 'photoPath'),
        ('Local task reminders', 'reminder/Reminders.kt', 'AlarmManager'),
        ('Daily and weekly progress statistics', 'ui/StatsScreen.kt', 'weekBars'),
        ('On-device storage without a login or backend', 'data/LocalStore.kt', 'getSharedPreferences'),
    ]
    evidence = []
    for label, filename, token in specs:
        path = sources / filename
        text = path.read_text(encoding='utf-8')
        if token not in text:
            raise ValueError(f'App feature evidence changed: {path}')
        evidence.append({'feature': label, 'source': URL_PREFIX + path.relative_to(source).as_posix(), 'token': token})
    artwork = {}
    for source_name, output_name in [('app_logo_full.png', 'logo'), ('app_logo_mark.png', 'mark'), ('app_slogan.png', 'slogan'), ('app_wordmark.png', 'wordmark')]:
        output = root / f'assets/makemesmart/{output_name}.webp'
        optimize(android / 'res/drawable' / source_name, output, (900, 900))
        artwork[output_name] = output.relative_to(root).as_posix()
    apk_candidates = sorted(app_root.rglob('*.apk'), key=lambda p: ('release' not in p.as_posix().lower(), p.as_posix()))
    apk_report = {'searchedRoot': app_root.relative_to(source).as_posix(), 'candidates': len(apk_candidates), 'invalid': []}
    download = None
    for apk in apk_candidates:
        try:
            with zipfile.ZipFile(apk) as archive:
                names = archive.namelist()
                if archive.testzip() is not None or 'AndroidManifest.xml' not in names or not any(n.endswith('.dex') for n in names):
                    raise ValueError('Missing manifest/dex or failed ZIP integrity check')
            target = root / 'downloads/MakeMeSmart.apk'
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(apk, target)
            checksum = hashlib.sha256(apk.read_bytes()).hexdigest()
            if hashlib.sha256(target.read_bytes()).hexdigest() != checksum:
                raise OSError('APK copy checksum mismatch')
            download = target.relative_to(root).as_posix()
            apk_report.update({'source': URL_PREFIX + apk.relative_to(source).as_posix(), 'sha256': checksum, 'bytes': target.stat().st_size,
                               'validation': 'ZIP integrity, AndroidManifest.xml and DEX entries verified; install/signature not tested.'})
            break
        except (zipfile.BadZipFile, ValueError) as exc:
            apk_report['invalid'].append({'path': apk.relative_to(source).as_posix(), 'reason': str(exc)})
    apk_report['status'] = 'available' if download else 'unavailable: no valid APK found in the supplied MakeMeSmart project'
    app = {'name': 'MakeMeSmart', 'platform': 'Android',
           'description': 'An Android student task planner for organizing schoolwork by subject, tracking due dates, attaching task photos, and reviewing daily or weekly progress. Tasks are stored on the device, with local reminders and no login or backend.',
           'features': [item['feature'] for item in evidence], 'featureEvidence': evidence,
           'download': download, 'downloadAvailable': bool(download),
           'downloadLabel': 'Download Android APK' if download else 'Android APK unavailable',
           'downloadNote': 'No APK is present in the supplied project. Android source is available; no iOS release or download has been verified.' if not download else 'Android APK copied from the supplied project; installation has not been tested.',
           'image': artwork['logo'], 'icon': artwork['mark'], 'artwork': artwork,
           'imageLabel': 'Original MakeMeSmart app branding', 'iosDownload': None,
           'sourceFolder': app_root.relative_to(source).as_posix(), 'verification': 'Features verified in Kotlin source; app execution not tested.'}
    return app, apk_report


def build(root=ROOT, source=SOURCE):
    data = {'categories': [], 'projectBase': URL_PREFIX}
    exclusions = []
    records = []
    for category in sorted((source / 'Website').iterdir(), key=lambda p: p.name.casefold()):
        if not category.is_dir():
            continue
        items = []
        seen = set()
        for project in sorted(category.iterdir(), key=lambda p: p.name.casefold()):
            if not project.is_dir():
                continue
            source_folder = project.relative_to(source).as_posix()
            entry = entrypoint(project)
            if not entry:
                exclusions.append({'sourceFolder': source_folder, 'reason': 'No runnable local HTML entrypoint; empty, design-only, or unbuilt source project.'})
                continue
            identity = str(project.resolve()).casefold()
            if identity in seen:
                exclusions.append({'sourceFolder': source_folder, 'reason': 'Duplicate resolved source folder.'})
                continue
            seen.add(identity)
            name = project.name
            metadata = project / 'resto.json'
            if metadata.is_file():
                name = json.loads(metadata.read_text(encoding='utf-8-sig')).get('name') or name
            local = URL_PREFIX + quote(entry.relative_to(source).as_posix(), safe='/')
            deployed, evidence = deployment_url(project)
            items.append({'nama': name, 'url': deployed or local, 'localUrl': local, 'thumbnail': None,
                          'sourceFolder': source_folder, 'urlType': 'deployment-metadata' if deployed else 'local',
                          'status': 'Local demo' if not deployed else 'Deployment URL from metadata'})
            items[-1].update(thumbnail(project, entry, root, source))
            records.append({'sourceFolder': source_folder, 'entrypoint': URL_PREFIX + entry.relative_to(source).as_posix(),
                            'urlSource': (URL_PREFIX + evidence.relative_to(source).as_posix()) if evidence else 'Local HTML fallback: no trustworthy deployed URL metadata.'})
        data['categories'].append({'name': category.name, 'items': items,
                                   'emptyMessage': 'Your project could be the first in this category.',
                                   'ctaLabel': 'Discuss a project'})
    portrait = root / 'assets/portrait.webp'
    optimize(root / 'My formal picture.jpeg', portrait, (900, 1200))
    data['portrait'] = portrait.relative_to(root).as_posix()
    data['app'], apk_report = app_data(root, source)
    write_json(root / 'data/catalog.json', data)
    serialized = json.dumps(data, ensure_ascii=False, indent=2).replace('\u2028', '\\u2028').replace('\u2029', '\\u2029')
    (root / 'data/catalog.js').write_text('window.PORTFOLIO_DATA = ' + serialized + ';\n', encoding='utf-8')
    all_items = [item for category in data['categories'] for item in category['items']]
    fnb = source / 'Website/Food And Beverage'
    fnb_items = next(c['items'] for c in data['categories'] if c['name'] == fnb.name)
    fnb_excluded = [e for e in exclusions if e['sourceFolder'].startswith('Website/Food And Beverage/')]
    actual_fnb_folders = {p.relative_to(source).as_posix() for p in fnb.iterdir() if p.is_dir()}
    assert actual_fnb_folders == {i['sourceFolder'] for i in fnb_items} | {e['sourceFolder'] for e in fnb_excluded}
    assert len(fnb_items) == len({i['sourceFolder'] for i in fnb_items})
    report = {'generator': 'python scripts/build_catalog.py',
              'sourceRoot': str(source), 'projectBase': URL_PREFIX,
              'counts': {c['name']: len(c['items']) for c in data['categories']}, 'total': len(all_items),
              'categoryCount': len(data['categories']), 'emptyCategoryCount': sum(not c['items'] for c in data['categories']),
              'foodAndBeverage': {'sourceFolderCount': len(actual_fnb_folders), 'websiteCount': len(fnb_items),
                                  'excludedCount': len(fnb_excluded), 'uniqueWebsiteCount': len({i['sourceFolder'] for i in fnb_items})},
              'urlTypes': dict(Counter(i['urlType'] for i in all_items)),
              'thumbnailKinds': dict(Counter(i['thumbnailKind'] for i in all_items)),
              'thumbnailBytes': sum((root / i['thumbnail']).stat().st_size for i in all_items),
              'thumbnails': [{'sourceFolder': i['sourceFolder'], 'output': i['thumbnail'], 'source': i['thumbnailSource'],
                              'kind': i['thumbnailKind']} for i in all_items],
              'portrait': {'source': 'My formal picture.jpeg', 'output': data['portrait'], 'cropped': False},
              'app': apk_report, 'exclusions': exclusions, 'entries': records,
              'notes': ['Every actual Food And Beverage HTML project is included once. Empty/design-only folders are excluded and listed.',
                        'Project images are source photos/artwork, not rendered website previews, except the separately labeled existing screenshot.',
                        'No deployment URL was invented from business websites, social profiles or project names.',
                        f'Local links are relative to the portfolio root and point at {URL_PREFIX}Website/... ; the project files live in the sibling Kumpulan folder (or wherever PORTFOLIO_SOURCE points). Source demos may depend on remote fonts/images or backends.',
                        'Unbuilt Flutter source and empty folders are not presented as runnable websites.',
                        'APK availability is based on an exhaustive search inside Apps/MakeMeSmart; no build is performed.']}
    write_json(root / 'data/catalog-report.json', report)
    return data


if __name__ == '__main__':
    result = build()
    print(json.dumps({c['name']: len(c['items']) for c in result['categories']}, indent=2))
