# [](Https://Core.Telegram.Org/Bots/Api#Games)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#games)\
- **Summary:** Your bot can offer users **HTML5 games** to play solo or to compete against each other in groups and one-on-one chats.

# \

Games\
\
Your bot can offer users **HTML5 games** to play solo or to compete against each other in groups and one-on-one chats. Create games via [@BotFather](https://t.me/botfather)\
 using the _/newgame_ command. Please note that this kind of power requires responsibility: you will need to accept the terms for each game that your bots will be offering.\
\
*   Games are a new type of content on Telegram, represented by the [Game](https://core.telegram.org/bots/api#game)\
     and [InlineQueryResultGame](https://core.telegram.org/bots/api#inlinequeryresultgame)\
     objects.\
*   Once you've created a game via [BotFather](https://t.me/botfather)\
    , you can send games to chats as regular messages using the [sendGame](https://core.telegram.org/bots/api#sendgame)\
     method, or use [inline mode](https://core.telegram.org/bots/api#inline-mode)\
     with [InlineQueryResultGame](https://core.telegram.org/bots/api#inlinequeryresultgame)\
    .\
*   If you send the game message without any buttons, it will automatically have a 'Play _GameName_' button. When this button is pressed, your bot gets a [CallbackQuery](https://core.telegram.org/bots/api#callbackquery)\
     with the _game_short_name_ of the requested game. You provide the correct URL for this particular user and the app opens the game in the in-app browser.\
*   You can manually add multiple buttons to your game message. Please note that the first button in the first row **must always** launch the game, using the field _callback_game_ in [InlineKeyboardButton](https://core.telegram.org/bots/api#inlinekeyboardbutton)\
    . You can add extra buttons according to taste: e.g., for a description of the rules, or to open the game's official community.\
*   To make your game more attractive, you can upload a GIF animation that demonstrates the game to the users via [BotFather](https://t.me/botfather)\
     (see [Lumberjack](https://t.me/gamebot?game=lumberjack)\
     for example).\
*   A game message will also display high scores for the current chat. Use [setGameScore](https://core.telegram.org/bots/api#setgamescore)\
     to post high scores to the chat with the game, add the _disable_edit_message_ parameter to disable automatic update of the message with the current scoreboard.\
*   Use [getGameHighScores](https://core.telegram.org/bots/api#getgamehighscores)\
     to get data for in-game high score tables.\
*   You can also add an extra [sharing button](https://core.telegram.org/bots/games#sharing-your-game-to-telegram-chats)\
     for users to share their best score to different chats.\
*   For examples of what can be done using this new stuff, check the [@gamebot](https://t.me/gamebot)\
     and [@gamee](https://t.me/gamee)\
     bots.\
\
