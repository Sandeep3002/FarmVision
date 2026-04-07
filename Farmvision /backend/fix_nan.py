import psycopg2

conn = psycopg2.connect(
    host="localhost", port="5432",
    dbname="agriculture", user="postgres", password="Dad_mom24"
)
conn.autocommit = True
cur = conn.cursor()

# Fix NaN float values (IEEE 754 NaN, not SQL NULL)
cur.execute("UPDATE crop_production SET production = 0 WHERE production = 'NaN';")
print(f"Production NaN rows fixed: {cur.rowcount}")

cur.execute("UPDATE crop_production SET area = 0 WHERE area = 'NaN';")
print(f"Area NaN rows fixed: {cur.rowcount}")

cur.execute("UPDATE crop_production SET yield = 0 WHERE yield = 'NaN';")
print(f"Yield NaN rows fixed: {cur.rowcount}")

# Verify
cur.execute("SELECT SUM(production), SUM(area) FROM crop_production;")
print(f"Totals after fix: {cur.fetchall()}")

cur.close()
conn.close()
print("Done!")
