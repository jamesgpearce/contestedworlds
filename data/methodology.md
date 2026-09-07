# Contested Worlds — editorial method

Version 1.0.0, compiled 6 September 2026.

## Scope

All 31 present-day jurisdictions in `rough.tsv` are retained. There are 36 tracks because Trinidad/Tobago, Antigua/Barbuda, Saint Kitts/Nevis and Saint Croix/Saint Thomas/Saint John have different colonial histories. Hispaniola is represented by its two modern jurisdictions. Nueva Esparta uses Margarita as a stated proxy; Coche and Cubagua are not separately traced. Saint Vincent, Grenada, Guadeloupe, the Bahamas, Turks and Caicos, the Caymans and the BVI remain stated groups or principal-island proxies. Mainland Belize, Guyana and Suriname, Bermuda, and every small dependency or offshore cay are outside this scope.

This is a complete coverage of the scratch pad's jurisdictions and a curated chronology of their major transitions. It is not a claim to an exhaustive record of every landing, raid, local chiefdom, abandoned outpost or internal constitutional change. A public historical edition would benefit from a Caribbean historian's review of the flagged early sequences.

## Two related questions

1. **Administration**: which external power controlled the principal administration? Military occupations can move a line while the legal title stays put.
2. **Sovereign title**: which polity held the recorded title or sovereign status? This is a history of asserted and recognized political arrangements, not an endorsement of colonial claims to Indigenous land.

Invasion does not automatically cede sovereignty. Claims do not automatically create government. Proprietary changes inside an empire normally stay in its lane; the Knights of Malta are separately visible as administrators because they are a distinctive transnational actor, with French sovereignty retained. England, Great Britain and the UK share one expressly labeled lane; internal metropolitan regime changes do not create new empires. The European Netherlands' 1810 incorporation into France is not automatically propagated to Dutch islands already under British occupation.

The independent lane includes sovereign island states, even where external coercion compromised autonomy. Long U.S. military governments in Cuba, Haiti and the Dominican Republic are plotted in administration mode, while later geographically limited interventions are annotations. Guantánamo Bay and the 1762 occupation of Havana do not move all of Cuba. Modern Dutch constituent countries remain under the Kingdom's sovereign label; republic status and independence are distinct.

## Time and uncertainty

Dates retain day, month, year or circa precision. No day is invented for a year-only record. The SVG plots at that date's position on a linear axis. The 1450 left edge is a graphical baseline, not the beginning of Indigenous history. The present-day names identify places; they do not project modern nation-states into the past. Initial Indigenous or unadministered states are schematic context. An uninterrupted initial line is not archaeological proof of continuous settlement or political identity.

The shared/unsettled lane covers coexisting colonists, contested administration, local revolutionary control without recognition, or a period without established colonial government. These are not equivalent political systems; every such island includes an explanation. A control change counter counts distinct recorded changes of the plotted administration, including settlement and restoration, rather than asserting a universal “number of times the island changed hands.”

Read the event-level uncertainty field in JSON or CSV and `editorial-notes.json`. In particular: Tobago's early chronology is intermittent and sometimes conflicting; Guadeloupe's 1794 reconquest unfolded from June to December and its 1816 handover accounts disagree on the day; French settlement of Grenada is dated 1649 following the national museum; Jamaica's first Spanish colony is dated 1509 following the Jamaican government; Saint Lucia's 1650 colony is distinguished from earlier footholds; Margarita's war is shown as contested instead of inventing clean control over the entire island; late-seventeenth-century Dutch restorations are qualified where narrative summaries use treaty years rather than handover years.

## Bibliography and confidence

Every event has source IDs resolving to titled, linked bibliography entries. Government, library, museum, treaty editions and scholarship are preferred. World Statesmen is a secondary chronology used for many fine-grained dates; it contains occasional contradictions and is not treated as independent archival verification. Local scholarship takes precedence when it explains a discrepancy. Event links document provenance, not universal double verification. Bibliography links were located/read through web research; there is no permanent source archive or promise that every link will remain live.

The original TSV is untouched. `data/islands/*.json` and `data/sources.json` are the editable research sources. `scripts/build-data.py` validates and compiles them. `public/data/caribbean.json` contains metadata, owners, islands, events, contextual eras and bibliography; `events.csv` is a flat export with post-event administration and sovereignty plus source URLs. Do not edit generated output directly.

Original prose and dataset structure are offered under CC BY 4.0; external source texts retain their own rights.
