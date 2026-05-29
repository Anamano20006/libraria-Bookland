const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");
const pg = require("pg");

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

// CONECTARE BAZA DE DATE
client = new pg.Client({
    database: "cti_2026",
    user: "ana",
    password: "ana2006cipri2008",
    host: "localhost",
    port: 5432
});
client.connect();

// GENERARE AUTOMATA OPTIUNI MENIU DIN BAZA DE DATE
let optiuniMeniu = [];
client.query("SELECT unnest(enum_range(NULL::gen_literar))", function(err, rez) {
    if (!err) {
        optiuniMeniu = rez.rows.map(rand => rand.unnest);
    }
});

// Transmitem optiunile catre toate paginile EJS
app.use(function(req, res, next) {
    res.locals.optiuniMeniu = optiuniMeniu;
    next();
});

//bonus 12
const FILE_OFERTE = path.join(__dirname, "oferte.json");
const T = 60 * 1000;    // 1 min  
const T2 = 3 * 60 * 1000;  //3 min
let ultimaCategorieGenerata = "";

function genereazaOfertaNoua() {
    if (!optiuniMeniu || optiuniMeniu.length === 0) return;
    
    let categoriiPosibile = [...optiuniMeniu];
    if (ultimaCategorieGenerata) {
        categoriiPosibile = categoriiPosibile.filter(cat => cat !== ultimaCategorieGenerata);
    }
    if (categoriiPosibile.length === 0) categoriiPosibile = optiuniMeniu; 
    
    let categorieAleasa = categoriiPosibile[Math.floor(Math.random() * categoriiPosibile.length)];
    const reduceriPosibile = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50];
    let reducereAleasa = reduceriPosibile[Math.floor(Math.random() * reduceriPosibile.length)];
    
    ultimaCategorieGenerata = categorieAleasa;

    let dataInceput = new Date();
    let dataFinalizare = new Date(dataInceput.getTime() + T);

    let dateJson = { oferte: [] };
    if (fs.existsSync(FILE_OFERTE)) {
        try { dateJson = JSON.parse(fs.readFileSync(FILE_OFERTE, 'utf8')); } catch (e) {}
    }

    let ofertaNoua = {
        "categorie": categorieAleasa,
        "data-incepere": dataInceput.toISOString(),
        "data-finalizare": dataFinalizare.toISOString(),
        "reducere": reducereAleasa
    };

    dateJson.oferte = dateJson.oferte || [];
    dateJson.oferte.unshift(ofertaNoua); // Punem la inceput

    let acum = new Date().getTime();
    dateJson.oferte = dateJson.oferte.filter(o => {
        let final = new Date(o["data-finalizare"]).getTime();
        return acum - final < T2;
    });

    fs.writeFileSync(FILE_OFERTE, JSON.stringify(dateJson, null, 2), 'utf8');
}

// Pornim cronometrul serverului după 2 secunde (ca să se fi încărcat baza de date)
setTimeout(() => {
    genereazaOfertaNoua();
    setInterval(genereazaOfertaNoua, T);
}, 2000);

function preiaOfertaCurenta() {
    try {
        if (fs.existsSync(FILE_OFERTE)) {
            let date = JSON.parse(fs.readFileSync(FILE_OFERTE, 'utf8'));
            if (date.oferte && date.oferte.length > 0) {
                let prima = date.oferte[0];
                if (new Date(prima["data-finalizare"]) > new Date()) {
                    return prima;
                }
            }
        }
    } catch(e) {}
    return null;
}




let vect_foldere = ["temp", "logs", "backup", "fisiere_uploadate"];
for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(path.join(caleFolder), { recursive: true });   
    }
}

app.use("/Resurse", express.static(path.join(__dirname, "Resurse")));
app.use("/dist",express.static(path.join(__dirname, "/node_modules/bootstrap/dist")));

app.get("/favicon.ico", function(req, res) {
    res.sendFile(path.join(__dirname, "Resurse/images/favicon/favicon.ico"));
});


