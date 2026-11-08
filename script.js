/* ============================================================
   Ronjas Futterplan – kleine Helfer
   ============================================================ */
(function () {
  "use strict";

  var SVG_NS = "http://www.w3.org/2000/svg";
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

  function karteHtml(k) {
    var farbe = k.farbe || "creme";
    var h = '<article class="karte farbe-' + sicher(farbe) + (k.bild ? " mit-bild" : "") + '">';
    var b = BILDER[k.bild];
    if (b) {
      h += '<img class="karten-bild" src="grafiken/' + b[0] + '" width="' + b[1] * b[3] + '" height="' + b[2] * b[3] + '" alt="' + sicher(b[4]) + '">';
    }
    h += '<div class="karte-kopf"><span class="badge">' + icon(k.icon) + '</span><h3>' + zeile(k.titel);
    if (k.menge) h += ' <span class="menge">' + sicher(k.menge) + "</span>";
    h += "</h3></div>" + absaetze(k.text);
    var liste = (k.liste || []).filter(function (p) { return String(p).trim(); });
    if (liste.length) {
      h += '<ul class="zutaten">' + liste.map(function (p) { return "<li>" + zeile(p) + "</li>"; }).join("") + "</ul>";
    }
    return h + "</article>";
  }

  function render() {
    var s = daten.seite || {};
    document.getElementById("seiten-titel").textContent = s.titel || "";
    document.getElementById("seiten-untertitel").innerHTML = zeile(s.untertitel);
    document.getElementById("seiten-fuss").innerHTML = zeile(s.fuss);
    document.title = s.titel || "Ronja";

    var w = daten.wichtig || {};
    document.getElementById("wichtig-titel").textContent = w.titel || "";
    document.getElementById("wichtig-liste").innerHTML = (w.punkte || []).map(function (p) {
      return "<li>" + icon(p.icon) + "<span><strong>" + zeile(p.fett) + "</strong> " + zeile(p.text) + "</span></li>";
    }).join("");

    ZEITEN.forEach(function (z) {
      var t = daten[z] || {};
      var h = '<h2 class="panel-titel">' + zeile(t.titel) + "</h2>";
      if (t.intro) h += '<div class="panel-intro">' + absaetze(t.intro) + "</div>";
      if (t.hinweis) h += '<div class="karte hinweis">' + icon("waage", "icon-gross") + "<div>" + absaetze(t.hinweis) + "</div></div>";
      h += '<div class="karten-raster">' + (t.karten || []).map(karteHtml).join("") + "</div>";
      if (t.notiz) {
        var offen = /TODO/i.test(t.notiz);
        h += '<div class="' + (offen ? "todo" : "karte notiz") + '">' + (offen ? "" : icon("info", "icon-gross")) + "<div>" + absaetze(t.notiz) + "</div></div>";
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
      "herz": "Herz", "info": "Info"
    },
    FARBEN: { "apricot": "Apricot", "senf": "Senfgelb", "creme": "Creme", "warnung": "Warnung (rot umrandet)", "nacht": "Nachtblau" },
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

  /* ---------- 3. Deko in den Landschaften (Blumen, Sterne, Gras) ----------
     Fester Zufall, damit es bei jedem Laden gleich aussieht. */
  var saat = 7;
  function zufall() {
    saat = (saat * 16807) % 2147483647;
    return (saat - 1) / 2147483646;
  }
  function el(name, attrs, eltern) {
    var e = document.createElementNS(SVG_NS, name);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (eltern) eltern.appendChild(e);
    return e;
  }
  function blume(g, x, y, r, blatt, mitte) {
    var b = el("g", { transform: "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ")" }, g);
    for (var i = 0; i < 5; i++) {
      el("ellipse", {
        cx: 0, cy: -r * 0.75, rx: r * 0.55, ry: r * 0.8, fill: blatt,
        transform: "rotate(" + (i * 72 + zufall() * 10) + ")"
      }, b);
    }
    el("circle", { cx: 0, cy: 0, r: r * 0.42, fill: mitte }, b);
  }
  function grasstriche(g, anzahl, yMin, yMax, farbe) {
    for (var i = 0; i < anzahl; i++) {
      var x = zufall() * 1600, y = yMin + zufall() * (yMax - yMin);
      el("path", {
        d: "M" + x.toFixed(0) + " " + y.toFixed(0) + " q4 -14 " + (6 + zufall() * 10).toFixed(0) + " -22",
        stroke: farbe, "stroke-width": 3, fill: "none", "stroke-linecap": "round", opacity: .6
      }, g);
    }
  }

  var deko = {};
  document.querySelectorAll(".deko").forEach(function (g) { deko[g.dataset.art] = g; });

  // Morgen: wenige zarte Blumen, etwas Gras
  grasstriche(deko.morgen, 70, 760, 1000, "#6E9A55");
  for (var i = 0; i < 26; i++) {
    blume(deko.morgen, zufall() * 1600, 830 + zufall() * 170, 7 + zufall() * 6,
      zufall() < .6 ? "#FFF8F0" : "#F7C6A8", "#E8B23A");
  }

  // Mittag: viele Blumen in Weiß, Gelb, Orange
  grasstriche(deko.mittag, 110, 720, 1000, "#3F7A35");
  var farben = ["#FFFDF4", "#FFFDF4", "#F4C430", "#E8B23A", "#E58A45"];
  for (var j = 0; j < 90; j++) {
    var y = 700 + Math.pow(zufall(), .7) * 300;
    blume(deko.mittag, zufall() * 1600, y, 4 + (y - 700) / 300 * 12,
      farben[Math.floor(zufall() * farben.length)], "#C9771F");
  }

  // Abend: Sterne am Himmel, leuchtende weiße Blumen, Glühwürmchen
  var sterne = document.querySelector(".bg-abend .sterne");
  for (var s = 0; s < 140; s++) {
    el("circle", {
      cx: (zufall() * 1600).toFixed(0), cy: (zufall() * 560).toFixed(0),
      r: (0.8 + zufall() * 2.2).toFixed(1), fill: "#FFF8E1", opacity: (0.4 + zufall() * 0.6).toFixed(2)
    }, sterne);
  }
  var leuchtGruppe = el("g", { filter: "url(#leuchten)" }, deko.abend);
  for (var f = 0; f < 22; f++) {
    el("circle", { cx: zufall() * 1600, cy: 700 + zufall() * 200, r: 2.5, fill: "#FFF6C2", opacity: .85 }, leuchtGruppe);
  }
  grasstriche(deko.abend, 90, 720, 1000, "#3E6A62");
  for (var k = 0; k < 34; k++) {
    var yy = 720 + Math.pow(zufall(), .8) * 280;
    blume(leuchtGruppe, zufall() * 1600, yy, 5 + (yy - 720) / 280 * 14, "#FBF6E6", "#E8C25A");
  }

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
