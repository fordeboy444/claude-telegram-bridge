# [](https://core.telegram.org/bots/api#removebusinessaccountprofilephoto)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#removebusinessaccountprofilephoto)\
- **Summary:** removeBusinessAccountProfilePhoto\ Removes the current profile photo of a managed business account.

# \

removeBusinessAccountProfilePhoto\
\
Removes the current profile photo of a managed business account. Requires the _can_edit_profile_photo_ business bot right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| is_public | Boolean | Optional | Pass _True_ to remove the public photo, which is visible even if the main photo is hidden by the business account's privacy settings. After the main photo is removed, the previous profile photo (if present) becomes the main photo. |\
\
