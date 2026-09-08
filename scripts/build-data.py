"""Validate contributor JSON and deterministically compile the atlas. Python 3 only."""
import csv
import datetime as dt
import json
import math
import re
import sys
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / 'data'
OUT = ROOT / 'public/data'


def read(name):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            if key in result:
                raise ValueError(f'{name}: duplicate JSON key {key}')
            result[key] = value
        return result
    try:
        return json.loads(
            (DATA / name).read_text(encoding='utf-8'),
            object_pairs_hook=unique,
            parse_constant=lambda value: require(False, f'{name}: invalid number {value}'),
        )
    except json.JSONDecodeError as error:
        raise ValueError(f'{name}: {error}') from error


def require(condition, message):
    if not condition:
        raise ValueError(message)


def date_key(value):
    require(isinstance(value, str) and re.fullmatch(r'\d{4}(-\d{2}){0,2}', value), f'Invalid date: {value}')
    parts = [int(x) for x in value.split('-')]
    return dt.date(*(parts + [1] * (3 - len(parts))))


def record(value, required, context, optional=()):
    require(isinstance(value, dict), f'{context}: expected an object')
    missing = set(required) - value.keys()
    unknown = value.keys() - set(required) - set(optional)
    require(not missing, f'{context}: missing fields {sorted(missing)}')
    require(not unknown, f'{context}: unknown or generated fields {sorted(unknown)}')


def text(value, context):
    require(isinstance(value, str) and value.strip(), f'{context}: expected nonempty text')


def text_fields(value, names, context):
    for name in names:
        text(value[name], f'{context}.{name}')


def identifier(value, context):
    require(isinstance(value, str) and re.fullmatch(r'[a-z][a-z0-9-]*', value),
            f'{context}: expected a lowercase ID with letters, digits or hyphens')


def strings(value, context):
    require(isinstance(value, list) and value, f'{context}: expected a nonempty list')
    for item in value:
        text(item, context)
    require(len(value) == len(set(value)), f'{context}: duplicate entry')


def year(value, context):
    require(type(value) is int and 1000 <= value <= 9998, f'{context}: invalid year')


def records(value, required, context):
    require(isinstance(value, list) and value, f'{context}: expected a nonempty list')
    seen = set()
    for index, item in enumerate(value):
        label = f'{context}[{index}]'
        record(item, required, label)
        identifier(item['id'], f'{label}.id')
        require(item['id'] not in seen, f'{context}: duplicate ID {item["id"]}')
        seen.add(item['id'])


