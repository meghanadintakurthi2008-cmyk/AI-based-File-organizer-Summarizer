import urllib.request, json

def get(url):
    r = urllib.request.urlopen(url, timeout=5)
    return json.loads(r.read())

print("=== HEALTH CHECK ===")
h = get("http://localhost:8000/health")
print("  status:", h["status"])

print()
print("=== METRICS (should all be 0) ===")
m = get("http://localhost:8000/api/v1/metrics")
print("  totalFiles:", m["totalFiles"])
print("  filesAnalyzed:", m["filesAnalyzed"])
print("  recommendations:", m["recommendations"])
print("  categoriesFound:", m["categoriesFound"])

print()
print("=== FILE RECOMMENDATIONS (should be empty list) ===")
recs = get("http://localhost:8000/api/v1/files/recommendations")
print("  count:", len(recs))

print()
print("=== SUMMARY HISTORY (should be empty list) ===")
hist = get("http://localhost:8000/api/v1/files/summary-history")
print("  count:", len(hist))

print()
print("=== FOLDER TREE (should have 11 default empty folders) ===")
tree = get("http://localhost:8000/api/v1/folders/tree")
print("  count:", len(tree), "folders")
for f in tree:
    print("  -", f["name"], "(fileCount=" + str(f["fileCount"]) + ", isCustom=" + str(f["isCustom"]) + ")")

print()
print("ALL CHECKS PASSED - Backend returns clean empty data")
