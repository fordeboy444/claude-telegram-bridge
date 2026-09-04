# [](https://core.telegram.org/bots/api#setgamescore)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#games)\/[](https://core.telegram.org/bots/api#setgamescore)\
- **Summary:** Use this method to set the score of the specified user in a game message.

# \

setGameScore\
\
Use this method to set the score of the specified user in a game message. On success, if the message is not an inline message, the [Message](https://core.telegram.org/bots/api#message)\
 is returned, otherwise _True_ is returned. Returns an error, if the new score is not greater than the user's current score in the chat and _force_ is _False_.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| user_id | Integer | Yes | User identifier |\
| score | Integer | Yes | New score, must be non-negative |\
| force | Boolean | Optional | Pass _True_ if the high score is allowed to decrease. This can be useful when fixing mistakes or banning cheaters. |\
| disable_edit_message | Boolean | Optional | Pass _True_ if the game message should not be automatically edited to include the current scoreboard |\
| chat_id | Integer | Optional | Required if _inline_message_id_ is not specified. Unique identifier for the target chat. |\
| message_id | Integer | Optional | Required if _inline_message_id_ is not specified. Identifier of the sent message. |\
| inline_message_id | String | Optional | Required if _chat_id_ and _message_id_ are not specified. Identifier of the inline message. |\
\
