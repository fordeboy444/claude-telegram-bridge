# [](https://core.telegram.org/bots/api#passportelementerrortranslationfile)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#passportelementerrortranslationfile)\
- **Summary:** PassportElementErrorTranslationFile\ Represents an issue with one of the files that constitute the translation of a document.

# \

PassportElementErrorTranslationFile\
\
Represents an issue with one of the files that constitute the translation of a document. The error is considered resolved when the file changes.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| source | String | Error source, must be _translation_file_ |\
| type | String | Type of element of the user's Telegram Passport which has the issue, one of “passport”, “driver_license”, “identity_card”, “internal_passport”, “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration” |\
| file_hash | String | Base64-encoded file hash |\
| message | String | Error message |\
\
