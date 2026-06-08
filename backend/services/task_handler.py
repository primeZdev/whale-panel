from sqlalchemy.orm import Session
from fastapi import status
from fastapi.responses import JSONResponse

from .limit_handler import AdminLimiter
from .sanaei import AdminTaskService as SanaeiAdminTaskService
from .guard import AdminTaskService as GuardAdminTaskService
from .tx_ui import AdminTaskService as TxUIAdminTaskService
from .marzban import AdminTaskService as MarzbanAdminTaskService
from backend.schema.output import ResponseModel, ClientsOutput
from backend.schema._input import PanelInput, ClientInput, ClientUpdateInput
from backend.services.sanaei import APIService as sanaei_APIService
from backend.services.tx_ui import APIService as txui_APIService
from backend.services.marzban import APIService as marzban_APIService
from backend.services.guard import APIService as guard_APIService
from backend.db import crud
from backend.utils.logger import logger


async def create_new_panel(db: Session, panel_input: PanelInput) -> bool:
    if panel_input.panel_type == "3x-ui":
        try:
            connection = await sanaei_APIService(
                panel_input.url, panel_input.token or ''
            ).test_connection()

            if not connection:
                logger.warning(
                    f"Panel validation failed: {panel_input.name} - missing required fields"
                )
                return False

            logger.info(f"Panel validated successfully: {panel_input.name}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to panel {panel_input.url}: {str(e)}")
            return False

    elif panel_input.panel_type == "guard":
        try:
            connection = await guard_APIService(
                panel_input.url, panel_input.token or ''
            ).test_connection()

            if not connection:
                logger.warning(
                    f"Panel validation failed: {panel_input.name} - missing required fields"
                )
                return False

            logger.info(f"Panel validated successfully: {panel_input.name}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to panel {panel_input.url}: {str(e)}")
            return False

    elif panel_input.panel_type == "marzban":
        try:
            connection = await marzban_APIService(
                panel_input.url, panel_input.username, panel_input.password
            ).test_connection()

            if not connection:
                logger.warning(
                    f"Panel validation failed: {panel_input.name} - unable to connect"
                )
                return False

            logger.info(f"Panel validated successfully: {panel_input.name}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to panel {panel_input.url}: {str(e)}")
            return False

    elif panel_input.panel_type == "tx-ui":
        try:
            connection = await txui_APIService(
                panel_input.url, panel_input.username, panel_input.password
            ).test_connection()

            if connection is None or not connection:
                logger.warning(
                    f"Panel validation failed: {panel_input.name} - missing required fields"
                )
                return False

            logger.info(f"Panel validated successfully: {panel_input.name}")
            return True
        except Exception as e:
            logger.error(f"Error connecting to panel {panel_input.url}: {str(e)}")
            return False


async def update_a_panel(db: Session, panel_input: PanelInput) -> bool:
    if panel_input.panel_type == "3x-ui":
        try:
            connection = await sanaei_APIService(
                panel_input.url, panel_input.token or ''
            ).test_connection()

            if not connection:
                logger.warning(
                    f"Panel validation failed during update: {panel_input.name} - missing required fields"
                )
                return False

            logger.info(
                f"Panel validated successfully during update: {panel_input.name}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Error connecting to panel {panel_input.url} during update: {str(e)}"
            )
            return False

    elif panel_input.panel_type == "guard":
        try:
            connection = await guard_APIService(
                panel_input.url, panel_input.token or ''
            ).test_connection()

            if not connection:
                logger.warning(
                    f"Panel validation failed during update: {panel_input.name} - missing required fields"
                )
                return False

            logger.info(
                f"Panel validated successfully during update: {panel_input.name}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Error connecting to panel {panel_input.url} during update: {str(e)}"
            )
            return False

    elif panel_input.panel_type == "marzban":
        try:
            connection = await marzban_APIService(
                panel_input.url, panel_input.username, panel_input.password
            ).test_connection()

            if not connection:
                logger.warning(
                    f"Panel validation failed during update: {panel_input.name} - unable to connect"
                )
                return False

            logger.info(
                f"Panel validated successfully during update: {panel_input.name}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Error connecting to panel {panel_input.url} during update: {str(e)}"
            )
            return False

    elif panel_input.panel_type == "tx-ui":
        try:
            connection = await txui_APIService(
                panel_input.url, panel_input.username, panel_input.password
            ).test_connection()

            if connection is None or not connection:
                logger.warning(
                    f"Panel validation failed during update: {panel_input.name} - missing required fields"
                )
                return False

            logger.info(
                f"Panel validated successfully during update: {panel_input.name}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Error connecting to panel {panel_input.url} during update: {str(e)}"
            )
            return False


