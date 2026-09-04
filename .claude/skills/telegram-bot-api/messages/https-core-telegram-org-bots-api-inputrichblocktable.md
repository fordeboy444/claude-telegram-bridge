# [](https://core.telegram.org/bots/api#inputrichblocktable)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#inputrichblocktable)\
- **Summary:** InputRichBlockTable\ A table, corresponding to the HTML tag `<table>`.\ | type | String | Type of the block, always “table” |\ | cells | Array of Array of RichBlockTableCell | Cells of the table |\ | is_bordered | True | _Optional_.

# \

InputRichBlockTable\
\
A table, corresponding to the HTML tag `<table>`.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the block, always “table” |\
| cells | Array of Array of [RichBlockTableCell](https://core.telegram.org/bots/api#richblocktablecell) | Cells of the table |\
| is_bordered | True | _Optional_. Pass _True_ if the table has borders |\
| is_striped | True | _Optional_. Pass _True_ if the table is striped |\
| is_compact | True | _Optional_. Pass _True_ if table cells must have smaller indents |\
| caption | [RichText](https://core.telegram.org/bots/api#richtext) | _Optional_. Caption of the table |\
\
