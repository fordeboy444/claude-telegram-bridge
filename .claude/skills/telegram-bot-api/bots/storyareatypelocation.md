# storyareatypelocation

- **URL:** https://core.telegram.org/bots/api/available-types/storyareatypelocation
- **Summary:** StoryAreaTypeLocation Describes a story area pointing to a location.

# storyareatypelocation

StoryAreaTypeLocation

Describes a story area pointing to a location. Currently, a story can have up to 10 location areas.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the area, always “location” |
| latitude | Float | Location latitude in degrees |
| longitude | Float | Location longitude in degrees |
| address | [LocationAddress](https://core.telegram.org/bots/api#locationaddress) | _Optional_. Address of the location |
