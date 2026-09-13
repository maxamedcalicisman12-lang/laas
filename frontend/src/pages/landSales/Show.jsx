import SaleShow from '../../components/sales/SaleShow';
import { SALE_MODULES } from '../../components/sales/config';

export default function Page() {
  return <SaleShow config={SALE_MODULES['land-sales']} />;
}
