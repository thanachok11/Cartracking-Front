import { useI18n } from '../../../i18n';

export default function ErrorBanner({ message, onRetry }: { message: string; onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <div className="error-container">
      <div className="error-message">
        <h3>⚠️ {t('common.noData')}</h3>
        <p>{message}</p>
        <button className="retry-button" onClick={onRetry}>{t('common.refresh')}</button>
      </div>
    </div>
  );
}