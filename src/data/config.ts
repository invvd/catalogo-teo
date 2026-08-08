// Configuración general del catálogo. Reemplazá los valores marcados con TODO.
export const siteConfig = {
  storeName: "TODO Nombre de la tienda",

  // Número en formato internacional, solo dígitos (sin +, espacios ni guiones).
  // Ejemplo Argentina: 549 + código de área sin 0 + número sin 15 → "5491122334455"
  whatsappNumber: "TODO_NUMERO_WHATSAPP",

  social: {
    instagram: "", // TODO ej: "https://instagram.com/tu_usuario"
    facebook: "", // TODO (opcional, dejar vacío para ocultar el ícono)
    tiktok: "", // TODO (opcional, dejar vacío para ocultar el ícono)
  },

  developer: {
    name: "TODO Nombre del desarrollador",
    url: "", // TODO (opcional, link a portfolio/instagram del developer)
  },
};

export function buildWhatsAppLink(productName: string) {
  const message = `Hola! Quiero consultar por: ${productName}`;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}
