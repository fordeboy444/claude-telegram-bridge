# [](https://core.telegram.org/bots/api#inlinequeryresultsbutton)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultsbutton)\
- **Summary:** InlineQueryResultsButton\ This object represents a button to be shown above inline query results.

# \

InlineQueryResultsButton\
\
This object represents a button to be shown above inline query results. You **must** use exactly one of the optional fields.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| text | String | Label text on the button |\
| web_app | [WebAppInfo](https://core.telegram.org/bots/api#webappinfo) | _Optional_. Description of the [Web App](https://core.telegram.org/bots/webapps)<br> that will be launched when the user presses the button. The Web App will be able to switch back to the inline mode using the method [switchInlineQuery](https://core.telegram.org/bots/webapps#initializing-mini-apps)<br> inside the Web App. |\
| start_parameter | String | _Optional_. [Deep-linking](https://core.telegram.org/bots/features#deep-linking)<br> parameter for the /start message sent to the bot when a user presses the button. 1-64 characters, only `A-Z`, `a-z`, `0-9`, `_` and `-` are allowed.  <br>  <br>_Example:_ An inline bot that sends YouTube videos can ask the user to connect the bot to their YouTube account to adapt search results accordingly. To do this, it displays a 'Connect your YouTube account' button above the results, or even before showing any. The user presses the button, switches to a private chat with the bot and, in doing so, passes a start parameter that instructs the bot to return an OAuth link. Once done, the bot can offer a [_switch_inline_](https://core.telegram.org/bots/api#inlinekeyboardmarkup)<br> button so that the user can easily return to the chat where they wanted to use the bot's inline capabilities. |\
\
