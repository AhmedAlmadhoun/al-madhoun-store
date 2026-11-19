
import { useEffect, useState } from "react";

function Admin() {
 const [products, setProducts] = useState([]);
 const [orders, setOrders] = useState([]);
 const [searchOrder, setSearchOrder] = useState("");

useEffect(() => {
  fetch("http://127.0.0.1:8000/api/products")
    .then((response) => {
      if (!response.ok) {
        throw new Error("فشل تحميل المنتجات");
      }
      return response.json();
    })
    .then((data) => {
      setProducts(data);
      console.log("تم تحميل منتجات لوحة التحكم:", data);
    })
    .catch((error) => {
      console.error("خطأ في تحميل المنتجات:", error);
    });
}, []);
useEffect(() => {
  fetch("http://127.0.0.1:8000/api/orders")
    .then((response) => {
      if (!response.ok) {
        throw new Error("فشل تحميل الطلبات");
      }

      return response.json();
    })
    .then((data) => {
      setOrders(data);
      console.log("تم تحميل الطلبات:", data);
    })
    .catch((error) => {
      console.error("خطأ في تحميل الطلبات:", error);
    });
}, []);

  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
 const [category, setCategory] = useState("الطناجر وأواني الطبخ");
  const [image, setImage] = useState("");
  const [editingId, setEditingId] = useState(null);

  function saveProducts(updatedProducts) {
  setProducts(updatedProducts);
  localStorage.setItem("all-products", JSON.stringify(updatedProducts));
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/orders/${orderId}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "فشل تحديث حالة الطلب");
    }

    setOrders((previousOrders) =>
      previousOrders.map((order) =>
        order.id === orderId
          ? { ...order, status: newStatus }
          : order
      )
    );

    alert("تم تحديث حالة الطلب بنجاح");
  } catch (error) {
    console.error("خطأ في تحديث الطلب:", error);
    alert(error.message);
  }
}



async function addProduct(e) {
  e.preventDefault();

  if (!name.trim() || !price || Number(price) <= 0) {
    alert("يرجى إدخال اسم المنتج وسعر صحيح");
    return;
  }

  try {
    const isEditing = editingId !== null;

    const currentProduct = isEditing
      ? products.find((product) => product.id === editingId)
      : null;

    const formData = new FormData();

    formData.append("name", name);
    formData.append("price", Number(price));
    formData.append("category", category);
    formData.append("stock", currentProduct?.stock ?? 0);

    if (image instanceof File) {
      formData.append("image", image);
    } else if (image) {
      formData.append("image", image);
    }

    if (isEditing) {
      formData.append("_method", "PUT");
    }

    const response = await fetch(
      isEditing
        ? `http://127.0.0.1:8000/api/products/${editingId}`
        : "http://127.0.0.1:8000/api/products",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }

    if (isEditing) {
      setProducts((currentProducts) =>
        currentProducts.map((product) =>
          product.id === editingId ? data.product : product
        )
      );

      alert("تم تعديل المنتج بنجاح");
    } else {
      setProducts((currentProducts) => [
        data.product,
        ...currentProducts,
      ]);

      alert("تمت إضافة المنتج بنجاح");
    }

    setEditingId(null);
    setName("");
    setPrice("");
    setImage("");
    setCategory("الطناجر وأواني الطبخ");

  } catch (error) {
    console.error("خطأ:", error);
    alert("حدث خطأ: " + error.message);
  }
}


