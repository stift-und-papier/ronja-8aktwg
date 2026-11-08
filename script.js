/* ============================================================
   Ronjas Futterplan – kleine Helfer
   ============================================================ */
(function () {
  "use strict";

  var ZEITEN = ["morgen", "mittag", "abend"];

  /* ---------- 1. Tageszeit aus der Uhrzeit des Geräts ----------
     Morgen: 4–10 Uhr, Mittag: 11–16 Uhr, Abend: 17–3 Uhr */
  function zeitNachUhr() {
    var h = new Date().getHours();
    if (h >= 4 && h < 11) return "morgen";
    if (h >= 11 && h < 17) return "mittag";
    return "abend";
  }

  /* ---------- 1b. Texte aus inhalte.js auf die Seite bringen ---------- */
  var ENTWURF = "ronja-entwurf";
  var original = window.RONJA_INHALTE || {};

  function kopie(o) { return JSON.parse(JSON.stringify(o)); }

  // Gibt es einen Entwurf aus dem Zahnrad? (nur auf diesem Gerät)
  // Er gilt nur, solange die veröffentlichte Version dieselbe ist wie beim Bearbeiten.
  var basis = JSON.stringify(original);
  var daten = kopie(original);
  try {
    var entwurf = JSON.parse(localStorage.getItem(ENTWURF) || "null");
    if (entwurf && entwurf.basis === basis) daten = entwurf.daten;
    else localStorage.removeItem(ENTWURF);   // veraltet oder schon hochgeladen
  } catch (e) { /* kein Speicher – egal */ }

  function sicher(t) {
    return String(t == null ? "" : t)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  // **fett** und Zeilenumbrüche
  function zeile(t) {
    return sicher(t).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
  }
  function absaetze(t) {
    return String(t || "").split(/\n\s*\n/).filter(function (a) { return a.trim(); })
      .map(function (a) { return "<p>" + zeile(a.trim()) + "</p>"; }).join("");
  }
  function icon(name, klasse) {
    return '<svg' + (klasse ? ' class="' + klasse + '"' : "") + ' aria-hidden="true"><use href="#i-' + sicher(name || "pfoten") + '"/></svg>';
  }
  // Pixelbilder: [Datei in grafiken/, Breite, Höhe in Pixeln, ganzzahliger Vergrößerungsfaktor, Beschreibung]
  var BILDER = {
    fnoet: ["Fnoet.png", 86, 74, 2, "Pixelbild vom Stofftier Fnöt: senfgelbes Plüschtier mit langer Rüsselnase und cremefarbenen Kuschelohren"],
    dose: ["nassfutter.png", 50, 86, 2, "Pixelbild einer geöffneten Dose Nassfutter mit Hundegesicht auf dem Etikett"],
    sack: ["trockenfutter.png", 81, 112, 2, "Pixelbild eines Sacks Trockenfutter mit Pfotenabdrücken"],
    kekse: ["snack.png", 31, 33, 4, "Pixelbild eines Hundekekses in Pfotenform"],
    korb: ["bett.png", 49, 42, 3, "Pixelbild eines runden, blauen Hundebetts mit Pfotenmuster"],
    keule: ["hühnerbein.png", 30, 29, 4, "Pixelbild eines Hühnerbeins"]
  };

  // Eine Karte: Reiter (Titel mit Icon) oben links, darunter der Kasten mit Pixelrahmen
  // Deko-Pixel (selbst gebaut, Symbole d-… in index.html): Größe in Pixeln, Faktor immer ganzzahlig
  var DEKO = { stern: [9, 9], funkel: [5, 5], herz: [12, 10], pfote: [14, 12], knochen: [12, 8], tropfen: [8, 10] };
  function deko(name, faktor, klasse) {
    var g = DEKO[name];
    return "<svg class=\"deko-pixel " + (klasse || "") + "\" aria-hidden=\"true\" width=\"" + g[0] * faktor + "\" height=\"" + g[1] * faktor + "\"><use href=\"#d-" + name + "\"/></svg>";
  }

  function karte(tag, klasse, titelTag, titelHtml, inhalt, schmuck) {
    return "<" + tag + " class=\"karte " + klasse + "\">" + (schmuck || "") +
      "<" + titelTag + " class=\"reiter\">" + titelHtml + "</" + titelTag + ">" +
      "<div class=\"karte-koerper px-box\">" + inhalt + "</div></" + tag + ">";
  }
  function liste(punkte, klasse) {
    punkte = (punkte || []).filter(function (p) { return String(p).trim(); });
    // Aufzählungszeichen: Tropfen bei Flüssigem (Orthohyl), sonst eine Pfote
    return punkte.length ? "<ul class=\"" + klasse + "\">" + punkte.map(function (p) {
      var nass = /orthohyl|flüssig/i.test(p);
      return "<li>" + deko(nass ? "tropfen" : "pfote", 2, "punkt") + "<span>" + zeile(p) + "</span></li>";
    }).join("") + "</ul>" : "";
  }

  function karteHtml(k, i, alle) {
    var b = BILDER[k.bild], h = "";
    if (b) h += "<img class=\"karten-bild\" src=\"grafiken/" + b[0] + "\" width=\"" + b[1] * b[3] + "\" height=\"" + b[2] * b[3] + "\" alt=\"" + sicher(b[4]) + "\">";
    var titel = icon(k.icon, "reiter-icon") + "<span>" + zeile(k.titel) + "</span>";
    if (k.menge) titel += " <span class=\"menge\">" + sicher(k.menge) + "</span>";
    // sparsam: nur die letzte Karte bekommt einen Knochen neben den Reiter
    var schmuck = i === alle.length - 1 ? deko("knochen", 3, "rechts") : "";
    return karte("article", "farbe-" + sicher(k.farbe || "apricot"), "h3", titel, h + absaetze(k.text) + liste(k.liste, "zutaten"), schmuck);
  }

  // "Das Wichtigste" steht in jeder Tageszeit, damit es im Raster neben der Begrüßung sitzt
  function wichtigHtml() {
    var w = daten.wichtig || {};
    var punkte = (w.punkte || []).map(function (p) {
      return "<li>" + icon(p.icon) + "<span><strong>" + zeile(p.fett) + "</strong> " + zeile(p.text) + "</span></li>";
    }).join("");
    return karte("aside", "wichtig farbe-rose", "h2", icon("herz", "reiter-icon") + "<span>" + zeile(w.titel) + "</span>", "<ul>" + punkte + "</ul>", deko("herz", 3, "rechts") + deko("funkel", 4, "rechts-2"));
  }

  var FARBE_ZEIT = { morgen: "apricot", mittag: "salbei", abend: "daemmer" };
  var ICON_ZEIT = { morgen: "sonne-auf", mittag: "sonne", abend: "mond" };

  function render() {
    var s = daten.seite || {};
    document.getElementById("seiten-titel").textContent = s.titel || "";
    document.getElementById("seiten-untertitel").innerHTML = zeile(s.untertitel);
    document.getElementById("seiten-fuss").innerHTML = zeile(s.fuss);
    document.title = s.titel || "Ronja";

    ZEITEN.forEach(function (z) {
      var t = daten[z] || {};
      var h = karte("div", "intro farbe-" + FARBE_ZEIT[z], "h2", icon(ICON_ZEIT[z], "reiter-icon") + "<span>" + zeile(t.titel) + "</span>", absaetze(t.intro), deko("stern", 3, "rechts") + deko("funkel", 3, "rechts-2"));
      h += wichtigHtml();
      if (t.hinweis) h += "<div class=\"karte-koerper px-box farbe-warnung breit hinweis\">" + icon("waage", "icon-gross") + "<div>" + absaetze(t.hinweis) + "</div></div>";
      h += (t.karten || []).map(karteHtml).join("");
      if (t.notiz) {
        var offen = /TODO/i.test(t.notiz);
        h += "<div class=\"" + (offen ? "todo breit" : "karte-koerper px-box farbe-senf breit notiz") + "\">" + (offen ? "" : icon("info", "icon-gross")) + "<div>" + absaetze(t.notiz) + "</div></div>";
      }
      document.getElementById("panel-" + z).innerHTML = h;
    });

    var v = daten.vorhang || {};
    document.getElementById("vorhang-frage").textContent = v.frage || "Auf wen passt du auf?";

    var banner = document.getElementById("entwurf-banner");
    if (banner) banner.hidden = JSON.stringify(daten) === basis;
  }
  render();

  // Schnittstelle für den Bearbeiten-Dialog (editor.js)
  window.Ronja = {
    get daten() { return daten; },
    speichereEntwurf: function () {
      try {
        if (JSON.stringify(daten) === basis) localStorage.removeItem(ENTWURF);
        else localStorage.setItem(ENTWURF, JSON.stringify({ basis: basis, daten: daten }));
      } catch (e) { /* egal */ }
      render();
    },
    verwerfen: function () {
      daten = kopie(original);
      try { localStorage.removeItem(ENTWURF); } catch (e) { /* egal */ }
      render();
    },
    ICONS: {
      "napf": "Napf", "wecker": "Wecker", "keule": "Hühnerbein", "zucchini": "Zucchini",
      "spielzeug": "Stofftier", "pfoten": "Pfote", "verbot": "Verboten", "teller": "Teller/Tisch",
      "waage": "Waage", "mond": "Mond", "sonne": "Sonne", "sonne-auf": "Sonnenaufgang",
      "herz": "Herz", "info": "Info", "tropfen": "Tropfen"
    },
    FARBEN: { "apricot": "Apricot (Morgen)", "salbei": "Salbeigrün (Mittag)", "daemmer": "Dämmerblau (Abend)", "senf": "Senfgelb", "rose": "Rosé", "warnung": "Warnung (Terrakotta)" },
    BILDER: { "": "kein Bild", "dose": "Nassfutter-Dose", "sack": "Trockenfutter-Sack", "kekse": "Snack-Kekse", "korb": "Hundebett", "fnoet": "Fnöt", "keule": "Hühnerbein" }
  };

  /* ---------- 2. Toggle (Tabs) ---------- */
  var tabs = Array.prototype.slice.call(document.querySelectorAll('[role="tab"]'));

  function waehle(zeit, fokus) {
    tabs.forEach(function (tab) {
      var aktiv = tab.dataset.zeit === zeit;
      tab.setAttribute("aria-selected", aktiv ? "true" : "false");
      tab.tabIndex = aktiv ? 0 : -1;
      document.getElementById(tab.getAttribute("aria-controls")).hidden = !aktiv;
      if (aktiv && fokus) tab.focus();
    });
    document.body.dataset.zeit = zeit;
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      if (document.body.dataset.zeit !== tab.dataset.zeit) {
        waehle(tab.dataset.zeit, false);
        // Ronja darf reagieren (Animation kommt später)
        document.dispatchEvent(new CustomEvent("ronja:reagieren"));
      }
    });
    tab.addEventListener("keydown", function (e) {
      var neu = null;
      if (e.key === "ArrowRight") neu = (i + 1) % tabs.length;
      else if (e.key === "ArrowLeft") neu = (i - 1 + tabs.length) % tabs.length;
      else if (e.key === "Home") neu = 0;
      else if (e.key === "End") neu = tabs.length - 1;
      if (neu !== null) {
        e.preventDefault();
        waehle(tabs[neu].dataset.zeit, true);
        document.dispatchEvent(new CustomEvent("ronja:reagieren"));
      }
    });
  });

  // Für Tests: ?zeit=mittag in der Adresse erzwingt eine Tageszeit
  var erzwungen = new URLSearchParams(location.search).get("zeit");
  waehle(ZEITEN.indexOf(erzwungen) >= 0 ? erzwungen : zeitNachUhr(), false);

  /* ---------- 4. DEKO-VORHANG ----------
     ACHTUNG: Das ist KEIN Schutz! Die Antwort steht offen
     in inhalte.js, und alle Inhalte sind trotzdem im HTML lesbar.
     Es ist nur ein Spaß zur Begrüßung. */
  var MERKER = "ronja-vorhang-ok";

  var vorhang = document.getElementById("vorhang");
  var seite = document.getElementById("seite");
  var formular = document.getElementById("vorhang-form");
  var eingabe = document.getElementById("vorhang-eingabe");
  var hinweis = document.getElementById("vorhang-hinweis");

  function schonDurch() {
    try { return localStorage.getItem(MERKER) === "ja"; } catch (e) { return false; }
  }

  if (!schonDurch() && !new URLSearchParams(location.search).has("ohne-vorhang")) {
    vorhang.hidden = false;
    seite.setAttribute("inert", "");
    seite.setAttribute("aria-hidden", "true");
    setTimeout(function () { eingabe.focus(); }, 50);

    var versuche = 0;
    formular.addEventListener("submit", function (e) {
      e.preventDefault();
      var wert = eingabe.value.trim().toLowerCase();
      var antwort = String((daten.vorhang || {}).antwort || "Ronja").trim();
      if (wert === antwort.toLowerCase()) {
        try { localStorage.setItem(MERKER, "ja"); } catch (err) { /* egal */ }
        hinweis.textContent = "Richtig! Da wedelt schon jemand.";
        vorhang.classList.add("weg");
        seite.removeAttribute("inert");
        seite.removeAttribute("aria-hidden");
        setTimeout(function () {
          vorhang.hidden = true;
          document.dispatchEvent(new CustomEvent("ronja:reagieren"));
        }, 500);
      } else {
        versuche++;
        hinweis.textContent = versuche < 2
          ? "Hmm, nicht ganz. Nochmal?"
          : "Kleiner Tipp: fängt mit „" + antwort.charAt(0).toUpperCase() + "“ an.";
        formular.classList.remove("wackeln");
        void formular.offsetWidth;
        formular.classList.add("wackeln");
        eingabe.select();
      }
    });
  }
})();
