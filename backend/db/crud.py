from datetime import datetime
from sqlalchemy import true
from sqlalchemy.orm import Session

from backend.db.model import Admins, Panels, News, SanaeiUsers, TGBot, Settings, Users
from backend.schema._input import AdminInput, AdminUpdateInput, PanelInput
from backend.auth.hash import hash_password


def get_all_admins(db: Session):
    return db.query(Admins).all()


def add_admin(db: Session, admin_input: AdminInput) -> Admins:
    try:
        hashed_pwd = hash_password(password=admin_input.password)
    except Exception as e:
        raise e

    admin = Admins(
        username=admin_input.username,
        hashed_password=hashed_pwd,
        is_active=admin_input.is_active,
        panel=admin_input.panel,
        inbound_id=admin_input.inbound_id,
        inbound_flow=admin_input.flow,
        marzban_inbounds=admin_input.marzban_inbounds,
        marzban_password=admin_input.marzban_password,
        traffic=admin_input.traffic,
        initial_traffic=admin_input.traffic,
        update_return_traffic=admin_input.update_return_traffic,
        delete_return_traffic=admin_input.delete_return_traffic,
        expiry_date=admin_input.expiry_date,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin


def get_admin_by_username(db: Session, username: str):
    return db.query(Admins).filter(Admins.username == username).first()


def change_admin_status(db: Session, admin_id: int) -> bool:
    admin = db.query(Admins).filter(Admins.id == admin_id).first()
    if admin:
        admin.is_active = not admin.is_active
        db.commit()
        return True
    return False


def update_admin_values(
    db: Session, admin_id: int, admin_input: AdminUpdateInput
) -> bool:
    admin = db.query(Admins).filter(Admins.id == admin_id).first()
    new_password = (
        hash_password(admin_input.password)
        if admin_input.password
        else admin.hashed_password
    )
    if admin:
        admin.username = admin_input.username
        admin.hashed_password = new_password
        admin.is_active = admin_input.is_active
        admin.panel = admin_input.panel
        admin.inbound_id = admin_input.inbound_id
        admin.inbound_flow = admin_input.flow
        admin.marzban_inbounds = admin_input.marzban_inbounds
        admin.marzban_password = admin_input.marzban_password
        admin.traffic = admin_input.traffic
        admin.initial_traffic = admin_input.traffic
        admin.update_return_traffic = admin_input.update_return_traffic
        admin.delete_return_traffic = admin_input.delete_return_traffic
        admin.expiry_date = admin_input.expiry_date
        db.commit()
        return True
    return False


def remove_admin(db: Session, admin_id: int) -> bool:
    admin = db.query(Admins).filter(Admins.id == admin_id).first()
    if admin:
        db.delete(admin)
        db.commit()
        return True
    return False


def reduce_admin_traffic(db: Session, admin: Admins, used_traffic) -> None:
    admin.traffic -= used_traffic
    db.commit()


def increase_admin_traffic(db: Session, admin: Admins, added_traffic) -> None:
    admin.traffic += added_traffic
    db.commit()


def get_all_panels(db: Session):
    return db.query(Panels).all()


def get_for_bot_panel(db: Session):
    return db.query(Panels).filter(Panels.for_bot.is_(True)).first()


def get_panel_by_name(db: Session, name: str) -> Panels | None:
    return db.query(Panels).filter(Panels.name == name).first()


def add_panel(db: Session, panel_input: PanelInput) -> None:
    panel = Panels(
        panel_type=panel_input.panel_type,
        name=panel_input.name,
        url=panel_input.url,
        sub_url=panel_input.sub_url,
        username=panel_input.username,
        password=panel_input.password,
        token=panel_input.token,
        is_active=panel_input.is_active,
    )
    db.add(panel)
    db.commit()
    db.refresh(panel)


def update_panel_values(db: Session, panel_id: int, panel_input: PanelInput) -> bool:
    panel = db.query(Panels).filter(Panels.id == panel_id).first()
    if panel:
        panel.panel_type = panel_input.panel_type
        panel.name = panel_input.name
        panel.url = panel_input.url
        panel.sub_url = panel_input.sub_url
        panel.username = panel_input.username
        panel.password = panel_input.password
        panel.token = panel_input.token
        db.commit()
        return True
    return False


def change_panel_bot_status(db: Session, panel_id: int) -> bool:
    all_panel = get_all_panels(db)
    for panel in all_panel:
        panel.for_bot = False

    panel = db.query(Panels).filter(Panels.id == panel_id).first()
    if panel:
        panel.for_bot = True
        db.commit()
        return True
    return False


def remove_panel(db: Session, panel_id: int) -> bool:
    panel = db.query(Panels).filter(Panels.id == panel_id).first()
    if panel:
        db.delete(panel)
        db.commit()
        return True
    return False


def get_panel_by_id(db: Session, panel_id: int):
    return db.query(Panels).filter(Panels.id == panel_id).first()


def change_panel_status(db: Session, panel_id: int) -> bool:
    panel = db.query(Panels).filter(Panels.id == panel_id).first()
    if panel:
        panel.is_active = not panel.is_active
        db.commit()
        return True
    return False


def get_news(db: Session):
    return db.query(News).all()


def add_news(db: Session, message: str) -> None:
    news = News(message=message, created_at=datetime.utcnow())
    db.add(news)
    db.commit()
    db.refresh(news)


def delete_news(db: Session, id: int) -> None:
    news = db.query(News).filter(News.id == id).first()
    if news:
        db.delete(news)
        db.commit()


def add_user_in_sanaei_table(db: Session, username: str, owner: str) -> None:
    sanaei = SanaeiUsers(username=username, owner=owner)
    db.add(sanaei)
    db.commit()
    db.refresh(sanaei)


def remove_user_from_sanaei_table(db: Session, username: str) -> None:
    sanaei_user = db.query(SanaeiUsers).filter(SanaeiUsers.username == username).first()
    if sanaei_user:
        db.delete(sanaei_user)
        db.commit()


def get_user_from_sanaei_table(db: Session, username: str) -> SanaeiUsers | None:
    return db.query(SanaeiUsers).filter(SanaeiUsers.username == username).first()


def get_all_users_from_sanaei_table(db: Session) -> list[SanaeiUsers] | None:
    return db.query(SanaeiUsers).all()


def add_user_in_guard_table(db: Session, username: str, owner: str) -> None:
    user = SanaeiUsers(username=username, owner=owner)
    db.add(user)
    db.commit()
    db.refresh(user)


def remove_user_from_guard_table(db: Session, username: str) -> None:
    user = db.query(SanaeiUsers).filter(SanaeiUsers.username == username).first()
    if user:
        db.delete(user)
        db.commit()


def get_user_from_guard_table(db: Session):
    return db.query(SanaeiUsers).all()


def get_tgbot(db: Session):
    return db.query(TGBot).first()


def update_tgbot_values(db: Session, request) -> bool:
    bot = db.query(TGBot).first()
    if bot:
        bot.token = request.token
        bot.admin_id = request.admin_id
        bot.is_active = request.is_active
        db.commit()
        return True
    else:
        new_bot = TGBot(
            token=request.token, admin_id=request.admin_id, is_active=request.is_active
        )
        db.add(new_bot)
        db.commit()
        return True
    return False


def get_all_settings(db: Session):
    return db.query(Settings).first()


def change_setting_price(db: Session, price: int) -> bool:
    setting = db.query(Settings).first()
    if setting:
        setting.price_per_gb = price
        db.commit()
        return True
    return False


def change_setting_request_price(db: Session, price: int) -> bool:
    setting = db.query(Settings).first()
    if setting:
        setting.start_price = price
        db.commit()
        return True
    return False


def get_all_users_from_bot(db: Session):
    try:
        return db.query(Users).all()
    except:
        return None


def get_user(db: Session, chat_id: int) -> Users | None:
    return db.query(Users).filter(Users.chat_id == chat_id).first()


def add_user(db: Session, name: str, chat_id: int, username: str = None) -> None:
    user = Users(name=name, username=username, chat_id=chat_id)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def change_setting_start_message(db: Session, message: str) -> bool:
    setting = db.query(Settings).filter(Settings.id == 1).first()
    if setting:
        setting.start_message = message
        db.commit()
        return True
    return False


def change_setting_help_message(db: Session, message: str) -> bool:
    setting = db.query(Settings).filter(Settings.id == 1).first()
    if setting:
        setting.help_message = message
        db.commit()
        return True
    return False


def get_info_for_bot(db: Session):
    users = db.query(Users).all()
    admins = db.query(Admins).all()
    settings = db.query(Settings).first()
    return users, admins, settings


def make_user_reseller(db, user: Users, admin: Admins):
    user.is_reseller = True
    user.admin_id = admin.id

    db.commit()


def change_setting_payment_enabled(db: Session, enabled: bool) -> bool:
    setting = db.query(Settings).first()
    if setting:
        setting.payment_enabled = enabled
        db.commit()
        return True
    return False


def change_setting_card_payment_enabled(db: Session, enabled: bool) -> bool:
    setting = db.query(Settings).first()
    if setting:
        setting.card_payment_enabled = enabled
        db.commit()
        return True
    return False


def change_setting_tron_payment_enabled(db: Session, enabled: bool) -> bool:
    setting = db.query(Settings).first()
    if setting:
        setting.tron_payment_enabled = enabled
        db.commit()
        return True
    return False


def change_setting_usdt_payment_enabled(db: Session, enabled: bool) -> bool:
    setting = db.query(Settings).first()
    if setting:
        setting.usdt_payment_enabled = enabled
        db.commit()
        return True
    return False


def change_setting_card_details(db: Session, card_number: str | None, card_holder: str | None) -> bool:
    setting = db.query(Settings).first()
    if setting:
        setting.card_number = card_number
        setting.card_holder = card_holder
        db.commit()
        return True
    return False


def change_setting_wallet_addresses(db: Session, wallet_address: str | None, tron_address: str | None, usdt_address: str | None) -> bool:
    setting = db.query(Settings).first()
    if setting:
        setting.wallet_address = wallet_address
        setting.tron_address = tron_address
        setting.usdt_address = usdt_address
        db.commit()
        return True
    return False
