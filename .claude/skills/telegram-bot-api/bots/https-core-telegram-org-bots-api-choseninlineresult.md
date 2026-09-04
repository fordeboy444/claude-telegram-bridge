# [](https://core.telegram.org/bots/api#choseninlineresult)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#choseninlineresult)\
- **Summary:** Represents a result\ of an inline query that was chosen by the user and sent to their chat partner.\ | result_id | String | The unique identifier for the result that was chosen |\ | from | User | The user that chose the result |\ | location | Location | _Optional_.

# \

ChosenInlineResult\
\
Represents a [result](https://core.telegram.org/bots/api#inlinequeryresult)\
 of an inline query that was chosen by the user and sent to their chat partner.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| result_id | String | The unique identifier for the result that was chosen |\
| from | [User](https://core.telegram.org/bots/api#user) | The user that chose the result |\
| location | [Location](https://core.telegram.org/bots/api#location) | _Optional_. Sender location, only for bots that require user location |\
| inline_message_id | String | _Optional_. Identifier of the sent inline message. Available only if there is an [inline keyboard](https://core.telegram.org/bots/api#inlinekeyboardmarkup)<br> attached to the message. Will be also received in [callback queries](https://core.telegram.org/bots/api#callbackquery)<br> and can be used to [edit](https://core.telegram.org/bots/api#updating-messages)<br> the message. |\
| query | String | The query that was used to obtain the result |\
\
**Note:** It is necessary to enable [inline feedback](https://core.telegram.org/bots/inline#collecting-feedback)\
 via [@BotFather](https://t.me/botfather)\
 in order to receive these objects in updates.\
\
