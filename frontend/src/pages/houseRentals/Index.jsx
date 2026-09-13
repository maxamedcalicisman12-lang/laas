import SaleIndex from '../../components/sales/SaleIndex';
import { SALE_MODULES } from '../../components/sales/config';

export default function Page() {
  return <SaleIndex config={SALE_MODULES['house-rentals']} />;
}
