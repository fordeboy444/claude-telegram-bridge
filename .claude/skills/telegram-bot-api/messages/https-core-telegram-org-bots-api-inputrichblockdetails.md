# [](https://core.telegram.org/bots/api#inputrichblockdetails)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#inputrichblockdetails)\
- **Summary:** InputRichBlockDetails\ An expandable block for details disclosure, corresponding to the HTML tag `<details>`.\ | type | String | Type of the block, always “details” |\ | summary | RichText | Always shown summary of the block |\ | blocks | Array of InputRichBlock | Content of the block |\ | is_open...

# \

InputRichBlockDetails\
\
An expandable block for details disclosure, corresponding to the HTML tag `<details>`.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the block, always “details” |\
| summary | [RichText](https://core.telegram.org/bots/api#richtext) | Always shown summary of the block |\
| blocks | Array of [InputRichBlock](https://core.telegram.org/bots/api#inputrichblock) | Content of the block |\
| is_open | True | _Optional_. Pass _True_ if the content of the block is visible by default |\
\
