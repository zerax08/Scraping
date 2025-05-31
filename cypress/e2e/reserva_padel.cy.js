describe('Login automatizado en Bilbao Kirolak', () => {
  it('Cambia idioma, accede al login e inicia sesión', () => {
    cy.visit('https://bilbaokirolak.eus/virtual/site/instalaciones/', {
      failOnStatusCode: false,
    })

    cy.wait(2000)

    // Quitar modal si aparece
    cy.window().then(win => {
      win.document.querySelector('#bccs-buttonAgree')?.click()
      win.document.querySelector('.modal-backdrop')?.remove()
      win.document.querySelector('.modal')?.remove()
      win.document.body.style.overflow = 'auto'
    })

    // Cambiar idioma a castellano
    cy.get('#ucMenuCabecera_lnkCastellano').click()

    // Ir al login
    cy.get('#ucMenuCabecera_hlIdentificar').click()

    // Asegurar que cargó el login en español
    cy.contains('Acceso mediante usuario').should('be.visible')

    // Escribir credenciales (¡usa las tuyas reales si tienes!)
    cy.get('#MainContent_txtCodigoP_txtA2TextBox').type('Y8838810Q') // sustituye por tu NIF/código
    // cy.get('#MainContent_txtPasswordP_txtA2TextBox').type('KiraJossiane17*') // sustituye por tu contraseña
    cy.get('#MainContent_txtPasswordP_txtA2TextBox')
      .should('be.visible')
      .click({ force: true })  // enfocar primero
      .type('KiraJossiane17*', { delay: 50, force: true })


    // Clic en botón de login
    cy.get('#MainContent_btnLoginP').click()

    cy.url().should('include', '/virtual/site/instalaciones')

    // Click en "NUEVA RESERVA"
    cy.get('#MainContent_ucMenuIndex_repMenu_hlRepMenu_0')
      .should('be.visible')
      .click()


    cy.get('[data-id="MainContent_cboFilialesInsta"]').click()

    // Selecciona la opción por su texto
    cy.get('.dropdown-menu.show .inner')
      .contains('SAN IGNACIO')
      .click()

    // Esperar a que el select de grupos se actualice
    cy.get('#MainContent_cboGrupos', { timeout: 10000 })
      .should('contain.text', 'PADEL CUBIERTO')  // Verificamos que ya esté en el select HTML

    // Abrir dropdown visual de grupos
    cy.get('[data-id="MainContent_cboGrupos"]').click()

    // Esperar a que aparezca el menú visual con PADEL CUBIERTO
    cy.get('.dropdown-menu.show .inner', { timeout: 10000 })
      .contains('PADEL CUBIERTO')
      .click()




    seleccionarFechaPorDia('lunes')



    // cy.get('[data-id="MainContent_cboFecha"]').click({ force: true })

    // === Clic en BUSCAR ===
    cy.get('#MainContent_btnBuscar').click()


    cy.get('#MainContent_rpHoras_a2HorasReserva_0_lstInstalaciones_0_lstHoras_0_cmdSeleccionarHora_9')
      .should('be.visible')
      .click()


    // 2. Esperar a que cargue la siguiente pantalla (usamos el radio como referencia)
    cy.get('#MainContent_ucFormasPago_rbtTarjeta', { timeout: 10000 })
      .should('exist')

    // 3. Selecciona Tarjeta de crédito
    cy.get('#MainContent_ucFormasPago_rbtTarjeta')
      .check({ force: true })

    // 4. Acepta las condiciones
    cy.get('#MainContent_chkCondiciones')
      .check({ force: true })

    // 5. Espera a que el botón "Reservar" esté habilitado y haz clic
    cy.get('#MainContent_btnConfirmar', { timeout: 10000 })
      .should('not.be.disabled')
      .click({ force: true })

  })






})

function seleccionarFechaPorDia(dia, intento = 0) {
  const diaRegex = new RegExp(`^${dia},`, 'i')

  // Asegurarse de que el botón visual esté visible antes del click
  cy.get('[data-id="MainContent_cboFecha"]')
    .should('be.visible')
    .click({ force: true })

  // Esperar a que se abra el dropdown y tenga opciones
  cy.get('.dropdown-menu.show .inner a', { timeout: 8000 })
    .should('have.length.at.least', 1)
    .then($opciones => {
      const opcion = [...$opciones].find(el => el.innerText.trim().match(diaRegex))
      if (opcion) {
        cy.wrap(opcion).click({ force: true })

        // Verificar visualmente si se seleccionó
        cy.get('[data-id="MainContent_cboFecha"] .filter-option-inner-inner', { timeout: 5000 })
          .invoke('text')
          .then(texto => {
            if (!texto.trim().startsWith(dia)) {
              if (intento < 2) {
                cy.wait(700)
                seleccionarFechaPorDia(dia, intento + 1)
              } else {
                throw new Error(`No se pudo seleccionar una fecha que empiece con ${dia} después de 3 intentos`)
              }
            }
          })
      } else {
        throw new Error(`No se encontró ninguna opción que empiece con "${dia}"`)
      }
    })

}

