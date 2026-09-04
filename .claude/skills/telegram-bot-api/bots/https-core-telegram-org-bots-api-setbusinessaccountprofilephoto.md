# [](https://core.telegram.org/bots/api#setbusinessaccountprofilephoto)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setbusinessaccountprofilephoto)\
- **Summary:** setBusinessAccountProfilePhoto\ Changes the profile photo of a managed business account.

# \

setBusinessAccountProfilePhoto\
\
Changes the profile photo of a managed business account. Requires the _can_edit_profile_photo_ business bot right. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| business_connection_id | String | Yes | Unique identifier of the business connection |\
| photo | [InputProfilePhoto](https://core.telegram.org/bots/api#inputprofilephoto) | Yes | The new profile photo to set |\
| is_public | Boolean | Optional | Pass _True_ to set the public photo, which will be visible even if the main photo is hidden by the business account's privacy settings. An account can have only one public photo. |\
\