function editProduct(product) {
  setEditingId(product.id);
  setName(product.name);
  setPrice(product.price);
  setCategory(product.category);
  setImage("");
}

  
async function deleteProduct(id) {
  if (!window.confirm("هل تريد حذف هذا المنتج؟")) return;

  try {
    const response = await fetch(
      `http://127.0.0.1:8000/api/products/${id}`,
      {
        method: "DELETE",
        headers: {
          Accept: "application/json",
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "فشل حذف المنتج");
    }

    setProducts((currentProducts) =>
      currentProducts.filter((product) => product.id !== id)
    );

    alert("تم حذف المنتج بنجاح");
  } catch (error) {
    console.error("خطأ في حذف المنتج:", error);
    alert("تعذر حذف المنتج: " + error.message);
  }
}


async function migrateProducts() {
  try {
    const localProducts = JSON.parse(
      localStorage.getItem("all-products") || "[]"
    );

    if (localProducts.length === 0) {
      alert("لا توجد منتجات لنقلها");
      return;
    }

    const checkResponse = await fetch(
      "http://127.0.0.1:8000/api/products"
    );

    const existingProducts = await checkResponse.json();

    if (existingProducts.length > 0) {
      alert("قاعدة البيانات تحتوي على منتجات بالفعل. لن نكرر النقل.");
      return;
    }

    for (const product of localProducts) {
      const response = await fetch(
        "http://127.0.0.1:8000/api/products",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: product.name,
            description: product.description || null,
            price: Number(product.price),
            old_price: product.oldPrice ?? product.old_price ?? null,
            category: product.category,
            image: product.image || null,
            badge: product.badge || null,
            stock: Number(product.stock || 0),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(JSON.stringify(error));
      }
    }

    alert("تم نقل جميع المنتجات بنجاح إلى قاعدة البيانات!");
  } catch (error) {
    console.error(error);
    alert("حدث خطأ أثناء النقل: " + error.message);
  }
}

  return (
    <div className="admin-page" dir="rtl">
      <header className="admin-header">
        <h1>لوحة تحكم المدهون</h1>
        <p>إدارة منتجات المتجر</p>
      </header>

      <main className="admin-content">
        <section className="admin-stats">

<main className="admin-content">
  <section className="admin-stats">

  <div className="stat-card">
    <span>إجمالي المنتجات</span>
    <strong>{products.length}</strong>
  </div>

  <div className="stat-card">
    <span>إجمالي الطلبات</span>
    <strong>{orders.length}</strong>
  </div>

  <div className="stat-card">
    <span>طلبات جديدة</span>
    <strong>
      {orders.filter(order => order.status === "new").length}
    </strong>
  </div>

  <div className="stat-card">
    <span>قيد التجهيز</span>
    <strong>
      {orders.filter(order => order.status === "processing").length}
    </strong>
  </div>

  <div className="stat-card">
    <span>طلبات مكتملة</span>
    <strong>
      {orders.filter(order => order.status === "completed").length}
    </strong>
  </div>

</section>

  <div style={{ margin: "20px 0", textAlign: "center" }}>
    <button
      type="button"
      onClick={migrateProducts}
      style={{
        background: "#166534",
        color: "white",
        padding: "12px 20px",
        borderRadius: "8px",
        cursor: "pointer",
        border: "none",
      }}
    >
      نقل المنتجات إلى قاعدة البيانات
    </button>
  </div>
  <section className="admin-section">
  <h2>طلبات العملاء</h2>
  <input
  type="text"
  placeholder="ابحث باسم العميل أو رقم الطلب أو الهاتف..."
  value={searchOrder}
  onChange={(e) => setSearchOrder(e.target.value)}
  style={{
    width: "100%",
    padding: "12px",
    margin: "15px 0",
    border: "1px solid #ddd",
    borderRadius: "8px",
    fontSize: "15px",
    boxSizing: "border-box",
  }}
/>

  {orders.length === 0 ? (
    <p>لا توجد طلبات حالياً</p>
  ) : (
    <div className="orders-list">
      {orders
  .filter((order) => {
    const search = searchOrder.trim().toLowerCase();

    return (
      String(order.id).includes(search) ||
      order.customer_name.toLowerCase().includes(search) ||
      order.customer_phone.includes(search)
    );
  })
  .map((order) => (
        <div className="order-card" key={order.id}>
          <h3>طلب رقم #{order.id}</h3>

          <p>
            <strong>اسم العميل:</strong> {order.customer_name}
          </p>

          <p>
            <strong>رقم الهاتف:</strong> {order.customer_phone}
          </p>

          <p>
            <strong>العنوان:</strong> {order.customer_address}
          </p>

          <p>
            <strong>الإجمالي:</strong> {order.total} شيكل
          </p>

          <p>
            <div style={{ margin: "12px 0" }}>
  <strong>حالة الطلب:</strong>

  <select
    value={order.status}
    onChange={(e) =>
      updateOrderStatus(order.id, e.target.value)
    }
    style={{
      marginRight: "10px",
      padding: "8px",
      borderRadius: "6px",
      border: "1px solid #ccc",
    }}
  >
    <option value="new">طلب جديد</option>
    <option value="processing">قيد التجهيز</option>
    <option value="completed">تم التسليم</option>
    <option value="cancelled">ملغي</option>
  </select>
</div>
          </p>

          <h4>المنتجات:</h4>

          {order.items.map((item) => (
            <p key={item.id}>
              {item.product_name} - الكمية: {item.quantity}
              - السعر: {item.price} شيكل
            </p>
          ))}
        </div>
            ))}
    </div>
  )}
</section>
</main>

          
          <div className="stat-card">
            <span>إجمالي المنتجات</span>
            <strong>{products.length}</strong>
          </div>
        </section>

        <section className="admin-form-section">
          <h2>إضافة منتج جديد</h2>

          <form onSubmit={addProduct}>
            <label>اسم المنتج</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: طقم أواني الطهي"
            />

            <label>السعر بالشيكل</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="أدخل السعر"
            />

            <label>القسم</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>الطناجر وأواني الطبخ</option>
              <option>الصحون وأطقم التقديم</option>
              <option>إكسسوارات الغاز</option>
              <option>الأجهزة الكهربائية</option>
              <option>إكسسوارات المطبخ </option>
            </select>

            <label>رابط صورة المنتج</label>
            <input
  type="file"
  accept="image/*"
  onChange={(e) => {
    const file = e.target.files[0];

    if (file) {
      setImage(file);
      console.log("تم اختيار الصورة:", file.name);
    }
  }}
/>

            <button type="submit">
  {editingId !== null ? "حفظ التعديلات" : "إضافة المنتج"}
</button>
{editingId !== null && (
  <button
    type="button"
    onClick={() => {
      setEditingId(null);
      setName("");
      setPrice("");
      setImage("");
      setCategory("المطبخ");
    }}
  >
    إلغاء التعديل
  </button>
)}
          </form>
        </section>

        <section className="admin-products">
          <h2>المنتجات المضافة ({products.length})</h2>

          {products.length === 0 ? (
            <p>لا توجد منتجات مضافة من لوحة التحكم حتى الآن.</p>
          ) : (
            products.map((product) => (
              <div className="admin-product" key={product.id}>
                <img src={product.image} alt={product.name} />

                <div>
                  <strong>{product.name}</strong>
                  <p>{product.price} شيكل</p>
                  <small>{product.category}</small>
                </div>

                <div className="admin-product-actions">
  <button onClick={() => editProduct(product)}>
    تعديل
  </button>

  <button onClick={() => deleteProduct(product.id)}>
    حذف
  </button>
</div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default Admin;