async def get_all_users_from_panel(
    admin_username: str, db: Session
) -> tuple[ResponseModel, list[ClientsOutput]]:
    """This function retrieves all users from the panel associated with the given admin."""

    _admin = crud.get_admin_by_username(db, admin_username)
    panel = crud.get_panel_by_name(db, _admin.panel)
    
    if not panel:
        return (
            ResponseModel(
                success=False,
                message="Panel not found",
            ),
            [],
        )

    if panel.panel_type == "guard":
        admin_task = GuardAdminTaskService(admin_username=admin_username, db=db)
        _clients = await admin_task.get_all_users()

        if _clients is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "No users found",
                },
            )
        clients = [] 

        for client in _clients:
            clients.append(
                ClientsOutput(
                    id=client.get("id"),
                    uuid=str(client.get("id")),
                    sub_id=client.get("subId").split("/")[-1] if client.get("subId") else None,
                    username=client.get("email"),
                    status=client.get("enable"),
                    is_online=client.get("is_online"),
                    data_limit=client.get("totalGB"),
                    used_data=client.get("usedData"),
                    expiry_date_unix=client.get("expiryTime")
                )
            )
        
        admin_users = crud.get_user_from_guard_table(db)
        allowed_usernames = {
            user.username for user in admin_users if user.owner == admin_username
        }

        filtered_clients = [c for c in clients if c.username in allowed_usernames]

        return (
            ResponseModel(
                success=True,
                message="Users retrieved successfully", 
                data=filtered_clients,
            ),
            filtered_clients,
        )
        


    if panel.panel_type == "3x-ui":
        admin_task = SanaeiAdminTaskService(admin_username=admin_username, db=db)
        _clients = await admin_task.get_all_users()

        if _clients is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "No users found",
                },
            )
        clients = []
        for client in _clients:
            clients.append(
                ClientsOutput(
                    id=client.get("id"),
                    uuid=client.get("uuid"),
                    username=client.get("email"),
                    status=client.get("enable"),
                    is_online=client.get("isOnline"),
                    data_limit=client.get("totalGB"),
                    used_data=(
                        client.get("traffic", {}).get("up", 0)
                        + client.get("traffic", {}).get("down", 0)
                    ),
                    expiry_date=None,
                    expiry_date_unix=client.get("expiryTime"),
                    sub_id=client.get("subId"),
                    flow=client.get("flow"),
                )
            )

        admin_users = crud.get_all_users_from_sanaei_table(db)
        allowed_usernames = {
            user.username for user in admin_users if user.owner == admin_username
        }

        filtered_clients = [c for c in clients if c.username in allowed_usernames]

        return (
            ResponseModel(
                success=True,
                message="Users retrieved successfully",
                data=filtered_clients,
            ),
            filtered_clients,
        )

    elif panel.panel_type == "marzban":
        admin_task = MarzbanAdminTaskService(admin_username=admin_username, db=db)
        _users = await admin_task.get_all_users()

        if _users is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "No users found",
                },
            )

        users = []
        for user in _users:
            expire_val = user.get("expire")
            users.append(
                ClientsOutput(
                    username=user.get("username"),
                    status=True if user.get("status") == "active" else False,
                    is_online=False,
                    data_limit=user.get("data_limit") or 0,
                    used_data=user.get("used_traffic") or 0,
                    expiry_date_unix=expire_val * 1000 if expire_val else None,
                    sub_id=user.get("subscription_url"),
                )
            )
        return (
            ResponseModel(
                success=True,
                message="Users retrieved successfully",
                data=users,
            ),
            users,
        )

    elif panel.panel_type == "tx-ui":
        admin_task = TxUIAdminTaskService(admin_username=admin_username, db=db)
        _clients = await admin_task.get_all_users()

        if _clients is None:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "No users found",
                },
            )
        clients = []
        for client in _clients:
            up = client.get("up", 0) or 0
            down = client.get("down", 0) or 0

            clients.append(
                ClientsOutput(
                    id=client.get("id"),
                    uuid=client.get("id"),
                    username=client.get("email"),
                    status=client.get("enable", False),
                    is_online=client.get("is_online", False),
                    data_limit=client.get("totalGB", 0),
                    used_data=up + down,
                    expiry_date=None,
                    expiry_date_unix=client.get("expiryTime", 0),
                    sub_id=client.get("subId"),
                    flow=client.get("flow"),
                )
            )
        return (
            ResponseModel(
                success=True,
                message="Users retrieved successfully",
                data=clients,
            ),
            clients,
        )


