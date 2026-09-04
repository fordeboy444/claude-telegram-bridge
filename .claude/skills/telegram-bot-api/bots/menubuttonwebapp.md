# menubuttonwebapp

- **URL:** https://core.telegram.org/bots/api/available-types/menubuttonwebapp
- **Summary:** Represents a menu button, which launches a Web App | type | String | Type of the button, must be _web_app_ | | text | String | Text on the button | | web_app | WebAppInfo | Description of the Web App that will be launched when the user presses the button.

# menubuttonwebapp

MenuButtonWebApp

Represents a menu button, which launches a [Web App](https://core.telegram.org/bots/webapps)
.

| Field | Type | Description |
| --- | --- | --- |
| type | String | Type of the button, must be _web_app_ |
| text | String | Text on the button |
| web_app | [WebAppInfo](https://core.telegram.org/bots/api#webappinfo) | Description of the Web App that will be launched when the user presses the button. The Web App will be able to send an arbitrary message on behalf of the user using the method [answerWebAppQuery](https://core.telegram.org/bots/api#answerwebappquery)<br>. Alternatively, a `t.me` link to a Web App of the bot can be specified in the object instead of the Web App's URL, in which case the Web App will be opened as if the user pressed the link. |
