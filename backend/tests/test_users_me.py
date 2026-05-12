async def test_me_returns_current_user(client):
    await client.as_user("manager", "bob@test")
    res = await client.get("/users/me")
    assert res.status_code == 200
    body = res.json()
    assert body["email"] == "bob@test"
    assert body["role"] == "manager"


async def test_users_list_admin_only(client):
    await client.as_user("user", "carol@test")
    assert (await client.get("/users")).status_code == 403

    await client.as_user("admin", "alice@test")
    res = await client.get("/users")
    assert res.status_code == 200
    assert any(u["email"] == "carol@test" for u in res.json())
