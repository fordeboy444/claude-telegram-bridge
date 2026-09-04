# [](https://core.telegram.org/bots/api#passportelementerrorfile)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#passportelementerrorfile)\
- **Summary:** PassportElementErrorFile\ Represents an issue with a document scan.

# \

PassportElementErrorFile\
\
Represents an issue with a document scan. The error is considered resolved when the file with the document scan changes.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| source | String | Error source, must be _file_ |\
| type | String | The section of the user's Telegram Passport which has the issue, one of “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration” |\
| file_hash | String | Base64-encoded file hash |\
| message | String | Error message |\
\
