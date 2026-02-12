from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AdminInput(BaseModel):
    username: str
    password: str
    is_active: bool = True
    panel: str
    inbound_id: Optional[int] = None
    flow: Optional[str] = None
    marzban_inbounds: Optional[str] = None
    marzban_password: Optional[str] = None
    traffic: float = 0.0
    return_traffic: bool = False
    expiry_date: datetime | None


class AdminUpdateInput(BaseModel):
    username: str
    password: str
    is_active: bool
    panel: str
    inbound_id: Optional[int] = None
    flow: Optional[str] = None
    marzban_inbounds: Optional[str] = None
    marzban_password: Optional[str] = None
    traffic: float
    return_traffic: bool
    expiry_date: datetime | None


class PanelInput(BaseModel):
    panel_type: str = "3x-ui"
    name: str
    url: str
    sub_url: str | None = None
    username: str
    password: str
    is_active: bool = True


class ClientInput(BaseModel):
    email: str
    id: str  # UUID
    enable: bool = True
    expiry_time: int
    total: float = Field(
        default=0.0, ge=104857600, description="Minimum 0.1 GB (100 MB)"
    )
    sub_id: str
    flow: str = ""


class ClientUpdateInput(BaseModel):
    email: str
    enable: bool
    expiry_time: int
    total: float = Field(ge=104857600, description="Minimum 0.1 GB (100 MB)")
    sub_id: str
    flow: str = ""


class NewsInput(BaseModel):
    news: str = Field(
        max_length=250, description="News content must be 250 characters or less"
    )
