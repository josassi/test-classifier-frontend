import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Classifier from './components/Classifier';
import CategoryMapping from './components/CategoryMapping';
import CategoriesTable from './components/CategoriesTable';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { AuthProvider } from './contexts/AuthContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { AuthGuard } from './components/AuthGuard';
import { Navbar } from './components/layout/Navbar';
import './styles/animations.css';

function Layout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fff5eb] via-white to-[#f0f7ff]">
      <Navbar />
      <main className="max-w-[2000px] mx-auto">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CategoryProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route element={<AuthGuard><Layout /></AuthGuard>}>
              <Route index element={<Classifier />} />
              <Route path="/categories/graph" element={<CategoryMapping />} />
              <Route path="/categories/table" element={<CategoriesTable />} />
              <Route path="/categories" element={<Navigate to="/categories/graph" replace />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </CategoryProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;