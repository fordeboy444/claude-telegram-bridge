# backgroundtypepattern

- **URL:** https://core.telegram.org/bots/api/available-types/backgroundtypepattern
- **Summary:** BackgroundTypePattern The background is a .PNG or .TGV (gzipped subset of SVG with MIME type “application/x-tgwallpattern”) pattern to be combined with the background fill chosen by the user. | type | String | Type of the background, always “pattern” | | document | Document | Document with the...

# backgroundtypepattern

BackgroundTypePattern

The background is a .PNG or .TGV (gzipped subset of SVG with MIME type “application/x-tgwallpattern”) pattern to be combined with the background fill chosen by the user.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the background, always “pattern” |
| document | [Document](https://core.telegram.org/bots/api#document) | Document with the pattern |
| fill | [BackgroundFill](https://core.telegram.org/bots/api#backgroundfill) | The background fill that is combined with the pattern |
| intensity | Integer | Intensity of the pattern when it is shown above the filled background; 0-100 |
| is_inverted | True | _Optional_. _True_, if the background fill must be applied only to the pattern itself. All other pixels are black in this case. For dark themes only. |
| is_moving | True | _Optional_. _True_, if the background moves slightly when the device is tilted |
