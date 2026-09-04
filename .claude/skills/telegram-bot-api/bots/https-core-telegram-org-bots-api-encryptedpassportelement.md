# [](https://core.telegram.org/bots/api#encryptedpassportelement)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#encryptedpassportelement)\
- **Summary:** EncryptedPassportElement\ Describes documents or other Telegram Passport elements shared with the bot by the user.\ | type | String | Element type.

# \

EncryptedPassportElement\
\
Describes documents or other Telegram Passport elements shared with the bot by the user.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| type | String | Element type. One of “personal_details”, “passport”, “driver_license”, “identity_card”, “internal_passport”, “address”, “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration”, “temporary_registration”, “phone_number”, “email”. |\
| data | String | _Optional_. Base64-encoded encrypted Telegram Passport element data provided by the user; available only for “personal_details”, “passport”, “driver_license”, “identity_card”, “internal_passport” and “address” types. Can be decrypted and verified using the accompanying [EncryptedCredentials](https://core.telegram.org/bots/api#encryptedcredentials)<br>. |\
| phone_number | String | _Optional_. User's verified phone number; available only for “phone_number” type |\
| email | String | _Optional_. User's verified email address; available only for “email” type |\
| files | Array of [PassportFile](https://core.telegram.org/bots/api#passportfile) | _Optional_. Array of encrypted files with documents provided by the user; available only for “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration” and “temporary_registration” types. Files can be decrypted and verified using the accompanying [EncryptedCredentials](https://core.telegram.org/bots/api#encryptedcredentials)<br>. |\
| front_side | [PassportFile](https://core.telegram.org/bots/api#passportfile) | _Optional_. Encrypted file with the front side of the document, provided by the user; available only for “passport”, “driver_license”, “identity_card” and “internal_passport”. The file can be decrypted and verified using the accompanying [EncryptedCredentials](https://core.telegram.org/bots/api#encryptedcredentials)<br>. |\
| reverse_side | [PassportFile](https://core.telegram.org/bots/api#passportfile) | _Optional_. Encrypted file with the reverse side of the document, provided by the user; available only for “driver_license” and “identity_card”. The file can be decrypted and verified using the accompanying [EncryptedCredentials](https://core.telegram.org/bots/api#encryptedcredentials)<br>. |\
| selfie | [PassportFile](https://core.telegram.org/bots/api#passportfile) | _Optional_. Encrypted file with the selfie of the user holding a document, provided by the user; available if requested for “passport”, “driver_license”, “identity_card” and “internal_passport”. The file can be decrypted and verified using the accompanying [EncryptedCredentials](https://core.telegram.org/bots/api#encryptedcredentials)<br>. |\
| translation | Array of [PassportFile](https://core.telegram.org/bots/api#passportfile) | _Optional_. Array of encrypted files with translated versions of documents provided by the user; available if requested for “passport”, “driver_license”, “identity_card”, “internal_passport”, “utility_bill”, “bank_statement”, “rental_agreement”, “passport_registration” and “temporary_registration” types. Files can be decrypted and verified using the accompanying [EncryptedCredentials](https://core.telegram.org/bots/api#encryptedcredentials)<br>. |\
| hash | String | Base64-encoded element hash for using in [PassportElementErrorUnspecified](https://core.telegram.org/bots/api#passportelementerrorunspecified) |\
\
