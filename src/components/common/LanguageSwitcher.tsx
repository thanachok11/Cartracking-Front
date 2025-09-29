import React from 'react';
import { useI18n } from '../../i18n';
import '../../styles/components/layout/LanguageSwitcher.css';

const LanguageSwitcher: React.FC = () => {
  const { lang, setLang, available, t } = useI18n();

  return (
    <div className="lang-switcher" title={t('header.language')}>
      <select
        className="lang-select"
        value={lang}
        onChange={(e) => setLang(e.target.value as any)}
      >
        {available.map(({ code, name }) => (
          <option key={code} value={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LanguageSwitcher;
