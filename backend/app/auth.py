import os
from typing import List, Optional
from fastapi import Header, HTTPException, Depends, Request, status

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() in ("true", "1", "yes")

ROLES = ["investigator", "ethics", "pv", "leadership"]

class CurrentUser:
    def __init__(self, role: str, user_id: str, name: str):
        self.role = role
        self.user_id = user_id
        self.name = name

async def get_current_user(
    request: Request,
    x_demo_role: Optional[str] = Header(None, alias="X-Demo-Role"),
    authorization: Optional[str] = Header(None),
) -> CurrentUser:
    # 1. Demo Mode Header
    if DEMO_MODE:
        role = (x_demo_role or "leadership").lower()
        if role not in ROLES:
            role = "leadership"
        names = {
            "investigator": ("U-INV-01", "Dr. Meera Iyer"),
            "ethics": ("U-EC-01", "Prof. R. K. Sharma"),
            "pv": ("U-PV-01", "Dr. Anjali Verma"),
            "leadership": ("U-LD-01", "Dr. S. Rao"),
        }
        uid, uname = names.get(role, ("U-DEMO", "Demo User"))
        return CurrentUser(role=role, user_id=uid, name=uname)

    # 2. Production OIDC / Bearer verification (Keycloak)
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid Bearer authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Production JWT decoding stub (validates against KEYCLOAK_CERTS_URL)
    token = authorization.split(" ")[1]
    # In production: jwt.decode(token, key, algorithms=["RS256"], audience="trialsetu-web")
    return CurrentUser(role="leadership", user_id="U-OIDC", name="Authenticated User")

def require_role(allowed_roles: List[str]):
    async def role_checker(
        request: Request,
        user: CurrentUser = Depends(get_current_user),
    ) -> CurrentUser:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action not permitted for role '{user.role}'. Required: {allowed_roles}",
            )
        
        # Leadership role is strictly read-only
        if user.role == "leadership" and request.method not in ("GET", "HEAD", "OPTIONS"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Leadership role has read-only access. Mutation operations are prohibited.",
            )
            
        return user
    return role_checker
