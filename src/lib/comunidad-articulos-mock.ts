/**
 * Datos de demostración para la sección Comunidad (feed estilo Medium).
 * Enfoque: liderazgo cristiano en la iglesia local — no solo estudios bíblicos genéricos.
 */

/** Temas principales visibles en cada publicación. */
export const CATEGORIAS_LIDERAZGO = [
  "Liderazgo",
  "Discipulado",
  "Apoyo a líderes",
  "Guiar personas",
] as const;

export type CategoriaLiderazgo = (typeof CATEGORIAS_LIDERAZGO)[number];

export type ArticuloComunidadMock = {
  id: string;
  /** Eje del contenido: liderazgo, discipulado, apoyo entre líderes o pastoreo de personas. */
  categoria: CategoriaLiderazgo;
  titulo: string;
  excerpt: string;
  /** Párrafos separados por líneas en blanco (\n\n). */
  contenido: string;
  autor: string;
  fechaRelativa: string;
  /** Etiquetas secundarias (ángulo concreto dentro de la categoría). */
  etiquetas: string[];
  tiempoLecturaMin: number;
  likes: number;
  comentarios: number;
};

export const ARTICULOS_COMUNIDAD_MOCK: ArticuloComunidadMock[] = [
  {
    id: "art-1",
    categoria: "Liderazgo",
    titulo: "Fe que se ve: Santiago 2,14–26 en la vida de la iglesia local",
    excerpt:
      "La fe sin obras está muerta: no es un slogan para culpar a otros, sino un espejo para nuestras reuniones, nuestras visitas y cómo tratamos al que está al margen. Tres preguntas para líderes que quieren que su doctrina se traduzca en compasión visible.",
    contenido: `Santiago no está armando una competencia de “quién es más espiritual”. Está describiendo una fe que se parece a Jesús: concreta, cercana, dispuesta al costo. Cuando leemos 2,14–26 en voz alta en el equipo de líderes, el texto nos interpela primero a nosotros, no al “otro grupo”.

La fe sin obras está muerta: no es un slogan para culpar a otros, sino un espejo para nuestras reuniones, nuestras visitas y cómo tratamos al que está al margen. ¿Hay alguien en nuestra lista que lleva semanas sin una llamada? ¿Algún visitante del que solo recordamos el nombre? El pasaje nos invita a que la respuesta no sea teoría sino cuidado.

Propongo tres preguntas prácticas para evaluar si nuestra doctrina se traduce en compasión visible. Primera: ¿hay evidencia de misericordia en nuestras agendas esta semana? Segunda: ¿estamos dispuestos a ajustar comodidad por el bien de alguien frágil? Tercera: ¿nuestro lenguaje sobre “gracia” se acompaña de pasos concretos?

Cerramos leyendo el versículo 26 como oración: que la fe que confesamos sea animada por el mismo Dios que justificó a Abraham y recibió a Rahab. Que nuestras iglesias locales — Bernabé incluida — sean lugares donde el evangelio se vea en pan compartido, tiempo dado y verdad dicha con ternura.`,
    autor: "Pastor Carlos Mendoza",
    fechaRelativa: "Hace 2 días",
    etiquetas: ["Integridad", "Modelo ante el grupo"],
    tiempoLecturaMin: 8,
    likes: 124,
    comentarios: 18,
  },
  {
    id: "art-2",
    categoria: "Apoyo a líderes",
    titulo: "Orar con las Escrituras: un método sencillo para líderes ocupados",
    excerpt:
      "Cuidar tu vida con Dios no compite con pastorear: la alimenta. Un ritmo de 15 minutos para quien dirige grupos y no quiere quemarse ni vivir en culpa espiritual.",
    contenido: `No necesitas una hora libre para cultivar intimidad con Dios. Muchos líderes cargamos culpa por no “llegar” a un devocional perfecto; la gracia nos recuerda que el Padre nos recibe en lo real, no en lo idealizado.

Aquí va un esquema de quince minutos: lectura lenta de un pasaje corto, una pregunta que te deje mirar tu semana a la luz del texto, dos o tres minutos de silencio, y una oración breve que devuelve la palabra al corazón — confesión, petición, gratitud.

Ejemplo con el Salmo 23: léelo en voz baja. Pregunta: ¿dónde sentís hoy “valle de sombra de muerte”? No para dramatizar, sino para nombrar. Deja que el Señor sea pastor en ese lugar concreto. Cierra con una frase de entrega. Mañana repetís el ritmo; la constancia humilde vence al heroísmo esporádico.`,
    autor: "Ana García",
    fechaRelativa: "Hace 3 días",
    etiquetas: ["Vida devocional", "Sostenibilidad"],
    tiempoLecturaMin: 6,
    likes: 89,
    comentarios: 12,
  },
  {
    id: "art-3",
    categoria: "Discipulado",
    titulo: "Por qué la gracia no es permiso para el conformismo",
    excerpt:
      "Tito 2,11–14 nos recuerda que la gracia educa. Para quienes acompañan crecimiento en el grupo: cómo sostener verdad y ternura en mentorías y conversaciones incómodas.",
    contenido: `Tito 2,11–14 nos recuerda que la gracia de Dios ha aparecido para educarnos a vivir sobria, justa y piadosamente en el presente. Eso no compite con la justificación por fe; la ordena hacia una vida que honra al Maestro.

La diferencia entre descansar en Cristo y usar la libertad como excusa es el fruto del Espíritu. Donde hay seguridad en el evangelio, aparece disciplina amorosa, no cinismo espiritual.

En mentorías y conversaciones difíciles, podemos decir con claridad: el amor de Dios no nos deja cómodos en el pecado; nos sostiene mientras nos arrepentimos. Esa tensión sana — gracia y santidad — es lo que el grupo pequeño puede modelar con honestidad y ternura.`,
    autor: "Andrés Martínez",
    fechaRelativa: "Hace 5 días",
    etiquetas: ["Mentoría", "Conversaciones difíciles"],
    tiempoLecturaMin: 10,
    likes: 156,
    comentarios: 24,
  },
  {
    id: "art-4",
    categoria: "Guiar personas",
    titulo: "El evangelio y el trabajo: dignidad más allá del cargo",
    excerpt:
      "Cómo animar desde el liderazgo a hermanos que sienten que su oficio 'no sirve' al Reino, y orar por ellos en la reunión de equipos.",
    contenido: `Colosenses 3,23–24 no es solo para el púlpito: “todo lo que hagáis, hacedlo de corazón, como para el Señor”. Muchos hermanos sienten que su trabajo “no importa” para el Reino si no es visible en el templo.

Podemos animarlos recordando que Jesús honró oficios comunes y que servir bien es forma de adoración. En la reunión de líderes, oremos por empleos específicos — jornadas largas, jefes difíciles, incertidumbre económica — y celebremos historias donde la fidelidad cotidiana abrió puerta al testimonio.

La dignidad no viene del título sino del Señor a quien servimos; eso cambia el lunes, no solo el domingo.`,
    autor: "María Rodríguez",
    fechaRelativa: "Hace 1 semana",
    etiquetas: ["Pastoral laboral", "Cuidado del rebaño"],
    tiempoLecturaMin: 7,
    likes: 67,
    comentarios: 9,
  },
  {
    id: "art-5",
    categoria: "Guiar personas",
    titulo: "Escuchar antes de corregir: lecciones de Proverbios 18,13",
    excerpt:
      "En el liderazgo pastoral, la prisa por dar respuesta puede dañar confianzas. Protocolo breve para conversaciones de seguimiento: escuchar, repetir, preguntar, y recién entonces orientar.",
    contenido: `“El que responde antes de escuchar, es necedad y vergüenza” (Proverbios 18,13). En pastoral, la prisa por “cerrar” la conversación con una frase piadosa puede romper confianza.

Un protocolo breve: escuchar sin interrumpir; repetir en tus palabras lo que entendiste; preguntar qué esperan o temen; recién entonces orientar con la Escritura y con límites claros. No es lentitud por inseguridad, sino respeto por la imago Dei en la otra persona.

En seguimiento a visitantes o crisis en el grupo, este ritmo baja la defensiva y abre espacio para el Espíritu. La corrección, cuando llega, suena a cuidado, no a control.`,
    autor: "Pastor Carlos Mendoza",
    fechaRelativa: "Hace 1 semana",
    etiquetas: ["Escucha activa", "Seguimiento"],
    tiempoLecturaMin: 5,
    likes: 203,
    comentarios: 31,
  },
  {
    id: "art-6",
    categoria: "Liderazgo",
    titulo: "Unidad sin uniformidad: Efesios 4 en grupos pequeños",
    excerpt:
      "Dirigir un grupo que mezcla temperamentos: vocabulario para celebrar dones distintos sin fragmentar el cuerpo de Cristo.",
    contenido: `Efesios 4 nos regala un vocabulario para la diversidad: un solo cuerpo, muchos miembros, dones para edificación. En grupos pequeños, las tensiones suelen venir de ritmos distintos — el extrovertido que habla mucho, el reflexivo que necesita tiempo.

Podemos enseñar a celebrar diferencias sin anularlas: acuerdos de conversación, turnos, espacio para silencio. La unidad no es clones pensando igual; es amor activo que sujeta la comunión cuando la incomodidad aparece.

Cuando el evangelio es centro, la uniformidad deja de ser ídolo y la diversidad se vuelve fuerza para anunciar a Cristo en barrios y oficios distintos.`,
    autor: "Carlos y María Rodríguez",
    fechaRelativa: "Hace 2 semanas",
    etiquetas: ["Equipos", "Dones y roles"],
    tiempoLecturaMin: 9,
    likes: 74,
    comentarios: 11,
  },
  {
    id: "art-7",
    categoria: "Apoyo a líderes",
    titulo: "Cuando el desánimo visita al líder: un texto para guardar en el teléfono",
    excerpt:
      "Isaías 40,28–31 como ancla. Para quienes cargan reuniones, visitas y expectativas: recordar quién sostiene lo que no podés sostener solo.",
    contenido: `Isaías 40,28–31 no es autoayuda; es ancla. ¿No has sabido? ¿No has oído que Jehová es el Dios eterno? Los que esperan a Jehová tendrán nuevas fuerzas.

Antes de una reunión pesada o después de un domingo donde sentís que “no pasó nada”, leélo en voz alta. Dejad que la promesa sea más fuerte que el diagnóstico interno de fracaso. El desánimo del líder no te descalifica; te coloca frente a la gracia otra vez.

Guardá este pasaje en el teléfono. No para esquivar el descanso físico que quizá necesitás, sino para recordar quién sostiene lo que no podés sostener solo.`,
    autor: "Ana García",
    fechaRelativa: "Hace 2 semanas",
    etiquetas: ["Salud emocional", "Descanso en Cristo"],
    tiempoLecturaMin: 4,
    likes: 312,
    comentarios: 42,
  },
];

export const TEMAS_COMUNIDAD_MOCK = [
  { etiqueta: "Liderazgo", count: 28 },
  { etiqueta: "Discipulado", count: 22 },
  { etiqueta: "Apoyo a líderes", count: 19 },
  { etiqueta: "Guiar personas", count: 24 },
] as const;

export function getArticuloComunidadById(id: string): ArticuloComunidadMock | undefined {
  return ARTICULOS_COMUNIDAD_MOCK.find((a) => a.id === id);
}

/** Otros artículos para el lateral del detalle (excluye el actual). */
export function getArticulosRecomendados(excludeId: string, limit = 3): ArticuloComunidadMock[] {
  return ARTICULOS_COMUNIDAD_MOCK.filter((a) => a.id !== excludeId).slice(0, limit);
}
