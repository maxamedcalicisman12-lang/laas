import { useApp } from '../../context/AppContext';
import SaleForm, { useSaleEdit } from '../../components/sales/SaleForm';
import { SALE_MODULES } from '../../components/sales/config';

export default function Page() {
  const config = SALE_MODULES['land-sales'];
  const { t } = useApp();
  const { id, record, submit, errors, saving } = useSaleEdit(config);

  if (!record) return <div className="text-sm text-gray-500">{t('loading')}</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('update_land_sale')}</h1>
      </div>
      <SaleForm
        config={config}
        initial={record}
        onSubmit={submit}
        errors={errors}
        saving={saving}
        cancelTo={`/${config.endpoint}/${id}`}
        submitLabel={t('update_land_sale')}
      />
    </div>
  );
}
