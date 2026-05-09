async def test_task_crud_and_patch(client):
    p = await client.post("/projects", json={"name": "P", "color": "#22c55e"})
    project_id = p.json()["id"]

    payload = {
        "projectId": project_id,
        "name": "Task A",
        "descriptionRaw": "did some work",
        "actualHours": 3.5,
        "reportedHours": 6,
        "date": "2026-05-09",
    }
    res = await client.post("/tasks", json=payload)
    assert res.status_code == 201
    body = res.json()
    assert body["status"] == "draft"
    assert body["projectId"] == project_id
    assert body["actualHours"] == 3.5
    task_id = body["id"]

    res = await client.get("/tasks", params={"date": "2026-05-09"})
    assert res.status_code == 200
    assert len(res.json()) == 1

    res = await client.patch(f"/tasks/{task_id}", json={"status": "submitted"})
    assert res.status_code == 200
    assert res.json()["status"] == "submitted"
