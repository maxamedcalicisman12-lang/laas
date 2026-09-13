import { useApp } from '../../context/AppContext';
import SaleForm, { useSaleCreate } from '../../components/sales/SaleForm';
import { SALE_MODULES } from '../../components/sales/config';

export default function Page() {
  const config = SALE_MODULES['house-sales'];
  const { t } = useApp();
  const { submit, errors, saving } = useSaleCreate(config);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('add_house_sale')}</h1>
      </div>
      <SaleForm config={config} onSubmit={submit} errors={errors} saving={saving} cancelTo={`/${config.endpoint}`} submitLabel={t('save_house_sale')} />
    </div>
  );
}
