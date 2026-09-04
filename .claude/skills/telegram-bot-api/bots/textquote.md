# textquote

- **URL:** https://core.telegram.org/bots/api/available-types/textquote
- **Summary:** This object contains information about the quoted part of a message that is replied to by the given message. | text | String | Text of the quoted part of a message that is replied to by the given message | | entities | Array of MessageEntity | _Optional_.

# textquote

TextQuote

This object contains information about the quoted part of a message that is replied to by the given message.

| Field | Type | Description |
| --- | --- | --- |
| text | String | Text of the quoted part of a message that is replied to by the given message |
| entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. Special entities that appear in the quote. Currently, only _bold_, _italic_, _underline_, _strikethrough_, _spoiler_, _custom_emoji_, and _date_time_ entities are kept in quotes. |
| position | Integer | Approximate quote position in the original message in UTF-16 code units as specified by the sender |
| is_manual | True | _Optional_. _True_, if the quote was chosen manually by the message sender. Otherwise, the quote was added automatically by the server. |
