from pydantic import BaseModel
from typing import Optional

class TeamBase(BaseModel):
    team_name: str