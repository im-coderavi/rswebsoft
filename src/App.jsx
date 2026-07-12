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
import { AuthProvider } from "./context/AuthContext"
import { CartProvider } from "./context/CartContext"
import ProtectedAdminRoute from "./admin/ProtectedAdminRoute"
import AdminLayout from "./admin/layout/AdminLayout"
import Login from "./admin/pages/Login"
import Dashboard from "./admin/pages/Dashboard"
import ProductList from "./admin/pages/products/ProductList"
import ProductForm from "./admin/pages/products/ProductForm"
import CategoryList from "./admin/pages/categories/CategoryList"
import BrandList from "./admin/pages/brands/BrandList"
import OrderList from "./admin/pages/orders/OrderList"
import Settings from "./admin/pages/Settings"

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
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/order/:id" element={<OrderTrack />} />
              <Route path="/categories" element={<Placeholder title="Categories" />} />
              <Route path="/brands" element={<Brands />} />
              <Route path="/wishlist" element={<Placeholder title="Wishlist" />} />
              <Route path="/demos" element={<Placeholder title="Demo Center" />} />
              <Route path="/resources" element={<Placeholder title="Resources" />} />
              <Route path="/support" element={<Placeholder title="Support" />} />
              <Route path="*" element={<Placeholder title="Page Not Found" />} />
            </Route>

            <Route path="/admin/login" element={<Login />} />
            <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="products" element={<ProductList />} />
                <Route path="products/new" element={<ProductForm />} />
                <Route path="products/:id/edit" element={<ProductForm />} />
                <Route path="categories" element={<CategoryList />} />
                <Route path="brands" element={<BrandList />} />
                <Route path="orders" element={<OrderList />} />
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
