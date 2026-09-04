# linkpreviewoptions

- **URL:** https://core.telegram.org/bots/api/available-types/linkpreviewoptions
- **Summary:** Describes the options used for link preview generation. | is_disabled | Boolean | _Optional_. _True_, if the link preview is disabled | | url | String | _Optional_.

# linkpreviewoptions

LinkPreviewOptions

Describes the options used for link preview generation.

| Field | Type | Description |
| --- | --- | --- |
| is_disabled | Boolean | _Optional_. _True_, if the link preview is disabled |
| url | String | _Optional_. URL to use for the link preview. If empty, then the first URL found in the message text will be used. |
| prefer_small_media | Boolean | _Optional_. _True_, if the media in the link preview is supposed to be shrunk; ignored if the URL isn't explicitly specified or media size change isn't supported for the preview |
| prefer_large_media | Boolean | _Optional_. _True_, if the media in the link preview is supposed to be enlarged; ignored if the URL isn't explicitly specified or media size change isn't supported for the preview |
| show_above_text | Boolean | _Optional_. _True_, if the link preview must be shown above the message text; otherwise, the link preview will be shown below the message text |
