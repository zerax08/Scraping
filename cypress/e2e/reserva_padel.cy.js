require("dotenv").config();
const selectorBuscar = "#MainContent_btnBuscar";

const WEB_USERNAME = Cypress.env("WEB_USERNAME");
const WEB_PASSWORD = Cypress.env("WEB_PASSWORD");
const PHONE = Cypress.env("PHONE");
const LOCATION = Cypress.env("LOCATION");
const DAY = Cypress.env("DAY");
let HOUR = Number(Cypress.env("HOUR"));
const COURT = Number(Cypress.env("COURT"));
const PAY_METHOD = Number(Cypress.env("PAY_METHOD"));
const BIZUM_TIMEOUT = Number(Cypress.env("BIZUM_TIMEOUT"));
const FAVORITE_COURT = Boolean(Cypress.env("FAVORITE_COURT"));

let intentos = 0;

// Al inicio del test
Cypress.on('uncaught:exception', (err, runnable) => {
    if (
        err.message.includes('Unexpected token') ||
        err.message.includes('Cannot read properties') ||
        err.message.includes('is not a function')
    ) {
        console.warn('Ignorando error de JS de RedSys:', err.message);
        return false;
    }
});



describe("Login automatizado en Bilbao Kirolak", () => {

    beforeEach(() => {
        cy.origin('https://sis.redsys.es', () => {
            cy.on('uncaught:exception', () => false);
        });
    });

    it("Cambia idioma, accede al login e inicia sesi\u00f3n", () => {
        esperarHasta2MinutosAntes().then(() => {
            cy.visit("https://bilbaokirolak.eus/virtual/site/instalaciones/", {
                failOnStatusCode: false,
            });

            cy.wait(2000);
            cy.get("#bccs-buttonAgree").click();
            cy.get("#ucMenuCabecera_lnkCastellano").click();
            cy.get("#ucMenuCabecera_hlIdentificar").click();
            cy.contains("Acceso mediante usuario").should("be.visible");

            cy.get("#MainContent_txtCodigoP_txtA2TextBox").type(WEB_USERNAME);
            cy.get("#MainContent_txtPasswordP_txtA2TextBox").should("be.visible").click({ force: true }).type(WEB_PASSWORD, { delay: 50, force: true });
            cy.get("#MainContent_btnLoginP").click();

            cy.url().should("include", "/virtual/site/instalaciones");
            cy.get("#MainContent_ucMenuIndex_repMenu_hlRepMenu_0").should("be.visible").click();
            cy.get('[data-id="MainContent_cboFilialesInsta"]').click();
            cy.get(".dropdown-menu.show .inner").contains(LOCATION).click();
            cy.get("#MainContent_cboGrupos", { timeout: 10000 }).should("contain.text", "PADEL CUBIERTO");
            cy.get('[data-id="MainContent_cboGrupos"]').click();
            cy.get(".dropdown-menu.show .inner", { timeout: 10000 }).contains("PADEL CUBIERTO").click();
            seleccionarFechaPorDia(DAY);

            if (DAY === 'domingo') {
                HOUR--;
            }

            esperarHastaLaHora().then(() => {
                intentarSeleccionarCancha();

                if (PAY_METHOD === 0) {
                    cy.get("#MainContent_ucFormasPago_rbtTarjeta", { timeout: 10000 }).should("exist");
                    cy.get("#MainContent_ucFormasPago_rbtTarjeta").check({ force: true });
                } else if (PAY_METHOD === 1) {
                    cy.get("#MainContent_ucFormasPago_rbtBizum", { timeout: 10000 }).should("exist");
                    cy.get("#MainContent_ucFormasPago_rbtBizum").check({ force: true });
                }
                cy.get("#MainContent_chkCondiciones").check({ force: true });
                cy.get("#MainContent_btnConfirmar", { timeout: 10000 }).should("not.be.disabled").click({ force: true });

                if (PAY_METHOD === 1) {
                    cy.origin('https://ppii.redsys.es', { args: { PHONE } }, ({ PHONE }) => {
                        cy.on('uncaught:exception', () => false);

                        cy.get('#iPhBizInit', { timeout: 15000 }).should('be.visible');
                        cy.get('#iPhBizInit').type(PHONE);
                        cy.get('#bBizInit').should('not.be.disabled');
                        cy.get('#bBizInit').click();
                    });


                    cy.wait(BIZUM_TIMEOUT);


                    cy.origin('https://sis.redsys.es', () => {
                        cy.on('uncaught:exception', () => false);

                        const esperarYSaltar = (i = 0) => {
                            cy.document().then((doc) => {
                                try {
                                    const boton = doc.querySelector('.btn-continue');
                                    if (boton) {
                                        cy.get('.btn-continue').click({ force: true });
                                    } else if (i < 240) {
                                        cy.wait(1000).then(() => esperarYSaltar(i + 1));
                                    } else {
                                        cy.log('⚠️ Botón "Continuar" no apareció en 4 minutos.');
                                    }
                                } catch (e) {

                                    cy.wait(1000).then(() => esperarYSaltar(i + 1));
                                }
                            });
                        };


                        esperarYSaltar();
                    });
                }

                cy.location('origin', { timeout: 60000 }).should('include', 'bilbaokirolak.eus');


                cy.wait(5000);


                cy.screenshot('reserva');


                cy.get('#MainContent_btnVolver').click();




            });
        });
    });
});


