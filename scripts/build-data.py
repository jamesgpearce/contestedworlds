"""Validate contributor JSON and deterministically compile the atlas. Python 3 only."""
import csv
import datetime as dt
import json
import re
import sys
from pathlib import Path

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
    return json.loads((DATA / name).read_text(), object_pairs_hook=unique)


def require(condition, message):
    if not condition:
        raise ValueError(message)


def date_key(value):
    require(isinstance(value, str) and re.fullmatch(r'\d{4}(-\d{2}){0,2}', value), f'Invalid date: {value}')
    parts = [int(x) for x in value.split('-')]
    return dt.date(*(parts + [1] * (3 - len(parts))))


def compile_data():
    meta, owners, sources, contexts, scope = [read(f'{n}.json') for n in ['meta', 'owners', 'sources', 'contexts', 'scope']]
    owner_ids = {o['id'] for o in owners}
    source_map = {s['id']: s for s in sources}
    require(len(owner_ids) == len(owners), 'Duplicate power ID')
    require(len(source_map) == len(sources), 'Duplicate bibliography ID')
    for source in sources:
        require(source['title'] and source['publisher'] and source['type'], f'Incomplete source: {source}')
        require(source['url'].startswith('https://'), f'Source needs an HTTPS URL: {source["id"]}')
        date_key(source['accessed'])
    for owner in owners:
        require(re.fullmatch(r'#[0-9a-fA-F]{6}', owner['color']), f'Invalid power colour: {owner["id"]}')

    def citations(refs, context):
        require(isinstance(refs, list) and len(refs) > 0, f'{context}: needs at least one citation')
        require(len(refs) == len(set(refs)), f'{context}: duplicate citation')
        require(all(ref in source_map for ref in refs), f'{context}: unknown source in {refs}')

    for context in contexts:
        citations(context['sources'], context['id'])
        require(context['start'] < context['end'], f'Invalid era: {context["id"]}')
    require(len(scope['tracks']) == len(set(scope['tracks'])), 'Duplicate track in scope.json')
    files = {f.stem for f in (DATA / 'islands').glob('*.json')}
    require(files == set(scope['tracks']), 'Island files and scope.json tracks do not match')
    islands, all_event_ids = [], set()
    input_keys = {'id', 'date', 'precision', 'kind', 'title', 'detail', 'controller', 'sovereign', 'sources', 'uncertainty', 'qualification', 'claimant'}
    kinds = {'claim', 'context', 'resistance', 'status', 'capture', 'restoration', 'settlement', 'treaty', 'independence', 'withdrawal', 'context-change', 'resistance-change'}
    for name in scope['tracks']:
        island = read(f'islands/{name}.json')
        require(island['id'] == name, f'{name}: filename and ID differ')
        require(island['place'] in scope['places'], f'{name}: unknown modern place')
        require(all(isinstance(island.get(k), str) and island[k].strip() for k in ['name', 'region', 'peoples', 'summary', 'notes']), f'{name}: missing descriptive field')
        lon, lat = island['coordinates']
        require(-89 <= lon <= -58 and 9 <= lat <= 29, f'{name}: coordinates outside atlas bounds')
        control, sovereign = island['initialController'], island['initialSovereign']
        require(control in owner_ids and sovereign in owner_ids, f'{name}: unknown initial power')
        citations(island['sources'], name)
        require(isinstance(island['events'], list) and island['events'], f'{name}: missing events')
        previous_date, count = dt.date(meta['startYear'], 1, 1), 0
        for event in island['events']:
            eid = event['id']
            require(eid.startswith(name + '-') and eid not in all_event_ids, f'Duplicate or invalid event ID: {eid}')
            all_event_ids.add(eid)
            require(not (set(event) - input_keys), f'{eid}: unknown or generated fields {set(event) - input_keys}')
            when = date_key(event['date'])
            require(previous_date <= when <= dt.date(meta['endYear'], 12, 31), f'{eid}: dates must be chronological and within atlas range')
            previous_date = when
            expected = {4: 'year', 7: 'month', 10: 'day'}[len(event['date'])]
            require(event['precision'] == expected or (event['precision'] == 'circa' and expected == 'year'), f'{eid}: precision disagrees with date')
            require(event['precision'] != 'circa' or event.get('uncertainty'), f'{eid}: circa date needs an uncertainty note')
            require(event['kind'] in kinds, f'{eid}: unknown event kind')
            require(all(isinstance(event.get(k), str) and event[k].strip() for k in ['title', 'detail']), f'{eid}: missing explanation')
            require(event['controller'] in owner_ids | {None} and event['sovereign'] in owner_ids | {None}, f'{eid}: unknown power')
            if event['kind'] in {'claim', 'context', 'status', 'resistance'}:
                require(event['controller'] is None and event['sovereign'] is None, f'{eid}: an annotation cannot transfer control or title')
            if event['kind'] == 'claim':
                require(event.get('claimant') in owner_ids, f'{eid}: a claim needs a claimant')
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
    require({i['place'] for i in islands} == set(scope['places']), 'A modern place has no track')
    return dict(meta=meta, owners=owners, sources=sources, contexts=contexts, islands=islands)


def write_outputs(data):
    OUT.mkdir(parents=True, exist_ok=True)
    compact = json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n'
    (OUT / 'caribbean.json').write_text(compact)
    (ROOT / 'lib/caribbean.json').write_text(compact)
    source_map = {s['id']: s for s in data['sources']}
    with (OUT / 'events.csv').open('w', newline='') as file:
        keys = ['island', 'place', 'event_id', 'date', 'precision', 'kind', 'title', 'detail', 'controller', 'sovereign', 'changes_control', 'changes_sovereignty', 'uncertainty', 'qualification', 'source_ids', 'source_urls']
        writer = csv.DictWriter(file, fieldnames=keys)
        writer.writeheader()
        for island in data['islands']:
            for e in island['events']:
                writer.writerow(dict(island=island['name'], place=island['place'], event_id=e['id'], date=e['date'], precision=e['precision'], kind=e['kind'], title=e['title'], detail=e['detail'], controller=e['resultingController'], sovereign=e['resultingSovereign'], changes_control=e['changesControl'], changes_sovereignty=e['changesSovereignty'], uncertainty=e.get('uncertainty', ''), qualification=e.get('qualification', ''), source_ids='; '.join(e['sources']), source_urls='; '.join(source_map[s]['url'] for s in e['sources'])))
    notes = [dict(island=i['name'], event=e['id'], date=e['date'], issue=e['uncertainty']) for i in data['islands'] for e in i['events'] if e.get('uncertainty')]
    (OUT / 'editorial-notes.json').write_text(json.dumps(notes, ensure_ascii=False, indent=2) + '\n')
    bibliography = ['# Bibliography', '', f"Compiled {data['meta']['compiled']}. See methodology.md for scope and editorial cautions.", '']
    for s in data['sources']:
        bibliography.append(f"- **{s['id']}** — {s['publisher']}. [{s['title']}]({s['url']}). {s['type']}; consulted {s['accessed']}.")
    (OUT / 'bibliography.md').write_text('\n'.join(bibliography) + '\n')
    (OUT / 'methodology.md').write_bytes((DATA / 'methodology.md').read_bytes())


if __name__ == '__main__':
    try:
        compiled = compile_data()
        if '--check' not in sys.argv:
            write_outputs(compiled)
        print(f"Validated {len(compiled['islands'])} tracks, {sum(len(i['events']) for i in compiled['islands'])} events and {len(compiled['sources'])} sources.")
    except (ValueError, KeyError, TypeError) as error:
        sys.exit(f'Dataset validation failed: {error}')
