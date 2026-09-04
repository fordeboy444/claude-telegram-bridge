# inputmediavoicenote

- **URL:** https://core.telegram.org/bots/api/available-types/inputmediavoicenote
- **Summary:** Represents a voice message file to be sent. | type | String | Type of the media, must be _voice_note_ | | media | String | File to send.

# inputmediavoicenote

InputMediaVoiceNote

Represents a voice message file to be sent.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the media, must be _voice_note_ |
| media | String | File to send. Pass a file_id to send a file that exists on the Telegram servers (recommended), pass an HTTP URL for Telegram to get a file from the Internet, or pass "attach://<file_attach_name>" to upload a new one using multipart/form-data under <file_attach_name> name. [More information on Sending Files »](https://core.telegram.org/bots/api#sending-files) |
| caption | String | _Optional_. Caption of the voice message to be sent, 0-1024 characters after entities parsing |
| parse_mode | String | _Optional_. Mode for parsing entities in the voice message caption. See [formatting options](https://core.telegram.org/bots/api#formatting-options)<br> for more details. |
| caption_entities | Array of [MessageEntity](https://core.telegram.org/bots/api#messageentity) | _Optional_. List of special entities that appear in the caption, which can be specified instead of _parse_mode_ |
| duration | Integer | _Optional_. Duration of the voice message in seconds |
