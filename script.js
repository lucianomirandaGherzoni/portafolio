// ==========================================================================
// Módulo: GestorDatos
// Carga datos.json y renderiza proyectos, tecnologías y formación.
// ==========================================================================
const GestorDatos = (() => {
  const urlDatos = 'datos.json';
  const proyectosIniciales = 4;
  const mostrarBotonProyecto = false;

  let proyectos = [];
  let filtroActivo = 'todos';
  let mostrarTodos = false;

  const escaparHtml = (texto = '') =>
    String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const cargarDatos = async () => {
    try {
      const respuesta = await fetch(urlDatos);
      if (!respuesta.ok) throw new Error(`${respuesta.status} ${respuesta.statusText}`);
      return await respuesta.json();
    } catch (error) {
      console.error('Error al obtener los datos:', error);
      return { proyectos: [], stack: [], estudios: [] };
    }
  };

  const crearItemProyecto = (proyecto) => {
    const articulo = document.createElement('article');
    articulo.className = 'item-trabajo';

    const etiquetas = proyecto.tecnologias
      .map((tech) => `<li class="etiqueta-tecnologia">${escaparHtml(tech)}</li>`)
      .join('');

    const botonProyecto = mostrarBotonProyecto && proyecto.url
      ? `<a href="${escaparHtml(proyecto.url)}" class="boton boton-secundario boton-proyecto" target="_blank" rel="noopener noreferrer">Ver proyecto ↗</a>`
      : '';

    articulo.innerHTML = `
      <p class="año-trabajo">${escaparHtml(proyecto.año)}</p>
      <div class="detalles-trabajo">
        <div class="grupo-titulo-trabajo">
          <h3 class="rol-trabajo">${escaparHtml(proyecto.nombre)}</h3>
          <p class="empresa-trabajo">${escaparHtml(proyecto.categoria)}</p>
        </div>
        <p class="descripcion-trabajo">${escaparHtml(proyecto.descripcion)}</p>
        <ul class="tecnologias-trabajo" aria-label="Tecnologías">${etiquetas}</ul>
        ${botonProyecto}
      </div>
    `;
    return articulo;
  };

  const renderizarProyectos = () => {
    const lista = document.getElementById('listaProyectos');
    const botonVerMas = document.getElementById('botonVerMas');
    if (!lista) return;

    // sort es estable: dentro de un mismo año se respeta el orden de datos.json
    const filtrados = proyectos
      .filter((p) => filtroActivo === 'todos' || p.tipo === filtroActivo)
      .sort((a, b) => Number(b.año) - Number(a.año));

    const visibles = mostrarTodos ? filtrados : filtrados.slice(0, proyectosIniciales);

    lista.innerHTML = '';
    if (filtrados.length === 0) {
      lista.innerHTML = '<p class="texto-vacio">No hay proyectos en esta categoría.</p>';
    }
    visibles.forEach((p) => lista.appendChild(crearItemProyecto(p)));

    if (botonVerMas) {
      const restantes = Math.max(0, filtrados.length - proyectosIniciales);
      botonVerMas.hidden = restantes <= 0;
      botonVerMas.textContent = mostrarTodos ? 'Ver menos' : `Ver ${restantes} proyectos más`;
      botonVerMas.setAttribute('aria-expanded', String(mostrarTodos));
    }
  };

  const inicializarControlesProyectos = () => {
    const contenedorFiltros = document.getElementById('filtrosProyectos');
    const botonVerMas = document.getElementById('botonVerMas');

    contenedorFiltros?.addEventListener('click', (e) => {
      const boton = e.target.closest('.boton-filtro');
      if (!boton) return;

      contenedorFiltros.querySelectorAll('.boton-filtro').forEach((btn) => {
        const activo = btn === boton;
        btn.classList.toggle('activo', activo);
        btn.setAttribute('aria-pressed', String(activo));
      });

      filtroActivo = boton.dataset.filtro;
      mostrarTodos = false;
      renderizarProyectos();
    });

    botonVerMas?.addEventListener('click', () => {
      const estabaExpandido = mostrarTodos;
      mostrarTodos = !mostrarTodos;
      renderizarProyectos();
      if (estabaExpandido) {
        document.getElementById('trabajo').scrollIntoView({ behavior: 'smooth' });
      }
    });
  };

  const renderizarStack = (grupos) => {
    const contenedor = document.getElementById('gridStack');
    if (!contenedor) return;

    contenedor.innerHTML = grupos.map((g) => `
      <div class="fila-stack">
        <h3 class="titulo-grupo-stack">${escaparHtml(g.grupo)}</h3>
        <ul class="lista-stack">
          ${g.items.map((item) => `<li>${escaparHtml(item)}</li>`).join('')}
        </ul>
      </div>
    `).join('');
  };

  const renderizarEstudios = (estudios) => {
    const lista = document.getElementById('listaEstudios');
    if (!lista) return;

    lista.innerHTML = estudios.map((e) => `
      <article class="item-estudio">
        <div class="item-estudio-meta">
          <span>${escaparHtml(e.institucion)}</span>
          <span>${escaparHtml(e.periodo)}</span>
        </div>
        <h3 class="item-estudio-titulo">${escaparHtml(e.titulo)}</h3>
        <p class="item-estudio-descripcion">${escaparHtml(e.descripcion)}</p>
      </article>
    `).join('');
  };

  const init = async () => {
    const datos = await cargarDatos();
    proyectos = datos.proyectos || [];

    renderizarProyectos();
    renderizarStack(datos.stack || []);
    renderizarEstudios(datos.estudios || []);
    inicializarControlesProyectos();
  };

  return { init };
})();

