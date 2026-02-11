from fastapi import APIRouter, Depends, status, UploadFile, File
from fastapi.responses import JSONResponse, FileResponse
from sqlalchemy.orm import Session
import os

from backend.schema.output import ResponseModel
from backend.schema._input import AdminInput, AdminUpdateInput, PanelInput
from backend.db import crud
from backend.db.engin import get_db
from backend.services import create_new_panel, update_a_panel
from backend.services.marzban.api import APIService as MarzbanAPI
from backend.utils.logger import logger, get_10_logs
from backend.utils.backup import restore_database
from backend.auth.auth import get_current_superadmin

router = APIRouter(prefix="/superadmin", tags=["superadmin"])


@router.post("/admin", description="create a new admin", response_model=ResponseModel)
async def create_admin(
    admin_input: AdminInput,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    if crud.get_admin_by_username(db, admin_input.username):
        logger.warning(
            f"Attempt to create admin with duplicate username: {admin_input.username}"
        )
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "message": "Admin with this username already exists",
            },
        )

    crud.add_admin(db, admin_input)
    logger.info(f"New admin created: {admin_input.username}")
    return ResponseModel(
        success=True,
        message="Admin created successfully",
    )


@router.put("/admin/{admin_id}", response_model=ResponseModel)
async def update_admin(
    admin_id: int,
    admin_input: AdminUpdateInput,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    if not crud.get_admin_by_username(db, admin_input.username):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Admin not found",
            },
        )
    update_admin = crud.update_admin_values(db, admin_id, admin_input)
    if update_admin:
        return ResponseModel(
            success=True,
            message="Admin updated successfully",
        )


@router.delete("/admin/{admin_id}", response_model=ResponseModel)
async def delete_admin(
    admin_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    remove_admin = crud.remove_admin(db, admin_id)
    if not remove_admin:
        logger.warning(f"Attempt to delete non-existent admin with id: {admin_id}")
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Admin not found",
            },
        )
    logger.info(f"Admin deleted with id: {admin_id}")
    return ResponseModel(
        success=True,
        message="Admin deleted successfully",
    )


@router.patch("/admin/{admin_id}/status", response_model=ResponseModel)
async def toggle_admin_status(
    admin_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    status_changed = crud.change_admin_status(db, admin_id)
    if not status_changed:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Admin not found",
            },
        )
    return ResponseModel(
        success=True,
        message="Admin status changed successfully",
    )


@router.post("/panel", description="add a new panel", response_model=ResponseModel)
async def create_panel(
    panel_input: PanelInput,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    if crud.get_panel_by_name(db, panel_input.name):
        logger.warning(
            f"Attempt to create panel with duplicate name: {panel_input.name}"
        )
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "success": False,
                "message": "Panel with this name already exists",
            },
        )

    connection = await create_new_panel(db, panel_input)
    if not connection:
        logger.error(
            f"Failed to connect to panel: {panel_input.name} at {panel_input.url}"
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "Failed to connect to the panel with provided credentials",
            },
        )

    crud.add_panel(db, panel_input)
    logger.info(f"New panel created: {panel_input.name}")
    return ResponseModel(
        success=True,
        message="Panel created successfully",
    )


@router.put("/panel/{panel_id}", response_model=ResponseModel)
async def update_panel(
    panel_id: int,
    panel_input: PanelInput,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    if not crud.get_panel_by_id(db, panel_id):
        logger.warning(f"Attempt to update non-existent panel with id: {panel_id}")
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Panel not found",
            },
        )
    connection = await update_a_panel(db, panel_input)
    if not connection:
        logger.error(
            f"Failed to connect to panel: {panel_input.name} at {panel_input.url} during update"
        )
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "Failed to connect to the panel with provided credentials",
            },
        )

    crud.update_panel_values(db, panel_id, panel_input)
    logger.info(f"Panel updated with id: {panel_id} ({panel_input.name})")
    return ResponseModel(
        success=True,
        message="Panel updated successfully",
    )


@router.delete("/panel/{panel_id}", response_model=ResponseModel)
async def delete_panel(
    panel_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    remove_panel = crud.remove_panel(db, panel_id)
    if not remove_panel:
        logger.warning(f"Attempt to delete non-existent panel with id: {panel_id}")
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Panel not found",
            },
        )
    logger.info(f"Panel deleted with id: {panel_id}")
    return ResponseModel(
        success=True,
        message="Panel deleted successfully",
    )


@router.patch("/panel/{panel_id}/status", response_model=ResponseModel)
async def toggle_panel_status(
    panel_id: int,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    status_changed = crud.change_panel_status(db, panel_id)
    if not status_changed:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Panel not found",
            },
        )
    return ResponseModel(
        success=True,
        message="Panel status changed successfully",
    )


@router.get("/panel/{panel_name}/inbounds")
async def get_panel_inbounds(
    panel_name: str,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_current_superadmin),
):
    """Get available inbounds for a Marzban panel"""
    panel = crud.get_panel_by_name(db, panel_name)
    if not panel:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Panel not found",
            },
        )

    if panel.panel_type != "marzban":
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "Only Marzban panels support inbound selection",
            },
        )

    try:
        api_service = MarzbanAPI(
            url=panel.url,
            username=panel.username,
            password=panel.password,
        )
        inbounds = await api_service.get_inbounds()
        return ResponseModel(
            success=True, message="Inbounds retrieved successfully", data=inbounds
        )
    except Exception as e:
        logger.error(f"Failed to fetch inbounds from panel {panel_name}: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": f"Failed to fetch inbounds: {str(e)}",
            },
        )


@router.get("/backup", description="Download database backup")
async def download_backup(admin: dict = Depends(get_current_superadmin)):
    """Download the current database as a backup file"""
    db_path = "/app/data/walpanel.db"
    if not os.path.exists(db_path):
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Database file not found",
            },
        )

    return FileResponse(
        path=db_path,
        filename="walpanel.db",
        media_type="application/octet-stream",
    )


@router.post(
    "/restore",
    description="Restore database from uploaded file",
    response_model=ResponseModel,
)
async def restore_backup(
    file: UploadFile = File(...), admin: dict = Depends(get_current_superadmin)
):
    """Restore database from an uploaded backup file"""
    if not file.filename.endswith(".db"):
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "success": False,
                "message": "Only .db files are allowed",
            },
        )

    db_path = "/app/data/walpanel.db"
    try:
        restore_database(db_path, file)
        return ResponseModel(
            success=True,
            message="Database restored successfully. Please restart the container to apply changes.",
        )

    except Exception as e:
        logger.error(f"Restore failed: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": f"Failed to restore database: {str(e)}",
            },
        )


@router.get("/logs", description="Get application logs")
async def get_logs(admin: dict = Depends(get_current_superadmin)):
    """Get the last 10 application logs"""
    try:
        logs = get_10_logs()
        return ResponseModel(
            success=True,
            message="Logs retrieved successfully",
            data=logs,
        )
    except Exception as e:
        logger.error(f"Failed to retrieve logs: {str(e)}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "message": f"Failed to retrieve logs: {str(e)}",
            },
        )