async def add_new_user(
    admin_username: str, user_input: ClientInput, db: Session
) -> JSONResponse:
    """This function adds a new user to the panel associated with the given admin."""

    _admin = crud.get_admin_by_username(db, admin_username)
    panel = crud.get_panel_by_name(db, _admin.panel)
    
    if not panel:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Panel not found",
            },
        )
    
    admin_check = AdminLimiter(admin_username=admin_username, db=db)

    if panel.panel_type == "guard":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to add user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )
        elif not admin_check.check_traffic_limit(user_input.total):
            logger.warning(
                f"Admin {admin_username} exceeded traffic limit when adding user: {user_input.email}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to add this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )

        admin_task = GuardAdminTaskService(admin_username=admin_username, db=db)

        success = await admin_task.add_client_to_panel(user_input)

        if not success:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": f"{success}",
                },
            )
        
        crud.add_user_in_guard_table(db, user_input.email, admin_username)
        admin_check.reduce_usage(user_input.total, user_input.total)
        return ResponseModel(
            success=True,
            message="User added successfully",
        )
        
    if panel.panel_type == "3x-ui":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to add user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )
        elif not admin_check.check_traffic_limit(user_input.total):
            logger.warning(
                f"Admin {admin_username} exceeded traffic limit when adding user: {user_input.email}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to add this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )

        admin_task = SanaeiAdminTaskService(admin_username=admin_username, db=db)
        check_duplicate = await admin_task.get_client_by_email(user_input.email)

        if check_duplicate:
            logger.warning(
                f"Attempt to add user with duplicate email: {user_input.email} by admin: {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "success": False,
                    "message": "This email is reserved by another admins",
                },
            )

        success = await admin_task.add_client_to_panel(user_input)

        if not success:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": f"{success}",
                },
            )
        admin_check.reduce_usage(user_input.total, user_input.total)

        crud.add_user_in_sanaei_table(db, user_input.email, admin_username)
        return ResponseModel(
            success=True,
            message="User added successfully",
        )

    if panel.panel_type == "marzban":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to add user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )
        elif not admin_check.check_traffic_limit(user_input.total):
            logger.warning(
                f"Admin {admin_username} exceeded traffic limit when adding user: {user_input.email}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to add this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )

        admin_task = MarzbanAdminTaskService(admin_username=admin_username, db=db)
        success = await admin_task.add_user_to_panel(user_input)

        if not success:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": f"{success}",
                },
            )
        admin_check.reduce_usage(user_input.total, user_input.total)
        return ResponseModel(
            success=True,
            message="User added successfully",
        )

    if panel.panel_type == "tx-ui":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to add user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )
        elif not admin_check.check_traffic_limit(user_input.total):
            logger.warning(
                f"Admin {admin_username} exceeded traffic limit when adding user: {user_input.email}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to add this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )

        admin_task = TxUIAdminTaskService(admin_username=admin_username, db=db)
        check_duplicate = await admin_task.get_client_by_email(user_input.email)

        if check_duplicate:
            logger.warning(
                f"Attempt to add user with duplicate email: {user_input.email} by admin: {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={
                    "success": False,
                    "message": "This email is reserved by another admins",
                },
            )

        success = await admin_task.add_client_to_panel(user_input)

        if not success:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": f"{success}",
                },
            )
        admin_check.reduce_usage(user_input.total, user_input.total)
        return ResponseModel(
            success=True,
            message="User added successfully",
        )


