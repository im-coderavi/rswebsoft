import { Routes, Route } from "react-router-dom"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import PublicLayout from "./components/layout/PublicLayout"
import Home from "./pages/Home"
import ProductsListing from "./pages/ProductsListing"
import ProductDetail from "./pages/ProductDetail"
import Brands from "./pages/Brands"
import Cart from "./pages/Cart"
import Checkout from "./pages/Checkout"
import OrderTrack from "./pages/OrderTrack"
import Placeholder from "./pages/Placeholder"
import Categories from "./pages/Categories"
import Resources from "./pages/Resources"
import Support from "./pages/Support"
import Tools from "./pages/Tools"
import Demos from "./pages/Demos"
import CustomerLogin from "./pages/Login"
import Register from "./pages/Register"
import AccountOrders from "./pages/AccountOrders"
import RequireAuth from "./components/RequireAuth"
import { AuthProvider } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"
import ProtectedAdminRoute from "./admin/ProtectedAdminRoute"
import AdminLayout from "./admin/layout/AdminLayout"
import Login from "./admin/pages/Login"
import Dashboard from "./admin/pages/Dashboard"
import ProductList from "./admin/pages/products/ProductList"
import ProductForm from "./admin/pages/products/ProductForm"
import DeliveredWebsiteList from "./admin/pages/products/DeliveredWebsiteList"
import PackageList from "./admin/pages/products/PackageList"
import CategoryList from "./admin/pages/categories/CategoryList"
import HomeSectionList from "./admin/pages/sections/HomeSectionList"
import BrandList from "./admin/pages/brands/BrandList"
import OrderList from "./admin/pages/orders/OrderList"
import Settings from "./admin/pages/Settings"
import CustomerList from "./admin/pages/customers/CustomerList"
import CustomerDetail from "./admin/pages/customers/CustomerDetail"
import DemoLinkList from "./admin/pages/demos/DemoLinkList"
import SubscriberList from "./admin/pages/SubscriberList"

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <Routes>
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductsListing />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/order/:id" element={<OrderTrack />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/wishlist" element={<Placeholder title="Wishlist" />} />
              <Route path="/demos" element={<Demos />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/support" element={<Support />} />

              <Route element={<RequireAuth />}>
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account/orders" element={<AccountOrders />} />
              </Route>

              <Route path="/login" element={<CustomerLogin />} />
              <Route path="/register" element={<Register />} />
              <Route path="*" element={<Placeholder title="Page Not Found" />} />
            </Route>

            <Route path="/admin/login" element={<Login />} />
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id/edit" element={<ProductForm />} />
                <Route path="delivered-websites" element={<DeliveredWebsiteList />} />
                <Route path="packages" element={<PackageList />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="sections" element={<HomeSectionList />} />
                <Route path="brands" element={<BrandList />} />
                <Route path="orders" element={<OrderList />} />
                <Route path="customers" element={<CustomerList />} />
                <Route path="customers/:id" element={<CustomerDetail />} />
                <Route path="demo-links" element={<DemoLinkList />} />
                <Route path="subscribers" element={<SubscriberList />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Route>
          </Routes>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
