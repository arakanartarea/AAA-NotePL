from telethon import TelegramClient, events

# ပြင်ဆင်ရန် အချက်အလက်များ
api_id = 8338112255         # my.telegram.org ကနေ ယူရမယ့် ID (ဂဏန်း)
api_hash = 'AAElw1eN02BL8-JS8CKma6aCGrejHw2jxaQ' # my.telegram.org ကနေ ယူရမယ့် Hash စာတန်း
bot_token = 'your_bot_token_here' # BotFather ဆီက ရထားတဲ့ Token

from_channel = -1002318346217 # ကူးမယ့် မူရင်းချန်နယ် ID (ပုံသေ)
to_channel = -1001234567890   # သင့်ရဲ့ သိမ်းမယ့် Private ချန်နယ် ID

# Client များ တည်ဆောက်ခြင်း
user_client = TelegramClient('user_session', api_id, api_hash)
bot_client = TelegramClient('bot_session', api_id, api_hash).start(bot_token=bot_token)

# မူရင်းချန်နယ်မှာ ဗီဒီယိုအသစ်တက်လာတိုင်း အော်တိုဖမ်းယူမည့်စနစ်
@user_client.on(events.NewMessage(chats=from_channel))
async def handler(event):
    if event.message.media: # ဗီဒီယို သို့မဟုတ် ဖိုင်ဖြစ်လျှင်
        # ဗီဒီယိုဖိုင်ကို Bot ဆီ လှမ်းပို့ခိုင်းခြင်း (Restrict ကို ကျော်ရန်)
        await bot_client.send_file(
            to_channel, 
            event.message.media, 
            caption=event.message.text or "" # မူရင်း Caption ပါတစ်ခါတည်းယူမည်
        )
        print("ဗီဒီယိုအသစ်တစ်ခု အော်တို သိမ်းဆည်းပြီးပါပြီ။")

print("Cloner Bot စတင် အလုပ်လုပ်နေပါပြီ...")
user_client.start()
user_client.run_until_disconnected()
