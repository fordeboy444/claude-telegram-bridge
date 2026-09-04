# inputpolloption

- **URL:** https://core.telegram.org/bots/api/available-types/inputpolloption
- **Summary:** This object contains information about one answer option in a poll to be sent. | text | String | Option text, 1-100 characters | | text_parse_mode | String | _Optional_.

# inputpolloption

InputPollOption

This object contains information about one answer option in a poll to be sent.

| Field | Type | Description |
| --- | --- | --- |
| text | String | Option text, 1-100 characters |
| text_parse_mode | String | _Optional_. Mode for parsing entities in the text. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. Currently, only custom emoji entities are allowed. |
| text_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. A JSON-serialized list of special entities that appear in the poll option text. It can be specified instead of _text_parse_mode_. |
| media | [InputPollOptionMedia](https://core.telegram.org/bots/api#inputpolloptionmedia) | _Optional_. Media added to the poll option |
