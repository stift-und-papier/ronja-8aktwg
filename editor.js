/* ============================================================
   ZAHNRAD: Texte bearbeiten
   - Änderungen sieht man sofort, aber nur auf diesem Gerät.
   - "Datei speichern" lädt eine neue inhalte.js herunter.
     Diese Datei auf GitHub hochladen → alle sehen die Änderung.
   ============================================================ */
(function () {
  "use strict";
  var R = window.Ronja;
  if (!R) return;

  var dialog = document.getElementById("editor");
  var inhalt = document.getElementById("editor-inhalt");
  var offeneBereiche = { allgemein: true };

  /* ---------- kleine Helfer ---------- */
  function neu(tag, attrs, kinder) {
    var e = document.createElement(tag);
    for (var k in (attrs || {})) {
      if (k === "text") e.textContent = attrs[k];
      else if (k === "onclick") e.addEventListener("click", attrs[k]);
      else e.setAttribute(k, attrs[k]);
    }
    (kinder || []).forEach(function (c) { if (c) e.appendChild(c); });
    return e;
  }
  var zaehler = 0;

  // Ein Eingabefeld, das direkt in R.daten schreibt
  function feld(beschriftung, objekt, schluessel, art, optionen) {
    var id = "ed-" + (++zaehler);
    var eingabe;
    if (art === "auswahl") {
      eingabe = neu("select", { id: id });
      Object.keys(optionen).forEach(function (wert) {
        var o = neu("option", { value: wert, text: optionen[wert] });
        if ((objekt[schluessel] || "") === wert) o.selected = true;
        eingabe.appendChild(o);
      });
    } else if (art === "lang" || art === "liste") {
      eingabe = neu("textarea", { id: id, rows: art === "liste" ? 4 : 3 });
      eingabe.value = art === "liste" ? (objekt[schluessel] || []).join("\n") : (objekt[schluessel] || "");
    } else {
      eingabe = neu("input", { id: id, type: "text" });
      eingabe.value = objekt[schluessel] || "";
    }
    eingabe.addEventListener(art === "auswahl" ? "change" : "input", function () {
      objekt[schluessel] = art === "liste"
        ? eingabe.value.split("\n").map(function (z) { return z.trim(); }).filter(Boolean)
        : eingabe.value;
      R.speichereEntwurf();
    });
    var hilfe = art === "liste" ? neu("small", { text: "Ein Punkt pro Zeile" }) : null;
    return neu("div", { "class": "ed-feld" }, [neu("label", { "for": id, text: beschriftung }), hilfe, eingabe]);
  }

  // Knöpfe zum Verschieben / Löschen eines Listeneintrags
  function eintragKnoepfe(liste, i, bezeichnung) {
    function tausch(j) {
      var tmp = liste[i]; liste[i] = liste[j]; liste[j] = tmp;
      R.speichereEntwurf(); zeichne();
    }
    return neu("div", { "class": "ed-eintrag-knoepfe" }, [
      i > 0 ? neu("button", { type: "button", "aria-label": bezeichnung + " nach oben", text: "↑", onclick: function () { tausch(i - 1); } }) : null,
      i < liste.length - 1 ? neu("button", { type: "button", "aria-label": bezeichnung + " nach unten", text: "↓", onclick: function () { tausch(i + 1); } }) : null,
      neu("button", {
        type: "button", "class": "ed-loeschen", text: "Löschen",
        onclick: function () {
          if (confirm("„" + bezeichnung + "“ wirklich löschen?")) { liste.splice(i, 1); R.speichereEntwurf(); zeichne(); }
        }
      })
    ]);
  }

  function bereich(schluessel, titel, kinder) {
    var d = neu("details", { "class": "ed-bereich" }, [neu("summary", { text: titel })].concat(kinder));
    d.open = !!offeneBereiche[schluessel];
    d.addEventListener("toggle", function () { offeneBereiche[schluessel] = d.open; });
    return d;
  }

  /* ---------- Formular aufbauen ---------- */
  function zeichne() {
    var d = R.daten;
    var scroll = inhalt.scrollTop;
    inhalt.innerHTML = "";

    inhalt.appendChild(neu("p", { "class": "ed-tipp" }, [
      document.createTextNode("Tipp: "),
      neu("strong", { text: "**fett**" }),
      document.createTextNode(" macht Text fett. Eine Leerzeile beginnt einen neuen Absatz. Steht „TODO“ in einer Notiz, wird sie gelb markiert.")
    ]));

    d.seite = d.seite || {}; d.vorhang = d.vorhang || {};
    inhalt.appendChild(bereich("allgemein", "Allgemein", [
      feld("Überschrift", d.seite, "titel"),
      feld("Begrüßung unter der Überschrift", d.seite, "untertitel", "lang"),
      feld("Text ganz unten", d.seite, "fuss"),
      feld("Vorhang: Frage", d.vorhang, "frage"),
      feld("Vorhang: richtige Antwort", d.vorhang, "antwort")
    ]));

    d.wichtig = d.wichtig || { punkte: [] };
    var punkte = d.wichtig.punkte = d.wichtig.punkte || [];
    var punktFelder = punkte.map(function (p, i) {
      return neu("fieldset", { "class": "ed-eintrag" }, [
        neu("legend", { text: "Punkt " + (i + 1) }),
        feld("Fett", p, "fett"),
        feld("Text", p, "text"),
        feld("Symbol", p, "icon", "auswahl", R.ICONS),
        eintragKnoepfe(punkte, i, "Punkt " + (i + 1))
      ]);
    });
    inhalt.appendChild(bereich("wichtig", "Das Wichtigste auf einen Blick", [
      feld("Überschrift", d.wichtig, "titel")
    ].concat(punktFelder, [
      neu("button", {
        type: "button", "class": "ed-neu", text: "+ Punkt hinzufügen",
        onclick: function () { punkte.push({ icon: "info", fett: "Neu:", text: "" }); R.speichereEntwurf(); zeichne(); }
      })
    ])));

    [["morgen", "Morgen"], ["mittag", "Mittag"], ["abend", "Abend"]].forEach(function (paar) {
      var z = paar[0];
      var t = d[z] = d[z] || {};
      var karten = t.karten = t.karten || [];
      var kartenFelder = karten.map(function (k, i) {
        var name = k.titel || "Karte " + (i + 1);
        return neu("fieldset", { "class": "ed-eintrag" }, [
          neu("legend", { text: "Karte " + (i + 1) + ": " + name }),
          feld("Überschrift", k, "titel"),
          feld("Menge (optional, z. B. „ca. 200 g“)", k, "menge"),
          feld("Text", k, "text", "lang"),
          feld("Aufzählung (optional)", k, "liste", "liste"),
          neu("div", { "class": "ed-reihe" }, [
            feld("Symbol", k, "icon", "auswahl", R.ICONS),
            feld("Farbe", k, "farbe", "auswahl", R.FARBEN),
            feld("Bild", k, "bild", "auswahl", R.BILDER)
          ]),
          eintragKnoepfe(karten, i, name)
        ]);
      });
      inhalt.appendChild(bereich(z, paar[1], [
        feld("Überschrift", t, "titel"),
        feld("Einleitung", t, "intro", "lang"),
        feld("Wichtiger Hinweis (gestrichelter Kasten, leer = keiner)", t, "hinweis", "lang"),
      ].concat(kartenFelder, [
        neu("button", {
          type: "button", "class": "ed-neu", text: "+ Karte hinzufügen",
          onclick: function () {
            karten.push({ icon: "pfoten", farbe: "creme", bild: "", titel: "Neue Karte", menge: "", text: "", liste: [] });
            R.speichereEntwurf(); zeichne();
          }
        }),
        feld("Notiz unten (z. B. wo etwas steht, leer = keine)", t, "notiz", "lang")
      ])));
    });

    inhalt.scrollTop = scroll;
  }

  /* ---------- Speichern als Datei ---------- */
  function speichern() {
    var text =
      "/* ================================================================\n" +
      "   ALLE TEXTE DER SEITE\n" +
      "   Am einfachsten änderst du sie über das Zahnrad oben rechts.\n" +
      "   Dort speicherst du eine neue Version dieser Datei und lädst sie\n" +
      "   auf GitHub hoch.\n" +
      "   Fett: **so** · Neuer Absatz: Leerzeile\n" +
      "   ================================================================ */\n" +
      "window.RONJA_INHALTE = " + JSON.stringify(R.daten, null, 2) + ";\n";
    var url = URL.createObjectURL(new Blob([text], { type: "text/javascript;charset=utf-8" }));
    var a = neu("a", { href: url, download: "inhalte.js" });
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);

    var alt = document.getElementById("ed-anleitung");
    if (alt) alt.remove();
    var anleitung = neu("div", { "class": "ed-anleitung", id: "ed-anleitung", role: "status" }, [
      neu("strong", { text: "Gespeichert! So kommt es online:" }),
      neu("ol", {}, [
        neu("li", { text: "Öffne dein Repository auf github.com." }),
        neu("li", { text: "Klicke auf „Add file“ → „Upload files“." }),
        neu("li", { text: "Ziehe die Datei inhalte.js aus deinem Download-Ordner hinein. Sie muss genau „inhalte.js“ heißen (nicht „inhalte (1).js“)." }),
        neu("li", { text: "Klicke unten auf „Commit changes“." }),
        neu("li", { text: "Nach 1–2 Minuten zeigt die Seite die neuen Texte für alle." })
      ])
    ]);
    inhalt.prepend(anleitung);
    inhalt.scrollTop = 0;
  }

  /* ---------- Öffnen / Schließen ---------- */
  function oeffnen() {
    zeichne();
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
  }
  document.getElementById("zahnrad").addEventListener("click", oeffnen);
  document.getElementById("banner-bearbeiten").addEventListener("click", oeffnen);
  document.getElementById("editor-zu").addEventListener("click", function () { dialog.close(); });
  document.getElementById("editor-speichern").addEventListener("click", speichern);
  document.getElementById("editor-verwerfen").addEventListener("click", function () {
    if (confirm("Alle Änderungen auf diesem Gerät verwerfen? Dann gilt wieder die veröffentlichte Version.")) {
      R.verwerfen(); zeichne();
    }
  });
  // Klick auf den abgedunkelten Rand schließt
  dialog.addEventListener("click", function (e) { if (e.target === dialog) dialog.close(); });
})();
