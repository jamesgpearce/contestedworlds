# Sharing atlas views

Copy the address bar to share the selected islands, chart options and pinned details. Refresh restores that view. Changes replace the current URL without reloading or adding a browser-history entry for every checkbox. Defaults are omitted; a default view has no query string. Clicking a rectangle or claim marker adds its stable identity to the URL; Previous/Next changes it and closing the card removes it. Shared links restore and reveal the pinned card and its About section. Appearance remains a personal device preference; transient hover does not change the URL.

For example, `?islands=cu,lc&g=i&a=t&y=1600-1850` selects Cuba and Saint Lucia, grouped by island on a calendar axis from 1600 through 1850.

The compact query contract lives in `lib/atlas-url.ts`:

| Key | Non-default value | Omitted default |
| --- | --- | --- |
| `islands` | Comma-separated country/territory codes or region slugs; `none` selects none | All islands |
| `g` | `i` for island grouping | Power grouping |
| `a` | `t` for calendar time | Event spacing |
| `m` | `s` for sovereign title | Administration |
| `y` | Inclusive `start-end` calendar years | Full dataset range |
| `c` | `0` to hide claim markers | Visible |
| `q` | `0` to hide qualified-change markers | Visible |
| `detail` | `code.record-suffix`, or `code.initial` for an initial period | No pinned card |

For example, `?islands=dm&detail=dm.initial` opens its initial Indigenous period, while `detail=lc.12` identifies a dated record. Targets use record identities rather than array positions or rounded dates, including clipped periods and claim cards. Removing the target island, excluding its period, hiding its claim marker, or passing an unknown record clears the pin.

Island codes use lowercase [ISO country/territory identifiers](https://unstats.un.org/unsd/methodology/m49/overview/), with atlas-specific suffixes where a country has multiple tracks:

| Country or territory | Individual tracks |
| --- | --- |
| `tt` | `tt-tr` Trinidad, `tt-to` Tobago |
| `ag` | `ag-a` Antigua, `ag-b` Barbuda |
| `kn` | `kn-k` Saint Kitts, `kn-n` Nevis |
| `vi` | `vi-c` Saint Croix, `vi-t` Saint Thomas, `vi-j` Saint John |
| `bq` | `bq-bo` Bonaire, `bq-se` Sint Eustatius, `bq-sa` Saba |

The bare country code selects all its tracks; a suffix selects one. Input is case-insensitive. Region slugs such as `greater-antilles` can be mixed with codes, and are emitted when they shorten the list. `ve` identifies the dataset's Nueva Esparta track. Pinned details always use an unambiguous island code and preserve the record suffix, including leading zeros. The mapping lives in `islandUrlCodes`; its keys must cover the dataset and its values must be unique. Previous URL formats are not supported. Invalid fields fall back individually, and unrelated query parameters and section anchors are preserved.
