# [](https://core.telegram.org/bots/api#richblockmap)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#richblockmap)\
- **Summary:** A block with a map, corresponding to the custom HTML tag `<tg-map>`.\

# \

RichBlockMap\
\
A block with a map, corresponding to the custom HTML tag `<tg-map>`.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the block, always “map” |\
| location | [Location](https://core.telegram.org/bots/api#location) | Location of the center of the map |\
| zoom | Integer | Map zoom level |\
| width | Integer | Expected width of the map |\
| height | Integer | Expected height of the map |\
| caption | [RichBlockCaption](https://core.telegram.org/bots/api#richblockcaption) | _Optional_. Caption of the block |\
\
