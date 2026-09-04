# Telegram Bot API - Overview

- **URL:** https://core.telegram.org/bots/api
- **Summary:** *   Follow on X

# Telegram Bot API - Overview

*   [Follow on X](https://x.com/telegram)
    

*   [Home](https://telegram.org/)
    
*   [FAQ](https://telegram.org/faq)
    
*   [Apps](https://telegram.org/apps)
    
*   [API](https://core.telegram.org/api)
    
*   [Protocol](https://core.telegram.org/mtproto)
    
*   [Schema](https://core.telegram.org/schema)
    

*   [Recent changes](https://core.telegram.org/bots/api#recent-changes)
    *   [August 24, 2026](https://core.telegram.org/bots/api#august-24-2026)
        
    *   [July 14, 2026](https://core.telegram.org/bots/api#july-14-2026)
        
    *   [June 11, 2026](https://core.telegram.org/bots/api#june-11-2026)
        
    *   [May 8, 2026](https://core.telegram.org/bots/api#may-8-2026)
        
*   [Authorizing your bot](https://core.telegram.org/bots/api#authorizing-your-bot)
    
*   [Making requests](https://core.telegram.org/bots/api#making-requests)
    *   [Making requests when getting updates](https://core.telegram.org/bots/api#making-requests-when-getting-updates)
        
*   [Using a Local Bot API Server](https://core.telegram.org/bots/api#using-a-local-bot-api-server)
    *   [Do I need a Local Bot API Server](https://core.telegram.org/bots/api#do-i-need-a-local-bot-api-server)
        
*   [Getting updates](https://core.telegram.org/bots/api#getting-updates)
    *   [Update](https://core.telegram.org/bots/api#update)
        
    *   [getUpdates](https://core.telegram.org/bots/api#getupdates)
        
    *   [setWebhook](https://core.telegram.org/bots/api#setwebhook)
        
    *   [deleteWebhook](https://core.telegram.org/bots/api#deletewebhook)
        
    *   [getWebhookInfo](https://core.telegram.org/bots/api#getwebhookinfo)
        
    *   [WebhookInfo](https://core.telegram.org/bots/api#webhookinfo)
        
*   [Available types](https://core.telegram.org/bots/api#available-types)
    *   [User](https://core.telegram.org/bots/api#user)
        
    *   [Chat](https://core.telegram.org/bots/api#chat)
        
    *   [ChatFullInfo](https://core.telegram.org/bots/api#chatfullinfo)
        
    *   [Message](https://core.telegram.org/bots/api#message)
        
    *   [MessageId](https://core.telegram.org/bots/api#messageid)
        
    *   [InaccessibleMessage](https://core.telegram.org/bots/api#inaccessiblemessage)
        
    *   [MaybeInaccessibleMessage](https://core.telegram.org/bots/api#maybeinaccessiblemessage)
        
    *   [MessageEntity](https://core.telegram.org/bots/api#messageentity)
        
    *   [TextQuote](https://core.telegram.org/bots/api#textquote)
        
    *   [ExternalReplyInfo](https://core.telegram.org/bots/api#externalreplyinfo)
        
    *   [ReplyParameters](https://core.telegram.org/bots/api#replyparameters)
        
    *   [EphemeralMessageParameters](https://core.telegram.org/bots/api#ephemeralmessageparameters)
        
    *   [MessageOrigin](https://core.telegram.org/bots/api#messageorigin)
        
    *   [MessageOriginUser](https://core.telegram.org/bots/api#messageoriginuser)
        
    *   [MessageOriginHiddenUser](https://core.telegram.org/bots/api#messageoriginhiddenuser)
        
    *   [MessageOriginChat](https://core.telegram.org/bots/api#messageoriginchat)
        
    *   [MessageOriginChannel](https://core.telegram.org/bots/api#messageoriginchannel)
        
    *   [PhotoSize](https://core.telegram.org/bots/api#photosize)
        
    *   [Animation](https://core.telegram.org/bots/api#animation)
        
    *   [Audio](https://core.telegram.org/bots/api#audio)
        
    *   [Document](https://core.telegram.org/bots/api#document)
        
    *   [LivePhoto](https://core.telegram.org/bots/api#livephoto)
        
    *   [Story](https://core.telegram.org/bots/api#story)
        
    *   [VideoQuality](https://core.telegram.org/bots/api#videoquality)
        
    *   [Video](https://core.telegram.org/bots/api#video)
        
    *   [VideoNote](https://core.telegram.org/bots/api#videonote)
        
    *   [Voice](https://core.telegram.org/bots/api#voice)
        
    *   [PaidMediaInfo](https://core.telegram.org/bots/api#paidmediainfo)
        
    *   [PaidMedia](https://core.telegram.org/bots/api#paidmedia)
        
    *   [PaidMediaLivePhoto](https://core.telegram.org/bots/api#paidmedialivephoto)
        
    *   [PaidMediaPhoto](https://core.telegram.org/bots/api#paidmediaphoto)
        
    *   [PaidMediaPreview](https://core.telegram.org/bots/api#paidmediapreview)
        
    *   [PaidMediaVideo](https://core.telegram.org/bots/api#paidmediavideo)
        
    *   [Contact](https://core.telegram.org/bots/api#contact)
        
    *   [Dice](https://core.telegram.org/bots/api#dice)
        
    *   [Link](https://core.telegram.org/bots/api#link)
        
    *   [PollMedia](https://core.telegram.org/bots/api#pollmedia)
        
    *   [InputPollMedia](https://core.telegram.org/bots/api#inputpollmedia)
        
    *   [InputPollOptionMedia](https://core.telegram.org/bots/api#inputpolloptionmedia)
        
    *   [PollOption](https://core.telegram.org/bots/api#polloption)
        
    *   [InputPollOption](https://core.telegram.org/bots/api#inputpolloption)
        
    *   [PollAnswer](https://core.telegram.org/bots/api#pollanswer)
        
    *   [Poll](https://core.telegram.org/bots/api#poll)
        
    *   [ChecklistTask](https://core.telegram.org/bots/api#checklisttask)
        
    *   [Checklist](https://core.telegram.org/bots/api#checklist)
        
    *   [InputChecklistTask](https://core.telegram.org/bots/api#inputchecklisttask)
        
    *   [InputChecklist](https://core.telegram.org/bots/api#inputchecklist)
        
    *   [Location](https://core.telegram.org/bots/api#location)
        
    *   [Venue](https://core.telegram.org/bots/api#venue)
        
    *   [WebAppData](https://core.telegram.org/bots/api#webappdata)
        
    *   [ProximityAlertTriggered](https://core.telegram.org/bots/api#proximityalerttriggered)
        
    *   [MessageAutoDeleteTimerChanged](https://core.telegram.org/bots/api#messageautodeletetimerchanged)
        
    *   [ManagedBotCreated](https://core.telegram.org/bots/api#managedbotcreated)
        
    *   [ManagedBotUpdated](https://core.telegram.org/bots/api#managedbotupdated)
        
    *   [BotSubscriptionUpdated](https://core.telegram.org/bots/api#botsubscriptionupdated)
        
    *   [MessageGenerationStopped](https://core.telegram.org/bots/api#messagegenerationstopped)
        
    *   [PollOptionAdded](https://core.telegram.org/bots/api#polloptionadded)
        
    *   [PollOptionDeleted](https://core.telegram.org/bots/api#polloptiondeleted)
        
    *   [ChatBoostAdded](https://core.telegram.org/bots/api#chatboostadded)
        
    *   [BackgroundFill](https://core.telegram.org/bots/api#backgroundfill)
        
    *   [BackgroundFillSolid](https://core.telegram.org/bots/api#backgroundfillsolid)
        
    *   [BackgroundFillGradient](https://core.telegram.org/bots/api#backgroundfillgradient)
        
    *   [BackgroundFillFreeformGradient](https://core.telegram.org/bots/api#backgroundfillfreeformgradient)
        
    *   [BackgroundType](https://core.telegram.org/bots/api#backgroundtype)
        
    *   [BackgroundTypeFill](https://core.telegram.org/bots/api#backgroundtypefill)
        
    *   [BackgroundTypeWallpaper](https://core.telegram.org/bots/api#backgroundtypewallpaper)
        
    *   [BackgroundTypePattern](https://core.telegram.org/bots/api#backgroundtypepattern)
        
    *   [BackgroundTypeChatTheme](https://core.telegram.org/bots/api#backgroundtypechattheme)
        
    *   [ChatBackground](https://core.telegram.org/bots/api#chatbackground)
        
    *   [ChecklistTasksDone](https://core.telegram.org/bots/api#checklisttasksdone)
        
    *   [ChecklistTasksAdded](https://core.telegram.org/bots/api#checklisttasksadded)
        
    *   [CommunityChatAdded](https://core.telegram.org/bots/api#communitychatadded)
        
    *   [CommunityChatJoined](https://core.telegram.org/bots/api#communitychatjoined)
        
    *   [CommunityChatRemoved](https://core.telegram.org/bots/api#communitychatremoved)
        
    *   [ForumTopicCreated](https://core.telegram.org/bots/api#forumtopiccreated)
        
    *   [ForumTopicClosed](https://core.telegram.org/bots/api#forumtopicclosed)
        
    *   [ForumTopicEdited](https://core.telegram.org/bots/api#forumtopicedited)
        
    *   [ForumTopicReopened](https://core.telegram.org/bots/api#forumtopicreopened)
        
    *   [GeneralForumTopicHidden](https://core.telegram.org/bots/api#generalforumtopichidden)
        
    *   [GeneralForumTopicUnhidden](https://core.telegram.org/bots/api#generalforumtopicunhidden)
        
    *   [SharedUser](https://core.telegram.org/bots/api#shareduser)
        
    *   [UsersShared](https://core.telegram.org/bots/api#usersshared)
        
    *   [ChatShared](https://core.telegram.org/bots/api#chatshared)
        
    *   [WriteAccessAllowed](https://core.telegram.org/bots/api#writeaccessallowed)
        
    *   [VideoChatScheduled](https://core.telegram.org/bots/api#videochatscheduled)
        
    *   [VideoChatStarted](https://core.telegram.org/bots/api#videochatstarted)
        
    *   [VideoChatEnded](https://core.telegram.org/bots/api#videochatended)
        
    *   [VideoChatParticipantsInvited](https://core.telegram.org/bots/api#videochatparticipantsinvited)
        
    *   [PaidMessagePriceChanged](https://core.telegram.org/bots/api#paidmessagepricechanged)
        
    *   [DirectMessagePriceChanged](https://core.telegram.org/bots/api#directmessagepricechanged)
        
    *   [SuggestedPostApproved](https://core.telegram.org/bots/api#suggestedpostapproved)
        
    *   [SuggestedPostApprovalFailed](https://core.telegram.org/bots/api#suggestedpostapprovalfailed)
        
    *   [SuggestedPostDeclined](https://core.telegram.org/bots/api#suggestedpostdeclined)
        
    *   [SuggestedPostPaid](https://core.telegram.org/bots/api#suggestedpostpaid)
        
    *   [SuggestedPostRefunded](https://core.telegram.org/bots/api#suggestedpostrefunded)
        
    *   [GiveawayCreated](https://core.telegram.org/bots/api#giveawaycreated)
        
    *   [Giveaway](https://core.telegram.org/bots/api#giveaway)
        
    *   [GiveawayWinners](https://core.telegram.org/bots/api#giveawaywinners)
        
    *   [GiveawayCompleted](https://core.telegram.org/bots/api#giveawaycompleted)
        
    *   [LinkPreviewOptions](https://core.telegram.org/bots/api#linkpreviewoptions)
        
    *   [SuggestedPostPrice](https://core.telegram.org/bots/api#suggestedpostprice)
        
    *   [SuggestedPostInfo](https://core.telegram.org/bots/api#suggestedpostinfo)
        
    *   [SuggestedPostParameters](https://core.telegram.org/bots/api#suggestedpostparameters)
        
    *   [DirectMessagesTopic](https://core.telegram.org/bots/api#directmessagestopic)
        
    *   [UserProfilePhotos](https://core.telegram.org/bots/api#userprofilephotos)
        
    *   [UserProfileAudios](https://core.telegram.org/bots/api#userprofileaudios)
        
    *   [File](https://core.telegram.org/bots/api#file)
        
    *   [WebAppInfo](https://core.telegram.org/bots/api#webappinfo)
        
    *   [ReplyKeyboardMarkup](https://core.telegram.org/bots/api#replykeyboardmarkup)
        
    *   [KeyboardButton](https://core.telegram.org/bots/api#keyboardbutton)
        
    *   [KeyboardButtonRequestUsers](https://core.telegram.org/bots/api#keyboardbuttonrequestusers)
        
    *   [KeyboardButtonRequestChat](https://core.telegram.org/bots/api#keyboardbuttonrequestchat)
        
    *   [KeyboardButtonRequestManagedBot](https://core.telegram.org/bots/api#keyboardbuttonrequestmanagedbot)
        
    *   [KeyboardButtonPollType](https://core.telegram.org/bots/api#keyboardbuttonpolltype)
        
    *   [ReplyKeyboardRemove](https://core.telegram.org/bots/api#replykeyboardremove)
        
    *   [InlineKeyboardMarkup](https://core.telegram.org/bots/api#inlinekeyboardmarkup)
        
    *   [InlineKeyboardButton](https://core.telegram.org/bots/api#inlinekeyboardbutton)
        
    *   [LoginUrl](https://core.telegram.org/bots/api#loginurl)
        
    *   [SwitchInlineQueryChosenChat](https://core.telegram.org/bots/api#switchinlinequerychosenchat)
        
    *   [CopyTextButton](https://core.telegram.org/bots/api#copytextbutton)
        
    *   [DisabledButton](https://core.telegram.org/bots/api#disabledbutton)
        
    *   [CallbackQuery](https://core.telegram.org/bots/api#callbackquery)
        
    *   [ForceReply](https://core.telegram.org/bots/api#forcereply)
        
    *   [Community](https://core.telegram.org/bots/api#community)
        
    *   [ChatPhoto](https://core.telegram.org/bots/api#chatphoto)
        
    *   [ChatInviteLink](https://core.telegram.org/bots/api#chatinvitelink)
        
    *   [ChatAdministratorRights](https://core.telegram.org/bots/api#chatadministratorrights)
        
    *   [ChatMemberUpdated](https://core.telegram.org/bots/api#chatmemberupdated)
        
    *   [ChatMember](https://core.telegram.org/bots/api#chatmember)
        
    *   [ChatMemberOwner](https://core.telegram.org/bots/api#chatmemberowner)
        
    *   [ChatMemberAdministrator](https://core.telegram.org/bots/api#chatmemberadministrator)
        
    *   [ChatMemberMember](https://core.telegram.org/bots/api#chatmembermember)
        
    *   [ChatMemberRestricted](https://core.telegram.org/bots/api#chatmemberrestricted)
        
    *   [ChatMemberLeft](https://core.telegram.org/bots/api#chatmemberleft)
        
    *   [ChatMemberBanned](https://core.telegram.org/bots/api#chatmemberbanned)
        
    *   [ChatJoinRequest](https://core.telegram.org/bots/api#chatjoinrequest)
        
    *   [ChatPermissions](https://core.telegram.org/bots/api#chatpermissions)
        
    *   [Birthdate](https://core.telegram.org/bots/api#birthdate)
        
    *   [BusinessIntro](https://core.telegram.org/bots/api#businessintro)
        
    *   [BusinessLocation](https://core.telegram.org/bots/api#businesslocation)
        
    *   [BusinessOpeningHoursInterval](https://core.telegram.org/bots/api#businessopeninghoursinterval)
        
    *   [BusinessOpeningHours](https://core.telegram.org/bots/api#businessopeninghours)
        
    *   [UserRating](https://core.telegram.org/bots/api#userrating)
        
    *   [StoryAreaPosition](https://core.telegram.org/bots/api#storyareaposition)
        
    *   [LocationAddress](https://core.telegram.org/bots/api#locationaddress)
        
    *   [StoryAreaType](https://core.telegram.org/bots/api#storyareatype)
        
    *   [StoryAreaTypeLocation](https://core.telegram.org/bots/api#storyareatypelocation)
        
    *   [StoryAreaTypeSuggestedReaction](https://core.telegram.org/bots/api#storyareatypesuggestedreaction)
        
    *   [StoryAreaTypeLink](https://core.telegram.org/bots/api#storyareatypelink)
        
    *   [StoryAreaTypeWeather](https://core.telegram.org/bots/api#storyareatypeweather)
        
    *   [StoryAreaTypeUniqueGift](https://core.telegram.org/bots/api#storyareatypeuniquegift)
        
    *   [StoryArea](https://core.telegram.org/bots/api#storyarea)
        
    *   [ChatLocation](https://core.telegram.org/bots/api#chatlocation)
        
    *   [ReactionType](https://core.telegram.org/bots/api#reactiontype)
        
    *   [ReactionTypeEmoji](https://core.telegram.org/bots/api#reactiontypeemoji)
        
    *   [ReactionTypeCustomEmoji](https://core.telegram.org/bots/api#reactiontypecustomemoji)
        
    *   [ReactionTypePaid](https://core.telegram.org/bots/api#reactiontypepaid)
        
    *   [ReactionCount](https://core.telegram.org/bots/api#reactioncount)
        
    *   [MessageReactionUpdated](https://core.telegram.org/bots/api#messagereactionupdated)
        
    *   [MessageReactionCountUpdated](https://core.telegram.org/bots/api#messagereactioncountupdated)
        
    *   [ForumTopic](https://core.telegram.org/bots/api#forumtopic)
        
    *   [GiftBackground](https://core.telegram.org/bots/api#giftbackground)
        
    *   [Gift](https://core.telegram.org/bots/api#gift)
        
    *   [Gifts](https://core.telegram.org/bots/api#gifts)
        
    *   [UniqueGiftModel](https://core.telegram.org/bots/api#uniquegiftmodel)
        
    *   [UniqueGiftSymbol](https://core.telegram.org/bots/api#uniquegiftsymbol)
        
    *   [UniqueGiftBackdropColors](https://core.telegram.org/bots/api#uniquegiftbackdropcolors)
        
    *   [UniqueGiftBackdrop](https://core.telegram.org/bots/api#uniquegiftbackdrop)
        
    *   [UniqueGiftColors](https://core.telegram.org/bots/api#uniquegiftcolors)
        
    *   [UniqueGift](https://core.telegram.org/bots/api#uniquegift)
        
    *   [GiftInfo](https://core.telegram.org/bots/api#giftinfo)
        
    *   [UniqueGiftInfo](https://core.telegram.org/bots/api#uniquegiftinfo)
        
    *   [OwnedGift](https://core.telegram.org/bots/api#ownedgift)
        
    *   [OwnedGiftRegular](https://core.telegram.org/bots/api#ownedgiftregular)
        
    *   [OwnedGiftUnique](https://core.telegram.org/bots/api#ownedgiftunique)
        
    *   [OwnedGifts](https://core.telegram.org/bots/api#ownedgifts)
        
    *   [BotAccessSettings](https://core.telegram.org/bots/api#botaccesssettings)
        
    *   [AcceptedGiftTypes](https://core.telegram.org/bots/api#acceptedgifttypes)
        
    *   [StarAmount](https://core.telegram.org/bots/api#staramount)
        
    *   [BotCommand](https://core.telegram.org/bots/api#botcommand)
        
    *   [BotCommandScope](https://core.telegram.org/bots/api#botcommandscope)
        
    *   [Determining list of commands](https://core.telegram.org/bots/api#determining-list-of-commands)
        
    *   [BotCommandScopeDefault](https://core.telegram.org/bots/api#botcommandscopedefault)
        
    *   [BotCommandScopeAllPrivateChats](https://core.telegram.org/bots/api#botcommandscopeallprivatechats)
        
    *   [BotCommandScopeAllGroupChats](https://core.telegram.org/bots/api#botcommandscopeallgroupchats)
        
    *   [BotCommandScopeAllChatAdministrators](https://core.telegram.org/bots/api#botcommandscopeallchatadministrators)
        
    *   [BotCommandScopeChat](https://core.telegram.org/bots/api#botcommandscopechat)
        
    *   [BotCommandScopeChatAdministrators](https://core.telegram.org/bots/api#botcommandscopechatadministrators)
        
    *   [BotCommandScopeChatMember](https://core.telegram.org/bots/api#botcommandscopechatmember)
        
    *   [BotName](https://core.telegram.org/bots/api#botname)
        
    *   [BotDescription](https://core.telegram.org/bots/api#botdescription)
        
    *   [BotShortDescription](https://core.telegram.org/bots/api#botshortdescription)
        
    *   [MenuButton](https://core.telegram.org/bots/api#menubutton)
        
    *   [MenuButtonCommands](https://core.telegram.org/bots/api#menubuttoncommands)
        
    *   [MenuButtonWebApp](https://core.telegram.org/bots/api#menubuttonwebapp)
        
    *   [MenuButtonDefault](https://core.telegram.org/bots/api#menubuttondefault)
        
    *   [ChatBoostSource](https://core.telegram.org/bots/api#chatboostsource)
        
    *   [ChatBoostSourcePremium](https://core.telegram.org/bots/api#chatboostsourcepremium)
        
    *   [ChatBoostSourceGiftCode](https://core.telegram.org/bots/api#chatboostsourcegiftcode)
        
    *   [ChatBoostSourceGiveaway](https://core.telegram.org/bots/api#chatboostsourcegiveaway)
        
    *   [ChatBoost](https://core.telegram.org/bots/api#chatboost)
        
    *   [ChatBoostUpdated](https://core.telegram.org/bots/api#chatboostupdated)
        
    *   [ChatBoostRemoved](https://core.telegram.org/bots/api#chatboostremoved)
        
    *   [ChatOwnerLeft](https://core.telegram.org/bots/api#chatownerleft)
        
    *   [ChatOwnerChanged](https://core.telegram.org/bots/api#chatownerchanged)
        
    *   [UserChatBoosts](https://core.telegram.org/bots/api#userchatboosts)
        
    *   [BusinessBotRights](https://core.telegram.org/bots/api#businessbotrights)
        
    *   [BusinessConnection](https://core.telegram.org/bots/api#businessconnection)
        
    *   [BusinessMessagesDeleted](https://core.telegram.org/bots/api#businessmessagesdeleted)
        
    *   [SentWebAppMessage](https://core.telegram.org/bots/api#sentwebappmessage)
        
    *   [SentGuestMessage](https://core.telegram.org/bots/api#sentguestmessage)
        
    *   [PreparedInlineMessage](https://core.telegram.org/bots/api#preparedinlinemessage)
        
    *   [PreparedKeyboardButton](https://core.telegram.org/bots/api#preparedkeyboardbutton)
        
    *   [ResponseParameters](https://core.telegram.org/bots/api#responseparameters)
        
    *   [InputMedia](https://core.telegram.org/bots/api#inputmedia)
        
    *   [InputMediaAnimation](https://core.telegram.org/bots/api#inputmediaanimation)
        
    *   [InputMediaAudio](https://core.telegram.org/bots/api#inputmediaaudio)
        
    *   [InputMediaDocument](https://core.telegram.org/bots/api#inputmediadocument)
        
    *   [InputMediaLink](https://core.telegram.org/bots/api#inputmedialink)
        
    *   [InputMediaLivePhoto](https://core.telegram.org/bots/api#inputmedialivephoto)
        
    *   [InputMediaLocation](https://core.telegram.org/bots/api#inputmedialocation)
        
    *   [InputMediaPhoto](https://core.telegram.org/bots/api#inputmediaphoto)
        
    *   [InputMediaSticker](https://core.telegram.org/bots/api#inputmediasticker)
        
    *   [InputMediaVenue](https://core.telegram.org/bots/api#inputmediavenue)
        
    *   [InputMediaVideo](https://core.telegram.org/bots/api#inputmediavideo)
        
    *   [InputMediaVoiceNote](https://core.telegram.org/bots/api#inputmediavoicenote)
        
    *   [InputFile](https://core.telegram.org/bots/api#inputfile)
        
    *   [InputPaidMedia](https://core.telegram.org/bots/api#inputpaidmedia)
        
    *   [InputPaidMediaLivePhoto](https://core.telegram.org/bots/api#inputpaidmedialivephoto)
        
    *   [InputPaidMediaPhoto](https://core.telegram.org/bots/api#inputpaidmediaphoto)
        
    *   [InputPaidMediaVideo](https://core.telegram.org/bots/api#inputpaidmediavideo)
        
    *   [InputProfilePhoto](https://core.telegram.org/bots/api#inputprofilephoto)
        
    *   [InputProfilePhotoStatic](https://core.telegram.org/bots/api#inputprofilephotostatic)
        
    *   [InputProfilePhotoAnimated](https://core.telegram.org/bots/api#inputprofilephotoanimated)
        
    *   [InputStoryContent](https://core.telegram.org/bots/api#inputstorycontent)
        
    *   [InputStoryContentPhoto](https://core.telegram.org/bots/api#inputstorycontentphoto)
        
    *   [InputStoryContentVideo](https://core.telegram.org/bots/api#inputstorycontentvideo)
        
    *   [Sending files](https://core.telegram.org/bots/api#sending-files)
        
    *   [Accent colors](https://core.telegram.org/bots/api#accent-colors)
        
    *   [Profile accent colors](https://core.telegram.org/bots/api#profile-accent-colors)
        
    *   [Inline mode objects](https://core.telegram.org/bots/api#inline-mode-objects)
        
*   [Available methods](https://core.telegram.org/bots/api#available-methods)
    *   [getMe](https://core.telegram.org/bots/api#getme)
        
    *   [logOut](https://core.telegram.org/bots/api#logout)
        
    *   [close](https://core.telegram.org/bots/api#close)
        
    *   [sendMessage](https://core.telegram.org/bots/api#sendmessage)
        
    *   [Formatting options](https://core.telegram.org/bots/api#formatting-options)
        
    *   [Ephemeral Messages and Commands](https://core.telegram.org/bots/api#ephemeral-messages-and-commands)
        
    *   [Paid Broadcasts](https://core.telegram.org/bots/api#paid-broadcasts)
        
    *   [forwardMessage](https://core.telegram.org/bots/api#forwardmessage)
        
    *   [forwardMessages](https://core.telegram.org/bots/api#forwardmessages)
        
    *   [copyMessage](https://core.telegram.org/bots/api#copymessage)
        
    *   [copyMessages](https://core.telegram.org/bots/api#copymessages)
        
    *   [sendPhoto](https://core.telegram.org/bots/api#sendphoto)
        
    *   [sendLivePhoto](https://core.telegram.org/bots/api#sendlivephoto)
        
    *   [sendAudio](https://core.telegram.org/bots/api#sendaudio)
        
    *   [sendDocument](https://core.telegram.org/bots/api#senddocument)
        
    *   [sendVideo](https://core.telegram.org/bots/api#sendvideo)
        
    *   [sendAnimation](https://core.telegram.org/bots/api#sendanimation)
        
    *   [sendVoice](https://core.telegram.org/bots/api#sendvoice)
        
    *   [sendVideoNote](https://core.telegram.org/bots/api#sendvideonote)
        
    *   [sendPaidMedia](https://core.telegram.org/bots/api#sendpaidmedia)
        
    *   [sendMediaGroup](https://core.telegram.org/bots/api#sendmediagroup)
        
    *   [sendLocation](https://core.telegram.org/bots/api#sendlocation)
        
    *   [sendVenue](https://core.telegram.org/bots/api#sendvenue)
        
    *   [sendContact](https://core.telegram.org/bots/api#sendcontact)
        
    *   [sendPoll](https://core.telegram.org/bots/api#sendpoll)
        
    *   [sendChecklist](https://core.telegram.org/bots/api#sendchecklist)
        
    *   [sendDice](https://core.telegram.org/bots/api#senddice)
        
    *   [sendMessageDraft](https://core.telegram.org/bots/api#sendmessagedraft)
        
    *   [sendChatAction](https://core.telegram.org/bots/api#sendchataction)
        
    *   [setMessageReaction](https://core.telegram.org/bots/api#setmessagereaction)
        
    *   [getUserProfilePhotos](https://core.telegram.org/bots/api#getuserprofilephotos)
        
    *   [getUserProfileAudios](https://core.telegram.org/bots/api#getuserprofileaudios)
        
    *   [setUserEmojiStatus](https://core.telegram.org/bots/api#setuseremojistatus)
        
    *   [getFile](https://core.telegram.org/bots/api#getfile)
        
    *   [banChatMember](https://core.telegram.org/bots/api#banchatmember)
        
    *   [unbanChatMember](https://core.telegram.org/bots/api#unbanchatmember)
        
    *   [restrictChatMember](https://core.telegram.org/bots/api#restrictchatmember)
        
    *   [promoteChatMember](https://core.telegram.org/bots/api#promotechatmember)
        
    *   [setChatAdministratorCustomTitle](https://core.telegram.org/bots/api#setchatadministratorcustomtitle)
        
    *   [setChatMemberTag](https://core.telegram.org/bots/api#setchatmembertag)
        
    *   [banChatSenderChat](https://core.telegram.org/bots/api#banchatsenderchat)
        
    *   [unbanChatSenderChat](https://core.telegram.org/bots/api#unbanchatsenderchat)
        
    *   [setChatPermissions](https://core.telegram.org/bots/api#setchatpermissions)
        
    *   [exportChatInviteLink](https://core.telegram.org/bots/api#exportchatinvitelink)
        
    *   [createChatInviteLink](https://core.telegram.org/bots/api#createchatinvitelink)
        
    *   [editChatInviteLink](https://core.telegram.org/bots/api#editchatinvitelink)
        
    *   [createChatSubscriptionInviteLink](https://core.telegram.org/bots/api#createchatsubscriptioninvitelink)
        
    *   [editChatSubscriptionInviteLink](https://core.telegram.org/bots/api#editchatsubscriptioninvitelink)
        
    *   [revokeChatInviteLink](https://core.telegram.org/bots/api#revokechatinvitelink)
        
    *   [approveChatJoinRequest](https://core.telegram.org/bots/api#approvechatjoinrequest)
        
    *   [declineChatJoinRequest](https://core.telegram.org/bots/api#declinechatjoinrequest)
        
    *   [answerChatJoinRequestQuery](https://core.telegram.org/bots/api#answerchatjoinrequestquery)
        
    *   [sendChatJoinRequestWebApp](https://core.telegram.org/bots/api#sendchatjoinrequestwebapp)
        
    *   [setChatPhoto](https://core.telegram.org/bots/api#setchatphoto)
        
    *   [deleteChatPhoto](https://core.telegram.org/bots/api#deletechatphoto)
        
    *   [setChatTitle](https://core.telegram.org/bots/api#setchattitle)
        
    *   [setChatDescription](https://core.telegram.org/bots/api#setchatdescription)
        
    *   [pinChatMessage](https://core.telegram.org/bots/api#pinchatmessage)
        
    *   [unpinChatMessage](https://core.telegram.org/bots/api#unpinchatmessage)
        
    *   [unpinAllChatMessages](https://core.telegram.org/bots/api#unpinallchatmessages)
        
    *   [leaveChat](https://core.telegram.org/bots/api#leavechat)
        
    *   [getChat](https://core.telegram.org/bots/api#getchat)
        
    *   [getChatAdministrators](https://core.telegram.org/bots/api#getchatadministrators)
        
    *   [getChatMemberCount](https://core.telegram.org/bots/api#getchatmembercount)
        
    *   [getChatMember](https://core.telegram.org/bots/api#getchatmember)
        
    *   [getUserPersonalChatMessages](https://core.telegram.org/bots/api#getuserpersonalchatmessages)
        
    *   [setChatStickerSet](https://core.telegram.org/bots/api#setchatstickerset)
        
    *   [deleteChatStickerSet](https://core.telegram.org/bots/api#deletechatstickerset)
        
    *   [getForumTopicIconStickers](https://core.telegram.org/bots/api#getforumtopiciconstickers)
        
    *   [createForumTopic](https://core.telegram.org/bots/api#createforumtopic)
        
    *   [editForumTopic](https://core.telegram.org/bots/api#editforumtopic)
        
    *   [closeForumTopic](https://core.telegram.org/bots/api#closeforumtopic)
        
    *   [reopenForumTopic](https://core.telegram.org/bots/api#reopenforumtopic)
        
    *   [deleteForumTopic](https://core.telegram.org/bots/api#deleteforumtopic)
        
    *   [unpinAllForumTopicMessages](https://core.telegram.org/bots/api#unpinallforumtopicmessages)
        
    *   [editGeneralForumTopic](https://core.telegram.org/bots/api#editgeneralforumtopic)
        
    *   [closeGeneralForumTopic](https://core.telegram.org/bots/api#closegeneralforumtopic)
        
    *   [reopenGeneralForumTopic](https://core.telegram.org/bots/api#reopengeneralforumtopic)
        
    *   [hideGeneralForumTopic](https://core.telegram.org/bots/api#hidegeneralforumtopic)
        
    *   [unhideGeneralForumTopic](https://core.telegram.org/bots/api#unhidegeneralforumtopic)
        
    *   [unpinAllGeneralForumTopicMessages](https://core.telegram.org/bots/api#unpinallgeneralforumtopicmessages)
        
    *   [answerCallbackQuery](https://core.telegram.org/bots/api#answercallbackquery)
        
    *   [answerGuestQuery](https://core.telegram.org/bots/api#answerguestquery)
        
    *   [getUserChatBoosts](https://core.telegram.org/bots/api#getuserchatboosts)
        
    *   [getBusinessConnection](https://core.telegram.org/bots/api#getbusinessconnection)
        
    *   [getManagedBotToken](https://core.telegram.org/bots/api#getmanagedbottoken)
        
    *   [replaceManagedBotToken](https://core.telegram.org/bots/api#replacemanagedbottoken)
        
    *   [getManagedBotAccessSettings](https://core.telegram.org/bots/api#getmanagedbotaccesssettings)
        
    *   [setManagedBotAccessSettings](https://core.telegram.org/bots/api#setmanagedbotaccesssettings)
        
    *   [setMyCommands](https://core.telegram.org/bots/api#setmycommands)
        
    *   [deleteMyCommands](https://core.telegram.org/bots/api#deletemycommands)
        
    *   [getMyCommands](https://core.telegram.org/bots/api#getmycommands)
        
    *   [setMyName](https://core.telegram.org/bots/api#setmyname)
        
    *   [getMyName](https://core.telegram.org/bots/api#getmyname)
        
    *   [setMyDescription](https://core.telegram.org/bots/api#setmydescription)
        
    *   [getMyDescription](https://core.telegram.org/bots/api#getmydescription)
        
    *   [setMyShortDescription](https://core.telegram.org/bots/api#setmyshortdescription)
        
    *   [getMyShortDescription](https://core.telegram.org/bots/api#getmyshortdescription)
        
    *   [setMyProfilePhoto](https://core.telegram.org/bots/api#setmyprofilephoto)
        
    *   [removeMyProfilePhoto](https://core.telegram.org/bots/api#removemyprofilephoto)
        
    *   [setChatMenuButton](https://core.telegram.org/bots/api#setchatmenubutton)
        
    *   [getChatMenuButton](https://core.telegram.org/bots/api#getchatmenubutton)
        
    *   [setMyDefaultAdministratorRights](https://core.telegram.org/bots/api#setmydefaultadministratorrights)
        
    *   [getMyDefaultAdministratorRights](https://core.telegram.org/bots/api#getmydefaultadministratorrights)
        
    *   [getAvailableGifts](https://core.telegram.org/bots/api#getavailablegifts)
        
    *   [sendGift](https://core.telegram.org/bots/api#sendgift)
        
    *   [giftPremiumSubscription](https://core.telegram.org/bots/api#giftpremiumsubscription)
        
    *   [verifyUser](https://core.telegram.org/bots/api#verifyuser)
        
    *   [verifyChat](https://core.telegram.org/bots/api#verifychat)
        
    *   [removeUserVerification](https://core.telegram.org/bots/api#removeuserverification)
        
    *   [removeChatVerification](https://core.telegram.org/bots/api#removechatverification)
        
    *   [readBusinessMessage](https://core.telegram.org/bots/api#readbusinessmessage)
        
    *   [deleteBusinessMessages](https://core.telegram.org/bots/api#deletebusinessmessages)
        
    *   [setBusinessAccountName](https://core.telegram.org/bots/api#setbusinessaccountname)
        
    *   [setBusinessAccountUsername](https://core.telegram.org/bots/api#setbusinessaccountusername)
        
    *   [setBusinessAccountBio](https://core.telegram.org/bots/api#setbusinessaccountbio)
        
    *   [setBusinessAccountProfilePhoto](https://core.telegram.org/bots/api#setbusinessaccountprofilephoto)
        
    *   [removeBusinessAccountProfilePhoto](https://core.telegram.org/bots/api#removebusinessaccountprofilephoto)
        
    *   [setBusinessAccountGiftSettings](https://core.telegram.org/bots/api#setbusinessaccountgiftsettings)
        
    *   [getBusinessAccountStarBalance](https://core.telegram.org/bots/api#getbusinessaccountstarbalance)
        
    *   [transferBusinessAccountStars](https://core.telegram.org/bots/api#transferbusinessaccountstars)
        
    *   [getBusinessAccountGifts](https://core.telegram.org/bots/api#getbusinessaccountgifts)
        
    *   [getUserGifts](https://core.telegram.org/bots/api#getusergifts)
        
    *   [getChatGifts](https://core.telegram.org/bots/api#getchatgifts)
        
    *   [convertGiftToStars](https://core.telegram.org/bots/api#convertgifttostars)
        
    *   [upgradeGift](https://core.telegram.org/bots/api#upgradegift)
        
    *   [transferGift](https://core.telegram.org/bots/api#transfergift)
        
    *   [postStory](https://core.telegram.org/bots/api#poststory)
        
    *   [repostStory](https://core.telegram.org/bots/api#repoststory)
        
    *   [editStory](https://core.telegram.org/bots/api#editstory)
        
    *   [deleteStory](https://core.telegram.org/bots/api#deletestory)
        
    *   [answerWebAppQuery](https://core.telegram.org/bots/api#answerwebappquery)
        
    *   [savePreparedInlineMessage](https://core.telegram.org/bots/api#savepreparedinlinemessage)
        
    *   [savePreparedKeyboardButton](https://core.telegram.org/bots/api#savepreparedkeyboardbutton)
        
    *   [Inline mode methods](https://core.telegram.org/bots/api#inline-mode-methods)
        
*   [Updating messages](https://core.telegram.org/bots/api#updating-messages)
    *   [editMessageText](https://core.telegram.org/bots/api#editmessagetext)
        
    *   [editMessageCaption](https://core.telegram.org/bots/api#editmessagecaption)
        
    *   [editMessageMedia](https://core.telegram.org/bots/api#editmessagemedia)
        
    *   [editMessageLiveLocation](https://core.telegram.org/bots/api#editmessagelivelocation)
        
    *   [stopMessageLiveLocation](https://core.telegram.org/bots/api#stopmessagelivelocation)
        
    *   [editMessageChecklist](https://core.telegram.org/bots/api#editmessagechecklist)
        
    *   [editMessageReplyMarkup](https://core.telegram.org/bots/api#editmessagereplymarkup)
        
    *   [stopPoll](https://core.telegram.org/bots/api#stoppoll)
        
    *   [editEphemeralMessageText](https://core.telegram.org/bots/api#editephemeralmessagetext)
        
    *   [editEphemeralMessageMedia](https://core.telegram.org/bots/api#editephemeralmessagemedia)
        
    *   [editEphemeralMessageCaption](https://core.telegram.org/bots/api#editephemeralmessagecaption)
        
    *   [editEphemeralMessageReplyMarkup](https://core.telegram.org/bots/api#editephemeralmessagereplymarkup)
        
    *   [approveSuggestedPost](https://core.telegram.org/bots/api#approvesuggestedpost)
        
    *   [declineSuggestedPost](https://core.telegram.org/bots/api#declinesuggestedpost)
        
    *   [deleteMessage](https://core.telegram.org/bots/api#deletemessage)
        
    *   [deleteMessages](https://core.telegram.org/bots/api#deletemessages)
        
    *   [deleteEphemeralMessage](https://core.telegram.org/bots/api#deleteephemeralmessage)
        
    *   [deleteMessageReaction](https://core.telegram.org/bots/api#deletemessagereaction)
        
    *   [deleteAllMessageReactions](https://core.telegram.org/bots/api#deleteallmessagereactions)
        
*   [Stickers](https://core.telegram.org/bots/api#stickers)
    *   [Sticker](https://core.telegram.org/bots/api#sticker)
        
    *   [StickerSet](https://core.telegram.org/bots/api#stickerset)
        
    *   [MaskPosition](https://core.telegram.org/bots/api#maskposition)
        
    *   [InputSticker](https://core.telegram.org/bots/api#inputsticker)
        
    *   [sendSticker](https://core.telegram.org/bots/api#sendsticker)
        
    *   [getStickerSet](https://core.telegram.org/bots/api#getstickerset)
        
    *   [getCustomEmojiStickers](https://core.telegram.org/bots/api#getcustomemojistickers)
        
    *   [uploadStickerFile](https://core.telegram.org/bots/api#uploadstickerfile)
        
    *   [createNewStickerSet](https://core.telegram.org/bots/api#createnewstickerset)
        
    *   [addStickerToSet](https://core.telegram.org/bots/api#addstickertoset)
        
    *   [setStickerPositionInSet](https://core.telegram.org/bots/api#setstickerpositioninset)
        
    *   [deleteStickerFromSet](https://core.telegram.org/bots/api#deletestickerfromset)
        
    *   [replaceStickerInSet](https://core.telegram.org/bots/api#replacestickerinset)
        
    *   [setStickerEmojiList](https://core.telegram.org/bots/api#setstickeremojilist)
        
    *   [setStickerKeywords](https://core.telegram.org/bots/api#setstickerkeywords)
        
    *   [setStickerMaskPosition](https://core.telegram.org/bots/api#setstickermaskposition)
        
    *   [setStickerSetTitle](https://core.telegram.org/bots/api#setstickersettitle)
        
    *   [setStickerSetThumbnail](https://core.telegram.org/bots/api#setstickersetthumbnail)
        
    *   [setCustomEmojiStickerSetThumbnail](https://core.telegram.org/bots/api#setcustomemojistickersetthumbnail)
        
    *   [deleteStickerSet](https://core.telegram.org/bots/api#deletestickerset)
        
*   [Rich messages](https://core.telegram.org/bots/api#rich-messages)
    *   [Rich Message Formatting Options](https://core.telegram.org/bots/api#rich-message-formatting-options)
        
    *   [RichMessage](https://core.telegram.org/bots/api#richmessage)
        
    *   [InputRichMessage](https://core.telegram.org/bots/api#inputrichmessage)
        
    *   [InputRichMessageMedia](https://core.telegram.org/bots/api#inputrichmessagemedia)
        
    *   [sendRichMessage](https://core.telegram.org/bots/api#sendrichmessage)
        
    *   [sendRichMessageDraft](https://core.telegram.org/bots/api#sendrichmessagedraft)
        
    *   [RichMessageButton](https://core.telegram.org/bots/api#richmessagebutton)
        
    *   [RichText](https://core.telegram.org/bots/api#richtext)
        
    *   [RichTextBold](https://core.telegram.org/bots/api#richtextbold)
        
    *   [RichTextItalic](https://core.telegram.org/bots/api#richtextitalic)
        
    *   [RichTextUnderline](https://core.telegram.org/bots/api#richtextunderline)
        
    *   [RichTextStrikethrough](https://core.telegram.org/bots/api#richtextstrikethrough)
        
    *   [RichTextSpoiler](https://core.telegram.org/bots/api#richtextspoiler)
        
    *   [RichTextDateTime](https://core.telegram.org/bots/api#richtextdatetime)
        
    *   [RichTextTextMention](https://core.telegram.org/bots/api#richtexttextmention)
        
    *   [RichTextSubscript](https://core.telegram.org/bots/api#richtextsubscript)
        
    *   [RichTextSuperscript](https://core.telegram.org/bots/api#richtextsuperscript)
        
    *   [RichTextMarked](https://core.telegram.org/bots/api#richtextmarked)
        
    *   [RichTextCode](https://core.telegram.org/bots/api#richtextcode)
        
    *   [RichTextCustomEmoji](https://core.telegram.org/bots/api#richtextcustomemoji)
        
    *   [RichTextMathematicalExpression](https://core.telegram.org/bots/api#richtextmathematicalexpression)
        
    *   [RichTextUrl](https://core.telegram.org/bots/api#richtexturl)
        
    *   [RichTextEmailAddress](https://core.telegram.org/bots/api#richtextemailaddress)
        
    *   [RichTextPhoneNumber](https://core.telegram.org/bots/api#richtextphonenumber)
        
    *   [RichTextBankCardNumber](https://core.telegram.org/bots/api#richtextbankcardnumber)
        
    *   [RichTextMention](https://core.telegram.org/bots/api#richtextmention)
        
    *   [RichTextHashtag](https://core.telegram.org/bots/api#richtexthashtag)
        
    *   [RichTextCashtag](https://core.telegram.org/bots/api#richtextcashtag)
        
    *   [RichTextBotCommand](https://core.telegram.org/bots/api#richtextbotcommand)
        
    *   [RichTextButton](https://core.telegram.org/bots/api#richtextbutton)
        
    *   [RichTextAnchor](https://core.telegram.org/bots/api#richtextanchor)
        
    *   [RichTextAnchorLink](https://core.telegram.org/bots/api#richtextanchorlink)
        
    *   [RichTextReference](https://core.telegram.org/bots/api#richtextreference)
        
    *   [RichTextReferenceLink](https://core.telegram.org/bots/api#richtextreferencelink)
        
    *   [RichBlockCaption](https://core.telegram.org/bots/api#richblockcaption)
        
    *   [RichBlockTableCell](https://core.telegram.org/bots/api#richblocktablecell)
        
    *   [RichBlockListItem](https://core.telegram.org/bots/api#richblocklistitem)
        
    *   [RichBlock](https://core.telegram.org/bots/api#richblock)
        
    *   [RichBlockParagraph](https://core.telegram.org/bots/api#richblockparagraph)
        
    *   [RichBlockSectionHeading](https://core.telegram.org/bots/api#richblocksectionheading)
        
    *   [RichBlockPreformatted](https://core.telegram.org/bots/api#richblockpreformatted)
        
    *   [RichBlockFooter](https://core.telegram.org/bots/api#richblockfooter)
        
    *   [RichBlockDivider](https://core.telegram.org/bots/api#richblockdivider)
        
    *   [RichBlockMathematicalExpression](https://core.telegram.org/bots/api#richblockmathematicalexpression)
        
    *   [RichBlockAnchor](https://core.telegram.org/bots/api#richblockanchor)
        
    *   [RichBlockList](https://core.telegram.org/bots/api#richblocklist)
        
    *   [RichBlockBlockQuotation](https://core.telegram.org/bots/api#richblockblockquotation)
        
    *   [RichBlockExpandableBlockQuotation](https://core.telegram.org/bots/api#richblockexpandableblockquotation)
        
    *   [RichBlockPullQuotation](https://core.telegram.org/bots/api#richblockpullquotation)
        
    *   [RichBlockCollage](https://core.telegram.org/bots/api#richblockcollage)
        
    *   [RichBlockSlideshow](https://core.telegram.org/bots/api#richblockslideshow)
        
    *   [RichBlockTable](https://core.telegram.org/bots/api#richblocktable)
        
    *   [RichBlockDetails](https://core.telegram.org/bots/api#richblockdetails)
        
    *   [RichBlockMap](https://core.telegram.org/bots/api#richblockmap)
        
    *   [RichBlockButtons](https://core.telegram.org/bots/api#richblockbuttons)
        
    *   [RichBlockAnimation](https://core.telegram.org/bots/api#richblockanimation)
        
    *   [RichBlockAudio](https://core.telegram.org/bots/api#richblockaudio)
        
    *   [RichBlockDocument](https://core.telegram.org/bots/api#richblockdocument)
        
    *   [RichBlockPhoto](https://core.telegram.org/bots/api#richblockphoto)
        
    *   [RichBlockVideo](https://core.telegram.org/bots/api#richblockvideo)
        
    *   [RichBlockVoiceNote](https://core.telegram.org/bots/api#richblockvoicenote)
        
    *   [RichBlockThinking](https://core.telegram.org/bots/api#richblockthinking)
        
    *   [InputRichBlockListItem](https://core.telegram.org/bots/api#inputrichblocklistitem)
        
    *   [InputRichBlock](https://core.telegram.org/bots/api#inputrichblock)
        
    *   [InputRichBlockParagraph](https://core.telegram.org/bots/api#inputrichblockparagraph)
        
    *   [InputRichBlockSectionHeading](https://core.telegram.org/bots/api#inputrichblocksectionheading)
        
    *   [InputRichBlockPreformatted](https://core.telegram.org/bots/api#inputrichblockpreformatted)
        
    *   [InputRichBlockFooter](https://core.telegram.org/bots/api#inputrichblockfooter)
        
    *   [InputRichBlockDivider](https://core.telegram.org/bots/api#inputrichblockdivider)
        
    *   [InputRichBlockMathematicalExpression](https://core.telegram.org/bots/api#inputrichblockmathematicalexpression)
        
    *   [InputRichBlockAnchor](https://core.telegram.org/bots/api#inputrichblockanchor)
        
    *   [InputRichBlockList](https://core.telegram.org/bots/api#inputrichblocklist)
        
    *   [InputRichBlockBlockQuotation](https://core.telegram.org/bots/api#inputrichblockblockquotation)
        
    *   [InputRichBlockExpandableBlockQuotation](https://core.telegram.org/bots/api#inputrichblockexpandableblockquotation)
        
    *   [InputRichBlockPullQuotation](https://core.telegram.org/bots/api#inputrichblockpullquotation)
        
    *   [InputRichBlockCollage](https://core.telegram.org/bots/api#inputrichblockcollage)
        
    *   [InputRichBlockSlideshow](https://core.telegram.org/bots/api#inputrichblockslideshow)
        
    *   [InputRichBlockTable](https://core.telegram.org/bots/api#inputrichblocktable)
        
    *   [InputRichBlockDetails](https://core.telegram.org/bots/api#inputrichblockdetails)
        
    *   [InputRichBlockMap](https://core.telegram.org/bots/api#inputrichblockmap)
        
    *   [InputRichBlockButtons](https://core.telegram.org/bots/api#inputrichblockbuttons)
        
    *   [InputRichBlockAnimation](https://core.telegram.org/bots/api#inputrichblockanimation)
        
    *   [InputRichBlockAudio](https://core.telegram.org/bots/api#inputrichblockaudio)
        
    *   [InputRichBlockDocument](https://core.telegram.org/bots/api#inputrichblockdocument)
        
    *   [InputRichBlockPhoto](https://core.telegram.org/bots/api#inputrichblockphoto)
        
    *   [InputRichBlockVideo](https://core.telegram.org/bots/api#inputrichblockvideo)
        
    *   [InputRichBlockVoiceNote](https://core.telegram.org/bots/api#inputrichblockvoicenote)
        
    *   [InputRichBlockThinking](https://core.telegram.org/bots/api#inputrichblockthinking)
        
*   [Inline mode](https://core.telegram.org/bots/api#inline-mode)
    *   [InlineQuery](https://core.telegram.org/bots/api#inlinequery)
        
    *   [answerInlineQuery](https://core.telegram.org/bots/api#answerinlinequery)
        
    *   [InlineQueryResultsButton](https://core.telegram.org/bots/api#inlinequeryresultsbutton)
        
    *   [InlineQueryResult](https://core.telegram.org/bots/api#inlinequeryresult)
        
    *   [InlineQueryResultArticle](https://core.telegram.org/bots/api#inlinequeryresultarticle)
        
    *   [InlineQueryResultPhoto](https://core.telegram.org/bots/api#inlinequeryresultphoto)
        
    *   [InlineQueryResultGif](https://core.telegram.org/bots/api#inlinequeryresultgif)
        
    *   [InlineQueryResultMpeg4Gif](https://core.telegram.org/bots/api#inlinequeryresultmpeg4gif)
        
    *   [InlineQueryResultVideo](https://core.telegram.org/bots/api#inlinequeryresultvideo)
        
    *   [InlineQueryResultAudio](https://core.telegram.org/bots/api#inlinequeryresultaudio)
        
    *   [InlineQueryResultVoice](https://core.telegram.org/bots/api#inlinequeryresultvoice)
        
    *   [InlineQueryResultDocument](https://core.telegram.org/bots/api#inlinequeryresultdocument)
        
    *   [InlineQueryResultLocation](https://core.telegram.org/bots/api#inlinequeryresultlocation)
        
    *   [InlineQueryResultVenue](https://core.telegram.org/bots/api#inlinequeryresultvenue)
        
    *   [InlineQueryResultContact](https://core.telegram.org/bots/api#inlinequeryresultcontact)
        
    *   [InlineQueryResultGame](https://core.telegram.org/bots/api#inlinequeryresultgame)
        
    *   [InlineQueryResultCachedPhoto](https://core.telegram.org/bots/api#inlinequeryresultcachedphoto)
        
    *   [InlineQueryResultCachedGif](https://core.telegram.org/bots/api#inlinequeryresultcachedgif)
        
    *   [InlineQueryResultCachedMpeg4Gif](https://core.telegram.org/bots/api#inlinequeryresultcachedmpeg4gif)
        
    *   [InlineQueryResultCachedSticker](https://core.telegram.org/bots/api#inlinequeryresultcachedsticker)
        
    *   [InlineQueryResultCachedDocument](https://core.telegram.org/bots/api#inlinequeryresultcacheddocument)
        
    *   [InlineQueryResultCachedVideo](https://core.telegram.org/bots/api#inlinequeryresultcachedvideo)
        
    *   [InlineQueryResultCachedVoice](https://core.telegram.org/bots/api#inlinequeryresultcachedvoice)
        
    *   [InlineQueryResultCachedAudio](https://core.telegram.org/bots/api#inlinequeryresultcachedaudio)
        
    *   [InputMessageContent](https://core.telegram.org/bots/api#inputmessagecontent)
        
    *   [InputTextMessageContent](https://core.telegram.org/bots/api#inputtextmessagecontent)
        
    *   [InputRichMessageContent](https://core.telegram.org/bots/api#inputrichmessagecontent)
        
    *   [InputLocationMessageContent](https://core.telegram.org/bots/api#inputlocationmessagecontent)
        
    *   [InputVenueMessageContent](https://core.telegram.org/bots/api#inputvenuemessagecontent)
        
    *   [InputContactMessageContent](https://core.telegram.org/bots/api#inputcontactmessagecontent)
        
    *   [InputInvoiceMessageContent](https://core.telegram.org/bots/api#inputinvoicemessagecontent)
        
    *   [ChosenInlineResult](https://core.telegram.org/bots/api#choseninlineresult)
        
*   [Payments](https://core.telegram.org/bots/api#payments)
    *   [sendInvoice](https://core.telegram.org/bots/api#sendinvoice)
        
    *   [createInvoiceLink](https://core.telegram.org/bots/api#createinvoicelink)
        
    *   [answerShippingQuery](https://core.telegram.org/bots/api#answershippingquery)
        
    *   [answerPreCheckoutQuery](https://core.telegram.org/bots/api#answerprecheckoutquery)
        
    *   [getMyStarBalance](https://core.telegram.org/bots/api#getmystarbalance)
        
    *   [getStarTransactions](https://core.telegram.org/bots/api#getstartransactions)
        
    *   [refundStarPayment](https://core.telegram.org/bots/api#refundstarpayment)
        
    *   [editUserStarSubscription](https://core.telegram.org/bots/api#edituserstarsubscription)
        
    *   [LabeledPrice](https://core.telegram.org/bots/api#labeledprice)
        
    *   [Invoice](https://core.telegram.org/bots/api#invoice)
        
    *   [ShippingAddress](https://core.telegram.org/bots/api#shippingaddress)
        
    *   [OrderInfo](https://core.telegram.org/bots/api#orderinfo)
        
    *   [ShippingOption](https://core.telegram.org/bots/api#shippingoption)
        
    *   [SuccessfulPayment](https://core.telegram.org/bots/api#successfulpayment)
        
    *   [RefundedPayment](https://core.telegram.org/bots/api#refundedpayment)
        
    *   [ShippingQuery](https://core.telegram.org/bots/api#shippingquery)
        
    *   [PreCheckoutQuery](https://core.telegram.org/bots/api#precheckoutquery)
        
    *   [PaidMediaPurchased](https://core.telegram.org/bots/api#paidmediapurchased)
        
    *   [RevenueWithdrawalState](https://core.telegram.org/bots/api#revenuewithdrawalstate)
        
    *   [RevenueWithdrawalStatePending](https://core.telegram.org/bots/api#revenuewithdrawalstatepending)
        
    *   [RevenueWithdrawalStateSucceeded](https://core.telegram.org/bots/api#revenuewithdrawalstatesucceeded)
        
    *   [RevenueWithdrawalStateFailed](https://core.telegram.org/bots/api#revenuewithdrawalstatefailed)
        
    *   [AffiliateInfo](https://core.telegram.org/bots/api#affiliateinfo)
        
    *   [TransactionPartner](https://core.telegram.org/bots/api#transactionpartner)
        
    *   [TransactionPartnerUser](https://core.telegram.org/bots/api#transactionpartneruser)
        
    *   [TransactionPartnerChat](https://core.telegram.org/bots/api#transactionpartnerchat)
        
    *   [TransactionPartnerAffiliateProgram](https://core.telegram.org/bots/api#transactionpartneraffiliateprogram)
        
    *   [TransactionPartnerFragment](https://core.telegram.org/bots/api#transactionpartnerfragment)
        
    *   [TransactionPartnerTelegramAds](https://core.telegram.org/bots/api#transactionpartnertelegramads)
        
    *   [TransactionPartnerTelegramApi](https://core.telegram.org/bots/api#transactionpartnertelegramapi)
        
    *   [TransactionPartnerOther](https://core.telegram.org/bots/api#transactionpartnerother)
        
    *   [StarTransaction](https://core.telegram.org/bots/api#startransaction)
        
    *   [StarTransactions](https://core.telegram.org/bots/api#startransactions)
        
*   [Telegram Passport](https://core.telegram.org/bots/api#telegram-passport)
    *   [PassportData](https://core.telegram.org/bots/api#passportdata)
        
    *   [PassportFile](https://core.telegram.org/bots/api#passportfile)
        
    *   [EncryptedPassportElement](https://core.telegram.org/bots/api#encryptedpassportelement)
        
    *   [EncryptedCredentials](https://core.telegram.org/bots/api#encryptedcredentials)
        
    *   [setPassportDataErrors](https://core.telegram.org/bots/api#setpassportdataerrors)
        
    *   [PassportElementError](https://core.telegram.org/bots/api#passportelementerror)
        
    *   [PassportElementErrorDataField](https://core.telegram.org/bots/api#passportelementerrordatafield)
        
    *   [PassportElementErrorFrontSide](https://core.telegram.org/bots/api#passportelementerrorfrontside)
        
    *   [PassportElementErrorReverseSide](https://core.telegram.org/bots/api#passportelementerrorreverseside)
        
    *   [PassportElementErrorSelfie](https://core.telegram.org/bots/api#passportelementerrorselfie)
        
    *   [PassportElementErrorFile](https://core.telegram.org/bots/api#passportelementerrorfile)
        
    *   [PassportElementErrorFiles](https://core.telegram.org/bots/api#passportelementerrorfiles)
        
    *   [PassportElementErrorTranslationFile](https://core.telegram.org/bots/api#passportelementerrortranslationfile)
        
    *   [PassportElementErrorTranslationFiles](https://core.telegram.org/bots/api#passportelementerrortranslationfiles)
        
    *   [PassportElementErrorUnspecified](https://core.telegram.org/bots/api#passportelementerrorunspecified)
        
*   [Games](https://core.telegram.org/bots/api#games)
    *   [sendGame](https://core.telegram.org/bots/api#sendgame)
        
    *   [Game](https://core.telegram.org/bots/api#game)
        
    *   [CallbackGame](https://core.telegram.org/bots/api#callbackgame)
        
    *   [setGameScore](https://core.telegram.org/bots/api#setgamescore)
        
    *   [getGameHighScores](https://core.telegram.org/bots/api#getgamehighscores)
        
    *   [GameHighScore](https://core.telegram.org/bots/api#gamehighscore)
        

*   [Telegram Bots](https://core.telegram.org/bots)
    
*   [Telegram Bot API](https://core.telegram.org/bots/api)
    

Telegram Bot API
================

> The Bot API is an HTTP-based interface created for developers keen on building bots for Telegram.  
> To learn how to create and set up a bot, please consult our [**Introduction to Bots**](https://core.telegram.org/bots)
>  and [**Bot FAQ**](https://core.telegram.org/bots/faq)
> .
