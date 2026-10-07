// Configurazione della dashboard dei percorsi Unlike
// apiUrl vuoto = modalità prova: niente login vero, i progressi restano nel browser
// apiUrl pieno = l'indirizzo della web app di Google Apps Script (cartella backend/)
window.DASHBOARD_CONFIG = {
  apiUrl: "https://script.google.com/macros/s/AKfycbyJw8MkTh1NDvV-jAA11GLZNdukZFn9boglHkCnlVuRp6McYWflebxixXJ1lZ56qo7t/exec",
  percorsiUrl: "data/percorsi.json",
  supportoChat: "tuo gruppo Google Chat",
  // solo nella versione di prova: dove il team lascia gli appunti sulla dashboard
  appuntiUrl: "https://app.notion.com/p/dc28e7d1f82b4fb6a8a191f38e211c1f"
};