app.get(["/", "/index", "/home"], function(req, res) {
    let ora = new Date().getHours();
    let timpCurent;

    if (ora >= 5 && ora < 12) {
        timpCurent = "dimineata";
    } else if (ora >= 12 && ora < 20) {
        timpCurent = "zi";
    } else {
        timpCurent = "noapte";
    }

    let imaginiFiltrate = obGlobal.obImagini.imagini.filter(imag => imag.timp === timpCurent);
    let rest = imaginiFiltrate.length % 3;
    if (rest !== 0) {
        imaginiFiltrate.splice(imaginiFiltrate.length - rest, rest);
    }

    
    res.render("pagini/index", { ip: req.ip, imagini: imaginiFiltrate, oferta: preiaOfertaCurenta() });
});

// RUTA PRODUSE (TOATE SAU FILTRATE DUPA CATEGORIE DIN MENIU + BONUS 10A SERVER FILTERING)
app.get("/produse", function (req, res) {
    let clauzaWhere = "";
    
    if (req.query.tip) {
        clauzaWhere = ` WHERE categorie='${req.query.tip}'`;
    }
    
    client.query(`SELECT * FROM carti ${clauzaWhere}`, function(err, rez) {
        if (err) {
            console.log("Eroare baza de date", err);
            afisareEroare(res, 2);
        } else {
            let produseFiltrate = rez.rows;

            // --- FILTRARE SERVER BONUS 10a ---
            if (req.query.nume_server) {
                let numeCautat = req.query.nume_server.trim().toLowerCase();
                const faraDiacritice = (txt) => txt ? txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
                produseFiltrate = produseFiltrate.filter(prod => 
                    faraDiacritice(prod.nume.toLowerCase()).includes(faraDiacritice(numeCautat))
                );
            }

            if (req.query.categorie_server && req.query.categorie_server !== 'toate') {
                let catCautata = req.query.categorie_server.trim().toLowerCase();
                produseFiltrate = produseFiltrate.filter(prod => prod.categorie && prod.categorie.toLowerCase() === catCautata);
            }

            // Daca s-a apasat butonul formularului pe server, facem si sortarea server
            if (req.query.cheie1_server) {
                let cheie1 = req.query.cheie1_server || "pret";
                let cheie2 = req.query.cheie2_server || "nume";
                let sens = req.query.sens_server === "descrescator" ? -1 : 1;

                const getVal = (prod, cheie) => {
                    if (cheie === "pret") return parseFloat(prod.pret);
                    if (cheie === "pagini") return parseInt(prod.numar_pagini);
                    return prod[cheie] ? prod[cheie].toLowerCase() : ""; 
                };

                produseFiltrate.sort((a, b) => {
                    let valA1 = getVal(a, cheie1);
                    let valB1 = getVal(b, cheie1);

                    if (valA1 === valB1) {
                        let valA2 = getVal(a, cheie2);
                        let valB2 = getVal(b, cheie2);
                        if (typeof valA2 === "string") return sens * valA2.localeCompare(valB2);
                        return sens * (valA2 - valB2);
                    }
                    if (typeof valA1 === "string") return sens * valA1.localeCompare(valB1);
                    return sens * (valA1 - valB1);
                });
            }

            console.log("Carti extrase/filtrate:", produseFiltrate.length);
            res.render("pagini/produse", { 
                produse: produseFiltrate,
                oferta: preiaOfertaCurenta() // BONUS 12
            });
        }
    });
});

// RUTA PRODUS INDIVIDUAL
app.get("/produs/:id", function (req, res) {
    client.query("SELECT * FROM carti WHERE id=$1", [req.params.id], function(err, rez) {
        if (err) {
            console.log("Eroare baza de date", err);
            afisareEroare(res, 2);
        } else {
            if(rez.rowCount == 0){
                afisareEroare(res, 404, "Produs inexistent");
            } else {
                res.render("pagini/produs", { prod: rez.rows[0] });
            }
        }
    });
});


app.get("/despre", function(req, res) {
    res.render("pagini/despre", { ip: req.ip });
});


