async def test_project_crud(client):
    res = await client.post("/projects", json={"name": "Acme", "color": "#22c55e", "client": "Acme Co"})
    assert res.status_code == 201
    body = res.json()
    assert set(body.keys()) == {"id", "name", "color", "client"}
    assert body["name"] == "Acme"

    res = await client.get("/projects")
    assert res.status_code == 200
    assert len(res.json()) == 1
