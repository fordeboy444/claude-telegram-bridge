# [](https://core.telegram.org/bots/api#inputrichblockdocument)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#rich-messages)\/[](https://core.telegram.org/bots/api#inputrichblockdocument)\
- **Summary:** InputRichBlockDocument\ A block with a general file, corresponding to the custom HTML tag `<tg-document>`.\ | type | String | Type of the block, always “document” |\ | document | InputMediaDocument | The document.

# \

InputRichBlockDocument\
\
A block with a general file, corresponding to the custom HTML tag `<tg-document>`.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the block, always “document” |\
| document | [InputMediaDocument](https://core.telegram.org/bots/api#inputmediadocument) | The document. Caption is ignored. |\
| caption | [RichBlockCaption](https://core.telegram.org/bots/api#richblockcaption) | _Optional_. Caption of the block |\
\
