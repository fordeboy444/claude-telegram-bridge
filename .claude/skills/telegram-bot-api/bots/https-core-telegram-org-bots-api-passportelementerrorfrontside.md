# [](https://core.telegram.org/bots/api#passportelementerrorfrontside)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#passportelementerrorfrontside)\
- **Summary:** PassportElementErrorFrontSide\ Represents an issue with the front side of a document.

# \

PassportElementErrorFrontSide\
\
Represents an issue with the front side of a document. The error is considered resolved when the file with the front side of the document changes.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| source | String | Error source, must be _front_side_ |\
| type | String | The section of the user's Telegram Passport which has the issue, one of “passport”, “driver_license”, “identity_card”, “internal_passport” |\
| file_hash | String | Base64-encoded hash of the file with the front side of the document |\
| message | String | Error message |\
\
