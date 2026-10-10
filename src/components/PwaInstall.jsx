import React, { useState } from 'react';
import { Modal } from './UI';
import Icon from './Icon';

export function OfflineNotice() {
  return (
    <div className="notice offline-notice" role="status">
      Hors connexion. La connexion au compte et l’enregistrement des données nécessitent Internet.
    </div>
  );
}

export default function PwaInstall({ pwa }) {
  const [help, setHelp] = useState(false);
  const isIos =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (pwa.installed) return null;
  async function install() {
    if (!pwa.canPrompt || !(await pwa.install())) setHelp(true);
  }
  return (
    <>
      <button
        type="button"
        className="button button-outline pwa-install"
        disabled={pwa.busy}
        onClick={install}
      >
        <Icon name="download" size={16} />
        {pwa.busy ? 'Installation…' : 'Installer Bakara'}
      </button>
      <Modal show={help} onClose={() => setHelp(false)} title="Bakara sur votre téléphone">
        <p className="install-intro">
          Retrouvez Bakara sur votre écran d’accueil et ouvrez-la comme une application.
        </p>
        {isIos ? (
          <ol className="install-steps">
            <li>Ouvrez ce site dans Safari.</li>
            <li>Ouvrez le menu de partage, puis choisissez « Sur l’écran d’accueil ».</li>
            <li>
              Activez « Ouvrir comme app web » si cette option apparaît, puis touchez « Ajouter ».
            </li>
          </ol>
        ) : (
          <ol className="install-steps">
            <li>Ouvrez ce site dans Chrome ou un navigateur proposant l’installation.</li>
            <li>
              Dans le menu du navigateur, choisissez « Installer l’application » ou « Ajouter à
              l’écran d’accueil ».
            </li>
            <li>Confirmez l’ajout de Bakara.</li>
          </ol>
        )}
        <p className="install-footnote">
          Les fonctions de connexion et de sauvegarde des données en ligne nécessitent une connexion
          Internet. Si le navigateur ne propose pas l’installation, utilisez Safari sur iPhone ou
          Chrome sur Android.
        </p>
        <button type="button" className="button" onClick={() => setHelp(false)}>
          Compris
        </button>
      </Modal>
    </>
  );
}
