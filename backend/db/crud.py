from datetime import datetime
from sqlalchemy.orm import Session

from backend.db.model import Admins, Panels, News
from backend.schema._input import AdminInput, AdminUpdateInput, PanelInput
from backend.auth.hash import hash_password


def get_all_admins(db: Session):
    return db.query(Admins).all()


def add_admin(db: Session, admin_input: AdminInput) -> None:
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
        return_traffic=admin_input.return_traffic,
        expiry_date=admin_input.expiry_date,
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)


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
    if admin:
        admin.username = admin_input.username
        admin.hashed_password = hash_password(admin_input.password)
        admin.is_active = admin_input.is_active
        admin.panel = admin_input.panel
        admin.inbound_id = admin_input.inbound_id
        admin.inbound_flow = admin_input.flow
        admin.marzban_inbounds = admin_input.marzban_inbounds
        admin.marzban_password = admin_input.marzban_password
        admin.traffic = admin_input.traffic
        admin.return_traffic = admin_input.return_traffic
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
    if admin.return_traffic:
        admin.traffic += added_traffic
        db.commit()


def get_all_panels(db: Session):
    return db.query(Panels).all()


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
