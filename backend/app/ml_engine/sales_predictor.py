import pandas as pd
from sklearn.linear_model import LinearRegression
from sqlalchemy.orm import Session
from app.models.shop import Order
import warnings

warnings.filterwarnings("ignore")


def predict_next_month_sales(db: Session):
    orders = db.query(Order).filter(Order.status == "delivered").all()

    if len(orders) < 3:
        return {
            "status": "insufficient_data",
            "message": "Need at least 3 completed orders to run prediction.",
        }

    data = [{"date": o.created_at, "amount": o.total_amount} for o in orders]
    df = pd.DataFrame(data)
    df["date"] = pd.to_datetime(df["date"])

    monthly_sales = df.resample("ME", on="date")["amount"].sum().reset_index()

    if len(monthly_sales) < 2:
        return {
            "status": "insufficient_data",
            "message": "Sales data must span at least 2 months to establish a trend.",
        }

    monthly_sales["time_index"] = range(1, len(monthly_sales) + 1)
    X = monthly_sales[["time_index"]]
    y = monthly_sales["amount"]

    model = LinearRegression()
    model.fit(X, y)

    next_month_index = pd.DataFrame({"time_index": [len(monthly_sales) + 1]})
    predicted_value = float(model.predict(next_month_index)[0])
    if predicted_value < 0:
        predicted_value = 0.0

    return {
        "status": "success",
        "historical_months_analyzed": len(monthly_sales),
        "current_month_sales": round(float(monthly_sales.iloc[-1]["amount"]), 2),
        "predicted_next_month": round(predicted_value, 2),
    }
