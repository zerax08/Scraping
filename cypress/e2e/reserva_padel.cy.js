require("dotenv").config();
const selectorBuscar = "#MainContent_btnBuscar";

const WEB_USERNAME = Cypress.env("WEB_USERNAME");
const WEB_PASSWORD = Cypress.env("WEB_PASSWORD");
const LOCATION = Cypress.env("LOCATION");
const DAY = Cypress.env("DAY");
const HOUR = Number(Cypress.env("HOUR"));
const COURT = Number(Cypress.env("COURT"));
const PAY_METHOD = Number(Cypress.env("PAY_METHOD"));

describe("Login automatizado en Bilbao Kirolak", () => {
    it("Cambia idioma, accede al login e inicia sesión", () => {
        cy.visit("https://bilbaokirolak.eus/virtual/site/instalaciones/", {
            failOnStatusCode: false,
        });

        cy.wait(2000);

        // Quitar modal si aparece
        cy.window().then((win) => {
            win.document.querySelector("#bccs-buttonAgree")?.click();
            win.document.querySelector(".modal-backdrop")?.remove();
            win.document.querySelector(".modal")?.remove();
            win.document.body.style.overflow = "auto";
        });

        // Cambiar idioma a castellano
        cy.get("#ucMenuCabecera_lnkCastellano").click();

        // Ir al login
        cy.get("#ucMenuCabecera_hlIdentificar").click();

        // Asegurar que cargó el login en español
        cy.contains("Acceso mediante usuario").should("be.visible");

        // Escribir credenciales (¡usa las tuyas reales si tienes!)
        cy.get("#MainContent_txtCodigoP_txtA2TextBox").type(WEB_USERNAME); // sustituye por tu NIF/código
        cy.get("#MainContent_txtPasswordP_txtA2TextBox")
            .should("be.visible")
            .click({ force: true }) // enfocar primero
            .type(WEB_PASSWORD, { delay: 50, force: true });

        // Clic en botón de login
        cy.get("#MainContent_btnLoginP").click();

        cy.url().should("include", "/virtual/site/instalaciones");

        // Click en "NUEVA RESERVA"
        cy.get("#MainContent_ucMenuIndex_repMenu_hlRepMenu_0").should("be.visible").click();

        cy.get('[data-id="MainContent_cboFilialesInsta"]').click();

        // Selecciona la opción por su texto
        cy.get(".dropdown-menu.show .inner").contains(LOCATION).click();

        // Esperar a que el select de grupos se actualice
        cy.get("#MainContent_cboGrupos", { timeout: 10000 }).should("contain.text", "PADEL CUBIERTO"); // Verificamos que ya esté en el select HTML

        // Abrir dropdown visual de grupos
        cy.get('[data-id="MainContent_cboGrupos"]').click();

        // Esperar a que aparezca el menú visual con PADEL CUBIERTO
        cy.get(".dropdown-menu.show .inner", { timeout: 10000 }).contains("PADEL CUBIERTO").click();

        seleccionarFechaPorDia(DAY);

        // cy.get('[data-id="MainContent_cboFecha"]').click({ force: true })

        // === Clic en BUSCAR ===

        cy.get(selectorBuscar).click();

        esperarHastaLaHora().then(() => {
            // Continuar con el proceso cuando ya son las 18:00
            cy.get("#MainContent_rpHoras_a2HorasReserva_0_lstInstalaciones_0_lstHoras_" + (COURT - 1) + "_cmdSeleccionarHora_" + (HOUR - 8), { timeout: 10000 })
                .should("be.visible")
                .click();

            if (PAY_METHOD == 0) {
                cy.get("#MainContent_ucFormasPago_rbtTarjeta", { timeout: 10000 }).should("exist");
                cy.get("#MainContent_ucFormasPago_rbtTarjeta").check({ force: true });
            } else if (PAY_METHOD == 1) {
                cy.get("#MainContent_ucFormasPago_rbtBizum", { timeout: 10000 }).should("exist");
                cy.get("#MainContent_ucFormasPago_rbtBizum").check({ force: true });
            }
            cy.get("#MainContent_chkCondiciones").check({ force: true });
            cy.get("#MainContent_btnConfirmar", { timeout: 10000 }).should("not.be.disabled").click({ force: true });
        });
    });
});

function seleccionarFechaPorDia(dia, intento = 0) {
    const diaRegex = new RegExp(`^${dia},`, "i");

    // Asegurarse de que el botón visual esté visible antes del click
    cy.get('[data-id="MainContent_cboFecha"]').should("be.visible").click({ force: true });

    // Esperar a que se abra el dropdown y tenga opciones
    cy.get(".dropdown-menu.show .inner a", { timeout: 8000 })
        .should("have.length.at.least", 1)
        .then(($opciones) => {
            const opcion = [...$opciones].find((el) => el.innerText.trim().match(diaRegex));
            if (opcion) {
                cy.wrap(opcion).click({ force: true });

                // Verificar visualmente si se seleccionó
                cy.get('[data-id="MainContent_cboFecha"] .filter-option-inner-inner', { timeout: 5000 })
                    .invoke("text")
                    .then((texto) => {
                        if (!texto.trim().startsWith(dia)) {
                            if (intento < 2) {
                                cy.wait(700);
                                seleccionarFechaPorDia(dia, intento + 1);
                            } else {
                                throw new Error(`No se pudo seleccionar una fecha que empiece con ${dia} después de 3 intentos`);
                            }
                        }
                    });
            } else {
                throw new Error(`No se encontró ninguna opción que empiece con "${dia}"`);
            }
        });
}

function esperarHastaLaHora() {
    const horaActual = new Date().getHours();   
    if (horaActual >= HOUR) {
        return cy.wrap(null); // Resolves immediately if the condition is met
    } else {
        return cy.wait(300).then(() => esperarHastaLaHora()); // Waits for 1 second and recurses
    }
}

// // Espera hasta que la hora del sistema sea >= 18
// function esperarHastaLas18() {
//   return new Cypress.Promise((resolve) => {
//     const intentar = () => {
//       const horaActual = new Date().getHours()
//       if (horaActual >= 18) {
//         resolve()
//       } else {
//         cy.log('No es hora aún, esperando 30s...')
//         cy.get(selectorBuscar).click()
//         setTimeout(intentar, 10000)
//       }
//     }
//     intentar()
//   })
// }

// // Espera hasta que el botón esté visible (verifica cada 500ms)
// function esperarBotonVisible() {
//   return new Cypress.Promise((resolve) => {
//     const intentar = () => {
//       cy.get('body').then(($body) => {
//         if ($body.find(selectorHora).length > 0 && $body.find(selectorHora).is(':visible')) {
//           resolve()
//         } else {
//           cy.get(selectorBuscar).click()
//           setTimeout(intentar, 500)
//         }
//       })
//     }
//     intentar()
//   })
// }
