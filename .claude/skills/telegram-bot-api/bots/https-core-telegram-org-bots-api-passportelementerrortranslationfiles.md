# [](https://core.telegram.org/bots/api#passportelementerrortranslationfiles)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#passportelementerrortranslationfiles)\
- **Summary:** PassportElementErrorTranslationFiles\ Represents an issue with the translated version of a document.

# \

PassportElementErrorTranslationFiles\
\
Represents an issue with the translated version of a document. The error is considered resolved when a file with the document translation change.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| source | String | Error source, must be _translation_files_ |\
| type | String | Type of element of the user's Telegram Passport which has the issue, one of “passport”, “driver_license”, “identity_card”, “internal_passport”, “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration” |\
| file_hashes | Array of String | List of base64-encoded file hashes |\
| message | String | Error message |\
\
