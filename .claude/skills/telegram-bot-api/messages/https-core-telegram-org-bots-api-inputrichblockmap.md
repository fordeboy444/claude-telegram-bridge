# [](https://core.telegram.org/bots/api#inputrichblockmap)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#inputrichblockmap)\
- **Summary:** A block with a map, corresponding to the custom HTML tag `<tg-map>`.

# \

InputRichBlockMap\
\
A block with a map, corresponding to the custom HTML tag `<tg-map>`. The map's width and height must not exceed 10000 in total. The width and height ratio must be at most 20.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the block, always “map” |\
| location | [Location](https://core.telegram.org/bots/api#location) | Location of the center of the map |\
| zoom | Integer | _Optional_. Map zoom level; 0-24 |\
| width | Integer | _Optional_. Map width; 0-10000 |\
| height | Integer | _Optional_. Map height; 0-10000 |\
| caption | [RichBlockCaption](https://core.telegram.org/bots/api#richblockcaption) | _Optional_. Caption of the block |\
\
