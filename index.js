const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");

const app = express();
app.set("view engine", "ejs");

obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "Resurse/scss"),
    folderCss: path.join(__dirname, "Resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
}

console.log("Folder index.js", __dirname);  
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

// explicatie ceruta
// __dirname reprezinta folderul fisierului curent
// process.cwd() reprezinta folderul din care este pornit serverul
// Nu sunt intotdeauna aceleasi

let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), { recursive: true });   
    }
}

app.use("/Resurse", express.static(path.join(__dirname, "Resurse")));

app.get("/favicon.ico", function(req, res) {
    res.sendFile(path.join(__dirname, "Resurse/images/favicon/favicon.ico"));
});

app.get(["/", "/index", "/home"], function(req, res) {
    res.render("pagini/index", { ip: req.ip });
});

app.get("/despre", function(req, res) {
    res.render("pagini/despre", { ip: req.ip });
});

// Funcția pentru BONUS: Verificarea datelor din erori.json
function verificareErori() {
    const caleJson = path.join(__dirname, "Resurse/json/erori.json");

    // 1. (0.025) Nu există fisierul erori.json
    if (!fs.existsSync(caleJson)) {
        console.error("EROARE MAJORA: Fișierul erori.json nu există! Aplicația se va închide.");
        process.exit();
    }

    // Citim conținutul ca text (string) pentru verificarea de dubluri (punctul greu de 0.2)
    const continutString = fs.readFileSync(caleJson, "utf-8");

    // 6. (0.2) Verificare proprietate specificată de mai multe ori (pe string)
    let blocuri = continutString.match(/\{[^}]+\}/g);
    if (blocuri) {
        for (let bloc of blocuri) {
            let chei = [...bloc.matchAll(/"([^"]+)":/g)].map(m => m[1]); // Extragem toate cheile
            let setChei = new Set(chei); // Set-ul elimină automat dublurile
            if (chei.length !== setChei.size) {
                console.error("EROARE BONUS (0.2): Aveți proprietăți duplicate în același obiect din erori.json!");
            }
        }
    }

    // Parsăm JSON-ul pentru restul verificărilor
    let erori;
    try {
        erori = JSON.parse(continutString);
    } catch (e) {
        console.error("EROARE: Fișierul erori.json nu este valid sintactic!");
        return;
    }

    // 2. (0.025) Nu există una dintre proprietățile principale
    if (!erori.info_erori || !erori.cale_baza || !erori.eroare_default) {
        console.error("EROARE BONUS (0.025): Lipsesc proprietățile principale (info_erori, cale_baza sau eroare_default)!");
    }

    // 3. (0.025) Lipsesc proprietăți din eroare_default
    if (erori.eroare_default) {
        if (!erori.eroare_default.titlu || !erori.eroare_default.text || !erori.eroare_default.imagine) {
            console.error("EROARE BONUS (0.025): Lipsesc proprietăți din eroare_default (titlu, text sau imagine)!");
        }
    }

    // 4. (0.025) Folderul specificat în cale_baza nu există
    let caleBazaAbsoluta = "";
    if (erori.cale_baza) {
        let caleRelativa = erori.cale_baza.startsWith("/") ? erori.cale_baza.substring(1) : erori.cale_baza;
        caleBazaAbsoluta = path.join(__dirname, caleRelativa);
        
        if (!fs.existsSync(caleBazaAbsoluta)) {
            console.error(`EROARE BONUS (0.025): Folderul specificat în cale_baza ("${erori.cale_baza}") nu există!`);
        }
    }

    // Verificăm erorile individuale
    if (erori.info_erori && Array.isArray(erori.info_erori)) {
        let idVazute = new Set(); // Folosim un Set pentru a ține minte identificatorii găsiți

        for (let eroare of erori.info_erori) {
            
            // 7. (0.15) Există mai multe erori cu același identificator
            if (idVazute.has(eroare.identificator)) {
                console.error(`EROARE BONUS (0.15): Identificatorul ${eroare.identificator} apare de mai multe ori! Detalii dublură -> Titlu: "${eroare.titlu}", Text: "${eroare.text}", Imagine: "${eroare.imagine}"`);
            } else {
                idVazute.add(eroare.identificator);
            }

            // 5. (0.05) Nu există fișierul imagine asociat erorii
            if (fs.existsSync(caleBazaAbsoluta) && eroare.imagine) {
                let caleImagine = path.join(caleBazaAbsoluta, eroare.imagine);
                if (!fs.existsSync(caleImagine)) {
                    console.error(`EROARE BONUS (0.05): Imaginea "${eroare.imagine}" pentru eroarea ${eroare.identificator} nu a fost găsită în folder!`);
                }
            }
        }
    }
}

// Apelăm funcțiile de inițializare
verificareErori();
initErori();

function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "Resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut);
    let err_default = erori.eroare_default;
    err_default.imagine = erori.cale_baza + "/" + err_default.imagine;
    for (let eroare of erori.info_erori) {
        eroare.imagine = erori.cale_baza + "/" + eroare.imagine;
    }
}

function afisareEroare(res, identificator, titlu, text, imagine) {
    let eroare = obGlobal.obErori.info_erori.find((elem) => elem.identificator == identificator);
    let errDefault = obGlobal.obErori.eroare_default;

    if (eroare && eroare.status) {
        res.status(eroare.identificator);
    } else {
        res.status(500);
    }

    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine,
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
    });
}

app.get("/eroare", function(req, res) {
    afisareEroare(res, 404, "Titlu!!!");
});

function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0];
        caleCss = numeFis + ".css";
    }
    
    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss);
    
    let caleBackup = path.join(obGlobal.folderBackup, "Resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }
    
    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "Resurse/css", numeFisCss));
    }
    let rez = sass.compile(caleScss, { "sourceMap": true });
    fs.writeFileSync(caleCss, rez.css);
}

// compilare initiala
let vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}

// watch scss
fs.watch(obGlobal.folderScss, function(eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
});

app.get("/*pagina", function(req, res) {
    if (req.url.startsWith("/Resurse") && !path.extname(req.url)) {
        afisareEroare(res, 403);
        return;
    }
    if (path.extname(req.url) == ".ejs") {
        afisareEroare(res, 400);
        return;
    }
    try {
        res.render("pagini" + req.url, function(err, rezRandare) {
            if (err) {
                if (err.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404);
                } else {
                    afisareEroare(res);
                }
            } else {
                res.send(rezRandare);
            }
        });
    } catch (err) {
        if (err.message.includes("Cannot find module")) {
            afisareEroare(res, 404);
        } else {
            afisareEroare(res);
        }
    }
});

app.listen(8080);
console.log("Serverul a pornit pe portul 8080!");