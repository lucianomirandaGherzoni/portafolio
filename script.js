// Variable global para almacenar los proyectos originales una vez cargados
let proyectosOriginales = [];

// ==========================================================================
// Módulo: GestorDatos
// Carga y renderiza el contenido dinámico desde el JSON.
// ==========================================================================
const GestorDatos = (() => {
  const urlDatos = 'datos.json'; 

  // Mapeo de IDs del DOM para inyección de datos
  const mapeoUsuario = {
    'nombre-usuario': (data) => data.nombre,
    'apellido-usuario': (data) => data.apellido,
    'titulo-web': (data) => `${data.nombre} ${data.apellido} - ${data.titulo}`,
    'descripcion-corta': (data) => data.descripcionCorta.replace('Frontend Developer', data.titulo),
    'estado-trabajo': (data) => data.estado,
    'ubicacion-usuario': (data) => data.ubicacion,
    'rol-actual': (data) => data.actividadActual.rol,
    'empresa-actual': (data) => `@ ${data.actividadActual.empresa}`,
    'periodo-actual': (data) => data.actividadActual.periodo,
    'texto-email': (data) => data.contactoEmail,
    'enlace-email': (data) => {
        const elemento = document.querySelector(`[data-id="enlace-email"]`);
        if (elemento) elemento.href = `mailto:${data.contactoEmail}`;
    }
  };

  /**
   * Carga el archivo JSON
   */
  const cargarDatos = async () => {
    try {
      const respuesta = await fetch(urlDatos);
      if (!respuesta.ok) {
        throw new Error(`Error al cargar ${urlDatos}: ${respuesta.statusText}`);
      }
      return await respuesta.json();
    } catch (error) {
      console.error("Error al obtener los datos:", error);
      return { usuario: {}, proyectos: [], estudios: [] }; 
    }
  };

  /**
   * Renderiza los detalles del usuario.
   */
  const renderizarUsuario = (datosUsuario) => {
    Object.keys(mapeoUsuario).forEach(id => {
      const elemento = document.querySelector(`[data-id="${id}"]`);
      if (elemento) {
        const valor = mapeoUsuario[id](datosUsuario);
        if (typeof valor === 'string') {
           elemento.textContent = valor;
        }
      }
    });

    document.title = mapeoUsuario['titulo-web'](datosUsuario);
  };

  /**
   * Renderiza las etiquetas de habilidades en la barra lateral.
   */
  const renderizarHabilidadesBarraLateral = (habilidades) => {
    const contenedor = document.getElementById('contenedorHabilidades');
    if (contenedor) {
      contenedor.innerHTML = '';
      habilidades.forEach(habilidad => {
        const span = document.createElement('span');
        span.classList.add('etiqueta-habilidad');
        span.textContent = habilidad;
        contenedor.appendChild(span);
      });
    }
  };

  /**
   * Renderiza el carrusel de tecnologías (duplica el contenido para el scroll infinito).
   */
  const renderizarCarrusel = (habilidades) => {
    const pista = document.getElementById('carruselTecnologias');
    if (!pista) return;

    pista.innerHTML = ''; 

    // Función para crear un elemento de tecnología con ícono placeholder
    const crearTarjetaTecnologia = (habilidad) => {
        const div = document.createElement('div');
        div.classList.add('tarjeta-tecnologia');
        div.innerHTML = `
            ${habilidad}
        `;
        return div;
    };
    
    // Duplicar el contenido para el efecto de scroll infinito
    habilidades.forEach(habilidad => pista.appendChild(crearTarjetaTecnologia(habilidad)));
    habilidades.forEach(habilidad => pista.appendChild(crearTarjetaTecnologia(habilidad)));
  };


  let paginaActual = 1;
  const proyectosPorPagina = 3;

  /**
   * Renderiza la lista de proyectos, aplicando un filtro opcional.
   */
  const renderizarProyectos = (proyectos, filtroActivo = 'todos', pagina = 1) => {
    const lista = document.getElementById('listaProyectos');
    if (!lista) return;

    paginaActual = pagina;
    lista.innerHTML = ''; 

    const proyectosFiltrados = proyectos.filter(proyecto => 
        filtroActivo === 'todos' || proyecto.tipo === filtroActivo
    );

    // Ordenar por año (de más nuevo a más antiguo)
    proyectosFiltrados.sort((a, b) => parseInt(b.año) - parseInt(a.año));

    if (proyectosFiltrados.length === 0) {
         lista.innerHTML = `<p class="texto-descripcion" style="text-align: center; padding: 2rem 0;">No se encontraron proyectos del tipo "${filtroActivo}".</p>`;
         renderizarPaginacion(0, filtroActivo);
         return;
    }

    // Calcular índices para la paginación
    const inicio = (pagina - 1) * proyectosPorPagina;
    const fin = inicio + proyectosPorPagina;
    const proyectosPagina = proyectosFiltrados.slice(inicio, fin);

    proyectosPagina.forEach(proyecto => {
      const divItem = document.createElement('div');
      divItem.classList.add('item-trabajo');
      divItem.setAttribute('data-tipo', proyecto.tipo);

      const etiquetasTech = proyecto.tecnologias.map(tech => 
        `<span class="etiqueta-tecnologia">${tech}</span>`
      ).join('');

      const botonProyecto = proyecto.url ? 
        `<a href="${proyecto.url}" class="boton-proyecto" target="_blank" rel="noopener noreferrer">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
          </svg>
          Ver proyecto
        </a>` : '';

      divItem.innerHTML = `
        <div class="año-trabajo">${proyecto.año}</div>
        <div class="detalles-trabajo">
          <div class="grupo-titulo-trabajo">
            <h3 class="rol-trabajo">${proyecto.rol}</h3>
            <div class="empresa-trabajo">${proyecto.empresa}</div>
          </div>
          <p class="descripcion-trabajo">${proyecto.descripcion}</p>
          ${botonProyecto}
        </div>
        <div class="tecnologias-trabajo">${etiquetasTech}</div>
      `;

      lista.appendChild(divItem);
    });

    // Renderizar la paginación
    renderizarPaginacion(proyectosFiltrados.length, filtroActivo);
  };

  /**
   * Renderiza los controles de paginación.
   */
  const renderizarPaginacion = (totalProyectos, filtroActivo) => {
    const contenedor = document.getElementById('paginacionProyectos');
    if (!contenedor) return;

    const totalPaginas = Math.ceil(totalProyectos / proyectosPorPagina);

    if (totalPaginas <= 1) {
      contenedor.innerHTML = '';
      return;
    }

    let html = '<div class="controles-paginacion">';

    // Botón anterior
    if (paginaActual > 1) {
      html += `<button class="boton-pagina" data-pagina="${paginaActual - 1}" data-filtro="${filtroActivo}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>`;
    }

    // Números de página
    for (let i = 1; i <= totalPaginas; i++) {
      html += `<button class="boton-pagina ${i === paginaActual ? 'activo' : ''}" data-pagina="${i}" data-filtro="${filtroActivo}">${i}</button>`;
    }

    // Botón siguiente
    if (paginaActual < totalPaginas) {
      html += `<button class="boton-pagina" data-pagina="${paginaActual + 1}" data-filtro="${filtroActivo}">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" width="20" height="20">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
        </svg>
      </button>`;
    }

    html += '</div>';
    contenedor.innerHTML = html;

    // Agregar event listeners
    contenedor.querySelectorAll('.boton-pagina').forEach(boton => {
      boton.addEventListener('click', () => {
        const pagina = parseInt(boton.dataset.pagina);
        const filtro = boton.dataset.filtro;
        renderizarProyectos(proyectosOriginales, filtro, pagina);
        window.scrollTo({ top: document.getElementById('trabajo').offsetTop - 80, behavior: 'smooth' });
      });
    });
  };

  /**
   * Renderiza la lista de Estudios/Cursos.
   */
  const renderizarEstudios = (estudios) => {
      const lista = document.getElementById('listaEstudios');
      if (!lista) return;

      lista.innerHTML = '';

      estudios.forEach(estudio => {
          const divItem = document.createElement('div');
          divItem.classList.add('item-estudio');
          divItem.innerHTML = `
            <div class="item-estudio-meta">
                <span>${estudio.institucion}</span>
                <span>${estudio.periodo}</span>
            </div>
            <h3 class="item-estudio-titulo">${estudio.titulo}</h3>
            <p class="item-estudio-descripcion">${estudio.descripcion}</p>
          `;
          lista.appendChild(divItem);
      });
  };

  /**
   * Inicializa los listeners para los botones de filtro.
   */
  const inicializarFiltros = () => {
      const contenedorFiltros = document.getElementById('filtrosProyectos');
      if (!contenedorFiltros) return;

      contenedorFiltros.addEventListener('click', (e) => {
          const boton = e.target.closest('.boton-filtro');
          if (boton) {
              const filtro = boton.dataset.filtro;
              
              // Actualiza el estado activo de los botones
              contenedorFiltros.querySelectorAll('.boton-filtro').forEach(btn => {
                  btn.classList.remove('activo');
              });
              boton.classList.add('activo');

              // Renderiza los proyectos con el filtro aplicado (reiniciando a página 1)
              renderizarProyectos(proyectosOriginales, filtro, 1);
          }
      });
  };


  /**
   * Punto de entrada del módulo de datos.
   */
  const init = async () => {
    const datos = await cargarDatos();
    const habilidades = datos.usuario.enfoqueHabilidades || [];
    
    // Almacena la lista completa de proyectos para el filtrado
    proyectosOriginales = datos.proyectos || [];

    renderizarUsuario(datos.usuario);
    renderizarHabilidadesBarraLateral(habilidades);
    renderizarCarrusel(habilidades); 
    renderizarProyectos(proyectosOriginales, 'todos'); // Renderizado inicial
    renderizarEstudios(datos.estudios || []);

    inicializarFiltros(); // Inicializa los listeners de filtros
  };

  return { init };
})();

