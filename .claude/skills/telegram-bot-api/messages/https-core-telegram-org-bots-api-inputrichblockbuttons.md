# [](https://core.telegram.org/bots/api#inputrichblockbuttons)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#inputrichblockbuttons)\
- **Summary:** InputRichBlockButtons\ A block containing a list of buttons that are shown in one row, corresponding to the custom HTML tag `<tg-button-row>`.\ | type | String | Type of the block, always “buttons” |\ | buttons | Array of RichMessageButton | List of 1-8 buttons to send |\ | align | String |...

# \

InputRichBlockButtons\
\
A block containing a list of buttons that are shown in one row, corresponding to the custom HTML tag `<tg-button-row>`.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the block, always “buttons” |\
| buttons | Array of [RichMessageButton](https://core.telegram.org/bots/api#richmessagebutton) | List of 1-8 buttons to send |\
| align | String | _Optional_. Horizontal alignment of the buttons. Currently, must be one of “left”, “center”, or “right”. |\
\
