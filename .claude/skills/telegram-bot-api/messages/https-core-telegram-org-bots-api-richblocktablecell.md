# [](https://core.telegram.org/bots/api#richblocktablecell)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#richblocktablecell)\
- **Summary:** text RichText _Optional_. Text in the cell. If omitted, then the cell is invisible.

# \

RichBlockTableCell\
\
Cell in a table.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| text | [RichText](https://core.telegram.org/bots/api#richtext) | _Optional_. Text in the cell. If omitted, then the cell is invisible. |\
| is_header | True | _Optional_. _True_, if the cell is a header cell |\
| colspan | Integer | _Optional_. The number of columns the cell spans if it is bigger than 1 |\
| rowspan | Integer | _Optional_. The number of rows the cell spans if it is bigger than 1 |\
| align | String | Horizontal cell content alignment. Currently, must be one of “left”, “center”, or “right”. |\
| valign | String | Vertical cell content alignment. Currently, must be one of “top”, “middle”, or “bottom”. |\
\
