# [](https://core.telegram.org/bots/api#passportfile)\

- **URL:** https://core.telegram.org/bots/api/[](https://core.telegram.org/bots/api#telegram-passport)\/[](https://core.telegram.org/bots/api#passportfile)\
- **Summary:** This object represents a file uploaded to Telegram Passport.

# \

PassportFile\
\
This object represents a file uploaded to Telegram Passport. Currently all Telegram Passport files are in JPEG format when decrypted and don't exceed 10MB.\
\
| Field | Type | Description |\
| --- | --- | --- |\
| file_id | String | Identifier for this file, which can be used to download or reuse the file |\
| file_unique_id | String | Unique identifier for this file, which is supposed to be the same over time and for different bots. Can't be used to download or reuse the file. |\
| file_size | Integer | File size in bytes |\
| file_date | Integer | Unix time when the file was uploaded |\
\