// ==========================================================================
// Módulo: GestorMenu
// Menú a pantalla completa; marca la sección en la que está el usuario.
// ==========================================================================
const GestorMenu = (() => {
  const boton = document.getElementById('botonMenu');
  const menu = document.getElementById('menuNavegacion');
  const idsSecciones = ['introduccion', 'trabajo', 'acerca', 'tecnologias', 'estudios', 'contacto'];
  const fondoInerte = ['contenido', 'botonWhatsappFlotante'].map((id) => document.getElementById(id));

  const marcarSeccionActiva = () => {
    const secciones = idsSecciones.map((id) => document.getElementById(id)).filter(Boolean);
    const linea = window.innerHeight * 0.4;
    let activa = null;

    secciones.forEach((seccion) => {
      if (seccion.getBoundingClientRect().top <= linea) activa = seccion.id;
    });
    const alFinal = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
    if (alFinal && secciones.length) activa = secciones[secciones.length - 1].id;

    menu.querySelectorAll('.enlace-nav[href^="#"]').forEach((enlace) => {
      if (enlace.hash.slice(1) === activa) enlace.setAttribute('aria-current', 'location');
      else enlace.removeAttribute('aria-current');
    });
    menu.classList.toggle('con-activa', Boolean(activa));
  };

  const cambiarEstado = (abrir) => {
    if (abrir) marcarSeccionActiva();
    boton.setAttribute('aria-expanded', String(abrir));
    boton.setAttribute('aria-label', abrir ? 'Cerrar menú' : 'Abrir menú');
    menu.classList.toggle('abierto', abrir);
    document.documentElement.classList.toggle('menu-abierto', abrir);
    fondoInerte.forEach((el) => { if (el) el.inert = abrir; });
  };

  const init = () => {
    if (!boton || !menu) return;

    boton.addEventListener('click', () => {
      cambiarEstado(boton.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', (e) => {
      if (e.target.closest('a')) cambiarEstado(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('abierto')) {
        cambiarEstado(false);
        boton.focus();
      }
    });
  };

  return { init };
})();

// ==========================================================================
// Módulo: GestorScroll
// Animación de entrada de secciones y botón flotante de WhatsApp.
// ==========================================================================
const GestorScroll = (() => {
  const init = () => {
    const observadorSecciones = new IntersectionObserver((entradas, observador) => {
      entradas.forEach((entrada) => {
        if (entrada.isIntersecting) {
          entrada.target.classList.add('visible');
          observador.unobserve(entrada.target);
        }
      });
    }, { threshold: 0.05 });

    document.querySelectorAll('.revelable').forEach((s) => observadorSecciones.observe(s));

    const hero = document.getElementById('introduccion');
    const botonFlotante = document.getElementById('botonWhatsappFlotante');
    if (hero && botonFlotante) {
      new IntersectionObserver(([entrada]) => {
        botonFlotante.classList.toggle('visible', !entrada.isIntersecting);
      }).observe(hero);
    }
  };

  return { init };
})();

document.addEventListener('DOMContentLoaded', () => {
  GestorMenu.init();
  GestorScroll.init();
  GestorDatos.init();
});
