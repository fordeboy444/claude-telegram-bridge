# callbackquery

- **URL:** https://core.telegram.org/bots/api/available-types/callbackquery
- **Summary:** This object represents an incoming callback query from a callback button in an inline keyboard .

# callbackquery

CallbackQuery

This object represents an incoming callback query from a callback button in an [inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)
. If the button that originated the query was attached to a message sent by the bot, the field _message_ will be present. If the button was attached to a message sent via the bot (in [inline mode](https://core.telegram.org/bots/api#inline-mode)
), the field _inline_message_id_ will be present. Exactly one of the fields _data_ or _game_short_name_ will be present.

| Field | Type | Description |
| --- | --- | --- |
| id  | String | Unique identifier for this query |
| from | [User](https://core.telegram.org/bots/api#user) | Sender |
| message | [MaybeInaccessibleMessage](https://core.telegram.org/bots/api#maybeinaccessiblemessage) | _Optional_. Message sent by the bot with the callback button that originated the query |
| inline_message_id | String | _Optional_. Identifier of the message sent via the bot in inline mode, that originated the query |
| chat_instance | String | Global identifier, uniquely corresponding to the chat to which the message with the callback button was sent. Useful for high scores in [games](https://core.telegram.org/bots/api#games)<br>. |
| data | String | _Optional_. Data associated with the callback button. Be aware that the message originated the query can contain no callback buttons with this data. |
| game_short_name | String | _Optional_. Short name of a [Game](https://core.telegram.org/bots/api#game)<br> to be returned, serves as the unique identifier for the game |

> **NOTE:** After the user presses a callback button, Telegram clients will display a progress bar until you call [answerCallbackQuery](https://core.telegram.org/bots/api#answercallbackquery)
> . It is, therefore, necessary to react by calling [answerCallbackQuery](https://core.telegram.org/bots/api#answercallbackquery)
>  even if no notification to the user is needed (e.g., without specifying any of the optional parameters).
