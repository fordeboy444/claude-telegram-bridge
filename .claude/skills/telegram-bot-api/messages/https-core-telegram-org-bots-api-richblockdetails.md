# [](https://core.telegram.org/bots/api#richblockdetails)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#richblockdetails)\
- **Summary:** An expandable block for details disclosure, corresponding to the HTML tag `<details>`.\

# \

RichBlockDetails\
\
An expandable block for details disclosure, corresponding to the HTML tag `<details>`.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the block, always “details” |\
| summary | [RichText](https://core.telegram.org/bots/api#richtext) | Always shown summary of the block |\
| blocks | Array of [RichBlock](https://core.telegram.org/bots/api#richblock) | Content of the block |\
| is_open | True | _Optional_. _True_, if the content of the block is visible by default |\
\
