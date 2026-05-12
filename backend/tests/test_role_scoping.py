async def _create_project_as_admin(client) -> int:
    await client.as_user("admin", "admin1@test")
    res = await client.post("/projects", json={"name": "P", "color": "#22c55e"})
    assert res.status_code == 201
    return res.json()["id"]


async def _create_task(client, project_id: int, name: str) -> int:
    res = await client.post(
        "/tasks",
        json={
            "projectId": project_id,
            "name": name,
            "descriptionRaw": "raw",
            "actualHours": 1,
            "reportedHours": 1,
            "date": "2026-05-09",
        },
    )
    assert res.status_code == 201, res.text
    return res.json()["id"]


async def test_user_cannot_create_project(client):
    await client.as_user("user", "carol@test")
    res = await client.post("/projects", json={"name": "X", "color": "#22c55e"})
    assert res.status_code == 403


async def test_manager_cannot_create_project(client):
    await client.as_user("manager", "bob@test")
    res = await client.post("/projects", json={"name": "X", "color": "#22c55e"})
    assert res.status_code == 403


async def test_user_sees_only_own_tasks(client):
    project_id = await _create_project_as_admin(client)

    await client.as_user("user", "carol@test")
    carol_task = await _create_task(client, project_id, "carol's task")

    await client.as_user("user", "dave@test")
    dave_task = await _create_task(client, project_id, "dave's task")

    res = await client.get("/tasks")
    assert res.status_code == 200
    ids = [t["id"] for t in res.json()]
    assert dave_task in ids
    assert carol_task not in ids


async def test_admin_sees_all_tasks(client):
    project_id = await _create_project_as_admin(client)

    await client.as_user("user", "carol@test")
    carol_task = await _create_task(client, project_id, "carol's task")

    await client.as_user("admin", "alice@test")
    res = await client.get("/tasks")
    assert res.status_code == 200
    ids = [t["id"] for t in res.json()]
    assert carol_task in ids


async def test_manager_sees_all_tasks(client):
    project_id = await _create_project_as_admin(client)

    await client.as_user("user", "carol@test")
    carol_task = await _create_task(client, project_id, "carol's task")

    await client.as_user("manager", "bob@test")
    res = await client.get("/tasks")
    assert res.status_code == 200
    ids = [t["id"] for t in res.json()]
    assert carol_task in ids


async def test_user_cannot_edit_others_task(client):
    project_id = await _create_project_as_admin(client)

    await client.as_user("user", "carol@test")
    carol_task = await _create_task(client, project_id, "carol's task")

    await client.as_user("user", "dave@test")
    res = await client.patch(f"/tasks/{carol_task}", json={"status": "submitted"})
    # USER cannot see foreign tasks at all → 404
    assert res.status_code == 403 or res.status_code == 404


async def test_manager_cannot_edit_others_task(client):
    project_id = await _create_project_as_admin(client)

    await client.as_user("user", "carol@test")
    carol_task = await _create_task(client, project_id, "carol's task")

    await client.as_user("manager", "bob@test")
    res = await client.patch(f"/tasks/{carol_task}", json={"status": "submitted"})
    assert res.status_code == 403


async def test_admin_can_edit_any_task(client):
    project_id = await _create_project_as_admin(client)

    await client.as_user("user", "carol@test")
    carol_task = await _create_task(client, project_id, "carol's task")

    await client.as_user("admin", "alice@test")
    res = await client.patch(f"/tasks/{carol_task}", json={"status": "submitted"})
    assert res.status_code == 200
    assert res.json()["status"] == "submitted"
