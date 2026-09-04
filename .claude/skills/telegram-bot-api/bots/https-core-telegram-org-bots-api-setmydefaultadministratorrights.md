# [](https://core.telegram.org/bots/api#setmydefaultadministratorrights)\

- **URL:** https://core.telegram.org/bots/api/available-methods/[](https://core.telegram.org/bots/api#setmydefaultadministratorrights)\
- **Summary:** setMyDefaultAdministratorRights\ Use this method to change the default administrator rights requested by the bot when it's added as an administrator to groups or channels.

# \

setMyDefaultAdministratorRights\
\
Use this method to change the default administrator rights requested by the bot when it's added as an administrator to groups or channels. These rights will be suggested to users, but they are free to modify the list before adding the bot. Returns _True_ on success.\
\
| Parameter | Type | Required | Description |\
| --- | --- | --- | --- |\
| rights | [ChatAdministratorRights](https://core.telegram.org/bots/api#chatadministratorrights) | Optional | A JSON-serialized object describing new default administrator rights. If not specified, the default administrator rights will be cleared. |\
| for_channels | Boolean | Optional | Pass _True_ to change the default administrator rights of the bot in channels. Otherwise, the default administrator rights of the bot for groups and supergroups will be changed. |\
\
