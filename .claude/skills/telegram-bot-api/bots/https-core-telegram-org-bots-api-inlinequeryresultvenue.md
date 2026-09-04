# [](https://core.telegram.org/bots/api#inlinequeryresultvenue)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultvenue)\
- **Summary:** InlineQueryResultVenue\ Represents a venue.

# \

InlineQueryResultVenue\
\
Represents a venue. By default, the venue will be sent by the user. Alternatively, you can use _input_message_content_ to send a message with the specified content instead of the venue.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _venue_ |\
| id  | String | Unique identifier for this result, 1-64 Bytes |\
| latitude | Float | Latitude of the venue location in degrees |\
| longitude | Float | Longitude of the venue location in degrees |\
| title | String | Title of the venue |\
| address | String | Address of the venue |\
| foursquare_id | String | _Optional_. Foursquare identifier of the venue if known |\
| foursquare_type | String | _Optional_. Foursquare type of the venue, if known. (For example, “arts_entertainment/default”, “arts_entertainment/aquarium” or “food/icecream”.) |\
| google_place_id | String | _Optional_. Google Places identifier of the venue |\
| google_place_type | String | _Optional_. Google Places type of the venue. (See [supported types](https://developers.google.com/places/web-service/supported_types)<br>.) |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | _Optional_. Content of the message to be sent instead of the venue |\
| thumbnail_url | String | _Optional_. Url of the thumbnail for the result |\
| thumbnail_width | Integer | _Optional_. Thumbnail width |\
| thumbnail_height | Integer | _Optional_. Thumbnail height |\
\