// ==========================================================================
// Módulo: GestorTema
// Maneja el alternado entre modo claro y oscuro.
// ==========================================================================
const GestorTema = (() => {
    const html = document.documentElement;
    const alternarTema = document.getElementById('alternarTema'); 
    const iconoSol = document.getElementById('iconoSol');
    const iconoLuna = document.getElementById('iconoLuna');
    
    let esOscuro = html.classList.contains('oscuro'); 

    const actualizarIconos = () => {
      if (esOscuro) {
        iconoSol.style.display = 'none';
        iconoLuna.style.display = 'block';
      } else {
        iconoSol.style.display = 'block';
        iconoLuna.style.display = 'none';
      }
    };

    const alternarTemaOscuro = () => {
      esOscuro = !esOscuro;
      html.classList.toggle('oscuro', esOscuro);
      actualizarIconos();
    };

    const init = () => {
      actualizarIconos();
      if (alternarTema) {
         alternarTema.addEventListener('click', alternarTemaOscuro);
      }
    };

    return { init, actualizarIconos };
  })();

// ==========================================================================
// Módulo: GestorAnimacionScroll
// Controla la animación de entrada de las secciones.
// ==========================================================================
const GestorAnimacionScroll = (() => {
  const secciones = document.querySelectorAll('section');
  
  const opcionesObservador = {
    threshold: 0.05,
    rootMargin: '0px 0px 0px 0px' 
  };

  const retrollamadaObservador = (entradas) => {
    entradas.forEach(entrada => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('animar-aparecer'); 
      }
    });
  };

  const init = () => {
    const observador = new IntersectionObserver(retrollamadaObservador, opcionesObservador);
    secciones.forEach(seccion => observador.observe(seccion));
  };

  return { init };
})();

// ==========================================================================
// Inicialización de la Aplicación
// ==========================================================================
const Aplicacion = (() => {
  const init = async () => {
    // 1. Cargar y renderizar datos (primero)
    await GestorDatos.init(); 
    
    // 2. Inicializar funcionalidades de interfaz (después de cargar datos)
    GestorTema.init();
    GestorAnimacionScroll.init();
  };

  return { init };
})();

// Iniciar la aplicación al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  Aplicacion.init();
});