function seleccionarFechaPorDia(dia, intento = 0) {
    const diaRegex = new RegExp(`^${dia},`, "i");

    cy.get('[data-id="MainContent_cboFecha"]').should("be.visible").click({ force: true });

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
        return cy.wrap(null);
    } else {
        return cy.wait(300).then(() => esperarHastaLaHora());
    }
}

function esperarHasta2MinutosAntes() {
    const horaActual = new Date();
    const horaObjetivo = new Date(horaActual.getFullYear(), horaActual.getMonth(), horaActual.getDate(), HOUR, 0, 0);
    horaObjetivo.setMinutes(horaObjetivo.getMinutes() - 2);

    if (horaActual >= horaObjetivo) {
        return cy.wrap(null);
    } else {
        return cy.wait(2000).then(() => esperarHasta2MinutosAntes());
    }
}

function intentarSeleccionarCancha(intento = 1) {
    // const ordenCancha = () => {
    //     const canchas = Array.from({ length: 8 }, (_, i) => i + 1); // [1,2,3,...,8]
    //     const sinFavorita = canchas.filter(c => c !== COURT);
    //     return [COURT, ...sinFavorita];
    // };

    const ordenCancha = () => {
        if (FAVORITE_COURT) {
            return [COURT]; // Solo intenta con la cancha favorita
        } else {
            const canchas = Array.from({ length: 8 }, (_, i) => i + 1); // [1,2,3,...,8]
            const sinFavorita = canchas.filter(c => c !== COURT);
            return [COURT, ...sinFavorita]; // Intenta favorita primero, luego las demás
        }
    };

    const lista = ordenCancha();

    cy.get(selectorBuscar).click();

    // Esperar explícitamente a que se cargue la cancha favorita, aunque esté deshabilitada
    const selectorCarga = `#MainContent_rpHoras_a2HorasReserva_0_lstInstalaciones_0_lstHoras_${COURT - 1}_cmdSeleccionarHora_${HOUR - 8}`;

    cy.get('body').find(selectorCarga, { timeout: 10000 }).should('exist').then(() => {
        probarCanchaPorLista(lista, 0, intento);
    });
}

function probarCanchaPorLista(lista, index, intento) {
    if (index >= lista.length) {
        if (intento < 2) {
            cy.log('Ninguna cancha visible, reintentando...');
            intentarSeleccionarCancha(intento + 1);
        } else {
            cy.screenshot(`fallo_seleccion_cancha_intento_${intento}`);
            throw new Error('⚠️ No se pudo seleccionar ninguna cancha visible en los dos intentos.');
        }
        return;
    }

    const court = lista[index];
    const selector = `#MainContent_rpHoras_a2HorasReserva_0_lstInstalaciones_0_lstHoras_${court - 1}_cmdSeleccionarHora_${HOUR - 8}`;

    cy.get('body').then($body => {
        const $el = $body.find(selector);
        if ($el.length > 0 && !$el.hasClass('aspNetDisabled')) {
            cy.get(selector, { timeout: 10000 }).should('be.visible').click({ force: true }).then(() => {
                cy.log(`✅ Cancha ${court} seleccionada`);
            });
        } else {
            probarCanchaPorLista(lista, index + 1, intento);
        }
    });
}

