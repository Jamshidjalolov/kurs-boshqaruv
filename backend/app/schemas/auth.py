from pydantic import BaseModel, EmailStr


class LoginInput(BaseModel):
    identifier: str
    password: str


class RegisterInput(BaseModel):
    fullName: str
    phone: str
    email: EmailStr | None = None
    password: str
    role: str


class RefreshInput(BaseModel):
    refreshToken: str


class ForgotPasswordInput(BaseModel):
    identifier: str


class ResetPasswordInput(BaseModel):
    token: str
    password: str


class UpdateOwnProfileInput(BaseModel):
    fullName: str
    phone: str
    email: EmailStr | None = None
    specialization: str | None = None
    parentName: str | None = None
    parentPhone: str | None = None
    parentTelegramHandle: str | None = None


class ChangePasswordInput(BaseModel):
    currentPassword: str
    newPassword: str


class UploadAvatarInput(BaseModel):
    fileName: str
    dataUrl: str
