# [](https://core.telegram.org/bots/api#inputlocationmessagecontent)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inputlocationmessagecontent)\
- **Summary:** InputLocationMessageContent\ of a location message to be sent as the result of an inline query.\ | latitude | Float | Latitude of the location in degrees |\ | longitude | Float | Longitude of the location in degrees |\ | horizontal_accuracy | Float | _Optional_.

# \

InputLocationMessageContent\
\
Represents the [content](https://core.telegram.org/bots/api#inputmessagecontent)\
 of a location message to be sent as the result of an inline query.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| latitude | Float | Latitude of the location in degrees |\
| longitude | Float | Longitude of the location in degrees |\
| horizontal_accuracy | Float | _Optional_. The radius of uncertainty for the location, measured in meters; 0-1500 |\
| live_period | Integer | _Optional_. Period in seconds during which the location can be updated, must be between 60 and 86400, or 0x7FFFFFFF for live locations that can be edited indefinitely |\
| heading | Integer | _Optional_. For live locations, a direction in which the user is moving, in degrees. Must be between 1 and 360 if specified. |\
| proximity_alert_radius | Integer | _Optional_. For live locations, a maximum distance for proximity alerts about approaching another chat member, in meters. Must be between 1 and 100000 if specified. |\
\
