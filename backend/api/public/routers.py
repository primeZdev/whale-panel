from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from backend.db import crud
from backend.db.engin import get_db
from backend.auth import get_current_admin
from backend.schema.output import AdminOutput, ResponseModel, PanelOutput
from backend.services import get_all_users_from_panel
from backend.utils import get_system_info, get_ads_from_github

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/", description="Get dashboard data")
async def read_dashboard_data(
    db: Session = Depends(get_db), current_admin: dict = Depends(get_current_admin)
):
    if current_admin["role"] == "superadmin":
        all_admins = crud.get_all_admins(db)
        all_panels = crud.get_all_panels(db)
        system = get_system_info()
        ads = get_ads_from_github()
        return ResponseModel(
            success=True,
            message="Data retrieved successfully",
            data={
                "admins": [AdminOutput.from_orm(admin) for admin in all_admins],
                "panels": [PanelOutput.from_orm(panel) for panel in all_panels],
                "system": system,
                "ads": ads,
            },
        )

    if current_admin["role"] == "admin":
        admin_data = crud.get_admin_by_username(db, current_admin["username"])
        panel_data = crud.get_panel_by_name(db, admin_data.panel)
        news_data = crud.get_news(db)
        _, users = await get_all_users_from_panel(
            admin_username=current_admin["username"], db=db
        )

        return ResponseModel(
            success=True,
            message="Data retrieved successfully",
            data={
                "remaining_traffic": admin_data.traffic,
                "expiry_time": admin_data.expiry_date,
                "news": [news.message for news in news_data],
                "sub_url": panel_data.sub_url,
                "users": users,
            },
        )
