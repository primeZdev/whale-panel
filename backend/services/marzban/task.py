from sqlalchemy.orm import Session

from backend.schema._input import ClientInput, ClientUpdateInput
from backend.services.marzban import APIService
from backend.db import crud
from backend.utils.logger import logger


class AdminTaskService:
    def __init__(self, admin_username: str, db: Session):
        self.db = db
        self.admin_username = admin_username
        self.admin = crud.get_admin_by_username(db, username=admin_username)
        self.panel = crud.get_panel_by_name(db, name=self.admin.panel)
        self.api_service = APIService(
            url=self.panel.url,
            username=self.panel.username,
            password=self.panel.password,
            inbounds=self.admin.marzban_inbounds,
        )

    async def get_all_users(self):
        try:
            users = await self.api_service.get_users()
            user_list = users.get("users", []) if isinstance(users, dict) else users
            return user_list
        except Exception as e:
            logger.error(
                f"Error retrieving users for admin {self.admin_username}: {str(e)}"
            )
            raise e

    async def get_user_by_username(self, username: str) -> dict | bool:
        try:
            user = await self.api_service.get_user(username)
            return user
        except Exception as e:
            logger.error(f"Error retrieving user by username {username}: {str(e)}")
            return False

    async def add_user_to_panel(self, client: ClientInput) -> bool:
        try:
            response_status = await self.api_service.create_user(client)
            if response_status != 200:
                logger.error(
                    f"Failed to add client {client.email} to panel by admin {self.admin_username}: {response_status}"
                )

                return False
            logger.info(
                f"Client {client.email} added to panel by admin {self.admin_username}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Error adding client {client.email} to panel by admin {self.admin_username}: {str(e)}"
            )
            return False

    async def update_user_in_panel(
        self, username: str, user_data: ClientUpdateInput
    ) -> bool:
        try:
            response_status = await self.api_service.update_user(username, user_data)
            if response_status != 200:
                logger.error(
                    f"Failed to update client {username} in panel by admin {self.admin_username}: {response_status}"
                )
                return False

            logger.info(
                f"Client {username} updated in panel by admin {self.admin_username}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Error updating client {username} in panel by admin {self.admin_username}: {str(e)}"
            )
            return False

    async def delete_user_from_panel(self, username: str) -> bool:
        try:
            response_status = await self.api_service.delete_user(username)
            if response_status != 200:
                logger.error(
                    f"Failed to delete client {username} from panel by admin {self.admin_username}: {response_status}"
                )
                return False

            logger.info(
                f"Client {username} deleted from panel by admin {self.admin_username}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Error deleting client {username} from panel by admin {self.admin_username}: {str(e)}"
            )
            return False

    async def reset_user_usage_in_panel(self, username: str) -> bool:
        try:
            response_status = await self.api_service.reset_user_traffic(username)
            if response_status != 200:
                logger.error(
                    f"Failed to reset usage for client {username} in panel by admin {self.admin_username}: {response_status}"
                )
                return False

            logger.info(
                f"Usage for client {username} reset in panel by admin {self.admin_username}"
            )
            return True
        except Exception as e:
            logger.error(
                f"Error resetting usage for client {username} in panel by admin {self.admin_username}: {str(e)}"
            )
            return False
