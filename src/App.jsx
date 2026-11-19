
import { useEffect, useMemo, useState } from "react";
import "./index.css";
import Admin from "./Admin";
const API_URL = "http://127.0.0.1:8000/api";

const products = [
  {
    id: 1,
    name: "طقم أواني الطهي الفاخر",
    category: "المطبخ",
    price: 180,
    oldPrice: 220,
    image: "https://images.unsplash.com/photo-1584990347449-a8e7c9d7f7c8?w=700",
    badge: "الأكثر مبيعاً",
  },
  {
    id: 2,
    name: "غلاية كهربائية عصرية",
    category: "الأجهزة",
    price: 95,
    oldPrice: 120,
    image: "https://images.unsplash.com/photo-1594213114663-d94db9b1714e?w=700",
    
  },
  {
    id: 3,
    name: "طقم فناجين قهوة أنيق",
    category: "الضيافة",
    price: 65,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=700",
    badge: "",
  },
  {
    id: 4,
    name: "أدوات تقديم فاخرة",
    category: "الضيافة",
    price: 75,
    oldPrice: 90,
    image: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=700",
    badge: "مميز",
  },
  {
    id: 5,
    name: "خلاط كهربائي متعدد الاستخدام",
    category: "الأجهزة",
    price: 145,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=700",
    badge: "",
  },
  {
    id: 6,
    name: "مجموعة أدوات المطبخ",
    category: "المطبخ",
    price: 55,
    oldPrice: 70,
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=700",
    badge: "",
  },
  {
    id: 7,
    name: "قطعة ديكور منزلية",
    category: "الديكور",
    price: 85,
    oldPrice: null,
    image: "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?w=700",
    badge: "",
  },
  {
    id: 8,
    name: "طقم أدوات تقديم الطعام",
    category: "المطبخ",
    price: 110,
    oldPrice: 135,
    image: "https://images.unsplash.com/photo-1603199506016-b9a594b593c0?w=700",
    badge: "الأكثر مبيعاً",
  },
];

function formatProduct(product) {
  return {
  ...product,
  price: Number(product.price),
  oldPrice: null,
};
}


const categories = ["الكل", "الطناجر وأواني الطبخ", "الصحون وأطقم التقديم", "إكسسوارات الغاز", "الأجهزة الكهربائية" , "إكسسوارات المطبخ"];


function App() {
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("almadhoun-cart")) || [];
    } catch {
      return [];
    }
  });
  const [cartOpen, setCartOpen] = useState(false);
const [category, setCategory] = useState("الكل");
const [search, setSearch] = useState("");

 
const [adminProducts, setAdminProducts] = useState(products);

  const [customerName, setCustomerName] = useState("");


useEffect(() => {
  fetch(`${API_URL}/products`)
    .then((response) => {
      if (!response.ok) {
        throw new Error("فشل تحميل المنتجات");
      }
      return response.json();
    })
    .then((data) => {
      setAdminProducts(data.map(formatProduct));
      console.log("تم تحميل المنتجات من Laravel:", data);
    })
    .catch((error) => {
      console.error("خطأ في تحميل المنتجات:", error);
    });
}, []);


const [customerPhone, setCustomerPhone] = useState("");
const [customerAddress, setCustomerAddress] = useState("");

  useEffect(() => {
    localStorage.setItem("almadhoun-cart", JSON.stringify(cart));
  }, [cart]);


const filteredProducts = useMemo(() => {
  return adminProducts.filter((product) => {
    const matchesCategory =
      category === "الكل" || product.category === category;

    const matchesSearch = product.name.includes(search);

    return matchesCategory && matchesSearch;
  });
}, [category, search, adminProducts]);
if (window.location.pathname.startsWith("/admin")) {
  return <Admin />;
}

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setCartOpen(true);
  }

  function changeQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }

  function removeItem(id) {
    setCart((current) => current.filter((item) => item.id !== id));
  }

  


