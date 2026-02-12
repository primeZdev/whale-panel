from datetime import datetime
from .engin import Base
from sqlalchemy import Column, DateTime, Integer, String, Boolean, BigInteger


class Admins(Base):
    __tablename__ = "admins"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    panel = Column(String, nullable=False)
    inbound_id = Column(Integer, nullable=True)
    marzban_inbounds = Column(String, nullable=True)
    marzban_password = Column(String, nullable=True)
    traffic = Column(BigInteger, default=0)
    return_traffic = Column(Boolean, default=False)
    expiry_date = Column(DateTime, nullable=True)
    inbound_flow = Column(String, nullable=True)


class Panels(Base):
    __tablename__ = "panels"

    id = Column(Integer, primary_key=True, index=True)
    panel_type = Column(String, nullable=False)
    name = Column(String, unique=True, index=True, nullable=False)
    url = Column(String, nullable=False)
    sub_url = Column(String, nullable=True)
    username = Column(String, nullable=False)
    password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)

class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.date)
