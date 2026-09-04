# Getting Updates

- **URL:** https://core.telegram.org/bots/api/getting-updates
- **Summary:** There are two mutually exclusive ways of receiving updates for your bot - the getUpdates method on one hand and webhooks on the other.

# Getting Updates

Getting updates

There are two mutually exclusive ways of receiving updates for your bot - the [getUpdates](https://core.telegram.org/bots/api#getupdates)
 method on one hand and [webhooks](https://core.telegram.org/bots/api#setwebhook)
 on the other. Incoming updates are stored on the server until the bot receives them either way, but they will not be kept longer than 24 hours.

Regardless of which option you choose, you will receive JSON-serialized [Update](https://core.telegram.org/bots/api#update)
 objects as a result.
