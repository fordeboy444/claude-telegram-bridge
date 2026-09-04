# [](https://core.telegram.org/bots/api#passportelementerrorselfie)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#passportelementerrorselfie)\
- **Summary:** PassportElementErrorSelfie\ Represents an issue with the selfie with a document.

# \

PassportElementErrorSelfie\
\
Represents an issue with the selfie with a document. The error is considered resolved when the file with the selfie changes.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| source | String | Error source, must be _selfie_ |\
| type | String | The section of the user's Telegram Passport which has the issue, one of “passport”, “driver_license”, “identity_card”, “internal_passport” |\
| file_hash | String | Base64-encoded hash of the file with the selfie |\
| message | String | Error message |\
\
