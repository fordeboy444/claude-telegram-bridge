# contact

- **URL:** https://core.telegram.org/bots/api/available-types/contact
- **Summary:** This object represents a phone contact. | phone_number | String | Contact's phone number | | first_name | String | Contact's first name | | last_name | String | _Optional_.

# contact

Contact

This object represents a phone contact.

| Field | Type | Description |
| --- | --- | --- |
| phone_number | String | Contact's phone number |
| first_name | String | Contact's first name |
| last_name | String | _Optional_. Contact's last name |
| user_id | Integer | _Optional_. Contact's user identifier in Telegram. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a 64-bit integer or double-precision float type are safe for storing this identifier. |
| vcard | String | _Optional_. Additional data about the contact in the form of a [vCard](https://en.wikipedia.org/wiki/VCard) |
