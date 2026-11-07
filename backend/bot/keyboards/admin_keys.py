from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def main_menu():
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="💻 انتخاب پنل برای فروش",
                    callback_data="admin:select_panel_for_sale",
                )
            ],
            [
                InlineKeyboardButton(
                    text="💳 تنظیم قیمت نمایندگی", callback_data="admin:set_price"
                ),
            ],
            [
                InlineKeyboardButton(text="ℹ️ آمار", callback_data="admin:info"),
                (
                    InlineKeyboardButton(
                        text="⚙️ تنطیمات", callback_data="admin:settings"
                    )
                ),
            ],
        ]
    )
    return keyboard


def settings_menu():
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🔄 تنظیم پیام آغاز", callback_data="admin:set_start_message"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🔄 تنظیم پیام راهنما", callback_data="admin:set_help_message"
                )
            ],
            [
                InlineKeyboardButton(
                    text="💳 تنظیم روش‌های پرداخت", callback_data="admin:set_payment_methods"
                )
            ],
            [
                InlineKeyboardButton(
                    text="💬 ارسال پیام همگانی", callback_data="admin:send_broadcast"
                )
            ],
        ]
    )
    return keyboard


def cancel_button():
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="❌ خروج", callback_data="admin:cancel")]
        ]
    )
    return keyboard


def show_panel_selection(panels):
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"{panel.name} - {panel.panel_type} - {'✅' if panel.for_bot else '❌'}",
                    callback_data=f"admin:panel_selected:{panel.id}",
                )
            ]
            for panel in panels
        ]
    )
    return keyboard


def payment_method_settings_menu():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="💳 کارت به کارت",
                    callback_data="admin:toggle_card_payment",
                ),
                InlineKeyboardButton(
                    text="🟡 TRON", callback_data="admin:toggle_tron_payment"
                ),
            ],
            [
                InlineKeyboardButton(
                    text="🪙 USDT", callback_data="admin:toggle_usdt_payment"
                ),
                InlineKeyboardButton(
                    text="📝 تنظیم اطلاعات", callback_data="admin:set_payment_details"
                ),
            ],
            [
                InlineKeyboardButton(
                    text="🔙 بازگشت", callback_data="admin:settings"
                )
            ],
        ]
    )


def payment_details_menu():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="💳 شماره کارت", callback_data="admin:set_card_details"
                ),
                InlineKeyboardButton(
                    text="🟡 آدرس TRON", callback_data="admin:set_tron_address"
                ),
            ],
            [
                InlineKeyboardButton(
                    text="🪙 آدرس USDT", callback_data="admin:set_usdt_address"
                ),
                InlineKeyboardButton(text="🔙 بازگشت", callback_data="admin:set_payment_methods"),
            ],
        ]
    )
