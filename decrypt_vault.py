import os, json, base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

def _derive_key(password: str, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=600_000,
    )
    return base64.urlsafe_b64encode(kdf.derive(password.encode()))

password = "Gelatoshoppe1976!"
with open("vault.enc.salt", "rb") as f:
    salt = f.read()

key = _derive_key(password, salt)
fernet = Fernet(key)

with open("vault.enc", "rb") as f:
    encrypted = f.read()

decrypted = fernet.decrypt(encrypted)
vault_data = json.loads(decrypted.decode())

for k, v in vault_data.items():
    print(f"{k}: {v.get('value') if isinstance(v, dict) else v}")