async def update_a_user(
    admin_username: str, uuid: str, user_input: ClientUpdateInput, db: Session
) -> JSONResponse:
    """This function updates an existing user in the panel associated with the given admin."""

    _admin = crud.get_admin_by_username(db, admin_username)
    panel = crud.get_panel_by_name(db, _admin.panel)
    
    if not panel:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Panel not found",
            },
        )
    
    admin_check = AdminLimiter(admin_username=admin_username, db=db)

    if panel.panel_type == "guard":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to update user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )
        elif not admin_check.check_traffic_limit(user_input.total):
            logger.warning(
                f"Admin {admin_username} exceeded traffic limit when updating user: {user_input.email}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to update this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )

        admin_task = GuardAdminTaskService(admin_username=admin_username, db=db)
        clients = await admin_task.get_all_users()
        user_info = next((client for client in clients if client.get("id") == int(uuid)), None)

        if not user_info:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )

        extra_traffic = (
            user_input.total - user_info.get("totalGB", 0)
            if user_input.total > user_info.get("totalGB", 0)
            else 0
        )

        update_user = await admin_task.update_client_in_panel(user_info.get("username"), user_input)

        if not update_user:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to update user",
                },
            )

        admin_check.reduce_usage(user_input.total, extra_traffic)
        increase_traffic = user_info.get("totalGB", 0) - user_input.total 
        admin_check.increase_usage(increase_traffic if increase_traffic > 0 else 0)
        
        return ResponseModel(
            success=True,
            message="User updated successfully",
        )

    if panel.panel_type == "3x-ui":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to update user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )
        elif not admin_check.check_traffic_limit(user_input.total):
            logger.warning(
                f"Admin {admin_username} exceeded traffic limit when updating user: {uuid}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to update this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )

        admin_task = SanaeiAdminTaskService(admin_username=admin_username, db=db)
        all_users = await admin_task.get_all_users()
        user_info = next((user for user in all_users if user.get("email") == user_input.email), None)

        if not user_info:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )

        

        update_user = await admin_task.update_client_in_panel(uuid, user_input)

        if not update_user:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to update user",
                },
            )

        extra_traffic = (
            user_input.total - user_info.get("totalGB", 0)
            if user_input.total > user_info.get("totalGB", 0)
            else 0
        )
        admin_check.reduce_usage(user_input.total, extra_traffic)
        increase_traffic = user_info.get("totalGB", 0) - user_input.total 
        admin_check.increase_usage(increase_traffic if increase_traffic > 0 else 0)
        

        return ResponseModel(
            success=True,
            message="User updated successfully",
        )

    if panel.panel_type == "marzban":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to update user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )
        elif not admin_check.check_traffic_limit(user_input.total):
            logger.warning(
                f"Admin {admin_username} exceeded traffic limit when updating user: {user_input.email}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to update this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )
        admin_task = MarzbanAdminTaskService(admin_username=admin_username, db=db)
        user_info = await admin_task.get_user_by_username(user_input.email)

        if not user_info:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )

        # Calculate extra traffic if increasing data limit
        extra_traffic = (
            user_input.total - user_info.get("data_limit", 0)
            if user_input.total > user_info.get("data_limit", 0)
            else 0
        )

        update_user = await admin_task.update_user_in_panel(
            user_input.email, user_input
        )

        if not update_user:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to update user",
                },
            )

        admin_check.reduce_usage(user_input.total, extra_traffic)
        return ResponseModel(
            success=True,
            message="User updated successfully",
        )

    elif panel.panel_type == "tx-ui":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to update user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )
        elif not admin_check.check_traffic_limit(user_input.total):
            logger.warning(
                f"Admin {admin_username} exceeded traffic limit when updating user: {user_input.email}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to update this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )
        admin_task = TxUIAdminTaskService(admin_username=admin_username, db=db)
        users = await admin_task.get_all_users()
        for user in users:
            if user.get("id") == uuid:
                user_info = user
                break

        extra_traffic = (
            user_input.total - user_info.get("totalGB", 0)
            if user_input.total > user_info.get("totalGB", 0)
            else 0
        )

        update_user = await admin_task.update_client_in_panel(uuid, user_input)

        if not update_user:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to update user",
                },
            )

        admin_check.reduce_usage(user_input.total, extra_traffic)
        return ResponseModel(
            success=True,
            message="User updated successfully",
        )


