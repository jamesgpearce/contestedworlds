"""Contributor safety checks, independent of browser or visualization code."""
import importlib.util
import json
import shutil
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('builder', ROOT / 'scripts/build-data.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class ContributorSafety(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.original = builder.DATA
        builder.DATA = Path(self.temp.name) / 'data'
        shutil.copytree(self.original, builder.DATA)

    def tearDown(self):
        builder.DATA = self.original
        self.temp.cleanup()

    def edit(self, change):
        path = builder.DATA / 'islands/saint-lucia.json'
        data = json.loads(path.read_text())
        change(data)
        path.write_text(json.dumps(data))

    def test_a_cited_text_correction_needs_no_visualization_edit(self):
        self.edit(lambda data: data['events'][0].update(title='A corrected historical explanation'))
        result = builder.compile_data()
        lucia = next(i for i in result['islands'] if i['id'] == 'saint-lucia')
        self.assertEqual(lucia['events'][0]['title'], 'A corrected historical explanation')
        self.assertEqual(lucia['currentSovereign'], 'independent')

    def test_bad_citation_is_rejected(self):
        self.edit(lambda data: data['events'][0].update(sources=['missing-source']))
        with self.assertRaisesRegex(ValueError, 'unknown source'):
            builder.compile_data()

    def test_invalid_calendar_date_is_rejected(self):
        self.edit(lambda data: data['events'][0].update(date='1627-02-30', precision='day'))
        with self.assertRaises(ValueError):
            builder.compile_data()

    def test_claim_cannot_accidentally_move_a_line(self):
        self.edit(lambda data: data['events'][0].update(controller='britain'))
        with self.assertRaisesRegex(ValueError, 'annotation cannot transfer'):
            builder.compile_data()

    def test_unknown_power_is_rejected(self):
        self.edit(lambda data: data['events'][2].update(controller='frnace'))
        with self.assertRaisesRegex(ValueError, 'unknown power'):
            builder.compile_data()

    def test_date_precision_is_not_silently_invented(self):
        self.edit(lambda data: data['events'][0].update(precision='day'))
        with self.assertRaisesRegex(ValueError, 'precision disagrees'):
            builder.compile_data()

    def test_reordered_events_require_chronological_order(self):
        self.edit(lambda data: data['events'].reverse())
        with self.assertRaisesRegex(ValueError, 'chronological'):
            builder.compile_data()

    def test_duplicate_json_keys_are_rejected(self):
        path = builder.DATA / 'islands/saint-lucia.json'
        text = path.read_text().replace('"name": "Saint Lucia"', '"name": "Saint Lucia", "name": "Oops"')
        path.write_text(text)
        with self.assertRaisesRegex(ValueError, 'duplicate JSON key'):
            builder.compile_data()

    def test_compilation_is_deterministic(self):
        self.assertEqual(builder.compile_data(), builder.compile_data())

    def test_optional_card_text_cannot_be_an_object(self):
        self.edit(lambda data: data['events'][0].update(uncertainty={'note': 'Oops'}))
        with self.assertRaisesRegex(ValueError, 'uncertainty: expected nonempty text'):
            builder.compile_data()

    def test_unknown_island_fields_are_not_silently_ignored(self):
        self.edit(lambda data: data.update(initialSoveriegn='spain'))
        with self.assertRaisesRegex(ValueError, 'unknown or generated fields'):
            builder.compile_data()

    def test_missing_event_fields_identify_the_record(self):
        self.edit(lambda data: data['events'][0].pop('detail'))
        with self.assertRaisesRegex(ValueError, r'saint-lucia.events\[0\]: missing fields'):
            builder.compile_data()

    def test_coordinates_and_citations_reject_wrong_types(self):
        for field, value in [('coordinates', [-61]), ('coordinates', [True, 14]),
                             ('sources', [{'id': 'regional'}])]:
            with self.subTest(field=field, value=value):
                original = builder.read('islands/saint-lucia.json')
                self.edit(lambda data: data.update({field: value}))
                with self.assertRaises(ValueError):
                    builder.compile_data()
                (builder.DATA / 'islands/saint-lucia.json').write_text(json.dumps(original))

    def test_duplicate_eras_cannot_create_ambiguous_presets(self):
        path = builder.DATA / 'contexts.json'
        contexts = json.loads(path.read_text())
        contexts.append(contexts[0])
        path.write_text(json.dumps(contexts))
        with self.assertRaisesRegex(ValueError, 'duplicate ID'):
            builder.compile_data()

    def test_nonstandard_json_numbers_are_rejected(self):
        path = builder.DATA / 'islands/saint-lucia.json'
        path.write_text(path.read_text().replace('"events": [', '"extra": NaN, "events": ['))
        with self.assertRaisesRegex(ValueError, 'invalid number NaN'):
            builder.compile_data()


if __name__ == '__main__':
    unittest.main()
