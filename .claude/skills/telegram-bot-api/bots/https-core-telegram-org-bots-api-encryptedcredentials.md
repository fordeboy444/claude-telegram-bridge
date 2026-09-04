# [](https://core.telegram.org/bots/api#encryptedcredentials)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#encryptedcredentials)\
- **Summary:** EncryptedCredentials\ Describes data required for decrypting and authenticating EncryptedPassportElement\ .

# \

EncryptedCredentials\
\
Describes data required for decrypting and authenticating [EncryptedPassportElement](https://core.telegram.org/bots/api#encryptedpassportelement)\
. See the [Telegram Passport Documentation](https://core.telegram.org/passport#receiving-information)\
 for a complete description of the data decryption and authentication processes.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| data | String | Base64-encoded encrypted JSON-serialized data with unique user's payload, data hashes and secrets required for [EncryptedPassportElement](https://core.telegram.org/bots/api#encryptedpassportelement)<br> decryption and authentication |\
| hash | String | Base64-encoded data hash for data authentication |\
| secret | String | Base64-encoded secret, encrypted with the bot's public RSA key, required for data decryption |\
\
