# [](https://core.telegram.org/bots/api#richblocklistitem)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#richblocklistitem)\
- **Summary:** label String Label of the item

# \

RichBlockListItem\
\
An item of a list.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| label | String | Label of the item |\
| blocks | Array of [RichBlock](https://core.telegram.org/bots/api#richblock) | The content of the item |\
| has_checkbox | True | _Optional_. _True_, if the item has a checkbox |\
| is_checked | True | _Optional_. _True_, if the item has a checked checkbox |\
| value | Integer | _Optional_. For ordered lists, the numeric value of the item label |\
| type | String | _Optional_. For ordered lists, the type of the item label; must be one of “a” for lowercase letters, “A” for uppercase letters, “i” for lowercase Roman numerals, “I” for uppercase Roman numerals, or “1” for decimal numbers |\
\
