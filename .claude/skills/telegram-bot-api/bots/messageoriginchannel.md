# messageoriginchannel

- **URL:** https://core.telegram.org/bots/api/available-types/messageoriginchannel
- **Summary:** MessageOriginChannel The message was originally sent to a channel chat. | type | String | Type of the message origin, always “channel” | | date | Integer | Date the message was sent originally in Unix time | | chat | Chat | Channel chat to which the message was originally sent | | message_id |...

# messageoriginchannel

MessageOriginChannel

The message was originally sent to a channel chat.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the message origin, always “channel” |
| date | Integer | Date the message was sent originally in Unix time |
| chat | [Chat](https://core.telegram.org/bots/api#chat) | Channel chat to which the message was originally sent |
| message_id | Integer | Unique message identifier inside the chat |
| author_signature | String | _Optional_. Signature of the original post author |
