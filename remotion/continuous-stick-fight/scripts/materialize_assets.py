"""Decode selected licensed data only; never execute downloaded/archive code."""
import base64,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]
p=root/'assets/hit/hit_knockback.npz'
data=base64.b64decode(p.with_suffix('.npz.b64').read_text().strip(),validate=True)
assert hashlib.sha256(data).hexdigest()=='e15f809f932c2a9bd23c3efb721e01fef2b5775e6e993059852fc162ab9b9eb5'
p.write_bytes(data)
print('Selected CC0 reaction materialized and hash verified')
