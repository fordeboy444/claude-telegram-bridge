# [](https://core.telegram.org/bots/api#savepreparedkeyboardbutton)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#savepreparedkeyboardbutton)\
- **Summary:** savePreparedKeyboardButton\ Stores a keyboard button that can be used by a user within a Mini App.

# \

savePreparedKeyboardButton\
\
Stores a keyboard button that can be used by a user within a Mini App. Returns a [PreparedKeyboardButton](https://core.telegram.org/bots/api#preparedkeyboardbutton)\
 object.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| user_id | Integer | Yes | Unique identifier of the target user that can use the button |\
| button | [KeyboardButton](https://core.telegram.org/bots/api#keyboardbutton) | Yes | A JSON-serialized object describing the button to be saved. The button must be of the type _request_users_, _request_chat_, or _request_managed_bot_. |\
\
