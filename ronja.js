/* ============================================================
   Ronja wird lebendig: Blinzeln, Hecheln, Schwanzwedeln
   Alles läuft in zufälligen Abständen und in Schüben.
   Wer im Gerät "Bewegung reduzieren" eingestellt hat,
   bekommt eine ruhige Ronja ohne Animationen.
   ============================================================ */
(function () {
  "use strict";
  var ronja = document.getElementById("ronja");
  if (!ronja) return;

  var ruhig = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };

  function zufall(min, max) { return min + Math.random() * (max - min); }

  // Klasse für eine bestimmte Zeit setzen (verlängert, falls schon aktiv)
  var ende = {};
  function phase(klasse, dauer) {
    if (ruhig.matches) return;
    var bis = Date.now() + dauer;
    ende[klasse] = Math.max(ende[klasse] || 0, bis);
    ronja.classList.add(klasse);
    setTimeout(function () {
      if (Date.now() >= ende[klasse] - 20) ronja.classList.remove(klasse);
    }, dauer);
  }
  // Einmal-Animation neu starten
  function einmal(klasse, dauer) {
    if (ruhig.matches) return;
    ronja.classList.remove(klasse);
    void ronja.getBoundingClientRect();
    ronja.classList.add(klasse);
    setTimeout(function () { ronja.classList.remove(klasse); }, dauer);
  }

  /* ---------- Blinzeln: alle 3–7 Sekunden ---------- */
  function blinzeln() {
    einmal("blinzelt", 150);
    if (Math.random() < 0.2) setTimeout(function () { einmal("blinzelt", 150); }, 300); // manchmal doppelt
    setTimeout(blinzeln, zufall(3000, 7000));
  }

  /* ---------- Hecheln: ein paar Sekunden an, dann Pause ---------- */
  function hecheln() {
    var an = zufall(2500, 5000);
    phase("hechelt", an);
    setTimeout(hecheln, an + zufall(5000, 11000));
  }

  /* ---------- Schwanzwedeln in Schüben ---------- */
  function wedeln() {
    var an = zufall(1200, 2600);
    phase("wedelt", an);
    setTimeout(wedeln, an + zufall(4000, 9000));
  }

  /* ---------- Reaktion beim Wechsel der Tageszeit ---------- */
  document.addEventListener("ronja:reagieren", function () {
    phase("wedelt", 1400);
    if (Math.random() < 0.5) setTimeout(function () { einmal("blinzelt", 150); }, 250);
  });

  // Start mit kleinem Versatz, damit nicht alles gleichzeitig beginnt
  setTimeout(blinzeln, zufall(1500, 3500));
  setTimeout(hecheln, zufall(800, 2500));
  setTimeout(wedeln, zufall(2500, 5000));

  // Ändert jemand die Einstellung, während die Seite offen ist → alles stoppen
  function aufraeumen() {
    if (ruhig.matches) ronja.classList.remove("blinzelt", "hechelt", "wedelt");
  }
  if (ruhig.addEventListener) ruhig.addEventListener("change", aufraeumen);
})();
