# [](https://core.telegram.org/bots/api#passportelementerrorunspecified)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#passportelementerrorunspecified)\
- **Summary:** PassportElementErrorUnspecified\ Represents an issue in an unspecified place.

# \

PassportElementErrorUnspecified\
\
Represents an issue in an unspecified place. The error is considered resolved when new data is added.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| source | String | Error source, must be _unspecified_ |\
| type | String | Type of element of the user's Telegram Passport which has the issue |\
| element_hash | String | Base64-encoded element hash |\
| message | String | Error message |\
\
