import pandas as pd
from sklearn.linear_model import LogisticRegression

df = pd.read_csv("brca1_variants.csv")

X = df[['evo2_delta_score']].values
y = (df['class'] == 'LOF').astype(int).values

clf = LogisticRegression().fit(X, y)
print("W =", clf.coef_[0][0])
print("B =", clf.intercept_[0])