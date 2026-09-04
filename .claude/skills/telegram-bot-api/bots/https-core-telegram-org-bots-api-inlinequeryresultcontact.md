# [](https://core.telegram.org/bots/api#inlinequeryresultcontact)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#inline-mode)\/[](https://core.telegram.org/bots/api#inlinequeryresultcontact)\
- **Summary:** InlineQueryResultContact\ Represents a contact with a phone number.

# \

InlineQueryResultContact\
\
Represents a contact with a phone number. By default, this contact will be sent by the user. Alternatively, you can use _input_message_content_ to send a message with the specified content instead of the contact.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Type of the result, must be _contact_ |\
| id  | String | Unique identifier for this result, 1-64 Bytes |\
| phone_number | String | Contact's phone number |\
| first_name | String | Contact's first name |\
| last_name | String | _Optional_. Contact's last name |\
| vcard | String | _Optional_. Additional data about the contact in the form of a [vCard](https://en.wikipedia.org/wiki/VCard)<br>, 0-2048 bytes |\
| reply_markup | [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup) | _Optional_. [Inline keyboard](https://core.telegram.org/bots/features#inline-keyboards)<br> attached to the message |\
| input_message_content | [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent) | _Optional_. Content of the message to be sent instead of the contact |\
| thumbnail_url | String | _Optional_. Url of the thumbnail for the result |\
| thumbnail_width | Integer | _Optional_. Thumbnail width |\
| thumbnail_height | Integer | _Optional_. Thumbnail height |\
\
