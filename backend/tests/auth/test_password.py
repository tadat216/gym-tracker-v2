from app.auth.password import hash_password, verify_password


def test_hash_password_returns_string():
    result = hash_password("mysecret")
    assert isinstance(result, str)
    assert result != "mysecret"


def test_verify_password_correct():
    hashed = hash_password("mysecret")
    assert verify_password("mysecret", hashed) is True


def test_verify_password_wrong():
    hashed = hash_password("mysecret")
    assert verify_password("wrongpassword", hashed) is False
