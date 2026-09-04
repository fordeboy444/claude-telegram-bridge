# [](https://core.telegram.org/bots/api#game)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#games)\/[](https://core.telegram.org/bots/api#game)\
- **Summary:** This object represents a game.

# \

Game\
\
This object represents a game. Use BotFather to create and edit games, their short names will act as unique identifiers.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| title | String | Title of the game |\
| description | String | Description of the game |\
| photo | Array of [PhotoSize](https://core.telegram.org/bots/api#photosize) | Photo that will be displayed in the game message in chats |\
| text | String | _Optional_. Brief description of the game or high scores included in the game message. Can be automatically edited to include current high scores for the game when the bot calls [setGameScore](https://core.telegram.org/bots/api#setgamescore)<br>, or manually edited using [editMessageText](https://core.telegram.org/bots/api#editmessagetext)<br>. 0-4096 characters. |\
| text_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. Special entities that appear in _text_, such as usernames, URLs, bot commands, etc. |\
| animation | [Animation](https://core.telegram.org/bots/api#animation) | _Optional_. Animation that will be displayed in the game message in chats. Upload via [BotFather](https://t.me/botfather)<br>. |\
\
