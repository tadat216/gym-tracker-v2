class NotFoundError(Exception):
    def __init__(self, entity: str):
        self.entity = entity
        super().__init__(f"{entity} not found")


class DuplicateNameError(Exception):
    def __init__(self, entity: str, name: str):
        self.entity = entity
        self.name = name
        super().__init__(f"{entity} with name '{name}' already exists")


class InvalidReferenceError(Exception):
    def __init__(self, entity: str, field: str):
        self.entity = entity
        self.field = field
        super().__init__(f"Invalid {field} for {entity}")
