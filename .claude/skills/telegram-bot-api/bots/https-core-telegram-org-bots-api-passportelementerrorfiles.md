# [](https://core.telegram.org/bots/api#passportelementerrorfiles)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#passportelementerrorfiles)\
- **Summary:** PassportElementErrorFiles\ Represents an issue with a list of scans.

# \

PassportElementErrorFiles\
\
Represents an issue with a list of scans. The error is considered resolved when the list of files containing the scans changes.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| source | String | Error source, must be _files_ |\
| type | String | The section of the user's Telegram Passport which has the issue, one of “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration” |\
| file_hashes | Array of String | List of base64-encoded file hashes |\
| message | String | Error message |\
\
