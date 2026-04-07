import pandas as pd
import os

BASE_DIR = r"c:\Users\sandep\Desktop\FarmVision\FarmVision"
DATA_FILE = os.path.join(BASE_DIR, "crop_production.csv")

df = pd.read_csv(DATA_FILE)
print("Unique Production Units:")
print(df["Production Units"].unique())

print("\nProduction Stats by Unit:")
print(df.groupby("Production Units")["Production"].describe())
