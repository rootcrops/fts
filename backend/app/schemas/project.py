from .base import CamelModel


class ProjectBase(CamelModel):
    name: str
    color: str = "#22c55e"
    client: str | None = None


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(CamelModel):
    name: str | None = None
    color: str | None = None
    client: str | None = None


class ProjectRead(ProjectBase):
    id: int
