async def test_polish(client):
    res = await client.post("/ai/polish", json={"rawText": "fixed bug in auth"})
    assert res.status_code == 200
    assert res.json() == {"polished": "POLISHED: fixed bug in auth"}


async def test_suggest_padding(client):
    res = await client.post(
        "/ai/suggest-padding",
        json={"actualHours": 3.5, "targetHours": 6, "taskDescription": "Auth fix"},
    )
    assert res.status_code == 200
    body = res.json()
    assert body["suggestedHours"] == 6.0
    assert body["addedActivities"] == ["Code review", "Documentation"]
    assert body["rationale"]