def compile_data():
    meta, owners, sources, contexts, scope = [
        read(f'{name}.json') for name in ['meta', 'owners', 'sources', 'contexts', 'scope']
    ]
    meta_text = ['title', 'version', 'scope', 'baseline', 'method', 'sovereignty',
                 'completeness', 'sourcePolicy', 'license', 'compiled', 'currentStatusAsOf']
    record(meta, [*meta_text, 'startYear', 'endYear'], 'meta.json')
    text_fields(meta, meta_text, 'meta.json')
    for field in ['compiled', 'currentStatusAsOf']:
        require(len(meta[field]) == 10, f'meta.{field}: use YYYY-MM-DD')
        date_key(meta[field])
    for field in ['startYear', 'endYear']:
        year(meta[field], f'meta.{field}')
    require(meta['startYear'] < meta['endYear'], 'meta: startYear must precede endYear')

    records(owners, ['id', 'label', 'description', 'color'], 'owners.json')
    records(sources, ['id', 'title', 'publisher', 'type', 'url', 'accessed'], 'sources.json')
    records(contexts, ['id', 'start', 'end', 'title', 'description', 'sources'], 'contexts.json')
    owner_ids = {owner['id'] for owner in owners}
    source_map = {source['id']: source for source in sources}
    for source in sources:
        text_fields(source, ['title', 'publisher', 'type', 'url', 'accessed'], source['id'])
        url = urlsplit(source['url'])
        require(url.scheme == 'https' and url.hostname and not url.username and not url.password,
                f'{source["id"]}: source needs an HTTPS URL without credentials')
        require(len(source['accessed']) == 10, f'{source["id"]}: accessed needs YYYY-MM-DD')
        date_key(source['accessed'])
    for owner in owners:
        text_fields(owner, ['label', 'description', 'color'], owner['id'])
        require(re.fullmatch(r'#[0-9a-fA-F]{6}', owner['color']),
                f'{owner["id"]}: invalid power colour')

    def citations(refs, context):
        strings(refs, f'{context}.sources')
        require(all(ref in source_map for ref in refs), f'{context}: unknown source in {refs}')

    for context in contexts:
        label = context['id']
        require(label not in {'all', 'custom'}, f'{label}: reserved date-preset ID')
        text_fields(context, ['title', 'description'], label)
        citations(context['sources'], label)
        year(context['start'], f'{label}.start')
        year(context['end'], f'{label}.end')
        require(meta['startYear'] <= context['start'] < context['end'] <= meta['endYear'],
                f'{label}: era must be within the atlas range')
    record(scope, ['places', 'tracks'], 'scope.json')
    strings(scope['tracks'], 'scope.tracks')
    strings(scope['places'], 'scope.places')
    for name in scope['tracks']:
        identifier(name, 'scope.tracks')
    files = {path.stem for path in (DATA / 'islands').glob('*.json')}
    require(files == set(scope['tracks']), 'Island files and scope.json tracks do not match')

    islands, all_event_ids = [], set()
    island_keys = ['id', 'name', 'place', 'region', 'coordinates', 'peoples', 'summary',
                   'notes', 'sources', 'initialController', 'initialSovereign', 'events']
    event_keys = ['id', 'date', 'precision', 'kind', 'title', 'detail', 'controller', 'sovereign', 'sources']
    optional = ['uncertainty', 'qualification', 'claimant']
    kinds = {'claim', 'context', 'resistance', 'status', 'capture', 'restoration',
             'settlement', 'treaty', 'independence', 'withdrawal', 'context-change', 'resistance-change'}
    for name in scope['tracks']:
        island = read(f'islands/{name}.json')
        record(island, island_keys, name)
        require(island['id'] == name, f'{name}: filename and ID differ')
        text_fields(island, ['name', 'place', 'region', 'peoples', 'summary', 'notes',
                             'initialController', 'initialSovereign'], name)
        require(island['place'] in scope['places'], f'{name}: unknown modern place')
        coordinates = island['coordinates']
        require(isinstance(coordinates, list) and len(coordinates) == 2 and
                all(type(n) in (int, float) and math.isfinite(n) for n in coordinates),
                f'{name}: coordinates must be two finite numbers [longitude, latitude]')
        lon, lat = coordinates
        require(-89 <= lon <= -58 and 9 <= lat <= 29, f'{name}: coordinates outside atlas bounds')
        control, sovereign = island['initialController'], island['initialSovereign']
        require(control in owner_ids and sovereign in owner_ids, f'{name}: unknown initial power')
        citations(island['sources'], name)
        require(isinstance(island['events'], list) and island['events'], f'{name}: missing events')
        previous_date, count = dt.date(meta['startYear'], 1, 1), 0
        for index, event in enumerate(island['events']):
            record(event, event_keys, f'{name}.events[{index}]', optional)
            eid = event['id']
            identifier(eid, f'{name}.events[{index}].id')
            require(eid.startswith(name + '-') and len(eid) > len(name) + 1 and eid not in all_event_ids,
                    f'Duplicate or invalid event ID: {eid}')
            all_event_ids.add(eid)
            try:
                when = date_key(event['date'])
            except ValueError as error:
                raise ValueError(f'{eid}.date: {error}') from error
            require(previous_date <= when <= dt.date(meta['endYear'], 12, 31),
                    f'{eid}: dates must be chronological and within atlas range')
            previous_date = when
            expected = {4: 'year', 7: 'month', 10: 'day'}[len(event['date'])]
            require(event['precision'] == expected or (event['precision'] == 'circa' and expected == 'year'),
                    f'{eid}: precision disagrees with date')
            require(isinstance(event['kind'], str) and event['kind'] in kinds, f'{eid}: unknown event kind')
            text_fields(event, ['title', 'detail'], eid)
            for field in optional:
                if field in event:
                    text(event[field], f'{eid}.{field}')
            require(event['precision'] != 'circa' or event.get('uncertainty'),
                    f'{eid}: circa date needs an uncertainty note')
            for field in ['controller', 'sovereign']:
                value = event[field]
                require(value is None or (isinstance(value, str) and value in owner_ids),
                        f'{eid}.{field}: unknown power')
            if event['kind'] in {'claim', 'context', 'status', 'resistance'}:
                require(event['controller'] is None and event['sovereign'] is None,
                        f'{eid}: an annotation cannot transfer control or title')
            if event['kind'] == 'claim' or 'claimant' in event:
                require(event.get('claimant') in owner_ids, f'{eid}: a claim needs a known claimant')
            citations(event['sources'], eid)
            event['year'] = when.year
            event['changesControl'] = event['controller'] is not None and event['controller'] != control
            event['changesSovereignty'] = event['sovereign'] is not None and event['sovereign'] != sovereign
            event['previousController'], event['previousSovereign'] = control, sovereign
            control, sovereign = event['controller'] or control, event['sovereign'] or sovereign
            event['resultingController'], event['resultingSovereign'] = control, sovereign
            count += event['changesControl']
        island['controlChanges'] = count
        island['currentController'], island['currentSovereign'] = control, sovereign
        islands.append(island)
    require({island['place'] for island in islands} == set(scope['places']), 'A modern place has no track')
    return dict(meta=meta, owners=owners, sources=sources, contexts=contexts, islands=islands)


