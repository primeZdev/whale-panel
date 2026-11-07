from datetime import datetime
from .engin import Base
from sqlalchemy import (
    Column,
    DateTime,
    Integer,
    String,
    Boolean,
    BigInteger,
    ForeignKey,
)
from sqlalchemy.orm import relationship


class Admins(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    panel = Column(String, nullable=False)
    inbound_id = Column(String, nullable=True)
    marzban_inbounds = Column(String, nullable=True)
    marzban_password = Column(String, nullable=True)
    traffic = Column(BigInteger, default=0)
    initial_traffic = Column(BigInteger, default=0, nullable=True)
    update_return_traffic = Column(Boolean, default=False)
    delete_return_traffic = Column(Boolean, default=False)
    expiry_date = Column(DateTime, nullable=True)
    inbound_flow = Column(String, nullable=True)

    user = relationship("Users", back_populates="admin", uselist=False)


class Panels(Base):
    __tablename__ = "panels"

    id = Column(Integer, primary_key=True, index=True)
    panel_type = Column(String, nullable=False)
    name = Column(String, unique=True, index=True, nullable=False)
    url = Column(String, nullable=False)
    sub_url = Column(String, nullable=True)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    token = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    for_bot = Column(Boolean, default=False, nullable=True)


class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.date)


class SanaeiUsers(Base):
    __tablename__ = "sanaei_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    owner = Column(String, nullable=False)


class GuardUsers(Base):
    __tablename__ = "guard_users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    owner = Column(String, nullable=False)


class TGBot(Base):
    __tablename__ = "tgbot"

    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, nullable=False)
    admin_id = Column(Integer, nullable=False)
    is_active = Column(Boolean, default=True)


class Settings(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)

    price_per_gb = Column(Integer, default=5000)
    start_price = Column(Integer, default=100000)
    minimum_purchase_amount = Column(Integer, default=500000)
    registration_enabled = Column(Boolean, default=True)
    payment_enabled = Column(Boolean, default=True)
    card_payment_enabled = Column(Boolean, default=True)
    tron_payment_enabled = Column(Boolean, default=False)
    usdt_payment_enabled = Column(Boolean, default=False)
    card_number = Column(String(50), nullable=True)
    card_holder = Column(String(100), nullable=True)
    wallet_address = Column(String(200), nullable=True)
    tron_address = Column(String(200), nullable=True)
    usdt_address = Column(String(200), nullable=True)
    start_message = Column(String, nullable=True)
    help_message = Column(String, nullable=True)


class Users(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    chat_id = Column(BigInteger, nullable=False, unique=True)
    name = Column(String, nullable=False)
    username = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    is_registered = Column(Boolean, default=False)
    is_reseller = Column(Boolean, default=False)

    admin_id = Column(Integer, ForeignKey("admins.id"), nullable=True, unique=True)
    admin = relationship("Admins", back_populates="user")