function verificareErori() {
    const caleJson = path.join(__dirname, "Resurse/json/erori.json");
    if (!fs.existsSync(caleJson)) {
        console.error("EROARE MAJORA: Fișierul erori.json nu există! Aplicația se va închide.");
        process.exit();
    }

    const continutString = fs.readFileSync(caleJson, "utf-8");
    let blocuri = continutString.match(/\{[^}]+\}/g);
    if (blocuri) {
        for (let bloc of blocuri) {
            let chei = [...bloc.matchAll(/"([^"]+)":/g)].map(m => m[1]);
            let setChei = new Set(chei);
            if (chei.length !== setChei.size) {
                console.error("Aveți proprietăți duplicate în același obiect din erori.json!");
            }
        }
    }

    let erori;
    try {
        erori = JSON.parse(continutString);
    } catch (e) {
        console.error("EROARE: Fișierul erori.json nu este valid sintactic!");
        return;
    }

    if (!erori.info_erori || !erori.cale_baza || !erori.eroare_default) {
        console.error("Lipsesc proprietățile principale!");
    }

    if (erori.eroare_default) {
        if (!erori.eroare_default.titlu || !erori.eroare_default.text || !erori.eroare_default.imagine) {
            console.error(" Lipsesc proprietăți din eroare_default!");
        }
    }

    let caleBazaAbsoluta = "";
    if (erori.cale_baza) {
        let caleRelativa = erori.cale_baza.startsWith("/") ? erori.cale_baza.substring(1) : erori.cale_baza;
        caleBazaAbsoluta = path.join(__dirname, caleRelativa);
        if (!fs.existsSync(caleBazaAbsoluta)) {
            console.error(`Folderul specificat în cale_baza nu există!`);
        }
    }

    if (erori.info_erori && Array.isArray(erori.info_erori)) {
        let idVazute = new Set();
        for (let eroare of erori.info_erori) {
            if (idVazute.has(eroare.identificator)) {
                console.error(`Identificatorul ${eroare.identificator} apare de mai multe ori!`);
            } else {
                idVazute.add(eroare.identificator);
            }
            if (fs.existsSync(caleBazaAbsoluta) && eroare.imagine) {
                let caleImagine = path.join(caleBazaAbsoluta, eroare.imagine);
                if (!fs.existsSync(caleImagine)) {
                    console.error(`Imaginea "${eroare.imagine}" nu a fost găsită!`);
                }
            }
        }
    }
}

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


function initImagini(){
    var continut = fs.readFileSync(path.join(__dirname, "Resurse/json/galerie.json")).toString("utf-8");
    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;
    let caleGalerie = obGlobal.obImagini.cale_galerie;
    let caleAbs = path.join(__dirname, caleGalerie);
    
    let caleAbsMediu = path.join(caleAbs, "mediu");
    let caleAbsMic = path.join(caleAbs, "mic");
    if (!fs.existsSync(caleAbsMediu)) fs.mkdirSync(caleAbsMediu);
    if (!fs.existsSync(caleAbsMic)) fs.mkdirSync(caleAbsMic);

    for (let imag of vImagini) {
        let numeFis = imag.cale_relativa.split(".")[0]; 
        let ext = imag.cale_relativa.split(".")[1];
        let caleFisAbs = path.join(caleAbs, imag.cale_relativa);
        let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
        let caleFisMicAbs = path.join(caleAbsMic, numeFis + ".webp");

        if(fs.existsSync(caleFisAbs)) {
            if(!fs.existsSync(caleFisMediuAbs)) sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
            if(!fs.existsSync(caleFisMicAbs)) sharp(caleFisAbs).resize(150).toFile(caleFisMicAbs);
        }

        imag.fisier_mare = path.join("/", caleGalerie, imag.cale_relativa);
        imag.fisier_mediu = path.join("/", caleGalerie, "mediu", numeFis + ".webp");
        imag.fisier_mic = path.join("/", caleGalerie, "mic", numeFis + ".webp");
    }
}
initImagini();

// SCSS COMPILARE
function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss);
        let numeFis = numeFisExt.split(".")[0];
        caleCss = numeFis + ".css";
    }
    if (!path.isAbsolute(caleScss)) caleScss = path.join(obGlobal.folderScss, caleScss);
    if (!path.isAbsolute(caleCss)) caleCss = path.join(obGlobal.folderCss, caleCss);
    
    let caleBackup = path.join(obGlobal.folderBackup, "Resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true });
    }
    
    let numeFisCss = path.basename(caleCss);
    if (fs.existsSync(caleCss)) {
        try{
            fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "Resurse/css", numeFisCss));
        }catch(err){
            console.error("Eroare la crearea backup-ului pentru " + numeFisCss + ":", err.message);
        }
    }
    let rez = sass.compile(caleScss, { "sourceMap": true });
    fs.writeFileSync(caleCss, rez.css);
}

let vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}

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