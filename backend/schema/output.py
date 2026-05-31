from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel


class ResponseModel(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class AdminOutput(BaseModel):
    id: int
    username: str
    is_active: bool
    panel: str
    inbound_id: Optional[str]
    marzban_inbounds: Optional[str] = None
    flow: Optional[str] = None
    traffic: float
    update_return_traffic: bool
    delete_return_traffic: bool
    expiry_date: Optional[datetime]

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, admin):
        return cls(
            id=admin.id,
            username=admin.username,
            is_active=admin.is_active,
            panel=admin.panel,
            inbound_id=admin.inbound_id,
            marzban_inbounds=admin.marzban_inbounds,
            flow=admin.inbound_flow,
            traffic=admin.traffic,
            update_return_traffic=admin.update_return_traffic,
            delete_return_traffic=admin.delete_return_traffic,
            expiry_date=admin.expiry_date,
        )


class PanelOutput(BaseModel):
    id: int
    panel_type: str
    name: str
    url: str
    is_active: bool

    class Config:
        from_attributes = True


class ClientsOutput(BaseModel):
    id: int | str = 0
    uuid: str = 0
    username: str
    email: Optional[str] = None
    status: bool = True
    is_online: bool = False
    data_limit: int
    used_data: int
    expiry_date: Optional[datetime] = None
    expiry_date_unix: Optional[int]
    sub_id: Optional[str] = None
    flow: Optional[str] = None

    class Config:
        from_attributes = True
