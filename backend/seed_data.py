import os
from database import SessionLocal, engine, Base
from app.models.user import User, OtpVerification
from app.models.shop import Product, CartItem, Order, OrderItem
from app.models.services import ServiceType, ServiceBooking, Complaint
from app.utils.security import get_password_hash


PRODUCTS = [
    {
        "name": "Komal Pure RO 10L",
        "description": (
            "7-stage advanced RO purification with copper-enriched mineral cartridge. "
            "Ideal for homes (up to 5 members). Removes TDS, chlorine, heavy metals & bacteria. "
            "Storage: 10 litres. Free installation in serviceable areas. 1-year comprehensive warranty."
        ),
        "price": 8499.00,
        "stock_quantity": 20,
        "image_url": "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Komal Commercial RO 50L",
        "description": (
            "High-capacity commercial RO system for offices, clinics & restaurants. "
            "50 LPH output, stainless steel frame, auto-flush & pressure pump. "
            "Handles high TDS up to 2000 ppm. 2-year motor warranty."
        ),
        "price": 24999.00,
        "stock_quantity": 5,
        "image_url": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Replacement Filter Kit",
        "description": (
            "Complete annual filter kit: sediment, pre-carbon, post-carbon & RO membrane. "
            "Compatible with most domestic RO models including Komal Pure series. "
            "Recommended change every 12 months or 6000 litres."
        ),
        "price": 1199.00,
        "stock_quantity": 50,
        "image_url": "https://images.unsplash.com/photo-1581092918056-0c4c3faabceb?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Komal UV Purifier",
        "description": (
            "UV + UF wall-mount purifier for municipal / low-TDS water. "
            "No wastage of water, retains natural minerals. "
            "6-stage purification, LED indicators, 1-year warranty. Perfect for apartments."
        ),
        "price": 4499.00,
        "stock_quantity": 15,
        "image_url": "https://images.unsplash.com/photo-1523362628745-0c100150b504?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "Komal Alkaline RO 12L",
        "description": (
            "RO + Alkaline copper boost. Raises pH to 8.0–9.0 for healthier drinking water. "
            "12L storage, smart LED display, child-lock. Free installation & demo."
        ),
        "price": 12999.00,
        "stock_quantity": 12,
        "image_url": "https://images.unsplash.com/photo-1564419320461-6870880221ad?auto=format&fit=crop&w=800&q=80",
    },
    {
        "name": "RO Service AMC (1 Year)",
        "description": (
            "Annual Maintenance Contract: 3 scheduled visits, free filter cleaning, "
            "priority breakdown support, labour included. Parts charged extra if needed."
        ),
        "price": 1999.00,
        "stock_quantity": 100,
        "image_url": "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&w=800&q=80",
    },
]


def seed_database():
    print("Generating database tables...")
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        if not db.query(User).filter(User.email == "admin@komalro.com").first():
            print("Seeding Admin user...")
            admin = User(
                full_name="Admin",
                email="admin@komalro.com",
                phone_number="9999999999",
                password_hash=get_password_hash(os.getenv("ADMIN_PASSWORD", "change-me-before-running-seed")),
                role="admin",
                is_email_verified=True,
            )
            db.add(admin)

        if db.query(Product).count() == 0:
            print("Seeding Products...")
            db.add_all([Product(**p) for p in PRODUCTS])
        else:
            print("Updating existing products (images + details)...")
            existing = db.query(Product).order_by(Product.product_id).all()
            for i, prod in enumerate(existing):
                if i < len(PRODUCTS):
                    data = PRODUCTS[i]
                    prod.name = data["name"]
                    prod.description = data["description"]
                    prod.price = data["price"]
                    prod.image_url = data["image_url"]
                    if prod.stock_quantity is None or prod.stock_quantity < 1:
                        prod.stock_quantity = data["stock_quantity"]
            if len(existing) < len(PRODUCTS):
                for data in PRODUCTS[len(existing) :]:
                    db.add(Product(**data))

        if db.query(ServiceType).count() == 0:
            print("Seeding Services...")
            services = [
                ServiceType(service_name="New RO Installation", base_charge=500.00),
                ServiceType(service_name="Regular Service & Filter Change", base_charge=350.00),
                ServiceType(service_name="Machine Repair / Breakdown", base_charge=250.00),
                ServiceType(service_name="Uninstallation", base_charge=300.00),
            ]
            db.add_all(services)

        db.commit()
        print("✅ Database tables generated and seeded successfully!")
        print("   Admin login: admin@komalro.com / password configured in ADMIN_PASSWORD")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()