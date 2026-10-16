/* Dashboard dei percorsi Unlike
   Legge i percorsi da data/percorsi.json e la cliente dal backend (Apps Script)
   Senza backend gira in modalità prova: i progressi restano nel browser */
(function () {
  "use strict";

  var CFG = window.DASHBOARD_CONFIG || {};
  var qs = new URLSearchParams(location.search);
  var DEMO = !CFG.apiUrl || qs.has("demo");
  var app = document.getElementById("app");
  var toastEl = document.getElementById("toast");

  var S = {
    data: null, client: null, percorso: null, progress: null, token: null,
    today: null, sched: {}, resIndex: {}, open: {}, saveTimer: null,
    pendingEvent: null, lastRoute: null,
    team: null, viewAs: null, lista: null, filtro: { q: "", p: "", st: "attive" }
  };

  var TYPE_LABEL = { "Video": "Lezione", "Attività": "Attività", "Risorsa": "Risorsa", "Meeting": "Call" };
  var TYPE_CLS = { "Video": "video", "Attività": "attivita", "Risorsa": "risorsa", "Meeting": "meeting" };
  var MESI = ["gennaio", "febbraio", "marzo", "aprile", "maggio", "giugno", "luglio", "agosto", "settembre", "ottobre", "novembre", "dicembre"];
  var GIORNI = ["domenica", "lunedì", "martedì", "mercoledì", "giovedì", "venerdì", "sabato"];

  var SVG = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  var ICON = {
    ext: '<svg ' + SVG + '><path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/></svg>',
    play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
    cal: '<svg ' + SVG + '><rect x="3.5" y="5" width="17" height="15" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    rules: '<svg ' + SVG + '><path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/></svg>',
    note: '<svg ' + SVG + '><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>',
    portal: '<svg ' + SVG + '><rect x="3.5" y="3.5" width="17" height="17" rx="3"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    eye: '<svg ' + SVG + '><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg ' + SVG + '><path d="M3 3l18 18"/><path d="M10.6 6.1A10 10 0 0 1 12 6c6.4 0 10 6 10 6a17 17 0 0 1-3.2 3.9M6.4 7.6A17 17 0 0 0 2 12s3.6 6 10 6a9.7 9.7 0 0 0 4-.9"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/></svg>'
  };

  // Link delle pagine dei tre template Notion, solo per la versione di prova
  // 15/10: esercizi e target della prova portano ai TEMPLATE DEFINITIVO nuovi (una scheda per esercizio in Risorse ed esercizi)
  var DEMO_LINKS = {
    "professionista": { portale: "f04ae28c0a7983c89cfd01d8a3413994", regole: "3f0ae28c0a798130a365c42978b51503", strategia: "075ae28c0a798259abab817a1deaa615", da_revisionare: "003ae28c0a798227972601616eff1927", piano_editoriale: "a77ae28c0a7982c7a36081d539ef2c32", visual_identity: "3f0ae28c0a7981f19228fe62ed55a849", offerta_funnel: "3f0ae28c0a79818baa12ec7d648cd931", fine_percorso: "eb0ae28c0a7983129beb81aa42ccc3fe", esercizi: "649ae28c0a798293bffa81ff7092f563", ottimizzazione_profili: "ac4ae28c0a798258aa6301549affca8c", target: "3beae28c0a7982229d210122fc04e75e", stories_telling: "3d5ae28c0a798371a93e0143a73b2741" },
    "smm": { portale: "c25ae28c0a7982bbb40d01d664d4acaa", regole: "400ae28c0a7982a5aaa4014d91bbe381", strategia: "b85ae28c0a79822b821b01cedd231aa2", da_revisionare: "037ae28c0a79822fa78a8189d21bd7b4", piano_editoriale: "d83ae28c0a798241ba2e8167b8da4c7a", kit: "3f0ae28c0a79818c859ed730d00611cd", fine_percorso: "ec6ae28c0a798327abca81e3cdf3b499", esercizi: "d59ae28c0a79824e8c54819fdcce7a3d", ottimizzazione_profili: "323ae28c0a7982d691be0117234b2de2", target: "eedae28c0a79820e8d4d81af4563ba87", stories_telling: "65aae28c0a7982f6abbb81a258ae371c" },
    "personal-brand": { portale: "96aae28c0a798276983901e497c51212", regole: "23cae28c0a7982ebad8c0199bf87e15b", strategia: "b8fae28c0a798362944d012ada05356c", da_revisionare: "ea9ae28c0a798370ab6481f9dfc9c910", piano_editoriale: "da5ae28c0a798281854e01755bf0d13d", kit: "3f0ae28c0a7981cfa15cf56f18eaeb5c", fine_percorso: "b48ae28c0a798230a84801da2e213f83", esercizi: "e83ae28c0a7982809e1b0130dbfa371f", ottimizzazione_profili: "bc6ae28c0a79837f8c4d01fe65c783b3", target: "496ae28c0a7982509dcc81cf0d0e7a78", stories_telling: "6afae28c0a7983009d94013052f62b4c" }
  };

  // ---------- utilità ----------
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function store(k, v) {
    try {
      if (arguments.length === 1) { var raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; }
      if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, JSON.stringify(v));
    } catch (e) { return null; }
    return null;
  }
  function toast(msg, ms) {
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toast.t);
    toast.t = setTimeout(function () { toastEl.classList.remove("show"); }, ms || 2600);
  }
  function parseDate(s) {
    var m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function iso(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); }
  function firstMonday(y, m) { var d = new Date(y, m, 1); d.setDate(1 + (8 - d.getDay()) % 7); return d; }
  function addDays(d, n) { var x = new Date(d.getTime()); x.setDate(x.getDate() + n); return x; }
  function startOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate()); }
  function fmt(d) { return GIORNI[d.getDay()] + " " + d.getDate() + " " + MESI[d.getMonth()]; }
  function fmtShort(d) { return d.getDate() + " " + MESI[d.getMonth()]; }
  function splitTitle(t) {
    var i = t.lastIndexOf(" a ");
    return i > 0 ? [t.slice(0, i), t.slice(i + 1)] : [t, ""];
  }
  function cleanName(n) { return String(n || "").replace(/^Lezione · /, ""); }
  // l'ultima parola diventa la parola perno (Playfair corsivo fucsia): il testo non cambia
  function accent(t) {
    t = String(t || "");
    var i = t.lastIndexOf(" ");
    return i > 0 ? esc(t.slice(0, i + 1)) + "<em>" + esc(t.slice(i + 1)) + "</em>" : "<em>" + esc(t) + "</em>";
  }

  // ---------- dati ----------
  function loadPercorsi() {
    return fetch(CFG.percorsiUrl || "data/percorsi.json", { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error("percorsi");
      return r.json();
    });
  }

  var api = DEMO ? demoApi() : realApi();

  function realApi() {
    // Apps Script a volte resta appeso 30 secondi e poi fallisce: dopo 12 secondi si lascia perdere e si riprova
    function call(action, payload, keepalive, tentativo) {
      tentativo = tentativo || 1;
      var ctrl = !keepalive && window.AbortController ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, /^(me|admin_|team_login)/.test(action) ? 25000 : 12000) : null;
      return fetch(CFG.apiUrl, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(Object.assign({ action: action }, payload || {})),
        keepalive: !!keepalive,
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) { return r.json(); }).then(function (j) {
        clearTimeout(timer);
        if (!j || !j.ok) { var e = new Error((j && j.error) || "errore"); e.code = j && j.code; e.server = true; throw e; }
        return j;
      }, function (err) {
        clearTimeout(timer);
        if (!keepalive && tentativo < 4) return call(action, payload, keepalive, tentativo + 1);
        throw err;
      });
    }
    return {
      login: function (email) { return call("login", { email: email, url: location.origin + location.pathname }); },
      me: function (token) { return call("me", { token: token }); },
      save: function (token, progress, summary, keepalive) { return call("save", { token: token, progress: progress, summary: summary }, keepalive); },
      teamLogin: function (email, password) { return call("team_login", { email: email, password: password }); },
      adminLista: function (token, fresh) { return call("admin_lista", { token: token, fresh: !!fresh }); },
      adminCliente: function (token, email) { return call("admin_cliente", { token: token, email: email }); }
    };
  }

  function demoApi() {
    return {
      login: function () { return Promise.resolve({ ok: true }); },
      me: function (token) {
        var p = String(token).replace(/^demo:/, "");
        if (!S.data.percorsi[p]) return Promise.reject(new Error("demo"));
        return Promise.resolve({ ok: true, client: demoClient(p), progress: store("dp_demo_" + p) || {} });
      },
      save: function (token, progress) {
        store("dp_demo_" + String(token).replace(/^demo:/, ""), progress);
        return Promise.resolve({ ok: true });
      }
    };
  }

  function demoClient(p) {
    var t = S.today;
    var start = firstMonday(t.getFullYear(), t.getMonth());
    if (start > t) start = firstMonday(t.getFullYear(), t.getMonth() - 1);
    var links = {}, ids = DEMO_LINKS[p] || {};
    Object.keys(ids).forEach(function (k) { links[k] = "https://app.notion.com/p/" + ids[k]; });
    return { cliente: "Alex di prova", nome: "Alex", email: "prova@unlikeacademy.it", percorso: p, data_inizio: iso(start), tappe_gia_fatte: [], link: links, demo: true };
  }

  function normalizeProgress(p) {
    p = p || {};
    return { done: p.done || {}, fb: p.fb || {}, notes: p.notes || {}, attivazione: p.attivazione || null, benvenuto: p.benvenuto || null, v: 1 };
  }

  // Le modifiche fatte per lei su Notion («Modifiche al percorso, per cliente»): aggiungi o togli
  var TIPO_MOD = { "Lezione": "Video", "Attività": "Attività", "Risorsa": "Risorsa", "Call": "Meeting" };
  function chiaveNome(n) { return cleanName(n).replace(/\s*\(\d+['’]\)\s*$/, "").trim().toLowerCase(); }
  function applyModifiche(p, mods) {
    (mods || []).forEach(function (x) {
      var dove = x.tappa ? p.modules.filter(function (m) { return m.id === x.tappa; }) : p.modules;
      if (x.azione === "Togli") {
        var k = chiaveNome(x.nome);
        dove.forEach(function (m) { m.resources = m.resources.filter(function (r) { return chiaveNome(r.name) !== k; }); });
        // tolta la call con Mickel: sparisce anche la frase che la annuncia nell'introduzione della tappa
        if (k.indexOf("mickel") >= 0) p.modules.forEach(function (m) {
          (m.callouts || []).forEach(function (c) { c.body = String(c.body || "").replace(/Settimana 1 call di editing con Mickel( · )?/g, ""); });
        });
      } else if (x.azione === "Già fatta") {
        // 16/10: una voce che la cliente ha già fatto prima di entrare (per esempio la prima call con Gemma) arriva già spuntata
        var kf = chiaveNome(x.nome);
        dove.forEach(function (m) { m.resources.forEach(function (r) { if (chiaveNome(r.name) === kf) (p._giaFatte = p._giaFatte || []).push(r.key); }); });
      } else if (x.azione === "Aggiungi" && x.tappa && dove.length) {
        var tipo = TIPO_MOD[x.tipo] || "Attività";
        var r = {
          key: "m_" + x.id, name: tipo === "Video" ? "Lezione · " + x.nome : x.nome, type: tipo, feedback: true,
          callout: x.descrizione ? { icon: "✨", body: esc(x.descrizione).replace(/\n/g, "<br>") } : null,
          actions: x.link ? [{ cls: "navy", ico: tipo === "Video" ? "play" : (tipo === "Meeting" ? "cal" : "ext"), label: tipo === "Video" ? "Vai alla lezione" : (tipo === "Meeting" ? "Prenota la call" : "Apri"), url: x.link }] : []
        };
        if (x.facoltativa) r.facoltativa = true;
        dove[0].resources.push(r);
      }
    });
  }

  function prepare() {
    var base = S.data.percorsi[S.client.percorso];
    if (!base) throw new Error("percorso");
    S.percorso = JSON.parse(JSON.stringify(base));
    applyModifiche(S.percorso, S.client.modifiche);
    S.progress = normalizeProgress(S.progress);
    (S.percorso._giaFatte || []).forEach(function (k) { if (!S.progress.done[k]) S.progress.done[k] = "già fatta"; });
    S.resIndex = {};
    S.percorso.modules.forEach(function (m) {
      m.resources.forEach(function (r) { S.resIndex[r.key] = { r: r, m: m }; });
    });
    S.sched = schedule();
    document.title = S.percorso.nome + " · Unlike Academy";
  }

  // Le tappe seguono le date: la prima parte dalla data di inizio, le altre il primo lunedì di ogni mese
  function schedule() {
    var c = S.client, mods = S.percorso.modules, sch = {};
    var gia = c.tappe_gia_fatte || [];
    var start = parseDate(c.data_inizio) || S.today;
    var y = start.getFullYear(), mo = start.getMonth(), i = 0, first = null, last = null;
    mods.forEach(function (m) {
      if (!m.mese) return;
      if (gia.indexOf(m.id) >= 0) { sch[m.id] = { prima: true }; return; }
      var opens = i === 0 ? start : firstMonday(y, mo + i);
      sch[m.id] = { opens: opens, closes: firstMonday(y, mo + i + 1) };
      if (!first) first = sch[m.id];
      last = sch[m.id];
      i++;
    });
    sch.start = { opens: null, closes: first ? first.opens : null };
    sch.fine = { opens: last ? addDays(last.opens, 21) : null };
    // feste del team: dalla data di inizio della chiusura in poi tutte le date slittano dei giorni di chiusura
    chiusure().forEach(function (ch) {
      if (ch.dal < start) return;
      Object.keys(sch).forEach(function (k) {
        if (sch[k].opens && sch[k].opens >= ch.dal) sch[k].opens = addDays(sch[k].opens, ch.giorni);
        if (sch[k].closes && sch[k].closes >= ch.dal) sch[k].closes = addDays(sch[k].closes, ch.giorni);
      });
    });
    // pausa: tutte le date dall'inizio della pausa in poi slittano degli stessi giorni
    var pz = pausa();
    if (pz) {
      var sposta = function (d) { return d && d >= pz.dal ? addDays(d, pz.giorni) : d; };
      Object.keys(sch).forEach(function (k) { if (sch[k].opens) sch[k].opens = sposta(sch[k].opens); if (sch[k].closes) sch[k].closes = sposta(sch[k].closes); });
    }
    return sch;
  }

  function pausa() {
    var p = S.client.pausa, dal = p && parseDate(p.dal), al = p && parseDate(p.al);
    if (!dal || !al || al < dal) return null;
    return { dal: dal, al: al, giorni: Math.round((al - dal) / 864e5) + 1, adesso: S.today >= dal && S.today <= al };
  }
  function chiusure() {
    return (S.data.chiusure || []).map(function (c) {
      var dal = parseDate(c.dal), al = parseDate(c.al);
      return dal && al && al >= dal ? { nome: c.nome, dal: dal, al: al, giorni: Math.round((al - dal) / 864e5) + 1 } : null;
    }).filter(Boolean).sort(function (a, b) { return a.dal - b.dal; });
  }
  function chiusuraNote() {
    var ch = chiusure().filter(function (c) { return S.today >= addDays(c.dal, -14) && S.today <= c.al; })[0];
    if (!ch) return "";
    var ora = S.today >= ch.dal, natale = /natale/i.test(ch.nome || ""), ico = natale ? "🎄" : "🌴", per = natale ? "per le feste" : "per la pausa estiva";
    return '<p class="lock-note pause-note">' + ico + " " + (ora ? "Ci stiamo prendendo una pausa " + per + " fino a " + fmt(ch.al) : "Dal " + fmtShort(ch.dal) + " al " + fmtShort(ch.al) + " ci prendiamo una pausa " + per) + " · le date delle tue tappe sono già spostate degli stessi giorni, così non perdi niente</p>";
  }
  function pausaNote() {
    var pz = pausa();
    return pz && pz.adesso ? '<p class="lock-note pause-note">⏸ Il tuo percorso è in pausa fino a ' + fmt(pz.al) + ' · le date delle tappe si sono spostate degli stessi giorni · in chat puoi scriverci per le domande</p>' : "";
  }
  function modById(id) { return S.percorso.modules.filter(function (m) { return m.id === id; })[0] || null; }
  function required(m) { return m.resources.filter(function (r) { return !r.facoltativa; }); }
  function counts(m) {
    var req = required(m), sc = S.sched[m.id] || {};
    if (sc.prima) return { done: req.length, total: req.length };
    return { done: req.filter(function (r) { return S.progress.done[r.key]; }).length, total: req.length };
  }
  function state(m) {
    var sc = S.sched[m.id] || {}, c = counts(m), complete = c.total > 0 && c.done >= c.total;
    if (sc.prima) return { key: "prima", label: "Fatta nel percorso un mese" };
    if (complete) return { key: "fatta", label: "Fatta" };
    if (sc.opens && S.today < sc.opens) return { key: "futura", label: "Si apre " + fmt(sc.opens), locked: true };
    if (m.id === "start") return { key: "in_corso", label: sc.closes && S.today >= sc.closes ? "Da finire" : "Da fare adesso" };
    if (sc.closes && S.today >= sc.closes) return { key: "chiusa", label: "Chiusa" };
    return { key: "in_corso", label: "In corso" };
  }
  function currentModule() {
    var mods = S.percorso.modules, st0 = state(mods[0]);
    if (st0.key !== "fatta") return mods[0];
    var dated = mods.filter(function (m) {
      var sc = S.sched[m.id] || {};
      return m.mese && sc.opens && S.today >= sc.opens && (!sc.closes || S.today < sc.closes);
    })[0];
    var fine = modById("fine");
    if (fine && S.sched.fine.opens && S.today >= S.sched.fine.opens && !dated) return fine;
    if (dated) return dated;
    return mods.filter(function (m) { return state(m).key === "futura"; })[0] || mods[mods.length - 1];
  }
  function totals() {
    var d = 0, t = 0;
    S.percorso.modules.forEach(function (m) {
      if ((S.sched[m.id] || {}).prima) return;
      var c = counts(m); d += c.done; t += c.total;
    });
    return { done: d, total: t, pct: t ? Math.round(d * 100 / t) : 0 };
  }
  function tappaLabel(m) {
    if (m.id === "start") return "Attivazione";
    if (m.id === "fine") return "Fine percorso";
    return "Tappa " + m.mese;
  }
  function gateMissing(r) {
    return (r.gate || []).filter(function (k) { return !S.progress.done[k]; }).map(function (k) {
      var x = S.resIndex[k];
      return x ? cleanName(x.r.name) : k;
    });
  }

  // I link tra doppie graffe arrivano dalla cliente o da link_fissi · se mancano il bottone resta "in arrivo"
  function linkValue(k) {
    var v = (S.client.link || {})[k];
    if (v == null || v === "") v = (S.data.link_fissi || {})[k];
    if (!v || /^DA DARE/i.test(v) || v.charAt(0) === "<") return null;
    return v;
  }
  function resolve(url) {
    if (!url) return null;
    var missing = false;
    var out = String(url).replace(/\{\{(\w+)\}\}/g, function (_, k) {
      var v = linkValue(k);
      if (!v) { missing = true; return ""; }
      return v;
    });
    return missing ? null : out;
  }

  // ---------- pezzi di pagina ----------
  function demoBanner() {
    return DEMO ? '<div class="demo-banner"><span class="demo-tag">Versione di prova</span><span class="sep" aria-hidden="true"> · </span><span>i progressi restano in questo browser</span><span class="sep" aria-hidden="true"> · </span><a href="#" data-act="logout">cambia percorso</a>' +
      (CFG.appuntiUrl ? '<span class="sep" aria-hidden="true"> · </span><a href="' + esc(CFG.appuntiUrl) + '" target="_blank" rel="noopener">lascia un appunto</a>' : "") + '</div>' : "";
  }

  function topBar() {
    var portal = linkValue("portale");
    return '<header class="top"><div class="top-in">' +
      '<a class="brand" href="#/"><img src="assets/logo-unlike-academy.webp" alt="Unlike Academy" width="768" height="158"><span>Il tuo percorso</span></a>' +
      '<nav class="top-nav" aria-label="Menu">' +
      '<a class="chip is-rules" href="#/regole">' + ICON.rules + '<span>Regole</span></a>' +
      '<a class="chip" href="#/note" aria-label="Le tue note">' + ICON.note + '<span class="t-long">Note</span></a>' +
      (portal ? '<a class="chip" href="' + esc(portal) + '" target="_blank" rel="noopener" aria-label="Il tuo portale Notion">' + ICON.portal + '<span class="t-long">Notion</span></a>' : "") +
      '</nav></div></header>';
  }

  function foot() {
    return '<footer class="foot">Unlike Academy · per le domande scrivi nel ' + esc(CFG.supportoChat || "tuo gruppo chat") +
      ' · <button type="button" data-act="logout">Esci</button></footer>';
  }

  function progressBlock(done, total, big) {
    var pct = total ? Math.round(done * 100 / total) : 0;
    return '<div class="progress"><div class="progress-top">' +
      (big ? '<span><b>' + pct + '%</b> del percorso</span><span>' + done + ' di ' + total + ' fatte</span>'
           : '<span><b>' + done + '</b> di ' + total + ' fatte</span><span>' + pct + '%</span>') +
      '</div><div class="bar"><i style="width:' + pct + '%"></i></div></div>';
  }

  function modCard(m) {
    var st = state(m), c = counts(m), pct = c.total ? Math.round(c.done * 100 / c.total) : 0;
    return '<a class="mod-card st-' + st.key + '" href="#/tappa/' + esc(m.id) + '">' +
      '<span class="mod-label">' + esc(m.label) + '</span>' +
      '<div class="mod-main"><span class="badge">' + esc(st.label) + '</span><h3>' + esc(m.title) + '</h3>' +
      '<span class="mod-count">' + c.done + ' di ' + c.total + ' fatte</span><div class="bar small"><i style="width:' + pct + '%"></i></div></div>' +
      '<span class="chev" aria-hidden="true">›</span></a>';
  }

  function calloutHTML(c) {
    var style = c.style === "arrow" ? "arrow" : (c.style === "info" ? "info" : "");
    return '<div class="callout ' + style + '"><span class="callout-ico" aria-hidden="true">' + esc(c.icon || "") + '</span>' +
      '<div class="callout-body">' + (c.body || "") + '</div></div>';
  }

  function actionsHTML(actions, locked) {
    if (!actions || !actions.length) return "";
    return '<div class="res-actions">' + actions.map(function (a) {
      var u = resolve(a.url), cls = a.cls === "gold" ? "btn-accent" : "btn-dark", ico = ICON[a.ico] || ICON.ext;
      if (locked) return '<span class="btn" aria-disabled="true">' + ico + esc(a.label) + '</span>';
      if (!u) return '<span class="btn" aria-disabled="true">' + ico + esc(a.label) + ' · in arrivo</span>';
      return '<a class="btn ' + cls + '" href="' + esc(u) + '" target="_blank" rel="noopener">' + ico + esc(a.label) + '</a>';
    }).join("") + '</div>';
  }

  function meetingActions(r, locked) {
    if (r.prenota === "elena") {
      return /prenota Elena/i.test((r.callout && r.callout.body) || "") ? "" : '<p class="elena-note">La prenota Elena per te: trovi data e ora nel tuo gruppo chat</p>';
    }
    var miss = gateMissing(r);
    if (!locked && miss.length) {
      return '<div class="res-actions">' + (r.actions || []).map(function (a) {
        return '<span class="btn" aria-disabled="true">' + ICON.cal + esc(a.label) + '</span>';
      }).join("") + '</div>' +
        '<p class="gate-note">Il bottone si accende quando hai fatto: <b>' + miss.map(esc).join("</b>, <b>") + '</b></p>';
    }
    return actionsHTML(r.actions, locked);
  }

  function resBody(r, locked) {
    var h = "";
    if (r.callout && r.callout.body) h += '<div class="res-text">' + r.callout.body + '</div>';
    h += r.type === "Meeting" ? meetingActions(r, locked) : actionsHTML(r.actions, locked);
    if (r.feedback && !locked) {
      var id = "fb-" + r.key;
      h += '<div class="fb"><label for="' + esc(id) + '">Il tuo feedback su questa parte (facoltativo)</label>' +
        '<textarea id="' + esc(id) + '" rows="3" data-act="fb" data-key="' + esc(r.key) + '" placeholder="Cosa ti è servito, cosa non ti torna">' + esc(S.progress.fb[r.key] || "") + '</textarea>' +
        '<span class="saved" data-saved="' + esc(id) + '"></span></div>';
    }
    return h;
  }

  function resHTML(r, locked) {
    var done = !!S.progress.done[r.key], open = !!S.open[r.key], name = cleanName(r.name), meta = [];
    if (r.type === "Meeting") { if (r.chi) meta.push("con " + esc(r.chi)); if (r.durata) meta.push(esc(r.durata)); }
    if (r.facoltativa) meta.push('<span class="opt">facoltativa</span>');
    return '<li class="res t-' + (TYPE_CLS[r.type] || "risorsa") + (done ? " is-done" : "") + (open ? " is-open" : "") + '" data-res="' + esc(r.key) + '">' +
      '<div class="res-row">' +
      '<button class="chk" type="button" role="checkbox" aria-checked="' + done + '" aria-label="Fatto: ' + esc(name) + '" data-act="done" data-key="' + esc(r.key) + '"' + (locked ? " disabled" : "") + '><i>' + ICON.check + '</i></button>' +
      '<button class="res-title" type="button" aria-expanded="' + open + '" data-act="toggle" data-key="' + esc(r.key) + '">' +
      '<span class="res-texts"><span class="res-type">' + esc(TYPE_LABEL[r.type] || r.type) + '</span><span class="res-name">' + esc(name) + '</span>' +
      (meta.length ? '<span class="res-meta">' + meta.join(" · ") + '</span>' : "") + '</span>' +
      '<span class="chev" aria-hidden="true">›</span></button>' +
      '</div>' +
      '<div class="res-body"' + (open ? "" : " hidden") + '>' + resBody(r, locked) + '</div></li>';
  }

  function noteBox(m) {
    var id = "note-" + m.id;
    return '<div class="note-box"><label for="' + esc(id) + '">Le tue note · ' + esc(m.title) + '</label>' +
      '<textarea id="' + esc(id) + '" data-act="note" data-mod="' + esc(m.id) + '" placeholder="Appunti, idee, cose da chiedere in call">' + esc(S.progress.notes[m.id] || "") + '</textarea>' +
      '<span class="saved" data-saved="' + esc(id) + '"></span></div>';
  }

  function datesLine(m, sc) {
    if (m.id === "start") {
      if (!sc.closes) return "";
      return S.today < sc.closes ? '<p class="mod-dates">Prima della tappa 1, che parte ' + fmt(sc.closes) + '</p>'
        : '<p class="mod-dates">La tappa 1 è partita ' + fmt(sc.closes) + ': chiudi questi passaggi appena puoi</p>';
    }
    if (m.id === "fine") return sc.opens ? '<p class="mod-dates">Si apre ' + fmt(sc.opens) + '</p>' : "";
    if (sc.prima) return "";
    if (sc.opens && sc.closes) return '<p class="mod-dates">Da ' + fmt(sc.opens) + ' a ' + fmt(addDays(sc.closes, -1)) + '</p>';
    return "";
  }

  // Il video di benvenuto (Loom): compare appena si apre la dashboard e sparisce per sempre quando la cliente clicca «Ho guardato il video»
  // si salva nel progresso (progress.benvenuto) · la vista del team non lo mostra · con ?video=1 si rivede a scopo di prova, senza salvare
  var VIDEO_BENVENUTO = "https://www.loom.com/embed/f221ec4afe46496ca4f32fae54512da9";
  function videoBenvenuto() {
    if (S.viewAs || S.videoVisto) return "";
    if (S.progress.benvenuto && !qs.has("video")) return "";
    return '<section class="welcome" aria-labelledby="wlc-t">' +
      '<div class="welcome-txt"><small>Prima cosa da fare</small>' +
      '<h2 id="wlc-t">Guarda il video di <em>benvenuto</em></h2>' +
      '<p>Ti fa vedere come muoverti qui dentro e da dove partire</p></div>' +
      '<div class="video"><iframe src="' + VIDEO_BENVENUTO + '" title="Video di benvenuto" frameborder="0" allow="fullscreen; picture-in-picture" allowfullscreen webkitallowfullscreen mozallowfullscreen></iframe></div>' +
      '<button class="btn btn-accent" type="button" data-act="guardato">' + ICON.check + 'Ho guardato il video</button>' +
      '</section>';
  }
  function videoGuardato() {
    if (S.viewAs) return;
    S.videoVisto = true;
    if (!qs.has("video")) { S.progress.benvenuto = new Date().toISOString(); queueSave(); }
    render();
  }

  // ---------- pagine ----------
  function viewHome() {
    var p = S.percorso, tot = totals(), cur = currentModule(), stc = state(cur), parts = splitTitle(p.nome);
    var nome = S.client.nome || String(S.client.cliente || "").split(" ")[0];
    var start = parseDate(S.client.data_inizio);
    return topBar() + '<main class="wrap">' +
      '<section class="hero">' +
      '<p class="path-sub path-tag">' + esc(p.tipologia) + ' · ' + esc(p.mesi) + ' mesi' + (start ? ' · dal ' + fmtShort(start) : "") + '</p>' +
      '<p class="kicker">Ciao' + (nome ? " " + esc(nome) : "") + ' 👋🏻</p>' +
      '<h1 class="path-title">' + (parts[1] ? '<span class="da">' + esc(parts[0]) + '</span> <span class="a">' + accent(parts[1]) + '</span>' : '<span class="da">' + accent(parts[0]) + '</span>') + '</h1>' +
      videoBenvenuto() + pausaNote() + chiusuraNote() +
      progressBlock(tot.done, tot.total, true) +
      '<a class="now' + (stc.key === "futura" ? " is-next" : "") + '" href="#/tappa/' + esc(cur.id) + '"><span class="now-dot"></span><span><small>' + (stc.key === "futura" ? "Prossima tappa · " + esc(stc.label.toLowerCase()) : "Adesso") + '</small>' +
      '<strong>' + esc(cur.title) + '</strong></span><span class="chev" aria-hidden="true">›</span></a>' +
      '</section>' +
      '<h2 class="sec-title">Le tappe del tuo percorso</h2>' +
      '<div class="mods">' + p.modules.map(modCard).join("") + '</div>' +
      foot() + '</main>';
  }

  function viewModule(id) {
    var m = modById(id);
    if (!m) return viewHome();
    var st = state(m), c = counts(m), sc = S.sched[m.id] || {}, locked = !!st.locked || !!sc.prima;
    var next = m.nextId ? modById(m.nextId) : null;
    var nascosta = !!st.locked && !DEMO && !S.viewAs;
    return topBar() + '<main class="wrap">' +
      '<a class="back" href="#/">‹ Tutte le tappe</a>' +
      '<header class="mod-head st-' + st.key + '"><span class="mod-label">' + esc(m.label) + '</span><div>' +
      '<span class="badge">' + esc(st.label) + '</span><h1>' + esc(m.title) + '</h1>' + datesLine(m, sc) + '</div></header>' +
      (nascosta ? nascostaHTML(m, sc) : (m.callouts || []).map(calloutHTML).join("")) +
      (st.locked && !nascosta ? '<p class="lock-note">Si apre ' + fmt(sc.opens) + ': intanto puoi vedere cosa ti aspetta</p>' : "") +
      (sc.prima ? '<p class="lock-note">Questa tappa l’hai già fatta nel percorso un mese</p>' : "") +
      (nascosta ? "" : progressBlock(c.done, c.total, false) +
      '<ul class="res-list' + (locked ? " is-locked" : "") + '">' + m.resources.map(function (r) { return resHTML(r, locked); }).join("") + '</ul>') +
      (locked ? "" : noteBox(m)) +
      (next ? '<div class="next-mod"><a class="btn btn-ghost" href="#/tappa/' + esc(next.id) + '">' + esc(next.title) + ' ›</a></div>' : "") +
      foot() + '</main>';
  }

  // tappa non ancora aperta, vista da una cliente: solo la data e quanti passaggi ci sono
  function nascostaHTML(m, sc) {
    var req = required(m), n = function (t) { return req.filter(function (r) { return r.type === t; }).length; };
    var parti = [];
    if (n("Video")) parti.push(n("Video") + (n("Video") === 1 ? " lezione" : " lezioni"));
    if (n("Attività")) parti.push(n("Attività") + (n("Attività") === 1 ? " attività" : " attività"));
    if (n("Meeting")) parti.push(n("Meeting") + (n("Meeting") === 1 ? " call" : " call"));
    return '<p class="lock-note">Si apre ' + fmt(sc.opens) + (parti.length ? ' · dentro ci sono ' + parti.join(", ").replace(/, ([^,]*)$/, " e $1") : "") + '</p>' +
      '<p class="path-sub">Intanto concentrati sulla tappa in corso: i contenuti di questa compaiono qui quando si apre</p>';
  }

  function viewRules() {
    var rr = S.resIndex["r0_regole"], body = rr && rr.r.callout ? rr.r.callout.body : "", link = linkValue("regole");
    return topBar() + '<main class="wrap"><a class="back" href="#/">‹ Il tuo percorso</a>' +
      '<h1 class="page-title">Le <em>regole</em> del percorso</h1>' +
      '<div class="rules">' + body + '</div>' +
      (link ? '<div class="res-actions" style="margin-top:14px"><a class="btn btn-dark" href="' + esc(link) + '" target="_blank" rel="noopener">' + ICON.ext + 'Apri le regole complete su Notion</a></div>' : "") +
      foot() + '</main>';
  }

  function viewNotes() {
    if (S.viewAs) return viewNotesTeam();
    var mods = S.percorso.modules.filter(function (m) { var st = state(m); return !st.locked && st.key !== "prima"; });
    return topBar() + '<main class="wrap"><a class="back" href="#/">‹ Il tuo percorso</a>' +
      '<h1 class="page-title">Le tue <em>note</em></h1>' +
      '<p class="path-sub">Si salvano da sole · le vede anche il team, così ti aiutiamo meglio</p>' +
      '<div class="notes-list">' + mods.map(noteBox).join("") + '</div>' + foot() + '</main>';
  }

  function viewLogin(msg) {
    var demo = "";
    if (DEMO && S.data) {
      demo = '<div class="demo-box"><h2>Versione di prova</h2><p>Apri uno dei tre percorsi: i progressi restano in questo browser</p><div class="demo-btns">' +
        Object.keys(S.data.percorsi).map(function (k) {
          var p = S.data.percorsi[k];
          return '<button class="btn btn-ghost" type="button" data-act="demo" data-p="' + esc(k) + '">' + esc(p.tipologia) + ' · ' + esc(p.mesi) + ' mesi</button>';
        }).join("") + '</div></div>';
    }
    return '<main class="login"><div class="login-card">' +
      '<img src="assets/logo-unlike-academy.webp" alt="Unlike Academy" width="768" height="158">' +
      '<h1>Il tuo <em>percorso</em> Unlike</h1>' +
      '<p>Scrivi la tua email, la stessa dell’iscrizione: ti mandiamo il link per entrare</p>' +
      '<form data-act="login" novalidate><div class="field"><label for="em">Email</label>' +
      '<input id="em" name="email" type="email" autocomplete="username email" inputmode="email" required placeholder="nome@email.it"></div>' +
      '<div class="field" id="pwf" hidden><label for="pw">Password del team</label>' +
      '<div class="pw-wrap"><input id="pw" name="password" type="password" autocomplete="current-password" placeholder="Password" autocapitalize="none" autocorrect="off" spellcheck="false">' +
      '<button class="pw-eye" type="button" data-act="occhio" aria-label="Mostra la password" aria-pressed="false">' + ICON.eye + '</button></div>' +
      '<p class="pw-hint">Lasciala vuota per ricevere il link via email</p></div>' +
      '<button class="btn btn-accent" type="submit">Mandami il link</button></form>' +
      (msg ? '<p class="msg ' + esc(msg.type) + '">' + esc(msg.text) + '</p>' : "") +
      demo + '</div></main>';
  }

  // ---------- disegno ----------
  function route() { return location.hash || "#/"; }

  function render() {
    if (S.team && (!S.viewAs || route().indexOf("#/team") === 0)) {
      S.viewAs = null; S.client = null; vaStore(null);
      app.innerHTML = viewTeam();
      renderTeamRows();
      return;
    }
    if (!S.client) return;
    var h = route(), m = /^#\/tappa\/([\w-]+)/.exec(h), html;
    if (m) html = viewModule(m[1]);
    else if (h.indexOf("#/regole") === 0) html = viewRules();
    else if (h.indexOf("#/note") === 0) html = viewNotes();
    else html = viewHome();
    app.innerHTML = teamBanner() + demoBanner() + html;
    if (S.viewAs) Array.prototype.forEach.call(app.querySelectorAll("textarea"), function (t) { t.readOnly = true; });
    if (S.lastRoute !== h) { window.scrollTo(0, 0); S.lastRoute = h; }
  }

  function renderLogin(msg) {
    S.client = null;
    app.innerHTML = viewLogin(msg);
    setTimeout(aggiornaLogin, 300);
  }
  // la password compare solo se l'email è del team: per le clienti il modulo resta com'è
  function emailTeam(v) { v = String(v || "").trim().toLowerCase(); return /@unlikeacademy\.it$/.test(v) && v.indexOf("+") < 0; }
  function aggiornaLogin() {
    var em = document.getElementById("em"), pwf = document.getElementById("pwf"), pw = document.getElementById("pw");
    var btn = document.querySelector('form[data-act="login"] button');
    if (!em || !pwf) return;
    var team = emailTeam(em.value);
    pwf.hidden = !team;
    if (btn && !btn.disabled) btn.textContent = team && pw && pw.value ? "Entra" : "Mandami il link";
  }

  // ---------- pannello del team ----------
  // Chi ha l'email nel gruppo del team entra con lo stesso link delle clienti e vede l'elenco: ogni riga apre la dashboard
  // della cliente com'è per lei, in sola lettura, con avanzamento, note e feedback
  var NOTION_MODIFICHE = "https://app.notion.com/p/ecb7454e597b45bc8a8bfbbee4d87288";
  function vaStore(v) {
    try {
      if (arguments.length === 0) return sessionStorage.getItem("dp_viewas");
      if (v === null) sessionStorage.removeItem("dp_viewas"); else sessionStorage.setItem("dp_viewas", v);
    } catch (e) {}
    return null;
  }
  function ago(iso) {
    var d = parseDate(iso);
    if (!d) return "mai";
    var n = Math.round((startOfDay(S.today) - d) / 864e5);
    return n <= 0 ? "oggi" : n === 1 ? "ieri" : n + " giorni fa";
  }
  function giorniDa(iso) { var d = parseDate(iso); return d ? Math.round((startOfDay(S.today) - d) / 864e5) : null; }

  function teamCache() { if (S.team && S.lista) store("dp_teamcache", { token: S.token, team: S.team, lista: S.lista }); }

  function openTeam(forza) {
    S.viewAs = null; S.client = null; vaStore(null);
    if (route().indexOf("#/team") !== 0) history.replaceState(null, "", location.pathname + location.search + "#/team");
    if (!forza && S.lista) { render(); return Promise.resolve(); }
    if (!S.lista) app.innerHTML = '<div class="boot">Un attimo, carico l’elenco delle clienti</div>';
    return api.adminLista(S.token, true).then(function (j) {
      S.lista = j.clienti || [];
      teamCache();
      render();
    }).catch(function (err) {
      var msg = err && err.code === "vietato" ? "Questa email non è nel gruppo del team" : "Non riesco a caricare l’elenco: riprova tra un attimo";
      app.innerHTML = '<div class="boot">' + esc(msg) + '<br><br><button type="button" class="btn btn-ghost" data-act="ricarica">Riprova</button> <button type="button" class="btn btn-ghost" data-act="logout">Esci</button></div>';
    });
  }

  function openClient(email) {
    email = String(email || "").trim().toLowerCase();
    if (!email) { toast("Manca l’email nella riga Progetti: aggiungila su Notion", 4000); return Promise.resolve(); }
    app.innerHTML = '<div class="boot">Un attimo, apro la dashboard di ' + esc(email) + '</div>';
    return api.adminCliente(S.token, email).then(function (j) {
      S.client = j.client;
      S.progress = j.progress;
      S.viewAs = { email: email, info: (S.lista || []).filter(function (c) { return c.email === email; })[0] || null };
      S.open = {}; S.lastRoute = null;
      vaStore(email);
      prepare();
      if (route().indexOf("#/team") === 0) history.replaceState(null, "", location.pathname + location.search + "#/");
      render();
    }).catch(function (err) {
      toast((err && err.message) || "Non riesco ad aprirla: riprova", 5000);
      return openTeam(!S.lista);
    });
  }

  function viewTeam() {
    var opz = Object.keys(S.data.percorsi).map(function (k) { return '<option value="' + esc(k) + '"' + (S.filtro.p === k ? " selected" : "") + '>' + esc(S.data.percorsi[k].tipologia) + '</option>'; }).join("");
    return '<header class="top"><div class="top-in"><a class="brand" href="#/team"><img src="assets/logo-unlike-academy.webp" alt="Unlike Academy" width="768" height="158"><span>Pannello team</span></a>' +
      '<nav class="top-nav"><a class="chip" href="' + NOTION_MODIFICHE + '" target="_blank" rel="noopener">' + ICON.note + '<span class="t-long">Modifiche ai percorsi</span></a>' +
      '<button class="chip" type="button" data-act="ricarica">Aggiorna</button></nav></div></header>' +
      '<main class="team-wrap"><h1 class="page-title">Le <em>clienti</em></h1>' +
      '<p class="path-sub">Apri una riga per vedere la dashboard com’è per lei: tappe, avanzamento, note e feedback · si guarda soltanto, non si cambia niente da qui</p>' +
      '<div class="team-tools">' +
      '<label class="sr" for="tq">Cerca</label><input id="tq" type="search" data-act="q" placeholder="Cerca per nome o email" value="' + esc(S.filtro.q) + '">' +
      '<label class="sr" for="tp">Percorso</label><select id="tp" data-act="fp"><option value="">Tutti i percorsi</option>' + opz + '</select>' +
      '<label class="sr" for="tst">Stato</label><select id="tst" data-act="fst"><option value="attive"' + (S.filtro.st === "attive" ? " selected" : "") + '>Non terminate</option><option value="tutte"' + (S.filtro.st === "tutte" ? " selected" : "") + '>Tutte</option></select></div>' +
      '<div id="team-rows" class="team-list" aria-live="polite"></div>' +
      '<footer class="foot">' + esc(S.team.email) + ' · <button type="button" data-act="logout">Esci</button></footer></main>';
  }

  function renderTeamRows() {
    var box = document.getElementById("team-rows");
    if (!box) return;
    var f = S.filtro, q = f.q.trim().toLowerCase();
    var righe = (S.lista || []).filter(function (c) {
      if (f.p && c.percorso !== f.p) return false;
      if (f.st === "attive" && /terminat/i.test(c.stato)) return false;
      return !q || (c.cliente + " " + c.email).toLowerCase().indexOf(q) >= 0;
    }).sort(function (a, b) { return String(b.data_inizio).localeCompare(String(a.data_inizio)); });
    if (!righe.length) { box.innerHTML = '<p class="team-empty">Nessuna cliente con questi filtri</p>'; return; }
    box.innerHTML = righe.map(function (c) {
      var p = S.data.percorsi[c.percorso] || {}, gg = giorniDa(c.ultimo_accesso), attiva = /corso/i.test(c.stato);
      var flag = !c.email ? '<span class="tflag warn">manca l’email in Progetti</span>'
        : !c.ultimo_accesso ? '<span class="tflag">non è ancora entrata</span>'
        : (attiva && gg !== null && gg >= 10 ? '<span class="tflag warn">ferma da ' + gg + ' giorni</span>' : "");
      var inizio = parseDate(c.data_inizio), fine = parseDate(c.data_fine);
      return '<button type="button" class="team-row" data-act="vedi" data-email="' + esc(c.email) + '"' + (c.email ? "" : " disabled") + '>' +
        '<span class="t-name"><b>' + esc(c.cliente) + '</b><small>' + esc(c.email || "senza email") + '</small></span>' +
        '<span class="t-per"><b>' + esc(p.tipologia || c.tipologia) + '</b><small>' + (inizio ? fmtShort(inizio) : "") + (fine ? " → " + fmtShort(fine) : "") + '</small></span>' +
        '<span class="t-st"><span class="badge">' + esc(c.stato || "—") + '</span>' + flag + '</span>' +
        '<span class="t-prog"><small>' + esc(c.tappa || "non iniziata") + '</small><span class="bar small"><i style="width:' + (c.avanzamento || 0) + '%"></i></span><small>' + (c.avanzamento || 0) + '%</small></span>' +
        '<span class="t-acc"><small>ultimo accesso</small><b>' + esc(ago(c.ultimo_accesso)) + '</b>' + (c.note ? '<small class="t-note">' + c.note + (c.note === 1 ? " nota o feedback" : " note e feedback") + '</small>' : "") + '</span></button>';
    }).join("");
  }

  function teamBanner() {
    if (!S.viewAs) return "";
    var i = S.viewAs.info, nome = S.client.cliente || S.viewAs.email;
    var notion = S.client.notion_progetti_id ? "https://app.notion.com/p/" + String(S.client.notion_progetti_id).replace(/-/g, "") : "";
    return '<div class="demo-banner team-banner"><span class="demo-tag">Vista team</span><span class="sep" aria-hidden="true"> · </span><span>stai guardando <b>' + esc(nome) + '</b>, in sola lettura' +
      (i ? ' · ultimo accesso ' + esc(ago(i.ultimo_accesso)) + (i.attivazione ? ' · attivazione finita il ' + esc(fmtShort(parseDate(i.attivazione))) : " · attivazione non ancora finita") : "") + '</span>' +
      '<span class="sep" aria-hidden="true"> · </span><a href="#/team">‹ tutte le clienti</a>' +
      (notion ? '<span class="sep" aria-hidden="true"> · </span><a href="' + esc(notion) + '" target="_blank" rel="noopener">riga su Notion</a>' : "") +
      '<span class="sep" aria-hidden="true"> · </span><a href="' + NOTION_MODIFICHE + '" target="_blank" rel="noopener">modifica il percorso</a></div>';
  }

  function viewNotesTeam() {
    var nome = S.client.nome || String(S.client.cliente || "").split(" ")[0], tot = 0;
    var blocchi = S.percorso.modules.map(function (m) {
      var n = String(S.progress.notes[m.id] || "").trim();
      var fbs = m.resources.filter(function (r) { return String(S.progress.fb[r.key] || "").trim(); });
      if (!n && !fbs.length) return "";
      tot += (n ? 1 : 0) + fbs.length;
      var a = function (t) { return esc(t).replace(/\n/g, "<br>"); };
      return '<section class="note-team"><h3>' + esc(m.title) + '</h3>' +
        (n ? '<p><b>Le sue note</b><br>' + a(n) + '</p>' : "") +
        fbs.map(function (r) { return '<p><b>Feedback su «' + esc(cleanName(r.name)) + '»</b><br>' + a(S.progress.fb[r.key]) + '</p>'; }).join("") + '</section>';
    }).join("");
    return topBar() + '<main class="wrap"><a class="back" href="#/">‹ La sua dashboard</a>' +
      '<h1 class="page-title">Note di <em>' + esc(nome) + '</em></h1>' +
      '<p class="path-sub">' + (tot ? "Quello che ha scritto nelle note delle tappe e nei feedback sulle singole parti" : "Non ha ancora scritto note né feedback") + '</p>' +
      '<div class="notes-list">' + blocchi + '</div>' + foot() + '</main>';
  }

  // ---------- azioni ----------
  function toggleDone(key) {
    var x = S.resIndex[key];
    if (!x || S.viewAs) return;
    var st = state(x.m);
    if (st.locked || st.key === "prima") return;
    if (S.progress.done[key]) delete S.progress.done[key];
    else S.progress.done[key] = new Date().toISOString();
    checkActivation();
    var y = window.scrollY;
    render();
    window.scrollTo(0, y);
    var btn = app.querySelector('[data-act="done"][data-key="' + key + '"]');
    if (btn) btn.focus({ preventScroll: true });
    queueSave();
  }

  function toggleOpen(key) {
    S.open[key] = !S.open[key];
    var li = app.querySelector('[data-res="' + key + '"]');
    if (!li) return;
    li.classList.toggle("is-open", S.open[key]);
    var body = li.querySelector(".res-body"), t = li.querySelector(".res-title");
    if (body) body.hidden = !S.open[key];
    if (t) t.setAttribute("aria-expanded", String(S.open[key]));
  }

  function checkActivation() {
    var start = modById("start");
    if (!start || S.progress.attivazione) return;
    var c = counts(start);
    if (c.total && c.done >= c.total) {
      S.progress.attivazione = new Date().toISOString();
      S.pendingEvent = "attivazione";
      toast("Hai finito la settimana di attivazione: Elena ha ricevuto l’avviso · nella tappa 1, dopo lezioni ed esercizi, prenoti tu la prima call con Gemma", 6000);
    }
  }

  function summary() {
    var tot = totals(), cur = currentModule();
    return { avanzamento: tot.pct, fatte: tot.done, totale: tot.total, tappa: tappaLabel(cur), attivazione: S.progress.attivazione };
  }

  function queueSave(fieldId) {
    if (S.viewAs) return;
    S.edited = true;
    saveCache();
    clearTimeout(S.saveTimer);
    S.saveTimer = setTimeout(function () { S.saveTimer = null; save(fieldId); }, 700);
  }

  function save(fieldId, keepalive) {
    if (!S.client || S.viewAs) return Promise.resolve();
    var ev = S.pendingEvent;
    S.pendingEvent = null;
    var sum = summary();
    if (ev) sum.evento = ev;
    return api.save(S.token, S.progress, sum, keepalive).then(function () {
      if (fieldId) {
        var el = app.querySelector('[data-saved="' + fieldId + '"]');
        if (el) { el.textContent = "Salvato"; setTimeout(function () { el.textContent = ""; }, 1800); }
      }
    }).catch(function () {
      if (ev) S.pendingEvent = ev;
      toast("Non riesco a salvare: controlla la connessione e riprova", 4000);
    });
  }

  function flush() {
    if (S.saveTimer) { clearTimeout(S.saveTimer); S.saveTimer = null; save(null, true); }
  }

  function doLogin(form) {
    var email = String(form.email.value || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { renderLogin({ type: "err", text: "Controlla l’email: sembra scritta male" }); return; }
    if (DEMO) { renderLogin({ type: "ok", text: "Nella versione di prova il link non parte: apri uno dei percorsi qui sotto" }); return; }
    var btn = form.querySelector("button");
    var pw = form.password ? String(form.password.value || "") : "";
    if (pw && emailTeam(email)) {
      btn.disabled = true; btn.textContent = "Un attimo";
      api.teamLogin(email, pw).then(function (j) {
        store("dp_token", j.token); S.token = j.token;
        history.replaceState(null, "", location.pathname + location.search + "#/team");
        enter();
      }).catch(function (err) {
        renderLogin({ type: "err", text: err && err.server ? err.message : "Qualcosa non è andato: riprova tra poco" });
      });
      return;
    }
    btn.disabled = true; btn.textContent = "Un attimo";
    setTimeout(function () { if (btn.isConnected && btn.disabled) btn.textContent = "Ancora qualche secondo"; }, 6000);
    api.login(email).then(function () {
      renderLogin({ type: "ok", text: "Fatto: se l’email è quella dell’iscrizione tra poco ti arriva il link per entrare · guarda anche nello spam" });
    }).catch(function () {
      renderLogin({ type: "err", text: "Qualcosa non è andato: riprova tra poco o scrivici nel tuo gruppo chat" });
    });
  }

  // Copia locale dell'ultimo percorso aperto: la pagina si apre subito, il server aggiorna dietro
  function saveCache() {
    if (!DEMO && S.client && !S.viewAs) store("dp_cache", { token: S.token, client: S.client, progress: S.progress });
  }

  function enter(tentativo) {
    tentativo = tentativo || 1;
    var cache = !DEMO && tentativo === 1 ? store("dp_cache") : null;
    var daCache = false;
    var tc = !DEMO && tentativo === 1 ? store("dp_teamcache") : null;
    if (tc && tc.token === S.token && tc.lista && tc.team && !vaStore()) {
      S.team = tc.team; S.lista = tc.lista; S.client = null; S.viewAs = null; daCache = true;
      if (route().indexOf("#/team") !== 0) history.replaceState(null, "", location.pathname + location.search + "#/team");
      render();
    }
    if (cache && cache.token === S.token && cache.client) {
      try {
        S.client = cache.client;
        S.progress = cache.progress;
        prepare();
        render();
        daCache = true;
      } catch (e) { S.client = null; }
    }
    if (tentativo === 1) {
      S.edited = false;
      if (!daCache) {
        app.innerHTML = '<div class="boot">Un attimo, sto aprendo il tuo percorso</div>';
        setTimeout(function () {
          var b = app.querySelector(".boot");
          if (b && !S.client) b.textContent = "Ci sta mettendo più del solito: ancora qualche secondo, la prossima volta si apre subito";
        }, 6000);
      }
    }
    return api.me(S.token).then(function (j) {
      if (j.team) {
        S.team = { email: j.email, nome: j.nome }; S.client = null; S.viewAs = null; S.edited = false;
        if (j.clienti) S.lista = j.clienti;
        teamCache();
        var ultima = vaStore();
        if (ultima && route().indexOf("#/team") !== 0) return openClient(ultima);
        if (S.lista) { S.lastRoute = null; if (route().indexOf("#/team") !== 0) history.replaceState(null, "", location.pathname + location.search + "#/team"); render(); return; }
        return openTeam(true);
      }
      var prima = JSON.stringify([S.client, S.progress]);
      S.client = j.client;
      // se nel frattempo la cliente ha spuntato o scritto qualcosa, vince quello che ha sul telefono
      if (!S.edited) S.progress = j.progress;
      prepare();
      saveCache();
      if (!daCache || JSON.stringify([S.client, S.progress]) !== prima) {
        var y = window.scrollY;
        S.lastRoute = null;
        render();
        window.scrollTo(0, y);
      }
    }).catch(function (err) {
      // link scaduto o non valido: si torna al login
      if (err && err.code === "scaduto") {
        store("dp_token", null);
        store("dp_cache", null);
        S.token = null;
        S.client = null;
        renderLogin({ type: "err", text: "Il link è scaduto: scrivi la tua email e te ne mandiamo uno nuovo" });
        return;
      }
      // problema di rete o del server: il link resta buono, si riprova
      if (tentativo < 2) { setTimeout(function () { enter(tentativo + 1); }, 2000); return; }
      if (!S.client) app.innerHTML = '<div class="boot">Non riesco ad aprire il percorso adesso: ricarica la pagina tra un attimo</div>';
    });
  }

  function startDemo(p) {
    S.token = "demo:" + p;
    store("dp_token", S.token);
    location.hash = "#/";
    S.lastRoute = null;
    enter();
  }

  function logout() {
    flush();
    store("dp_token", null);
    store("dp_cache", null);
    S.token = null;
    S.client = null;
    S.team = null; S.viewAs = null; S.lista = null; vaStore(null); store("dp_teamcache", null);
    S.open = {};
    history.replaceState(null, "", location.pathname + location.search);
    renderLogin();
  }

  // ---------- eventi ----------
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t) return;
    var act = t.getAttribute("data-act");
    if (act === "done") { e.preventDefault(); toggleDone(t.getAttribute("data-key")); }
    else if (act === "toggle") { e.preventDefault(); toggleOpen(t.getAttribute("data-key")); }
    else if (act === "guardato") { e.preventDefault(); videoGuardato(); }
    else if (act === "demo") { e.preventDefault(); startDemo(t.getAttribute("data-p")); }
    else if (act === "logout") { e.preventDefault(); logout(); }
    else if (act === "occhio") {
      e.preventDefault();
      var inp = document.getElementById("pw"), mostra = inp && inp.type === "password";
      if (inp) { inp.type = mostra ? "text" : "password"; inp.focus(); }
      t.setAttribute("aria-pressed", String(!!mostra)); t.setAttribute("aria-label", mostra ? "Nascondi la password" : "Mostra la password");
      t.innerHTML = mostra ? ICON.eyeOff : ICON.eye;
    }
    else if (act === "vedi") { e.preventDefault(); openClient(t.getAttribute("data-email")); }
    else if (act === "ricarica") { e.preventDefault(); openTeam(true); }
  });
  document.addEventListener("change", function (e) {
    var t = e.target, act = t.getAttribute && t.getAttribute("data-act");
    if (act === "fp") { S.filtro.p = t.value; renderTeamRows(); }
    else if (act === "fst") { S.filtro.st = t.value; renderTeamRows(); }
  });
  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f.getAttribute("data-act") === "login") { e.preventDefault(); doLogin(f); }
  });
  document.addEventListener("input", function (e) {
    var t = e.target, act = t.getAttribute && t.getAttribute("data-act");
    if (t.id === "em" || t.id === "pw") { aggiornaLogin(); return; }
    if (act === "q") { S.filtro.q = t.value; renderTeamRows(); return; }
    if (S.viewAs) return;
    if (act === "fb") { S.progress.fb[t.getAttribute("data-key")] = t.value; queueSave(t.id); }
    else if (act === "note") { S.progress.notes[t.getAttribute("data-mod")] = t.value; queueSave(t.id); }
  });
  window.addEventListener("hashchange", function () { flush(); render(); });
  document.addEventListener("visibilitychange", function () { if (document.visibilityState === "hidden") flush(); });

  // ---------- avvio ----------
  function boot() {
    var oggi = DEMO && qs.get("oggi") ? parseDate(qs.get("oggi")) : null;
    S.today = startOfDay(oggi || new Date());
    loadPercorsi().then(function (data) {
      S.data = data;
      var t = qs.get("t");
      if (t) {
        store("dp_token", t);
        qs.delete("t");
        history.replaceState(null, "", location.pathname + (qs.toString() ? "?" + qs.toString() : "") + location.hash);
      }
      var demoP = qs.get("demo");
      if (DEMO && demoP && S.data.percorsi[demoP]) store("dp_token", "demo:" + demoP);
      S.token = store("dp_token");
      if (!S.token) return renderLogin();
      return enter();
    }).catch(function () {
      app.innerHTML = '<div class="boot">Non riesco a caricare il percorso: ricarica la pagina tra un attimo</div>';
    });
  }

  boot();
})();
