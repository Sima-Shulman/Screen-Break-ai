@app.post("/stats")
def save_stats(stats: Stats):
    db.save(stats)
    return {"ok": True}