async def reset_a_user_usage(
    admin_username: str, email: str, db: Session
) -> JSONResponse:
    """This function resets a user's usage statistics in the panel associated with the given admin."""

    _admin = crud.get_admin_by_username(db, admin_username)
    panel = crud.get_panel_by_name(db, _admin.panel)    
    if not panel:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={
                "success": False,
                "message": "Panel not found",
            },
        )
    admin_check = AdminLimiter(admin_username=admin_username, db=db)

    if panel.panel_type == "guard":
        if not admin_check.admin_is_active():
            logger.warning(
                f"Inactive admin attempted to reset user usage: {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )

        admin_task = GuardAdminTaskService(admin_username=admin_username, db=db)
        clients = await admin_task.get_all_users()
        user_info = next(
            (
                client for client in clients
                if client.get("username") == email
            ),
            None
        )

        if not user_info:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )

        if not admin_check.check_traffic_limit(user_info.get("totalGB", 0)):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to reset usage for this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )
        usage_user_traffic = user_info.get("usedData", 0)
        reset_usage = await admin_task.reset_client_usage(email)

        if not reset_usage:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to reset user usage",
                },
            )
        admin_check.reduce_usage(user_info.get("totalGB", 0), usage_user_traffic)
        return ResponseModel(
            success=True,
            message="User usage reset successfully",
        )
    if panel.panel_type == "3x-ui":
        if not admin_check.admin_is_active():
            logger.warning(
                f"Inactive admin attempted to reset user usage: {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )

        admin_task = SanaeiAdminTaskService(admin_username=admin_username, db=db)
        all_users = await admin_task.get_all_users()
        user_info = next(
            (
                user for user in all_users
                if user.get("email") == email
            ),
            None
        )

        if not admin_check.check_traffic_limit(user_info["totalGB"]):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to reset usage for this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )
        traffic = user_info.get("traffic", {})

        usage_user_traffic = (
            traffic.get("up", 0) +
            traffic.get("down", 0)
        )

        total_gb = user_info.get("totalGB", 0)

        reset_usage = await admin_task.reset_client_usage(email)

        if usage_user_traffic > total_gb:
            usage_traffic = total_gb
        else:
            usage_traffic = usage_user_traffic

        if not reset_usage:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to reset user usage",
                },
            )
        admin_check.reduce_usage(user_info["totalGB"], usage_traffic)
        return ResponseModel(
            success=True,
            message="User usage reset successfully",
        )

    if panel.panel_type == "marzban":
        if not admin_check.admin_is_active():
            logger.warning(
                f"Inactive admin attempted to reset user usage: {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )

        admin_task = MarzbanAdminTaskService(admin_username=admin_username, db=db)
        user_info = await admin_task.get_user_by_username(email)
        if not user_info:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )
        if not admin_check.check_traffic_limit(user_info.get("data_limit", 0)):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to reset usage for this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )
        usage_user_traffic = user_info.get("used_traffic", 0)
        reset_usage = await admin_task.reset_user_usage_in_panel(email)

        if not reset_usage:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to reset user usage",
                },
            )
        admin_check.reduce_usage(user_info.get("data_limit", 0), usage_user_traffic)
        return ResponseModel(
            success=True,
            message="User usage reset successfully",
        )

    elif panel.panel_type == "tx-ui":
        if not admin_check.admin_is_active():
            logger.warning(
                f"Inactive admin attempted to reset user usage: {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )

        admin_task = TxUIAdminTaskService(admin_username=admin_username, db=db)
        user_info = await admin_task.get_client_by_email(email)
        if not user_info:
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )
        if not admin_check.check_traffic_limit(user_info.get("total", 0)):
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": f"Insufficient traffic to reset usage for this user, your limit: {round((_admin.traffic) / (1024 ** 3), 1)} GB",
                },
            )
        usage_user_traffic = user_info.get("up", 0) + user_info.get("down", 0)
        reset_usage = await admin_task.reset_client_usage(email)

        if usage_user_traffic > user_info.get("total", 0):
            usage_traffic = user_info.get("total", 0)
        else:
            usage_traffic = usage_user_traffic

        if not reset_usage:
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to reset user usage",
                },
            )
        admin_check.reduce_usage(user_info.get("total", 0), usage_traffic)
        return ResponseModel(
            success=True,
            message="User usage reset successfully",
        )


