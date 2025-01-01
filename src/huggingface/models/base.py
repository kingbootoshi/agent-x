from abc import ABC, abstractmethod

class BaseModel(ABC):
    def __init__(self, model_name):
        self.model_name = model_name
        self.tokenizer = None
        self.model = None

    @abstractmethod
    def load(self):
        pass

    @abstractmethod
    def run(self, prompt):
        pass