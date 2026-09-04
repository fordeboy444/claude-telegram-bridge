# replyparameters

- **URL:** https://core.telegram.org/bots/api/available-types/replyparameters
- **Summary:** Describes reply parameters for the message that is being sent. | message_id | Integer | _Optional_.

# replyparameters

ReplyParameters

Describes reply parameters for the message that is being sent.

| Field | Type | Description |
| --- | --- | --- |
| message_id | Integer | _Optional_. Identifier of the message that will be replied to in the current chat, or in the chat _chat_id_ if it is specified. Required if _ephemeral_message_id_ isn't specified. |
| chat_id | Integer or String | _Optional_. If the message to be replied to is from a different chat, unique identifier for the chat or username of the bot, supergroup or channel in the format `@username`. Not supported for messages sent on behalf of a business account, messages from channel direct messages chats and ephemeral messages. |
| ephemeral_message_id | Integer | _Optional_. Identifier of the incoming ephemeral message that will be replied to in the current chat. A reply to an ephemeral message must itself be an ephemeral message. An ephemeral message may only be replied to within 15 seconds of being sent. Required if _message_id_ isn't specified. |
| allow_sending_without_reply | Boolean | _Optional_. Pass _True_ if the message should be sent even if the specified message to be replied to is not found. Always _False_ for replies in another chat or forum topic, and sent ephemeral messages. Always _True_ for messages sent on behalf of a business account. |
| quote | String | _Optional_. Quoted part of the message to be replied to; 0-1024 characters after entities parsing. The quote must be an exact substring of the message to be replied to, including _bold_, _italic_, _underline_, _strikethrough_, _spoiler_, _custom_emoji_, and _date_time_ entities. The message will fail to send if the quote isn't found in the original message. Ignored for ephemeral messages. |
| quote_parse_mode | String | _Optional_. Mode for parsing entities in the quote. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |
| quote_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. A JSON-serialized list of special entities that appear in the quote. It can be specified instead of _quote_parse_mode_. |
| quote_position | Integer | _Optional_. Position of the quote in the original message in UTF-16 code units |
| checklist_task_id | Integer | _Optional_. Identifier of the specific checklist task to be replied to |
| poll_option_id | String | _Optional_. Persistent identifier of the specific poll option to be replied to |
