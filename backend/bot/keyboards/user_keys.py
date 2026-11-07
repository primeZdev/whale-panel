from aiogram.types import InlineKeyboardMarkup, InlineKeyboardButton


def main_users_menu():
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="⭐ درخواست نمایندگی",
                    callback_data="user:register",
                )
            ],
            [
                InlineKeyboardButton(text="👤 حساب من", callback_data="user:my_acc"),
                InlineKeyboardButton(
                    text="🔋 خرید حجم اضافه", callback_data="user:buy_traffic"
                ),
            ],
            [InlineKeyboardButton(text="❕ راهنما/قوانین", callback_data="user:help")],
        ]
    )
    return keyboard


def payment_methods_register():
    db = None
    settings = None
    try:
        from backend.db.engin import sessionLocal
        from backend.db import crud
        db = sessionLocal()
        settings = crud.get_all_settings(db)
    finally:
        if db is not None:
            db.close()

    buttons = []
    if settings and settings.card_payment_enabled:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="💳 کارت به کارت",
                    callback_data="user:register_pay_card",
                )
            ]
        )
    if settings and settings.tron_payment_enabled:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="🟡 TRON",
                    callback_data="user:register_pay_tron",
                )
            ]
        )
    if settings and settings.usdt_payment_enabled:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="🪙 USDT",
                    callback_data="user:register_pay_usdt",
                )
            ]
        )
    if not buttons:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="✅ بدون پرداخت",
                    callback_data="user:request_for_register",
                )
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def payment_methods_buy():
    db = None
    settings = None
    try:
        from backend.db.engin import sessionLocal
        from backend.db import crud
        db = sessionLocal()
        settings = crud.get_all_settings(db)
    finally:
        if db is not None:
            db.close()

    buttons = []
    if settings and settings.card_payment_enabled:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="💳 کارت به کارت",
                    callback_data="user:buy_pay_card",
                )
            ]
        )
    if settings and settings.tron_payment_enabled:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="🟡 TRON",
                    callback_data="user:buy_pay_tron",
                )
            ]
        )
    if settings and settings.usdt_payment_enabled:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="🪙 USDT",
                    callback_data="user:buy_pay_usdt",
                )
            ]
        )
    if not buttons:
        buttons.append(
            [
                InlineKeyboardButton(
                    text="✅ بدون پرداخت",
                    callback_data="user:buy_traffic",
                )
            ]
        )
    return InlineKeyboardMarkup(inline_keyboard=buttons)


def register_menu():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ ثبت درخواست",
                    callback_data="user:request_for_register",
                )
            ],
            [
                InlineKeyboardButton(
                    text="❌ انصراف",
                    callback_data="user:back",
                )
            ],
        ]
    )


def cancel_button():
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="❌ لغو", callback_data="user:cancel")]
        ]
    )
    return keyboard
