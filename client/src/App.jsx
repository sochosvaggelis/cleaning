import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router';
import Home from './pages/Home.jsx';
import NotFound from './pages/NotFound.jsx';

const BookingStatus = lazy(() => import('./pages/BookingStatus.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/booking/:reference" element={<BookingStatus />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