async function checkout() {
  if (!cart.length) {
    alert("السلة فارغة!");
    return;
  }

  if (
    !customerName.trim() ||
    !customerPhone.trim() ||
    !customerAddress.trim()
  ) {
    alert("يرجى تعبئة جميع بيانات التوصيل");
    return;
  }

  try {
    // إرسال الطلب إلى Laravel
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        customer_name: customerName,
        customer_phone: customerPhone,
        customer_address: customerAddress,

        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message || "تعذر تسجيل الطلب"
      );
    }

    // تجهيز رسالة WhatsApp بعد نجاح حفظ الطلب
    const phone = "972595635789";

    const orderDetails = cart
      .map((item, index) => {
        return `${index + 1}- ${item.name}
الكمية: ${item.quantity}
السعر: ${item.price} شيكل`;
      })
      .join("\n\n");

    const message = `طلب جديد من متجر المدهون

رقم الطلب: ${data.order.id}

اسم العميل: ${customerName}
رقم الهاتف: ${customerPhone}
عنوان التوصيل: ${customerAddress}

المنتجات:
${orderDetails}

الإجمالي: ${data.order.total} شيكل`;

    const whatsappUrl =
      `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;

    window.location.href = whatsappUrl;

  } catch (error) {
    console.error("خطأ في تسجيل الطلب:", error);
    alert("حدث خطأ أثناء تسجيل الطلب: " + error.message);
  }
}



  return (
    <div className="store" dir="rtl">
      <div className="topbar">
        <p>أهلاً بك في متجر المدهون للأدوات المنزلية</p>
        <span>جودة تختارها.. وأناقة تستحقها</span>
      </div>

      <header className="header">
        <a href="#home" className="logo">
          <span className="logo-icon">م</span>
          <span>
            <strong>المدهون</strong>
            <small>للأدوات المنزلية</small>
          </span>
        </a>

        <nav className="navigation">
          <a href="#home">الرئيسية</a>
          <a href="#categories">الأقسام</a>
          <a href="#products">منتجاتنا</a>
          <a href="#about">من نحن</a>
        </nav>

        <div className="header-actions">
          <input
            className="search"
            type="search"
            placeholder="ابحث عن منتج..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <button className="cart-button" onClick={() => setCartOpen(true)}>
            🛒 <span>السلة</span>
            <b>{cartCount}</b>
          </button>
        </div>
      </header>

      <main>
        <section className="hero" id="home">
          <div className="hero-content">
            <span className="eyebrow">التميز يبدأ من منزلك</span>
            <h1>
              اجعل منزلك
              <br />
              <span>أكثر أناقة وجمالاً</span>
            </h1>
            <p>
              اكتشف مجموعتنا المختارة من الأدوات المنزلية
              التي تجمع بين الجودة والتصميم العصري.
            </p>
            <a href="#products" className="primary-button">
              تسوق الآن <span>←</span>
            </a>
          </div>

          <div className="hero-visual">
            <div className="hero-circle"></div>
            <img
              src="https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1000"
              alt="ديكور منزل أنيق"
            />
            <div className="hero-note">
              <strong>اختيارات مميزة</strong>
              <span>لتفاصيل منزلك الجميلة</span>
            </div>
          </div>
        </section>

        <section className="categories-section" id="categories">
          <div className="section-heading">
            <div>
              <span className="eyebrow">تسوق حسب احتياجك</span>
              <h2>تصفح أقسامنا</h2>
            </div>
          </div>

          <div className="category-list">
            {categories.map((item) => (
              <button
                key={item}
                className={category === item ? "category active" : "category"}
                onClick={() => setCategory(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="products-section" id="products">
          <div className="section-heading">
            <div>
              <span className="eyebrow">مختارة بعناية لأجلك</span>
              <h2>منتجاتنا المميزة</h2>
            </div>
            <span className="product-count">
              {filteredProducts.length} منتجات
            </span>
          </div>

          <div className="products-grid">
            {filteredProducts.map((product) => (
              <article className="product-card" key={product.id}>
                <div className="product-image">
                  
                  <img src={product.image} alt={product.name} />
                </div>

                <div className="product-info">
                  <span className="product-category">{product.category}</span>
                  <h3>{product.name}</h3>

                  <div className="price-row">
                    <strong>{product.price} ₪</strong>
                    
                  </div>

                  <button
                    className="add-button"
                    onClick={() => addToCart(product)}
                  >
                    + أضف إلى السلة
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredProducts.length === 0 && (
            <p className="empty-search">لم نعثر على منتجات مطابقة للبحث.</p>
          )}
        </section>

        <section className="about-section" id="about">
          <span className="eyebrow">المدهون للأدوات المنزلية</span>
          <h2>كل ما يحتاجه منزلك في مكان واحد</h2>
          <p>
            نختار لك منتجات تجمع بين العملية والأناقة لتجعل تفاصيل منزلك أجمل.
          </p>
        </section>
      </main>

      <footer className="footer">
        <strong>المدهون للأدوات المنزلية</strong>
        <p>الجودة والأناقة في كل تفصيل</p>
        <small>© 2026 جميع الحقوق محفوظة</small>
      </footer>

      {cartOpen && (
        <div className="cart-overlay" onClick={() => setCartOpen(false)}>
          <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="cart-heading">
              <div>
                <span className="eyebrow">تسوق براحة</span>
                <h2>سلة المشتريات ({cartCount})</h2>
              </div>
              <button
                className="close-cart"
                onClick={() => setCartOpen(false)}
                aria-label="إغلاق السلة"
              >
                ×
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="empty-cart">
                <span>🛒</span>
                <h3>سلتك فارغة حالياً</h3>
                <p>اكتشف منتجاتنا وأضف ما يناسب منزلك.</p>
                <button
                  className="primary-button"
                  onClick={() => setCartOpen(false)}
                >
                  متابعة التسوق
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img src={item.image} alt={item.name} />

                      <div className="cart-item-info">
                        <h3>{item.name}</h3>
                        <strong>{item.price} ₪</strong>

                        <div className="quantity">
                          <button onClick={() => changeQuantity(item.id, -1)}>
                            −
                          </button>
                          <span>{item.quantity}</span>
                          <button onClick={() => changeQuantity(item.id, 1)}>
                            +
                          </button>
                        </div>
                      </div>

                      <button
                        className="remove-item"
                        onClick={() => removeItem(item.id)}
                        aria-label="حذف المنتج"
                      >
                        حذف
                      </button>
                    </div>
                  ))}
                </div>

                <div className="cart-summary">

<div className="customer-form">
  <h3>بيانات التوصيل</h3>

  <input
    type="text"
    placeholder="الاسم الكامل"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
  />

  <input
    type="tel"
    placeholder="رقم الهاتف"
    value={customerPhone}
    onChange={(e) => setCustomerPhone(e.target.value)}
  />

  <textarea
    placeholder="عنوان التوصيل بالتفصيل"
    value={customerAddress}
    onChange={(e) => setCustomerAddress(e.target.value)}
    rows="3"
  />
</div>

                  <div className="total-row">
                    <span>المجموع</span>
                    <strong>{total} ₪</strong>
                  </div>
                  <p>تكلفة التوصيل تُحدد عند تأكيد الطلب.</p>
                  <button className="checkout-button" onClick={checkout}>
                    إتمام الطلب — {total} ₪
                  </button>
                  <button
                    className="continue-button"
                    onClick={() => setCartOpen(false)}
                  >
                    متابعة التسوق
                  </button>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

export default App;
