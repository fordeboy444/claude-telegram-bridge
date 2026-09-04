# [](https://core.telegram.org/bots/api#editmessagelivelocation)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#updating-messages)\/[](https://core.telegram.org/bots/api#editmessagelivelocation)\
- **Summary:** editMessageLiveLocation\ Use this method to edit live location messages.

# \

editMessageLiveLocation\
\
Use this method to edit live location messages. A location can be edited until its _live_period_ expires or editing is explicitly disabled by a call to [stopMessageLiveLocation](https://core.telegram.org/bots/api#stopmessagelivelocation)\
. On success, if the edited message is not an inline message, the edited [Message](https://core.telegram.org/bots/api#message)\
 is returned, otherwise _True_ is returned.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Optional | Unique identifier of the business connection on behalf of which the message to be edited was sent |\
| chat_id | Integer or String | Optional | Required if _inline_message_id_ is not specified. Unique identifier for the target chat or username of the target bot, supergroup or channel in the format `@username`. |\
| message_id | Integer | Optional | Required if _inline_message_id_ is not specified. Identifier of the message to edit. |\
| inline_message_id | String | Optional | Required if _chat_id_ and _message_id_ are not specified. Identifier of the inline message. |\
| latitude | Float | Yes | Latitude of new location |\
| longitude | Float | Yes | Longitude of new location |\
| live_period | Integer | Optional | New period in seconds during which the location can be updated, starting from the message send date. If 0x7FFFFFFF is specified, then the location can be updated forever. Otherwise, the new value must not exceed the current _live_period_ by more than a day, and the live location expiration date must remain within the next 90 days. If not specified, then _live_period_ remains unchanged. |\
| horizontal_accuracy | Float | Optional | The radius of uncertainty for the location, measured in meters; 0-1500 |\
| heading | Integer | Optional | Direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. |\
| proximity_alert_radius | Integer | Optional | The maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | Optional | A JSON-serialized object for a new [inline keyboard](https://core.telegram.org/bots/features#inline-keyboards) |\
\
