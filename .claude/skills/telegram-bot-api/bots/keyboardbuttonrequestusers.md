# keyboardbuttonrequestusers

- **URL:** https://core.telegram.org/bots/api/available-types/keyboardbuttonrequestusers
- **Summary:** KeyboardButtonRequestUsers This object defines the criteria used to request suitable users.

# keyboardbuttonrequestusers

KeyboardButtonRequestUsers

This object defines the criteria used to request suitable users. Information about the selected users will be shared with the bot when the corresponding button is pressed. [More about requesting users »](https://core.telegram.org/bots/features#chat-and-user-selection)

| Field | Type | Description |
| --- | --- | --- |
| request_id | Integer | Signed 32-bit identifier of the request that will be received back in the [UsersShared](https://core.telegram.org/bots/api#usersshared)<br> object. Must be unique within the message. |
| user_is_bot | Boolean | _Optional_. Pass _True_ to request bots, pass _False_ to request regular users. If not specified, no additional restrictions are applied. |
| user_is_premium | Boolean | _Optional_. Pass _True_ to request premium users, pass _False_ to request non-premium users. If not specified, no additional restrictions are applied. |
| max_quantity | Integer | _Optional_. The maximum number of users to be selected; 1-10. Defaults to 1. |
| request_name | Boolean | _Optional_. Pass _True_ to request the users' first and last names |
| request_username | Boolean | _Optional_. Pass _True_ to request the users' usernames |
| request_photo | Boolean | _Optional_. Pass _True_ to request the users' photos |