def write_outputs(data):
    OUT.mkdir(parents=True, exist_ok=True)
    compact = json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n'
    (OUT / 'caribbean.json').write_text(compact, encoding='utf-8')
    (ROOT / 'lib/caribbean.json').write_text(compact, encoding='utf-8')
    source_map = {s['id']: s for s in data['sources']}
    with (OUT / 'events.csv').open('w', newline='', encoding='utf-8') as file:
        keys = ['island', 'place', 'event_id', 'date', 'precision', 'kind', 'title', 'detail', 'controller', 'sovereign', 'changes_control', 'changes_sovereignty', 'uncertainty', 'qualification', 'source_ids', 'source_urls']
        writer = csv.DictWriter(file, fieldnames=keys)
        writer.writeheader()
        for island in data['islands']:
            for e in island['events']:
                writer.writerow(dict(island=island['name'], place=island['place'], event_id=e['id'], date=e['date'], precision=e['precision'], kind=e['kind'], title=e['title'], detail=e['detail'], controller=e['resultingController'], sovereign=e['resultingSovereign'], changes_control=e['changesControl'], changes_sovereignty=e['changesSovereignty'], uncertainty=e.get('uncertainty', ''), qualification=e.get('qualification', ''), source_ids='; '.join(e['sources']), source_urls='; '.join(source_map[s]['url'] for s in e['sources'])))
    notes = [dict(island=i['name'], event=e['id'], date=e['date'], issue=e['uncertainty']) for i in data['islands'] for e in i['events'] if e.get('uncertainty')]
    (OUT / 'editorial-notes.json').write_text(json.dumps(notes, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    bibliography = ['# Bibliography', '', f"Compiled {data['meta']['compiled']}. See methodology.md for scope and editorial cautions.", '']
    for s in data['sources']:
        bibliography.append(f"- **{s['id']}** — {s['publisher']}. [{s['title']}]({s['url']}). {s['type']}; consulted {s['accessed']}.")
    (OUT / 'bibliography.md').write_text('\n'.join(bibliography) + '\n', encoding='utf-8')
    (OUT / 'methodology.md').write_bytes((DATA / 'methodology.md').read_bytes())


if __name__ == '__main__':
    try:
        compiled = compile_data()
        if '--check' not in sys.argv:
            write_outputs(compiled)
        print(f"Validated {len(compiled['islands'])} tracks, {sum(len(i['events']) for i in compiled['islands'])} events and {len(compiled['sources'])} sources.")
    except (ValueError, KeyError, TypeError) as error:
        sys.exit(f'Dataset validation failed: {error}')