async def delete_a_user(admin_username: str, uuid: str, db: Session) -> bool:
    """This function deletes a user from the panel associated with the given admin."""

    _admin = crud.get_admin_by_username(db, admin_username)
    panel = crud.get_panel_by_name(db, _admin.panel)
    
    if not panel:
        return False
    
    admin_check = AdminLimiter(admin_username=admin_username, db=db)

    if panel.panel_type == "guard":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to delete user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )

        admin_task = GuardAdminTaskService(admin_username=admin_username, db=db)
        users = await admin_task.get_all_users()

        user_info = None
        for user in users:
            if user.get("id") == int(uuid):
                user_info = user
                break

        if not user_info:
            logger.warning(
                f"User with uuid {uuid} not found for deletion by admin {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )

        total = user_info.get("totalGB", 0)
        used = user_info.get("usedData", 0)
        traffic = total - used
        if traffic < 0:
            traffic = 0

        delete_user = await admin_task.delete_client_from_panel(user_info.get("username"))

        if not delete_user:
            logger.error(f"Failed to delete user {uuid} by admin {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to delete user",
                },
            )

        crud.remove_user_from_guard_table(db, user_info["username"])

        admin_check.increase_usage(traffic)
        logger.info(
            f"User {user_info['email']} deleted by admin {admin_username}, traffic returned: {round(traffic / (1024 ** 3), 2)} GB"
        )

        crud.remove_user_from_sanaei_table(db, user_info["email"])
        return ResponseModel(
            success=True,
            message="User deleted successfully",
        )      


    if panel.panel_type == "3x-ui":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to delete user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )

        admin_task = SanaeiAdminTaskService(admin_username=admin_username, db=db)
        users = await admin_task.get_all_users()

        # Find user
        user_info = None
        for user in users:
            if user.get("uuid") == uuid:
                user_info = user
                break

        if not user_info:
            logger.warning(
                f"User with uuid {uuid} not found for deletion by admin {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )

        total = user_info.get("totalGB", user_info.get("total", 0)) or 0
        _traffic_dict = user_info.get("traffic", {}) or {}
        used = (_traffic_dict.get("up", 0) or 0) + (_traffic_dict.get("down", 0) or 0)
        traffic = max(total - used, 0)

        delete_user = await admin_task.delete_client_from_panel(uuid)

        if not delete_user:
            logger.error(f"Failed to delete user {uuid} by admin {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to delete user",
                },
            )

        admin_check.increase_usage(traffic)
        logger.info(
            f"User {user_info['email']} deleted by admin {admin_username}, traffic returned: {round(traffic / (1024 ** 3), 2)} GB"
        )

        crud.remove_user_from_sanaei_table(db, user_info["email"])
        return ResponseModel(
            success=True,
            message="User deleted successfully",
        )

    if panel.panel_type == "marzban":
        username = uuid  # Marzban uses username as identifier
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to delete user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )

        admin_task = MarzbanAdminTaskService(admin_username=admin_username, db=db)
        user_info = await admin_task.get_user_by_username(username)

        if not user_info:
            logger.warning(
                f"User with username {username} not found for deletion by admin {admin_username}"
            )
            return JSONResponse(
                status_code=status.HTTP_404_NOT_FOUND,
                content={
                    "success": False,
                    "message": "User not found",
                },
            )

        traffic = max(user_info.get("data_limit", 0) - user_info.get("used_traffic", 0), 0)

        delete_user = await admin_task.delete_user_from_panel(username)

        if not delete_user:
            logger.error(f"Failed to delete user {username} by admin {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to delete user",
                },
            )

        admin_check.increase_usage(traffic)
        logger.info(
            f"User {user_info['username']} deleted by admin {admin_username}, traffic returned: {round(traffic / (1024 ** 3), 2)} GB"
        )

        return ResponseModel(
            success=True,
            message="User deleted successfully",
        )

    elif panel.panel_type == "tx-ui":
        if not admin_check.admin_is_active():
            logger.warning(f"Inactive admin attempted to delete user: {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_403_FORBIDDEN,
                content={
                    "success": False,
                    "message": "Your admin account is inactive. Contact support.",
                },
            )

        admin_task = TxUIAdminTaskService(admin_username=admin_username, db=db)
        users = await admin_task.get_all_users()

        # Find user
        user_info = None
        for user in users:
            if user.get("id") == uuid:
                user_info = user
                break

        _traffic_dict = user_info.get("traffic", {}) or {}
        traffic = max(
            user_info.get("totalGB", 0) - (
                (_traffic_dict.get("up", 0) or 0) + (_traffic_dict.get("down", 0) or 0)
            ), 0
        )

        delete_user = await admin_task.delete_client_from_panel(uuid)

        if not delete_user:
            logger.error(f"Failed to delete user {uuid} by admin {admin_username}")
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={
                    "success": False,
                    "message": "Failed to delete user",
                },
            )

        admin_check.increase_usage(traffic)
        logger.info(
            f"User {user_info['email']} deleted by admin {admin_username}, traffic returned: {round(traffic / (1024 ** 3), 2)} GB"
        )

        return ResponseModel(
            success=True,
            message="User deleted successfully",
        )
