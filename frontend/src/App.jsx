import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import GuestLayout from './components/layout/GuestLayout';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PropertiesIndex from './pages/properties/Index';
import PropertyTypeSelect from './pages/properties/TypeSelect';
import PropertyCreate from './pages/properties/Create';
import PropertyEdit from './pages/properties/Edit';
import PropertyShow from './pages/properties/Show';
import CustomersIndex from './pages/customers/Index';
import CustomerCreate from './pages/customers/Create';
import CustomerEdit from './pages/customers/Edit';
import CustomerShow from './pages/customers/Show';
import LandSalesIndex from './pages/landSales/Index';
import LandSaleCreate from './pages/landSales/Create';
import LandSaleEdit from './pages/landSales/Edit';
import LandSaleShow from './pages/landSales/Show';
import HouseRentalsIndex from './pages/houseRentals/Index';
import HouseRentalCreate from './pages/houseRentals/Create';
import HouseRentalEdit from './pages/houseRentals/Edit';
import HouseRentalShow from './pages/houseRentals/Show';
import HouseSalesIndex from './pages/houseSales/Index';
import HouseSaleCreate from './pages/houseSales/Create';
import HouseSaleEdit from './pages/houseSales/Edit';
import HouseSaleShow from './pages/houseSales/Show';
import UsedItemsIndex from './pages/usedItems/Index';
import UsedItemCreate from './pages/usedItems/Create';
import UsedItemShow from './pages/usedItems/Show';
import PaymentsIndex from './pages/payments/Index';
import PaymentCreate from './pages/payments/Create';
import PaymentEdit from './pages/payments/Edit';
import PaymentShow from './pages/payments/Show';
import CommissionsIndex from './pages/commissions/Index';
import CommissionShow from './pages/commissions/Show';
import CleanersIndex from './pages/cleaners/Index';
import CleanerCreate from './pages/cleaners/Create';
import CleanerEdit from './pages/cleaners/Edit';
import CleanerShow from './pages/cleaners/Show';
import UsersIndex from './pages/users/Index';
import UserCreate from './pages/users/Create';
import UserEdit from './pages/users/Edit';
import UserShow from './pages/users/Show';
import Backups from './pages/Backups';
import Notifications from './pages/Notifications';
import SearchResults from './pages/SearchResults';
import RecycleBin from './pages/RecycleBin';
import ActivityLogs from './pages/ActivityLogs';
import Settings from './pages/Settings';
import PublicListings from './pages/PublicListings';
import PublicPropertyDetail from './pages/PublicPropertyDetail';

function RequireAuth({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function GuestOnly({ children }) {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* Public (no auth) customer-facing available listings */}
      <Route path="/listings" element={<PublicListings />} />
      <Route path="/listings/:id" element={<PublicPropertyDetail />} />

      <Route
        element={
          <GuestOnly>
            <GuestLayout />
          </GuestOnly>
        }
      >
        <Route path="/login" element={<Login />} />
      </Route>

      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/properties" element={<PropertiesIndex />} />
        <Route path="/properties/create" element={<PropertyTypeSelect />} />
        <Route path="/properties/create/:type" element={<PropertyCreate />} />
        <Route path="/properties/:id" element={<PropertyShow />} />
        <Route path="/properties/:id/edit" element={<PropertyEdit />} />
        <Route path="/customers" element={<CustomersIndex />} />
        <Route path="/customers/create" element={<CustomerCreate />} />
        <Route path="/customers/:id" element={<CustomerShow />} />
        <Route path="/customers/:id/edit" element={<CustomerEdit />} />
        <Route path="/land-sales" element={<LandSalesIndex />} />
        <Route path="/land-sales/create" element={<LandSaleCreate />} />
        <Route path="/land-sales/:id" element={<LandSaleShow />} />
        <Route path="/land-sales/:id/edit" element={<LandSaleEdit />} />
        <Route path="/house-rentals" element={<HouseRentalsIndex />} />
        <Route path="/house-rentals/create" element={<HouseRentalCreate />} />
        <Route path="/house-rentals/:id" element={<HouseRentalShow />} />
        <Route path="/house-rentals/:id/edit" element={<HouseRentalEdit />} />
        <Route path="/house-sales" element={<HouseSalesIndex />} />
        <Route path="/house-sales/create" element={<HouseSaleCreate />} />
        <Route path="/house-sales/:id" element={<HouseSaleShow />} />
        <Route path="/house-sales/:id/edit" element={<HouseSaleEdit />} />
        <Route path="/used-items" element={<UsedItemsIndex />} />
        <Route path="/used-items/create" element={<UsedItemCreate />} />
        <Route path="/used-items/:id" element={<UsedItemShow />} />
        <Route path="/payments" element={<PaymentsIndex />} />
        <Route path="/payments/create" element={<PaymentCreate />} />
        <Route path="/payments/:id" element={<PaymentShow />} />
        <Route path="/payments/:id/edit" element={<PaymentEdit />} />
        <Route path="/commissions" element={<CommissionsIndex />} />
        <Route path="/commissions/:id" element={<CommissionShow />} />
        <Route path="/cleaners" element={<CleanersIndex />} />
        <Route path="/cleaners/create" element={<CleanerCreate />} />
        <Route path="/cleaners/:id" element={<CleanerShow />} />
        <Route path="/cleaners/:id/edit" element={<CleanerEdit />} />
        <Route path="/users" element={<UsersIndex />} />
        <Route path="/users/create" element={<UserCreate />} />
        <Route path="/users/:id" element={<UserShow />} />
        <Route path="/users/:id/edit" element={<UserEdit />} />
        <Route path="/backups" element={<Backups />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/search" element={<SearchResults />} />
        <Route path="/recycle-bin" element={<RecycleBin />} />
        <Route path="/activity-logs" element={<ActivityLogs />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
