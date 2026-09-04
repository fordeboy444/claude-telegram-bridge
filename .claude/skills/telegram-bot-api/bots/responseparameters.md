# responseparameters

- **URL:** https://core.telegram.org/bots/api/available-types/responseparameters
- **Summary:** Describes why a request was unsuccessful. | migrate_to_chat_id | Integer | _Optional_.

# responseparameters

ResponseParameters

Describes why a request was unsuccessful.

| Field | Type | Description |
| --- | --- | --- |
| migrate_to_chat_id | Integer | _Optional_. The group has been migrated to a supergroup with the specified identifier. This number may have more than 32 significant bits and some programming languages may have difficulty/silent defects in interpreting it. But it has at most 52 significant bits, so a signed 64-bit integer or double-precision float type are safe for storing this identifier. |
| retry_after | Integer | _Optional_. In case of exceeding flood control, the number of seconds left to wait before the request can be repeated |
