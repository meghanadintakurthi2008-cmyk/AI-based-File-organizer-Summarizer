import datetime
from sqlalchemy.orm import Session
from ..models import ActivityLog


class ActivityService:
    """
    Records all user operations to the activity_logs table.
    Call log() from any router after a successful operation.
    """

    @staticmethod
    def log(
        db: Session,
        activity_type: str,
        description: str,
        file_name: str = None,
        file_id: str = None,
        folder_from: str = None,
        folder_to: str = None,
        status: str = "success",
        extra_data: dict = None
    ) -> ActivityLog:
        """Records a single activity entry and commits it immediately."""
        entry = ActivityLog(
            activity_type=activity_type,
            description=description,
            file_name=file_name,
            file_id=file_id,
            folder_from=folder_from,
            folder_to=folder_to,
            status=status,
            extra_data=extra_data or {},
            created_at=datetime.datetime.utcnow()
        )
        db.add(entry)
        db.commit()
        db.refresh(entry)
        return entry
